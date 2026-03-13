import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronUp, Search, ArrowLeft, Lock, Info, Shield } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
// 추후 로그인 붙일 때 여기에 Authorization 헤더 추가하면 됨
// const getAuthHeaders = () => ({ "Authorization": `Bearer ${localStorage.getItem("token")}` });

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "오류 발생");
  }
  return res.json();
}

// ── 심플 PIN 보호 (로그인 붙이기 전 최소 보호)
// 환경변수 VITE_ADMIN_PIN 으로 설정 (기본: 0000)
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || "0000";

function PinGate({ onPass }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const handleSubmit = () => {
    if (pin === ADMIN_PIN) { onPass(); }
    else { setErr("PIN이 올바르지 않습니다"); setPin(""); }
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:16 }}>
      <div style={{ background:"var(--bg-1)", border:"1px solid var(--border-hi)", borderRadius:16, padding:32, width:300, textAlign:"center" }}>
        <div style={{ marginBottom:16 }}>
          <Lock size={32} color="var(--cyan)" style={{ margin:"0 auto 10px" }} />
          <div style={{ fontFamily:"var(--font-display)", fontSize:"1rem", fontWeight:700 }}>관리자 인증</div>
          <div style={{ fontSize:"0.72rem", color:"var(--text-3)", marginTop:4 }}>PIN 번호를 입력하세요</div>
        </div>
        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ ...inputStyle, width:"100%", textAlign:"center", fontSize:"1.2rem", letterSpacing:"0.3em", marginBottom:10 }}
          autoFocus
        />
        {err && <div style={{ color:"#fc8181", fontSize:"0.73rem", marginBottom:8 }}>{err}</div>}
        <button onClick={handleSubmit} style={{ ...btnStyle("#63b3ed"), width:"100%", justifyContent:"center", padding:"8px 0" }}>
          확인
        </button>
        <div style={{ marginTop:12, fontSize:"0.65rem", color:"var(--text-3)" }}>
          기본 PIN: 0000 · <code>.env</code>의 VITE_ADMIN_PIN으로 변경
        </div>
      </div>
    </div>
  );
}

