/* Home · quattro pannelli vivi. Ogni pannello mostra in piccolo che cosa fa la sua app
   e reagisce al cursore. Canvas 2D, leggero. */
(function () {
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };

  /* IsoLR: le barre dell'app. La canzone ha i cinque colori insieme; dopo il punto di separazione
     diventa cinque tracce, ognuna del suo colore. Tutto scorre verso destra. */
  const STEMS = [["Voce", "#E5917A", 0.9, 1.7], ["Batteria", "#E6B45C", 1, 3.4], ["Chitarra", "#93C174", 0.75, 2.2], ["Basso", "#B497D0", 0.85, 0.8], ["Altri strumenti", "#76C3B9", 0.7, 1.3]];
  const level = (k, u) => {
    if (k === 1) { const ph = ((u * 0.045) % 4 + 4) % 4; return ph < 0.55 ? 1 - ph / 0.55 * 0.6 : 0.12 + 0.08 * Math.abs(Math.sin(u * 0.9)); }
    const env = 0.55 + 0.45 * Math.sin(u * 0.012 * STEMS[k][3] + k * 1.7);
    return Math.max(0.06, env * (0.6 + 0.4 * Math.abs(Math.sin(u * 0.11 * STEMS[k][3] + k)))) * STEMS[k][2];
  };
  function iso(c, w, h, t, m) {
    const flow = REDUCE ? 0 : t * 70, bw = 3, gap = 2.4, step = bw + gap;
    const split = m.in ? Math.max(w * 0.2, Math.min(w * 0.62, m.x * w)) : w * 0.36;
    const cy = h * 0.42, rowH = Math.min(h * 0.11, 44), spread = (m.in ? 0.7 + 0.3 * (1 - m.y) : 1) * rowH * 1.05;
    c.font = "700 11px 'IBM Plex Mono', monospace"; c.fillStyle = "rgba(237,230,242,.7)"; c.fillText("CANZONE", 14, cy - rowH * 1.55);
    for (let x = 4; x < w; x += step) {
      const u = x - flow, lv = STEMS.map((_, k) => level(k, u)), f = Math.max(0, Math.min(1, (x - split) / (w * 0.16))), e = f * f * (3 - 2 * f);
      if (x < split || e < 0.02) {
        // la canzone: una barra sola, a strati dei cinque colori (radice, come nell'app)
        const tot = lv.reduce((a, b) => a + b, 0), H = Math.sqrt(tot / 4.2) * rowH * 2.6;
        let y = cy - H / 2;
        lv.forEach((v, k) => { const hh = H * v / tot; c.fillStyle = STEMS[k][1]; c.fillRect(x, y, bw, hh + 0.5); y += hh; });
      } else {
        STEMS.forEach((st, k) => {
          const oy = (k - 2) * spread * e, H = Math.max(2, Math.sqrt(lv[k]) * rowH * (0.55 + 0.35 * e));
          c.fillStyle = st[1]; c.globalAlpha = 0.55 + 0.45 * e;
          c.beginPath(); c.roundRect ? c.roundRect(x, cy + oy - H / 2, bw, H, bw / 2) : c.rect(x, cy + oy - H / 2, bw, H); c.fill();
        });
        c.globalAlpha = 1;
      }
    }
    // il punto in cui IsoLR separa
    c.fillStyle = "rgba(214,170,98,.9)"; c.fillRect(split - 1, cy - rowH * 1.4, 2, rowH * 2.8);
    if (w - split > 150) STEMS.forEach(([name, col], k) => { c.fillStyle = col; c.font = "700 11px 'Nunito', system-ui"; c.textAlign = "right"; c.fillText(name, w - 12, cy + (k - 2) * spread - rowH * 0.36); c.textAlign = "start"; });
  }

  /* OrbitLR: la torta del logo, con i formati negli spicchi */
  const OC = [["#F7DA8A", "#E0B65E", "JPG"], ["#9CD8B5", "#5C9A7C", "PNG"], ["#82A4F5", "#3F55C0", "PDF"], ["#A57AF5", "#5E34D6", "MP4"], ["#F28682", "#C7444B", "MP3"], ["#F3A974", "#D86D45", "GIF"]];
  function orbit(c, w, h, t, m) {
    const cx = w / 2, cy = h * 0.44, R = Math.min(w * 0.38, h * 0.31), r0 = R * 0.4, rot = REDUCE ? 0 : t * 0.18;
    const pa = Math.atan2(m.y * h - cy, m.x * w - cx);
    const glow = c.createRadialGradient(cx, cy, r0, cx, cy, R * 1.6); glow.addColorStop(0, "rgba(127,194,164,.18)"); glow.addColorStop(1, "rgba(127,194,164,0)"); c.fillStyle = glow; c.fillRect(0, 0, w, h);
    OC.forEach(([c0, c1, label], i) => {
      const a0 = rot + i * TAU / 6 + 0.04, a1 = rot + (i + 1) * TAU / 6 - 0.04, mid = (a0 + a1) / 2;
      const d = Math.abs(((pa - mid) % TAU + TAU + Math.PI) % TAU - Math.PI);
      const pop = m.in ? Math.max(0, 1 - d / 0.8) * 16 * m.act : 0, spread = 3 * m.act;
      const ox = Math.cos(mid) * (pop + spread), oy = Math.sin(mid) * (pop + spread);
      const g = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, c0); g.addColorStop(1, c1);
      c.fillStyle = g; c.beginPath(); c.arc(cx + ox, cy + oy, R, a0, a1); c.arc(cx + ox, cy + oy, r0, a1, a0, true); c.closePath(); c.fill();
      const lr = (R + r0) / 2, fs = Math.max(10, Math.min(15, R * 0.15));
      c.fillStyle = "rgba(16,32,29,.85)"; c.font = `800 ${fs}px 'Nunito', system-ui`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(label, cx + ox + Math.cos(mid) * lr, cy + oy + Math.sin(mid) * lr);
    });
    c.textAlign = "start"; c.textBaseline = "alphabetic";
    c.fillStyle = "#0C1513"; c.beginPath(); c.arc(cx, cy, r0 - 4, 0, TAU); c.fill();
    c.strokeStyle = "rgba(111,174,149,.5)"; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, r0 - 8, 0, TAU); c.stroke();
  }

  /* WebcamLR: il telefono preme «Avvia», sul computer appare la persona */
  function webcam(c, w, h, t, m, st) {
    const cyc = REDUCE ? 3 : (t % 7), tap = cyc > 1.4 && cyc < 1.8, live = cyc > 2.1 && cyc < 6.6, connecting = cyc >= 1.8 && cyc <= 2.1;
    const px = m.in ? (m.x - 0.5) : Math.sin(t * 0.4) * 0.15, py = m.in ? (m.y - 0.5) : 0;
    // il portatile, sullo sfondo
    const lw = Math.min(w * 0.82, h * 1.25), lh = lw * 0.62, lx = w / 2 - lw / 2 - px * 10, ly = h * 0.12 - py * 6;
    c.fillStyle = "#1A2522"; rr(c, lx - 8, ly - 8, lw + 16, lh + 16, 14); c.fill();
    c.save(); rr(c, lx, ly, lw, lh, 8); c.clip();
    c.fillStyle = "#0B1311"; c.fillRect(lx, ly, lw, lh);
    st.v = (st.v ?? 0) + ((live ? 1 : 0) - (st.v ?? 0)) * 0.08;
    if (st.v > 0.01) {
      c.globalAlpha = st.v; c.save(); c.translate(lx, ly); window.drawRoom(c, lw, lh); window.drawPerson(c, lw * 0.5, lh * 0.22, lh * 0.32, t, 0.5); c.restore(); c.globalAlpha = 1;
    }
    if (connecting) { c.strokeStyle = "#9FD0B6"; c.lineWidth = 3; c.beginPath(); c.arc(lx + lw / 2, ly + lh / 2, 14, t * 8, t * 8 + 4); c.stroke(); }
    if (!live && !connecting) { c.fillStyle = "rgba(230,238,234,.5)"; c.font = "600 12px 'IBM Plex Mono', monospace"; c.textAlign = "center"; c.fillText("In attesa del telefono…", lx + lw / 2, ly + lh / 2); c.textAlign = "start"; }
    if (live) { c.fillStyle = "#E67A67"; rr(c, lx + lw - 86, ly + 10, 76, 20, 5); c.fill(); c.fillStyle = "#fff"; c.font = "500 10px 'IBM Plex Mono', monospace"; c.fillText("● IN ONDA", lx + lw - 79, ly + 24); }
    c.restore();
    c.fillStyle = "#24322E"; rr(c, lx - 30, ly + lh + 8, lw + 60, 10, 5); c.fill();
    // il telefono, in primo piano
    const ph = Math.min(h * 0.56, 230), pw = ph * 0.49, fx = w * 0.72 - pw / 2 + px * 24, fy = h * 0.4 + py * 14;
    c.save(); c.translate(fx + pw / 2, fy + ph / 2); c.rotate(-0.06 + px * 0.05); c.translate(-pw / 2, -ph / 2);
    c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 30; c.shadowOffsetY = 14;
    c.fillStyle = "#0E1513"; rr(c, 0, 0, pw, ph, pw * 0.16); c.fill(); c.shadowColor = "transparent";
    c.fillStyle = "#13211D"; rr(c, 5, 5, pw - 10, ph - 10, pw * 0.13); c.fill();
    c.fillStyle = "#0E1513"; rr(c, pw / 2 - pw * 0.15, 11, pw * 0.3, 8, 4); c.fill();
    c.fillStyle = "rgba(230,238,234,.9)"; c.font = `700 ${Math.round(pw * 0.11)}px 'Barlow Condensed', system-ui`; c.textAlign = "center"; c.fillText("WebcamLR", pw / 2, ph * 0.2);
    c.fillStyle = "rgba(230,238,234,.5)"; c.font = `500 ${Math.round(pw * 0.065)}px 'IBM Plex Mono', monospace`; c.fillText("Il tuo Mac · Wi-Fi", pw / 2, ph * 0.28);
    const br = pw * 0.26, bcx = pw / 2, bcy = ph * 0.58, on = live || connecting;
    c.fillStyle = on ? "#E67A67" : "#9FD0B6"; c.beginPath(); c.arc(bcx, bcy, br, 0, TAU); c.fill();
    c.fillStyle = on ? "#fff" : "#0D1B18"; c.font = `700 ${Math.round(pw * 0.1)}px 'Barlow Condensed', system-ui`; c.fillText(on ? "IN ONDA" : "AVVIA", bcx, bcy + pw * 0.035);
    if (tap) { const k = (cyc - 1.4) / 0.4; c.strokeStyle = `rgba(255,255,255,${1 - k})`; c.lineWidth = 3; c.beginPath(); c.arc(bcx, bcy, br + k * 26, 0, TAU); c.stroke(); c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.arc(bcx + 6, bcy + 8, 13, 0, TAU); c.fill(); }
    c.fillStyle = "rgba(230,238,234,.45)"; c.font = `500 ${Math.round(pw * 0.06)}px 'IBM Plex Mono', monospace`; c.fillText("720p · gratis", pw / 2, ph * 0.86);
    c.textAlign = "start"; c.restore();
  }

  const DEMOS = { isolr: iso, orbitlr: orbit, webcamlr: webcam };

  window.startPortal = function (root) {
    if (root.dataset.ready) return; root.dataset.ready = "1";
    const panels = [...root.querySelectorAll(".pt")];
    const items = panels.filter(p => DEMOS[p.dataset.app]).map(p => ({ p, id: p.dataset.app, cv: p.querySelector("canvas"), m: { x: 0.5, y: 0.5, in: false, act: 0 }, st: {} }));
    const gm = root.querySelector(".pt[data-app='gatelr'] .gm"); if (gm && window.GateMap) window.GateMap(gm, { compact: true });
    panels.filter(p => !DEMOS[p.dataset.app]).forEach(p => { p.addEventListener("pointerenter", () => setFocus(p)); p.addEventListener("focus", () => setFocus(p)); });
    let raf = 0, visible = true, t0 = performance.now();
    function setFocus(p) { panels.forEach(x => x.classList.toggle("on", x === p)); root.classList.toggle("has-focus", !!p); wake(); }
    items.forEach(it => {
      it.p.addEventListener("pointerenter", () => setFocus(it.p));
      it.p.addEventListener("pointermove", e => { const r = it.p.getBoundingClientRect(); it.m.x = (e.clientX - r.left) / r.width; it.m.y = (e.clientY - r.top) / r.height; it.m.in = true; wake(); });
      it.p.addEventListener("pointerleave", () => { it.m.in = false; wake(); });
      it.p.addEventListener("focus", () => setFocus(it.p));
      it.p.addEventListener("blur", () => setFocus(null));
    });
    // uscendo da tutti e quattro, tornano tutti uguali
    root.addEventListener("pointerleave", () => setFocus(null));
    function frame(now) {
      raf = 0; const t = (now - t0) / 1000;
      items.forEach(it => {
        const cv = it.cv, w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
        if (!w || !h) return;
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        it.m.act += ((it.p.classList.contains("on") ? 1 : 0) - it.m.act) * 0.08;
        const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
        DEMOS[it.id](c, w, h, t, it.m, it.st);
      });
      if (visible && !REDUCE) raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf) raf = requestAnimationFrame(frame); }
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) wake(); }).observe(root);
    new ResizeObserver(wake).observe(root);
    wake();
  };
})();
