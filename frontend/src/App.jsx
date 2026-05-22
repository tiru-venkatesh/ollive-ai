import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';

const API = 'https://ollive-ai.onrender.com/api';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600&family=Geist:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #070906;
  --bg2:       #0C0E0A;
  --surface:   #101309;
  --surface2:  #161A0D;
  --surface3:  #1C2210;
  --border:    rgba(140,189,28,0.10);
  --border2:   rgba(140,189,28,0.18);
  --border3:   rgba(140,189,28,0.28);
  --olive:     #8CBD1C;
  --oliveb:    #A8D828;
  --olive3:    rgba(140,189,28,0.14);
  --olive4:    rgba(140,189,28,0.08);
  --text:      #DCE8C0;
  --text2:     #8AA068;
  --text3:     #4A5C38;
  --red:       #E05050;
  --redbg:     rgba(224,80,80,0.10);
  --green:     #5CC060;
  --amber:     #D4981C;
  --amberbg:   rgba(212,152,28,0.12);
  --sans:      'Geist', sans-serif;
  --mono:      'Geist Mono', monospace;
  --r:         8px;
  --r2:        12px;
  --r3:        16px;
}

html, body, #root { height: 100%; background: var(--bg); }
body { font-family: var(--sans); color: var(--text); overflow: hidden; }

/* scrollbar */
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

/* animations */
@keyframes fadeUp   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.35} }
@keyframes spin     { to { transform: rotate(360deg); } }
@keyframes dot1     { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
@keyframes dot2     { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} animation-delay:.16s }
@keyframes dot3     { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} animation-delay:.32s }

.fadeUp { animation: fadeUp .22s ease both; }

/* ── APP SHELL ── */
.shell {
  display: grid;
  grid-template-columns: 248px 1fr;
  height: 100vh;
}

/* ══════════════════════════════════
   SIDEBAR
══════════════════════════════════ */
.sidebar {
  display: flex;
  flex-direction: column;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.brand-mark {
  width: 30px; height: 30px;
  background: var(--olive);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
  font-family: var(--sans);
}
.brand-name {
  font-family: var(--sans);
  font-size: 16px; font-weight: 700;
  color: var(--text); letter-spacing: -.3px;
}
.brand-tag {
  margin-left: auto;
  font-family: var(--mono);
  font-size: 9px; font-weight: 500;
  color: var(--olive);
  background: var(--olive3);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: .5px;
}

.sidebar-body { flex: 1; overflow-y: auto; padding: 10px 10px 0; }

.btn-new {
  display: flex; align-items: center; justify-content: center;
  gap: 7px; width: 100%; padding: 9px;
  background: var(--olive); color: #080A06;
  font-family: var(--sans); font-size: 13px; font-weight: 600;
  border: none; border-radius: var(--r2); cursor: pointer;
  transition: background .12s, transform .1s;
  margin-bottom: 14px;
}
.btn-new:hover { background: var(--oliveb); }
.btn-new:active { transform: scale(.97); }

.nav-label {
  font-size: 10px; font-weight: 500; letter-spacing: 1.2px;
  color: var(--text3); padding: 0 6px 6px;
  font-family: var(--mono);
}

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: var(--r);
  cursor: pointer; font-size: 13px; color: var(--text2);
  transition: all .12s; border: 1px solid transparent;
  margin-bottom: 1px; font-family: var(--sans); font-weight: 400;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nav-item svg { flex-shrink: 0; opacity: .7; }
.nav-item:hover { background: var(--surface); color: var(--text); }
.nav-item:hover svg { opacity: 1; }
.nav-item.active {
  background: var(--surface2);
  border-color: var(--border2);
  color: var(--olive);
}
.nav-item.active svg { color: var(--olive); opacity: 1; }

.nav-divider { height: 1px; background: var(--border); margin: 10px 0; }

.conv-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: var(--r);
  cursor: pointer; font-size: 12px; color: var(--text2);
  transition: all .12s; margin-bottom: 1px;
}
.conv-item:hover { background: var(--surface); color: var(--text); }
.conv-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--border2); flex-shrink: 0; }
.conv-item-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.conv-item-time { font-size: 10px; color: var(--text3); flex-shrink: 0; font-family: var(--mono); }

