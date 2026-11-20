/*! 问题地图 · 画板引擎（qmap.js）
 *  页面里只要有 <script type="text/markdown" id="qmap">地图文字</script>，
 *  再加载这个文件，就会显示成可以点读的问题地图。地图格式见 README.md。
 */
(function () {
'use strict';
window.__qmapEngineSrc = (document.currentScript && document.currentScript.src) || window.__qmapEngineSrc || '';
var QMAP_CSS = ":root{\n  /* 布局：一条安静的阅读栏，原文在右侧随时拉出；地图是同一个空间拉远后的样子。 */\n  --bg:#FBFBFC;\n  --wash:#F1F3F6;\n  --ink:#15171C;\n  --ink-2:#4A515E;\n  --ink-3:#8C93A1;\n  --line:#E3E6EB;\n  --accent:#2C5DD8;\n  --accent-wash:rgba(44,93,216,.08);\n  --fog:#B8C0CD;\n  --map:#F3F5F8;\n  --paper:#FFFFFF;\n  --font-body:\"Noto Sans SC\",-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Microsoft YaHei UI\",\"Microsoft YaHei\",system-ui,sans-serif;\n  --font-q:\"Noto Serif SC\",\"Songti SC\",\"STSong\",\"Source Han Serif SC\",\"SimSun\",serif;\n  --ease:cubic-bezier(.22,.8,.24,1);\n  --spring:cubic-bezier(.25,1.25,.4,1);\n  --spring-d:.55s;\n  --shadow:0 1px 2px rgba(20,24,33,.05),0 12px 32px rgba(20,24,33,.10);\n  --viewer-w:min(46vw,620px);\n  color-scheme:light;\n}\n@media (prefers-color-scheme:dark){\n  :root:not([data-theme=\"light\"]){\n    --bg:#101216; --wash:#1A1D23; --ink:#ECEEF2; --ink-2:#B4BAC6; --ink-3:#7D8493; --line:#272B33;\n    --accent:#86A6FF; --accent-wash:rgba(134,166,255,.12); --fog:#4B5262; --map:#0C0E11; --paper:#16191F;\n    --shadow:0 1px 2px rgba(0,0,0,.4),0 14px 36px rgba(0,0,0,.5); color-scheme:dark;\n  }\n}\n:root[data-theme=\"dark\"]{\n  --bg:#101216; --wash:#1A1D23; --ink:#ECEEF2; --ink-2:#B4BAC6; --ink-3:#7D8493; --line:#272B33;\n  --accent:#86A6FF; --accent-wash:rgba(134,166,255,.12); --fog:#4B5262; --map:#0C0E11; --paper:#16191F;\n  --shadow:0 1px 2px rgba(0,0,0,.4),0 14px 36px rgba(0,0,0,.5); color-scheme:dark;\n}\n\n*{box-sizing:border-box}\n[hidden]{display:none!important}\nhtml,body{height:100%;margin:0}\nbody{background:var(--bg);color:var(--ink);font-family:var(--font-body);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow:hidden}\nbutton{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}\nbutton:disabled{cursor:default;opacity:.4}\ninput,textarea{font:inherit;color:inherit}\n:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:6px}\n::selection{background:color-mix(in srgb,var(--accent) 22%,transparent)}\n.lbl{font-size:12.5px;letter-spacing:.06em;color:var(--ink-3);font-weight:500}\n.hint{font-size:13px;color:var(--ink-3)}\n.muted{color:var(--ink-3)}\n.press{transition:transform .35s var(--spring)}\n.press:active{transform:scale(.96);transition-duration:.08s}\n\n/* 顶栏 */\n.bar{position:fixed;inset:0 0 auto 0;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 14px 0 18px;z-index:30;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:saturate(1.6) blur(18px);-webkit-backdrop-filter:saturate(1.6) blur(18px);border-bottom:1px solid transparent;transition:border-color .2s}\n.bar.edge{border-bottom-color:var(--line)}\nbody[data-view=\"map\"] .bar{background:color-mix(in srgb,var(--map) 70%,transparent)}\n.space-btn{display:flex;align-items:center;gap:6px;font-weight:600;font-size:15px;padding:6px 10px;margin-left:-10px;border-radius:10px;max-width:56vw}\n.space-btn .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.space-btn:hover{background:var(--wash)}\n.space-btn svg{flex:none;color:var(--ink-3)}\n.bar-right{display:flex;gap:4px;align-items:center}\n.icon-btn{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:var(--ink-2);transition:background .15s,color .15s,transform .35s var(--spring)}\n.icon-btn:hover{background:var(--wash);color:var(--ink)}\n.icon-btn:active{transform:scale(.9);transition-duration:.08s}\n.icon-btn.on{background:var(--ink);color:var(--bg)}\n.ai-dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--fog);margin-right:4px;transition:background .3s}\n.ai-dot.is-ai{background:#2FA36B}\n.ai-dot.is-ext{background:#C98A1B}\n\n/* 视图 */\n.view{position:fixed;inset:0;transition:opacity .3s var(--ease),transform var(--spring-d) var(--spring),visibility 0s linear 0s}\n#reading{overflow-y:auto;overscroll-behavior:contain;padding-top:56px;transition:opacity .3s var(--ease),transform var(--spring-d) var(--spring),right var(--spring-d) var(--spring)}\nbody.viewer-open #reading{right:var(--viewer-w)}\n#map{background:var(--map);overflow:hidden;touch-action:none;cursor:grab}\n#map.dragging{cursor:grabbing}\nbody[data-view=\"read\"] #map{opacity:0;transform:scale(1.04);visibility:hidden;pointer-events:none;transition:opacity .25s var(--ease),transform .5s var(--ease),visibility 0s linear .5s}\nbody[data-view=\"map\"] #reading{opacity:0;transform:scale(.95);visibility:hidden;pointer-events:none;transition:opacity .22s var(--ease),transform .5s var(--ease),visibility 0s linear .5s}\nbody.instant .view{transition:none!important}\n\n/* 阅读栏 */\n.col{max-width:680px;margin:0 auto;padding:44px 28px 180px}\n.trail{display:flex;flex-wrap:wrap;align-items:center;gap:2px 4px;margin-bottom:18px;font-size:13px;color:var(--ink-3);min-height:20px}\n.crumb{padding:2px 6px;margin:0 -2px;border-radius:6px;color:var(--ink-3);max-width:16em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.crumb:hover{color:var(--ink);background:var(--wash)}\n.trail .sep{opacity:.5}\n.q{font-family:var(--font-q);font-weight:600;font-size:34px;line-height:1.38;letter-spacing:.01em;margin:0 0 30px;text-wrap:balance}\n.figure-head{margin:-6px 0 28px;border-radius:14px;overflow:hidden;border:1px solid var(--line);background:var(--paper);cursor:zoom-in}\n.figure-head img{display:block;max-width:100%;margin:0 auto}\n.figure-head .cap{font-size:12.5px;color:var(--ink-3);padding:8px 12px;border-top:1px solid var(--line);background:var(--bg)}\n\n.guess{background:var(--wash);border-radius:18px;padding:18px 20px 16px;display:grid;gap:10px}\n.guess textarea,.own textarea{width:100%;border:0;background:transparent;resize:none;font-size:17px;line-height:1.7;padding:0;outline:none;min-height:30px}\ntextarea::placeholder,input::placeholder{color:var(--ink-3)}\n.row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}\n.row.end{justify-content:flex-end}\n.spacer{flex:1}\n.btn-primary{background:var(--ink);color:var(--bg);padding:8px 18px;border-radius:999px;font-size:14.5px;font-weight:500;transition:transform .35s var(--spring),opacity .2s}\n.btn-primary:hover{opacity:.9}\n.btn-primary:active{transform:scale(.95);transition-duration:.08s}\n.btn-text{color:var(--ink-2);font-size:14px;padding:6px 4px;border-radius:8px}\n.btn-text:hover{color:var(--ink)}\n.btn-accent{color:var(--accent);font-size:14px;font-weight:500;padding:6px 4px}\n.btn-secondary{border:1px solid var(--line);border-radius:999px;padding:7px 16px;font-size:14px;background:var(--bg);transition:background .15s,transform .35s var(--spring)}\n.btn-secondary:hover{background:var(--wash)}\n.btn-secondary:active{transform:scale(.96)}\n.prefetch{font-size:12.5px;color:var(--ink-3);display:flex;align-items:center;gap:8px}\n\n.guess-card{border-left:2px solid var(--line);padding:2px 0 2px 16px;margin:0 0 30px}\n.guess-card p{margin:4px 0 0;font-size:15.5px;color:var(--ink-2)}\n.guess-card .note{color:var(--ink);font-size:15px;margin-top:8px}\n\n.secs{display:grid;gap:30px}\n.sec{position:relative}\n.sec .head{display:flex;align-items:center;gap:8px;margin-bottom:8px}\n.sec .draw{margin-left:auto;font-size:12.5px;color:var(--ink-3);padding:3px 8px;border-radius:8px;opacity:0;transition:opacity .2s,background .15s}\n.sec:hover .draw,.sec .draw:focus-visible{opacity:1}\n.sec .draw:hover{background:var(--wash);color:var(--ink)}\n.enter{animation:rise var(--spring-d) var(--spring) both}\n@keyframes rise{from{opacity:0;transform:translateY(16px);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}\n.prose{font-size:17px;line-height:1.85;color:var(--ink)}\n.prose p{margin:0 0 .85em}\n.prose p:last-child{margin-bottom:0}\n.prose ul,.prose ol{margin:0 0 .85em;padding-left:1.3em}\n.prose li{margin:.25em 0}\n.prose li::marker{color:var(--ink-3)}\n.prose strong{font-weight:600}\n.prose code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.88em;background:var(--wash);padding:.1em .35em;border-radius:5px}\n.prose blockquote{margin:0 0 .85em;padding-left:14px;border-left:2px solid var(--line);color:var(--ink-2)}\n.tbl{overflow-x:auto;margin:4px 0 .9em}\n.prose table{border-collapse:collapse;font-size:14.5px;line-height:1.6;min-width:100%}\n.prose th{text-align:left;font-weight:600;color:var(--ink-2);font-size:13px;padding:6px 14px 8px 0;border-bottom:1px solid var(--line);white-space:nowrap}\n.prose td{padding:9px 14px 9px 0;border-bottom:1px solid var(--line);vertical-align:top}\n.prose tr:last-child td{border-bottom:0}\n.refs{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:13px;color:var(--ink-3);margin-top:-6px}\n.ref{padding:3px 9px;border-radius:999px;background:var(--wash);color:var(--ink-2);font-size:12.5px;transition:background .15s,transform .35s var(--spring)}\n.ref:hover{background:var(--accent-wash);color:var(--accent)}\n.ref:active{transform:scale(.94)}\n\n/* 图 */\n.fig{margin:6px 0 4px;padding:18px 16px 12px;border-radius:16px;background:var(--paper);border:1px solid var(--line);overflow-x:auto}\n.fig svg{display:block;width:100%;height:auto;max-height:460px;overflow:visible}\n.fig .cap{font-size:12.5px;color:var(--ink-3);margin-top:8px}\n.fig svg text{font-family:var(--font-body);font-size:14px;fill:var(--ink-2)}\n.fig svg :where(rect,circle,ellipse,path,polygon,polyline,line):where(:not([stroke])){stroke:var(--ink-3)}\n.fig svg :where(rect,circle,ellipse,path,polygon,polyline):where(:not([fill])){fill:none}\n.fig svg :where(rect,circle,ellipse,path,polygon,polyline,line):where(:not([stroke-width])){stroke-width:1.5}\n.fig svg .c-ink{stroke:var(--ink)} .fig svg text.c-ink{fill:var(--ink);stroke:none}\n.fig svg .c-muted{stroke:var(--ink-3)} .fig svg text.c-muted{fill:var(--ink-3);stroke:none}\n.fig svg .c-line{stroke:var(--line)}\n.fig svg .c-accent{stroke:var(--accent)} .fig svg text.c-accent{fill:var(--accent);stroke:none}\n.fig svg .c-soft{fill:var(--accent-wash)}\n.fig svg .c-paper{fill:var(--bg)}\n.fig svg marker *{fill:currentColor;stroke:none}\n.fig svg .ax{stroke:var(--ink-3)} .fig svg .grid{stroke:var(--line);stroke-width:1}\n.fig svg .tick{font-size:12px;fill:var(--ink-3);font-variant-numeric:tabular-nums}\n.fig .legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;color:var(--ink-2);margin-top:6px}\n.fig .legend i{display:inline-block;width:10px;height:3px;border-radius:2px;margin-right:6px;vertical-align:3px}\n.fig-err{font-size:13px;color:var(--ink-3)}\n\n.term{border-bottom:1.5px dotted color-mix(in srgb,var(--accent) 65%,transparent);cursor:help;transition:border-color .4s,background .15s;border-radius:2px}\n.term.auto{border-bottom-color:color-mix(in srgb,var(--accent) 35%,transparent)}\n.term:hover,.term.open{background:var(--accent-wash)}\n.term.learned{border-bottom-color:transparent}\n.term.learned:hover{border-bottom-color:var(--line)}\n\n.deeper{margin-top:6px;width:100%;display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:14px;color:var(--ink-2);font-size:15px;transition:background .15s,color .15s,transform .35s var(--spring);text-align:left}\n.deeper:hover{background:var(--wash);color:var(--ink)}\n.deeper:active{transform:scale(.985)}\n.deeper .chev{transition:transform .35s var(--spring)}\n.deeper:hover .chev{transform:translateY(2px)}\n.deeper .nxt{color:var(--ink);font-weight:500}\n.deeper .cnt{margin-left:auto;font-size:12.5px;color:var(--ink-3);font-variant-numeric:tabular-nums}\n.deeper.pending{cursor:default}\n.depth{display:inline-flex;gap:3px}\n.depth i{width:14px;height:3px;border-radius:2px;background:var(--line);transition:background .4s}\n.depth i.on{background:var(--ink-3)}\n\n.thinking{display:flex;align-items:center;gap:12px;color:var(--ink-3);font-size:15px;padding:6px 0}\n.dots{display:inline-flex;gap:4px}\n.dots i{width:5px;height:5px;border-radius:50%;background:currentColor;animation:blink 1.2s infinite ease-in-out}\n.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}\n@keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}\n.err{color:var(--ink-2);font-size:14.5px;background:var(--wash);border-radius:12px;padding:12px 14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}\n\n.ext{background:var(--wash);border-radius:18px;padding:18px 20px;display:grid;gap:10px}\n.ext h3{margin:0;font-size:15.5px;font-weight:600}\n.ext p{margin:0;font-size:14.5px;color:var(--ink-2);line-height:1.7}\n.ext textarea{width:100%;min-height:70px;border:1px dashed var(--fog);border-radius:12px;background:var(--bg);padding:10px 12px;font-size:14px;resize:vertical;outline:none}\n.ext textarea:focus{border-color:var(--accent)}\n.prompt-preview{width:100%;height:170px;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.55;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink-2);padding:10px 12px;resize:vertical}\n.waiting{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:#A26E10}\n.waiting .pulse{width:7px;height:7px;border-radius:50%;background:#C98A1B;animation:pulse 1.6s infinite}\n@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(201,138,27,.45)}100%{box-shadow:0 0 0 9px rgba(201,138,27,0)}}\n\n.block{margin-top:56px;padding-top:28px;border-top:1px solid var(--line)}\n.own{display:grid;gap:10px}\n.own textarea{font-family:var(--font-q);font-weight:600;font-size:19px;line-height:1.6}\n.own-done{display:grid;gap:8px}\n.own-text{font-family:var(--font-q);font-weight:600;font-size:21px;line-height:1.6;margin:0;padding-left:16px;border-left:3px solid var(--accent)}\n.own-note{margin:0;font-size:14.5px;color:var(--ink-2)}\n\n/* 讨论 */\n.talk{display:grid;gap:16px}\n.turn{display:grid;gap:6px}\n.turn.me .who,.turn.ai .who{font-size:12px;color:var(--ink-3);letter-spacing:.04em}\n.turn.me .txt{font-size:15.5px;color:var(--ink-2);line-height:1.7;padding-left:12px;border-left:2px solid var(--line)}\n.turn.ai .prose{font-size:16px;line-height:1.8}\n.keep{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;border-radius:12px;background:var(--accent-wash);font-size:14px;color:var(--ink)}\n.keep .k{flex:1;min-width:12em}\n.keep .k b{font-weight:600}\n.keep.kept{background:var(--wash);color:var(--ink-3)}\n.composer{display:grid;gap:8px;border:1px solid var(--line);border-radius:16px;padding:12px 14px 10px;background:var(--paper);transition:border-color .2s,box-shadow .3s}\n.composer:focus-within{border-color:color-mix(in srgb,var(--accent) 50%,var(--line));box-shadow:0 0 0 4px var(--accent-wash)}\n.composer textarea{border:0;background:transparent;outline:none;resize:none;font-size:16px;line-height:1.65;padding:0;min-height:26px}\n.composer .row{gap:8px}\n.chip-btn{font-size:13px;padding:6px 12px;border-radius:999px;background:var(--wash);color:var(--ink-2);transition:background .15s,transform .35s var(--spring)}\n.chip-btn:hover{background:var(--line);color:var(--ink)}\n.chip-btn:active{transform:scale(.94)}\n.chip-btn.primary{background:var(--ink);color:var(--bg)}\n.kbd{font-size:11.5px;color:var(--ink-3);margin-left:4px}\n.chip-btn.primary .kbd{color:color-mix(in srgb,var(--bg) 65%,transparent)}\n\n.next{display:grid;gap:6px}\n.next ul{list-style:none;margin:4px 0 0;padding:0;display:grid;gap:2px}\n.next-item{width:100%;display:flex;align-items:flex-start;gap:14px;padding:11px 12px;margin:0 -12px;border-radius:12px;text-align:left;font-size:16.5px;line-height:1.55;color:var(--ink);transition:background .15s,transform .35s var(--spring)}\n.next-item:hover{background:var(--wash)}\n.next-item:active{transform:scale(.985);transition-duration:.08s}\n.next-item .t{flex:1}\n.next-item .go{color:var(--ink-3);opacity:0;transition:opacity .15s,transform .3s var(--spring);margin-top:3px}\n.next-item:hover .go{opacity:1;transform:translateX(3px)}\n.glyph{flex:none;width:12px;height:12px;border-radius:50%;margin-top:7px}\n.glyph.fog{border:1.5px dashed var(--fog)}\n.glyph.seen{border:1.5px solid var(--ink-3)}\n.glyph.done{background:var(--accent)}\n.next-item.fog .t{color:var(--ink-2)}\n.foot-tools{margin-top:40px;display:flex;gap:18px;flex-wrap:wrap}\n.foot-tools button{font-size:13px;color:var(--ink-3)}\n.foot-tools button:hover{color:var(--ink)}\n\n/* 划词工具条 & 解释卡 */\n.selbar{position:fixed;z-index:55;display:flex;gap:2px;padding:4px;border-radius:12px;background:var(--ink);color:var(--bg);box-shadow:var(--shadow);opacity:0;transform:translateY(6px) scale(.92);transform-origin:50% 100%;transition:opacity .14s,transform .4s var(--spring);pointer-events:none}\n.selbar.show{opacity:1;transform:none;pointer-events:auto}\n.selbar button{padding:6px 11px;border-radius:9px;font-size:13.5px;color:inherit;white-space:nowrap}\n.selbar button:hover{background:color-mix(in srgb,var(--bg) 16%,transparent)}\n.card{position:fixed;z-index:50;width:320px;max-width:calc(100vw - 24px);background:var(--bg);border-radius:16px;box-shadow:var(--shadow);border:1px solid var(--line);padding:16px 18px 12px;display:grid;gap:8px;opacity:0;transform:translateY(6px) scale(.96);transition:opacity .16s var(--ease),transform .45s var(--spring);pointer-events:none}\n.card.show{opacity:1;transform:none;pointer-events:auto}\n.card h4{margin:0;font-size:15.5px;font-weight:600;line-height:1.5}\n.card p{margin:0;font-size:14.5px;line-height:1.7;color:var(--ink-2)}\n.card .ex{color:var(--ink-3);font-size:14px}\n.card .row{margin-top:4px;gap:6px}\n.card .src{font-size:12px;color:var(--ink-3)}\n\n/* 地图 */\n#world{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}\n#edges{position:absolute;left:0;top:0;overflow:visible;width:1px;height:1px}\n#edges path{fill:none;stroke:var(--line);stroke-width:1.5}\n#edges path.to-fog{stroke:var(--fog);stroke-dasharray:3 5;stroke-width:1.2}\n#edges path.hot{stroke:var(--ink-3)}\n.mnode{position:absolute;display:flex;flex-direction:column;align-items:center;gap:8px;width:190px;margin-left:-95px;margin-top:-7px;text-align:center;cursor:pointer}\n.mnode .dot{width:14px;height:14px;border-radius:50%;background:var(--map);border:1.5px solid var(--ink-3);transition:transform .4s var(--spring)}\n.mnode:hover .dot{transform:scale(1.35)}\n.mnode .ml{background:color-mix(in srgb,var(--map) 88%,transparent);font-size:13.5px;line-height:1.5;color:var(--ink-2);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;padding:2px 6px;border-radius:8px;transition:background .15s,color .15s}\n.mnode:hover .ml{background:color-mix(in srgb,var(--bg) 85%,transparent);color:var(--ink)}\n.mnode.done .dot{background:var(--accent);border-color:var(--accent)}\n.mnode.done .ml{color:var(--ink);font-family:var(--font-q);font-weight:600;font-size:14px}\n.mnode.fog .dot{border:1.5px dashed var(--fog);background:transparent}\n.mnode.fog .ml{color:var(--ink-3);opacity:.85}\n.mnode.root{width:240px;margin-left:-120px}\n.mnode.root .ml{font-family:var(--font-q);font-weight:600;font-size:16px;color:var(--ink);-webkit-line-clamp:4}\n.mnode.cur .dot{box-shadow:0 0 0 6px var(--accent-wash),0 0 0 1.5px var(--accent)}\n.mnode.born{animation:born .8s var(--spring) both;animation-delay:var(--d,0ms)}\n@keyframes born{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:none}}\n.map-foot{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:flex-end;padding:18px 22px;pointer-events:none;font-size:12.5px;color:var(--ink-3);gap:12px;flex-wrap:wrap}\n.map-foot > *{pointer-events:auto}\n.legend{display:flex;gap:16px;align-items:center;flex-wrap:wrap}\n.legend span{display:inline-flex;align-items:center;gap:6px}\n.legend .glyph{margin:0;width:9px;height:9px}\n.map-count{font-variant-numeric:tabular-nums;color:var(--ink-2)}\n.map-back{background:var(--ink);color:var(--bg);padding:9px 16px;border-radius:999px;font-size:13.5px;box-shadow:var(--shadow);transition:transform .35s var(--spring)}\n.map-back:active{transform:scale(.95)}\n\n/* 原文面板 */\n.viewer{position:fixed;top:56px;right:0;bottom:0;width:var(--viewer-w);background:var(--wash);border-left:1px solid var(--line);z-index:20;display:flex;flex-direction:column;transform:translateX(100%);transition:transform var(--spring-d) var(--spring);visibility:hidden}\nbody.viewer-open .viewer{transform:none;visibility:visible}\nbody[data-view=\"map\"] .viewer{transform:translateX(100%)}\n.v-bar{display:flex;align-items:center;gap:6px;padding:8px 10px 8px 16px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--wash) 90%,transparent)}\n.v-title{flex:1;min-width:0;font-size:13.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.v-page{font-size:12.5px;color:var(--ink-3);font-variant-numeric:tabular-nums;min-width:4.5em;text-align:right}\n.v-btn{height:32px;padding:0 10px;border-radius:9px;font-size:13px;color:var(--ink-2);display:inline-flex;align-items:center;gap:6px;transition:background .15s,transform .35s var(--spring)}\n.v-btn:hover{background:var(--line);color:var(--ink)}\n.v-btn:active{transform:scale(.93)}\n.v-btn.on{background:var(--ink);color:var(--bg)}\n.v-scroll{flex:1;overflow:auto;padding:18px 18px 120px;display:grid;gap:14px;justify-items:center;align-content:start}\n.v-page-box{position:relative;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08),0 6px 20px rgba(0,0,0,.06);border-radius:4px;overflow:hidden}\n.v-page-box canvas{display:block}\n.v-page-box .pn{position:absolute;left:8px;bottom:6px;font-size:11px;color:#9aa0aa}\n.v-page-box.flash{animation:flash 1.4s var(--ease)}\n@keyframes flash{0%{box-shadow:0 0 0 0 var(--accent)}20%{box-shadow:0 0 0 4px var(--accent)}100%{box-shadow:0 1px 3px rgba(0,0,0,.08),0 6px 20px rgba(0,0,0,.06)}}\n.v-text{max-width:620px;background:var(--bg);border-radius:12px;padding:20px 22px;font-size:15px;line-height:1.85;white-space:pre-wrap;color:var(--ink)}\n.v-text .pm{display:block;font-size:12px;color:var(--ink-3);margin:18px 0 6px}\n.crop-on .v-page-box{cursor:crosshair}\n.crop-rect{position:absolute;border:1.5px solid var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent);border-radius:3px;pointer-events:none}\n.v-empty{padding:40px 24px;text-align:center;color:var(--ink-2);font-size:14.5px;display:grid;gap:12px;justify-items:center}\n.v-result{position:absolute;left:12px;right:12px;bottom:12px;max-height:58%;overflow:auto;background:var(--bg);border-radius:18px;box-shadow:var(--shadow);border:1px solid var(--line);padding:16px 18px;display:grid;gap:12px;transform:translateY(calc(100% + 24px));transition:transform var(--spring-d) var(--spring)}\n.v-result.show{transform:none}\n.v-result img{max-width:100%;max-height:180px;border-radius:8px;border:1px solid var(--line);justify-self:start}\n.v-result .prose{font-size:15.5px;line-height:1.8}\n.v-result .prose h4{margin:12px 0 4px;font-size:12.5px;color:var(--ink-3);font-weight:500;letter-spacing:.06em}\n\n/* 面板 */\n.scrim{position:fixed;inset:0;background:rgba(10,12,16,.18);z-index:39;opacity:0;pointer-events:none;transition:opacity .25s}\n.scrim.show{opacity:1;pointer-events:auto}\n.sheet{position:fixed;top:10px;right:10px;bottom:10px;width:440px;max-width:calc(100vw - 20px);background:var(--bg);border-radius:20px;box-shadow:var(--shadow);border:1px solid var(--line);z-index:40;display:flex;flex-direction:column;transform:translateX(calc(100% + 24px));transition:transform var(--spring-d) var(--spring);overflow:hidden}\n.sheet.show{transform:none}\n.sheet-head{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 8px 22px}\n.sheet-head h2{margin:0;font-size:18px;font-weight:600}\n.sheet-body{padding:6px 22px 28px;overflow-y:auto;display:grid;gap:22px;align-content:start}\n.sheet-sub{margin:0;font-size:14px;color:var(--ink-2);line-height:1.7}\n.list{list-style:none;margin:0;padding:0;display:grid;gap:2px}\n.list-item{display:flex;align-items:center;gap:12px;padding:11px 12px;margin:0 -12px;border-radius:12px}\n.list-item.btn{width:calc(100% + 24px);text-align:left}\n.list-item.btn:hover{background:var(--wash)}\n.list-item .main{flex:1;min-width:0}\n.list-item .t{font-size:15px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.list-item .m{font-size:12.5px;color:var(--ink-3);font-variant-numeric:tabular-nums}\n.list-item .check{color:var(--accent)}\n.field{display:grid;gap:6px}\n.field input,.field textarea{width:100%;border:1px solid var(--line);background:var(--bg);border-radius:12px;padding:10px 12px;font-size:15px;outline:none;resize:vertical}\n.field input:focus,.field textarea:focus{border-color:var(--accent)}\n.drop{border:1.5px dashed var(--fog);border-radius:16px;padding:18px;display:grid;gap:8px;justify-items:start;transition:border-color .15s,background .15s}\n.drop.over{border-color:var(--accent);background:var(--accent-wash)}\ndetails summary{cursor:pointer;font-size:14px;color:var(--ink-2);list-style:none}\ndetails summary::-webkit-details-marker{display:none}\ndetails[open] summary{margin-bottom:10px}\n.seg{display:inline-flex;background:var(--wash);border-radius:10px;padding:3px;flex-wrap:wrap}\n.seg button{padding:6px 12px;border-radius:8px;font-size:13.5px;color:var(--ink-2);transition:background .2s,color .2s}\n.seg button.on{background:var(--bg);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}\n.menu-sec{display:grid;gap:10px}\n.menu-sec h3{margin:0;font-size:13px;font-weight:500;color:var(--ink-3);letter-spacing:.04em}\n.menu-links{display:grid;gap:2px}\n.menu-links button{text-align:left;padding:10px 12px;margin:0 -12px;border-radius:10px;font-size:15px}\n.menu-links button:hover{background:var(--wash)}\n.menu-links button.danger{color:#C2412D}\n.check-row{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--ink-2);line-height:1.6;cursor:pointer}\n.check-row input{margin-top:4px;accent-color:var(--accent)}\n.steps{margin:0;padding-left:1.3em;font-size:14px;color:var(--ink-2);line-height:1.75}\n.toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,24px) scale(.96);background:var(--ink);color:var(--bg);padding:10px 18px;border-radius:999px;font-size:14px;z-index:60;opacity:0;transition:opacity .2s,transform var(--spring-d) var(--spring);pointer-events:none;max-width:calc(100vw - 32px);text-align:center}\n.toast.show{opacity:1;transform:translate(-50%,0)}\n\n/* 共享元素过渡 */\n::view-transition-group(qtitle){animation-duration:var(--spring-d);animation-timing-function:var(--spring)}\n::view-transition-old(qtitle),::view-transition-new(qtitle){height:100%;width:auto;object-fit:none;object-position:left top}\n::view-transition-old(root){animation:.22s var(--ease) both vt-out}\n::view-transition-new(root){animation:.38s var(--ease) .04s both vt-in}\n@keyframes vt-out{to{opacity:0}}\n@keyframes vt-in{from{opacity:0;transform:translateY(10px)}}\n\n@media (max-width:860px){\n  :root{--viewer-w:100vw}\n  body.viewer-open #reading{right:0}\n  .viewer{z-index:35}\n}\n@media (max-width:640px){\n  .col{padding:28px 20px 160px}\n  .q{font-size:27px}\n  .prose{font-size:16.5px}\n  .sheet{top:auto;left:8px;right:8px;bottom:8px;width:auto;max-height:86vh;transform:translateY(calc(100% + 20px))}\n}\n@media (prefers-reduced-motion:reduce){\n  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}\n}\n\n/* ===================== v3 ===================== */\n.waiting-pill{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:#A26E10;background:color-mix(in srgb,#C98A1B 12%,transparent);padding:6px 12px;border-radius:999px;margin-right:6px;transition:transform .35s var(--spring)}\n.waiting-pill:active{transform:scale(.95)}\n.waiting-pill .pulse{width:7px;height:7px;border-radius:50%;background:#C98A1B;animation:pulse 1.6s infinite}\n.waiting-pill.busy{color:var(--accent);background:var(--accent-wash)}\n.waiting-pill.busy .pulse{background:var(--accent);animation:blink 1.2s infinite}\n.thinking-s{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--ink-3)}\n.trail .nid{margin-left:auto;font-size:11.5px;color:var(--ink-3);opacity:.6;font-variant-numeric:tabular-nums;letter-spacing:.04em}\n.btn-text.small{font-size:13px;color:var(--accent);padding:4px 0}\n.guess-card .note{margin-top:10px;font-size:15.5px;line-height:1.8}\n.fogbox{border:1.5px dashed var(--fog);border-radius:18px;padding:20px 22px 16px;display:grid;gap:10px}\n.fogbox p{margin:0;font-size:15px;color:var(--ink-2);line-height:1.75}\n.fogbox textarea{width:100%;border:0;background:transparent;resize:none;font-size:17px;line-height:1.7;padding:0;outline:none;min-height:30px}\n.partial{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:6px 2px}\n.sec.fresh,.prose.fresh,.note.fresh{animation:fresh 3.2s var(--ease) both}\n@keyframes fresh{0%,25%{background:color-mix(in srgb,var(--accent) 9%,transparent);box-shadow:0 0 0 10px color-mix(in srgb,var(--accent) 9%,transparent)}100%{background:transparent;box-shadow:0 0 0 10px transparent}}\n.sec.fresh{border-radius:12px}\n.ask{display:grid;gap:12px}\n.quick{display:flex;flex-wrap:wrap;align-items:center;gap:8px}\n.quick .hint{margin-right:2px}\n.reply{border-left:2px solid var(--accent);padding:4px 0 4px 16px;display:grid;gap:6px}\n.reply .who{font-size:12px;color:var(--ink-3);letter-spacing:.04em}\n.reply .prose{font-size:16px;line-height:1.8}\n.own-note{font-size:15px;color:var(--ink-2)}\n.glyph.unread{border:1.5px solid var(--fog)}\n.next-item.unread .t{color:var(--ink)}\n.mnode.unread .dot{border-color:var(--fog);background:var(--map)}\n.mnode.unread .ml{color:var(--ink-2)}\n.mnode.seen .dot{background:var(--map);border-color:var(--ink-2)}\n#edges path.rel{stroke:var(--accent);stroke-opacity:.28;stroke-dasharray:2 6;stroke-width:1.3}\n#edges.bloom path{stroke-dasharray:1400;stroke-dashoffset:1400;animation:draw 1.6s var(--ease) .15s forwards}\n#edges.bloom path.rel,#edges.bloom path.to-fog{animation-delay:.9s}\n@keyframes draw{to{stroke-dashoffset:0}}\n.map-empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:var(--ink-3);font-size:15px;line-height:1.9;pointer-events:none}\n\n/* 空白画板 */\n.onboard{padding-top:8px}\n.onboard .q{margin-bottom:14px}\n.onboard .lead{font-size:16.5px;line-height:1.8;color:var(--ink-2);margin:0 0 34px}\n.steps3{list-style:none;margin:0;padding:0;display:grid;gap:12px}\n.steps3 li{display:flex;gap:16px;padding:20px 22px;border-radius:18px;background:var(--wash)}\n.steps3 .sn{flex:none;width:28px;height:28px;border-radius:50%;background:var(--ink);color:var(--bg);display:grid;place-items:center;font-size:14px;font-weight:600;margin-top:1px}\n.steps3 .sb{flex:1;min-width:0;display:grid;gap:10px}\n.steps3 h3{margin:0;font-size:16.5px;font-weight:600}\n.steps3 h3 .muted{font-weight:400;font-size:13px;margin-left:6px}\n.steps3 p{margin:0;font-size:14.5px;color:var(--ink-2);line-height:1.75}\n.steps3 .field textarea{background:var(--bg)}\n.steps3 .row{gap:10px}\n.steps3 a.btn-text{text-decoration:none}\nkbd{font-family:inherit;font-size:12.5px;padding:1px 6px;border-radius:5px;border:1px solid var(--line);background:var(--bg);box-shadow:0 1px 0 var(--line)}\ncode{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.88em;background:var(--bg);padding:.1em .35em;border-radius:5px}\n.side-opts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}\n.side-opts .opt{border:1px solid var(--line);border-radius:16px;padding:16px 18px;display:grid;gap:6px;align-content:start}\n.side-opts .opt b{font-size:14.5px;font-weight:600}\n.side-opts .opt .muted{font-size:12.5px;margin-left:6px}\n.side-opts .opt p{margin:0;font-size:13.5px;color:var(--ink-2);line-height:1.7}\n.side-opts .opt .btn-text{color:var(--accent);padding-left:0}\n@media (max-width:640px){.side-opts{grid-template-columns:1fr}}\n\n/* 合并卡片 */\n.mcard{position:fixed;left:50%;bottom:22px;z-index:45;width:min(460px,calc(100vw - 24px));background:var(--bg);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);padding:14px 16px 10px;display:grid;gap:6px;transform:translate(-50%,calc(100% + 40px)) scale(.96);opacity:0;transition:transform var(--spring-d) var(--spring),opacity .2s;pointer-events:none}\n.mcard.show{transform:translate(-50%,0);opacity:1;pointer-events:auto}\n.mc-head{display:flex;align-items:center;gap:8px}\n.mc-head b{font-size:15px;font-weight:600}\n.mc-head .btn-text{padding:2px 6px;color:var(--ink-3)}\n.mc-sum{margin:0;font-size:13.5px;color:var(--ink-2);line-height:1.6}\n.mcard ul{list-style:none;margin:2px 0 0;padding:0;display:grid}\n.mcard li button{width:100%;display:flex;align-items:baseline;gap:10px;text-align:left;padding:7px 8px;margin:0 -8px;border-radius:10px;font-size:14.5px;transition:background .15s}\n.mcard li button:hover{background:var(--wash)}\n.mcard li .g{flex:none;width:14px;color:var(--accent);font-weight:600}\n.mcard li .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.mcard li .s{flex:none;font-size:12px;color:var(--ink-3);max-width:12em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.mcard .row .btn-text{color:var(--accent);font-size:13.5px}\n\n/* 面板：导出 */\n.exp{display:grid;gap:8px}\n.exp-item{display:grid;gap:4px;text-align:left;padding:14px 16px;border-radius:14px;border:1px solid var(--line);transition:background .15s,border-color .15s,transform .35s var(--spring)}\n.exp-item:hover{background:var(--wash);border-color:transparent}\n.exp-item:active{transform:scale(.985)}\n.exp-item b{font-size:15px;font-weight:600}\n.exp-item span{font-size:13.5px;color:var(--ink-2);line-height:1.65}\n.paste-box{width:100%;border:1px dashed var(--fog);border-radius:12px;background:var(--bg);padding:10px 12px;font-size:14px;resize:vertical;outline:none;font-family:ui-monospace,Consolas,monospace}\n.paste-box:focus{border-color:var(--accent)}\n.danger-bg{background:#C2412D!important;color:#fff!important}\n.v-empty.drop{border:1.5px dashed var(--fog);border-radius:18px;margin:24px;max-width:460px}\n.v-empty.drop.over{border-color:var(--accent);background:var(--accent-wash)}\n.v-empty b{font-size:16px;color:var(--ink)}\n.v-result .steps{margin:0}\n\n/* 打印 / 阅读版 */\n@media screen{#print{display:none}}\n@media print{\n  :root{--bg:#fff;--wash:#F3F4F6;--ink:#111;--ink-2:#3d434d;--ink-3:#7a808b;--line:#dde0e5;--accent:#2C5DD8;--accent-wash:rgba(44,93,216,.08);--fog:#B8C0CD;--paper:#fff}\n  html,body{height:auto!important;overflow:visible!important;background:#fff}\n  body>*:not(#print){display:none!important}\n  #print{display:block}\n  @page{margin:16mm 16mm 18mm}\n}\n.pdoc{max-width:760px;margin:0 auto;padding:40px 28px 80px;color:var(--ink);font-family:var(--font-body)}\n.pdoc .term{border:0;background:none;cursor:auto}\n.p-head{margin-bottom:28px}\n.p-head h1{font-family:var(--font-q);font-size:34px;line-height:1.35;margin:6px 0 10px}\n.p-meta{margin:0;color:var(--ink-3);font-size:13.5px}\n.p-map{margin:0 0 30px;padding:14px}\n.p-map svg{max-height:560px}\n.p-map .pm-dot{fill:#fff;stroke:var(--ink-3);stroke-width:1.5}\n.p-map .pm-done{fill:var(--accent);stroke:var(--accent)}\n.p-map .pm-fog{fill:#fff;stroke:var(--fog);stroke-dasharray:2 2}\n.p-map .pm-t{fill:var(--ink-2)}\n.p-map line{stroke:var(--fog);stroke-width:1.6}\n.p-toc{margin-bottom:34px;break-after:page}\n.p-toc h2,.p-terms h2{font-size:15px;color:var(--ink-3);font-weight:500;letter-spacing:.06em;margin:0 0 12px}\n.p-toc ol{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:14.5px}\n.p-toc li{display:flex;gap:10px}\n.p-toc li .n{flex:none;min-width:2.6em;color:var(--ink-3);font-variant-numeric:tabular-nums}\n.p-toc li.lv0{font-weight:600}.p-toc li.lv2{padding-left:1.2em}.p-toc li.lv3{padding-left:2.4em}\n.p-node{padding:26px 0 8px;border-top:1px solid var(--line)}\n.p-node.lv1{break-before:auto}\n.p-num{font-size:12.5px;color:var(--ink-3);letter-spacing:.06em;font-variant-numeric:tabular-nums}\n.p-node h2{font-family:var(--font-q);font-size:24px;line-height:1.45;margin:4px 0 16px;break-after:avoid}\n.p-node.lv0 h2{font-size:28px}\n.p-node h3{font-size:12.5px;color:var(--ink-3);font-weight:500;letter-spacing:.06em;margin:18px 0 6px;break-after:avoid}\n.p-node .prose{font-size:15.5px;line-height:1.85}\n.p-node .fig{break-inside:avoid}\n.p-mine{border-left:3px solid var(--accent);padding:2px 0 2px 14px;margin:0 0 16px}\n.p-mine span,.p-guess span{font-size:12px;color:var(--ink-3);letter-spacing:.06em}\n.p-mine p{margin:2px 0 6px;font-family:var(--font-q);font-weight:600;font-size:18px;line-height:1.6}\n.p-mine .prose,.p-guess .prose{font-size:14.5px;color:var(--ink-2)}\n.p-guess{background:var(--wash);border-radius:12px;padding:10px 14px;margin:0 0 12px}\n.p-guess p{margin:2px 0 4px;font-size:15px}\n.p-fig{margin:0 0 14px}.p-fig img{max-width:100%;border:1px solid var(--line);border-radius:8px}.p-fig figcaption{font-size:12px;color:var(--ink-3)}\n.p-ref{font-size:12.5px;color:var(--ink-3);margin:14px 0 0}\n.p-fogn{color:var(--ink-3);font-size:14px}\n.p-terms{margin-top:36px;border-top:1px solid var(--line);padding-top:24px;break-before:page}\n.p-terms dl{display:grid;grid-template-columns:auto 1fr;gap:8px 18px;margin:0;font-size:14.5px}\n.p-terms dt{font-weight:600}\n.p-terms dd{margin:0;color:var(--ink-2)}\n.p-terms dd span{display:block;color:var(--ink-3);font-size:13.5px}\n\n#c-refs .refs{margin-top:24px}\n.figure-head img{max-height:280px;width:100%;object-fit:contain;background:#fff}\n.ref.static{cursor:default}\n.ref.static:hover{background:var(--wash)}\n";
var SHELL = "<header class=\"bar\" id=\"bar\">\n  <button class=\"space-btn\" data-act=\"open-maps\" aria-label=\"我的地图\">\n    <span class=\"t\" id=\"mapTitle\">问题地图<\/span>\n    <svg width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M3 4.5 6 7.5 9 4.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><\/svg>\n  <\/button>\n  <div class=\"bar-right\">\n    <button id=\"waitPill\" class=\"waiting-pill\" data-act=\"open-paste\" hidden><span class=\"pulse\"><\/span><span class=\"wl\"><\/span><\/button>\n    <button class=\"icon-btn\" id=\"viewerBtn\" data-act=\"toggle-viewer\" title=\"原文（O）\" aria-label=\"原文\">\n      <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><path d=\"M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z\"/><path d=\"M14 3.5V8h4M9 12h6M9 15.5h6\"/><\/svg>\n    <\/button>\n    <button class=\"icon-btn\" id=\"mapBtn\" data-act=\"toggle-map\" title=\"地图（M）\" aria-label=\"地图\">\n      <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"><circle cx=\"12\" cy=\"12\" r=\"2.4\"/><circle cx=\"5\" cy=\"6\" r=\"1.6\"/><circle cx=\"19\" cy=\"7\" r=\"1.6\"/><circle cx=\"18\" cy=\"18.5\" r=\"1.6\" stroke-dasharray=\"1.6 1.6\"/><circle cx=\"5.5\" cy=\"18\" r=\"1.6\"/><path d=\"M10.2 10.6 6.3 7.1M13.9 10.8l3.7-2.7M13.6 13.8l3.2 3.4M10.3 13.6l-3.5 3.3\"/><\/svg>\n    <\/button>\n    <button class=\"icon-btn\" data-act=\"open-save\" title=\"保存成知识资产\" aria-label=\"保存\">\n      <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14\"/><\/svg>\n    <\/button>\n    <button class=\"icon-btn\" data-act=\"open-more\" title=\"设置\" aria-label=\"设置\">\n      <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><circle cx=\"6\" cy=\"12\" r=\"1.6\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\"/><circle cx=\"18\" cy=\"12\" r=\"1.6\"/><\/svg>\n    <\/button>\n  <\/div>\n<\/header>\n<main>\n  <section id=\"reading\" class=\"view\" aria-label=\"阅读\"><div class=\"col\" id=\"col\"><\/div><\/section>\n  <section id=\"map\" class=\"view\" aria-label=\"地图\">\n    <div id=\"world\"><svg id=\"edges\"><\/svg><div id=\"mnodes\"><\/div><\/div>\n    <div class=\"map-empty\" id=\"mapEmpty\" hidden>地图还是空白的。<br>把 Gemini 画的初稿粘贴进来，它就会在这里长出来。<\/div>\n    <div class=\"map-foot\">\n      <div class=\"legend\"><span><i class=\"glyph done\"><\/i>说清了<\/span><span><i class=\"glyph seen\"><\/i>读过<\/span><span><i class=\"glyph unread\"><\/i>还没读<\/span><span><i class=\"glyph fog\"><\/i>迷雾<\/span><span class=\"map-count\" id=\"mapCount\"><\/span><\/div>\n      <button class=\"map-back\" data-act=\"toggle-map\">回到正在读的问题<\/button>\n    <\/div>\n  <\/section>\n<\/main>\n<aside class=\"viewer\" id=\"viewer\" aria-label=\"原文\">\n  <div class=\"v-bar\">\n    <span class=\"v-title\" id=\"vTitle\">原文<\/span><span class=\"v-page\" id=\"vPage\"><\/span>\n    <button class=\"v-btn\" data-act=\"v-zoom\" data-f=\"0.85\" aria-label=\"缩小\">−<\/button>\n    <button class=\"v-btn\" data-act=\"v-zoom\" data-f=\"1.18\" aria-label=\"放大\">+<\/button>\n    <button class=\"v-btn\" id=\"vCrop\" data-act=\"v-crop\" title=\"框选一块图表，请 Gemini 讲讲\" hidden>\n      <svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"><path d=\"M4 1.5V12h10.5M1.5 4H12v10.5\"/><\/svg>框选<\/button>\n    <button class=\"v-btn\" data-act=\"close-viewer\" aria-label=\"关闭原文\">✕<\/button>\n  <\/div>\n  <div class=\"v-scroll\" id=\"vScroll\"><\/div>\n  <div class=\"v-result\" id=\"vResult\"><\/div>\n<\/aside>\n<div class=\"selbar\" id=\"selbar\" role=\"toolbar\" aria-label=\"对选中的文字\">\n  <button data-act=\"sel-explain\">解释<\/button><button data-act=\"sel-chat\">去聊聊<\/button><button data-act=\"sel-node\">记成问题<\/button>\n<\/div>\n<div class=\"card\" id=\"card\" role=\"dialog\" aria-live=\"polite\"><\/div>\n<div class=\"mcard\" id=\"mcard\" role=\"status\"><\/div>\n<div class=\"scrim\" id=\"scrim\" data-act=\"close-sheet\"><\/div>\n<aside class=\"sheet\" id=\"sheet\" aria-modal=\"true\" role=\"dialog\"><\/aside>\n<div class=\"toast\" id=\"toast\" role=\"status\"><\/div>\n<div id=\"print\" aria-hidden=\"true\"><\/div>\n<input type=\"file\" id=\"fileIn\" hidden>";
var SKILL = "---\nname: question-map\ndescription: 和学习者一起把学习资料（PDF、论文、讲义、笔记、网页）画成一张「问题地图」：先读资料画出初稿，再根据学习者的追问、猜测和讨论不断补充。当用户说\"画问题地图\"\"画初稿\"，消息以【问题地图】开头，或贴来一段以【地图开始】开头的地图时使用。\n---\n\n# 问题地图\n\n你是和学习者一起画地图的向导。\n\n地图上的每一个点都是一个**问题**，不是知识点标题。学习者顺着问题往下走，先猜，再看讲解，最后用自己的一句话把答案说出来。\n\n你写的地图会被一个网页画板读取、合并、显示，所以**第四节的格式必须严格遵守**。其余部分是你讲解和画图的方法。\n\n---\n\n## 一、怎么讲（最重要）\n\n1. **由浅入深。** 先给一个能\"看见\"的画面，再给例子，再讲为什么，最后才是精确的定义和边界。\n2. **不用术语堵门。** 专业词第一次出现时写成 `[[术语|一句大白话]]`，例如 `[[先验|看到证据之前你本来的看法]]`。每一节最多标 3 个，已经解释过的词不再标。\n3. **短。** 每节 2–5 句。具体胜过抽象：用数字、场景、人物。\n4. **留一点摩擦。** 不要把结论全部嚼碎喂到嘴边。学习者自己能想到的，用一个问句点到为止。\n5. **准确。** 以资料原文为准。资料没讲、由你补充的内容，标明\"（资料外补充）\"。\n6. 用中文，口语但准确。公式用行内代码写，例如 `P(A|B)`，不要用 LaTeX。\n\n---\n\n## 二、怎么画地图\n\n- **根问题**：整份资料真正在回答的那个问题，往往是一个矛盾或一个\"为什么\"。只有一个。\n- **主干**：3–6 个。要回答根问题，必须先弄清的几件事。\n- **分支**：每个主干下 1–4 个，越往下越具体。全图 12–30 个问题为宜。\n- **问题的写法**：像一个好奇的初学者会问的话。不超过 28 个字，不含术语。\n  - 好：\"为什么同样严密的推理，会得出相反的结论？\"\n  - 不好：\"论证的有效性与可靠性\"\n- **顺序**：同一层的问题，按推荐的学习顺序排列。\n\n**初稿：**\n- 根问题和主干：写完整的讲解梯子（五节）。\n- 更深的分支：至少写「一个画面」「例子」「为什么」三节。\n- 故意留几个只写问题、不写讲解的分支（叫\"迷雾\"）。学习者走到那里，会请你展开。\n- 一次写不完就分批：先给根问题和前几个主干，末尾说\"回复'继续'给下一批\"。之后每批只写新的部分。\n\n---\n\n## 三、讲解梯子\n\n每个问题的讲解按下面五节、按这个顺序写。**小节标题一字不改**，标题后面不要加说明文字。\n\n1. `### 一个画面`：一个具体、可想象的场景，让人先\"看见\"这个问题。\n2. `### 例子`：1–2 个具体例子，先日常，后专业。\n3. `### 为什么`：背后的机制和因果。\n4. `### 精确地说`：严格的定义、条件、公式。\n5. `### 什么时候失灵`：边界、例外、常见误用。\n\n需要时可以再加别的小节，标题自己取（2–8 个字），例如「对照你的猜测」「对你这句话的看法」「图：误差怎么累积」「讨论所得」。\n\n---\n\n## 四、格式（画板只认这个）\n\n地图内容放在两行标记之间：\n\n```\n【地图开始】\n……地图内容……\n【地图结束】\n```\n\n- 两行标记各自单独占一行，**不要**放进代码块。\n- 标记外面可以正常说话。标记里面只放地图。\n\n标记里面的写法：\n\n```\n# 地图：<地图标题>\n资料：<资料名称>\n\n## r｜<根问题>\n页：1, 2\n### 一个画面\n……\n### 例子\n……\n### 为什么\n……\n### 精确地说\n……\n### 什么时候失灵\n……\n\n## q1｜<一个主干问题>\n父：r\n页：3-5\n相关：q6\n### 一个画面\n……\n\n## q2｜<一个还在迷雾里的问题>\n父：q1\n\n## 术语\n- [[术语|一句大白话]]：一个例子（可选）\n```\n\n规则：\n\n- 每个问题一行 `## 编号｜问题`。根问题的编号固定是 `r`，其他依次是 `q1`、`q2`、`q3`……\n- 紧跟着写属性，每个一行：\n  - `父：`：上一级问题的编号。根问题不写。\n  - `页：`：对应资料的页码，有就写，可以写范围。\n  - `相关：`：其他相关问题的编号，可选。\n- 讲解小节用 `### 小节标题`。\n- `## 术语` 放在最后，列出这次新出现的术语，每行一个。\n- `# 地图：` 和 `资料：` 只在初稿里写。\n- **不要**写 `### 我的猜测`、`### 我的一句话`。那两节是学习者自己写的，你只能读。\n\n**补充时只写有变化的部分。** 画板按编号合并：\n\n- **新问题**：写一个新的 `## 编号｜问题`，带上 `父：`。新编号接着已有的最大编号往下排。学习者写了\"从 qN 开始编号\"就照办。\n- **补充或改写已有问题**：写 `## 已有编号｜问题`，下面只写要新增或替换的小节。同名小节会被整节替换。\n- **删除**：在 `## 编号｜问题` 下面写一行 `状态：删除`。\n- 没有变化的问题不要重复写。编号一旦给出就永远不变。\n\n---\n\n## 五、画图\n\n只在一张图能明显帮助理解时才画，比如流程、对比、结构、数据趋势。图写在某一节的正文里。\n\n**示意图用 svg：**\n\n```svg\n<svg viewBox=\"0 0 640 360\"> … <\/svg>\n```\n\n- 只用这几个 class 上色：\n  - `c-ink`：主线、主文字\n  - `c-muted`：次要的线和字\n  - `c-accent`：重点，一张图最多一处\n  - `c-soft`：浅色填充\n  - `c-line`：淡线\n  - `c-paper`：底色填充\n- 不要写颜色值、字体、style、width、height。画板会自动适配浅色和深色模式。\n- 文字 14 号左右。元素不超过 12 个，留白充足，中文标签简短。\n\n**数据图用 chart**，画板会按统一样式绘制：\n\n```chart\n{\"type\":\"line\",\"title\":\"…\",\"x\":{\"label\":\"…\",\"values\":[…]},\"y\":{\"label\":\"…\"},\"series\":[{\"name\":\"…\",\"values\":[…]}],\"note\":\"数据来源\"}\n```\n\n- `type` 可以是 `line`、`bar`、`scatter`。scatter 的 `values` 写成 `[[x,y], …]`。\n- 只用资料里的真实数据。用编的数据做示意时，`note` 里必须写\"示意\"。\n\n---\n\n## 六、对话里的各种请求\n\n学习者的消息常以【问题地图】开头，并写明问题编号。按下表回应：\n\n| 学习者说 | 你怎么回答 | 地图块里写什么 |\n|---|---|---|\n| 画初稿 | 读完全部资料，用一两句话说明地图的总体思路 | 标题、资料名、全部问题、术语 |\n| 继续 | 接着上一批往下画 | 下一批问题 |\n| 展开 qN | 写完整的讲解梯子 | `## qN`，加上五节 |\n| 解释「某个词」 | 用 1–3 句大白话加一个例子直接回答 | 只写 `## 术语`，加这一个词 |\n| qN 我先猜：…… | 先肯定猜对的部分，再点出差距，不超过 4 句 | `## qN`，加 `### 对照你的猜测` |\n| qN 我的一句话：…… | 说它有没有抓住核心；需要的话给一个更好的说法 | `## qN`，加 `### 对你这句话的看法` |\n| 在 qN 下记一个新问题 | 把它改成一个好问题，写讲解 | 新问题加讲解，可以带 1–2 个迷雾子问题 |\n| 关于 qN：……（随便聊） | 正常对话，简洁 | **通常不写**，见下方 |\n| 给 qN 的某节画一张图 | 画图 | `## qN`，加 `### 图：标题` |\n| 一张图片和页码 | 读图 | 用学习者给的编号新建问题，带 `父：` 和 `页：`，四节标题依次是「这是什么」「怎么读」「它说明了什么」「要小心的地方」 |\n| 贴来一整张地图，说继续 | 以它为当前状态往下画 | 只写变化 |\n\n**什么时候把讨论记进地图：** 只有讨论产生了下面这些东西时，才在回答末尾附一个地图块，并在前面用一句话说明\"这段值得记进地图：……\"：\n\n- 一个值得单独研究的新问题；\n- 一个改变理解方向的纠正或洞见；\n- 一个特别好用的类比或例子（加到对应问题的一节里，例如 `### 讨论所得`）。\n\n简单的确认、闲聊、重复已有的内容，都不记。\n\n---\n\n## 七、开头和结尾\n\n- 画初稿时不要寒暄。先用一两句话说明根问题是什么、分几条主干，然后直接给地图块。\n- 每个地图块之后，用一句话提示学习者可以从哪个问题开始，或者先猜一猜哪个问题。\n";
var MAP_RE = /#{1,4}\s*\**\s*[A-Za-z][A-Za-z0-9_]{0,15}\s*\**\s*[｜|丨]|#\s*\**\s*(问题)?地图\s*[:：]|【\s*地图开始\s*】/;
function grab(n) { var t = n.tagName === 'TEXTAREA' ? n.value : (n.nodeType === 3 ? n.data : n.textContent); if (n.parentNode) n.parentNode.removeChild(n); return t || ''; }
/* 找地图文字：Gemini 的 Canvas 可能保留、改写或拆掉装地图的容器，这里逐一兜底 */
function findSource() {
  var el = document.getElementById('qmap');
  if (el && MAP_RE.test(el.tagName === 'TEXTAREA' ? el.value : el.textContent)) return relines(unesc(grab(el)));
  var cands = document.querySelectorAll('textarea, script[type^="text/"]:not([type="text/javascript"]), template, pre, code, [data-qmap]');
  for (var i = 0; i < cands.length; i++) { var c = cands[i]; var tx = c.tagName === 'TEXTAREA' ? c.value : c.tagName === 'TEMPLATE' ? c.innerHTML : c.textContent; if (MAP_RE.test(tx || '')) return relines(unesc(c.tagName === 'TEMPLATE' ? (c.remove(), tx) : grab(c))); }
  var parts = [], kids = Array.prototype.slice.call(document.body.childNodes);
  kids.forEach(function (n) {
    if (n.nodeType === 1 && /^(SCRIPT|STYLE|LINK|META|NOSCRIPT)$/.test(n.tagName)) return;
    if (n.nodeType === 1 && n.id === 'qmap-fallback') return;
    var tx = n.nodeType === 3 ? n.data : (n.nodeType === 1 ? (n.innerText || n.textContent) : '');
    if (tx && MAP_RE.test(tx)) parts.push(grab(n));
  });
  if (el) grab(el);
  return relines(unesc(parts.join('\n')));
}
function unesc(t) { return String(t || '').replace(/<\\\//g, '</').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&'); }
/* 换行被吃掉时，按地图格式把行重新断开 */
function relines(t) {
  t = String(t || '');
  var heads = (t.match(/#{2,4}\s/g) || []).length, breaks = (t.match(/\n\s*#{2,4}\s/g) || []).length;
  if (heads < 3 || breaks >= heads * 0.6) return t;
  return t.replace(/\s*(#{1,4}\s)/g, '\n$1')
    .replace(/(\n#{2}\s*[A-Za-z][A-Za-z0-9_]{0,15}\s*[｜|丨][^\n]*?[？?。])\s*/g, '$1\n')
    .replace(/\s+(资料|父|页|相关|状态|图源)\s*[:：]\s*/g, '\n$1：')
    .replace(/(\n#{3,4}\s*(一个画面|例子|为什么|精确地说|什么时候失灵|对照你的猜测|对你这句话的看法|我的猜测|我的一句话|讨论所得|这是什么|怎么读|它说明了什么|要小心的地方))\s+/g, '$1\n')
    .replace(/\s+-\s*\[\[/g, '\n- [[').replace(/^\n+/, '');
}
function el(tag, attrs, text) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; }
function mount() {
  if (window.__qmapMounted) return; window.__qmapMounted = true;
  var raw = findSource();
  if (!document.querySelector('meta[name=viewport]')) document.head.appendChild(el('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }));
  document.head.appendChild(el('link', { rel: 'stylesheet', href: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600&family=Noto+Serif+SC:wght@600&display=swap" }));
  document.head.appendChild(el("style", {}, QMAP_CSS));
  var fb = document.getElementById('qmap-fallback'); if (fb) fb.remove();
  var box = document.createElement('div'); box.innerHTML = SHELL;
  while (box.firstChild) document.body.appendChild(box.firstChild);
  document.body.setAttribute('data-view', 'read');
  document.body.appendChild(el('script', { type: 'text/plain', id: 'qmap-skill' }, SKILL));
  document.body.appendChild(el('script', { type: 'text/plain', id: 'qmap-embed', 'data-canvas': '1' }, raw));
  document.body.appendChild(el('script', { type: 'text/plain', id: 'qmap-pdf' }, ''));
  run();
}
function run() {
'use strict';
/* ==========================================================================
   问题地图 v3 · 画板
   Gemini（装上 question-map skill）读资料、画初稿、回答追问、给出补丁；
   这个页面合并补丁、一层层显示、悬停术语、对照原文，并导出成知识资产。
   两边交换的只有一种东西：纯文本的「地图文件」（格式见 SKILL.md 第四节）。
   ========================================================================== */
const PRISTINE = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

const LADDER = ['一个画面', '例子', '为什么', '精确地说', '什么时候失灵'];
const GUESS_NOTE = '对照你的猜测', MINE_NOTE = '对你这句话的看法';
const MARK_A = '【地图开始】', MARK_B = '【地图结束】';
const LS_KEY = 'qmap.v3';
const GEMINI_URL = 'https://gemini.google.com/app';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const unesc = s => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const short = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCJK = ch => /[　-鿿＀-￯]/.test(ch || '');
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const dots = '<span class="dots"><i></i><i></i><i></i></span>';

let S = null;
const ui = {
  view: 'read', sample: null, canImages: false, downloads: null, inArtifact: !!(window.claude && window.claude.use),
  wait: null, busy: null, enter: null, editOwn: null, sheet: null, fresh: {}, reply: {}, intent: 'chat',
  bloom: false, renderedId: null, srcText: {},
  canvas: !!(document.getElementById('qmap-embed') && document.getElementById('qmap-embed').getAttribute('data-canvas')),
  engineSrc: window.__qmapEngineSrc || '',
};
const V = { mapId: null, pdf: null, zoom: 1, crop: false, obs: null, rendered: new Set(), total: 0, figure: null };

/* ---------------- 弹簧曲线：用 CSS linear() 近似真实弹簧 ---------------- */
(function springEase() {
  try {
    if (!CSS.supports('transition-timing-function', 'linear(0, 1)')) return;
    const k = 170, c = 20, dt = 1 / 240; let x = 0, v = 0; const xs = [];
    for (let i = 0; i < 2400; i++) { const f = -k * (x - 1) - c * v; v += f * dt; x += v * dt; xs.push(x); if (i > 100 && Math.abs(x - 1) < 0.0006 && Math.abs(v) < 0.006) break; }
    const n = 48, pts = [];
    for (let i = 0; i <= n; i++) pts.push(+xs[Math.min(xs.length - 1, Math.round(i / n * (xs.length - 1)))].toFixed(4));
    pts[0] = 0; pts[n] = 1;
    document.documentElement.style.setProperty('--spring', `linear(${pts.join(', ')})`);
    document.documentElement.style.setProperty('--spring-d', (xs.length * dt).toFixed(2) + 's');
  } catch (e) {}
})();

/* ---------------- 图：svg 清洗 + 图表渲染 ---------------- */
function safeSVG(code) {
  try {
    const doc = new DOMParser().parseFromString(code.trim(), 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;
    svg.querySelectorAll('script,foreignObject,style,iframe,image,a,animate,set,animateTransform,animateMotion').forEach(e => e.remove());
    for (const el of [svg, ...svg.querySelectorAll('*')]) {
      for (const at of Array.from(el.attributes)) {
        const nm = at.name.toLowerCase(), v = at.value;
        if (nm.startsWith('on')) el.removeAttribute(at.name);
        else if ((nm === 'href' || nm === 'xlink:href') && !v.startsWith('#')) el.removeAttribute(at.name);
        else if (nm === 'style' && /url\(|expression|@import/i.test(v)) el.removeAttribute(at.name);
      }
    }
    svg.removeAttribute('width'); svg.removeAttribute('height');
    if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', '0 0 640 360');
    svg.setAttribute('role', 'img');
    return new XMLSerializer().serializeToString(svg);
  } catch (e) { return null; }
}
function niceTicks(min, max, n) {
  if (min === max) { max = min + 1; }
  const span = max - min, step0 = span / Math.max(1, n), mag = Math.pow(10, Math.floor(Math.log10(step0))), r = step0 / mag;
  const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}
const fmtNum = v => Math.abs(v) >= 10000 ? (v / 10000).toFixed(Math.abs(v) >= 100000 ? 0 : 1) + '万' : (Math.round(v * 100) / 100).toString();
function chartHTML(spec) {
  const pal = ['var(--accent)', 'var(--ink-2)', '#C98A1B', '#2FA36B', 'var(--ink-3)'];
  const series = (spec.series || []).filter(x => Array.isArray(x.values));
  if (!series.length) return '<p class="fig-err">图表数据不完整。</p>';
  const type = spec.type || 'line';
  const W = 640, H = 330, m = { l: 52, r: 18, t: spec.title ? 36 : 16, b: 46 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  let xs, xNum = false, allY = [];
  if (type === 'scatter') { xNum = true; series.forEach(s => s.values.forEach(p => { allY.push(+p[1]); })); xs = series.flatMap(s => s.values.map(p => +p[0])); }
  else { xs = (spec.x && spec.x.values) || series[0].values.map((_, i) => i + 1); series.forEach(s => s.values.forEach(v => allY.push(+v))); }
  allY = allY.filter(Number.isFinite);
  let ymin = Math.min(...allY), ymax = Math.max(...allY);
  if (type === 'bar' || ymin > 0 && ymin < ymax * 0.35) ymin = Math.min(0, ymin);
  const yt = niceTicks(ymin, ymax, 4); const y0 = yt[0], y1 = yt[yt.length - 1];
  const Y = v => m.t + ih - (v - y0) / (y1 - y0 || 1) * ih;
  let X, xt = [];
  if (xNum) { const t = niceTicks(Math.min(...xs), Math.max(...xs), 5); xt = t; X = v => m.l + (v - t[0]) / (t[t.length - 1] - t[0] || 1) * iw; }
  else { const n = xs.length; const band = iw / n; X = i => m.l + band * (i + 0.5); xt = xs; }
  let g = '';
  if (spec.title) g += `<text x="${m.l}" y="20" class="c-ink" style="font-weight:600">${esc(spec.title)}</text>`;
  for (const t of yt) g += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/><text class="tick" x="${m.l - 8}" y="${Y(t) + 4}" text-anchor="end">${fmtNum(t)}</text>`;
  g += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ih}" y2="${m.t + ih}"/>`;
  if (xNum) for (const t of xt) g += `<text class="tick" x="${X(t)}" y="${m.t + ih + 18}" text-anchor="middle">${fmtNum(t)}</text>`;
  else { const every = Math.ceil(xs.length / 10); xs.forEach((v, i) => { if (i % every === 0) g += `<text class="tick" x="${X(i)}" y="${m.t + ih + 18}" text-anchor="middle">${esc(short(String(v), 8))}</text>`; }); }
  if (spec.x && spec.x.label) g += `<text class="tick" x="${m.l + iw / 2}" y="${H - 6}" text-anchor="middle">${esc(spec.x.label)}</text>`;
  if (spec.y && spec.y.label) g += `<text class="tick" transform="translate(12 ${m.t + ih / 2}) rotate(-90)" text-anchor="middle">${esc(spec.y.label)}</text>`;
  series.forEach((s, si) => {
    const col = pal[si % pal.length];
    if (type === 'bar') {
      const band = iw / xs.length, bw = Math.min(36, band * 0.7 / series.length);
      s.values.forEach((v, i) => { const x = X(i) - bw * series.length / 2 + bw * si; const y = Y(Math.max(0, +v)), h = Math.abs(Y(+v) - Y(0)); g += `<rect x="${x}" y="${+v >= 0 ? y : Y(0)}" width="${bw - 2}" height="${h}" rx="3" style="fill:${col};stroke:none"/>`; });
    } else if (type === 'scatter') {
      s.values.forEach(p => { g += `<circle cx="${X(+p[0])}" cy="${Y(+p[1])}" r="4" style="fill:${col};stroke:none;opacity:.85"/>`; });
    } else {
      const pts = s.values.map((v, i) => `${X(i)},${Y(+v)}`).join(' ');
      g += `<polyline points="${pts}" style="fill:none;stroke:${col};stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round"/>`;
      const li = s.values.length - 1; g += `<circle cx="${X(li)}" cy="${Y(+s.values[li])}" r="4" style="fill:${col};stroke:var(--paper);stroke-width:2"/>`;
    }
  });
  const legend = series.length > 1 ? `<div class="legend">${series.map((s, i) => `<span><i style="background:${pal[i % pal.length]}"></i>${esc(s.name || '系列' + (i + 1))}</span>`).join('')}</div>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.title || '图表')}">${g}</svg>${legend}`;
}
function figureHTML(lang, code) {
  if (lang === 'svg') { const s = safeSVG(code); return `<div class="fig">${s || '<p class="fig-err">这张图的格式不对，没能画出来。</p>'}</div>`; }
  if (lang === 'chart') { try { const spec = JSON.parse(code); return `<div class="fig">${chartHTML(spec)}${spec.note ? `<div class="cap">${esc(spec.note)}</div>` : ''}</div>`; } catch (e) { return '<div class="fig"><p class="fig-err">图表数据不是有效的 JSON。</p></div>'; } }
  return `<pre class="tbl"><code>${esc(code)}</code></pre>`;
}

/* ---------------- Markdown ---------------- */
function inline(src, s, ctx) {
  let h = esc(src);
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\[\[([^\]|\n]+)(?:\|[^\]\n]*)?\]\]/g, (m, a) => {
    const t = a.trim(); const learned = s && s.terms[unesc(t)] && s.terms[unesc(t)].learned;
    if (ctx) ctx.used.add(unesc(t));
    return `<span class="term${learned ? ' learned' : ''}" tabindex="0" data-term="${t}">${t}</span>`;
  });
  return h;
}
function md(src, s, ctx) {
  ctx = ctx || { used: new Set() };
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  let h = '', i = 0;
  const isBlockStart = l => /^\s*\|/.test(l) || /^\s*[-*•・]\s+/.test(l) || /^\s*\d+[.、)）]\s*/.test(l) || /^\s*>/.test(l) || /^\s*```/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const fence = l.match(/^\s*```\s*([\w-]*)/);
    if (fence) {
      const lang = fence[1].toLowerCase(); let code = ''; i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) { code += lines[i] + '\n'; i++; }
      i++; h += figureHTML(lang, code); continue;
    }
    if (/^\s*<svg[\s>]/i.test(l)) {
      let code = ''; while (i < lines.length) { code += lines[i] + '\n'; if (/<\/svg>/i.test(lines[i])) { i++; break; } i++; }
      h += figureHTML('svg', code); continue;
    }
    if (/^\s*\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { const r = lines[i].trim(); if (!/^\|?[\s:|-]+\|?$/.test(r)) rows.push(r.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())); i++; }
      if (rows.length) { const [head, ...body] = rows; h += '<div class="tbl"><table><thead><tr>' + head.map(c => `<th>${inline(c, s, ctx)}</th>`).join('') + '</tr></thead><tbody>' + body.map(r => '<tr>' + r.map(c => `<td>${inline(c, s, ctx)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>'; }
      continue;
    }
    if (/^\s*[-*•・]\s+/.test(l)) { h += '<ul>'; while (i < lines.length && /^\s*[-*•・]\s+/.test(lines[i])) { h += '<li>' + inline(lines[i].replace(/^\s*[-*•・]\s+/, ''), s, ctx) + '</li>'; i++; } h += '</ul>'; continue; }
    if (/^\s*\d+[.、)）]\s*/.test(l)) { h += '<ol>'; while (i < lines.length && /^\s*\d+[.、)）]\s*/.test(lines[i])) { h += '<li>' + inline(lines[i].replace(/^\s*\d+[.、)）]\s*/, ''), s, ctx) + '</li>'; i++; } h += '</ol>'; continue; }
    if (/^\s*>/.test(l)) { let q = ''; while (i < lines.length && /^\s*>/.test(lines[i])) { q += lines[i].replace(/^\s*>\s?/, ''); i++; } h += '<blockquote>' + inline(q, s, ctx) + '</blockquote>'; continue; }
    if (/^\s*#{1,4}\s/.test(l)) { h += `<h4>${inline(l.replace(/^\s*#+\s*/, ''), s, ctx)}</h4>`; i++; continue; }
    let p = l.trim(); i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i]) && !/^\s*#{1,4}\s/.test(lines[i])) { const nx = lines[i].trim(); p += (isCJK(p.slice(-1)) && isCJK(nx[0])) ? nx : ' ' + nx; i++; }
    h += '<p>' + inline(p, s, ctx) + '</p>';
  }
  return s ? autolink(h, s, ctx.used) : h;
}
// 术语表里已有的词，在正文里第一次出现时自动加上悬停解释
let termRe = null, termReKey = '';
function autolink(html, s, used) {
  const keys = Object.keys(s.terms || {}).filter(k => k.length >= 2 && k.length <= 16 && s.terms[k] && s.terms[k].plain);
  if (!keys.length) return html;
  const key = s.id + ':' + keys.length;
  if (termReKey !== key) { termRe = new RegExp(keys.sort((a, b) => b.length - a.length).map(k => esc(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g'); termReKey = key; }
  let inTerm = 0, inSkip = 0;
  return html.split(/(<[^>]+>)/).map(tok => {
    if (tok.startsWith('<')) {
      if (/^<span class="term/.test(tok)) inTerm++; else if (tok === '</span>' && inTerm) inTerm--;
      if (/^<(code|pre|svg|h4)\b/i.test(tok)) inSkip++; else if (/^<\/(code|pre|svg|h4)>/i.test(tok)) inSkip = Math.max(0, inSkip - 1);
      return tok;
    }
    if (inTerm || inSkip || !tok) return tok;
    return tok.replace(termRe, m => { const k = unesc(m); if (used.has(k)) return m; used.add(k); return `<span class="term auto${s.terms[k] && s.terms[k].learned ? ' learned' : ''}" tabindex="0" data-term="${m}">${m}</span>`; });
  }).join('');
}

const cam = { x: 0, y: 0, k: 1, tx: 0, ty: 0, tk: 1, vx: 0, vy: 0, vk: 0, raf: 0, mode: 'spring' };
function applyCam() { $('#world').style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.k})`; }
function camSet(x, y, k) { cancelAnimationFrame(cam.raf); cam.raf = 0; Object.assign(cam, { x, y, k, tx: x, ty: y, tk: k, vx: 0, vy: 0, vk: 0 }); applyCam(); }
function camTo(x, y, k) { Object.assign(cam, { tx: x, ty: y, tk: k, mode: 'spring' }); if (reduced) { camSet(x, y, k); return; } if (!cam.raf) cam.raf = requestAnimationFrame(camStep); }
function camStep() {
  const dt = 1 / 60; let moving = false;
  if (cam.mode === 'spring') {
    const K = 150, C = 24;
    for (const [p, v, t] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty'], ['k', 'vk', 'tk']]) {
      const f = K * (cam[t] - cam[p]) - C * cam[v]; cam[v] += f * dt; cam[p] += cam[v] * dt;
      if (Math.abs(cam[t] - cam[p]) > (p === 'k' ? 0.0005 : 0.3) || Math.abs(cam[v]) > (p === 'k' ? 0.001 : 0.5)) moving = true; else { cam[p] = cam[t]; cam[v] = 0; }
    }
  } else {
    cam.x += cam.vx * dt; cam.y += cam.vy * dt; cam.vx *= 0.92; cam.vy *= 0.92;
    moving = Math.abs(cam.vx) + Math.abs(cam.vy) > 8; cam.tx = cam.x; cam.ty = cam.y;
  }
  applyCam();
  cam.raf = moving ? requestAnimationFrame(camStep) : 0;
}
function zoomAt(px, py, f) {
  const k = Math.max(0.3, Math.min(2.4, cam.k * f)); const r = k / cam.k;
  camSet(px - (px - cam.x) * r, py - (py - cam.y) * r, k);
}

(function mapGestures() {
  const m = $('#map'); const pts = new Map(); let last = null, pinch = null, moved = 0, vel = { x: 0, y: 0, t: 0 };
  m.addEventListener('pointerdown', e => {
    if (e.target.closest('.map-foot')) return;
    m.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0;
    cancelAnimationFrame(cam.raf); cam.raf = 0;
    if (pts.size === 1) { last = { x: e.clientX, y: e.clientY }; vel = { x: 0, y: 0, t: performance.now() }; }
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; }
  });
  m.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch.d); pinch.d = d; moved += 10; return; }
    if (last) {
      const dx = e.clientX - last.x, dy = e.clientY - last.y; moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 4) m.classList.add('dragging');
      const now = performance.now(), dt = Math.max(1, now - vel.t);
      vel = { x: 0.8 * (dx / dt * 1000) + 0.2 * vel.x, y: 0.8 * (dy / dt * 1000) + 0.2 * vel.y, t: now };
      camSet(cam.x + dx, cam.y + dy, cam.k); last = { x: e.clientX, y: e.clientY };
    }
  });
  const up = e => {
    const wasClick = moved < 5 && pts.size === 1;
    pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (!pts.size) {
      m.classList.remove('dragging');
      if (!wasClick && last && performance.now() - vel.t < 80 && !reduced) { cam.vx = vel.x; cam.vy = vel.y; cam.mode = 'inertia'; if (!cam.raf) cam.raf = requestAnimationFrame(camStep); }
      last = null;
    }
    if (wasClick && e.type === 'pointerup') { const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-go]'); if (el) go(el.dataset.go, el.querySelector('.ml')); }
  };
  m.addEventListener('pointerup', up); m.addEventListener('pointercancel', up);
  m.addEventListener('wheel', e => {
    e.preventDefault();
    const mouseWheel = e.deltaMode === 1 || (Math.abs(e.deltaY) >= 50 && e.deltaX === 0 && Number.isInteger(e.deltaY));
    if (e.ctrlKey || mouseWheel) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)));
    else camSet(cam.x - e.deltaX, cam.y - e.deltaY, cam.k);
  }, { passive: false });
})();
(function readPinch() {
  let acc = 0, tm = 0;
  $('#reading').addEventListener('wheel', e => {
    if (!e.ctrlKey) return; e.preventDefault();
    acc += e.deltaY; clearTimeout(tm); tm = setTimeout(() => acc = 0, 250);
    if (acc > 60) { acc = 0; setView('map'); }
  }, { passive: false });
})();

async function ensurePdfJs() {
  if (window.pdfjsLib) return;
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

const pageWidth = () => Math.max(260, Math.min(900, ($('#vScroll').clientWidth || 520) - 36)) * V.zoom;
async function renderPage(p) {
  if (!V.pdf || V.rendered.has(p)) return; V.rendered.add(p);
  const box = $(`.v-page-box[data-p="${p}"]`); if (!box) return;
  const page = await V.pdf.getPage(p); const vp0 = page.getViewport({ scale: 1 });
  const w = pageWidth(); const scale = w / vp0.width; const dpr = Math.min(2, devicePixelRatio || 1);
  const vp = page.getViewport({ scale: scale * dpr });
  const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; c.style.width = w + 'px'; c.style.height = (vp.height / dpr) + 'px';
  box.style.width = w + 'px'; box.style.height = (vp.height / dpr) + 'px';
  await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  box.prepend(c);
}
function updatePageLabel() {
  const box = $('#vScroll'); const top = box.getBoundingClientRect().top;
  const els = $$('.v-page-box, .pm', box); let curP = 1;
  for (const el of els) { if (el.getBoundingClientRect().top - top < 120) curP = +el.dataset.p; }
  $('#vPage').textContent = V.pdf ? `${curP} / ${V.total}` : `第 ${curP} 页`;
}
function scrollToPage(p) {
  const el = $(`#vScroll [data-p="${p}"]`); if (!el) return;
  const box = $('#vScroll'); box.scrollTo({ top: el.offsetTop - 12, behavior: reduced ? 'auto' : 'smooth' });
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}
function setCrop(on) { V.crop = on; $('#vCrop')?.classList.toggle('on', on); $('#viewer').classList.toggle('crop-on', on); if (on) toast('在页面上拖出一个框'); }
(function cropGestures() {
  let start = null, rectEl = null, box = null;
  document.addEventListener('pointerdown', e => {
    if (!V.crop) return; box = e.target.closest('.v-page-box'); if (!box || !box.querySelector('canvas')) return;
    e.preventDefault(); const r = box.getBoundingClientRect(); start = { x: e.clientX - r.left, y: e.clientY - r.top, r };
    rectEl = document.createElement('div'); rectEl.className = 'crop-rect'; box.appendChild(rectEl);
  });
  document.addEventListener('pointermove', e => {
    if (!start) return; const x = e.clientX - start.r.left, y = e.clientY - start.r.top;
    Object.assign(rectEl.style, { left: Math.min(x, start.x) + 'px', top: Math.min(y, start.y) + 'px', width: Math.abs(x - start.x) + 'px', height: Math.abs(y - start.y) + 'px' });
  });
  document.addEventListener('pointerup', async e => {
    if (!start) return; const x = e.clientX - start.r.left, y = e.clientY - start.r.top;
    const rr = { x: Math.min(x, start.x) / start.r.width, y: Math.min(y, start.y) / start.r.height, w: Math.abs(x - start.x) / start.r.width, h: Math.abs(y - start.y) / start.r.height };
    const p = +box.dataset.p; const el = rectEl; start = null;
    setTimeout(() => el.remove(), 900);
    if (rr.w < 0.03 || rr.h < 0.02) return;
    setCrop(false);
    figureFromCrop(p, rr);
  });
})();
async function cropBlob(p, rr, type, maxW) {
  const page = await V.pdf.getPage(p); const vp = page.getViewport({ scale: 2.4 });
  const full = document.createElement('canvas'); full.width = vp.width; full.height = vp.height;
  await page.render({ canvasContext: full.getContext('2d'), viewport: vp }).promise;
  const sx = rr.x * vp.width, sy = rr.y * vp.height, sw = rr.w * vp.width, sh = rr.h * vp.height;
  const k = maxW ? Math.min(1, maxW / sw) : 1;
  const c = document.createElement('canvas'); c.width = Math.round(sw * k); c.height = Math.round(sh * k);
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(full, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return { blob: await new Promise(r => c.toBlob(r, type, 0.88)), url: c.toDataURL('image/jpeg', 0.8) };
}

async function pdfText(bytes) {
  await ensurePdfJs();
  const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)), isEvalSupported: false }).promise;
  let out = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const tc = await (await pdf.getPage(p)).getTextContent(); let t = '';
    for (const it of tc.items) t += it.str + (it.hasEOL ? '\n' : '');
    out += `〔第${p}页〕\n` + cleanText(t) + '\n\n';
  }
  return out.trim();
}
function cleanText(t) {
  const lines = t.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')); const out = [];
  for (const l of lines) {
    const prev = out[out.length - 1];
    if (l.trim() && prev && prev.length >= 26 && !/[。：！？；」）)”.:!?]$/.test(prev) && isCJK(prev.slice(-1)) && isCJK(l.trim()[0])) out[out.length - 1] = prev + l.trim();
    else out.push(l.trim());
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}


/* ======================= 状态与存储 ======================= */
const defaultPrefs = () => ({ engine: 'gemini', skill: true });
const freshState = () => ({ maps: {}, activeId: null, prefs: defaultPrefs(), dismissed: [] });
function newMap(o) {
  return Object.assign({ id: 'm' + rid(), title: '', source: '', rootId: null, currentId: null, nodes: {}, terms: {}, seq: 0, rev: 0,
    goal: '', pendingFigs: {}, mapSeen: [], pdfName: '', pdfUrl: null, example: false, createdAt: Date.now(), updatedAt: Date.now() }, o || {});
}
const newNode = id => ({ id, parent: null, q: '', where: '', pages: [], rel: [], secs: [], guess: '', mine: '', visited: false, shown: [], fig: null, order: 0 });
const mp = () => S.maps[S.activeId];
const cur = () => { const m = mp(); return m && m.nodes[m.currentId]; };
const kids = (m, id) => Object.values(m.nodes).filter(n => n.parent === id).sort((a, b) => a.order - b.order);
function ancestors(m, id) { const out = []; let n = m.nodes[id], guard = 0; while (n && n.parent && guard++ < 60) { n = m.nodes[n.parent]; if (n) out.unshift(n); } return out; }
function dfs(m) {
  const out = [], seen = new Set();
  const walk = (id, d) => { const n = m.nodes[id]; if (!n || seen.has(id)) return; seen.add(id); out.push(Object.assign(n, { _d: d })); kids(m, id).forEach(k => walk(k.id, d + 1)); };
  if (m.rootId) walk(m.rootId, 0);
  Object.values(m.nodes).sort((a, b) => a.order - b.order).forEach(n => walk(n.id, 1));
  return out;
}
function orderedSecs(n) {
  const lad = LADDER.map(l => n.secs.find(s => s.label === l)).filter(Boolean);
  return lad.concat(n.secs.filter(s => !LADDER.includes(s.label) && s.label !== GUESS_NOTE && s.label !== MINE_NOTE));
}
const secBy = (n, label) => n.secs.find(s => s.label === label);
const stage = n => !orderedSecs(n).length ? 'fog' : !n.visited ? 'guess' : 'read';
const glyphOf = n => n.mine ? 'done' : !orderedSecs(n).length ? 'fog' : n.visited ? 'seen' : 'unread';
const useClaude = () => S.prefs.engine === 'claude' && !!ui.sample;
const eng = () => useClaude() ? 'Claude' : 'Gemini';

let saveT = 0;
function save(touch = true) { const m = mp(); if (m && touch) m.updatedAt = Date.now(); clearTimeout(saveT); saveT = setTimeout(saveNow, 300); }
function saveNow() { try { localStorage.setItem(LS_KEY, JSON.stringify(S, (k, v) => k === '_d' ? undefined : v)); } catch (e) { toast('浏览器存储满了：请先把地图导出保存'); } }
function loadState() {
  try { const d = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); if (d && d.maps) { d.prefs = Object.assign(defaultPrefs(), d.prefs); d.dismissed = d.dismissed || []; return d; } } catch (e) {}
  return null;
}
const IDB = {
  db: null,
  open() { if (this.db) return Promise.resolve(this.db); return new Promise((res, rej) => { const r = indexedDB.open('qmap3', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => res(this.db = r.result); r.onerror = () => rej(r.error); }); },
  async get(k) { try { const db = await this.open(); return await new Promise(res => { const q = db.transaction('f').objectStore('f').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } },
  async put(k, v) { try { const db = await this.open(); await new Promise(res => { const t = db.transaction('f', 'readwrite'); t.objectStore('f').put(v, k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} },
  async del(k) { try { const db = await this.open(); await new Promise(res => { const t = db.transaction('f', 'readwrite'); t.objectStore('f').delete(k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} },
};

/* ======================= 地图文件：解析 ======================= */
function htmlToMd(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const inl = el => Array.from(el.childNodes).map(c => {
    if (c.nodeType === 3) return c.textContent;
    if (c.nodeType !== 1) return '';
    const t = c.tagName;
    if (t === 'BR') return '\n';
    if (t === 'STRONG' || t === 'B') return '**' + inl(c) + '**';
    if (t === 'CODE') return '`' + c.textContent + '`';
    return inl(c);
  }).join('');
  const L = [];
  const block = el => {
    for (const c of el.childNodes) {
      if (c.nodeType === 3) { const t = c.textContent.trim(); if (t) L.push(t); continue; }
      if (c.nodeType !== 1) continue;
      const t = c.tagName;
      if (/^H[1-6]$/.test(t)) L.push('', '#'.repeat(+t[1]) + ' ' + inl(c).trim(), '');
      else if (t === 'P') L.push(inl(c).trim(), '');
      else if (t === 'PRE') { const code = c.querySelector('code'); const lg = ((code && code.className) || '').match(/language-(\w+)/); const tx = c.textContent.replace(/\n$/, ''); L.push('```' + (lg ? lg[1] : /^\s*</.test(tx) ? 'svg' : /^\s*\{/.test(tx) ? 'chart' : ''), tx, '```', ''); }
      else if (t === 'UL' || t === 'OL') { let i = 1; for (const li of c.children) L.push((t === 'OL' ? (i++) + '. ' : '- ') + inl(li).trim()); L.push(''); }
      else if (t === 'TABLE') { const rows = Array.from(c.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(td => inl(td).trim().replace(/\|/g, '/'))); if (rows.length) { L.push('| ' + rows[0].join(' | ') + ' |', '|' + ' --- |'.repeat(rows[0].length)); rows.slice(1).forEach(r => L.push('| ' + r.join(' | ') + ' |')); L.push(''); } }
      else if (t === 'BLOCKQUOTE') L.push('> ' + inl(c).trim(), '');
      else if (/^(SCRIPT|STYLE|BUTTON|SVG|MAT-ICON)$/i.test(t)) continue;
      else block(c);
    }
  };
  block(doc.body);
  return L.join('\n').replace(/\n{3,}/g, '\n\n');
}
const looksLikeMap = t => /【\s*地图开始\s*】/.test(t) || /^#{1,4}\s*\**\s*[A-Za-z][A-Za-z0-9_]{0,15}\s*\**\s*[｜|丨]/m.test(t) || /^#{1,4}\s*\**\s*术语表?\s*\**\s*$/m.test(t);
function pickText(plain, html) {
  if (!html) return plain || '';
  const md = htmlToMd(html);
  const score = t => { if (!t || !looksLikeMap(t)) return -1; const P = parseMap(t); return P.nodes.length * 10 + P.nodes.reduce((a, n) => a + n.secs.length, 0) + Object.keys(P.terms).length; };
  return score(md) > score(plain) ? md : (plain || md);
}
function normalize(t) {
  return String(t || '').replace(/\r/g, '').replace(/ /g, ' ').replace(/[​﻿]/g, '').replace(/\\([\[\]*_#>|`~\-.!(){}+])/g, '$1');
}
function stripWrapFence(t) {
  const L = t.split('\n');
  while (L.length && !L[0].trim()) L.shift();
  while (L.length && !L[L.length - 1].trim()) L.pop();
  if (L.length && /^\s*(```|~~~)\s*(markdown|md|text|qmap|plaintext)?\s*$/i.test(L[0])) L.shift();
  if (L.length && /^\s*(```|~~~)\s*$/.test(L[L.length - 1]) && L.filter(l => /^\s*(```|~~~)/.test(l)).length % 2 === 1) L.pop();
  return L.join('\n');
}
function extractMap(raw) {
  const t = normalize(raw);
  const parts = [];
  if (/【\s*地图开始\s*】/.test(t)) {
    const re = /【\s*地图开始\s*】[^\n]*\n([\s\S]*?)(?=\n[^\n]*【\s*地图结束\s*】|$)/g; let x;
    while ((x = re.exec(t))) parts.push(x[1]);
  } else parts.push(t);
  return parts.map(stripWrapFence).join('\n\n');
}
/** 地图之外的话（对话正文） */
const proseOf = raw => normalize(raw).replace(/[^\n]*【\s*地图开始\s*】[\s\S]*?(?:【\s*地图结束\s*】[^\n]*|$)/g, '').trim();

const clean = s => String(s).replace(/\*\*/g, '').replace(/^\s+|\s+$/g, '');
const NODE_RE = /^#{1,4}\s*\**\s*\[?([A-Za-z][A-Za-z0-9_]{0,15})\]?\s*\**\s*[｜|丨·:：—–]\s*(.+?)\s*$/;
const TERMS_RE = /^#{1,4}\s*\**\s*术语表?\s*\**\s*[:：]?\s*$/;
const META_RE = /^\s*(?:[-*•]\s*)?\**\s*(父|父节点|上级|页|页码|相关|状态|图源)\s*\**\s*[:：]\s*(.*?)\s*$/;
function canonLabel(l) {
  l = l.replace(/^[\d一二三四五六七八九十]+\s*[.、)）]\s*/, '').replace(/\s*[—–]{1,2}.*$/, '').replace(/[:：]$/, '').trim();
  const rules = [[/^(一个)?画面|^场景/, '一个画面'], [/^例子|^举例|^实例/, '例子'], [/^为什么$|^为什么[:：（(]|^原理$|^机制$/, '为什么'], [/^(精确|严格)(地)?说|^精确定义/, '精确地说'],
    [/^什么时候失灵|^何时失灵|^边界$|^局限$/, '什么时候失灵'], [/^对照.{0,3}猜/, GUESS_NOTE], [/^对你(这|的)句话|^对.{0,4}一句话的(看法|点评)/, MINE_NOTE],
    [/^我的猜(测|想)$/, '我的猜测'], [/^我的一句话$/, '我的一句话']];
  for (const [re, v] of rules) if (re.test(l)) return v;
  return l.slice(0, 24) || '补充';
}
function pagesOf(v) {
  const out = [];
  for (const x of String(v).matchAll(/(\d+)\s*(?:[-–—~～至到]\s*(\d+))?/g)) { const a = +x[1], b = x[2] ? +x[2] : a; for (let p = a; p <= Math.min(b, a + 30); p++) out.push(p); }
  return [...new Set(out)].slice(0, 30);
}
function applyMeta(n, k, v) {
  const ids = s => (String(s).match(/\b[A-Za-z][A-Za-z0-9_]{0,15}\b/g) || []);
  if (/父|上级/.test(k)) n.parent = ids(v)[0] || '';
  else if (/页/.test(k)) { if (/^[\s\d,，、;；\-–—~～至到第页pP.]+$/.test(v)) n.pages = pagesOf(v); else { n.where = v.trim(); n.pages = n.pages || []; } }
  else if (k === '相关') n.rel = ids(v);
  else if (k === '状态') { if (/删除/.test(v)) n.del = true; }
  else if (k === '图源') { const p = (String(v).match(/\d+/) || [])[0]; if (p) n.figPage = +p; }
}
function parseTermLine(line) {
  let l = line.replace(/^\s*(?:[-*•]|\d+[.、)])\s*/, '').trim();
  if (!l || /^#/.test(l)) return null;
  const learned = /[✓✔]\s*$/.test(l); l = l.replace(/\s*[✓✔]\s*$/, '');
  let k, plain, ex = '', x;
  if ((x = l.match(/^\[\[([^\]|]+)\|([^\]]+)\]\]\s*(.*)$/))) { k = x[1]; plain = x[2]; ex = x[3]; }
  else if ((x = l.match(/^\[\[([^\]|]+)\]\]\s*[:：]\s*(.+)$/)) || (x = l.match(/^\**([^*：:\n]{1,24}?)\**\s*[:：]\s*(.+)$/))) {
    k = x[1]; plain = x[2];
    const e = plain.match(/^(.*?)[。；;，,]?\s*[（(]?\s*(?:例如|比如|例)\s*[:：]\s*(.+?)$/); if (e) { plain = e[1]; ex = e[2]; }
  } else return null;
  ex = ex.replace(/^[\s:：—–-]+/, '').replace(/^[（(]?\s*(?:例如|比如|例)\s*[:：]?\s*/, '').replace(/[）)]\s*$/, '').trim();
  k = clean(k); if (!k || k.length > 24) return null;
  return { k, plain: clean(plain), example: ex, learned };
}
function parseMap(raw) {
  const t = extractMap(raw);
  const P = { title: '', source: '', nodes: [], terms: {} };
  let node = null, sec = null, inTerms = false, fence = false, meta = false, x;
  for (const line of t.split('\n')) {
    if (fence) { if (/^\s*(```|~~~)\s*$/.test(line)) fence = false; if (sec) sec.md += line + '\n'; continue; }
    if (/^\s*(```|~~~)/.test(line) && node && !inTerms) {
      fence = true; meta = false;
      if (!sec) { sec = { label: '补充', md: '' }; node.secs.push(sec); }
      sec.md += line + '\n'; continue;
    }
    if (/^#(?!#)/.test(line) && (x = line.match(/^#\s*\**\s*(?:问题)?地图\s*[:：]\s*(.+?)\s*\**\s*$/))) { P.title = clean(x[1]); continue; }
    if (!P.nodes.length && !inTerms && (x = line.match(/^\s*\**\s*资料\s*\**\s*[:：]\s*(.+?)\s*$/))) { P.source = clean(x[1]); continue; }
    if (TERMS_RE.test(line)) { inTerms = true; node = null; sec = null; continue; }
    if ((x = line.match(NODE_RE))) {
      inTerms = false; sec = null; meta = true;
      node = { id: x[1], q: clean(x[2]).replace(/^「(.*)」$/, '$1'), parent: null, pages: null, rel: null, del: false, secs: [], user: {}, figPage: null, figImg: null };
      P.nodes.push(node); continue;
    }
    if (inTerms) { const tm = parseTermLine(line); if (tm) P.terms[tm.k] = tm; continue; }
    if (!node) continue;
    if (meta && (x = line.match(META_RE))) { applyMeta(node, x[1], x[2]); continue; }
    if (meta && /^\s*\**\s*删除\s*\**\s*$/.test(line)) { node.del = true; continue; }
    if ((x = line.match(/^#{2,5}\s*\**\s*(.+?)\s*\**\s*$/))) { meta = false; sec = { label: canonLabel(clean(x[1])), md: '' }; node.secs.push(sec); continue; }
    if (!line.trim()) { if (sec) sec.md += '\n'; continue; }
    meta = false;
    if (!sec) { sec = { label: '补充', md: '' }; node.secs.push(sec); }
    sec.md += line + '\n';
  }
  for (const n of P.nodes) {
    const out = [];
    for (const s of n.secs) {
      let md = s.md.replace(/\n{3,}/g, '\n\n').trim();
      md = md.replace(/\[\[([^\]|\n]+)\|([^\]\n]+)\]\]/g, (_, a, b) => { a = a.trim(); if (!P.terms[a]) P.terms[a] = { k: a, plain: b.trim(), example: '' }; return '[[' + a + ']]'; });
      if (s.label === '我的猜测') { n.user.guess = md; continue; }
      if (s.label === '我的一句话') { n.user.mine = md; continue; }
      if (s.label === '原图') { const im = md.match(/!\[[^\]]*\]\((data:image\/[^)\s]+)\)/); if (im) n.figImg = im[1]; continue; }
      if (!md) continue;
      const same = out.find(o => o.label === s.label);
      if (same) same.md += '\n\n' + md; else out.push({ label: s.label, md });
    }
    n.secs = out;
  }
  return P;
}

/* ======================= 合并：按编号 ======================= */
function bigrams(s) { s = String(s).replace(/[\s\p{P}]/gu, ''); const g = new Set(); for (let i = 0; i < s.length - 1; i++) g.add(s.slice(i, i + 2)); return g; }
function sim(a, b) { const A = bigrams(a), B = bigrams(b); if (!A.size || !B.size) return 0; let c = 0; for (const x of A) if (B.has(x)) c++; return c / Math.min(A.size, B.size); }
function nextId(m) {
  let mx = 0;
  for (const id of [...Object.keys(m.nodes), ...Object.keys(m.pendingFigs || {})]) { const k = id.match(/^q(\d+)$/); if (k) mx = Math.max(mx, +k[1]); }
  return 'q' + (mx + 1);
}
function isAncestor(m, a, b) { let n = m.nodes[b], g = 0; while (n && g++ < 80) { if (n.parent === a) return true; n = m.nodes[n.parent]; } return false; }
function removeNode(m, id) {
  const n = m.nodes[id]; if (!n || id === m.rootId) return;
  for (const k of kids(m, id)) k.parent = n.parent;
  for (const o of Object.values(m.nodes)) o.rel = (o.rel || []).filter(r => r !== id);
  delete m.nodes[id];
  if (m.currentId === id) m.currentId = n.parent || m.rootId;
}
function merge(m, P, opts = {}) {
  const sum = { added: [], updated: [], removed: [], terms: [], titled: false };
  if (P.title && (!m.title || opts.import)) { m.title = P.title; sum.titled = true; }
  if (P.source && (!m.source || opts.import)) m.source = P.source;
  const remap = {}, touched = [];
  for (const x of P.nodes) {
    let id = x.id, n = m.nodes[id];
    if (x.del) { if (n && id !== m.rootId) { sum.removed.push(n.q); removeNode(m, id); } continue; }
    // 编号撞车（Gemini 记错了编号）：父不同且问题毫不相干 → 当成新问题
    if (n && !opts.import && !opts.exact && x.parent && n.parent && x.parent !== n.parent && !remap[x.parent] && sim(n.q, x.q) < 0.3) { id = nextId(m); remap[x.id] = id; n = null; }
    const isNew = !n; let changed = [];
    if (isNew) {
      n = newNode(id); n.order = ++m.seq; n.q = x.q || '（还没写问题）'; m.nodes[id] = n;
      if (!m.rootId) m.rootId = id;
      if (m.pendingFigs && m.pendingFigs[id]) { n.fig = m.pendingFigs[id]; delete m.pendingFigs[id]; }
    } else if (x.q && x.q !== n.q) { n.q = x.q; changed.push('问题'); }
    if (x.pages) n.pages = x.pages;
    if (x.where) n.where = x.where;
    if (x.rel) n.rel = x.rel;
    if (x.figImg) n.fig = { page: x.figPage || (n.fig && n.fig.page) || null, thumb: x.figImg };
    for (const s of x.secs) {
      const o = n.secs.find(z => z.label === s.label);
      if (o) { if (o.md !== s.md) { o.md = s.md; changed.push(s.label); } }
      else { n.secs.push({ label: s.label, md: s.md }); changed.push(s.label); }
    }
    if (x.user.guess && (opts.import || !n.guess)) n.guess = x.user.guess;
    if (x.user.mine && (opts.import || !n.mine)) n.mine = x.user.mine;
    if (opts.import && (n.guess || n.mine)) { n.visited = true; n.shown = orderedSecs(n).map(s => s.label); }
    touched.push([x, n]);
    if (isNew) sum.added.push(n.id); else if (changed.length) sum.updated.push(n.id);
    const fresh = changed.filter(c => c !== '问题');
    if (fresh.length && !opts.import) ui.fresh[n.id] = new Set([...(ui.fresh[n.id] || []), ...fresh]);
  }
  for (const [x, n] of touched) {
    if (n.id === m.rootId) { n.parent = null; continue; }
    let p = x.parent ? (remap[x.parent] || x.parent) : null;
    if (p && m.nodes[p] && p !== n.id && !isAncestor(m, n.id, p)) { if (n.parent && n.parent !== p && !sum.added.includes(n.id) && !sum.updated.includes(n.id)) sum.updated.push(n.id); n.parent = p; }
    else if (!n.parent || !m.nodes[n.parent]) n.parent = m.rootId;
  }
  for (const [k, v] of Object.entries(P.terms)) {
    const o = m.terms[k];
    if (!o) { m.terms[k] = { plain: v.plain, example: v.example || '', learned: !!(opts.import && v.learned) }; sum.terms.push(k); }
    else if (v.plain) { o.plain = v.plain; if (v.example) o.example = v.example; if (opts.import && v.learned) o.learned = true; }
  }
  termReKey = '';
  if (!m.currentId || !m.nodes[m.currentId]) m.currentId = m.rootId;
  sum.empty = !sum.added.length && !sum.updated.length && !sum.removed.length && !sum.terms.length && !sum.titled;
  if (!sum.empty) m.rev++;
  return sum;
}

/* ======================= 地图文件：写出 ======================= */
function nodeLines(n, o) {
  const L = [`## ${n.id}｜${n.q}`];
  if (n.parent) L.push('父：' + n.parent);
  if (n.pages && n.pages.length) L.push('页：' + n.pages.join(', ')); else if (n.where) L.push('页：' + n.where);
  if (n.rel && n.rel.length) L.push('相关：' + n.rel.join(', '));
  if (o.images && n.fig && n.fig.page) L.push(`图源：第 ${n.fig.page} 页`);
  for (const s of n.secs) L.push('', '### ' + s.label, s.md);
  if (o.user !== false && n.guess) L.push('', '### 我的猜测', n.guess);
  if (o.user !== false && n.mine) L.push('', '### 我的一句话', n.mine);
  if (o.images && n.fig && n.fig.thumb) L.push('', '### 原图', `![原文第 ${n.fig.page || '?'} 页](${n.fig.thumb})`);
  return L;
}
function serialize(m, o = {}) {
  const L = [];
  if (o.marks) L.push(MARK_A);
  L.push('# 地图：' + (m.title || '未命名'));
  if (m.source) L.push('资料：' + m.source);
  for (const n of dfs(m)) L.push('', ...nodeLines(n, o));
  const ts = Object.entries(m.terms).filter(([, v]) => v.plain);
  if (ts.length) { L.push('', '## 术语'); for (const [k, v] of ts) L.push(`- [[${k}|${v.plain}]]` + (v.example ? '：' + v.example : '') + (o.user !== false && v.learned ? ' ✓' : '')); }
  if (o.marks) L.push(MARK_B);
  return L.join('\n') + '\n';
}
function skeleton(m, focusId) {
  const L = [`# 地图：${m.title || '未命名'}`]; if (m.source) L.push('资料：' + m.source);
  for (const n of dfs(m)) { const s = orderedSecs(n).map(x => x.label); L.push(`- ${n.id}（父：${n.parent || '无'}）${n.q}${s.length ? '　已写：' + s.join('、') : '　【迷雾】'}`); }
  if (focusId && m.nodes[focusId]) L.push('', '正在看的问题（全文）：', ...nodeLines(m.nodes[focusId], {}));
  const ts = Object.keys(m.terms); if (ts.length) L.push('', '已有术语：' + ts.join('、'));
  return L.join('\n');
}

/* ======================= 给 Gemini 的请求 ======================= */
const SKILL_MD = () => ($('#qmap-skill').textContent || '').replace(/<\\\//g, '</').trim();
const SKILL_BODY = () => SKILL_MD().replace(/^---[\s\S]*?---\s*/, '');
const ref = n => `${n.id}「${short(n.q, 40)}」`;
const nextHint = m => `（新问题从 ${nextId(m)} 开始编号）`;
const REQ = {
  kickoff: m => (S.prefs.skill ? '' : SKILL_BODY() + '\n\n---\n\n') + '【问题地图】请读我上传的资料，画出问题地图的初稿。' + (m.goal ? `\n我这次想弄懂：${m.goal}` : ''),
  expand: (m, n, guess) => `【问题地图】展开 ${ref(n)}：写完整的讲解梯子。` + (guess ? `\n我先猜：${guess}\n展开时请加一节「对照你的猜测」。` : ''),
  expandAll: (m, list) => '【问题地图】把这些还在迷雾里的问题都展开（太长就分批，我说"继续"再给下一批）：\n' + list.map(n => '- ' + ref(n)).join('\n'),
  guess: (m, n) => `【问题地图】${ref(n)}——我先猜：${n.guess}\n请写「对照你的猜测」。`,
  mine: (m, n) => `【问题地图】${ref(n)}——我的一句话：${n.mine}\n请写「对你这句话的看法」。`,
  chat: (m, n, text) => `【问题地图】关于 ${ref(n)}：\n${text}`,
  newq: (m, n, text) => `【问题地图】在 ${n.id} 下记一个新问题：${text}\n${nextHint(m)}`,
  term: (m, n, key, around) => `【问题地图】解释「${key}」` + (n ? `（出自 ${n.id}${around ? `：「${short(around.replace(/\s+/g, ' '), 90)}」` : ''}）` : ''),
  draw: (m, n, label) => `【问题地图】给 ${n.id} 的「${label}」画一张图。`,
  rewrite: (m, n, labels) => `【问题地图】${ref(n)} 我还没懂透。请换个讲法重写：${labels.join('、')}。`,
  more: (m, n) => `【问题地图】在 ${ref(n)} 下再提 2–3 个值得追问的问题，只写问题、不用展开。${nextHint(m)}`,
  figure: (m, n, fid, page) => `【问题地图】这是原文第 ${page} 页的一块图（图片附在这条消息里）。请在 ${n.id} 下新建问题 ${fid} 讲解它。`,
  resume: m => `【问题地图】这是我们之前画到一半的地图，请以它为准接着画。${nextHint(m)}\n\n` + serialize(m, { marks: true }),
};

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); if (ok) return true; } catch (e) {}
  ui.copyFallback = text; openSheet('copy');
  return false;
}
/** 发出一个请求：Gemini → 复制并等粘贴；Claude → 直接问 */
async function ask(text, meta) {
  meta = meta || {};
  if (useClaude()) return runClaude(text, meta);
  const ok = await copyText(text);
  ui.wait = Object.assign({ at: Date.now(), mapId: S.activeId }, meta);
  renderWait(); refreshSoft();
  if (ok && ui.canvas) toast('已复制。粘贴到左边的对话框发送，Gemini 会改右边的画板');
  else if (ok) toast(meta.chat ? '已复制。去 Gemini 粘贴发送——回答里有地图块再复制回来' : '已复制。去 Gemini 粘贴发送，再把回答复制回来按 Ctrl+V');
}
async function runClaude(req, meta) {
  const m = mp(); if (ui.busy) { toast('Claude 还在画上一笔'); return; }
  ui.busy = Object.assign({ mapId: m.id }, meta); renderWait(); refreshSoft();
  try {
    let ctx;
    if (meta.type === 'kickoff') {
      const txt = await sourceText(m);
      if (!txt) throw { msg: '先在画板里放入资料 PDF，Claude 才读得到。' };
      ctx = '资料全文（〔第N页〕是页码）：\n' + txt.slice(0, 160000);
    } else ctx = '当前地图的结构：\n' + skeleton(m, meta.nodeId);
    const prompt = `${SKILL_BODY()}\n\n---\n\n${ctx}\n\n---\n\n${req.replace(/^[\s\S]*?(【问题地图】)/, '$1')}`;
    const o = { modelTier: 'default' }; if (meta.image) o.images = [meta.image];
    const r = await ui.sample(prompt, o);
    const text = (r && r.text) || '';
    const prose = proseOf(text);
    if (prose && meta.nodeId && (meta.chat || meta.type === 'term')) ui.reply[meta.nodeId] = prose;
    ui.busy = null;
    if (!absorb(text, { quiet: !!prose && meta.chat })) refreshSoft();
  } catch (e) { ui.busy = null; toast(e && e.msg ? e.msg : claudeErr(e)); }
  ui.busy = null; renderWait(); refreshSoft();
}
function claudeErr(e) {
  const c = e && e.code;
  if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(c)) { ui.sample = null; S.prefs.engine = 'gemini'; save(false); return '这里不能直接调用 Claude，已换回 Gemini（复制粘贴）'; }
  if (c === 'rate_limited') return '问得有点多，过一会儿再试。';
  if (c === 'prompt_too_large') return '地图太大了，这一步换 Gemini 来画吧。';
  if (c === 'images_unavailable' || c === 'image_rejected') return '这张图发不过去，换一块小一点的区域。';
  return 'Claude 没能回答，再试一次。';
}
async function sourceText(m) {
  if (ui.srcText[m.id]) return ui.srcText[m.id];
  const b = await getPdfBytes(m); if (!b) return '';
  try { const t = await pdfText(b); ui.srcText[m.id] = t; return t; } catch (e) { return ''; }
}

/* ======================= 粘贴 → 合并 ======================= */
document.addEventListener('paste', e => {
  const t = e.target;
  if (t && t.closest && t.closest('input, textarea, [contenteditable]')) return;
  const d = e.clipboardData; if (!d) return;
  const text = pickText(d.getData('text/plain'), d.getData('text/html'));
  if (!text.trim()) return;
  e.preventDefault(); absorb(text);
});
function absorb(raw, opts = {}) {
  const P = parseMap(raw);
  if (!P.nodes.length && !Object.keys(P.terms).length && !P.title) {
    if (!opts.quiet) toast(proseOf(raw) ? '这段回答里没有地图块。只是闲聊的回答，不用贴回来' : '没读到地图内容');
    return false;
  }
  let m = mp();
  // 一整张新地图（有标题和根问题），而当前地图已经画了别的 → 新开一张
  const pr = P.nodes.find(x => x.id === 'r');
  if (m && m.rootId && P.title && pr && m.nodes.r && P.title !== m.title && sim(pr.q, m.nodes.r.q) < 0.3) m = null;
  if (!m) { m = newMap(); S.maps[m.id] = m; S.activeId = m.id; }
  const wasEmpty = !m.rootId;
  const sum = merge(m, P);
  if (wasEmpty) ui.fresh = {};
  ui.wait = null;
  if (sum.empty) { toast('这些内容地图里已经有了'); renderWait(); return true; }
  // 正在看的问题有新内容：展开到新内容那一层
  const n = m.nodes[m.currentId];
  if (n && ui.fresh[n.id] && n.visited) revealFresh(n);
  if (wasEmpty) { m.mapSeen = []; ui.bloom = true; }
  if (V.figure && m.nodes[V.figure.fid]) { V.figure = null; renderFigure(); }
  save(); renderWait();
  if (wasEmpty) { renderRead(); if (ui.view !== 'map') setView('map'); else renderMap(true); }
  else { renderRead(true); if (ui.view === 'map') renderMap(false); }
  showMergeCard(m, sum, wasEmpty);
  if (card.key && m.terms[card.key] && card.rect) showGlance(card.key, card.rect, card.around);
  return true;
}
function revealFresh(n) {
  const labels = orderedSecs(n).map(s => s.label); const f = ui.fresh[n.id];
  let last = -1; labels.forEach((l, i) => { if (f.has(l)) last = i; });
  if (last >= 0) n.shown = Array.from(new Set([...(n.shown || []), ...labels.slice(0, last + 1)]));
}
let mcardT = 0;
function showMergeCard(m, sum, first) {
  const parts = [];
  if (sum.added.length) parts.push(`新问题 ${sum.added.length}`);
  if (sum.updated.length) parts.push(`更新 ${sum.updated.length}`);
  if (sum.terms.length) parts.push(`术语 +${sum.terms.length}`);
  if (sum.removed.length) parts.push(`删除 ${sum.removed.length}`);
  const items = [...sum.added.map(id => ['+', id]), ...sum.updated.map(id => ['↻', id])].filter(([, id]) => m.nodes[id]).slice(0, first ? 0 : 5)
    .map(([g, id]) => `<li><button data-go="${id}"><span class="g">${g}</span><span class="t">${esc(m.nodes[id].q)}</span>${g === '↻' && ui.fresh[id] ? `<span class="s">${esc([...ui.fresh[id]].join('、'))}</span>` : ''}</button></li>`).join('');
  const head = first ? `初稿画好了：${esc(m.title || '新地图')}` : `${eng()} 补上了`;
  const el = $('#mcard'); $('#toast').classList.remove('show');
  el.innerHTML = `<div class="mc-head"><b>${head}</b><span class="spacer"></span><button class="btn-text" data-act="mcard-close" aria-label="关闭">✕</button></div>
    <p class="mc-sum">${parts.join(' · ')}${first ? '。点任意一个问题开始读，建议从中间的根问题开始。' : ''}</p>${items ? `<ul>${items}</ul>` : ''}
    ${ui.view !== 'map' && !first ? `<div class="row"><button class="btn-text" data-act="mcard-map">在地图上看</button></div>` : ''}`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(mcardT); mcardT = setTimeout(hideMergeCard, first ? 9000 : 7000);
}
function hideMergeCard() { if ($('#mcard').matches(':hover')) { mcardT = setTimeout(hideMergeCard, 2000); return; } $('#mcard').classList.remove('show'); }

/* ======================= 导航 + 共享元素过渡 ======================= */
function morph(fromEl, update, toSel) {
  if (!document.startViewTransition || reduced || ui.canvas) { update(); const c = $('#col'); if (c && ui.view === 'read') { c.classList.remove('enter'); void c.offsetWidth; c.classList.add('enter'); } return; }
  if (fromEl) fromEl.style.viewTransitionName = 'qtitle';
  document.body.classList.add('instant');
  let t;
  try {
    t = document.startViewTransition(() => {
      if (fromEl) fromEl.style.viewTransitionName = '';
      update();
      const to = toSel && $(toSel); if (to && fromEl) to.style.viewTransitionName = 'qtitle';
    });
  } catch (e) { update(); document.body.classList.remove('instant'); return; }
  const quiet = () => {}; t.ready && t.ready.catch(quiet); t.updateCallbackDone && t.updateCallbackDone.catch(quiet);
  t.finished.catch(quiet).finally(() => { document.body.classList.remove('instant'); $$('[style*="view-transition-name"]').forEach(x => x.style.viewTransitionName = ''); });
}
function go(id, fromEl) {
  const m = mp(); if (!m || !m.nodes[id]) return;
  hideCards(); $('#mcard').classList.remove('show');
  const update = () => {
    m.currentId = id; const n = m.nodes[id];
    if (!orderedSecs(n).length) n.visited = true;
    if (ui.view === 'map') { ui.view = 'read'; document.body.dataset.view = 'read'; $('#mapBtn').classList.remove('on'); }
    renderRead(); $('#reading').scrollTop = 0; save(false);
  };
  if (m.currentId === id && ui.view === 'read') { update(); return; }
  morph(fromEl, update, '#qText');
}
function setView(v) {
  if (ui.view === v) return;
  hideCards();
  const update = () => { ui.view = v; document.body.dataset.view = v; $('#mapBtn').classList.toggle('on', v === 'map'); if (v === 'map') renderMap(true); };
  if (v === 'map') morph($('#qText'), update, '.mnode.cur .ml'); else morph($('.mnode.cur .ml'), update, '#qText');
}

/* ======================= 渲染：阅读栏 ======================= */
function renderAll() { renderRead(); if (ui.view === 'map') renderMap(true); renderWait(); }
function refreshSoft() { if (ui.view === 'read') renderRead(true); }
function renderRead(soft) {
  const m = mp(); const col = $('#col');
  $('#mapTitle').textContent = m ? (m.title || '新地图') : '问题地图';
  document.title = (m && m.title ? m.title + ' · ' : '') + '问题地图';
  if (!m || !m.rootId) { ui.renderedId = null; col.innerHTML = onboardHTML(m); autoGrow($('#goalIn')); return; }
  const n = m.nodes[m.currentId] || m.nodes[m.rootId]; m.currentId = n.id;
  if (soft && ui.renderedId === n.id && $('#c-main')) { refreshNode(n); return; }
  ui.renderedId = n.id;
  const anc = ancestors(m, n.id);
  const trail = anc.length ? anc.map(a => `<button class="crumb" data-go="${a.id}" title="${esc(a.q)}">${esc(short(a.mine || a.q, 16))}</button>`).join('<span class="sep">›</span>') : `<span>起点</span>`;
  const fig = n.fig && n.fig.thumb ? `<div class="figure-head" data-act="open-page" data-page="${n.fig.page || ''}"><img src="${n.fig.thumb}" alt="框选的原图"><div class="cap">原文${n.fig.page ? ` · 第 ${n.fig.page} 页` : ''} · 点击看原文</div></div>` : '';
  col.innerHTML = `<nav class="trail" aria-label="来路">${trail}<span class="nid">${esc(n.id)}</span></nav>
    <h1 class="q" id="qText">${esc(n.q)}</h1>${fig}
    <div id="c-main"></div><div id="c-refs"></div><div id="c-own"></div><div id="c-ask"></div><div id="c-next"></div><div id="c-tools"></div>`;
  refreshNode(n);
}
function refreshNode(n) { $('#qText').textContent = n.q; renderMain(n); renderRefs(n); renderOwn(n); renderAsk(n); renderNext(n); renderTools(n); }
const waitingFor = (type, n) => ui.wait && ui.wait.mapId === S.activeId && ui.wait.type === type && (!n || ui.wait.nodeId === n.id);
const busyFor = (type, n) => ui.busy && ui.busy.type === type && (!n || ui.busy.nodeId === n.id);
function waitBadge(type, n) {
  if (busyFor(type, n)) return `<span class="thinking-s">${dots}Claude 正在画</span>`;
  if (waitingFor(type, n)) return `<span class="waiting"><span class="pulse"></span>等你把 Gemini 的回答粘贴回来</span>`;
  return '';
}
function renderMain(n) {
  const box = $('#c-main'); const m = mp(); const st = stage(n);
  if (st === 'fog') {
    const html = `<div class="fogbox">
      <span class="lbl">还在迷雾里</span>
      <p>这个问题还没展开。可以先写下你的猜测，和展开的请求一起发给 ${eng()}——先想再看，记得更牢。</p>
      <textarea id="fogGuess" rows="1" placeholder="我猜……（可以不写）">${esc(n.guess)}</textarea>
      <div class="row"><span id="fogWait">${waitBadge('expand', n)}</span><span class="spacer"></span><button class="btn-primary" data-act="expand">请 ${eng()} 展开</button></div></div>`;
    if (box.dataset.k !== 'fog' + n.id) { box.dataset.k = 'fog' + n.id; box.innerHTML = html; autoGrow($('#fogGuess')); }
    else $('#fogWait').innerHTML = waitBadge('expand', n);
    return;
  }
  if (st === 'guess') {
    if (box.dataset.k === 'guess' + n.id) return;
    box.dataset.k = 'guess' + n.id;
    box.innerHTML = `<div class="guess"><label class="lbl" for="guessInput">先想一想</label>
      <textarea id="guessInput" rows="2" placeholder="你的直觉是……一句话就够">${esc(n.guess)}</textarea>
      <div class="row"><span class="spacer"></span><button class="btn-text" data-act="guess-skip">直接看</button><button class="btn-primary" data-act="guess-submit">看讲解</button></div></div>
      <p class="hint" style="margin:12px 2px 0">先猜一下再看，会记得更牢。猜错也没关系。</p>`;
    autoGrow($('#guessInput')); return;
  }
  if (!String(box.dataset.k || '').startsWith('read' + n.id)) { box.innerHTML = ''; box.dataset.k = 'read' + n.id; }
  box.className = 'secs';
  const secs = orderedSecs(n); const shown = new Set(n.shown || []); const fresh = ui.fresh[n.id] || new Set();
  const items = []; const ctx = { used: new Set() };
  if (n.guess) {
    const note = secBy(n, GUESS_NOTE);
    const tail = note ? `<div class="note prose${fresh.has(GUESS_NOTE) ? ' fresh' : ''}">${md(note.md, m, ctx)}</div>`
      : (waitBadge('guess', n) || `<button class="btn-text small" data-act="ask-guess">请 ${eng()} 对照我的猜测</button>`);
    items.push({ key: 'guess', cls: 'guess-card', html: `<span class="lbl">你的猜测</span><p>${esc(n.guess)}</p>${tail}` });
  }
  let i = 0, nxt = null;
  for (const s of secs) {
    if (!shown.has(s.label)) { nxt = s; break; }
    const hasFig = /```(svg|chart)|<svg/.test(s.md);
    const drawBtn = hasFig ? '' : busyFor('draw', n) && ui.busy.label === s.label ? `<span class="draw on">${dots}</span>` : waitingFor('draw', n) && ui.wait.label === s.label ? `<span class="draw on">等回答…</span>` : `<button class="draw" data-act="draw" data-label="${esc(s.label)}">画一张图</button>`;
    items.push({ key: 's:' + s.label, tag: 'section', cls: 'sec' + (fresh.has(s.label) ? ' fresh' : ''), animate: true, delay: ui.enter === n.id ? i * 90 : 0,
      html: `<div class="head"><span class="lbl">${esc(s.label)}</span>${i === 0 ? depthBar(shown.size, secs.length) : ''}${drawBtn}</div><div class="prose">${md(s.md, m, ctx)}</div>` });
    i++;
  }
  if (nxt) items.push({ key: 'deeper', html: `<button class="deeper" data-act="deeper"><svg class="chev" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 5.5 7 9.5 11 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>再深一层</span><span class="nxt">${esc(nxt.label)}</span><span class="cnt">${i} / ${secs.length}</span></button>` });
  else if (!LADDER.every(l => secBy(n, l))) items.push({ key: 'partial', html: `<div class="partial"><span class="hint">后面几层（${LADDER.filter(l => !secBy(n, l)).join('、')}）还没写。</span>${waitBadge('expand', n) || `<button class="btn-accent" data-act="expand">请 ${eng()} 补上</button>`}</div>` });
  patch(box, items);
  ui.enter = null;
  if (fresh.size) { clearTimeout(ui.freshT); ui.freshT = setTimeout(() => { delete ui.fresh[n.id]; $$('.fresh').forEach(x => x.classList.remove('fresh')); $$('#c-main .sec').forEach(x => x._c = 'sec'); }, 3200); }
}
function depthBar(shown, total) { let h = `<span class="depth" aria-label="深度 ${shown} / ${total}">`; for (let i = 0; i < total; i++) h += `<i class="${i < shown ? 'on' : ''}"></i>`; return h + '</span>'; }
function patch(container, items) {
  const existing = new Map(Array.from(container.children).map(el => [el.dataset.key, el]));
  let prev = null;
  for (const it of items) {
    let el = existing.get(it.key);
    if (el) { existing.delete(it.key); if (el._h !== it.html) { el.innerHTML = it.html; el._h = it.html; } if (it.cls != null && el._c !== it.cls) { el.className = it.cls; el._c = it.cls; } }
    else {
      el = document.createElement(it.tag || 'div'); el.dataset.key = it.key; el.innerHTML = it.html; el._h = it.html;
      el.className = (it.cls || '') + (it.animate ? ' enter' : ''); el._c = it.cls;
      if (it.animate) { if (it.delay) el.style.animationDelay = it.delay + 'ms'; el.addEventListener('animationend', () => { el.classList.remove('enter'); el.style.animationDelay = ''; }, { once: true }); }
    }
    if (el.previousElementSibling !== prev || el.parentNode !== container) { prev ? prev.after(el) : container.prepend(el); }
    prev = el;
  }
  for (const el of existing.values()) el.remove();
}
function renderRefs(n) {
  const box = $('#c-refs');
  const pg = (n.pages || []).slice(0, 8).map(p => `<button class="ref" data-act="open-page" data-page="${p}">原文第 ${p} 页</button>`).join('');
  const wh = n.where ? n.where.split(/[,，、;；]\s*/).filter(Boolean).slice(0, 6).map(w => `<span class="ref static">${esc(w)}</span>`).join('') : '';
  const html = stage(n) === 'read' && (pg || wh) ? `<div class="refs"><span>依据</span>${pg}${wh}</div>` : '';
  if (box._h !== html) { box.innerHTML = html; box._h = html; }
}
function renderOwn(n) {
  const box = $('#c-own'); const m = mp(); const secs = orderedSecs(n);
  const ready = stage(n) === 'read' && (n.mine || (n.shown || []).length >= Math.min(3, secs.length));
  if (!ready) { box.innerHTML = ''; box.className = ''; box._h = ''; return; }
  box.className = 'block';
  if (n.mine && ui.editOwn !== n.id) {
    const note = secBy(n, MINE_NOTE);
    const tail = note ? `<div class="own-note prose${(ui.fresh[n.id] || new Set()).has(MINE_NOTE) ? ' fresh' : ''}">${md(note.md, m)}</div>` : (waitBadge('mine', n) || '');
    const html = `<div class="own-done"><span class="lbl">我的一句话</span><p class="own-text">${esc(n.mine)}</p>${tail}<div class="row"><button class="btn-text" data-act="own-edit">改一改</button>${note ? '' : `<button class="btn-text" data-act="ask-mine">请 ${eng()} 看看这句话</button>`}</div></div>`;
    if (box._h !== html) { box.innerHTML = html; box._h = html; }
    return;
  }
  if (box.querySelector('#ownInput')) return;
  box._h = '';
  box.innerHTML = `<div class="own"><label class="lbl" for="ownInput">用一句话说清楚</label>
    <textarea id="ownInput" rows="1" placeholder="如果讲给一个朋友听，你会怎么说？">${esc(n.mine)}</textarea>
    <div class="row"><span class="hint">这句话会画在地图上，代替原来的问题。</span><span class="spacer"></span><button class="btn-primary" data-act="own-save">记下</button></div></div>`;
  autoGrow($('#ownInput'));
}
function renderAsk(n) {
  const box = $('#c-ask'); const st = stage(n);
  if (st === 'guess') { box.innerHTML = ''; box.className = ''; return; }
  box.className = 'block';
  if (!box.querySelector('#askInput')) {
    box.innerHTML = `<div class="ask"><span class="lbl">接着画</span>
      <div class="composer" id="composer">
        <textarea id="askInput" rows="1" placeholder="冒出来的疑问、想法、类比……写下来" aria-label="提问或讨论"></textarea>
        <div class="row"><span class="hint" id="askHint"></span><span class="spacer"></span>
          <button class="chip-btn" data-act="ask-node">记成新问题<span class="kbd">Ctrl ↵</span></button>
          <button class="chip-btn primary" data-act="ask-chat">去聊聊<span class="kbd">↵</span></button></div></div>
      <div class="quick" id="quick"></div><div id="replyBox"></div></div>`;
    autoGrow($('#askInput')); setIntent(ui.intent);
  }
  const q = $('#quick');
  const qh = st === 'read' ? `<span class="hint">或者请 ${eng()}：</span><button class="chip-btn" data-act="q-rewrite">换个讲法</button><button class="chip-btn" data-act="q-more">再提几个问题</button>${waitBadge('chat', n) || waitBadge('newq', n) || waitBadge('rewrite', n) || waitBadge('more', n)}` : (waitBadge('chat', n) || waitBadge('newq', n));
  if (q._h !== qh) { q.innerHTML = qh; q._h = qh; }
  const r = ui.reply[n.id]; const rb = $('#replyBox');
  const rh = r ? `<div class="reply enter"><div class="row"><span class="who">Claude</span><span class="spacer"></span><button class="btn-text" data-act="reply-close">收起</button></div><div class="prose">${md(r, mp())}</div></div>` : '';
  if (rb._h !== rh) { rb.innerHTML = rh; rb._h = rh; }
  $('#askHint').textContent = ui.intent === 'node' ? `回车：记成新问题，交给 ${eng()} 展开` : useClaude() ? '回车：问 Claude（不进地图，除非它觉得值得记）' : '回车：复制到 Gemini 去聊（不进地图，除非它觉得值得记）';
}
function renderNext(n) {
  const box = $('#c-next'); const m = mp(); const ks = kids(m, n.id);
  if (stage(n) === 'guess' || !ks.length) { box.innerHTML = ''; box.className = ''; return; }
  box.className = 'block';
  if (!box.querySelector('ul')) box.innerHTML = `<div class="next"><span class="lbl">接着可以问</span><ul id="nextList"></ul></div>`;
  const list = $('#nextList'); const fresh = !list.children.length;
  patch(list, ks.map(k => { const g = glyphOf(k); return { key: k.id, tag: 'li', animate: !fresh, html: `<button class="next-item ${g}" data-go="${k.id}"><span class="glyph ${g}"></span><span class="t">${esc(k.mine || k.q)}</span><svg class="go" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` }; }));
}
function renderTools(n) {
  const box = $('#c-tools'); const m = mp(); const bits = [];
  const fogs = Object.values(m.nodes).filter(x => !orderedSecs(x).length);
  if (fogs.length > 1) bits.push(waitingFor('expandAll') ? `<span class="waiting"><span class="pulse"></span>等 Gemini 展开 ${fogs.length} 个迷雾问题</span>` : `<button data-act="expand-all">请 ${eng()} 展开全部迷雾（${fogs.length}）</button>`);
  if (n.id !== m.rootId) bits.push(`<button data-act="delete-node">删掉这个问题</button>`);
  const html = bits.length ? `<div class="foot-tools">${bits.join('')}</div>` : '';
  if (box._h !== html) { box.innerHTML = html; box._h = html; }
}
function autoGrow(t) { if (!t) return; const f = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }; t.addEventListener('input', f); f(); }
function setIntent(i) {
  ui.intent = i;
  $('[data-act="ask-node"]')?.classList.toggle('primary', i === 'node');
  $('[data-act="ask-chat"]')?.classList.toggle('primary', i !== 'node');
  const h = $('#askHint'); if (h) h.textContent = i === 'node' ? `回车：记成新问题，交给 ${eng()} 展开` : useClaude() ? '回车：问 Claude（不进地图，除非它觉得值得记）' : '回车：复制到 Gemini 去聊（不进地图，除非它觉得值得记）';
}
function prefill(text, intent) {
  const a = $('#askInput'); if (!a) { toast('先看完讲解，再在下面追问'); return; }
  a.value = text; a.dispatchEvent(new Event('input')); setIntent(intent || 'chat');
  a.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  setTimeout(() => { a.focus(); a.setSelectionRange(a.value.length, a.value.length); }, reduced ? 0 : 320);
}

/* ---------- 空白画板：三步 ---------- */
function onboardHTML(m) {
  if (ui.canvas) return `<div class="onboard enter"><p class="lbl">问题地图 · Gemini Canvas</p><h1 class="q">画板已经准备好了</h1>
    <p class="lead">在左边的对话里上传资料，说「开始画初稿」。Gemini 会把地图写进这个画板，它每改一次，这里就会更新。</p>
    <div class="side-opts"><div class="opt"><b>已有地图文件</b><p>打开以前保存的 .md 或 .html。</p><div class="row"><button class="btn-text" data-act="import">打开文件</button></div></div></div></div>`;
  const claude = useClaude();
  const pdf = m && m.pdfName ? `<span class="hint">已放入：${esc(short(m.pdfName, 28))}</span>` : '';
  const step1 = claude ? '' : `<li><div class="sn">1</div><div class="sb"><h3>给 Gemini 装上画法 <span class="muted">只需一次</span></h3>
      <p>下载 skill 文件，在 Gemini 网页版「设置 › 技能」里上传。以后在任何对话里输入 <code>/</code> 选 <b>question-map</b> 就能用。</p>
      <div class="row"><button class="btn-secondary" data-act="dl-skill">下载 skill</button><button class="btn-text" data-act="copy-skill">复制 skill 全文</button><a class="btn-text" href="${GEMINI_URL}" target="_blank" rel="noopener">打开 Gemini ↗</a></div>
      <label class="check-row"><input type="checkbox" data-act="skill-toggle" ${S.prefs.skill ? 'checked' : ''}>已经装好了。没装的话，开场白会附上完整规则，也能用于 ChatGPT 等其他对话。</label></div></li>`;
  const step2 = claude
    ? `<li><div class="sn">1</div><div class="sb"><h3>放入资料，请 Claude 画初稿</h3>
        <p>Claude 会读完整份 PDF，画出问题地图的初稿。</p>
        <div class="field"><textarea id="goalIn" rows="1" placeholder="这次想弄懂什么？（可选）">${esc(m ? m.goal : '')}</textarea></div>
        <div class="row"><button class="btn-secondary" data-act="attach-pdf">选择 PDF</button>${pdf}<span class="spacer"></span>${ui.busy ? `<span class="thinking-s">${dots}Claude 正在读资料</span>` : '<button class="btn-primary" data-act="kickoff">请 Claude 画初稿</button>'}</div></div></li>`
    : `<li><div class="sn">2</div><div class="sb"><h3>在 Gemini 新对话里上传资料，发送开场白</h3>
        <p>资料可以是 PDF、论文、笔记、网页链接，放几份都行。</p>
        <div class="field"><textarea id="goalIn" rows="1" placeholder="这次想弄懂什么？（可选，会写进开场白）">${esc(m ? m.goal : '')}</textarea></div>
        <div class="row"><button class="btn-primary" data-act="kickoff">复制开场白</button><span class="hint">在输入框先输入 / 选 question-map，再粘贴发送。</span></div></div></li>
      <li><div class="sn">3</div><div class="sb"><h3>把 Gemini 的整段回答复制回来</h3>
        <p>点回答下方的「复制」，回到这里按 <kbd>Ctrl</kbd> + <kbd>V</kbd>（Mac 上是 <kbd>⌘</kbd> + <kbd>V</kbd>）。地图会一点点长出来。</p>
        <div class="row">${waitingFor('kickoff') ? '<span class="waiting"><span class="pulse"></span>等你粘贴初稿</span>' : ''}<button class="btn-secondary" data-act="open-paste">手机上：粘贴到输入框</button></div></div></li>`;
  return `<div class="onboard enter">
    <p class="lbl">新地图</p>
    <h1 class="q">把一份资料，画成一张问题地图</h1>
    <p class="lead">${claude ? 'Claude' : 'Gemini'} 负责读资料、画初稿、回答追问；这里负责一层层地读、记下你的理解，最后保存成你自己的知识资产。</p>
    <ol class="steps3">${step1}${step2}</ol>
    <div class="side-opts">
      ${claude ? '' : `<div class="opt"><b>对照原文</b><span class="muted">可选</span><p>把同一份 PDF 也放进画板：讲解里的页码能点开原文，还能框选图表请 Gemini 讲。</p><div class="row"><button class="btn-text" data-act="attach-pdf">选择 PDF</button>${pdf}</div></div>`}
      <div class="opt"><b>已有地图文件</b><p>打开以前保存的 .md 或 .html，接着画。</p><div class="row"><button class="btn-text" data-act="import">打开文件</button></div></div>
    </div></div>`;
}

/* ======================= 等待提示 ======================= */
function renderWait() {
  const p = $('#waitPill');
  if (ui.busy) { p.hidden = false; p.classList.add('busy'); p.querySelector('.wl').textContent = 'Claude 正在画'; return; }
  p.classList.remove('busy');
  if (ui.wait && ui.wait.mapId === S.activeId) { p.hidden = false; p.querySelector('.wl').textContent = ui.wait.chat ? '回答里有地图块就粘贴回来' : '等 Gemini 的回答 · Ctrl+V'; }
  else p.hidden = true;
}

/* ======================= 划词 + 术语卡 ======================= */
const sel = { text: '', rect: null, around: '' };
function selectionInfo() {
  const s = getSelection(); if (!s || s.isCollapsed || !s.rangeCount) return null;
  const text = s.toString().replace(/\s+/g, ' ').trim(); if (!text || text.length > 400) return null;
  const node = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement);
  const host = node && node.closest('#reading .prose, #reading .guess-card, .v-result .prose');
  if (!host) return null;
  const r = s.getRangeAt(0).getBoundingClientRect(); if (!r.width && !r.height) return null;
  const full = host.textContent.replace(/\s+/g, ' '); const at = full.indexOf(text);
  return { text, rect: { left: r.left, top: r.top, bottom: r.bottom, width: r.width }, around: at >= 0 ? full.slice(Math.max(0, at - 60), at + text.length + 60) : '' };
}
function showSelbar() {
  const info = selectionInfo(); const bar = $('#selbar');
  if (!info) { bar.classList.remove('show'); return; }
  Object.assign(sel, info);
  bar.querySelector('[data-act="sel-explain"]').hidden = info.text.length > 40;
  bar.classList.add('show');
  const bw = bar.offsetWidth || 220;
  bar.style.left = Math.min(innerWidth - bw - 10, Math.max(10, info.rect.left + info.rect.width / 2 - bw / 2)) + 'px';
  bar.style.top = Math.max(62, info.rect.top - 48) + 'px';
}
let selT = 0;
document.addEventListener('mouseup', e => { if (e.target.closest('#selbar,.card')) return; clearTimeout(selT); selT = setTimeout(showSelbar, 10); });
document.addEventListener('keyup', e => { if (e.shiftKey || e.key === 'Shift') { clearTimeout(selT); selT = setTimeout(showSelbar, 10); } });
document.addEventListener('selectionchange', () => { clearTimeout(selT); selT = setTimeout(() => { if (!getSelection().toString().trim()) $('#selbar').classList.remove('show'); else if (matchMedia('(pointer:coarse)').matches) showSelbar(); }, 250); });
function hideSelbar() { $('#selbar').classList.remove('show'); getSelection()?.removeAllRanges(); }

const card = { key: null, rect: null, around: '', hideT: 0, showT: 0 };
function placeCard(rect) {
  const c = $('#card'); const cw = Math.min(320, innerWidth - 24);
  c.style.left = Math.min(Math.max(12, rect.left + (rect.width || 0) / 2 - cw / 2), innerWidth - cw - 12) + 'px';
  c.classList.add('show');
  const ch = c.offsetHeight;
  c.style.top = Math.max(64, rect.bottom + 10 + ch < innerHeight ? rect.bottom + 10 : rect.top - ch - 10) + 'px';
}
function showGlance(key, rect, around, el) {
  const m = mp(); if (!m) return;
  card.key = key; card.rect = rect; card.around = around || '';
  $$('.term.open').forEach(x => x.classList.remove('open')); if (el) el.classList.add('open');
  const info = m.terms[key];
  let body;
  if (info && info.plain) body = `<p>${esc(info.plain)}</p>${info.example ? `<p class="ex">比如：${esc(info.example)}</p>` : ''}`;
  else if (busyFor('term') && ui.busy.key === key) body = `<p class="muted">${dots} Claude 正在查</p>`;
  else if (waitingFor('term') && ui.wait.key === key) body = `<p class="muted"><span class="waiting"><span class="pulse"></span>等你把 Gemini 的回答粘贴回来</span></p>`;
  else body = `<p class="muted">术语表里还没有。</p><div class="row"><button class="btn-secondary" data-act="glance-ask">请 ${eng()} 解释</button></div>`;
  $('#card').innerHTML = `<h4>${esc(short(key, 40))}</h4>${body}
    <div class="row"><button class="btn-text" data-act="glance-chat">去聊聊</button><button class="btn-text" data-act="glance-node">记成问题</button><span class="spacer"></span>${info ? `<button class="btn-text" data-act="term-learned">${info.learned ? '还没懂' : '我懂了'}</button>` : ''}</div>`;
  placeCard(rect);
}
function hideCards() { $('#card').classList.remove('show'); $('#selbar').classList.remove('show'); $$('.term.open').forEach(x => x.classList.remove('open')); card.key = null; }
document.addEventListener('mouseover', e => {
  const t = e.target.closest('.term'); const c = e.target.closest('#card');
  if (t) { clearTimeout(card.hideT); clearTimeout(card.showT); card.showT = setTimeout(() => { const r = t.getBoundingClientRect(); showGlance(unesc(t.dataset.term), { left: r.left, top: r.top, bottom: r.bottom, width: r.width }, (t.closest('.prose') || t).textContent.slice(0, 200), t); }, 140); }
  else if (c) clearTimeout(card.hideT);
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('.term') || e.target.closest('#card')) { clearTimeout(card.showT); card.hideT = setTimeout(() => { if (!$('#card').matches(':hover') && !waitingFor('term')) hideCards(); }, 280); }
});
document.addEventListener('focusin', e => { const t = e.target.closest('.term'); if (t) { const r = t.getBoundingClientRect(); showGlance(unesc(t.dataset.term), { left: r.left, top: r.top, bottom: r.bottom, width: r.width }, '', t); } });

/* ======================= 地图 ======================= */
function layout(m) {
  const ch = id => kids(m, id);
  const leaves = {}; const cnt = (id, g = 0) => (leaves[id] = g > 40 ? 1 : (ch(id).reduce((a, k) => a + cnt(k.id, g + 1), 0) || 1));
  cnt(m.rootId);
  const pos = {}; let maxD = 1;
  const place = (id, a0, a1, d) => { pos[id] = { a: (a0 + a1) / 2, d }; maxD = Math.max(maxD, d); let c = a0; for (const k of ch(id)) { if (pos[k.id]) continue; const span = (a1 - a0) * leaves[k.id] / leaves[id]; place(k.id, c, c + span, d + 1); c += span; } };
  place(m.rootId, -Math.PI / 2, Math.PI * 1.5, 0);
  const step = Math.max(210, (175 * leaves[m.rootId] / (2 * Math.PI)) / maxD);
  for (const id in pos) { const p = pos[id]; p.r = p.d * step; p.x = p.r * Math.cos(p.a); p.y = p.r * Math.sin(p.a); }
  return pos;
}
function renderMap(center) {
  const m = mp();
  const empty = !m || !m.rootId; $('#mapEmpty').hidden = !empty;
  if (empty) { $('#edges').innerHTML = ''; $('#mnodes').innerHTML = ''; $('#mapCount').textContent = ''; return; }
  const pos = layout(m); const seen = new Set(m.mapSeen || []);
  const curId = m.currentId; const path = new Set([curId, ...ancestors(m, curId).map(a => a.id)]);
  let edges = '', rels = '', nodes = '', bi = 0; const cnt = { done: 0, seen: 0, unread: 0, fog: 0 };
  const order = dfs(m).map(n => n.id).filter(id => pos[id]);
  const relDone = new Set();
  for (const id of order) {
    const n = m.nodes[id], p = pos[id];
    if (n.parent && pos[n.parent]) {
      const a = pos[n.parent]; const mid = (a.r + p.r) / 2;
      const d = a.r === 0 ? `M${a.x},${a.y} L${p.x},${p.y}` : `M${a.x},${a.y} Q${(mid * Math.cos(a.a) + mid * Math.cos(p.a)) / 2},${(mid * Math.sin(a.a) + mid * Math.sin(p.a)) / 2} ${p.x},${p.y}`;
      edges += `<path d="${d}" class="${glyphOf(n) === 'fog' ? 'to-fog' : ''} ${path.has(id) ? 'hot' : ''}"/>`;
    }
    for (const r of n.rel || []) { const b = pos[r]; const k = [id, r].sort().join('-'); if (b && !relDone.has(k)) { relDone.add(k); rels += `<path class="rel" d="M${p.x},${p.y} L${b.x},${b.y}"/>`; } }
    const g = glyphOf(n); cnt[g]++;
    const born = ui.bloom || (!seen.has(id) && seen.size > 0);
    nodes += `<button class="mnode ${g} ${id === m.rootId ? 'root' : ''} ${id === curId ? 'cur' : ''} ${born ? 'born' : ''}" style="left:${p.x.toFixed(1)}px;top:${p.y.toFixed(1)}px;--d:${born ? Math.min(bi++ * 55, 1800) : 0}ms" data-go="${id}" title="${esc(n.q)}"><span class="dot"></span><span class="ml">${esc(n.mine || n.q)}</span></button>`;
  }
  $('#edges').innerHTML = rels + edges; $('#mnodes').innerHTML = nodes;
  $('#edges').classList.toggle('bloom', ui.bloom);
  $('#mapCount').textContent = `${order.length} 个问题 · 说清了 ${cnt.done} · 迷雾 ${cnt.fog}`;
  if (order.some(id => !seen.has(id))) { m.mapSeen = order; save(false); }
  if (center) {
    const W = innerWidth, H = innerHeight;
    const xs = Object.values(pos).map(p => p.x), ys = Object.values(pos).map(p => p.y);
    const bw = Math.max(...xs) - Math.min(...xs) + 260, bh = Math.max(...ys) - Math.min(...ys) + 200;
    let k = Math.min(1, W / bw, (H - 120) / bh); let tx, ty;
    const c = pos[curId] || pos[m.rootId];
    if (k >= 0.6 || ui.bloom) { k = Math.max(k, 0.35); const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2; tx = W / 2 - cx * k; ty = H / 2 + 10 - cy * k; }
    else { k = 0.85; tx = W / 2 - c.x * k; ty = H / 2 - c.y * k; }
    if (ui.bloom) { camSet(tx, ty, k * 0.92); camTo(tx, ty, k); }
    else { const k0 = Math.min(2.2, k * 1.9); camSet(W / 2 - c.x * k0, H / 2 - c.y * k0, k0); camTo(tx, ty, k); }
  }
  ui.bloom = false;
}

/* ======================= 原文 + 框选 ======================= */
async function getPdfBytes(m) {
  if (!m) return null;
  let b = await IDB.get('pdf:' + m.id); if (b) return b;
  if (!m.pdfUrl) return null;
  try { const r = await fetch(m.pdfUrl); if (!r.ok) return null; b = await r.arrayBuffer(); IDB.put('pdf:' + m.id, b); return b; } catch (e) { return null; }
}
async function openViewer(page) {
  const m = mp(); if (!m) return;
  document.body.classList.add('viewer-open'); $('#viewerBtn').classList.add('on');
  if (V.mapId !== m.id || !$('#vScroll').children.length || !V.pdf) await loadViewer(m);
  if (page) scrollToPage(page);
}
function closeViewer() { document.body.classList.remove('viewer-open'); $('#viewerBtn').classList.remove('on'); setCrop(false); $('#vResult').classList.remove('show'); }
async function loadViewer(m) {
  V.mapId = m.id; V.pdf = null; V.rendered = new Set(); V.obs && V.obs.disconnect();
  $('#vTitle').textContent = m.pdfName || m.source || '原文'; $('#vPage').textContent = '';
  const box = $('#vScroll'); box.innerHTML = `<div class="v-empty">${dots}<span>正在打开原文</span></div>`;
  $('#vCrop').hidden = true;
  const bytes = await getPdfBytes(m);
  if (bytes) {
    try {
      await ensurePdfJs();
      V.pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)), isEvalSupported: false }).promise;
      V.total = V.pdf.numPages;
      const p1 = await V.pdf.getPage(1); const vp = p1.getViewport({ scale: 1 });
      const w = pageWidth(); const h = w * vp.height / vp.width;
      box.innerHTML = Array.from({ length: V.total }, (_, i) => `<div class="v-page-box" data-p="${i + 1}" style="width:${w}px;height:${h}px"><span class="pn">${i + 1}</span></div>`).join('');
      V.obs = new IntersectionObserver(ents => { for (const en of ents) if (en.isIntersecting) renderPage(+en.target.dataset.p); updatePageLabel(); }, { root: box, rootMargin: '600px 0px' });
      $$('.v-page-box', box).forEach(el => V.obs.observe(el));
      $('#vCrop').hidden = false;
      return;
    } catch (e) { V.pdf = null; }
  }
  box.innerHTML = `<div class="v-empty drop" id="vDrop"><b>把资料 PDF 放进来</b><span>和发给 Gemini 的是同一份。之后讲解里的页码都能点开，还能框选图表请 ${eng()} 讲。</span><button class="btn-primary" data-act="attach-pdf">选择 PDF</button><span class="hint">也可以直接拖进来。文件只存在这台电脑的浏览器里。</span></div>`;
  bindDrop($('#vDrop'));
}
async function attachPdf(file) {
  const m = mp() || (() => { const x = newMap(); S.maps[x.id] = x; S.activeId = x.id; return x; })();
  const bytes = await file.arrayBuffer();
  await IDB.put('pdf:' + m.id, bytes);
  m.pdfName = file.name; m.pdfUrl = null; delete ui.srcText[m.id]; V.mapId = null;
  save(); toast('已放入原文：' + short(file.name, 24));
  renderRead(true);
  if (!m.rootId) renderRead();
  if (document.body.classList.contains('viewer-open')) openViewer();
}
async function figureFromCrop(p, rr) {
  const m = mp(); const n = cur(); if (!n) { toast('先打开一个问题，再框选'); return; }
  const big = await cropBlob(p, rr, 'image/png');
  const thumb = await cropBlob(p, rr, 'image/jpeg', 560);
  const fid = nextId(m);
  m.pendingFigs[fid] = { page: p, thumb: thumb.url }; save();
  V.figure = { fid, page: p, blob: big.blob, thumb: thumb.url, parent: n.id };
  renderFigure();
}
function renderFigure() {
  const f = V.figure; const el = $('#vResult');
  if (!f) { el.classList.remove('show'); return; }
  const m = mp(); const n = m.nodes[f.parent];
  const body = useClaude()
    ? `<p class="hint" style="margin:0">Claude 会读这块图，在「${esc(short(n ? n.q : '', 18))}」下新建问题 ${f.fid}。</p><div class="row">${busyFor('figure') ? `<span class="thinking-s">${dots}Claude 正在看</span>` : '<button class="btn-primary" data-act="fig-claude">请 Claude 讲讲</button>'}</div>`
    : `<ol class="steps"><li>复制图片，粘贴到 Gemini 的输入框。</li><li>复制请求，粘贴到同一条消息里，发送。</li><li>把回答复制回来，按 Ctrl+V。它会成为「${esc(short(n ? n.q : '', 16))}」下的新问题 ${f.fid}，这张图是封面。</li></ol>
       <div class="row"><button class="btn-secondary" data-act="fig-copy-img">① 复制图片</button><button class="btn-secondary" data-act="fig-copy-q">② 复制请求</button>${waitingFor('figure') ? '<span class="waiting"><span class="pulse"></span>等回答</span>' : ''}</div>`;
  el.innerHTML = `<div class="row"><span class="lbl">第 ${f.page} 页 · 框选的这一块</span><span class="spacer"></span><button class="btn-text" data-act="fig-close">关闭</button></div><img src="${f.thumb}" alt="框选的区域">${body}`;
  el.classList.add('show');
}

/* ======================= 导出：知识资产 ======================= */
const fileBase = m => (m.title || '问题地图').replace(/[\\/:*?"<>|\n]/g, ' ').trim().slice(0, 60) || '问题地图';
const escScript = t => String(t).replace(/<\//g, '<\\/');
async function saveFile(name, data, mime) {
  if (ui.downloads) {
    try { await ui.downloads.save({ filename: name, data }); toast('已保存：' + name); return true; }
    catch (e) { if (e && e.code === 'declined') return false; if (!(e && /unavailable|not_granted|capability/.test(e.code || ''))) { toast('没能保存：' + ((e && e.message) || '换个格式试试')); return false; } }
  }
  if (ui.inArtifact) { toast('这个页面里不能直接下载。可以先「复制地图文件」，或在设置里打开下载。'); return false; }
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime + ';charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
  toast('已下载：' + name); return true;
}
function bytesToB64(bytes) { return new Promise(res => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.readAsDataURL(new Blob([bytes])); }); }
async function exportHTML(m, withPdf) {
  if (ui.canvas || !/qmap-embed/.test(PRISTINE)) {
    let eng = '';
    try { if (ui.engineSrc) { const r = await fetch(ui.engineSrc); if (r.ok) eng = await r.text(); } } catch (e) {}
    const SC = '<' + '/script>';
    const html = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(m.title || '问题地图') + '</title></head>\n<body>\n'
      + '<script type="text/markdown" id="qmap">\n' + escScript(serialize(m, { images: true })) + SC + '\n'
      + (eng ? '<script>' + eng.replace(/<\/script/gi, '<\\/script') + SC : '<script src="' + esc(ui.engineSrc) + '">' + SC) + '\n</body>\n</html>\n';
    return saveFile(fileBase(m) + '.html', html, 'text/html');
  }
  const doc = new DOMParser().parseFromString(PRISTINE, 'text/html');
  doc.querySelectorAll('script:not([data-qmap])').forEach(s => s.remove());
  const emb = doc.getElementById('qmap-embed');
  emb.textContent = escScript(serialize(m, { images: true }));
  emb.setAttribute('data-id', m.id); emb.setAttribute('data-updated', String(m.updatedAt || Date.now()));
  emb.removeAttribute('data-example'); emb.removeAttribute('data-pdf');
  const pe = doc.getElementById('qmap-pdf'); pe.textContent = ''; pe.removeAttribute('data-name');
  if (withPdf) { const b = await getPdfBytes(m); if (b) { pe.textContent = await bytesToB64(b); pe.setAttribute('data-name', m.pdfName || 'source.pdf'); } }
  doc.title = (m.title || '问题地图') + ' · 问题地图';
  return saveFile(fileBase(m) + '.html', '<!DOCTYPE html>\n' + doc.documentElement.outerHTML, 'text/html');
}
function printHTML(m) {
  const pos = layout(m); const ids = Object.keys(pos);
  const xs = ids.map(i => pos[i].x), ys = ids.map(i => pos[i].y);
  const x0 = Math.min(...xs) - 110, y0 = Math.min(...ys) - 40, w = Math.max(...xs) - x0 + 110, h = Math.max(...ys) - y0 + 50;
  let svg = ''; const fs = Math.max(12, Math.round(w / 52));
  for (const id of ids) { const n = m.nodes[id], p = pos[id]; if (n.parent && pos[n.parent]) { const a = pos[n.parent]; svg += `<line x1="${a.x}" y1="${a.y}" x2="${p.x}" y2="${p.y}" class="c-line"/>`; } }
  for (const id of ids) { const n = m.nodes[id], p = pos[id]; const g = glyphOf(n); svg += `<circle cx="${p.x}" cy="${p.y}" r="${(id === m.rootId ? 7 : 5) * fs / 12}" class="${g === 'done' ? 'pm-done' : g === 'fog' ? 'pm-fog' : 'pm-dot'}"/><text x="${p.x}" y="${p.y + fs + 8}" text-anchor="middle" class="pm-t" style="font-size:${fs}px">${esc(short(n.mine || n.q, id === m.rootId ? 22 : 14))}</text>`; }
  const num = {}; const walk = (id, pre) => kids(m, id).forEach((k, i) => { num[k.id] = pre ? pre + '.' + (i + 1) : String(i + 1); walk(k.id, num[k.id]); });
  if (m.rootId) { num[m.rootId] = ''; walk(m.rootId, ''); }
  const all = dfs(m); const done = all.filter(n => n.mine).length;
  const d = new Date(); const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const arts = all.map(n => {
    const secs = orderedSecs(n).map(s => `<h3>${esc(s.label)}</h3><div class="prose">${md(s.md, m)}</div>`).join('');
    const gn = secBy(n, GUESS_NOTE), mn = secBy(n, MINE_NOTE);
    return `<article class="p-node lv${Math.min(n._d || 0, 3)}"><div class="p-num">${num[n.id] ? esc(num[n.id]) : '根问题'}</div><h2>${esc(n.q)}</h2>
      ${n.mine ? `<div class="p-mine"><span>我的一句话</span><p>${esc(n.mine)}</p>${mn ? `<div class="prose">${md(mn.md, m)}</div>` : ''}</div>` : ''}
      ${n.fig && n.fig.thumb ? `<figure class="p-fig"><img src="${n.fig.thumb}" alt=""><figcaption>原文${n.fig.page ? '第 ' + n.fig.page + ' 页' : ''}</figcaption></figure>` : ''}
      ${n.guess ? `<div class="p-guess"><span>我的猜测</span><p>${esc(n.guess)}</p>${gn ? `<div class="prose">${md(gn.md, m)}</div>` : ''}</div>` : ''}
      ${secs || '<p class="p-fogn">（还在迷雾里，没有展开）</p>'}
      ${(n.pages || []).length ? `<p class="p-ref">依据：原文第 ${n.pages.join('、')} 页</p>` : n.where ? `<p class="p-ref">依据：${esc(n.where)}</p>` : ''}</article>`;
  }).join('');
  const toc = all.map(n => `<li class="lv${Math.min(n._d || 0, 3)}"><span class="n">${esc(num[n.id] || '')}</span>${esc(n.mine || n.q)}</li>`).join('');
  const terms = Object.entries(m.terms).filter(([, v]) => v.plain).sort((a, b) => a[0].localeCompare(b[0], 'zh'));
  return `<div class="pdoc">
    <header class="p-head"><p class="lbl">问题地图</p><h1>${esc(m.title || '未命名')}</h1><p class="p-meta">${m.source ? '资料：' + esc(m.source) + ' · ' : ''}${all.length} 个问题 · 说清了 ${done} 个 · ${date}</p></header>
    <section class="p-map fig"><svg viewBox="${x0} ${y0} ${w} ${h}">${svg}</svg></section>
    <section class="p-toc"><h2>目录</h2><ol>${toc}</ol></section>
    ${arts}
    ${terms.length ? `<section class="p-terms"><h2>术语</h2><dl>${terms.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v.plain)}${v.example ? `<span>比如：${esc(v.example)}</span>` : ''}</dd>`).join('')}</dl></section>` : ''}
  </div>`;
}
function exportPrintPage(m) {
  const css = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
  const html = `<!DOCTYPE html><html lang="zh-CN" data-theme="light"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(m.title || '问题地图')} · 阅读版</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600&family=Noto+Serif+SC:wght@600&display=swap">
<style>${css}</style><style>html,body{height:auto!important;overflow:auto!important}body{background:#fff}#print{display:block!important}.ptool{position:fixed;top:14px;right:14px;z-index:5}@media print{.ptool{display:none}}</style></head>
<body><div class="ptool"><button class="btn-primary" onclick="window.print()">存为 PDF / 打印</button></div><div id="print">${printHTML(m)}</div></body></html>`;
  return saveFile(fileBase(m) + '（阅读版）.html', html, 'text/html');
}
function doPrint(m) {
  if (ui.inArtifact) { exportPrintPage(m); return; }
  $('#print').innerHTML = printHTML(m);
  setTimeout(() => { try { window.print(); } catch (e) { exportPrintPage(m); } }, 80);
}

/* ======================= 文件：导入 ======================= */
async function importFile(file) {
  const name = file.name || '';
  if (/\.pdf$/i.test(name) || file.type === 'application/pdf') { attachPdf(file); return; }
  const text = await file.text();
  let mdText = text, pdfB64 = '', pdfName = '', id = null;
  if (/\.html?$/i.test(name) || /^\s*<!DOCTYPE/i.test(text)) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const e = doc.getElementById('qmap-embed') || doc.getElementById('qmap'); if (!e || !e.textContent.trim() || /^\/\*@@/.test(e.textContent.trim())) { toast('这个网页里没有地图'); return; }
    mdText = e.textContent.replace(/<\\\//g, '</'); id = e.getAttribute('data-id');
    const p = doc.getElementById('qmap-pdf'); if (p && p.textContent.trim()) { pdfB64 = p.textContent.trim(); pdfName = p.getAttribute('data-name') || 'source.pdf'; }
  }
  const P = parseMap(mdText);
  if (!P.nodes.length) { toast('文件里没读到地图'); return; }
  const m = newMap(); if (id && !S.maps[id]) m.id = id;
  merge(m, P, { import: true }); ui.fresh = {};
  if (pdfB64) { try { await IDB.put('pdf:' + m.id, b64ToBytes(pdfB64)); m.pdfName = pdfName; } catch (e) {} }
  S.maps[m.id] = m; S.activeId = m.id; m.currentId = m.rootId; save();
  closeSheet(); renderAll(); toast('已打开：' + (m.title || name));
}
function b64ToBytes(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
function bindDrop(el) {
  if (!el) return;
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) importFile(f); });
}
document.addEventListener('dragover', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) e.preventDefault(); });
document.addEventListener('drop', e => { if (e.defaultPrevented) return; const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) { e.preventDefault(); importFile(f); } });
function pickFile(accept) { const fi = $('#fileIn'); fi.accept = accept; fi.value = ''; fi.click(); }
$('#fileIn').addEventListener('change', e => { const f = e.target.files[0]; if (f) importFile(f); });

/* ======================= 面板 ======================= */
function openSheet(kind) { ui.sheet = kind; renderSheet(); $('#sheet').classList.add('show'); $('#scrim').classList.add('show'); hideCards(); }
function closeSheet() { ui.sheet = null; $('#sheet').classList.remove('show'); $('#scrim').classList.remove('show'); }
const closeBtn = `<button class="icon-btn" data-act="close-sheet" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>`;
const ago = t => { const s = (Date.now() - t) / 1000; return s < 90 ? '刚刚' : s < 3600 ? Math.round(s / 60) + ' 分钟前' : s < 86400 ? Math.round(s / 3600) + ' 小时前' : Math.round(s / 86400) + ' 天前'; };
function renderSheet() {
  const sh = $('#sheet'); const m = mp(); const k = ui.sheet;
  if (k === 'maps') {
    const list = Object.values(S.maps).sort((a, b) => b.updatedAt - a.updatedAt).map(x => {
      const ns = Object.values(x.nodes); const done = ns.filter(n => n.mine).length;
      return `<li><button class="list-item btn" data-act="pick-map" data-id="${x.id}"><span class="main"><span class="t">${esc(x.title || '新地图（空白）')}</span><span class="m">${ns.length} 个问题 · 说清了 ${done} 个 · ${ago(x.updatedAt)}${x.example ? ' · 示例' : ''}</span></span>${x.id === S.activeId ? '<span class="check">●</span>' : ''}</button></li>`;
    }).join('');
    sh.innerHTML = `<div class="sheet-head"><h2>我的地图</h2>${closeBtn}</div><div class="sheet-body">
      <div class="row"><button class="btn-primary" data-act="new-map">画一张新地图</button><button class="btn-text" data-act="import">打开地图文件</button></div>
      <ul class="list">${list}</ul>
      <p class="sheet-sub">地图存在这台电脑的浏览器里。想长期保存、换设备或分享，请用顶栏的「保存」导出。</p></div>`;
  } else if (k === 'save') {
    if (!m || !m.rootId) { sh.innerHTML = `<div class="sheet-head"><h2>保存</h2>${closeBtn}</div><div class="sheet-body"><p class="sheet-sub">地图还是空白的，先画出初稿吧。</p></div>`; return; }
    const ns = Object.values(m.nodes).length;
    sh.innerHTML = `<div class="sheet-head"><h2>保存成知识资产</h2>${closeBtn}</div><div class="sheet-body">
      <p class="sheet-sub">「${esc(m.title)}」· ${ns} 个问题 · 第 ${m.rev} 稿</p>
      <div class="exp">
        <button class="exp-item" data-act="exp-html"><b>交互网页 .html</b><span>和现在一样能点、能展开、能接着画。离线也能打开，发给别人也能看。</span></button>
        <label class="check-row" style="margin:-4px 0 4px 14px"><input type="checkbox" id="withPdf" ${m.pdfName || m.pdfUrl ? 'checked' : 'disabled'}>把原文 PDF 一起装进去${m.pdfName || m.pdfUrl ? '' : '（还没放入原文）'}</label>
        <button class="exp-item" data-act="exp-pdf"><b>PDF 阅读版</b><span>全部展开、带目录和总览图，适合打印和存档。${ui.inArtifact ? '会先下载一个阅读版网页，打开后点「存为 PDF」。' : ''}</span></button>
        <button class="exp-item" data-act="exp-md"><b>地图文件 .md</b><span>纯文本，任何笔记软件都能打开（Obsidian、Typora）。也能交给 Gemini 接着画。</span></button>
      </div>
      <div class="menu-sec"><h3>换一个新的 Gemini 对话接着画</h3>
        <p class="sheet-sub">对话太长、或者过几天再继续时用：复制整张地图，在新对话里（先选 question-map）粘贴发送。</p>
        <div class="row"><button class="btn-secondary" data-act="copy-resume">复制整张地图给 Gemini</button><button class="btn-text" data-act="copy-md">只复制地图文件</button></div></div></div>`;
  } else if (k === 'more') {
    const canClaude = !!ui.sample;
    sh.innerHTML = `<div class="sheet-head"><h2>设置</h2>${closeBtn}</div><div class="sheet-body">
      ${m ? `<div class="field"><label class="lbl" for="titleIn">地图名称</label><input id="titleIn" value="${esc(m.title)}" placeholder="新地图"></div>` : ''}
      <div class="menu-sec"><h3>谁来画</h3>
        <div class="seg"><button class="${!useClaude() ? 'on' : ''}" data-act="engine" data-v="gemini">Gemini（复制粘贴）</button>${canClaude ? `<button class="${useClaude() ? 'on' : ''}" data-act="engine" data-v="claude">Claude（直接画）</button>` : ''}</div>
        <p class="sheet-sub">${canClaude ? '在 claude.ai 里打开时，也可以让 Claude 直接画，不用复制粘贴（会用掉你的 Claude 额度）。两者用同一种地图文件，可以随时切换。' : '地图文件是纯文本，Gemini、ChatGPT、Claude 都能画。'}</p></div>
      <div class="menu-sec"><h3>Gemini 的 skill</h3>
        <label class="check-row"><input type="checkbox" data-act="skill-toggle" ${S.prefs.skill ? 'checked' : ''}>已经在 Gemini 里装好 question-map。不勾选时，开场白会附上完整规则。</label>
        <div class="row"><button class="btn-secondary" data-act="dl-skill">下载 skill</button><button class="btn-text" data-act="copy-skill">复制 skill 全文</button><a class="btn-text" href="${GEMINI_URL}" target="_blank" rel="noopener">打开 Gemini ↗</a></div>
        <ol class="steps"><li>打开 Gemini 网页版，进入「设置 › 技能」（Skills）。</li><li>选择「上传」，选下载好的 SKILL.md。</li><li>以后在对话框输入 <code>/</code>，选 question-map。</li></ol></div>
      ${m ? `<div class="menu-sec"><h3>原文</h3><p class="sheet-sub">${m.pdfName ? '已放入：' + esc(m.pdfName) : m.pdfUrl ? '示例讲义已内置。' : '还没放入原文 PDF。'}</p><div class="row"><button class="btn-secondary" data-act="attach-pdf">${m.pdfName ? '换一份' : '选择 PDF'}</button></div></div>` : ''}
      <div class="menu-sec"><h3>粘贴</h3><p class="sheet-sub">手机上或 Ctrl+V 没反应时，可以把回答粘贴到输入框里。</p><div class="row"><button class="btn-secondary" data-act="open-paste">粘贴到输入框</button></div></div>
      ${m ? `<div class="menu-links"><button class="danger" data-act="del-map">删除这张地图</button></div>` : ''}</div>`;
    $('#titleIn')?.addEventListener('change', e => { m.title = e.target.value.trim(); save(); renderRead(true); $('#mapTitle').textContent = m.title || '新地图'; });
  } else if (k === 'paste') {
    sh.innerHTML = `<div class="sheet-head"><h2>粘贴回答</h2>${closeBtn}</div><div class="sheet-body">
      <p class="sheet-sub">把 Gemini 的整段回答粘贴在下面。只有【地图开始】和【地图结束】之间的内容会进地图。</p>
      <textarea id="pasteBox" class="paste-box" rows="10" placeholder="长按或 Ctrl+V 粘贴"></textarea>
      <div class="row"><span class="spacer"></span><button class="btn-primary" data-act="paste-merge">放进地图</button></div></div>`;
    setTimeout(() => $('#pasteBox')?.focus(), 300);
  } else if (k === 'copy') {
    sh.innerHTML = `<div class="sheet-head"><h2>手动复制</h2>${closeBtn}</div><div class="sheet-body">
      <p class="sheet-sub">浏览器没让自动复制。请全选下面的文字，复制后发给 Gemini。</p>
      <textarea id="copyBox" class="prompt-preview" readonly>${esc(ui.copyFallback || '')}</textarea></div>`;
    setTimeout(() => { const t = $('#copyBox'); if (t) { t.focus(); t.select(); } }, 300);
  } else if (k === 'confirm-del') {
    sh.innerHTML = `<div class="sheet-head"><h2>删除这张地图？</h2>${closeBtn}</div><div class="sheet-body">
      <p class="sheet-sub">「${esc(m.title || '新地图')}」会从这台电脑上删掉，不能恢复。导出过的文件不受影响。</p>
      <div class="row"><button class="btn-text" data-act="close-sheet">算了</button><span class="spacer"></span><button class="btn-primary danger-bg" data-act="del-map-yes">删除</button></div></div>`;
  }
}

/* ======================= 事件 ======================= */
document.addEventListener('click', async e => {
  const g = e.target.closest('[data-go]');
  if (g && !e.target.closest('#map')) { const lab = g.querySelector('.t'); go(g.dataset.go, lab); $('#mcard').classList.remove('show'); return; }
  const b = e.target.closest('[data-act]'); if (!b) { if (!e.target.closest('#card, #selbar, .term')) hideCards(); return; }
  const act = b.dataset.act; const m = mp(); const n = cur();
  switch (act) {
    case 'toggle-map': setView(ui.view === 'map' ? 'read' : 'map'); break;
    case 'toggle-viewer': document.body.classList.contains('viewer-open') ? closeViewer() : openViewer(); break;
    case 'close-viewer': closeViewer(); break;
    case 'open-page': openViewer(+b.dataset.page || null); break;
    case 'v-zoom': V.zoom = Math.max(0.6, Math.min(2.4, V.zoom * +b.dataset.f)); if (m) { V.mapId = null; openViewer(); } break;
    case 'v-crop': setCrop(!V.crop); break;
    case 'open-maps': openSheet('maps'); break;
    case 'open-save': openSheet('save'); break;
    case 'open-more': openSheet('more'); break;
    case 'open-paste': openSheet('paste'); break;
    case 'close-sheet': closeSheet(); break;
    case 'new-map': {
      const blank = Object.values(S.maps).find(x => !x.rootId);
      const x = blank || newMap(); S.maps[x.id] = x; S.activeId = x.id; save(); closeSheet(); if (ui.view === 'map') setView('read'); renderAll(); break;
    }
    case 'pick-map': S.activeId = b.dataset.id; save(false); closeSheet(); closeViewer(); V.mapId = null; ui.wait = null; renderAll(); break;
    case 'import': pickFile('.md,.markdown,.txt,.html,.htm,text/markdown,text/plain,text/html'); break;
    case 'attach-pdf': pickFile('.pdf,application/pdf'); break;
    case 'del-map': openSheet('confirm-del'); break;
    case 'del-map-yes': {
      if (!m) break; if (m.example) S.dismissed.push(m.id);
      delete S.maps[m.id]; IDB.del('pdf:' + m.id);
      const rest = Object.values(S.maps).sort((a, c) => c.updatedAt - a.updatedAt);
      S.activeId = rest[0] ? rest[0].id : null;
      if (!S.activeId) { const x = newMap(); S.maps[x.id] = x; S.activeId = x.id; }
      save(false); closeSheet(); renderAll(); toast('已删除'); break;
    }
    case 'engine': S.prefs.engine = b.dataset.v; save(false); renderSheet(); renderAll(); break;
    case 'skill-toggle': S.prefs.skill = b.checked; save(false); break;
    case 'dl-skill': saveFile('SKILL.md', SKILL_MD() + '\n', 'text/markdown'); break;
    case 'copy-skill': if (await copyText(SKILL_MD())) toast('已复制 skill 全文'); break;
    case 'kickoff': {
      let x = m; if (!x) { x = newMap(); S.maps[x.id] = x; S.activeId = x.id; }
      const gi = $('#goalIn'); if (gi) x.goal = gi.value.trim(); save();
      await ask(REQ.kickoff(x), { type: 'kickoff' }); renderRead(); break;
    }
    case 'paste-merge': { const t = $('#pasteBox').value; if (absorb(t)) closeSheet(); break; }
    case 'mcard-close': $('#mcard').classList.remove('show'); break;
    case 'mcard-map': $('#mcard').classList.remove('show'); setView('map'); break;
    // 阅读
    case 'guess-submit': case 'guess-skip': {
      if (act === 'guess-submit') { const v = ($('#guessInput')?.value || '').trim(); if (!v) { $('#guessInput')?.focus(); toast('写一句你的直觉，或者点「直接看」'); return; } n.guess = v; }
      n.visited = true; const first = orderedSecs(n)[0]; n.shown = first ? [first.label] : []; ui.enter = n.id; save(); renderRead(true); break;
    }
    case 'deeper': { const nx = orderedSecs(n).find(s => !(n.shown || []).includes(s.label)); if (nx) { n.shown = [...(n.shown || []), nx.label]; ui.enter = null; save(false); renderRead(true); const el = $(`#c-main [data-key="s:${CSS.escape(nx.label)}"]`); el && setTimeout(() => el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }), 60); } break; }
    case 'expand': { const g2 = ($('#fogGuess')?.value || '').trim(); if (g2) n.guess = g2; save(); await ask(REQ.expand(m, n, stage(n) === 'fog' ? g2 : ''), { type: 'expand', nodeId: n.id }); break; }
    case 'expand-all': { const fogs = dfs(m).filter(x => !orderedSecs(x).length); await ask(REQ.expandAll(m, fogs), { type: 'expandAll' }); break; }
    case 'ask-guess': await ask(REQ.guess(m, n), { type: 'guess', nodeId: n.id }); break;
    case 'own-save': { const v = ($('#ownInput')?.value || '').trim(); if (!v) return; n.mine = v; ui.editOwn = null; const nt = secBy(n, MINE_NOTE); if (nt) n.secs = n.secs.filter(s => s !== nt); save(); renderRead(true); toast('记下了。地图上这个问题会换成你的话'); break; }
    case 'own-edit': ui.editOwn = n.id; renderOwn(n); $('#ownInput')?.focus(); break;
    case 'ask-mine': await ask(REQ.mine(m, n), { type: 'mine', nodeId: n.id }); break;
    case 'draw': await ask(REQ.draw(m, n, b.dataset.label), { type: 'draw', nodeId: n.id, label: b.dataset.label }); break;
    case 'ask-chat': case 'ask-node': submitAsk(act === 'ask-node' ? 'node' : 'chat'); break;
    case 'q-rewrite': { const shownL = (n.shown || []).filter(l => LADDER.includes(l)); await ask(REQ.rewrite(m, n, shownL.length ? shownL : [LADDER[0]]), { type: 'rewrite', nodeId: n.id }); break; }
    case 'q-more': await ask(REQ.more(m, n), { type: 'more', nodeId: n.id }); break;
    case 'reply-close': delete ui.reply[n.id]; renderAsk(n); break;
    case 'delete-node': { const p = n.parent; removeNode(m, n.id); save(); toast('删掉了。Gemini 那边不受影响'); go(p || m.rootId); break; }
    // 划词
    case 'sel-explain': { hideSelbar(); const r = sel.rect; showGlance(sel.text, r, sel.around); break; }
    case 'sel-chat': hideSelbar(); prefill(`关于这句「${short(sel.text, 80)}」：`, 'chat'); break;
    case 'sel-node': hideSelbar(); prefill(`「${short(sel.text, 80)}」——`, 'node'); break;
    case 'glance-ask': { const key = card.key; await ask(REQ.term(m, n, key, card.around), { type: 'term', key, nodeId: n && n.id }); if (card.rect) showGlance(key, card.rect, card.around); break; }
    case 'glance-chat': { const key = card.key; hideCards(); prefill(`「${key}」`, 'chat'); break; }
    case 'glance-node': { const key = card.key; hideCards(); prefill(`「${key}」是什么？`, 'node'); break; }
    case 'term-learned': { const t = m.terms[card.key]; if (t) { t.learned = !t.learned; save(); termReKey = ''; renderRead(true); hideCards(); } break; }
    // 原文框选
    case 'fig-close': V.figure = null; renderFigure(); break;
    case 'fig-copy-img': {
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': V.figure.blob })]); toast('图片已复制，粘贴到 Gemini'); }
      catch (err) { toast('浏览器不让复制图片：请用截图工具截这一块'); }
      break;
    }
    case 'fig-copy-q': { const f = V.figure; await ask(REQ.figure(m, m.nodes[f.parent] || n, f.fid, f.page), { type: 'figure', nodeId: f.parent }); renderFigure(); break; }
    case 'fig-claude': { const f = V.figure; await runClaude(REQ.figure(m, m.nodes[f.parent] || n, f.fid, f.page), { type: 'figure', nodeId: f.parent, image: f.blob }); if (m.nodes[f.fid]) { V.figure = null; renderFigure(); go(f.fid); } else renderFigure(); break; }
    // 导出
    case 'exp-html': exportHTML(m, $('#withPdf')?.checked); break;
    case 'exp-md': saveFile(fileBase(m) + '.md', serialize(m, {}), 'text/markdown'); break;
    case 'exp-pdf': closeSheet(); doPrint(m); break;
    case 'copy-resume': if (await copyText(REQ.resume(m))) toast('已复制。在新的 Gemini 对话里先选 question-map，再粘贴'); break;
    case 'copy-md': if (await copyText(serialize(m, {}))) toast('已复制地图文件'); break;
  }
});
function submitAsk(intent) {
  const a = $('#askInput'); const text = (a?.value || '').trim(); const m = mp(); const n = cur();
  if (!text) { setIntent(intent); a?.focus(); return; }
  a.value = ''; a.dispatchEvent(new Event('input'));
  if (intent === 'node') ask(REQ.newq(m, n, text), { type: 'newq', nodeId: n.id });
  else ask(REQ.chat(m, n, text), { type: 'chat', nodeId: n.id, chat: true });
  setIntent('chat');
}
document.addEventListener('keydown', e => {
  const t = e.target;
  if (t.id === 'askInput' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submitAsk(e.ctrlKey || e.metaKey ? 'node' : ui.intent); return; }
  if (t.id === 'guessInput' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('[data-act="guess-submit"]').click(); return; }
  if (t.id === 'ownInput' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('[data-act="own-save"]').click(); return; }
  if (e.key === 'Escape') { if (ui.sheet) closeSheet(); else if ($('#card').classList.contains('show') || $('#selbar').classList.contains('show')) hideCards(); else if (V.crop) setCrop(false); else if (document.body.classList.contains('viewer-open')) closeViewer(); else if (ui.view === 'map') setView('read'); return; }
  if (t.closest && t.closest('input, textarea, [contenteditable]')) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'm' || e.key === 'M') { if (mp() && mp().rootId) setView(ui.view === 'map' ? 'read' : 'map'); }
  else if (e.key === 'o' || e.key === 'O') { document.body.classList.contains('viewer-open') ? closeViewer() : openViewer(); }
});
$('#reading').addEventListener('scroll', () => $('#bar').classList.toggle('edge', $('#reading').scrollTop > 8), { passive: true });
document.addEventListener('input', e => { if (e.target.id === 'goalIn' && mp()) { mp().goal = e.target.value; save(false); } });

let toastT = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200); }

/* ======================= 启动 ======================= */
function hashStr(t) { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
function bootCanvas(raw) {
  const P = parseMap(raw);
  if (!P.nodes.length) return null;
  const id = 'cv-' + hashStr(P.title || P.nodes[0].q);
  let m = S.maps[id], sum = null;
  if (m) {
    sum = merge(m, P, { exact: true });
    const keep = new Set(P.nodes.filter(x => !x.del).map(x => x.id));
    for (const nid of Object.keys(m.nodes)) if (!keep.has(nid) && nid !== m.rootId) { removeNode(m, nid); sum.removed.push(nid); }
    for (const x of P.nodes) { const n = m.nodes[x.id]; if (n && x.user.mine && x.user.mine !== n.mine) n.mine = x.user.mine; if (n && x.user.guess && x.user.guess !== n.guess) n.guess = x.user.guess; }
    if (sum.removed.length) sum.empty = false;
  } else { m = newMap({ id }); merge(m, P, { import: true }); m.currentId = m.rootId; m.mapSeen = []; ui.bloom = true; }
  S.maps[id] = m; S.activeId = id;
  return { m, sum, first: !sum };
}
function boot() {
  S = loadState() || freshState();
  if (ui.canvas) {
    const raw = ($('#qmap-embed').textContent || '').replace(/<\\\//g, '</');
    const r = bootCanvas(raw);
    if (!r) { const x = newMap({ id: 'cv-empty' }); S.maps[x.id] = x; S.activeId = x.id; ui.fresh = {}; saveNow(); renderAll(); return; }
    const n = r.m.nodes[r.m.currentId];
    if (r.sum && n && ui.fresh[n.id] && n.visited) revealFresh(n);
    saveNow(); renderAll();
    if (r.first) setTimeout(() => setView('map'), 400);
    else if (r.sum && !r.sum.empty) setTimeout(() => showMergeCard(r.m, r.sum, false), 500);
    return;
  }
  const emb = $('#qmap-embed'); const raw = (emb.textContent || '').replace(/<\\\//g, '</').trim();
  if (raw && !/^\/\*@@/.test(raw)) {
    const id = emb.getAttribute('data-id') || 'embedded'; const upd = +emb.getAttribute('data-updated') || 0; const isEx = emb.getAttribute('data-example') === '1';
    const local = S.maps[id];
    const fromFile = () => { const m = newMap({ id, example: isEx, pdfUrl: emb.getAttribute('data-pdf') || null }); merge(m, parseMap(raw), { import: true }); m.updatedAt = upd || Date.now(); m.currentId = m.rootId; m.mapSeen = Object.keys(m.nodes); return m; };
    if (!local && !(isEx && S.dismissed.includes(id))) { S.maps[id] = fromFile(); if (!isEx || !S.activeId || !S.maps[S.activeId]) S.activeId = id; }
    else if (local && !isEx && upd > (local.updatedAt || 0)) { S.maps[id] = fromFile(); S.activeId = id; setTimeout(() => toast('已载入文件里更新的版本'), 600); }
    else if (local && !isEx) S.activeId = id;
    const pe = $('#qmap-pdf'); const b64 = (pe.textContent || '').trim();
    if (b64 && S.maps[id]) IDB.get('pdf:' + id).then(x => { if (!x) { IDB.put('pdf:' + id, b64ToBytes(b64)); S.maps[id].pdfName = S.maps[id].pdfName || pe.getAttribute('data-name') || 'source.pdf'; save(false); } });
  }
  ui.fresh = {};
  if (!S.activeId || !S.maps[S.activeId]) {
    const rest = Object.values(S.maps).sort((a, b) => b.updatedAt - a.updatedAt);
    if (rest[0]) S.activeId = rest[0].id; else { const x = newMap(); S.maps[x.id] = x; S.activeId = x.id; }
  }
  saveNow(); renderAll(); initCaps();
}
async function initCaps() {
  if (!ui.inArtifact) return;
  try { ui.downloads = await window.claude.use('downloads'); } catch (e) { ui.downloads = null; }
  try { ui.sample = await window.claude.use('sample'); } catch (e) { ui.sample = null; }
  try { const l = ui.sample && ui.sample.limits && await ui.sample.limits(); ui.canImages = !!(l && l.images); } catch (e) { ui.canImages = false; }
  renderAll(); if (ui.sheet) renderSheet();
}
if (ui.canvas) window.addEventListener('unhandledrejection', e => { const r = e.reason; if (r && /TimeoutError|AbortError|InvalidStateError/.test(r.name || '')) e.preventDefault(); });
window.__qmap = { state: () => S, go, absorb, parseMap, serialize };
boot();

}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
