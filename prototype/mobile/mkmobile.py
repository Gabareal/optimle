import sys
src, out = sys.argv[1], sys.argv[2]
s = open(src).read()
def rep(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b)

rep("Ticket: \"Page layout: Board walk plus stats\".", "Ticket: \"Mobile and accessibility\". Built on the chosen layout (tabs in the header).\n  Variants M1/M2/M3 = three phone treatments; view at phone width. A11y toggles (high contrast, keyboard painting, aria) are in every variant.")
rep("<title>Layout Prototype</title>", "<title>Mobile Prototype</title>")
# accessible pattern tiles + labels
rep("const patTiles = p => `<span class=\"tiles\">${[...p].map(c => `<span class=\"t sm ${c}\"></span>`).join('')}</span>`;",
    "const CNAME = { G: 'green', Y: 'yellow', B: 'grey' };\nconst patLabel = p => [...p].map(c => CNAME[c]).join(', ');\nconst patTiles = p => `<span class=\"tiles\" role=\"img\" aria-label=\"${patLabel(p)}\">${[...p].map(c => `<span class=\"t sm ${c}\"></span>`).join('')}</span>`;")
rep("`<span class=\"t lg ${S.draft[j]}\" data-act=\"paint\" data-j=\"${j}\">${l}</span>`",
    "`<span class=\"t lg ${S.draft[j]}\" data-act=\"paint\" data-j=\"${j}\" tabindex=\"0\" role=\"button\" aria-label=\"Letter ${j + 1}, ${l.toUpperCase()}, ${CNAME[S.draft[j]]}. Press G, Y or B to set, Space to cycle, Enter to apply.\">${l}</span>`")
rep("${n.kids.map((k, j) => `<div class=\"prow ${k === pathKid ? 'path' : k.pat === S.draft ? 'on' : ''}\" data-act=\"kid\" data-j=\"${j}\">",
    "${(S.showAll || cur() === 'M2' ? n.kids : n.kids.slice(0, 8)).map((k, j) => `<div class=\"prow ${k === pathKid ? 'path' : k.pat === S.draft ? 'on' : ''}\" data-act=\"kid\" data-j=\"${j}\" role=\"button\" tabindex=\"0\" aria-label=\"${patLabel(k.pat)}: ${k.size} candidates, then ${k.guess.toUpperCase()}\">")
rep("<span class=\"nx\">then ${k.guess}</span></div>`).join('')}</div>`;",
    "<span class=\"nx\">then ${k.guess}</span></div>`).join('')}${!S.showAll && cur() !== 'M2' && n.kids.length > 8 ? `<button class=\"more\" data-act=\"more\">Show all ${n.kids.length} patterns</button>` : ''}</div>`;")
rep("return `<h3>Tree plays ${n.guess.toUpperCase()}</h3>", "return `<h3 data-act=\"sheet\">${cur() === 'M2' ? '<span class=\"handle\"></span>' : ''}Tree plays ${n.guess.toUpperCase()}</h3>")
rep("<div class=\"card\">${PatternList('calc(100vh - 330px)')}</div></div>`", "<div class=\"card plcard ${S.sheet ? 'open' : ''}\">${PatternList(cur() === 'M2' ? '55vh' : 'none')}</div></div>`")
rep("function goto(n) { S.sel = n; S.histPick = null; render(); }", "function goto(n) { S.sel = n; S.histPick = null; S.showAll = false; render(); }")
rep("const VARIANTS = { A: ['Long scroll', A], B: ['Tabs', B], C: ['Dashboard rail', C] };",
    "const VARIANTS = { M1: ['Bottom tab bar', B], M2: ['Pattern sheet', B], M3: ['Menu button', B] };")
s = s.replace("cur() === 'B'", "true")
rep("return keys.includes(v) ? v : 'B';", "return keys.includes(v) ? v : 'M1';")
rep("    case 'root':", "    case 'more': S.showAll = true; return render();\n    case 'sheet': if (cur() === 'M2') { S.sheet = !S.sheet; return render(); } return;\n    case 'root':")
# header per variant + a11y toggle
old_hdr = s[s.index("  document.getElementById('hdr-extra').innerHTML ="):]
old_hdr = old_hdr[:old_hdr.index("\n")]
s = s.replace(old_hdr, """  document.body.className = v.toLowerCase() + (S.hc ? ' hc' : '') + (S.menu ? ' menuopen' : '');
  const nav = `<nav class="topnav" aria-label="Sections">${[['explore', 'Explore', '▦'], ['stats', 'Stats', '▤'], ['openers', 'Openers', '★']].map(([k, l, i]) => `<a class="${S.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}" href="#" ${S.tab === k ? 'aria-current="page"' : ''}><span class="ic">${i}</span>${l}</a>`).join('')}</nav>`;
  document.getElementById('hdr-extra').innerHTML = `${v === 'M3' ? `<button class="burger" data-act="menu" aria-label="Menu" aria-expanded="${!!S.menu}">☰</button>` : ''}${nav}<button class="hcbtn" data-act="hc" aria-pressed="${!!S.hc}" title="High-contrast colours">◐ ${S.hc ? 'High contrast on' : 'High contrast'}</button>`;""")
rep("document.getElementById('hdr-extra').addEventListener('click', e => { const el = e.target.closest('[data-act=\"tab\"]'); if (el) { S.tab = el.dataset.t; render(); } });",
    "document.getElementById('hdr-extra').addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el) return; e.preventDefault(); const a = el.dataset.act; if (a === 'tab') { S.tab = el.dataset.t; S.menu = false; } if (a === 'hc') S.hc = !S.hc; if (a === 'menu') S.menu = !S.menu; render(); });")
