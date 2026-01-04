import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Sparkles, ArrowLeft, Plus, Loader2, Download, Trash2, Eye, ExternalLink, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Gallery() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);
  const [showGuideDialog, setShowGuideDialog] = useState(false);

  const { data: packs, isLoading: packsLoading } = trpc.sticker.getPacks.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: packDetails } = trpc.sticker.getPackStickers.useQuery(
    { packId: selectedPackId! },
    { enabled: selectedPackId !== null }
  );

  const utils = trpc.useUtils();
  const deletePackMutation = trpc.sticker.deletePack.useMutation({
    onSuccess: () => {
      toast.success("ลบชุดสติกเกอร์สำเร็จ");
      utils.sticker.getPacks.invalidate();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const downloadPackMutation = trpc.sticker.downloadPack.useMutation({
    onSuccess: (data) => {
      // Open download URL in new tab
      window.open(data.downloadUrl, '_blank');
      toast.success("ดาวน์โหลดสำเร็จ!");
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (authLoading || packsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const handleDeletePack = async (packId: number) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบชุดสติกเกอร์นี้?")) {
      await deletePackMutation.mutateAsync({ packId });
    }
  };

  const handleDownloadPack = async (packId: number) => {
    toast.info("กำลังเตรียมไฟล์ ZIP...");
    await downloadPackMutation.mutateAsync({ packId });
    // Show guide dialog after download
    setTimeout(() => setShowGuideDialog(true), 1000);
  };

  const openStickersBot = () => {
    window.open("https://t.me/Stickers", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Navigation */}
      <nav className="container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-purple-900">{APP_TITLE}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">สวัสดี, {user?.name}</span>
            <Button onClick={() => setLocation("/create")}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างใหม่
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            คลังสติกเกอร์ของคุณ
          </h2>
          <p className="text-gray-600">จัดการและดาวน์โหลดสติกเกอร์ที่คุณสร้างไว้</p>
        </div>

        {!packs || packs.length === 0 ? (
          /* Empty State */
          <Card className="p-12 bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center max-w-2xl mx-auto">
            <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2 text-gray-900">
              ยังไม่มีสติกเกอร์
            </h3>
            <p className="text-gray-600 mb-6">
              เริ่มสร้างสติกเกอร์ชุดแรกของคุณกันเลย!
            </p>
            <Button onClick={() => setLocation("/create")} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              สร้างสติกเกอร์
            </Button>
          </Card>
        ) : (
          /* Sticker Packs Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map((pack) => (
              <Card key={pack.id} className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {pack.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {pack.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      สร้างเมื่อ {new Date(pack.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedPackId(pack.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    ดู
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownloadPack(pack.id)}
                    disabled={downloadPackMutation.isPending}
                  >
                    {downloadPackMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    ดาวน์โหลด
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePack(pack.id)}
                    disabled={deletePackMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Guide Dialog */}
      <Dialog open={showGuideDialog} onOpenChange={setShowGuideDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              คู่มือการอัปโหลดสติกเกอร์ไป Telegram
            </DialogTitle>
            <DialogDescription>
              ทำตามขั้นตอนด้านล่างเพื่ออัปโหลดสติกเกอร์ของคุณไปยัง Telegram
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-semibold text-lg">เปิด @Stickers Bot</h3>
              </div>
              <div className="ml-10 space-y-2 text-sm text-gray-700">
                <p>• เปิดแอป Telegram บนมือถือของคุณ</p>
                <p>• คลิกที่ไอคอนกระทู้ (🔍) แล้วค้นหา "@Stickers"</p>
                <p>• คลิกที่ @Stickers bot แล้วกด "Start"</p>
                <Button 
                  onClick={openStickersBot}
                  className="mt-2 w-full"
                  variant="outline"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  เปิด @Stickers Bot
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-semibold text-lg">สร้างชุดสติกเกอร์ใหม่</h3>
              </div>
              <div className="ml-10 space-y-2 text-sm text-gray-700">
                <p>• พิมพ์คำสั่ง: <code className="bg-gray-100 px-2 py-1 rounded">/newpack</code></p>
                <p>• Bot จะถามชื่อชุดสติกเกอร์ - พิมพ์ชื่อที่คุณต้องการ</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-semibold text-lg">อัปโหลดสติกเกอร์</h3>
              </div>
              <div className="ml-10 space-y-2 text-sm text-gray-700">
                <p>• คลิกที่ไอคอนคลิป (📎) ใน Telegram</p>
                <p>• เลือกไฟล์สติกเกอร์ .png จากไฟล์ ZIP ที่ดาวน์โหลด</p>
                <p>• ส่งไฟล์ทีละรูปไปให้ Bot</p>
                <p>• Bot จะถามให้เลือก Emoji - พิมพ์ emoji ที่เหมาะสม (เช่น 😊, 😢, 😡)</p>
                <p>• ทำซ้ำสำหรับสติกเกอร์ทุกรูป</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="font-semibold text-lg">เผยแพร่ชุดสติกเกอร์</h3>
              </div>
              <div className="ml-10 space-y-2 text-sm text-gray-700">
                <p>• หลังอัปโหลดครบแล้ว พิมพ์: <code className="bg-gray-100 px-2 py-1 rounded">/publish</code></p>
                <p>• ส่งรูปสติกเกอร์รูปหนึ่งเป็นไอคอน</p>
                <p>• พิมพ์ชื่อสั้นภาษาอังกฤษ (ตัวอย่าง: mystickers)</p>
                <p className="text-green-600 font-semibold">• เสร็จ! คุณจะได้รับลิงก์สติกเกอร์ของคุณ 🎉</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 เคล็ดลับ:</strong> ไฟล์ ZIP ที่ดาวน์โหลดมีไฟล์ README.txt พร้อมคู่มือแบบเต็มอยู่แล้ว
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pack Details Dialog */}
      <Dialog open={selectedPackId !== null} onOpenChange={(open) => !open && setSelectedPackId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{packDetails?.pack.name}</DialogTitle>
            <DialogDescription>
              {packDetails?.pack.description}
            </DialogDescription>
          </DialogHeader>
          
          {packDetails && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {packDetails.stickers.map((sticker) => (
                <div key={sticker.id} className="space-y-2">
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl overflow-hidden">
                    <img 
                      src={sticker.fileUrl} 
                      alt={sticker.emotion}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-sm text-center text-gray-700 capitalize">
                    {sticker.emotion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
