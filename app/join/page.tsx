"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState(searchParams.get("pin") || "");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!pin.trim() || !nickname.trim()) return;
    setLoading(true);
    setError("");
    const { data: quiz } = await supabase.from("quizzes").select("*").eq("pin", pin.toUpperCase()).eq("is_active", true).single();
    if (!quiz) { setError("게임을 찾을 수 없어요. 핀번호를 확인해주세요! 🔍"); setLoading(false); return; }
    const { data: player } = await supabase.from("players").insert({ quiz_id: quiz.id, nickname }).select().single();
    setLoading(false);
    if (player) router.push(`/play/${quiz.id}?player=${player.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎮</div>
        <h1 className="text-3xl font-black text-white">퀴즈 참가하기</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2">게임 핀번호</label>
          <input
            value={pin}
            onChange={e => setPin(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="w-full text-center text-2xl font-black border-2 border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 tracking-widest"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2">닉네임</label>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            placeholder="예: 멋쟁이토끼 🐰"
            maxLength={10}
            className="w-full text-center text-lg font-bold border-2 border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-purple-500"
          />
        </div>
        {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl p-3">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={loading || !pin.trim() || !nickname.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-black text-xl py-4 rounded-2xl transition"
        >
          {loading ? "참가 중..." : "참가하기! 🚀"}
        </button>
        <button onClick={() => router.push("/")} className="w-full text-gray-400 text-sm hover:text-gray-600">← 홈으로</button>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return <Suspense><JoinForm /></Suspense>;
}