// ── 사용법 안내
function HelpPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"rgba(99,179,237,0.05)", border:"1px solid rgba(99,179,237,0.2)", borderRadius:10, marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", cursor:"pointer" }} onClick={() => setOpen(o=>!o)}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <Info size={14} color="var(--cyan)" />
          <span style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--cyan)" }}>사용법 안내</span>
        </div>
        {open ? <ChevronUp size={14} color="var(--text-3)"/> : <ChevronDown size={14} color="var(--text-3)"/>}
      </div>
      {open && (
        <div style={{ padding:"0 14px 14px", fontSize:"0.78rem", color:"var(--text-2)", lineHeight:1.8 }}>
          <div style={{ borderTop:"1px solid rgba(99,179,237,0.15)", paddingTop:12 }}>
            <b style={{ color:"var(--cyan)" }}>📌 테마란?</b><br/>
            종목들을 묶은 섹터 단위예요. "HBM·메모리", "반도체" 같이 직접 정의하면 돼요.<br/><br/>

            <b style={{ color:"#48bb78" }}>➕ 새 테마 추가</b><br/>
            상단 "새 테마 추가" 버튼 → 테마명 + 설명 입력 → 종목코드(6자리) + 종목명 입력 후 추가 → 생성<br/><br/>

            <b style={{ color:"#f6ad55" }}>✏️ 테마 편집</b><br/>
            테마 클릭 → 편집 버튼 → 종목 추가/삭제 후 저장<br/>
            기본 테마도 편집 가능 (오버라이드 방식으로 저장됨)<br/><br/>

            <b style={{ color:"#fc8181" }}>🗑️ 테마 삭제</b><br/>
            커스텀(직접 만든) 테마만 삭제 가능해요.<br/>
            기본 테마는 삭제 버튼이 없어요.<br/><br/>

            <b style={{ color:"var(--purple)" }}>🔍 종목코드 찾는 법</b><br/>
            네이버 금융 / KRX 검색 → 종목 페이지 URL에서 확인<br/>
            예: 삼성전자 = 005930, SK하이닉스 = 000660<br/><br/>

            <div style={{ background:"rgba(246,173,85,0.08)", border:"1px solid rgba(246,173,85,0.2)", borderRadius:7, padding:"8px 12px", marginTop:4 }}>
              <Shield size={12} style={{ display:"inline", marginRight:5 }} color="#f6ad55" />
              <b style={{ color:"#f6ad55", fontSize:"0.75rem" }}>보안 안내</b><br/>
              <span style={{ fontSize:"0.72rem" }}>
                현재 PIN 방식으로만 보호되고 있어요. 배포 전 <code style={{ background:"rgba(255,255,255,0.1)", padding:"1px 4px", borderRadius:3 }}>VITE_ADMIN_PIN</code> 환경변수를 반드시 변경하세요.
                추후 JWT 로그인을 붙일 때 <code>apiFetch()</code> 함수에 Authorization 헤더만 추가하면 바로 연동돼요.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StockSearchInput({ onAdd }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const handleAdd = () => {
    const c = code.trim().padStart(6, "0");
    const n = name.trim();
    if (!c || !n) return;
    onAdd({ code: c, name: n });
    setCode(""); setName("");
  };
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
      <input placeholder="종목코드 (예: 005930)" value={code} onChange={e => setCode(e.target.value)} style={{ ...inputStyle, width:150 }} />
      <input placeholder="종목명 (예: 삼성전자)" value={name} onChange={e => setName(e.target.value)}
        style={{ ...inputStyle, flex:2 }} onKeyDown={e => e.key==="Enter" && handleAdd()} />
      <button onClick={handleAdd} style={btnStyle("#63b3ed")}><Plus size={14}/> 추가</button>
    </div>
  );
}

function ThemeEditor({ theme, onSave, onClose }) {
  const [desc, setDesc] = useState(theme?.description || "");
  const [stocks, setStocks] = useState(theme?.stocks ? [...theme.stocks] : []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const addStock = (s) => {
    if (stocks.find(x => x.code === s.code)) { setErr("이미 추가된 종목"); return; }
    setStocks(p => [...p, s]); setErr("");
  };
  const handleSave = async () => {
    setSaving(true); setErr("");
    try { await onSave({ description: desc, stocks }); onClose(); }
    catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };
  return (
    <div style={{ background:"var(--bg-3)", borderRadius:10, padding:16, marginTop:4 }}>
      <label style={labelStyle}>설명</label>
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="테마 설명" style={{ ...inputStyle, width:"100%", marginBottom:12 }} />
      <label style={labelStyle}>종목 추가 (코드 + 이름 입력 후 Enter 또는 추가 버튼)</label>
      <StockSearchInput onAdd={addStock} />
      <div style={{ marginTop:10, maxHeight:200, overflowY:"auto" }}>
        {stocks.length === 0 && <div style={{ color:"var(--text-3)", fontSize:"0.75rem", padding:"8px 0" }}>종목이 없습니다</div>}
        {stocks.map((s, i) => (
          <div key={s.code} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 6px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.65rem", color:"var(--text-3)", width:16 }}>{i+1}</span>
              <span style={{ fontSize:"0.8rem" }}>{s.name}</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.63rem", color:"var(--text-3)" }}>{s.code}</span>
            </div>
            <button onClick={() => setStocks(p => p.filter(x => x.code !== s.code))} style={{ background:"none", border:"none", color:"var(--text-3)", cursor:"pointer" }}><Trash2 size={12}/></button>
          </div>
        ))}
      </div>
      {err && <div style={{ color:"#fc8181", fontSize:"0.73rem", marginTop:6 }}>{err}</div>}
      <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={btnStyle("#4a5568")}>취소</button>
        <button onClick={handleSave} disabled={saving} style={btnStyle("#63b3ed")}><Save size={14}/> {saving?"저장 중...":"저장"}</button>
      </div>
    </div>
  );
}

function NewThemeForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [stocks, setStocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const handleCreate = async () => {
    if (!name.trim()) { setErr("테마명을 입력하세요"); return; }
    setSaving(true); setErr("");
    try {
      await apiFetch("/api/admin/themes", { method:"POST", body: JSON.stringify({ name:name.trim(), description:desc, stocks }) });
      setName(""); setDesc(""); setStocks([]); setOpen(false); onCreated();
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };
  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ ...btnStyle("#48bb78"), width:"100%", justifyContent:"center", padding:"10px 0", marginBottom:14 }}>
      <Plus size={15}/> 새 테마 추가
    </button>
  );
  return (
    <div style={{ background:"var(--bg-2)", border:"1px solid rgba(72,187,120,0.3)", borderRadius:12, padding:18, marginBottom:14 }}>
      <div style={{ fontFamily:"var(--font-display)", fontSize:"0.95rem", fontWeight:700, color:"#48bb78", marginBottom:12 }}>새 테마 만들기</div>
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <input placeholder="테마명 (예: HBM·메모리)" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        <input placeholder="설명 (예: 고대역폭메모리 관련주)" value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inputStyle, flex:2 }} />
      </div>
      <label style={labelStyle}>종목 추가 (나중에도 추가 가능)</label>
      <StockSearchInput onAdd={s => { if (!stocks.find(x => x.code===s.code)) setStocks(p=>[...p,s]); }} />
      <div style={{ maxHeight:130, overflowY:"auto", marginTop:6 }}>
        {stocks.map(s => (
          <div key={s.code} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 4px" }}>
            <span style={{ fontSize:"0.8rem" }}>{s.name} <span style={{ color:"var(--text-3)", fontFamily:"var(--font-mono)", fontSize:"0.63rem" }}>{s.code}</span></span>
            <button onClick={() => setStocks(p=>p.filter(x=>x.code!==s.code))} style={{ background:"none", border:"none", color:"var(--text-3)", cursor:"pointer" }}><Trash2 size={12}/></button>
          </div>
        ))}
      </div>
      {err && <div style={{ color:"#fc8181", fontSize:"0.73rem", marginTop:6 }}>{err}</div>}
      <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
        <button onClick={() => setOpen(false)} style={btnStyle("#4a5568")}>취소</button>
        <button onClick={handleCreate} disabled={saving} style={btnStyle("#48bb78")}><Save size={14}/> {saving?"생성 중...":"생성"}</button>
      </div>
    </div>
  );
}

