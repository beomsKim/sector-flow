import React, { useEffect, useState } from "react";
import { useGlobalLoading } from "../hooks/useThemeData";

export default function LoadingBar() {
  const isLoading = useGlobalLoading();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setFadeOut(false);
      setProgress(0);

      let p = 0;
      const id = setInterval(() => {
        if (p < 60)      p += Math.random() * 10 + 5;     // 빠르게
        else if (p < 80) p += Math.random() * 3 + 1;      // 보통
        else if (p < 90) p += Math.random() * 1 + 0.4;    // 느리게
        else if (p < 99) p += Math.random() * 0.2 + 0.05; // 아주 천천히
        setProgress(Math.min(p, 99));
      }, 180);
      setIntervalId(id);

    } else {
      if (intervalId) clearInterval(intervalId);
      setProgress(100);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
          setFadeOut(false);
        }, 400);
      }, 300);
    }
  }, [isLoading]);

  if (!visible) return null;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: "rgba(8,9,13,0.88)",
      backdropFilter: "blur(6px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
      opacity: fadeOut ? 0 : 1,
      transition: "opacity 0.4s ease",
    }}>
      {/* 상단 진행 바 */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: "100%", height: 3,
        background: "rgba(99,179,237,0.12)"
      }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: "linear-gradient(90deg, var(--cyan), #a78bfa)",
          borderRadius: "0 2px 2px 0",
          transition: "width 0.18s ease",
          boxShadow: "0 0 10px rgba(99,179,237,0.8)",
        }} />
      </div>

      {/* 원형 프로그레스 */}
      <div style={{ position: "relative", width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96"
          style={{ transform: "rotate(-90deg)" }}>
          <circle cx="48" cy="48" r={radius} fill="none"
            stroke="rgba(99,179,237,0.12)" strokeWidth="4" />
          <circle cx="48" cy="48" r={radius} fill="none"
            stroke="url(#progressGrad)" strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.18s ease" }}
          />
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#63b3ed" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-mono)", fontSize: "0.85rem",
          fontWeight: 700, color: "var(--cyan)"
        }}>
          {Math.round(progress)}%
        </div>
      </div>

      {/* 멘트 */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: "1rem",
          fontWeight: 700, color: "var(--text-1)", marginBottom: 6
        }}>
          오늘 자금이 어디로 흘렀는지 분석 중이에요 ✦
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
          KRX 거래 데이터를 불러오는 중입니다
        </div>
      </div>

      {/* 점 애니메이션 */}
      <div style={{ display: "flex", gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--cyan)",
            animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
