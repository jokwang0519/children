"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Quiz = { id: string; title: string; pin: string; is_active: boolean; created_at: string };

export default function AdminPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchQuizzes(); }, []);

  const fetchQuizzes = async () => {
    const { data } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
    setQuizzes(data || []);
  };

  const generatePin = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const createQuiz = async () => {
    if (!title.trim()) return;
    setLoading(true);
    const pin = generatePin();
    const { data, error } = await supabase.from("quizzes").insert({ title, pin }).select().single();
    setLoading(false);
    if (error) {
      alert("오류 발생: " + error.message + "\n\n코드: " + error.code);
      return;
    }
    setTitle("");
    if (data) router.push(`/admin/quiz/${data.id}`);
    fetchQuizzes();
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm("정말 삭제할까요?")) return;
    await supabase.from("quizzes").delete().eq("id", id);
    fetchQuizzes();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-8">
        <button onClick={() => router.push("/")} className="text-white/70 text-sm mb-4 hover:text-white">← 홈으로</button>
        <h1 className="text-2xl font-black">👨‍🏫 선생님 대시보드</h1>
        <p className="text-white/70 text-sm mt-1">퀴즈를 만들고 관리하세요</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* 새 퀴즈 만들기 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">✨ 새 퀴즈 만들기</h2>
          <div className="flex gap-3">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createQuiz()}
              placeholder="퀴즈 제목 입력 (예: 동물 퀴즈)"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400"
            />
            <button
              onClick={createQuiz}
              disabled={loading || !title.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold px-5 py-3 rounded-xl transition text-sm"
            >
              {loading ? "..." : "만들기"}
            </button>
          </div>
        </div>

        {/* 퀴즈 목록 */}
        <h2 className="font-bold text-gray-700 mb-3">📋 내 퀴즈 목록</h2>
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p>아직 만든 퀴즈가 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map(q => (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">{q.title}</p>
                  <p className="text-xs text-gray-400 mt-1">핀번호: <span className="font-mono font-bold text-purple-600">{q.pin}</span></p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/admin/quiz/${q.id}`)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-4 py-2 rounded-xl text-sm transition"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => router.push(`/host/${q.id}`)}
                    className="bg-green-50 hover:bg-green-100 text-green-600 font-semibold px-4 py-2 rounded-xl text-sm transition"
                  >
                    시작
                  </button>
                  <button
                    onClick={() => deleteQuiz(q.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-400 font-semibold px-3 py-2 rounded-xl text-sm transition"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
