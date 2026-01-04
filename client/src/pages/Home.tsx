import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Sparkles, Upload, Wand2, Download, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/create");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Navigation */}
      <nav className="container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-purple-900">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {isAuthenticated ? (
                  <Button onClick={() => setLocation("/create")} size="lg">
                    เริ่มสร้าง
                  </Button>
                ) : (
                  <Button asChild size="lg">
                    <a href={getLoginUrl()}>เข้าสู่ระบบ</a>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            สร้างสติกเกอร์การ์ตูน
            <br />
            จากรูปเซลฟี่ของคุณ
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            แปลงรูปถ่ายของคุณเป็นสติกเกอร์การ์ตูนสุดน่ารักด้วย AI 
            ในอารมณ์และท่าทางต่างๆ พร้อมใช้งานบน Telegram ได้ทันที
          </p>
          <Button 
            onClick={handleGetStarted} 
            size="lg" 
            className="text-lg px-8 py-6 h-auto"
            disabled={loading}
          >
            เริ่มสร้างสติกเกอร์ฟรี
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Example Stickers Preview */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
            <p className="text-center text-gray-600 mb-4">ตัวอย่างสติกเกอร์ที่สร้างด้วย AI</p>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-purple-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
          ทำไมต้องเลือกเรา?
        </h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-xl font-semibold mb-3 text-gray-900">ง่ายและรวดเร็ว</h4>
            <p className="text-gray-600">
              แค่อัปโหลดรูปเซลฟี่ของคุณ เลือกอารมณ์ที่ต้องการ 
              และปล่อยให้ AI สร้างสติกเกอร์ให้คุณภายในไม่กี่วินาที
            </p>
          </Card>

          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
              <Wand2 className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-xl font-semibold mb-3 text-gray-900">AI ที่ทรงพลัง</h4>
            <p className="text-gray-600">
              ใช้เทคโนโลยี AI ล้ำสมัยในการสร้างสติกเกอร์การ์ตูนที่สวยงาม 
              คงเอกลักษณ์ใบหน้าของคุณไว้ได้อย่างน่าทึ่ง
            </p>
          </Card>

          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
              <Download className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-xl font-semibold mb-3 text-gray-900">ใช้งานง่าย</h4>
            <p className="text-gray-600">
              ดาวน์โหลดสติกเกอร์ทั้งชุดเป็น ZIP และนำไปใช้บน Telegram 
              ได้ทันทีผ่าน @Stickers bot พร้อมคู่มือการใช้งาน
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-20">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
          วิธีการใช้งาน
        </h3>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900">อัปโหลดรูปภาพ</h4>
              <p className="text-gray-600">
                เลือกรูปเซลฟี่ที่คุณชอบ ควรเป็นรูปที่เห็นใบหน้าชัดเจน
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900">เลือกอารมณ์</h4>
              <p className="text-gray-600">
                เลือกอารมณ์หรือท่าทางที่ต้องการสร้าง เช่น ยิ้ม เศร้า โกรธ แปลกใจ
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900">ดาวน์โหลด</h4>
              <p className="text-gray-600">
                ดาวน์โหลดสติกเกอร์และนำไปใช้บน Telegram ได้เลย
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            พร้อมสร้างสติกเกอร์ของคุณแล้วหรือยัง?
          </h3>
          <p className="text-xl mb-8 text-white/90">
            เริ่มต้นใช้งานฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6 h-auto bg-white text-purple-600 hover:bg-gray-100"
            disabled={loading}
          >
            เริ่มสร้างเลย
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t border-gray-200">
        <p className="text-center text-gray-600">
          © 2024 {APP_TITLE}. สร้างสรรค์ด้วย ❤️ และ AI
        </p>
      </footer>
    </div>
  );
}
