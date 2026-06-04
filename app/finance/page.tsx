import Navbar from "@/components/Navbar";
export default function FinancePage() {
  return (
    <div className="min-h-screen bg-[#f5f7f2]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10 text-center">
        <div className="text-6xl mb-4">💰</div>
        <h1 className="text-2xl font-black text-gray-700">수입 / 지출</h1>
        <p className="text-gray-400 mt-2">준비 중입니다</p>
      </main>
    </div>
  );
}