.sidebar-foot {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.online-row {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; color: var(--text3); font-family: var(--mono);
}
.online-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green);
  animation: pulse 2.2s infinite;
}
.online-label { color: var(--text2); }

/* ══════════════════════════════════
   MAIN PANEL
══════════════════════════════════ */
.main { display: flex; flex-direction: column; overflow: hidden; }

.topbar {
  display: flex; align-items: center; gap: 10px;
  padding: 0 24px; height: 52px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.topbar-title { font-size: 14px; font-weight: 600; color: var(--text); font-family: var(--sans); }
.topbar-end { margin-left: auto; display: flex; align-items: center; gap: 8px; }

.chip {
  font-family: var(--mono); font-size: 10px; font-weight: 500;
  padding: 3px 8px; border-radius: 99px; letter-spacing: .3px;
}
.chip-olive { background: var(--olive3); color: var(--olive); }
.chip-dim   { background: var(--surface2); color: var(--text3); border: 1px solid var(--border); }
.chip-red   { background: var(--redbg); color: var(--red); }
.chip-green { background: rgba(92,192,96,.12); color: var(--green); }

/* ══════════════════════════════════
   CHAT
══════════════════════════════════ */
.chat-outer { display: flex; flex-direction: column; flex: 1; overflow: hidden; }

.msgs { flex: 1; overflow-y: auto; padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

.msg-row { display: flex; gap: 12px; animation: fadeUp .18s ease both; }
.msg-row.user { flex-direction: row-reverse; }

.avatar {
  width: 32px; height: 32px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; flex-shrink: 0;
  font-family: var(--sans);
}
.avatar.bot  { background: var(--olive3); color: var(--olive); border: 1px solid var(--border2); }
.avatar.user { background: var(--surface3); color: var(--text2); border: 1px solid var(--border); }

.msg-body { display: flex; flex-direction: column; gap: 4px; max-width: 72%; }
.msg-row.user .msg-body { align-items: flex-end; }

.msg-name { font-size: 11px; color: var(--text3); font-family: var(--mono); }

.bubble {
  padding: 12px 16px;
  border-radius: var(--r2); font-size: 14px; line-height: 1.75;
  word-break: break-word;
  border: 1px solid var(--border);
}
.bubble.bot {
  background: var(--surface2);
  border-left: 2px solid var(--olive);
  border-radius: 4px var(--r2) var(--r2) var(--r2);
}
.bubble.user {
  background: var(--surface3);
  border-radius: var(--r2) 4px var(--r2) var(--r2);
  white-space: pre-wrap;
}
.bubble.streaming::after {
  content: '▋'; color: var(--olive);
  animation: blink .7s infinite; margin-left: 1px;
}

/* ── MARKDOWN STYLES ── */
.bubble h1, .bubble h2, .bubble h3 {
  color: var(--text); font-family: var(--sans);
  margin: 12px 0 6px; line-height: 1.3;
}
.bubble h1 { font-size: 17px; font-weight: 700; }
.bubble h2 { font-size: 15px; font-weight: 600; }
.bubble h3 { font-size: 14px; font-weight: 600; color: var(--olive); }
.bubble strong { color: var(--text); font-weight: 600; }
.bubble em { color: var(--text2); font-style: italic; }
.bubble p { margin-bottom: 8px; line-height: 1.75; }
.bubble p:last-child { margin-bottom: 0; }
.bubble ul, .bubble ol { padding-left: 20px; margin: 6px 0 10px; }
.bubble li { margin-bottom: 5px; line-height: 1.65; color: var(--text); }
.bubble li::marker { color: var(--olive); }
.bubble code {
  background: var(--surface3); padding: 2px 6px;
  border-radius: 4px; font-family: var(--mono);
  font-size: 12px; color: var(--olive);
  border: 1px solid var(--border2);
}
.bubble pre {
  background: var(--surface3); padding: 14px 16px;
  border-radius: var(--r); overflow-x: auto;
  margin: 10px 0; border: 1px solid var(--border2);
}
.bubble pre code {
  background: none; padding: 0; border: none;
  font-size: 12px; color: var(--text2);
}
.bubble blockquote {
  border-left: 2px solid var(--olive3);
  padding: 4px 12px; margin: 8px 0;
  color: var(--text2); font-style: italic;
}
.bubble hr {
  border: none; border-top: 1px solid var(--border);
  margin: 12px 0;
}
.bubble a { color: var(--olive); text-decoration: underline; }
.bubble table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
.bubble th { padding: 6px 10px; background: var(--surface3); color: var(--text); font-weight: 600; border: 1px solid var(--border2); }
.bubble td { padding: 6px 10px; border: 1px solid var(--border); color: var(--text2); }

.meta-row {
  display: flex; gap: 8px; align-items: center;
  font-size: 10px; color: var(--text3); font-family: var(--mono);
}

/* typing indicator */
.typing { display: flex; gap: 5px; align-items: center; padding: 14px 16px; }
.td { width: 7px; height: 7px; border-radius: 50%; background: var(--olive); }
.td:nth-child(1) { animation: dot1 1.3s infinite; }
.td:nth-child(2) { animation: dot1 1.3s .16s infinite; }
.td:nth-child(3) { animation: dot1 1.3s .32s infinite; }

/* empty */
.empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 14px; text-align: center;
}
.empty-glyph {
  width: 56px; height: 56px; border-radius: 18px;
  background: var(--olive3); border: 1px solid var(--border2);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
}
.empty-h { font-size: 18px; font-weight: 600; color: var(--text); font-family: var(--sans); }
.empty-p { font-size: 13px; color: var(--text3); line-height: 1.7; max-width: 320px; }
.starters { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 4px; }
.starter {
  font-size: 12px; font-family: var(--sans);
  padding: 7px 14px; border-radius: var(--r);
  background: var(--surface2); color: var(--text2);
  border: 1px solid var(--border); cursor: pointer;
  transition: all .12s;
}
.starter:hover { color: var(--olive); border-color: var(--border2); background: var(--olive4); }

/* input */
.input-zone {
  border-top: 1px solid var(--border);
  padding: 14px 24px 20px;
  background: var(--bg2);
  flex-shrink: 0;
}
.input-box {
  display: flex; gap: 10px; align-items: flex-end;
}
.input-shell {
  flex: 1; display: flex; align-items: flex-end;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: var(--r2);
  padding: 6px 6px 6px 16px;
  transition: border-color .15s;
}
.input-shell:focus-within { border-color: var(--olive); }
.chat-ta {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--text); font-family: var(--sans); font-size: 14px;
  resize: none; min-height: 24px; max-height: 160px;
  padding: 5px 0; line-height: 1.6;
}
.chat-ta::placeholder { color: var(--text3); }
.send-btn {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--olive); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #07090A; flex-shrink: 0;
  transition: background .12s, transform .1s;
}
.send-btn:hover { background: var(--oliveb); }
.send-btn:active { transform: scale(.93); }
.send-btn:disabled { background: var(--surface3); color: var(--text3); cursor: not-allowed; }
.stop-btn {
  height: 38px; padding: 0 14px;
  background: var(--redbg); border: 1px solid rgba(224,80,80,.25);
  border-radius: 10px; cursor: pointer; color: var(--red);
  font-family: var(--sans); font-size: 12px; font-weight: 500;
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  transition: all .12s;
}
.stop-btn:hover { background: rgba(224,80,80,.18); }
.input-foot {
  display: flex; align-items: center; gap: 12px;
  margin-top: 8px; font-size: 11px; color: var(--text3); font-family: var(--mono);
}
.input-foot-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); display: inline-block; }

