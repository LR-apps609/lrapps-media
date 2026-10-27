/* WebcamLR · tocchi sul telefono, cambia sul computer.
   I comandi a sinistra sono quelli dell'app; il video a destra li applica subito, senza fermarsi. */
(function () {
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;

  window.startWebcamDemo = function (root) {
    if (root.dataset.ready) return; root.dataset.ready = "1";
    const cv = root.querySelector(".wc-video canvas"), status = root.querySelector(".wc-status"), proNote = root.querySelector(".wc-pro"), pcv = root.querySelector(".wc-phone-cv"), pstat = root.querySelector(".wc-phone-status");
    const st = { mirror: false, blur: true, light: false, frame: false, res: "720", link: "wifi", fx: 0.5, fy: 0.42, tfx: 0.5, tfy: 0.42 };
    const view = { blur: 1, light: 0, mirror: 0, zoom: 0, sharp: 0 };
    const PRO = { frame: true, "1080": true, "4k": true };

    function sync() {
      root.querySelectorAll("[data-t]").forEach(b => b.setAttribute("aria-pressed", !!st[b.dataset.t]));
      root.querySelectorAll("[data-res]").forEach(b => b.setAttribute("aria-pressed", st.res === b.dataset.res));
      root.querySelectorAll("[data-link]").forEach(b => b.setAttribute("aria-pressed", st.link === b.dataset.link));
      const fps = st.res === "4k" ? 30 : st.res === "1080" ? 60 : 30;
      const label = { "720": "720p", "1080": "1080p", "4k": "4K" }[st.res];
      status.textContent = `${label} · ${fps} fps · ${st.link === "usb" ? "cavo USB" : "Wi-Fi"}`;
      if (pstat) pstat.textContent = `${label} · ${st.link === "usb" ? "USB" : "Wi-Fi"}`;
      const pro = st.frame || st.res !== "720";
      proNote.hidden = !pro;
      wake();
    }
    root.addEventListener("click", e => {
      const t = e.target.closest("[data-t]"), r = e.target.closest("[data-res]"), l = e.target.closest("[data-link]");
      if (t) st[t.dataset.t] = !st[t.dataset.t];
      if (r) st.res = r.dataset.res;
      if (l) st.link = l.dataset.link;
      if (t || r || l) sync();
    });
    const vbox = root.querySelector(".wc-video");
    vbox.addEventListener("pointermove", e => { const b = vbox.getBoundingClientRect(); st.tfx = (e.clientX - b.left) / b.width; st.tfy = (e.clientY - b.top) / b.height; wake(); });
    vbox.addEventListener("pointerleave", () => { st.tfx = 0.5; st.tfy = 0.42; wake(); });

    function scene(c, w, h, t, bg, light) {
      if (bg) { window.drawRoom(c, w, h); return; }
      const sway = REDUCE ? 0 : Math.sin(t * 0.7) * w * 0.01, bob = REDUCE ? 0 : Math.sin(t * 1.1) * h * 0.004;
      return window.drawPerson(c, w * 0.5 + sway, h * 0.2 + bob, h * 0.3, t, light);
    }

    let raf = 0, visible = false, t0 = performance.now();
    function frame(now) {
      raf = 0;
      const t = (now - t0) / 1000, k = REDUCE ? 1 : 0.1;
      view.blur += ((st.blur ? 1 : 0) - view.blur) * k; view.light += ((st.light ? 1 : 0) - view.light) * k;
      view.mirror += ((st.mirror ? 1 : 0) - view.mirror) * (REDUCE ? 1 : 0.14); view.zoom += ((st.frame ? 1 : 0) - view.zoom) * (REDUCE ? 1 : 0.06);
      view.sharp += ({ "720": 0, "1080": 0.6, "4k": 1 }[st.res] - view.sharp) * k;
      st.fx += (st.tfx - st.fx) * 0.15; st.fy += (st.tfy - st.fy) * 0.15;
      const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (!w) return;
      // la risoluzione si vede: in 720p l'immagine è disegnata più piccola e poi ingrandita
      const q = 0.42 + 0.58 * view.sharp, iw = Math.max(80, Math.round(w * dpr * q)), ih = Math.max(45, Math.round(h * dpr * q));
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      const off = frame.off || (frame.off = document.createElement("canvas"));
      off.width = iw; off.height = ih;
      const o = off.getContext("2d");
      o.save();
      const flip = 1 - 2 * view.mirror; o.translate(iw / 2, ih / 2); o.scale(flip, 1); o.translate(-iw / 2, -ih / 2);
      const z = 1 + view.zoom * 0.45; o.translate(iw / 2, ih * 0.42); o.scale(z, z); o.translate(-iw / 2, -ih * 0.42);
      o.save(); if ("filter" in o) o.filter = `blur(${(view.blur * 9 * q).toFixed(1)}px)`; scene(o, iw, ih, t, true); o.restore();
      scene(o, iw, ih, t, false, view.light);
      o.restore();
      const c = cv.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, cv.width, cv.height);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      // il fuoco: riquadro che segue il cursore
      const bx = st.fx * w, by = st.fy * h, bw = Math.min(w, h) * 0.22, bh = bw * 0.75;
      c.strokeStyle = "#9FD0B6"; c.lineWidth = 2;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { const x = bx + sx * bw / 2, y = by + sy * bh / 2; c.beginPath(); c.moveTo(x, y - sy * 12); c.lineTo(x, y); c.lineTo(x - sx * 12, y); c.stroke(); });
      // il telefono mostra sempre quello che inquadra
      if (pcv) {
        const pw = pcv.clientWidth, ph = pcv.clientHeight;
        if (pw && ph) {
          if (pcv.width !== Math.round(pw * dpr)) { pcv.width = Math.round(pw * dpr); pcv.height = Math.round(ph * dpr); }
          const pc = pcv.getContext("2d"), sh = off.height, sw = sh * pw / ph, sx = (off.width - sw) / 2;
          pc.setTransform(1, 0, 0, 1, 0, 0); pc.drawImage(off, sx, 0, sw, sh, 0, 0, pcv.width, pcv.height);
        }
      }
      if (visible && !REDUCE) raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf && visible) raf = requestAnimationFrame(frame); }
    new IntersectionObserver(es => { visible = es[0].isIntersecting && !root.closest("[hidden]"); if (visible) wake(); }).observe(root);
    new ResizeObserver(wake).observe(cv);
    sync();
  };
})();
