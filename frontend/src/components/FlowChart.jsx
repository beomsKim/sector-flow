import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { BarChart2, TrendingUp, List } from "lucide-react";
import { useThemeChart, useThemeRanking } from "../hooks/useThemeData";

const PERIODS = [
  { label: "1W",  value: 1  },
  { label: "2W",  value: 2  },
  { label: "4W",  value: 4  },
  { label: "8W",  value: 8  },
  { label: "12W", value: 12 },
  { label: "24W", value: 24 },
  { label: "52W", value: 52 },
  { label: "100W", value: 100 },
];

const UP   = "var(--up)";
const DOWN = "var(--dn)";
const FLAT = "#4a5568";

const RANK_COLORS = ["#63b3ed","#b794f4","#48bb78","#f6ad55","#fc8181","#4fd1c5","#9f7aea","#68d391","#fbd38d","#feb2b2","#76e4f7","#fbb6ce"];

function fmt(v) {
  if (!v) return "0";
  if (v >= 1_000_000_000_000) return `${(v/1_000_000_000_000).toFixed(1)}조`;
  if (v >= 100_000_000)       return `${(v/100_000_000).toFixed(0)}억`;
  if (v >= 10_000)            return `${(v/10_000).toFixed(0)}만`;
  return String(v);
}

function barColor(data, i) {
  if (i === 0) return FLAT;
  return data[i].volume > data[i-1].volume ? UP : DOWN;
}

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div style={{ background:"var(--bg-2)", border:"1px solid var(--border-hi)", borderRadius:8, padding:"8px 14px" }}>
      <div style={{ fontSize:"0.7rem", color:"var(--text-3)", marginBottom:3 }}>{label}</div>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.88rem", fontWeight:700, color:"var(--cyan)" }}>{fmt(v)}</div>
    </div>
  );
}

