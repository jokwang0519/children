"use client";
import { useRouter, usePathname } from "next/navigation";

const menus = [
  { label: "🏠 홈", path: "/" },
  { label: "🌱 작물관리", path: "/crops" },
  { label: "🗓 작업일지", path: "/work" },
  { label: "💰 수입/지출", path: "/finance" },
  { label: "🚜 농기계", path: "/equipment" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="bg-[#2d5a27] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-0 flex items-center justify-between h-16">
        <button onClick={() => router.push("/")} className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <div>
            <p className="font-black text-base leading-tight">참외농장</p>
            <p className="text-green-300 text-xs leading-tight">스마트팜 관리시스템</p>
          </div>
        </button>
        <div className="hidden md:flex items-center gap-1">
          {menus.map(m => (
            <button key={m.path} onClick={() => router.push(m.path)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                pathname === m.path
                  ? "bg-white/20 text-white"
                  : "text-green-200 hover:bg-white/10 hover:text-white"
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {/* 모바일 하단 메뉴 */}
      <div className="md:hidden flex border-t border-green-700">
        {menus.map(m => (
          <button key={m.path} onClick={() => router.push(m.path)}
            className={`flex-1 py-2 text-xs font-medium transition ${
              pathname === m.path ? "bg-white/20 text-white" : "text-green-300"
            }`}>
            {m.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