/* ══════════════════════════════════
   CONVERSATIONS VIEW
══════════════════════════════════ */
.view-scroll { flex: 1; overflow-y: auto; padding: 20px 28px; }

.conv-card {
  display: flex; align-items: center; gap: 14px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r2); padding: 14px 16px;
  margin-bottom: 8px; cursor: pointer;
  transition: all .13s; animation: fadeUp .18s ease both;
}
.conv-card:hover { background: var(--surface2); border-color: var(--border2); }

.conv-icon {
  width: 40px; height: 40px; border-radius: var(--r);
  background: var(--olive3); border: 1px solid var(--border2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--olive);
}
.conv-content { flex: 1; min-width: 0; }
.conv-title { font-size: 13px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.conv-info { display: flex; gap: 10px; font-size: 11px; color: var(--text3); font-family: var(--mono); }
.conv-btns { display: flex; gap: 6px; }

.icon-btn {
  width: 32px; height: 32px; border-radius: var(--r);
  background: transparent; border: 1px solid var(--border);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--text2); transition: all .12s;
}
.icon-btn:hover { background: var(--surface2); border-color: var(--border2); color: var(--olive); }
.icon-btn.del:hover { color: var(--red); border-color: rgba(224,80,80,.3); background: var(--redbg); }

/* ══════════════════════════════════
   DASHBOARD
══════════════════════════════════ */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }

