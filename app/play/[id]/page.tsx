"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COLORS = ["bg-red-500 hover:bg-red-600", "bg-blue-500 hover:bg-blue-600", "bg-yellow-500 hover:bg-yellow-600", "bg-green-500 hover:bg-green-600"];
const SHAPES = ["▲", "◆", "●", "■"];

function PlayGame() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const playerId = searchParams.get("player");

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"waiting" | "question" | "answered" | "end">("waiting");
  const [nickname, setNickname] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => { fetchData(); }, [id]);

  // 1초마다 게임 상태 체크
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", id).single();
      if (!q) return;
      if (q.is_active && phase === "waiting") {
        setQuiz(q);
        setCurrentQ(q.current_question || 0);
        setPhase("question");
        setSelected(null);
      }
      if (!q.is_active && phase !== "end" && phase !== "waiting") {
        setPhase("end");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [id, phase]);

  useEffect(() => {
    const channel = supabase.channel("quiz-state-" + id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "quizzes", filter: `id=eq.${id}` },
        (payload) => handleQuizUpdate(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, questions]);

  const fetchData = async () => {
    const { data: q } = await supabase.from("quizzes").select("*").eq("id", id).single();
    setQuiz(q);
    const { data: qs } = await supabase.from("questions").select("*").eq("quiz_id", id).order("order_num");
    setQuestions(qs || []);
    if (playerId) {
      const { data: p } = await supabase.from("players").select("nickname, score").eq("id", playerId).single();
      if (p) { setNickname(p.nickname); setScore(p.score); }
    }
    if (q?.is_active) {
      setCurrentQ(q.current_question || 0);
      setPhase("question");
      setSelected(null);
    }
  };

  const handleQuizUpdate = (newData: any) => {
    if (!newData.is_active && quiz?.is_active) { setPhase("end"); return; }
    if (newData.current_question !== currentQ) {
      setCurrentQ(newData.current_question);
      setSelected(null);
      setIsCorrect(null);
      setPhase("question");
    }
    if (newData.is_active && phase === "waiting") setPhase("question");
  };

  const handleAnswer = async (optionIdx: number) => {
    if (selected !== null || !questions[currentQ]) return;
    setSelected(optionIdx);
    const q = questions[currentQ];
    const correct = optionIdx === q.answer;
    setIsCorrect(correct);
    const points = correct ? 100 : 0;
    await supabase.from("answers").insert({ player_id: playerId, question_id: q.id, selected: optionIdx, is_correct: correct });
    if (correct) {
      const newScore = score + points;
      setScore(newScore);
      await supabase.from("players").update({ score: newScore }).eq("id", playerId);
    }
    setPhase("answered");
  };

  // 대기 중
  if (phase === "waiting") return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col items-center justify-center p-8 text-white">
      <div className="text-6xl mb-4 animate-bounce">⏳</div>
      <h1 className="text-3xl font-black mb-2">잠깐만요!</h1>
      <p className="text-white/80 text-lg mb-6">선생님이 게임을 시작하길 기다리는 중...</p>
      <div className="bg-white/20 rounded-2xl px-8 py-4 text-center">
        <p className="text-white/70 text-sm">참가자</p>
        <p className="text-3xl font-black text-yellow-300">{nickname} 👋</p>
      </div>
    </div>
  );

  // 게임 종료
  if (phase === "end") return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 flex flex-col items-center justify-center p-8 text-white">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-4xl font-black mb-2">게임 끝!</h1>
      <p className="text-xl text-white/90 mb-6">{nickname}님의 최종 점수</p>
      <div className="bg-white rounded-3xl px-12 py-8 text-center mb-6">
        <p className="text-6xl font-black text-purple-600">{score}</p>
        <p className="text-gray-500 font-bold">점</p>
      </div>
      <p className="text-white/80">수고하셨어요! 👏</p>
    </div>
  );

  const q = questions[currentQ];
  if (!q) return (
    <div className="min-h-screen bg-purple-700 flex flex-col items-center justify-center text-white gap-4">
      <div className="text-5xl animate-bounce">⏳</div>
      <p className="text-2xl font-black">잠깐만요!</p>
      <p className="text-white/70">선생님이 게임을 준비 중이에요...</p>
    </div>
  );

  // 답변 완료
  if (phase === "answered") return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-900">
      <div className={`text-8xl mb-6 ${isCorrect ? "animate-bounce" : ""}`}>
        {isCorrect ? "🎉" : "😢"}
      </div>
      <h2 className={`text-3xl font-black mb-3 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
        {isCorrect ? "정답이에요!" : "틀렸어요!"}
      </h2>
      {isCorrect && <p className="text-yellow-300 font-bold text-xl mb-4">+100점 🌟</p>}
      <div className="bg-white/10 rounded-2xl px-8 py-4 text-center">
        <p className="text-white/60 text-sm">현재 점수</p>
        <p className="text-4xl font-black text-white">{score}점</p>
      </div>
      <p className="text-white/50 text-sm mt-6">다음 문제를 기다리는 중...</p>
    </div>
  );

  // 문제 화면
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col p-5">
      <div className="flex justify-between items-center text-white/60 text-sm mb-5">
        <span>{nickname}</span>
        <span className="text-yellow-300 font-bold">{score}점</span>
      </div>
      <div className="bg-white rounded-2xl p-5 mb-5 flex-shrink-0">
        <p className="text-lg font-black text-gray-800 text-center">{q.question}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        {q.options.map((opt: string, i: number) => (
          <button key={i} onClick={() => handleAnswer(i)}
            disabled={selected !== null}
            className={`${COLORS[i]} disabled:opacity-50 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-white transition active:scale-95`}>
            <span className="text-3xl">{SHAPES[i]}</span>
            <span className="font-bold text-base text-center">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PlayPage() {
  return <Suspense><PlayGame /></Suspense>;
}