# keyboard painting + activate role=button on Enter/Space
old_kd = "document.addEventListener('keydown', e => { if (e.target.closest('input,textarea,select,[contenteditable]')) return; if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });"
rep(old_kd, """document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,select,[contenteditable]')) return;
  const tile = e.target.closest('[data-act="paint"]');
  if (tile) {
    const j = +tile.dataset.j, k = e.key.toUpperCase(), set = c => { S.draft = S.draft.slice(0, j) + c + S.draft.slice(j + 1); S.focusTile = j; render(); };
    if ('GYB'.includes(k) && k.length === 1) { e.preventDefault(); return set(k); }
    if (e.key === ' ') { e.preventDefault(); return set(CYCLE[S.draft[j]]); }
    if (e.key === 'Enter') { e.preventDefault(); S.focusTile = 0; return app.querySelector('[data-act="apply"]')?.click(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); S.focusTile = Math.max(0, Math.min(4, j + (e.key === 'ArrowRight' ? 1 : -1))); return render(); }
    return;
  }
  const btn = e.target.closest('[role="button"][data-act]');
  if (btn && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); return btn.click(); }
  if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1);
});""")
rep("const y = window.scrollY; app.innerHTML = VARIANTS[v][1](); window.scrollTo(0, y);",
    "const y = window.scrollY; app.innerHTML = VARIANTS[v][1](); window.scrollTo(0, y);\n  if (S.focusTile != null) { app.querySelector(`[data-act=\"paint\"][data-j=\"${S.focusTile}\"]`)?.focus(); S.focusTile = null; }")
rep("</style>", """
  /* ---- mobile + a11y prototype ---- */
  body.hc { --G:#f5793a; --Y:#85c0f9; }
  body.hc .t.sm { position:relative; } body.hc .t.sm.G::after { content:'✓'; } body.hc .t.sm.Y::after { content:'~'; }
  body.hc .t.sm::after { position:absolute; inset:0; font-size:9px; line-height:12px; color:#000; text-align:center; }
  body.hc .t.lg.G::after { content:'✓'; } body.hc .t.lg.Y::after { content:'~'; }
  body.hc .t.lg { position:relative; } body.hc .t.lg::after { position:absolute; right:3px; top:1px; font-size:12px; color:#000; }
  [data-act="paint"]:focus-visible, .prow:focus-visible, .topnav a:focus-visible { outline:3px solid #111; outline-offset:2px; }
  .hcbtn, .burger { font:600 12px system-ui; border:1px solid var(--line); background:var(--card); border-radius:999px; padding:6px 10px; cursor:pointer; }
  .burger { font-size:18px; padding:2px 10px; }
  .more { width:100%; margin-top:6px; font:inherit; padding:8px; border:1px dashed #c9ccd4; background:none; border-radius:6px; cursor:pointer; color:var(--accent); }
  .topnav .ic { display:none; }
  #hdr-extra { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .t.lg { width:min(52px, 15vw); height:min(52px, 15vw); }
  @media (max-width:700px) {
    main { padding:10px; padding-bottom:150px; }
    header { padding:8px 10px; gap:8px; } header .sub { display:none; }
    .search { margin-left:0; width:100%; order:9; } .search input { flex:1; width:auto; font-size:16px; padding:8px 10px; } .search .msg { min-width:0; }
    .walk, .B-explore, .B-stats { grid-template-columns:1fr !important; }
    #switcher { bottom:76px; } #switcher span { min-width:150px; }
    .prow { grid-template-columns:auto 34px 1fr 74px; padding:8px 4px; }
    /* M1: tabs become a bottom tab bar */
    body.m1 .topnav { position:fixed; left:0; right:0; bottom:0; margin:0; background:var(--card); border-top:1px solid var(--line); z-index:50; justify-content:space-around; padding:4px 0 10px; }
    body.m1 .topnav a { display:flex; flex-direction:column; align-items:center; font-size:11px; padding:4px 12px; background:none !important; color:var(--mute); }
    body.m1 .topnav a.on { color:var(--accent); } body.m1 .topnav .ic { display:block; font-size:18px; }
    /* M2: tabs as a scrolling chip row; pattern list is a pull-up sheet */
    body.m2 .topnav { overflow-x:auto; margin-left:0; }
    body.m2 .plcard { position:fixed; left:0; right:0; bottom:0; z-index:40; border-radius:16px 16px 0 0; box-shadow:0 -6px 24px rgba(0,0,0,.15); transform:translateY(calc(100% - 64px)); transition:transform .2s; }
    body.m2 .plcard.open { transform:none; }
    body.m2 .plcard h3 { cursor:pointer; padding-top:8px; } body.m2 .handle { display:block; width:40px; height:4px; background:#ccc; border-radius:2px; margin:0 auto 8px; }
    body.m2 #switcher { bottom:80px; }
    /* M3: tabs behind a menu button */
    body.m3 .topnav { display:none; } body.m3.menuopen .topnav { display:flex; flex-direction:column; position:absolute; top:52px; left:10px; background:var(--card); border:1px solid var(--line); border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,.15); z-index:60; padding:6px; }
    body.m3 #switcher { bottom:16px; } body.m3 main { padding-bottom:90px; }
  }
</style>""")
open(out, 'w').write(s)