.stat-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r2); padding: 16px 18px;
  animation: fadeUp .18s ease both;
}
.stat-label {
  font-size: 10px; font-weight: 500; letter-spacing: 1px;
  color: var(--text3); font-family: var(--mono); margin-bottom: 10px;
  display: flex; align-items: center; gap: 6px;
}
.stat-num {
  font-size: 28px; font-weight: 700; color: var(--text);
  font-family: var(--sans); line-height: 1; margin-bottom: 4px;
}
.stat-sub { font-size: 11px; color: var(--text3); font-family: var(--mono); }
.stat-accent-olive .stat-num { color: var(--olive); }
.stat-accent-green .stat-num { color: var(--green); }
.stat-accent-amber .stat-num { color: var(--amber); }
.stat-accent-red   .stat-num { color: var(--red); }

.chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.chart-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r2); padding: 16px 18px;
  animation: fadeUp .2s ease both;
}
.chart-head {
  font-size: 11px; font-weight: 500; color: var(--text2);
  font-family: var(--mono); margin-bottom: 16px;
  display: flex; align-items: center; gap: 6px;
}
.chart-head svg { color: var(--olive); }

.bar-row { display: flex; align-items: flex-end; gap: 5px; height: 80px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.bar-el {
  width: 100%; background: var(--olive3); border-radius: 4px 4px 0 0;
  transition: background .15s; cursor: default; min-height: 4px;
  border-top: 1px solid var(--border2);
}
.bar-el:hover { background: rgba(140,189,28,.32); }
.bar-lbl { font-size: 9px; color: var(--text3); font-family: var(--mono); }

.table-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r2); overflow: hidden; margin-bottom: 10px;
  animation: fadeUp .22s ease both;
}
.table-head { padding: 14px 18px 10px; border-bottom: 1px solid var(--border); }
.table-head-txt { font-size: 11px; color: var(--text2); font-family: var(--mono); font-weight: 500; }

table.log { width: 100%; border-collapse: collapse; font-size: 12px; }
table.log th {
  padding: 9px 18px; text-align: left;
  font-size: 10px; font-weight: 500; letter-spacing: .8px;
  color: var(--text3); font-family: var(--mono);
  border-bottom: 1px solid var(--border);
}
table.log td {
  padding: 10px 18px; border-bottom: 1px solid var(--border);
  color: var(--text2); font-family: var(--mono); vertical-align: middle;
}
table.log tr:last-child td { border-bottom: none; }
table.log tr:hover td { background: var(--olive4); color: var(--text); }

.badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; padding: 2px 8px; border-radius: 99px;
  font-family: var(--mono); font-weight: 500;
}
.badge-ok  { background: rgba(92,192,96,.13); color: var(--green); }
.badge-err { background: var(--redbg); color: var(--red); }

