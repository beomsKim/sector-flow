import React from "react";
import { List } from "lucide-react";
import { useThemeRanking } from "../hooks/useThemeData";

const rankClass = (idx) => {
  if (idx === 0) return "gold";
  if (idx === 1) return "silver";
  if (idx === 2) return "bronze";
  return "";
};

export default function ThemeRanking({ market, onThemeSelect, selectedTheme }) {
  const { data, loading } = useThemeRanking(market);
  const maxVol = data[0]?.total_volume || 1;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ background: "rgba(72,187,120,0.12)", border: "1px solid rgba(72,187,120,0.25)" }}>
            <List size={15} color="#48bb78" />
          </div>
          <div>
            <div className="card-title">테마 거래대금 랭킹</div>
            <div className="card-sub">전체 테마 순위</div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {loading && Array.from({length: 8}).map((_,i) => (
          <div key={i} className="skel" style={{height: 40, marginBottom: 4}} />
        ))}

        {!loading && data.map((item, idx) => {
          const ratio = (item.total_volume / maxVol) * 100;
          const sel = selectedTheme === item.theme;
          return (
            <div
              key={item.theme}
              className={`rank-item fade-up ${sel ? "selected" : ""}`}
              style={{ animationDelay: `${idx * 0.03}s` }}
              onClick={() => onThemeSelect?.(item.theme)}
            >
              <span className={`rank-num ${rankClass(idx)}`}>{idx + 1}</span>
              <div className="rank-body">
                <div className="rank-name">{item.theme}</div>
                <div className="rank-bar-track">
                  <div className="rank-bar-fill" style={{ width: `${ratio}%` }} />
                </div>
              </div>
              <span className="rank-vol">{item.total_volume_formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
