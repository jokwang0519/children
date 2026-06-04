"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [pin, setPin] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🎮</div>
        <h1 className="text-5xl font-black text-white mb-2 tracking-tight">퀴즈쇼!</h1>
        <p className="text-white/80 text-lg">친구들과 함께하는 신나는 퀴즈</p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <p className="text-center text-gray-500 text-sm font-medium mb-4">게임 핀 번호를 입력하세요</p>
        <input
          type="text"
          value={pin}
          onChange={e => setPin(e.target.value.toUpperCase())}
          placeholder="예: ABC123"
          maxLength={6}
          className="w-full text-center text-3xl font-black border-3 border-gray-200 rounded-2xl px-4 py-4 outline-none focus:border-purple-500 tracking-widest mb-4"
          style={{ border: "3px solid #e5e7eb" }}
          onFocus={e => e.target.style.border = "3px solid #a855f7"}
          onBlur={e => e.target.style.border = "3px solid #e5e7eb"}
        />
        <button
          onClick={() => { if (pin.length >= 4) router.push(`/join?pin=${pin}`); }}
          disabled={pin.length < 4}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-black text-xl py-4 rounded-2xl transition mb-3"
        >
          입장하기 🚀
        </button>
        <button
          onClick={() => router.push("/admin")}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-2xl transition text-sm"
        >
          선생님 로그인 👨‍🏫
        </button>
      </div>
    </div>
  );
}