/* loading spinner */
.spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid var(--border2); border-top-color: var(--olive);
  animation: spin .7s linear infinite;
}
`;

/* ══════════════════════════════════
   CONTEXT
══════════════════════════════════ */
const Ctx = createContext({});

/* ══════════════════════════════════
   ICONS  (inline SVG – no external dep)
══════════════════════════════════ */
const Icon = ({ name, size = 16, ...rest }) => {
  const paths = {
    chat:    <><path d="M8 2H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2l-4 3v-3H4a2 2 0 0 1-2-2V8"/><path d="M2 2h9"/></>,
    list:    <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    bar:     <><rect x="3" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="13" width="4" height="8"/></>,
    plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    send:    <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    stop:    <><rect x="3" y="3" width="18" height="18" rx="2"/></>,
    resume:  <><polygon points="5 3 19 12 5 21 5 3"/></>,
    trash:   <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>,
    clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    zap:     <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    check:   <><polyline points="20 6 9 17 4 12"/></>,
    alert:   <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {paths[name]}
    </svg>
  );
};

/* ══════════════════════════════════
   UTILS
══════════════════════════════════ */
const uid   = () => Math.random().toString(36).slice(2, 10);
const fmtT  = d  => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtD  = d  => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
const fmtMs = ms => ms ? `${Math.round(ms)}ms` : '—';

const STARTERS = [
  'What is LLM observability?',
  'Explain token usage',
  'How does streaming work?',
  'What is PII redaction?',
];

const DEMO_LOGS = Array.from({ length: 16 }, (_, i) => ({
  _id: uid(),
  provider: 'groq',
  model: 'llama-3.1-8b-instant',
  latencyMs: 300 + Math.random() * 1400,
  totalTokens: 80 + Math.floor(Math.random() * 500),
  promptTokens: 40 + Math.floor(Math.random() * 200),
  completionTokens: 40 + Math.floor(Math.random() * 300),
  status: Math.random() > 0.09 ? 'success' : 'error',
  timestamp: new Date(Date.now() - i * 240000),
  inputPreview: ['What is LLM observability?', 'How does Groq work?', 'Explain RAG', 'What are tokens?'][i % 4],
  outputPreview: 'LLM observability refers to...',
}));

const DEMO_CONVS = [
  { _id: uid(), sessionId: 'sess_a1b2c3d4', title: 'Explain LLM observability', updatedAt: new Date(), messageCount: 8 },
  { _id: uid(), sessionId: 'sess_e5f6g7h8', title: 'Groq vs OpenAI latency comparison', updatedAt: new Date(Date.now()-3.6e6), messageCount: 14 },
  { _id: uid(), sessionId: 'sess_i9j0k1l2', title: 'Token budgeting strategies', updatedAt: new Date(Date.now()-8.64e7), messageCount: 5 },
];

/* ══════════════════════════════════
   CHAT
══════════════════════════════════ */
function Chat() {
  const { sessionId } = useContext(Ctx);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState('');
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, stream]);

  const send = useCallback(async (txt) => {
    const text = (txt || input).trim();
    if (!text || loading) return;
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setLoading(true); setStream('');

    const userMsg = { role: 'user', content: text, id: uid(), ts: new Date() };
    setMsgs(p => [...p, userMsg]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text, sessionId,
          history: msgs.map(m => ({ role: m.role, content: m.content })),
          stream: true,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get('content-type') || '';

      let reply = '';

      if (ct.includes('event-stream') || ct.includes('stream')) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6).trim();
            if (d === '[DONE]') break;
            try {
              const p = JSON.parse(d);
              const delta = p.choices?.[0]?.delta?.content || p.delta || p.text || '';
              if (delta) { reply += delta; setStream(reply); }
            } catch {}
          }
        }
      } else {
        const data = await res.json();
        reply = data.response || data.message || data.content || data.reply || '';
      }

      setMsgs(p => [...p, { role: 'assistant', content: reply, id: uid(), ts: new Date() }]);
      setStream('');
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMsgs(p => [...p, { role: 'assistant', content: `Error: ${err.message}`, id: uid(), ts: new Date() }]);
      }
    } finally { setLoading(false); setStream(''); }
  }, [input, loading, msgs, sessionId]);

  const cancel = () => { abortRef.current?.abort(); setLoading(false); setStream(''); };

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const grow  = e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; };

  return (
    <div className="chat-outer">
      <div className="msgs">
        {msgs.length === 0 && !stream && (
          <div className="empty">
            <div className="empty-glyph">🫒</div>
            <div className="empty-h">Ollive Assistant</div>
            <div className="empty-p">Powered by Groq · Llama 3.1<br />Every inference is logged and observable in real-time.</div>
            <div className="starters">
              {STARTERS.map(s => <button key={s} className="starter" onClick={() => send(s)}>{s}</button>)}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={m.id} className={`msg-row ${m.role}`} style={{ animationDelay: `${i * .03}s` }}>
            <div className={`avatar ${m.role === 'user' ? 'user' : 'bot'}`}>
              {m.role === 'user' ? 'U' : '🫒'}
            </div>
            <div className="msg-body">
              <div className="msg-name">{m.role === 'user' ? 'you' : 'ollive'}</div>
              <div className={`bubble ${m.role === 'user' ? 'user' : 'bot'}`}>
                {m.role === 'assistant'
                  ? <ReactMarkdown>{m.content}</ReactMarkdown>
                  : m.content
                }
              </div>
              <div className="meta-row">{fmtT(m.ts)}</div>
            </div>
          </div>
        ))}

        {stream && (
          <div className="msg-row">
            <div className="avatar bot">🫒</div>
            <div className="msg-body">
              <div className="msg-name">ollive</div>
              <div className="bubble bot streaming">
                <ReactMarkdown>{stream}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {loading && !stream && (
          <div className="msg-row">
            <div className="avatar bot">🫒</div>
            <div className="bubble bot" style={{ padding: '12px 18px' }}>
              <div className="typing"><div className="td"/><div className="td"/><div className="td"/></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-zone">
        <div className="input-box">
          <div className="input-shell">
            <textarea
              ref={taRef}
              className="chat-ta"
              placeholder="Ask something… (Enter to send)"
              value={input}
              onChange={e => { setInput(e.target.value); grow(e); }}
              onKeyDown={onKey}
              rows={1}
              disabled={loading}
            />
          </div>
          {loading
            ? <button className="stop-btn" onClick={cancel}><Icon name="stop" size={14}/> Stop</button>
            : <button className="send-btn" onClick={() => send()} disabled={!input.trim()}>
                <Icon name="send" size={15}/>
              </button>
          }
        </div>
        <div className="input-foot">
          <span className="input-foot-dot"/>
          <span>groq · llama-3.1-8b-instant</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text3)' }}>{sessionId.slice(0, 14)}…</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   CONVERSATIONS
══════════════════════════════════ */
function Conversations() {
  const { setView, setSessionId } = useContext(Ctx);
  const [convs, setConvs] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    fetch(`${API}/conversations`)
      .then(r => r.json())
      .then(d => { setConvs(Array.isArray(d) ? d : []); setBusy(false); })
      .catch(() => { setConvs(DEMO_CONVS); setBusy(false); });
  }, []);

  const remove = id => {
    fetch(`${API}/conversations/${id}`, { method: 'DELETE' }).catch(() => {});
    setConvs(p => p.filter(c => c._id !== id));
  };

  const resume = sid => { setSessionId(sid); setView('chat'); };

  if (busy) return <div className="view-scroll"><div style={{ display:'flex', justifyContent:'center', padding:'40px' }}><div className="spinner"/></div></div>;

  if (!convs.length) return (
    <div className="view-scroll">
      <div className="empty" style={{ minHeight: 300 }}>
        <div className="empty-glyph" style={{ fontSize: 20 }}><Icon name="list" size={22}/></div>
        <div className="empty-h">No conversations</div>
        <div className="empty-p">Start a new chat to see sessions here.</div>
      </div>
    </div>
  );

  return (
    <div className="view-scroll">
      {convs.map((c, i) => (
        <div key={c._id} className="conv-card" style={{ animationDelay: `${i * .04}s` }}>
          <div className="conv-icon"><Icon name="chat" size={18}/></div>
          <div className="conv-content">
            <div className="conv-title">{c.title || `Session ${c.sessionId?.slice(0,8)}`}</div>
            <div className="conv-info">
              <span><Icon name="clock" size={10} style={{verticalAlign:'middle', marginRight:3}}/>{fmtD(c.updatedAt)}</span>
              {c.messageCount && <span>{c.messageCount} messages</span>}
              <span style={{ color: 'var(--text3)' }}>{c.sessionId?.slice(0,16)}…</span>
            </div>
          </div>
          <div className="conv-btns">
            <button className="icon-btn" title="Resume" onClick={() => resume(c.sessionId)}><Icon name="resume" size={14}/></button>
            <button className="icon-btn del" title="Delete" onClick={() => remove(c._id)}><Icon name="trash" size={14}/></button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════
   DASHBOARD
══════════════════════════════════ */
function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    fetch(`${API}/logs`)
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : []); setBusy(false); })
      .catch(() => { setLogs(DEMO_LOGS); setBusy(false); });
  }, []);

  if (busy) return <div className="view-scroll"><div style={{ display:'flex', justifyContent:'center', padding:'40px' }}><div className="spinner"/></div></div>;

  const n        = logs.length;
  const success  = logs.filter(l => l.status === 'success').length;
  const errors   = n - success;
  const avgLat   = n ? Math.round(logs.reduce((s, l) => s + (l.latencyMs || 0), 0) / n) : 0;
  const avgTok   = n ? Math.round(logs.reduce((s, l) => s + (l.totalTokens || 0), 0) / n) : 0;
  const pct      = n ? Math.round((success / n) * 100) : 0;

  const recent   = [...logs].slice(0, 10).reverse();
  const maxLat   = Math.max(...recent.map(l => l.latencyMs || 0), 1);

  const hours    = Array.from({ length: 8 }, (_, i) => {
    const t = Date.now() - i * 1800000;
    return logs.filter(l => Math.abs(new Date(l.timestamp) - t) < 900000).length;
  }).reverse();
  const maxH = Math.max(...hours, 1);

  return (
    <div className="view-scroll">
      <div className="stat-grid">
        {[
          { label: 'TOTAL REQUESTS', val: n, sub: 'all time', accent: '' },
          { label: 'AVG LATENCY',    val: `${avgLat}ms`, sub: 'per call', accent: avgLat > 1000 ? 'amber' : 'olive' },
          { label: 'SUCCESS RATE',   val: `${pct}%`, sub: `${errors} errors`, accent: 'green' },
          { label: 'AVG TOKENS',     val: avgTok, sub: 'per request', accent: '' },
        ].map(({ label, val, sub, accent }, i) => (
          <div key={label} className={`stat-card${accent ? ` stat-accent-${accent}` : ''}`} style={{ animationDelay: `${i*.05}s` }}>
            <div className="stat-label">{label}</div>
            <div className="stat-num">{val}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-head"><Icon name="zap" size={13}/> Latency per request (ms)</div>
          <div className="bar-row">
            {recent.map((l, i) => (
              <div key={i} className="bar-col">
                <div className="bar-el" title={`${Math.round(l.latencyMs)}ms`}
                  style={{ height: `${Math.round((l.latencyMs / maxLat) * 68)}px`,
                    background: l.latencyMs > 1000 ? 'rgba(212,152,28,.3)' : undefined }} />
                <div className="bar-lbl">{Math.round(l.latencyMs / 10) * 10}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-head"><Icon name="bar" size={13}/> Request volume (4h)</div>
          <div className="bar-row">
            {hours.map((h, i) => (
              <div key={i} className="bar-col">
                <div className="bar-el" title={`${h} requests`}
                  style={{ height: `${Math.max(Math.round((h / maxH) * 68), h > 0 ? 6 : 0)}px`,
                    background: 'rgba(140,189,28,.25)' }} />
                <div className="bar-lbl">{h}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-head"><span className="table-head-txt">Inference log — last {Math.min(logs.length, 12)} calls</span></div>
        <table className="log">
          <thead>
            <tr>
              <th>TIME</th><th>PROVIDER</th><th>MODEL</th>
              <th>LATENCY</th><th>TOKENS</th><th>STATUS</th><th>INPUT PREVIEW</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 12).map(l => (
              <tr key={l._id}>
                <td style={{ color: 'var(--text3)' }}>{fmtT(l.timestamp)}</td>
                <td>{l.provider}</td>
                <td style={{ color: 'var(--text3)', fontSize: 11 }}>{l.model?.split('-').slice(0,3).join('-')}</td>
                <td style={{ color: (l.latencyMs || 0) > 1000 ? 'var(--amber)' : 'var(--green)' }}>{fmtMs(l.latencyMs)}</td>
                <td>{l.totalTokens || '—'}</td>
                <td>
                  <span className={`badge ${l.status === 'success' ? 'badge-ok' : 'badge-err'}`}>
                    {l.status === 'success' ? <Icon name="check" size={10}/> : <Icon name="alert" size={10}/>}
                    {l.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.inputPreview || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   ROOT APP
══════════════════════════════════ */
export default function App() {
  const [view, setView] = useState('chat');
  const [sessionId, setSessionId] = useState(() => `sess_${uid()}`);
  const [recentConvs] = useState(DEMO_CONVS.slice(0, 3));

  const newChat = () => { setSessionId(`sess_${uid()}`); setView('chat'); };

  const NAV = [
    { id: 'chat',          label: 'Chat',            icon: 'chat' },
    { id: 'conversations', label: 'Conversations',   icon: 'list' },
    { id: 'logs',          label: 'Logs & Metrics',  icon: 'bar'  },
  ];

  const titleMap = { chat: 'Chat', conversations: 'Conversations', logs: 'Logs & Metrics' };

  return (
    <Ctx.Provider value={{ view, setView, sessionId, setSessionId, recentConvs }}>
      <style>{STYLES}</style>
      <div className="shell">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">🫒</div>
            <span className="brand-name">Ollive</span>
            <span className="brand-tag">beta</span>
          </div>

          <div className="sidebar-body">
            <button className="btn-new" onClick={newChat}>
              <Icon name="plus" size={15}/> New chat
            </button>

            <div className="nav-label">NAVIGATE</div>
            {NAV.map(n => (
              <div key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
                <Icon name={n.icon} size={15}/> {n.label}
              </div>
            ))}

            {recentConvs.length > 0 && <>
              <div className="nav-divider"/>
              <div className="nav-label">RECENT</div>
              {recentConvs.map(c => (
                <div key={c._id} className="conv-item" onClick={() => { setSessionId(c.sessionId); setView('chat'); }}>
                  <div className="conv-dot"/>
                  <span className="conv-item-label">{c.title}</span>
                  <span className="conv-item-time">{fmtD(c.updatedAt)}</span>
                </div>
              ))}
            </>}
          </div>

          <div className="sidebar-foot">
            <div className="online-row">
              <div className="online-dot"/>
              <span className="online-label">groq connected</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              llama-3.1-8b-instant
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          <div className="topbar">
            <span className="topbar-title">{titleMap[view]}</span>
            <div className="topbar-end">
              {view === 'chat' && <>
                <span className="chip chip-olive">streaming</span>
                <span className="chip chip-dim">pii redaction</span>
              </>}
              {view === 'logs' && <span className="chip chip-green">live</span>}
              <span className="chip chip-dim" style={{ fontFamily: 'var(--mono)', fontSize: 9 }}>
                {sessionId.slice(0,16)}…
              </span>
            </div>
          </div>

          {view === 'chat'          && <Chat />}
          {view === 'conversations' && <Conversations />}
          {view === 'logs'          && <Dashboard />}
        </div>

      </div>
    </Ctx.Provider>
  );
}
