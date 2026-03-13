import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, TrendingUp, Zap, BarChart2, Calendar } from "lucide-react";
import TopThemes from "./components/TopThemes";
import FlowChart from "./components/FlowChart";
import SurgeAlert from "./components/SurgeAlert";
import { getDefaultDate, formatDateDisplay, useTopThemes } from "./hooks/useThemeData";

export default function App() {
  const [market, setMarket] = useState("kr");
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("top");
  const [date, setDate] = useState(getDefaultDate());

  const handleRefresh = () => { setRefreshKey(k => k + 1); setSelectedTheme(null); };
  const dateInputValue = `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`;
  const handleDateChange = (e) => {
    const val = e.target.value.replace(/-/g, "");
    if (val.length === 8) setDate(val);
  };

  // 초기 로드 시 1위 자동 선택
  const { data: topData } = useTopThemes(market, 20, date);
  useEffect(() => {
    if (topData?.length > 0 && !selectedTheme) {
      setSelectedTheme(topData[0].theme);
    }
  }, [topData]);

  // 날짜·마켓 변경 시 리셋
  useEffect(() => { setSelectedTheme(null); }, [date, market]);

  return (
    <div className="app-root">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">
              <Activity size={14} color="#000" strokeWidth={2.5} />
            </div>
            <span className="logo-text">SECTOR<span className="logo-accent">FLOW</span></span>
            <span className="logo-badge">BETA</span>
          </div>

          <div className="header-controls">
            <div className="date-picker-wrap">
              <Calendar size={13} color="var(--text-3)" />
              <input type="date" className="date-input" value={dateInputValue}
                max={new Date().toISOString().slice(0,10)} onChange={handleDateChange} />
            </div>
            <div className="market-tabs">
              {[{value:"kr",label:"KR",sub:"한국"},{value:"us",label:"US",sub:"미국"}].map(m => (
                <button key={m.value} className={`market-btn ${market===m.value?"active":""}`} onClick={() => setMarket(m.value)}>
                  <span className="market-label">{m.label}</span>
                  <span className="market-sub">{m.sub}</span>
                </button>
              ))}
            </div>
            <button className="refresh-btn" onClick={handleRefresh}><RefreshCw size={14} /></button>
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
        {/* ── 데스크탑: 2컬럼 ── */}
        <div className="desktop-grid">
          {/* 왼쪽: 급증 + TOP 리스트 */}
          <div className="col-left">
            <SurgeAlert onThemeSelect={setSelectedTheme} date={date} />
            <TopThemes
              market={market}
              onThemeSelect={setSelectedTheme}
              date={date}
              selectedTheme={selectedTheme}
            />
          </div>

          {/* 오른쪽: 대형 차트 */}
          <div className="col-right-main">
            <FlowChart
              themeName={selectedTheme}
              market={market}
              date={date}
              large={true}
            />
          </div>
        </div>

        {/* ── 모바일 ── */}
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
