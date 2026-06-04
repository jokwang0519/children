"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

// 더미 데이터 생성
const generateData = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const time = new Date(now.getTime() - (11 - i) * 30 * 60 * 1000);
    const h = time.getHours().toString().padStart(2, "0");
    const m = time.getMinutes().toString().padStart(2, "0");
    return {
      time: `${h}:${m}`,
      "1동 온도": +(22 + Math.random() * 8).toFixed(1),
      "2동 온도": +(20 + Math.random() * 8).toFixed(1),
      "1동 습도": +(60 + Math.random() * 25).toFixed(1),
      "2동 습도": +(58 + Math.random() * 25).toFixed(1),
    };
  });
};

type CoverState = "열림" | "닫힘" | "작동중";

export default function HomePage() {
  const [data, setData] = useState(generateData());
  const [cover1, setCover1] = useState<CoverState>("닫힘");
  const [cover2, setCover2] = useState<CoverState>("닫힘");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"온도" | "습도">("온도");

  // 1분마다 데이터 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateData());
      setLastUpdate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCover = (house: 1 | 2, action: "열기" | "닫기") => {
    const set = house === 1 ? setCover1 : setCover2;
    set("작동중");
    setTimeout(() => set(action === "열기" ? "열림" : "닫힘"), 2000);
  };

  const latest = data[data.length - 1];

  const CoverButton = ({ house, state, onOpen, onClose }: {
    house: number; state: CoverState;
    onOpen: () => void; onClose: () => void;
  }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-black text-gray-800">🏠 하우스 {house}동</h3>
          <p className="text-sm text-gray-500 mt-0.5">보온덮개 원격 제어</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
          state === "열림" ? "bg-orange-100 text-orange-600" :
          state === "닫힘" ? "bg-blue-100 text-blue-600" :
          "bg-yellow-100 text-yellow-600 animate-pulse"
        }`}>
          {state === "열림" ? "🌞 열림" : state === "닫힘" ? "🌙 닫힘" : "⚙️ 작동중..."}
        </span>
      </div>

      {/* 상태 시각화 */}
      <div className={`rounded-xl h-16 mb-5 flex items-center justify-center transition-all duration-500 ${
        state === "열림" ? "bg-orange-50 border-2 border-orange-200" :
        state === "닫힘" ? "bg-blue-50 border-2 border-blue-200" :
        "bg-yellow-50 border-2 border-yellow-200"
      }`}>
        <span className="text-3xl">
          {state === "열림" ? "☀️" : state === "닫힘" ? "🏠" : "⚙️"}
        </span>
        <span className={`ml-3 font-bold text-lg ${
          state === "열림" ? "text-orange-600" :
          state === "닫힘" ? "text-blue-600" : "text-yellow-600"
        }`}>
          {state === "열림" ? "보온덮개가 열려있습니다" :
           state === "닫힘" ? "보온덮개가 닫혀있습니다" : "작동 중입니다..."}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onOpen}
          disabled={state !== "닫힘"}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition text-base flex items-center justify-center gap-2"
        >
          ☀️ 덮개 열기
        </button>
        <button
          onClick={onClose}
          disabled={state !== "열림"}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition text-base flex items-center justify-center gap-2"
        >
          🌙 덮개 닫기
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7f2]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800">🌿 스마트팜 대시보드</h1>
            <p className="text-gray-500 text-sm mt-1">
              마지막 업데이트: {lastUpdate.toLocaleTimeString("ko-KR")}
            </p>
          </div>
          <button onClick={() => { setData(generateData()); setLastUpdate(new Date()); }}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2">
            🔄 새로고침
          </button>
        </div>

        {/* 현재 온도·습도 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "1동 온도", value: latest["1동 온도"], unit: "°C", icon: "🌡️", color: "text-red-500", bg: "bg-red-50" },
            { label: "2동 온도", value: latest["2동 온도"], unit: "°C", icon: "🌡️", color: "text-orange-500", bg: "bg-orange-50" },
            { label: "1동 습도", value: latest["1동 습도"], unit: "%", icon: "💧", color: "text-blue-500", bg: "bg-blue-50" },
            { label: "2동 습도", value: latest["2동 습도"], unit: "%", icon: "💧", color: "text-cyan-500", bg: "bg-cyan-50" },
          ].map(card => (
            <div key={card.label} className={`${card.bg} rounded-2xl p-5 border border-white shadow-sm`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{card.icon}</span>
                <span className="text-xs font-semibold text-gray-500">{card.label}</span>
              </div>
              <p className={`text-3xl font-black ${card.color}`}>
                {card.value}<span className="text-lg ml-1">{card.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* 그래프 */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-gray-800">📊 하우스 환경 모니터링</h2>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab("온도")}
                className={`px-4 py-1.5 rounded-xl text-sm font-bold transition ${
                  activeTab === "온도" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>🌡️ 온도</button>
              <button onClick={() => setActiveTab("습도")}
                className={`px-4 py-1.5 rounded-xl text-sm font-bold transition ${
                  activeTab === "습도" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>💧 습도</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }}
                domain={activeTab === "온도" ? [10, 40] : [40, 100]}
                unit={activeTab === "온도" ? "°C" : "%"} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                formatter={(v: any) => [v + (activeTab === "온도" ? "°C" : "%")]}
              />
              <Legend />
              {activeTab === "온도" ? (
                <>
                  <Line type="monotone" dataKey="1동 온도" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="2동 온도" stroke="#f97316" strokeWidth={2.5} dot={false} strokeDasharray="5 5" />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="1동 습도" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="2동 습도" stroke="#06b6d4" strokeWidth={2.5} dot={false} strokeDasharray="5 5" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 보온덮개 제어 */}
        <div>
          <h2 className="text-lg font-black text-gray-800 mb-4">🎛️ 보온덮개 원격 제어</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CoverButton
              house={1} state={cover1}
              onOpen={() => handleCover(1, "열기")}
              onClose={() => handleCover(1, "닫기")}
            />
            <CoverButton
              house={2} state={cover2}
              onOpen={() => handleCover(2, "열기")}
              onClose={() => handleCover(2, "닫기")}
            />
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="h-4" />
      </main>
    </div>
  );
}
