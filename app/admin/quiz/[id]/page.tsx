"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Question = { id?: string; question: string; options: string[]; answer: number; order_num: number };

export default function QuizEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const [quizTitle, setQuizTitle] = useState("");
  const [pin, setPin] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchQuiz(); }, [id]);

  const fetchQuiz = async () => {
    const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", id).single();
    if (quiz) { setQuizTitle(quiz.title); setPin(quiz.pin); }
    const { data: qs } = await supabase.from("questions").select("*").eq("quiz_id", id).order("order_num");
    if (qs && qs.length > 0) setQuestions(qs);
    else setQuestions([{ question: "", options: ["", "", "", ""], answer: 0, order_num: 1 }]);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], answer: 0, order_num: questions.length + 1 }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const next = [...questions];
    if (field === "option") {
      const [, optIdx, val] = value;
      next[idx].options[optIdx] = val;
    } else {
      (next[idx] as any)[field] = value;
    }
    setQuestions(next);
  };

  const saveAll = async () => {
    setSaving(true);
    // 기존 문제 삭제 후 재삽입
    await supabase.from("questions").delete().eq("quiz_id", id);
    const toInsert = questions
      .filter(q => q.question.trim())
      .map((q, i) => ({ quiz_id: id, question: q.question, options: q.options, answer: q.answer, order_num: i + 1 }));
    if (toInsert.length > 0) await supabase.from("questions").insert(toInsert);
    setSaving(false);
    alert("저장 완료! ✅");
  };

  const COLORS = ["#EF4444", "#3B82F6", "#F59E0B", "#10B981"];
  const LABELS = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-6">
        <button onClick={() => router.push("/admin")} className="text-white/70 text-sm mb-3 hover:text-white">← 대시보드</button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">{quizTitle}</h1>
            <p className="text-white/70 text-sm">핀번호: <span className="font-mono font-bold text-yellow-300">{pin}</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={saveAll} disabled={saving}
              className="bg-white text-purple-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-purple-50 transition">
              {saving ? "저장 중..." : "💾 저장"}
            </button>
            <button onClick={() => router.push(`/host/${id}`)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition">
              ▶ 게임 시작
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-purple-100 text-purple-700 font-bold text-sm px-3 py-1 rounded-full">문제 {idx + 1}</span>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-600 text-sm">삭제</button>
              )}
            </div>
            <input
              value={q.question}
              onChange={e => updateQuestion(idx, "question", e.target.value)}
              placeholder="문제를 입력하세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-purple-400 mb-4"
            />
            <p className="text-xs text-gray-400 font-semibold mb-3">보기 (정답을 선택하세요)</p>
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, oi) => (
                <div key={oi}
                  onClick={() => updateQuestion(idx, "answer", oi)}
                  className={`relative rounded-xl border-2 p-3 cursor-pointer transition ${q.answer === oi ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: COLORS[oi] }}>
                      {LABELS[oi]}
                    </span>
                    <input
                      value={opt}
                      onChange={e => { e.stopPropagation(); updateQuestion(idx, "option", [null, oi, e.target.value]); }}
                      onClick={e => e.stopPropagation()}
                      placeholder={`보기 ${LABELS[oi]}`}
                      className="flex-1 text-sm outline-none bg-transparent"
                    />
                    {q.answer === oi && <span className="text-green-500 text-xs">✓ 정답</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button onClick={addQuestion}
          className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500 text-purple-500 hover:text-purple-700 font-bold py-4 rounded-2xl transition text-sm">
          + 문제 추가
        </button>
      </div>
    </div>
  );
}
