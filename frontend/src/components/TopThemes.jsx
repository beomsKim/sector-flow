import React, { useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp, List } from "lucide-react";
import { useTopThemes } from "../hooks/useThemeData";

const COLORS = ["#63b3ed","#b794f4","#48bb78","#f6ad55","#fc8181","#4fd1c5","#9f7aea","#68d391","#fbd38d","#feb2b2","#76e4f7","#fbb6ce"];

function ChangeBadge({ value, size = "0.69rem" }) {
  if (value === undefined || value === null) return null;
  const color = value > 0 ? "var(--up)" : value < 0 ? "var(--dn)" : "var(--text-3)";
  const arrow = value > 0 ? "▲" : value < 0 ? "▼" : "";
  return (
    <span style={{ fontFamily:"var(--font-mono)", fontSize:size, fontWeight:700, color, display:"inline-flex", alignItems:"center", gap:2 }}>
      {arrow}{value > 0 ? "+" : ""}{value?.toFixed(2)}%
    </span>
  );
}

// 종목 링크 헬퍼
function StockLink({ code, name, market = "kr" }) {
  const url = market === "us"
    ? `https://finance.yahoo.com/quote/${code}`
    : `https://finance.naver.com/item/main.naver?code=${code}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ color:"inherit", textDecoration:"none" }}
      onClick={e => e.stopPropagation()}
      onMouseEnter={e => e.currentTarget.style.color = "var(--cyan)"}
      onMouseLeave={e => e.currentTarget.style.color = "inherit"}
    >
      {name}
    </a>
  );
}

// 종목 전체 모달 — 등락률 + 정렬 포함
function StockModal({ theme, onClose }) {
  const [sortKey, setSortKey] = useState("volume");   // volume | vol_change_amount | vol_change_pct | change_pct
  const [order, setOrder]     = useState("desc");

  if (!theme) return null;

  const sorted = [...(theme.stocks || [])].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    return order === "desc" ? bv - av : av - bv;
  });

  const SORT_OPTS = [
    { key: "volume",            label: "오늘 거래대금",       unit: "원" },
    { key: "vol_change_amount", label: "거래대금 증가액",     unit: "원" },
    { key: "vol_change_pct",    label: "거래대금 증가율",     unit: "%" },
    { key: "change_pct",        label: "주가 등락률",         unit: "%" },
  ];

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20
    }} onClick={onClose}>
      <div style={{
        background:"var(--bg-2)", border:"1px solid var(--border-hi)",
        borderRadius:16, padding:24, width:"100%", maxWidth:460,
        maxHeight:"85vh", overflowY:"auto"
      }} onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:"1rem", color:"var(--cyan)" }}>{theme.theme}</div>
            <div style={{ fontSize:"0.72rem", color:"var(--text-3)", marginTop:2 }}>{theme.description}</div>
          </div>
          <button onClick={onClose} style={{ background:"var(--bg-3)", border:"none", color:"var(--text-2)", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:"0.8rem" }}>닫기</button>
        </div>

        {/* 요약 */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(99,179,237,0.06)", borderRadius:8, padding:"8px 12px", marginBottom:4 }}>
          <div>
            <div style={{ fontSize:"0.7rem", color:"var(--text-3)" }}>섹터 평균 등락률</div>
            <div style={{ fontSize:"0.69rem", color:"var(--text-3)", marginTop:1 }}>전일 종가 대비 기준</div>
          </div>
          <ChangeBadge value={theme.avg_change_pct} size="0.88rem" />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.82rem", fontWeight:700, color:"var(--cyan)" }}>{theme.total_volume_formatted}</span>
        </div>

        {/* 정렬 */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:"0.69rem", color:"var(--text-3)", fontFamily:"var(--font-mono)", marginBottom:5 }}>정렬 기준</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:6 }}>
            {SORT_OPTS.map(o => (
              <button key={o.key} onClick={() => { setSortKey(o.key); setOrder("desc"); }} style={{
                background: sortKey===o.key ? "var(--bg-3)" : "var(--bg-2)",
                border: `1px solid ${sortKey===o.key ? "var(--cyan)" : "var(--border)"}`,
                borderRadius:6, padding:"3px 9px",
                color: sortKey===o.key ? "var(--cyan)" : "var(--text-3)",
                fontSize:"0.69rem", cursor:"pointer", fontFamily:"var(--font-mono)"
              }}>{o.label}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:4 }}>
            <button onClick={() => setOrder("desc")} style={{ background:order==="desc"?"var(--bg-3)":"var(--bg-2)", border:`1px solid ${order==="desc"?"var(--up)":"var(--border)"}`, borderRadius:6, padding:"2px 10px", color:order==="desc"?"var(--up)":"var(--text-3)", fontSize:"0.69rem", cursor:"pointer" }}>높은순 ↓</button>
            <button onClick={() => setOrder("asc")}  style={{ background:order==="asc"?"var(--bg-3)":"var(--bg-2)",  border:`1px solid ${order==="asc"?"var(--dn)":"var(--border)"}`,  borderRadius:6, padding:"2px 10px", color:order==="asc"?"var(--dn)":"var(--text-3)",  fontSize:"0.69rem", cursor:"pointer" }}>낮은순 ↑</button>
          </div>
        </div>

        {/* 컬럼 헤더 */}
        <div style={{ fontSize:"0.69rem", color:"var(--text-3)", fontFamily:"var(--font-mono)", borderBottom:"1px solid var(--border)", paddingBottom:5, marginBottom:6, display:"flex", justifyContent:"space-between" }}>
          <span>#  종목명</span>
          <span style={{ display:"flex", gap:8 }}><span>주가등락</span><span>거래대금↑%</span><span>거래대금</span></span>
        </div>

        {/* 종목 리스트 */}
        {sorted.map((s, i) => (
          <div key={s.code} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.69rem", color:"var(--text-3)", width:18, textAlign:"right" }}>{i+1}</span>
              <div>
                <div style={{ fontSize:"0.82rem", fontWeight:500 }}><StockLink code={s.code} name={s.name} market="kr" /></div>
                <div style={{ fontSize:"0.69rem", color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>{s.code}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, textAlign:"right" }}>
              <ChangeBadge value={s.change_pct} size="0.68rem" />
              <ChangeBadge value={s.vol_change_pct} size="0.68rem" />
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.75rem", fontWeight:600, color: s.volume > 0 ? "var(--text-1)" : "var(--text-3)" }}>
                {s.volume_formatted || "0"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TopThemes({ market, onThemeSelect, date, selectedTheme, isMobile = false, onGoToChart }) {
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
                // 모바일이 아닐 때만 차트로 이동 (모바일은 아코디언 유지)
                if (!isMobile) return;
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

                {/* 거래대금 + 평균 등락률 */}
                <div style={{ textAlign:"right" }}>
                  <div className="theme-vol" style={{ color }}>{theme.total_volume_formatted}</div>
                  <ChangeBadge value={theme.avg_change_pct} />
                </div>

                {/* 종목 전체 보기 버튼 */}
                <button
                  style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:6, padding:"3px 7px", cursor:"pointer", color:"var(--text-3)", display:"flex", alignItems:"center", gap:3, fontSize:"0.69rem" }}
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

              {/* 인라인 종목 미리보기 TOP5 */}
              {isOpen && (
                <div className="theme-stocks">
                  {/* 모바일: 차트 보기 버튼 */}
                  {isMobile && (
                    <button
                      onClick={e => { e.stopPropagation(); onGoToChart?.(); }}
                      style={{
                        width:"100%", marginBottom:8, padding:"7px 0",
                        background:"rgba(99,179,237,0.1)", border:"1px solid rgba(99,179,237,0.3)",
                        borderRadius:8, color:"var(--cyan)", fontSize:"0.78rem",
                        fontWeight:600, cursor:"pointer", display:"flex",
                        alignItems:"center", justifyContent:"center", gap:6
                      }}
                    >
                      📊 {theme.theme} 차트 보기 →
                    </button>
                  )}
                  {theme.stocks.slice(0,5).map(s => (
                    <div key={s.code} className="stock-row">
                      <span>
                        <StockLink code={s.code} name={s.name} market="kr" />
                        <span className="stock-code">{s.code}</span>
                      </span>
                      <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <ChangeBadge value={s.change_pct} />
                        <span className="stock-vol">{s.volume_formatted}</span>
                      </span>
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