/* ── 테마 랭킹 탭 ── */
function RankingTab({ market, date, onThemeSelect }) {
  const { data, loading } = useThemeRanking(market, date);
  if (loading) return <div className="skel" style={{height:300}} />;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", padding:"0 4px 8px", fontSize:"0.69rem", color:"var(--text-3)", fontFamily:"var(--font-mono)", borderBottom:"1px solid var(--border)", marginBottom:6 }}>
        <span>#  테마</span><span style={{ display:"flex", gap:20 }}><span>등락률</span><span>거래대금</span></span>
      </div>
      {data.map((item, idx) => {
        const color = RANK_COLORS[idx % RANK_COLORS.length];
        const maxVol = data[0]?.total_volume || 1;
        const ratio = (item.total_volume / maxVol) * 100;
        const chg = item.avg_change_pct;
        return (
          <div key={item.theme}
            style={{ padding:"8px 4px", borderBottom:"1px solid rgba(255,255,255,0.03)", cursor:"pointer" }}
            onClick={() => onThemeSelect?.(item.theme)}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.69rem", color: idx<3?["#f6ad55","#a0aec0","#c6a05a"][idx]:"var(--text-3)", width:18, textAlign:"center" }}>{idx+1}</span>
                <span style={{ fontSize:"0.85rem", fontWeight:600 }}>{item.theme}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {chg !== undefined && (
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.72rem", fontWeight:700,
                    color: chg > 0 ? "var(--up)" : chg < 0 ? "var(--dn)" : "var(--text-3)" }}>
                    {chg > 0 ? "+" : ""}{chg?.toFixed(2)}%
                  </span>
                )}
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.82rem", fontWeight:700, color }}>{item.total_volume_formatted}</span>
              </div>
            </div>
            <div style={{ height:2, background:"var(--bg-3)", borderRadius:99, overflow:"hidden", marginLeft:26 }}>
              <div style={{ height:"100%", width:`${ratio}%`, background:color, borderRadius:99 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StocksTab({ themeName, date }) {
  const [order, setOrder] = useState("desc"); // desc=높은순 asc=낮은순
  const [stocks, setStocks] = useState([]);
  const [avgChange, setAvgChange] = useState(null);
  const [loading, setLoading] = useState(false);
  const BASE_URL = typeof import.meta !== "undefined" ? (import.meta.env?.VITE_API_URL || "http://localhost:8000") : "http://localhost:8000";

  useEffect(() => {
    if (!themeName) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/themes/${encodeURIComponent(themeName)}/stocks?sort=change&order=${order}&date=${date||""}`)
      .then(r => r.json())
      .then(d => { setStocks(d.stocks || []); setAvgChange(d.avg_change_pct); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [themeName, order, date]);

  return (
    <div>
      {/* 정렬 + 평균 */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <div>
          <div style={{ fontSize:"0.69rem", fontWeight:600, color:"var(--text-2)" }}>전일 대비 등락률</div>
          <div style={{ fontSize:"0.69rem", color:"var(--text-3)", marginTop:1 }}>전일 종가 대비 기준</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {avgChange !== null && <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.72rem", fontWeight:700,
            color: avgChange > 0 ? "var(--up)" : avgChange < 0 ? "var(--dn)" : "var(--text-3)" }}>
            평균 {avgChange > 0 ? "+" : ""}{avgChange?.toFixed(2)}%
          </span>}
          <div style={{ display:"flex", gap:3 }}>
            <button onClick={() => setOrder("desc")} style={{ background:order==="desc"?"var(--bg-3)":"var(--bg-2)", border:`1px solid ${order==="desc"?"var(--up)":"var(--border)"}`, borderRadius:6, padding:"3px 8px", color:order==="desc"?"var(--up)":"var(--text-3)", fontSize:"0.69rem", cursor:"pointer", fontFamily:"var(--font-mono)" }}>높은순↓</button>
            <button onClick={() => setOrder("asc")}  style={{ background:order==="asc"?"var(--bg-3)":"var(--bg-2)",  border:`1px solid ${order==="asc"?"var(--dn)":"var(--border)"}`,  borderRadius:6, padding:"3px 8px", color:order==="asc"?"var(--dn)":"var(--text-3)",  fontSize:"0.69rem", cursor:"pointer", fontFamily:"var(--font-mono)" }}>낮은순↑</button>
          </div>
        </div>
      </div>
      {/* 헤더 */}
      <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 6px", fontSize:"0.69rem", color:"var(--text-3)", fontFamily:"var(--font-mono)", borderBottom:"1px solid var(--border)", marginBottom:4 }}>
        <span>종목</span>
        <span style={{ display:"flex", gap:20 }}><span>전일대비</span><span>거래대금</span></span>
      </div>
      {loading && <div className="skel" style={{height:200}} />}
      {!loading && stocks.map((s, i) => {
        const chg = s.change_pct;
        return (
          <div key={s.code} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 6px", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.69rem", color:"var(--text-3)", width:16, textAlign:"right" }}>{i+1}</span>
              <div>
                <div style={{ fontSize:"0.82rem", fontWeight:600 }}>{s.name}</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.69rem", color:"var(--text-3)" }}>{s.code}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:14, textAlign:"right" }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.72rem", fontWeight:700,
                color: chg > 0 ? "var(--up)" : chg < 0 ? "var(--dn)" : "var(--text-3)" }}>
                {chg !== undefined ? `${chg > 0 ? "+" : ""}${chg?.toFixed(2)}%` : "-"}
              </span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.72rem", color:"var(--text-2)" }}>{s.volume_formatted || "-"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FlowChart({ themeName, market, date, large = true }) {
  const [weeks, setWeeks] = useState(1);
  const [tab, setTab] = useState("chart"); // chart | ranking | stocks
  const { data, loading } = useThemeChart(themeName, weeks, market, date);

  const first = data[0]?.volume || 0;
  const last  = data[data.length-1]?.volume || 0;
  const chg   = first > 0 ? ((last - first) / first * 100) : 0;
  const isUp  = chg >= 0;
  const line  = data.length > 0 ? (isUp ? UP : DOWN) : "var(--cyan)";

  const chartH = large ? 320 : 200;
  const barH   = large ? 70  : 45;

  return (
    <div className="card" style={{ height: large ? "auto" : undefined }}>
      {/* 헤더 */}
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ background:"rgba(183,148,244,0.12)", border:"1px solid rgba(183,148,244,0.25)" }}>
            <BarChart2 size={15} color="#b794f4" />
          </div>
          <div>
            <div className="card-title">
              {tab === "chart" ? "자금 흐름 차트" : "테마 거래대금 랭킹"}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:"1.1rem", fontWeight:800, fontFamily:"var(--font-display)", color: themeName ? "var(--cyan)" : "var(--text-3)", letterSpacing:"0.02em" }}>
                {tab === "chart" ? (themeName || "← 테마를 선택하세요") : "전체 섹터 비교"}
              </span>
              {tab === "chart" && themeName && data.length > 0 && (
                <span style={{
                  fontFamily:"var(--font-mono)", fontSize:"0.69rem", fontWeight:700,
                  color: isUp ? UP : DOWN,
                  background: isUp ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)",
                  padding:"1px 6px", borderRadius:4
                }}>
                  {isUp ? "▲" : "▼"} {Math.abs(chg).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 탭 전환 */}
        <div className="period-tabs">
          <button className={`period-btn ${tab==="chart"?"active":""}`} onClick={() => setTab("chart")}>
            차트
          </button>
          <button className={`period-btn ${tab==="ranking"?"active":""}`} onClick={() => setTab("ranking")}>
            <List size={11} style={{display:"inline",marginRight:3}} />랭킹
          </button>
          <button className={`period-btn ${tab==="stocks"?"active":""}`} onClick={() => setTab("stocks")}>
            종목
          </button>
        </div>
      </div>

      {/* 기간 탭 (차트 모드) */}
      {tab === "chart" && (
        <div style={{ display:"flex", gap:2, padding:"8px 16px", borderBottom:"1px solid var(--border)", overflowX:"auto" }}>
          {PERIODS.map(p => (
            <button key={p.value} className={`period-btn ${weeks===p.value?"active":""}`} onClick={() => setWeeks(p.value)}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="card-body">
        {/* 랭킹 탭 */}
        {tab === "ranking" && (
          <RankingTab market={market} date={date} onThemeSelect={(t) => { setTab("chart"); }} />
        )}
        {tab === "stocks" && (
          <StocksTab themeName={themeName} date={date} />
        )}

        {/* 차트 탭 */}
        {tab === "chart" && (
          <>
            {!themeName && (
              <div className="chart-empty" style={{ height: chartH }}>
                <TrendingUp size={40} className="chart-empty-icon" />
                <span>왼쪽에서 테마를 선택하세요</span>
              </div>
            )}

            {themeName && loading && <div className="skel" style={{ height: chartH + barH + 60 }} />}

            {themeName && !loading && data.length === 0 && (
              <div className="chart-empty" style={{ height: chartH }}>데이터 없음</div>
            )}

            {themeName && !loading && data.length > 0 && (
              <>
                {/* 요약 스탯 */}
                <div style={{ display:"flex", gap:0, marginBottom:16, borderRadius:10, overflow:"hidden", border:"1px solid var(--border)" }}>
                  {[
                    { label:"기간 시작", value:fmt(first),                                    color:"var(--text-2)" },
                    { label:"최고",     value:fmt(Math.max(...data.map(d=>d.volume))),        color:UP },
                    { label:"최저",     value:fmt(Math.min(...data.map(d=>d.volume))),        color:DOWN },
                    { label:"최근",     value:fmt(last),                                      color:"var(--cyan)" },
                    { label:"등락",     value:`${isUp?"▲":"▼"} ${Math.abs(chg).toFixed(1)}%`, color: isUp?UP:DOWN },
                  ].map((s, i) => (
                    <div key={s.label} style={{
                      flex:1, textAlign:"center", padding:"10px 6px",
                      borderRight: i < 4 ? "1px solid var(--border)" : "none",
                      background:"var(--bg-2)"
                    }}>
                      <div style={{ fontSize:"0.69rem", color:"var(--text-3)", marginBottom:4 }}>{s.label}</div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.78rem", fontWeight:700, color:s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* 메인 영역 차트 */}
                <ResponsiveContainer width="100%" height={chartH}>
                  <AreaChart data={data} margin={{top:8, right:8, left:0, bottom:0}}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={line} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={line} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill:"var(--text-3)", fontSize:10, fontFamily:"var(--font-mono)" }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => v.slice(5)}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill:"var(--text-3)", fontSize:10, fontFamily:"var(--font-mono)" }}
                      axisLine={false} tickLine={false}
                      tickFormatter={fmt} width={46}
                    />
                    <Tooltip content={<Tip />} />
                    <Area
                      type="monotone" dataKey="volume"
                      stroke={line} strokeWidth={2}
                      fill="url(#grad)"
                      dot={false}
                      activeDot={{ r:5, fill:line, strokeWidth:0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* 거래량 강도 바 */}
                <div style={{ marginTop:4 }}>
                  <ResponsiveContainer width="100%" height={barH}>
                    <BarChart data={data} margin={{top:0, right:8, left:0, bottom:0}}>
                      <Bar dataKey="volume" radius={[2,2,0,0]}>
                        {data.map((_,i) => <Cell key={i} fill={barColor(data,i)} fillOpacity={0.7} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
