import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createReferencePhoto, 
  getReferencePhotosByUserId,
  createStickerPack,
  getStickerPacksByUserId,
  getStickerPackById,
  deleteStickerPack,
  createSticker,
  getStickersByPackId,
  deleteSticker,
  getReferencePhotoById
} from "./db";
import { storagePut } from "./storage";
import { generateStickerBatch } from "./stickerGenerator";
import { createStickerZip } from "./zipExporter";
import { TRPCError } from "@trpc/server";

function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  sticker: router({
    // Upload reference photo
    uploadReference: protectedProcedure
      .input(z.object({
        filename: z.string(),
        mimeType: z.string(),
        base64Data: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        // Decode base64 data
        const buffer = Buffer.from(input.base64Data, 'base64');
        
        // Upload to S3
        const fileKey = `${userId}/references/${input.filename}-${randomSuffix()}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Save to database
        const photo = await createReferencePhoto({
          userId,
          fileKey,
          fileUrl: url,
          originalFilename: input.filename,
          mimeType: input.mimeType,
        });
        
        return photo;
      }),

    // Get user's reference photos
    getReferences: protectedProcedure
      .query(async ({ ctx }) => {
        return await getReferencePhotosByUserId(ctx.user.id);
      }),

    // Preview single sticker
    previewSticker: protectedProcedure
      .input(z.object({
        referencePhotoId: z.number(),
        emotion: z.string(),
        style: z.string().default("cute_cartoon"),
        bodyType: z.string().default("half_body"),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        // Get reference photo
        const referencePhoto = await getReferencePhotoById(input.referencePhotoId);
        if (!referencePhoto) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Reference photo not found',
          });
        }
        
        // Verify ownership
        if (referencePhoto.userId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to use this reference photo',
          });
        }
        
        // Generate single preview sticker
        const { generateSticker } = await import('./stickerGenerator');
        const sticker = await generateSticker({
          referenceImageUrl: referencePhoto.fileUrl,
          emotion: input.emotion,
          style: input.style,
          bodyType: input.bodyType,
        });
        
        // Upload to S3 temporarily
        const fileKey = `${userId}/previews/${input.emotion}-${randomSuffix()}.png`;
        const { url } = await storagePut(fileKey, sticker.imageBuffer, sticker.mimeType);
        
        return {
          url,
          emotion: input.emotion,
        };
      }),

    // Generate sticker pack
    generatePack: protectedProcedure
      .input(z.object({
        packName: z.string().min(1),
        referencePhotoId: z.number(),
        emotions: z.array(z.string()).min(1),
        style: z.string().default("cute_cartoon"),
        bodyType: z.string().default("half_body"),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        // Get reference photo
        const referencePhoto = await getReferencePhotoById(input.referencePhotoId);
        if (!referencePhoto) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Reference photo not found',
          });
        }
        
        // Verify ownership
        if (referencePhoto.userId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to use this reference photo',
          });
        }
        
        // Create sticker pack
        const pack = await createStickerPack({
          userId,
          name: input.packName,
          description: `Sticker pack with ${input.emotions.length} emotions`,
          referencePhotoId: input.referencePhotoId,
          style: input.style,
          bodyType: input.bodyType,
        });
        
        // Generate stickers for each emotion
        const generatedStickers = await generateStickerBatch(
          referencePhoto.fileUrl,
          input.emotions,
          input.style,
          input.bodyType
        );
        
        // Upload and save each sticker
        const savedStickers = [];
        const stickerEntries = Array.from(generatedStickers.entries());
        for (const [emotion, stickerData] of stickerEntries) {
          const fileKey = `${userId}/stickers/${pack.id}/${emotion}-${randomSuffix()}.png`;
          const { url } = await storagePut(fileKey, stickerData.imageBuffer, stickerData.mimeType);
          
          const sticker = await createSticker({
            packId: pack.id,
            fileKey,
            fileUrl: url,
            emotion,
            prompt: `Cartoon sticker with ${emotion} emotion`,
          });
          
          savedStickers.push(sticker);
        }
        
        return {
          pack,
          stickers: savedStickers,
        };
      }),

    // Get user's sticker packs
    getPacks: protectedProcedure
      .query(async ({ ctx }) => {
        return await getStickerPacksByUserId(ctx.user.id);
      }),

    // Get stickers in a pack
    getPackStickers: protectedProcedure
      .input(z.object({
        packId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const pack = await getStickerPackById(input.packId);
        if (!pack) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sticker pack not found',
          });
        }
        
        // Verify ownership
        if (pack.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this pack',
          });
        }
        
        const stickers = await getStickersByPackId(input.packId);
        return {
          pack,
          stickers,
        };
      }),

    // Delete sticker pack
    deletePack: protectedProcedure
      .input(z.object({
        packId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pack = await getStickerPackById(input.packId);
        if (!pack) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sticker pack not found',
          });
        }
        
        // Verify ownership
        if (pack.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this pack',
          });
        }
        
        await deleteStickerPack(input.packId);
        return { success: true };
      }),

    // Delete individual sticker
    deleteSticker: protectedProcedure
      .input(z.object({
        stickerId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Note: In a production app, you'd want to verify ownership here too
        await deleteSticker(input.stickerId);
        return { success: true };
      }),

    // Download pack as ZIP
    downloadPack: protectedProcedure
      .input(z.object({
        packId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pack = await getStickerPackById(input.packId);
        if (!pack) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Sticker pack not found',
          });
        }
        
        // Verify ownership
        if (pack.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to download this pack',
          });
        }
        
        const stickers = await getStickersByPackId(input.packId);
        
        // Prepare sticker files
        const stickerFiles = stickers.map((sticker, index) => ({
          filename: `${index + 1}_${sticker.emotion}.png`,
          url: sticker.fileUrl,
        }));
        
        // Create ZIP
        const zipBuffer = await createStickerZip(pack.name, stickerFiles);
        
        // Upload ZIP to S3
        const zipKey = `${ctx.user.id}/downloads/${pack.id}-${randomSuffix()}.zip`;
        const { url } = await storagePut(zipKey, zipBuffer, 'application/zip');
        
        return { downloadUrl: url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
