import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, TrendingUp, Zap, BarChart2, Calendar, Settings } from "lucide-react";
import TopThemes from "./components/TopThemes";
import FlowChart from "./components/FlowChart";
import SurgeAlert from "./components/SurgeAlert";
import AdminPage from "./pages/AdminPage";
import { getDefaultDate, formatDateDisplay, useTopThemes } from "./hooks/useThemeData";

export default function App() {
  const [market, setMarket] = useState("kr");
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("top");
  const [date, setDate] = useState(getDefaultDate());
  const [page, setPage] = useState("dashboard"); // dashboard | admin

  const handleRefresh = () => { setRefreshKey(k => k + 1); setSelectedTheme(null); };
  const dateInputValue = `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`;
  const handleDateChange = (e) => {
    const val = e.target.value.replace(/-/g, "");
    if (val.length === 8) setDate(val);
  };

  const { data: topData } = useTopThemes(market, 20, date);
  useEffect(() => {
    if (topData?.length > 0 && !selectedTheme) setSelectedTheme(topData[0].theme);
  }, [topData]);
  useEffect(() => { setSelectedTheme(null); }, [date, market]);

  // 관리자 페이지
  if (page === "admin") return (
    <div className="app-root">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon"><Activity size={14} color="#000" strokeWidth={2.5} /></div>
            <span className="logo-text">SECTOR<span className="logo-accent">FLOW</span></span>
            <span className="logo-badge">ADMIN</span>
          </div>
        </div>
      </header>
      <main className="main">
        <AdminPage onBack={() => setPage("dashboard")} />
      </main>
    </div>
  );

  return (
    <div className="app-root">
      <header className="header">
        {/* 1줄: 로고 + 아이콘 버튼 */}
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon"><Activity size={14} color="#000" strokeWidth={2.5} /></div>
            <span className="logo-text">SECTOR<span className="logo-accent">FLOW</span></span>
            <span className="logo-badge">BETA</span>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <button className="refresh-btn" onClick={handleRefresh} title="새로고침"><RefreshCw size={14}/></button>
            <button className="refresh-btn" onClick={() => setPage("admin")} title="테마 관리">
              <Settings size={14}/>
            </button>
          </div>
        </div>

        {/* 2줄: 날짜 + 마켓탭 — 모바일에서도 항상 표시 */}
        <div className="header-controls-row">
          <div className="date-picker-wrap" onClick={e => { const inp = e.currentTarget.querySelector("input"); inp?.showPicker?.(); }} style={{ cursor:"pointer" }}>
            <Calendar size={13} color="var(--text-3)" />
            <input type="date" className="date-input" value={dateInputValue}
              max={new Date().toISOString().slice(0,10)} onChange={handleDateChange} />
            <span style={{ fontSize:"0.69rem", color:"var(--text-3)", whiteSpace:"nowrap", marginLeft:4 }}>최대 수년치</span>
          </div>
          <div className="market-tabs">
            {[{value:"kr",label:"KR",sub:"한국"},{value:"us",label:"US",sub:"미국"}].map(m => (
              <button key={m.value} className={`market-btn ${market===m.value?"active":""}`} onClick={() => setMarket(m.value)}>
                <span className="market-label">{m.label}</span>
                <span className="market-sub">{m.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="date-bar">
          <span className="date-bar-label">조회일</span>
          <span className="date-bar-value">{formatDateDisplay(date)}</span>
          <span className="date-bar-hint">장 마감 후 데이터 기준</span>
        </div>
        <div className="mobile-tabs">
          {[
            {id:"top",   icon:<TrendingUp size={14}/>, label:"TOP"},
            {id:"chart", icon:<BarChart2 size={14}/>,  label:"차트"},
            {id:"surge", icon:<Zap size={14}/>,        label:"급증"},
          ].map(t => (
            <button key={t.id} className={`mobile-tab-btn ${activeTab===t.id?"active":""}`} onClick={() => setActiveTab(t.id)}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="main" key={`${refreshKey}-${date}-${market}`}>
        <div className="desktop-grid">
          <div className="col-left">
            <SurgeAlert onThemeSelect={setSelectedTheme} date={date} />
            <TopThemes market={market} onThemeSelect={setSelectedTheme} date={date} selectedTheme={selectedTheme} />
          </div>
          <div className="col-right-main">
            <FlowChart themeName={selectedTheme} market={market} date={date} large={true} />
          </div>
        </div>
        <div className="mobile-view">
          {activeTab==="top"   && <TopThemes market={market} onThemeSelect={t=>{setSelectedTheme(t);setActiveTab("chart");}} date={date} selectedTheme={selectedTheme} />}
          {activeTab==="chart" && <FlowChart themeName={selectedTheme} market={market} date={date} large={false} />}
          {activeTab==="surge" && <SurgeAlert onThemeSelect={t=>{setSelectedTheme(t);setActiveTab("chart");}} date={date} />}
        </div>
      </main>

      <footer className="footer">
        <span>SectorFlow © 2025</span>
        <span className="footer-dot">·</span>
        <span>KRX · Yahoo Finance</span>
        <span className="footer-dot">·</span>
        <span>투자 조언 아님</span>
      </footer>
    </div>
  );
}