export default function AdminPage({ onBack }) {
  const [authed, setAuthed] = useState(ADMIN_PIN === "0000" ? false : false);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState(null);
  const [expandedTheme, setExpandedTheme] = useState(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);

  const loadThemes = useCallback(async () => {
    setLoading(true);
    try { const d = await apiFetch("/api/admin/themes"); setThemes(d.themes); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) loadThemes(); }, [authed, loadThemes]);

  const handleSave = async (themeName, body) => {
    await apiFetch(`/api/admin/themes/${encodeURIComponent(themeName)}`, { method:"PUT", body: JSON.stringify(body) });
    await loadThemes();
  };
  const handleDelete = async (themeName) => {
    if (!window.confirm(`"${themeName}" 테마를 삭제할까요?`)) return;
    setDeleting(themeName);
    try { await apiFetch(`/api/admin/themes/${encodeURIComponent(themeName)}`, { method:"DELETE" }); await loadThemes(); }
    catch(e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  if (!authed) return <PinGate onPass={() => setAuthed(true)} />;

  const filtered = themes.filter(t => t.name.includes(search) || t.description.includes(search));

  return (
    <div style={{ maxWidth:740, margin:"0 auto", padding:"24px 20px" }}>
      {/* 헤더 */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:"var(--bg-2)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 12px", color:"var(--text-2)", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:"0.8rem" }}>
          <ArrowLeft size={14}/> 대시보드
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:"1.1rem", fontWeight:800 }}>테마 관리</div>
          <div style={{ fontSize:"0.7rem", color:"var(--text-3)", marginTop:2 }}>
            총 {themes.length}개 · 커스텀 <span style={{ color:"#48bb78" }}>{themes.filter(t=>t.is_custom).length}개</span> · 기본 {themes.filter(t=>!t.is_custom).length}개
          </div>
        </div>
        <button onClick={() => setAuthed(false)} style={{ ...btnStyle("#4a5568"), padding:"4px 10px", fontSize:"0.72rem" }}>
          <Lock size={12}/> 잠금
        </button>
      </div>

      {/* 사용법 */}
      <HelpPanel />

      {/* 새 테마 추가 */}
      <NewThemeForm onCreated={loadThemes} />

      {/* 검색 */}
      <div style={{ position:"relative", marginBottom:12 }}>
        <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text-3)" }} />
        <input placeholder="테마 검색..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width:"100%", paddingLeft:30 }} />
      </div>

      {loading && <div className="skel" style={{height:200}} />}

      {!loading && filtered.map(theme => {
        const isExpanded = expandedTheme === theme.name;
        const isEditing = editingTheme === theme.name;
        return (
          <div key={theme.name} style={{ background:"var(--bg-1)", border:`1px solid ${theme.is_custom?"rgba(72,187,120,0.25)":"var(--border)"}`, borderRadius:11, marginBottom:7, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", cursor:"pointer" }}
              onClick={() => setExpandedTheme(isExpanded ? null : theme.name)}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontWeight:700, fontSize:"0.87rem" }}>{theme.name}</span>
                  {theme.is_custom && <span style={{ fontSize:"0.58rem", background:"rgba(72,187,120,0.12)", color:"#48bb78", border:"1px solid rgba(72,187,120,0.3)", borderRadius:4, padding:"1px 5px" }}>커스텀</span>}
                </div>
                <div style={{ fontSize:"0.68rem", color:"var(--text-3)", marginTop:1 }}>{theme.description} · {theme.stock_count}개 종목</div>
              </div>
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                <button onClick={e => { e.stopPropagation(); setEditingTheme(isEditing?null:theme.name); setExpandedTheme(theme.name); }}
                  style={{ ...btnStyle("#63b3ed"), padding:"3px 8px", fontSize:"0.7rem" }}>
                  <Edit3 size={11}/> 편집
                </button>
                {theme.is_custom && (
                  <button onClick={e => { e.stopPropagation(); handleDelete(theme.name); }} disabled={deleting===theme.name}
                    style={{ ...btnStyle("#fc8181"), padding:"3px 8px", fontSize:"0.7rem" }}>
                    <Trash2 size={11}/> 삭제
                  </button>
                )}
                {isExpanded ? <ChevronUp size={14} color="var(--text-3)"/> : <ChevronDown size={14} color="var(--text-3)"/>}
              </div>
            </div>
            {isExpanded && isEditing && (
              <div style={{ padding:"0 14px 14px" }}>
                <ThemeEditor theme={theme} onSave={body => handleSave(theme.name, body)} onClose={() => setEditingTheme(null)} />
              </div>
            )}
            {isExpanded && !isEditing && (
              <div style={{ padding:"0 14px 12px", borderTop:"1px solid var(--border)" }}>
                {theme.stocks.map((s, i) => (
                  <div key={s.code} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.63rem", color:"var(--text-3)", width:20, textAlign:"right" }}>{i+1}</span>
                    <span style={{ fontSize:"0.82rem", flex:1 }}>{s.name}</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.65rem", color:"var(--text-3)" }}>{s.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const inputStyle = { background:"var(--bg-3)", border:"1px solid var(--border)", borderRadius:7, padding:"6px 10px", color:"var(--text-1)", fontSize:"0.82rem", outline:"none", flex:1, fontFamily:"var(--font-body)" };
const labelStyle = { display:"block", fontSize:"0.65rem", color:"var(--text-3)", marginBottom:3, fontFamily:"var(--font-mono)", textTransform:"uppercase" };
const btnStyle = (color) => ({ display:"flex", alignItems:"center", gap:4, background:`${color}20`, border:`1px solid ${color}50`, color, borderRadius:7, padding:"5px 11px", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, transition:"all 0.15s" });
