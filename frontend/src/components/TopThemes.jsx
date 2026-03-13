import React, { useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp, List } from "lucide-react";
import { useTopThemes } from "../hooks/useThemeData";

const COLORS = ["#63b3ed","#b794f4","#48bb78","#f6ad55","#fc8181","#4fd1c5","#9f7aea","#68d391","#fbd38d","#feb2b2","#76e4f7","#fbb6ce"];

// 종목 전체 모달
function StockModal({ theme, onClose }) {
  if (!theme) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-2)", border: "1px solid var(--border-hi)",
        borderRadius: 16, padding: 24, width: "100%", maxWidth: 420,
        maxHeight: "80vh", overflowY: "auto"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:"1rem", color:"var(--cyan)" }}>{theme.theme}</div>
            <div style={{ fontSize:"0.72rem", color:"var(--text-3)", marginTop:2 }}>{theme.description}</div>
          </div>
          <button onClick={onClose} style={{ background:"var(--bg-3)", border:"none", color:"var(--text-2)", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:"0.8rem" }}>닫기</button>
        </div>

        <div style={{ fontSize:"0.65rem", color:"var(--text-3)", fontFamily:"var(--font-mono)", borderBottom:"1px solid var(--border)", paddingBottom:6, marginBottom:8, display:"flex", justifyContent:"space-between" }}>
          <span>종목명 / 코드</span><span>거래대금</span>
        </div>

        {theme.stocks.map((s, i) => (
          <div key={s.code} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)"
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.65rem", color:"var(--text-3)", width:18, textAlign:"right" }}>{i+1}</span>
              <div>
                <div style={{ fontSize:"0.82rem", fontWeight:500 }}>{s.name}</div>
                <div style={{ fontSize:"0.65rem", color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>{s.code}</div>
              </div>
            </div>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.78rem", fontWeight:600, color: s.volume > 0 ? "var(--text-1)" : "var(--text-3)" }}>
              {s.volume_formatted || "0"}
            </span>
          </div>
        ))}

        <div style={{ marginTop:12, padding:"8px 12px", background:"rgba(99,179,237,0.06)", borderRadius:8, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:"0.72rem", color:"var(--text-3)" }}>테마 합계</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.82rem", fontWeight:700, color:"var(--cyan)" }}>{theme.total_volume_formatted}</span>
        </div>
      </div>
    </div>
  );
}

export default function TopThemes({ market, onThemeSelect, date, selectedTheme }) {
  const { data, loading, error } = useTopThemes(market, 20, date);
  const [expanded, setExpanded] = useState(null);
  const [modalTheme, setModalTheme] = useState(null);

  const maxVol = data[0]?.total_volume || 1;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ background:"rgba(99,179,237,0.12)", border:"1px solid rgba(99,179,237,0.25)" }}>
            <TrendingUp size={15} color="#63b3ed" />
          </div>
          <div>
            <div className="card-title">자금 유입 TOP</div>
            <div className="card-sub">거래대금 기준 테마 순위</div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {error && <div className="empty-state">데이터 로드 실패: {error}</div>}
        {loading && Array.from({length:6}).map((_,i) => (
          <div key={i} style={{marginBottom:8}}><div className="skel" style={{height:52}} /></div>
        ))}
        {!loading && !error && data.length === 0 && <div className="empty-state">데이터가 없습니다</div>}

        {!loading && data.map((theme, idx) => {
          const color = COLORS[idx % COLORS.length];
          const ratio = (theme.total_volume / maxVol) * 100;
          const isOpen = expanded === theme.theme;
          const isSelected = selectedTheme === theme.theme;

          return (
            <div
              key={theme.theme}
              className="theme-item fade-up"
              style={{
                animationDelay: `${idx * 0.03}s`,
                background: isSelected ? "rgba(99,179,237,0.08)" : undefined,
                border: isSelected ? "1px solid rgba(99,179,237,0.3)" : "1px solid transparent",
                borderRadius: 10,
                cursor: "pointer"
              }}
              onClick={() => {
                setExpanded(isOpen ? null : theme.theme);
                onThemeSelect?.(theme.theme);
              }}
            >
              <div className="theme-item-top">
                <span className={`theme-rank ${idx < 3 ? "top" : ""}`}>{idx+1}</span>
                <div className="theme-info">
                  <div className="theme-name" style={{ color: isSelected ? "var(--cyan)" : undefined }}>
                    {theme.theme}
                  </div>
                  <div className="theme-desc">{theme.description}</div>
                </div>
                <span className="theme-vol" style={{ color }}>{theme.total_volume_formatted}</span>

                {/* 종목 전체 보기 버튼 */}
                <button
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "none",
                    borderRadius: 6, padding: "3px 7px", cursor: "pointer",
                    color: "var(--text-3)", display:"flex", alignItems:"center", gap:3,
                    fontSize:"0.65rem"
                  }}
                  onClick={e => { e.stopPropagation(); setModalTheme(theme); }}
                  title="종목 전체 보기"
                >
                  <List size={11} />
                  <span>{theme.stocks?.length}</span>
                </button>

                {isOpen ? <ChevronUp size={13} color="var(--text-3)" /> : <ChevronDown size={13} color="var(--text-3)" />}
              </div>

              <div className="theme-bar-track">
                <div className="theme-bar-fill" style={{
                  width: `${ratio}%`,
                  background: isSelected
                    ? `linear-gradient(90deg, var(--cyan), #63b3ed88)`
                    : `linear-gradient(90deg, ${color}, ${color}88)`
                }} />
              </div>

              {/* 인라인 종목 미리보기 (TOP5) */}
              {isOpen && (
                <div className="theme-stocks">
                  {theme.stocks.slice(0,5).map(s => (
                    <div key={s.code} className="stock-row">
                      <span>
                        <span className="stock-name">{s.name}</span>
                        <span className="stock-code">{s.code}</span>
                      </span>
                      <span className="stock-vol">{s.volume_formatted}</span>
                    </div>
                  ))}
                  {theme.stocks.length > 5 && (
                    <div
                      style={{ fontSize:"0.7rem", color:"var(--cyan)", textAlign:"center", padding:"6px 0", cursor:"pointer" }}
                      onClick={e => { e.stopPropagation(); setModalTheme(theme); }}
                    >
                      전체 {theme.stocks.length}개 종목 보기 →
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 종목 전체 모달 */}
      <StockModal theme={modalTheme} onClose={() => setModalTheme(null)} />
    </div>
  );
}
