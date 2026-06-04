"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Player = { id: string; nickname: string; score: number };
type Question = { id: string; question: string; options: string[]; answer: number; order_num: number };

const COLORS = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500"];
const SHAPES = ["▲", "◆", "●", "■"];

export default function HostPage() {
  const router = useRouter();
  const { id } = useParams();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<"lobby" | "question" | "answer" | "leaderboard" | "end">("lobby");
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answerCounts, setAnswerCounts] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => { fetchData(); }, [id]);

  // 3초마다 자동 새로고침 (실시간 백업)
  useEffect(() => {
    const interval = setInterval(() => { fetchPlayers(); }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 실시간 플레이어 업데이트
  useEffect(() => {
    const channel = supabase.channel("players-" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `quiz_id=eq.${id}` },
        () => fetchPlayers())
      .on("postgres_changes", { event: "*", schema: "public", table: "answers" },
        () => fetchAnswerCounts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, currentQ]);

  // 타이머
  useEffect(() => {
    if (phase !== "question") return;
    setTimeLeft(20);
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); showAnswer(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, currentQ]);

  const fetchData = async () => {
    const { data: q } = await supabase.from("quizzes").select("*").eq("id", id).single();
    setQuiz(q);
    const { data: qs } = await supabase.from("questions").select("*").eq("quiz_id", id).order("order_num");
    setQuestions(qs || []);
    fetchPlayers();
  };

  const fetchPlayers = async () => {
    const { data } = await supabase.from("players").select("*").eq("quiz_id", id).order("score", { ascending: false });
    setPlayers(data || []);
  };

  const fetchAnswerCounts = async () => {
    if (!questions[currentQ]) return;
    const { data } = await supabase.from("answers").select("selected").eq("question_id", questions[currentQ].id);
    const counts = [0, 0, 0, 0];
    (data || []).forEach((a: any) => { if (counts[a.selected] !== undefined) counts[a.selected]++; });
    setAnswerCounts(counts);
  };

  const startGame = async () => {
    await supabase.from("quizzes").update({ is_active: true, current_question: 0 }).eq("id", id);
    setPhase("question");
    setCurrentQ(0);
  };

  const showAnswer = () => {
    fetchAnswerCounts();
    setPhase("answer");
  };

  const nextQuestion = async () => {
    const next = currentQ + 1;
    if (next >= questions.length) {
      await supabase.from("quizzes").update({ is_active: false }).eq("id", id);
      fetchPlayers();
      setPhase("end");
    } else {
      await supabase.from("quizzes").update({ current_question: next }).eq("id", id);
      setCurrentQ(next);
      setAnswerCounts([0, 0, 0, 0]);
      setPhase("question");
    }
  };

  if (!quiz) return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>;

  const q = questions[currentQ];
  const totalAnswers = answerCounts.reduce((a, b) => a + b, 0);

  // 로비
  if (phase === "lobby") return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-blue-700 flex flex-col items-center justify-center p-8 text-white">
      <h1 className="text-4xl font-black mb-2">{quiz.title}</h1>
      <p className="text-white/70 mb-8">참가자들이 입장하길 기다리는 중...</p>
      <div className="bg-white/20 backdrop-blur rounded-3xl px-10 py-6 mb-8 text-center">
        <p className="text-white/80 text-sm mb-2">게임 핀번호</p>
        <p className="text-6xl font-black tracking-widest text-yellow-300">{quiz.pin}</p>
        <p className="text-white/70 text-sm mt-2">퀴즈쇼 사이트에서 입력하세요</p>
      </div>
      <div className="bg-white/10 rounded-2xl p-6 w-full max-w-lg mb-8">
        <p className="text-center text-white/80 mb-4">참가자 <span className="font-black text-yellow-300 text-xl">{players.length}</span>명</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {players.map(p => (
            <span key={p.id} className="bg-white/20 px-4 py-2 rounded-full text-sm font-bold">{p.nickname}</span>
          ))}
        </div>
      </div>
      <button onClick={startGame} disabled={players.length === 0}
        className="bg-green-400 hover:bg-green-500 disabled:opacity-40 text-white font-black text-2xl px-12 py-5 rounded-2xl transition">
        게임 시작! 🎮
      </button>
    </div>
  );

  // 문제 화면
  if (phase === "question" && q) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 to-purple-700 flex flex-col p-6">
      <div className="flex items-center justify-between text-white mb-6">
        <span className="font-bold">{currentQ + 1} / {questions.length}</span>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl ${timeLeft <= 5 ? "bg-red-500 animate-pulse" : "bg-white/20"}`}>
          {timeLeft}
        </div>
        <span className="font-bold">{players.length}명 참가</span>
      </div>
      <div className="bg-white rounded-2xl p-6 mb-6 text-center">
        <p className="text-xl font-black text-gray-800">{q.question}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        {q.options.map((opt, i) => (
          <div key={i} className={`${COLORS[i]} rounded-2xl p-5 flex items-center gap-3 text-white`}>
            <span className="text-3xl font-black">{SHAPES[i]}</span>
            <span className="font-bold text-lg">{opt}</span>
          </div>
        ))}
      </div>
      <button onClick={showAnswer} className="mt-4 bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-xl text-sm transition">
        지금 정답 보기
      </button>
    </div>
  );

  // 정답 화면
  if (phase === "answer" && q) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 to-purple-700 flex flex-col p-6">
      <h2 className="text-white font-black text-xl text-center mb-4">정답 발표! 🎉</h2>
      <div className="bg-white rounded-2xl p-5 mb-5 text-center">
        <p className="text-lg font-bold text-gray-700 mb-2">{q.question}</p>
        <p className="text-2xl font-black text-green-600">✅ {q.options[q.answer]}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {q.options.map((opt, i) => (
          <div key={i} className={`${COLORS[i]} ${i === q.answer ? "ring-4 ring-white scale-105" : "opacity-60"} rounded-2xl p-4 transition-all`}>
            <div className="flex items-center gap-2 text-white mb-2">
              <span className="text-2xl">{SHAPES[i]}</span>
              <span className="font-bold">{opt}</span>
              {i === q.answer && <span className="ml-auto text-lg">✅</span>}
            </div>
            <div className="bg-white/30 rounded-full h-2 mb-1">
              <div className="bg-white rounded-full h-2 transition-all"
                style={{ width: totalAnswers > 0 ? `${(answerCounts[i] / totalAnswers) * 100}%` : "0%" }} />
            </div>
            <p className="text-white/90 text-xs text-right">{answerCounts[i]}명</p>
          </div>
        ))}
      </div>
      <button onClick={nextQuestion}
        className="w-full bg-green-400 hover:bg-green-500 text-white font-black text-xl py-4 rounded-2xl transition">
        {currentQ + 1 >= questions.length ? "결과 보기 🏆" : "다음 문제 →"}
      </button>
    </div>
  );

  // 최종 결과
  if (phase === "end") return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 flex flex-col items-center p-8">
      <div className="text-6xl mb-4">🏆</div>
      <h1 className="text-4xl font-black text-white mb-2">게임 종료!</h1>
      <p className="text-white/80 mb-8">{quiz.title}</p>
      <div className="w-full max-w-md space-y-3">
        {players.slice(0, 10).map((p, i) => (
          <div key={p.id} className={`flex items-center gap-4 rounded-2xl p-4 ${i === 0 ? "bg-yellow-300" : i === 1 ? "bg-gray-200" : i === 2 ? "bg-orange-200" : "bg-white"}`}>
            <span className="text-2xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
            <span className="flex-1 font-bold text-gray-800">{p.nickname}</span>
            <span className="font-black text-purple-600">{p.score}점</span>
          </div>
        ))}
      </div>
      <button onClick={() => router.push("/admin")} className="mt-8 bg-white text-purple-600 font-black px-8 py-4 rounded-2xl">
        대시보드로 →
      </button>
    </div>
  );

  return null;
}
