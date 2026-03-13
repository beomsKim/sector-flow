import React from "react";
import { Zap } from "lucide-react";
import { useSurgeThemes } from "../hooks/useThemeData";

export default function SurgeAlert({ onThemeSelect, date }) {
  const { data, loading } = useSurgeThemes(1.2, date);  // 1.5 → 1.2

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ background:"rgba(246,173,85,0.12)", border:"1px solid rgba(246,173,85,0.25)" }}>
            <Zap size={15} color="#f6ad55" />
          </div>
          <div>
            <div className="card-title">급증 테마 감지</div>
            <div className="card-sub">전일 대비 1.2배 이상</div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {loading && <div className="skel" style={{height:60}} />}

        {!loading && data.length === 0 && (
          <div className="empty-state">현재 급증 테마 없음</div>
        )}

        {!loading && data.map(item => (
          <div
            key={item.theme}
            className="surge-item"
            onClick={() => onThemeSelect?.(item.theme)}
            style={{ cursor:"pointer" }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span className="surge-name">{item.theme}</span>
              <span className="surge-ratio" style={{
                color: item.ratio >= 2.0 ? "#fc8181" : item.ratio >= 1.5 ? "#f6ad55" : "#68d391"
              }}>
                ▲ {item.ratio}x
              </span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:"0.68rem", color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>
              <span>전일 {item.yesterday_volume_formatted}</span>
              <span>→</span>
              <span style={{ color:"var(--text-1)" }}>오늘 {item.today_volume_formatted}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
