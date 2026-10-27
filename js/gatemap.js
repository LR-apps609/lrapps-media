/* GateLR · la mappa di Firenze come sul sito di GateLR.
   Sfondo: strade, edifici e parchi © OpenStreetMap contributors (ODbL), disegnati in anticipo in img/firenze-map.webp.
   Zone e varchi: dati ufficiali del Comune di Firenze, dalle città di GateLR. Regole: le stesse dell'app. */
(function () {
  const MAP = { x0: -1700, y0: -1650, mpp: 1.5, w: 2333, h: 2133, src: "img/firenze-map.webp" };
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;
  const DAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  const DAYS3 = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
  let img = null, imgReady = false, waiting = [];
  function loadImg(cb) {
    if (imgReady) return cb(); waiting.push(cb);
    if (img) return; img = new Image(); img.onload = () => { imgReady = true; waiting.forEach(f => f()); waiting = []; }; img.src = MAP.src;
  }

  /* Il tempo «da orologio» di Firenze: una Date letta in UTC, così i minuti si contano senza sorprese */
  function romeNow() {
    const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    const p = Object.fromEntries(f.formatToParts(new Date()).map(x => [x.type, x.value]));
    return new Date(Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute));
  }
  const wall = (y, m, d, h, mi) => new Date(Date.UTC(y, m - 1, d, h, mi));
  function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return [mo, da]; }
  function holiday(t) {
    const y = t.getUTCFullYear(), m = t.getUTCMonth() + 1, d = t.getUTCDate(), key = m * 100 + d;
    if ([101, 106, 425, 501, 602, 624, 815, 1101, 1208, 1225, 1226].includes(key)) return true; // 24 giugno: San Giovanni, patrono di Firenze
    const [em, ed] = easter(y), mon = new Date(Date.UTC(y, em - 1, ed + 1));
    return mon.getUTCMonth() + 1 === m && mon.getUTCDate() === d;
  }
  const inSeason = (s, t) => { if (!s) return true; const v = (t.getUTCMonth() + 1) * 100 + t.getUTCDate(), a = s.fromMonth * 100 + s.fromDay, b = s.toMonth * 100 + s.toDay; return a <= b ? v >= a && v <= b : v >= a || v <= b; };
  function activeAt(zone, t) {
    const min = t.getUTCHours() * 60 + t.getUTCMinutes(), wd = t.getUTCDay() + 1;
    const prev = new Date(t.getTime() - 86400000), pwd = prev.getUTCDay() + 1;
    return zone.windows.some(w => {
      if (w.start < w.end) return w.weekdays.includes(wd) && inSeason(w.season, t) && !(zone.freeOnHolidays === true && holiday(t)) && min >= w.start && min < w.end;
      return (w.weekdays.includes(wd) && inSeason(w.season, t) && min >= w.start) || (w.weekdays.includes(pwd) && inSeason(w.season, prev) && min < w.end);
    });
  }
  function change(zone, t, dir) {
    const now = activeAt(zone, t);
    for (let k = 1; k <= 8 * 288; k++) { const u = new Date(t.getTime() + dir * k * 300000); if (activeAt(zone, u) !== now) return dir > 0 ? u : new Date(u.getTime() + 300000); }
    return null;
  }
  const hm = t => `${t.getUTCHours()}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
  function when(t, from) {
    const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()), b = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()), dd = Math.round((b - a) / 86400000);
    return dd === 0 ? `alle ${hm(t)}` : dd === 1 ? `domani alle ${hm(t)}` : `${DAYS[t.getUTCDay()]} alle ${hm(t)}`;
  }
  function span(ms) { const m = Math.round(ms / 60000), h = Math.floor(m / 60); return h ? `${h} h ${m % 60} min` : `${m} min`; }

  function inside(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  function edgeDist(x, y, poly) { let best = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [x1, y1] = poly[j], [x2, y2] = poly[i], dx = x2 - x1, dy = y2 - y1; const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1))); best = Math.min(best, Math.hypot(x - x1 - t * dx, y - y1 - t * dy)); } return best; }

  /* La risposta, come la dà l'app */
  function answer(D, x, y, t) {
    const order = ["a", "b", "o", "f"], hits = order.map(id => D.zones.find(z => z.id === id)).filter(z => inside(x, y, z.poly) && (z.id !== "f" || inSeason(z.windows[0].season, t)));
    let gate = null, gd = 1e9; D.gates.forEach(g => { const d = Math.hypot(g[2] - x, g[3] - y); if (d < gd) { gd = d; gate = g; } });
    if (!hits.length) return { v: "out", gate, gd };
    const z = hits[0], on = activeAt(z, t), next = change(z, t, 1), last = change(z, t, -1);
    const frac = next && last ? (t - last) / (next - last) : 0;
    // come l'app: se è festivo e il Comune non ha confermato, non si indovina
    if (on && z.freeOnHolidays == null && holiday(t)) return { v: "unsure", z, on, next, last, frac, gate, gd };
    return { v: on ? "no" : "yes", z, on, next, last, frac, gate, gd };
  }

  /* Un punto «comodo» per l'etichetta di ogni settore: dentro la zona, lontano dai bordi */
  function labelPoint(poly, avoid) {
    let xs = poly.map(p => p[0]), ys = poly.map(p => p[1]), best = null, bd = -1;
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (let x = x0; x <= x1; x += 40) for (let y = y0; y <= y1; y += 40) {
      if (!inside(x, y, poly) || (avoid && inside(x, y, avoid))) continue;
      const d = edgeDist(x, y, poly) - (avoid ? Math.max(0, 260 - edgeDist(x, y, avoid)) : 0);
      if (d > bd) { bd = d; best = [x, y]; }
    }
    return best;
  }

  window.GateMap = function (root, opt = {}) {
    if (root.dataset.ready) return; root.dataset.ready = "1";
    const D = window.FI_DATA, compact = !!opt.compact;
    const cv = root.querySelector("canvas"), card = root.querySelector(".gm-card");
    // in alto: la scheda del varco e, accanto, la multa quando ci passi sopra
    const top = document.createElement("div"); top.className = "gm-top"; card.before(top); top.appendChild(card);
    const fine = document.createElement("div"); fine.className = "gm-fine"; fine.setAttribute("aria-live", "polite"); top.appendChild(fine);
    let fineKey = "";
    // pagina dell'app: sole e luna si danno il cambio ogni 5 secondi
    const PERIOD = 5;
    let sky = null;
    if (!compact) {
      sky = document.createElement("div"); sky.className = "gm-skyw";
      sky.innerHTML = `<span class="gm-orb" aria-hidden="true"><i class="sun"></i><i class="moon"></i></span><span class="gm-skyt"><b></b><small></small></span><svg class="gm-timer" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15"/><circle class="arc" cx="18" cy="18" r="15"/><text x="18" y="22.5" text-anchor="middle"></text></svg>`;
      root.appendChild(sky);
    }
    let dark = 0;
    const Z = id => D.zones.find(z => z.id === id);
    const labels = { a: labelPoint(Z("a").poly), b: labelPoint(Z("b").poly, Z("a").poly), o: labelPoint(Z("o").poly), f: labelPoint(Z("f").poly) };
    const NAMES = { a: "Settore A", b: "Settore B", o: "Settore O", f: "Settore F" };
    const view = { cx: compact ? 120 : 60, cy: compact ? -250 : -180, s: 0 };
    const car = { x: 150, y: -330, tx: 150, ty: -330 };
    let hover = false, scene = "day", t0 = performance.now(), raf = 0, visible = false, drag = null, lastKey = "";
    const SCENES = { now: () => romeNow(), day: () => wall(2026, 11, 10, 12, 20), eve: () => wall(2026, 11, 10, 23, 0) };
    // nella home: il punto entra nel Settore A e ne esce, a giro
    const A = Z("a").poly; let loop = [];
    { const xs = A.map(p => p[0]), ys = A.map(p => p[1]), x1 = Math.max(...xs), cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      loop = Array.from({ length: 90 }, (_, j) => [x1 - 120 + Math.cos(j / 90 * TAU) * 420, cy - 60 + Math.sin(j / 90 * TAU) * 170]); }

    const W2S = (x, y, w, h) => [(x - view.cx) * view.s + w / 2, (y - view.cy) * view.s + h / 2];
    const S2W = (X, Y, w, h) => [(X - w / 2) / view.s + view.cx, (Y - h / 2) / view.s + view.cy];
    function fit() { const w = cv.clientWidth, h = cv.clientHeight; if (!view.s) view.s = Math.min(w / (compact ? 1500 : 2600), h / (compact ? 1500 : 2100)); }
    if (compact) { const xs = A.map(p => p[0]), ys = A.map(p => p[1]); view.cx = Math.max(...xs) - 120; view.cy = (Math.min(...ys) + Math.max(...ys)) / 2 - 60; }

    function paintFine(r) {
      const on = r.v === "no", key = on ? (r.gate ? r.gate[0] : "") : "";
      if (key === fineKey) return; fineKey = key;
      fine.classList.toggle("show", on);
      if (on) fine.innerHTML = `<span class="gm-fine-k">Verbale · ZTL</span><b>Multa</b><span class="gm-fine-n">da 83 €</span><small>${r.gate && r.gd < 600 ? `Varco ${r.gate[0]}` : "Varco con telecamera"}</small>`;
    }

    function paintCard(r, t) {
      if (!card) return;
      if (compact) {
        const inA = r.v === "no";
        const html = `<div class="gm-led on">ZTL ATTIVA</div>
          <div class="gm-verdict"><span class="gm-badge"></span><div><b>${inA ? "Sei entrato" : "Sei fuori"}</b><small>${inA ? "Il varco ti ha ripreso." : "Nessuna multa, per ora."}</small></div></div>
          <div class="gm-tag">Usa GateLR per evitare le multe</div>`;
        if (html !== lastKey) { lastKey = html; card.dataset.v = inA ? "no" : "warn"; card.innerHTML = html; }
        return;
      }
      const night = t.getUTCHours() >= 20 || t.getUTCHours() < 7;
      const timeTag = `${scene === "now" ? "ADESSO" : DAYS3[t.getUTCDay()]} ${hm(t)}`;
      let html, v = r.v;
      if (r.v === "out") {
        html = `<div class="gm-head"><span><i class="gm-sky ${night ? "moon" : "sun"}"></i>FIRENZE · ${timeTag}</span></div>
          <div class="gm-verdict"><span class="gm-badge"></span><div><b>Fuori dalla ZTL</b><small>Puoi circolare: qui non ci sono varchi.</small></div></div>`;
      } else if (r.v === "unsure") {
        html = `<div class="gm-head"><span><i class="gm-sky ${night ? "moon" : "sun"}"></i>${NAMES[r.z.id].toUpperCase()} · ${timeTag}</span></div>
          <div class="gm-verdict"><span class="gm-badge"></span><div><b>Non siamo sicuri</b><small>È festivo: guarda il cartello al varco.</small></div></div>`;
      } else {
        const z = r.z, on = r.on, nxt = r.next ? when(r.next, t) : "";
        html = `<div class="gm-head"><span><i class="gm-sky ${night ? "moon" : "sun"}"></i>${compact ? "" : "FIRENZE · "}${NAMES[z.id].toUpperCase()} · ${timeTag}</span>${compact ? "" : `<span class="gm-chip">${on ? "Varchi accesi" : "Varchi spenti"}</span>`}</div>
          <div class="gm-led ${on ? "on" : ""}">${on ? "VARCO ATTIVO" : "VARCO NON ATTIVO"}</div>
          <div class="gm-verdict"><span class="gm-badge"></span><div><b>${on ? "Non entrare" : "Sì, puoi entrare"}</b><small>${on ? `Attivo fino ${nxt.replace(/^alle/, "alle")}` : `Non attivo fino ${nxt}`}</small></div></div>
          ${compact || !r.last || !r.next ? "" : `<div class="gm-bar"><i style="width:${(Math.max(0.02, Math.min(1, r.frac)) * 100).toFixed(1)}%"></i></div><div class="gm-bar-l"><span>${on ? "Accesi" : "Spenti"} dalle ${hm(r.last)}</span><span>${on ? "Si spengono" : "Si accendono"} tra ${span(r.next - t)}</span></div>`}`;
      }
      const key = v + html;
      if (key !== lastKey) { lastKey = key; card.dataset.v = v; card.innerHTML = html; }
    }

    function frame(now) {
      raf = 0;
      const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (!w || !h) return;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      fit();
      // nella home il giro sta un po' più in alto, lontano dal nome dell'app in basso
      if (compact && !drag) { const ys = A.map(p => p[1]); view.cy = (Math.min(...ys) + Math.max(...ys)) / 2 - 60 + 0.06 * h / view.s; }
      const sec = (now - t0) / 1000;
      // pagina dell'app: giorno (varchi accesi) e notte (spenti) si alternano ogni 5 secondi
      const phase = REDUCE ? 0 : sec % (PERIOD * 2), isNight = !compact && phase >= PERIOD;
      scene = isNight ? "eve" : "day";
      const t = SCENES[scene]();
      dark += ((isNight ? 1 : 0) - dark) * (REDUCE ? 1 : 0.08);
      if (sky) {
        sky.classList.toggle("night", isNight);
        const left = PERIOD - (phase % PERIOD);
        sky.querySelector("b").textContent = isNight ? "Notte · 23:00" : "Giorno · 12:20";
        sky.querySelector("small").textContent = isNight ? "Varchi spenti" : "Varchi accesi";
        sky.querySelector("text").textContent = Math.ceil(left);
        sky.querySelector(".arc").style.strokeDashoffset = (94.25 * (1 - left / PERIOD)).toFixed(2);
      }
      if (!hover && compact && loop.length) { const L = loop.length, f = (REDUCE ? 0.15 : sec * 0.045) % 1 * L, i = Math.floor(f), a = loop[i % L], b = loop[(i + 1) % L], u = f - i; car.tx = a[0] + (b[0] - a[0]) * u; car.ty = a[1] + (b[1] - a[1]) * u; }
      car.x += (car.tx - car.x) * (REDUCE ? 1 : 0.2); car.y += (car.ty - car.y) * (REDUCE ? 1 : 0.2);
      const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = "#EEF0EC"; c.fillRect(0, 0, w, h);
      if (imgReady) { const [dx, dy] = W2S(MAP.x0, MAP.y0, w, h); c.drawImage(img, dx, dy, MAP.w * MAP.mpp * view.s, MAP.h * MAP.mpp * view.s); }
      if (!compact) {
        // luce del sole dall'alto a destra; di notte la città si scurisce
        const sunA = 1 - dark, g = c.createRadialGradient(w * 0.92, -h * 0.1, 0, w * 0.92, -h * 0.1, Math.max(w, h) * 1.1);
        g.addColorStop(0, `rgba(255,214,120,${0.30 * sunA})`); g.addColorStop(1, "rgba(255,214,120,0)");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        if (dark > 0.01) { c.fillStyle = `rgba(12,20,44,${0.58 * dark})`; c.fillRect(0, 0, w, h); }
      }
      // le zone: verde se si può entrare, rosso se i varchi sono accesi
      ["f", "o", "b", "a"].forEach(id => {
        const z = Z(id); if (id === "f" && !inSeason(z.windows[0].season, t)) return;
        if (compact && id !== "a") return;
        const on = activeAt(z, t);
        c.beginPath(); z.poly.forEach((p, i) => { const q = W2S(p[0], p[1], w, h); i ? c.lineTo(...q) : c.moveTo(...q); }); c.closePath();
        c.fillStyle = on ? "rgba(214,50,45,.16)" : "rgba(43,122,71,.15)"; c.fill();
        c.strokeStyle = on ? "#B3262B" : "#2E6B45"; c.lineWidth = id === "a" ? 2.4 : 1.6; c.stroke();
      });
      // varchi con telecamera
      const r = compact ? (inside(car.x, car.y, A) ? { ...answer(D, car.x, car.y, t), v: "no" } : { v: "out", ...nearGate(car.x, car.y) }) : answer(D, car.x, car.y, t);
      D.gates.forEach(g => { const [gx, gy] = W2S(g[2], g[3], w, h); c.fillStyle = "#4A4F55"; c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.arc(gx, gy, g === r.gate && r.gd < 400 ? 6 : 4.2, 0, TAU); c.fill(); c.stroke(); });
      // etichette dei settori
      c.font = "600 12px 'Atkinson Hyperlegible Next', system-ui"; c.textAlign = "center"; c.textBaseline = "middle";
      Object.entries(labels).forEach(([id, p]) => {
        if (!p || (id === "f" && !inSeason(Z("f").windows[0].season, t)) || (compact && id !== "a")) return;
        const [lx, ly] = W2S(p[0], p[1], w, h); if (lx < -60 || lx > w + 60 || ly < -20 || ly > h + 20) return;
        const tw = c.measureText(NAMES[id]).width + 18;
        c.fillStyle = "rgba(255,255,255,.95)"; c.strokeStyle = "rgba(46,107,69,.45)"; c.lineWidth = 1;
        c.beginPath(); c.roundRect ? c.roundRect(lx - tw / 2, ly - 11, tw, 22, 11) : c.rect(lx - tw / 2, ly - 11, tw, 22); c.fill(); c.stroke();
        c.fillStyle = "#1B2128"; c.fillText(NAMES[id], lx, ly + 1);
      });
      // il varco più vicino, con il nome
      if (r.gate && r.gd < 400) { const [gx, gy] = W2S(r.gate[2], r.gate[3], w, h); const name = r.gate[0], tw = c.measureText(name).width + 16; c.fillStyle = "rgba(27,33,40,.88)"; c.beginPath(); c.roundRect ? c.roundRect(gx - tw / 2, gy - 34, tw, 20, 6) : c.rect(gx - tw / 2, gy - 34, tw, 20); c.fill(); c.fillStyle = "#fff"; c.font = "600 11px 'Atkinson Hyperlegible Next', system-ui"; c.fillText(name, gx, gy - 23); }
      c.textAlign = "start"; c.textBaseline = "alphabetic";
      // il tuo luogo
      const [px, py] = W2S(car.x, car.y, w, h);
      c.fillStyle = "rgba(31,78,158,.18)"; c.beginPath(); c.arc(px, py, 20 + (REDUCE ? 0 : Math.sin(sec * 3) * 3), 0, TAU); c.fill();
      c.fillStyle = "#1F4E9E"; c.strokeStyle = "#fff"; c.lineWidth = 3; c.beginPath(); c.arc(px, py, 8, 0, TAU); c.fill(); c.stroke();
      paintCard(r, t); paintFine(r);
      if (visible && !REDUCE) raf = requestAnimationFrame(frame);
    }
    function nearGate(x, y) { let gate = null, gd = 1e9; D.gates.forEach(g => { const d = Math.hypot(g[2] - x, g[3] - y); if (d < gd) { gd = d; gate = g; } }); return { gate, gd }; }
    function wake() { if (!raf && visible) raf = requestAnimationFrame(frame); }

    /* Mouse: il punto ti segue. Trascinando sposti la mappa; con + e − ingrandisci */
    const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top, b.width, b.height]; };
    cv.addEventListener("pointermove", e => {
      const [X, Y, w, h] = pos(e);
      if (drag) { view.cx = drag.cx - (X - drag.X) / view.s; view.cy = drag.cy - (Y - drag.Y) / view.s; if (Math.hypot(X - drag.X, Y - drag.Y) > 4) drag.moved = true; }
      else if (e.pointerType === "mouse") { hover = true; [car.tx, car.ty] = S2W(X, Y, w, h); }
      wake();
    });
    cv.addEventListener("pointerleave", () => { hover = false; drag = null; wake(); });
    if (!compact) {
      cv.addEventListener("pointerdown", e => { const [X, Y] = pos(e); drag = { X, Y, cx: view.cx, cy: view.cy, moved: false }; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener("pointerup", e => { const [X, Y, w, h] = pos(e); if (drag && !drag.moved) { hover = e.pointerType === "mouse"; [car.tx, car.ty] = S2W(X, Y, w, h); } drag = null; wake(); });
      root.querySelectorAll("[data-zoom]").forEach(b => b.addEventListener("click", () => { view.s = Math.max(0.15, Math.min(1.6, view.s * (b.dataset.zoom === "in" ? 1.35 : 1 / 1.35))); wake(); }));
    }
    new IntersectionObserver(es => { visible = es[0].isIntersecting && !root.closest("[hidden]"); if (visible) wake(); }).observe(root);
    new ResizeObserver(() => { view.s = 0; wake(); }).observe(cv);
    loadImg(wake);
    return { wake };
  };
})();
