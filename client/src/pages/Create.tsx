import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  Sparkles, Upload, Loader2, Download, Trash2, 
  Smile, Frown, Angry, AlertCircle, Heart, Zap, 
  Coffee, Star, ArrowLeft 
} from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const EMOTIONS = [
  { id: "happy", label: "ยิ้ม", icon: Smile, color: "from-yellow-400 to-orange-400" },
  { id: "sad", label: "เศร้า", icon: Frown, color: "from-blue-400 to-blue-600" },
  { id: "angry", label: "โกรธ", icon: Angry, color: "from-red-400 to-red-600" },
  { id: "surprised", label: "แปลกใจ", icon: AlertCircle, color: "from-purple-400 to-pink-400" },
  { id: "love", label: "รัก", icon: Heart, color: "from-pink-400 to-red-400" },
  { id: "cool", label: "เท่", icon: Star, color: "from-blue-400 to-cyan-400" },
  { id: "excited", label: "ตื่นเต้น", icon: Zap, color: "from-yellow-400 to-yellow-600" },
  { id: "tired", label: "เหนื่อย", icon: Coffee, color: "from-gray-400 to-gray-600" },
];

export default function Create() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [packName, setPackName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("cute_cartoon");
  const [selectedBodyType, setSelectedBodyType] = useState<string>("half_body");
  const [customEmotions, setCustomEmotions] = useState<Array<{ id: string; label: string }>>([]);
  const [newEmotionLabel, setNewEmotionLabel] = useState("");
  const [previewEmotion, setPreviewEmotion] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)");
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileSelect({ target: input } as any);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const toggleEmotion = (emotionId: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotionId)
        ? prev.filter(id => id !== emotionId)
        : [...prev, emotionId]
    );
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddCustomEmotion = () => {
    if (!newEmotionLabel.trim()) {
      toast.error("กรุณาพิมพ์คำอธิบายอารมณ์/แอ็คชั่น");
      return;
    }
    const id = `custom_${Date.now()}`;
    setCustomEmotions(prev => [...prev, { id, label: newEmotionLabel.trim() }]);
    setNewEmotionLabel("");
    toast.success(`เพิ่ม "${newEmotionLabel.trim()}" แล้ว`);
  };

  const handleRemoveCustomEmotion = (emotionId: string) => {
    setCustomEmotions(prev => prev.filter(e => e.id !== emotionId));
    setSelectedEmotions(prev => prev.filter(id => id !== emotionId));
    toast.success("ลบอารมณ์แล้ว");
  };

  // Combine default and custom emotions
  const allEmotions = [
    ...EMOTIONS,
    ...customEmotions.map(e => ({
      id: e.id,
      label: e.label,
      icon: Sparkles,
      color: "from-purple-400 to-pink-400",
      isCustom: true,
    }))
  ];

  const uploadReferenceMutation = trpc.sticker.uploadReference.useMutation();
  const previewStickerMutation = trpc.sticker.previewSticker.useMutation({
    onSuccess: (data) => {
      setPreviewImageUrl(data.url);
      toast.success("สร้างตัวอย่างสำเร็จ!");
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });
  const generatePackMutation = trpc.sticker.generatePack.useMutation({
    onSuccess: (data) => {
      toast.success(`สร้างสติกเกอร์สำเร็จ! ได้ ${data.stickers.length} รูป`);
      // Redirect to gallery
      setLocation("/gallery");
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handlePreviewSticker = async (emotionId: string, emotionLabel: string) => {
    if (!selectedFile) {
      toast.error("กรุณาเลือกรูปภาพก่อน");
      return;
    }

    try {
      toast.info("กำลังอัปโหลดรูปภาพ...");
      
      // Convert file to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Upload reference photo if not already uploaded
      let referencePhotoId;
      if (uploadReferenceMutation.data) {
        referencePhotoId = uploadReferenceMutation.data.id;
      } else {
        const referencePhoto = await uploadReferenceMutation.mutateAsync({
          filename: selectedFile.name,
          mimeType: selectedFile.type,
          base64Data,
        });
        referencePhotoId = referencePhoto.id;
      }

      toast.info(`กำลังสร้างตัวอย่าง "${emotionLabel}"... อาจใช้เวลาสักครู่`);
      setPreviewEmotion(emotionLabel);

      // Generate preview
      await previewStickerMutation.mutateAsync({
        referencePhotoId,
        emotion: emotionId,
        style: selectedStyle,
        bodyType: selectedBodyType,
      });
    } catch (error) {
      console.error("Error previewing sticker:", error);
      if (error instanceof Error) {
        toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
      }
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("กรุณาเลือกรูปภาพ");
      return;
    }
    if (selectedEmotions.length === 0) {
      toast.error("กรุณาเลือกอารมณ์อย่างน้อย 1 อารมณ์");
      return;
    }
    if (!packName.trim()) {
      toast.error("กรุณาตั้งชื่อชุดสติกเกอร์");
      return;
    }

    try {
      toast.info("กำลังอัปโหลดรูปภาพ...");
      
      // Convert file to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Upload reference photo
      const referencePhoto = await uploadReferenceMutation.mutateAsync({
        filename: selectedFile.name,
        mimeType: selectedFile.type,
        base64Data,
      });

      toast.info(`กำลังสร้างสติกเกอร์ ${selectedEmotions.length} รูป... อาจใช้เวลาสักครู่`);

      // Generate sticker pack
      await generatePackMutation.mutateAsync({
        packName,
        referencePhotoId: referencePhoto.id,
        emotions: selectedEmotions,
        style: selectedStyle,
        bodyType: selectedBodyType,
      });
    } catch (error) {
      console.error("Error generating stickers:", error);
      if (error instanceof Error) {
        toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
      }
    }
  };

  const isGenerating = uploadReferenceMutation.isPending || generatePackMutation.isPending;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

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
            <Button onClick={() => setLocation("/gallery")} variant="outline">
              คลังสติกเกอร์
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            สร้างสติกเกอร์ของคุณ
          </h2>
          <p className="text-gray-600">อัปโหลดรูปภาพและเลือกอารมณ์ที่ต้องการ</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Settings */}
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">1. อัปโหลดรูปภาพ</h3>
              
              {!previewUrl ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
                >
                  <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-sm text-gray-500">
                    รองรับไฟล์ JPG, PNG (สูงสุด 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-64 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleClearFile}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedFile?.name}
                  </p>
                </div>
              )}
            </Card>

            {/* Pack Name */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">2. ตั้งชื่อชุดสติกเกอร์</h3>
              <div className="space-y-2">
                <Label htmlFor="packName">ชื่อชุดสติกเกอร์</Label>
                <Input
                  id="packName"
                  placeholder="เช่น สติกเกอร์ของฉัน"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  className="text-base"
                />
              </div>
            </Card>

            {/* Style Selection */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">3. เลือกสไตล์</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedStyle("cute_cartoon")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedStyle === "cute_cartoon"
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <div className="text-3xl mb-2">🎨</div>
                  <p className="text-sm font-medium text-gray-900">การ์ตูนน่ารัก</p>
                  <p className="text-xs text-gray-500">Cute Cartoon</p>
                </button>
                <button
                  onClick={() => setSelectedStyle("realistic_cartoon")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedStyle === "realistic_cartoon"
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <div className="text-3xl mb-2">🖼️</div>
                  <p className="text-sm font-medium text-gray-900">เหมือนจริง</p>
                  <p className="text-xs text-gray-500">Realistic</p>
                </button>
                <button
                  onClick={() => setSelectedStyle("anime")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedStyle === "anime"
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <div className="text-3xl mb-2">⭐</div>
                  <p className="text-sm font-medium text-gray-900">อนิเมะ</p>
                  <p className="text-xs text-gray-500">Anime</p>
                </button>
                <button
                  onClick={() => setSelectedStyle("chibi")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedStyle === "chibi"
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <div className="text-3xl mb-2">🌟</div>
                  <p className="text-sm font-medium text-gray-900">Chibi</p>
                  <p className="text-xs text-gray-500">Super Cute</p>
                </button>
              </div>
            </Card>

            {/* Body Type Selection */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">4. เลือกรูปแบบ</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedBodyType("half_body")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedBodyType === "half_body"
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <div className="text-2xl mb-2">👤</div>
                  <p className="text-sm font-medium text-gray-900">ครึ่งตัว</p>
                </button>
                <button
                  onClick={() => setSelectedBodyType("full_body")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedBodyType === "full_body"
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <div className="text-2xl mb-2">🧍</div>
                  <p className="text-sm font-medium text-gray-900">เต็มตัว</p>
                </button>
                <button
                  onClick={() => setSelectedBodyType("mixed")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedBodyType === "mixed"
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <div className="text-2xl mb-2">🎭</div>
                  <p className="text-sm font-medium text-gray-900">ทั้งสองแบบ</p>
                </button>
              </div>
            </Card>

            {/* Emotion Selection */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                5. เลือกอารมณ์/แอ็คชั่น ({selectedEmotions.length} รายการ)
              </h3>
              
              {/* Add Custom Emotion */}
              <div className="mb-4 flex gap-2">
                <Input
                  placeholder="พิมพ์อารมณ์/แอ็คชั่น (เช่น กำลังกินไอศกรีม)"
                  value={newEmotionLabel}
                  onChange={(e) => setNewEmotionLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustomEmotion();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleAddCustomEmotion} size="icon">
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {allEmotions.map((emotion: any) => {
                  const Icon = emotion.icon;
                  const isSelected = selectedEmotions.includes(emotion.id);
                  
                  return (
                    <div key={emotion.id} className="relative">
                      <button
                        onClick={() => toggleEmotion(emotion.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-50 shadow-md scale-105"
                            : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${emotion.color} flex items-center justify-center mx-auto mb-2`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{emotion.label}</p>
                      </button>
                      
                      {/* Preview Button */}
                      {selectedFile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handlePreviewSticker(emotion.id, emotion.label);
                          }}
                          title="ดูตัวอย่าง"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {emotion.isCustom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomEmotion(emotion.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              size="lg"
              className="w-full text-lg py-6 h-auto"
              disabled={!selectedFile || selectedEmotions.length === 0 || !packName.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  สร้างสติกเกอร์
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Preview */}
          <div>
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg sticky top-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">ตัวอย่างสติกเกอร์</h3>
              <div className="space-y-4">
                {selectedEmotions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>เลือกอารมณ์เพื่อดูตัวอย่าง</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEmotions.map((emotionId) => {
                      const emotion = EMOTIONS.find(e => e.id === emotionId);
                      const Icon = emotion?.icon || Sparkles;
                      
                      return (
                        <div key={emotionId} className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex flex-col items-center justify-center p-4">
                          <Icon className="w-12 h-12 text-purple-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700">{emotion?.label}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      {previewImageUrl && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => {
          setPreviewImageUrl(null);
          setPreviewEmotion(null);
        }}>
          <Card className="max-w-2xl w-full p-6 bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                ตัวอย่างสติกเกอร์: {previewEmotion}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPreviewImageUrl(null);
                  setPreviewEmotion(null);
                }}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 flex items-center justify-center">
              <img
                src={previewImageUrl}
                alt={`Preview ${previewEmotion}`}
                className="max-w-full max-h-96 object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>ถ้าชอบผลลัพธ์ คลิก "สร้างสติกเกอร์" เพื่อสร้างชุดสติกเกอร์ทั้งหมด</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
