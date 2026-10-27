/* IsoLR · un brano vero, separato dall'app in sei tracce.
   Ogni traccia è un file a parte: muto e solo agiscono davvero sul suono. */
(function () {
  const SR = 44100, BPM = 86.25, BEAT = 60 / BPM, BARS = 24, LEN = BARS * 4 * BEAT;
  const STEMS = [
    { id: "voce", name: "Voce", color: "#E5917A", colorL: "#CF6F57" },
    { id: "batteria", name: "Batteria", color: "#E6B45C", colorL: "#C48E2C" },
    { id: "chitarra", name: "Chitarra", color: "#93C174", colorL: "#5E9440" },
    { id: "basso", name: "Basso", color: "#B497D0", colorL: "#8C6AAF" },
    { id: "pianoforte", name: "Pianoforte", color: "#7FA8E0", colorL: "#4C78B8" },
    { id: "altri", name: "Altri strumenti", color: "#76C3B9", colorL: "#3C978C" }
  ];
  const PARTS = { tutta: [0, BARS], prima: [0, 12], seconda: [12, 24] };

  // il click del metronomo segue la griglia del brano (86 bpm)
  async function renderMetro() {
    const n = Math.ceil(LEN * SR), ctx = new OfflineAudioContext(2, n, SR);
    for (let b = 0; b < BARS * 4; b++) {
      const t = b * BEAT, o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 1800;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.06);
    }
    return ctx.startRendering();
  }
  async function loadStem(ctx, id) {
    const r = await fetch(`audio/tender-${id}.mp3`);
    if (!r.ok) throw new Error(id);
    return ctx.decodeAudioData(await r.arrayBuffer());
  }
  function peaks(buf, n) {
    const a = buf.getChannelData(0), b = buf.numberOfChannels > 1 ? buf.getChannelData(1) : a, step = Math.floor(a.length / n), out = [];
    for (let i = 0; i < n; i++) { let m = 0; for (let j = i * step; j < (i + 1) * step; j += 8) m = Math.max(m, Math.abs(a[j]), Math.abs(b[j])); out.push(m); }
    const top = Math.max(...out) || 1; return out.map(v => v / top);
  }

  window.startAudioDemo = function (root) {
    if (root.dataset.ready) return; root.dataset.ready = "1";
    const dark = () => matchMedia("(prefers-color-scheme: dark)").matches && document.documentElement.dataset.theme !== "light" || document.documentElement.dataset.theme === "dark";
    const rows = STEMS.map(st => {
      const row = document.createElement("div"); row.className = "track"; row.style.setProperty("--s", st.colorL);
      row.innerHTML = `<span class="nm"><i></i>${st.name}</span><span class="ms"><button type="button" class="m" aria-pressed="false" aria-label="Muto ${st.name}">M</button><button type="button" class="s" aria-pressed="false" aria-label="Solo ${st.name}">S</button></span><div class="wave"><canvas></canvas></div>`;
      root.querySelector(".tracks").appendChild(row);
      return { st, row, canvas: row.querySelector("canvas"), peaks: null, gain: null, buf: null };
    });
    const playBtn = root.querySelector(".play"), time = root.querySelector(".mix-time"), status = root.querySelector(".mix-status");
    let ctx = null, sources = [], startAt = 0, offset = 0, playing = false, raf = 0, hoverF = -1;
    let metroBuf = null, metroGain = null, metroOn = false, part = "tutta";
    const barNow = root.querySelector(".bar-now"), beats = [...root.querySelectorAll(".beats i")], partLabel = root.querySelector(".part-now");
    const region = () => PARTS[part].map(b => b * 4 * BEAT);
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    function pos() {
      if (!playing) return offset;
      const [a, b] = region(), el = ctx.currentTime - startAt;
      if (el < b) return el;
      return a + ((el - b) % (b - a));
    }
    function studio(p) {
      const bar = Math.min(BARS - 1, Math.floor(p / (4 * BEAT))), beat = Math.floor(p / BEAT) % 4;
      barNow.textContent = `${bar + 1}`;
      beats.forEach((b, i) => b.classList.toggle("on", playing && i === beat));
      partLabel.textContent = `${bar < 12 ? "Prima met\u00e0" : "Seconda met\u00e0"} \u00b7 battuta ${bar + 1} di ${BARS}`;
    }

    function draw() {
      const f = pos() / LEN;
      rows.forEach(r => {
        const c = r.canvas, w = c.clientWidth, h = c.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
        if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
        const x = c.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
        const col = dark() ? r.st.color : r.st.colorL, n = r.peaks ? r.peaks.length : 140, bw = w / n;
        const off = r.row.classList.contains("off");
        for (let i = 0; i < n; i++) {
          const v = r.peaks ? r.peaks[i] : 0.08 + 0.05 * Math.sin(i * 0.7), bh = Math.max(1.5, v * (h - 6));
          x.globalAlpha = (i / n < f ? 1 : 0.38) * (off ? 0.35 : 1);
          x.fillStyle = col; x.fillRect(i * bw + bw * 0.18, (h - bh) / 2, bw * 0.64, bh);
        }
        x.globalAlpha = 1; x.fillStyle = dark() ? "#E5EAE7" : "#18201E"; x.fillRect(Math.round(f * w) - 1, 0, 2, h);
        if (hoverF >= 0) { x.globalAlpha = 0.35; x.fillRect(Math.round(hoverF * w), 0, 1, h); x.globalAlpha = 1; }
      });
      time.textContent = `${fmt(pos())} / ${fmt(LEN)}`;
      studio(pos());
      raf = playing ? requestAnimationFrame(draw) : 0;
    }
    function mix() {
      const solo = rows.some(r => r.row.querySelector(".s").getAttribute("aria-pressed") === "true");
      rows.forEach(r => {
        const m = r.row.querySelector(".m").getAttribute("aria-pressed") === "true", s = r.row.querySelector(".s").getAttribute("aria-pressed") === "true";
        const on = !(m || (solo && !s)); r.row.classList.toggle("off", !on);
        if (r.gain) r.gain.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.03);
      });
      if (!raf) draw();
    }
    function stopSources() { sources.forEach(s => { try { s.stop(); } catch (e) {} }); sources = []; }
    function play(from) {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.knee.value = 10; comp.connect(ctx.destination);
        const master = ctx.createGain(); master.gain.value = 0.7; master.connect(comp);
        rows.forEach(r => { r.gain = ctx.createGain(); r.gain.connect(master); });
        mix();
      }
      ctx.resume(); stopSources();
      const [a, b] = region(); if (from < a || from >= b) from = a;
      startAt = ctx.currentTime + 0.04 - from;
      const src = (buf, dest) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = a; s.loopEnd = b; s.connect(dest); s.start(ctx.currentTime + 0.04, from); sources.push(s); };
      rows.forEach(r => src(r.buf, r.gain));
      if (metroBuf) { if (!metroGain) { metroGain = ctx.createGain(); metroGain.connect(ctx.destination); } metroGain.gain.value = metroOn ? 0.6 : 0; src(metroBuf, metroGain); }
      playing = true; playBtn.setAttribute("aria-pressed", "true"); playBtn.setAttribute("aria-label", "Pausa"); if (!raf) draw();
    }
    function pause() { offset = pos(); stopSources(); playing = false; playBtn.setAttribute("aria-pressed", "false"); playBtn.setAttribute("aria-label", "Ascolta"); draw(); }

    playBtn.disabled = true; status.textContent = "Carico le sei tracce\u2026";
    renderMetro().then(b => metroBuf = b).catch(() => {});
    const dec = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, SR, SR);
    Promise.all(STEMS.map(st => loadStem(dec, st.id))).then(bufs => {
      bufs.forEach((b, i) => { rows[i].buf = b; rows[i].peaks = peaks(b, 140); });
      playBtn.disabled = false; status.textContent = "86 bpm \u00b7 in loop \u00b7 sei tracce separate da IsoLR"; draw();
    }).catch(() => { status.textContent = "Non riesco a caricare le tracce. Ricarica la pagina."; });

    playBtn.addEventListener("click", () => playing ? pause() : play(offset));
    root.addEventListener("click", e => {
      const b = e.target.closest(".ms button");
      if (b) { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); root.querySelectorAll("[data-preset]").forEach(x => x.setAttribute("aria-pressed", "false")); mix(); return; }
      const p = e.target.closest("[data-preset]");
      if (p) {
        const want = { tutto: [], karaoke: ["m:voce"], voce: ["s:voce"], piano: ["s:pianoforte"], basso: ["s:basso"], ritmo: ["s:batteria", "s:basso"] }[p.dataset.preset];
        rows.forEach(r => ["m", "s"].forEach(k => r.row.querySelector("." + k).setAttribute("aria-pressed", want.includes(k + ":" + r.st.id))));
        mix(); root.querySelectorAll("[data-preset]").forEach(x => x.setAttribute("aria-pressed", x === p));
        if (!playing && rows[0].buf) play(offset);
        return;
      }
      const mt = e.target.closest("[data-metro]");
      if (mt) { metroOn = !metroOn; mt.setAttribute("aria-pressed", metroOn); if (metroGain) metroGain.gain.setTargetAtTime(metroOn ? 0.6 : 0, ctx.currentTime, 0.02); return; }
      const pt = e.target.closest("[data-part]");
      if (pt) { part = pt.dataset.part; root.querySelectorAll("[data-part]").forEach(x => x.setAttribute("aria-pressed", x === pt)); offset = region()[0]; if (rows[0].buf) play(offset); return; }
      const w = e.target.closest(".wave");
      if (w && rows[0].buf) {
        const r = w.getBoundingClientRect(), f = (e.clientX - r.left) / r.width; offset = f * LEN;
        const [a, b] = region(); if (offset < a || offset >= b) { part = "tutta"; root.querySelectorAll("[data-part]").forEach(x => x.setAttribute("aria-pressed", x.dataset.part === "tutta")); }
        if (playing) play(offset); else draw();
      }
    });
    root.addEventListener("pointermove", e => { const w = e.target.closest(".wave"); if (w) { const r = w.getBoundingClientRect(); hoverF = (e.clientX - r.left) / r.width; } else hoverF = -1; if (!raf) draw(); });
    root.addEventListener("pointerleave", () => { hoverF = -1; if (!raf) draw(); });
    new ResizeObserver(() => { if (!raf) draw(); }).observe(root);
    draw();
  };
})();
