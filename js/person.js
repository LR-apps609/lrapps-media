/* Il personaggio delle videochiamate: illustrazione morbida, luce da sinistra, lineamenti appena accennati.
   drawPerson(ctx, cx, top, s, t, light): s è l'altezza della testa in pixel. */
(function () {
  const TAU = Math.PI * 2;
  window.drawPerson = function (c, cx, top, s, t, light = 0) {
    const hw = s * 0.35, hy = top + s * 0.5, neckTop = top + s * 0.86, sh = top + s * 1.45;
    c.save();
    // ombra morbida dietro
    const sg = c.createRadialGradient(cx, sh + s * 0.4, s * 0.2, cx, sh + s * 0.4, s * 2.2);
    sg.addColorStop(0, "rgba(0,0,0,.28)"); sg.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = sg; c.fillRect(cx - s * 3, top - s, s * 6, s * 4.5);

    // busto: maglione con luce da sinistra
    const tg = c.createLinearGradient(cx - s * 1.6, 0, cx + s * 1.6, 0);
    tg.addColorStop(0, "#6F8F82"); tg.addColorStop(0.55, "#557367"); tg.addColorStop(1, "#3C5449");
    c.fillStyle = tg; c.beginPath();
    c.moveTo(cx - s * 1.28, top + s * 3.2);
    c.bezierCurveTo(cx - s * 1.26, sh + s * 0.3, cx - s * 0.98, sh - s * 0.02, cx - s * 0.36, sh - s * 0.16);
    c.lineTo(cx + s * 0.36, sh - s * 0.16);
    c.bezierCurveTo(cx + s * 0.98, sh - s * 0.02, cx + s * 1.26, sh + s * 0.3, cx + s * 1.28, top + s * 3.2);
    c.closePath(); c.fill();
    // pieghe e cuciture, appena visibili
    c.strokeStyle = "rgba(0,0,0,.12)"; c.lineWidth = s * 0.03;
    c.beginPath(); c.moveTo(cx - s * 0.72, sh + s * 0.15); c.quadraticCurveTo(cx - s * 0.8, sh + s * 0.9, cx - s * 0.76, top + s * 3.2); c.stroke();
    c.beginPath(); c.moveTo(cx + s * 0.72, sh + s * 0.15); c.quadraticCurveTo(cx + s * 0.8, sh + s * 0.9, cx + s * 0.76, top + s * 3.2); c.stroke();

    // collo
    const ng = c.createLinearGradient(cx - s * 0.2, 0, cx + s * 0.2, 0);
    ng.addColorStop(0, "#D9A98B"); ng.addColorStop(1, "#B98468");
    c.fillStyle = ng; c.beginPath();
    c.moveTo(cx - s * 0.14, neckTop); c.lineTo(cx - s * 0.16, sh - s * 0.12); c.quadraticCurveTo(cx, sh + s * 0.06, cx + s * 0.16, sh - s * 0.12); c.lineTo(cx + s * 0.14, neckTop); c.closePath(); c.fill();
    c.fillStyle = "rgba(80,40,20,.18)"; c.beginPath(); c.ellipse(cx, neckTop + s * 0.04, s * 0.18, s * 0.07, 0, 0, Math.PI); c.fill();
    // girocollo
    c.strokeStyle = "#465F54"; c.lineWidth = s * 0.07; c.lineCap = "round";
    c.beginPath(); c.moveTo(cx - s * 0.3, sh - s * 0.15); c.quadraticCurveTo(cx, sh + s * 0.1, cx + s * 0.3, sh - s * 0.15); c.stroke();

    // orecchie
    c.fillStyle = "#CF9C7E";
    [-1, 1].forEach(k => { c.beginPath(); c.ellipse(cx + k * hw * 0.98, hy + s * 0.04, s * 0.07, s * 0.12, 0, 0, TAU); c.fill(); });
    // viso
    const fg = c.createRadialGradient(cx - hw * 0.35, hy - s * 0.12, s * 0.05, cx, hy, s * 0.62);
    fg.addColorStop(0, "#F0CAAE"); fg.addColorStop(0.6, "#DDAA8C"); fg.addColorStop(1, "#BF8A6C");
    c.fillStyle = fg; c.beginPath();
    c.moveTo(cx, top + s * 0.02);
    c.bezierCurveTo(cx + hw * 1.12, top + s * 0.02, cx + hw * 1.06, top + s * 0.72, cx + hw * 0.55, top + s * 0.92);
    c.quadraticCurveTo(cx, top + s * 1.04, cx - hw * 0.55, top + s * 0.92);
    c.bezierCurveTo(cx - hw * 1.06, top + s * 0.72, cx - hw * 1.12, top + s * 0.02, cx, top + s * 0.02);
    c.fill();
    // luce sul volto (comando «Luce sul volto»)
    if (light > 0) { const lg = c.createRadialGradient(cx - hw * 0.2, hy - s * 0.05, 0, cx, hy, s * 0.7); lg.addColorStop(0, `rgba(255,240,222,${0.35 * light})`); lg.addColorStop(1, "rgba(255,240,222,0)"); c.fillStyle = lg; c.fill(); }
    // guance
    c.fillStyle = "rgba(214,120,100,.16)";
    [-1, 1].forEach(k => { c.beginPath(); c.ellipse(cx + k * hw * 0.55, hy + s * 0.16, s * 0.1, s * 0.06, 0, 0, TAU); c.fill(); });
    // occhi, con un battito ogni tanto
    const blink = (t % 4.3) < 0.12 ? 0.15 : 1;
    c.fillStyle = "#2E221C";
    [-1, 1].forEach(k => { c.beginPath(); c.ellipse(cx + k * hw * 0.38, hy + s * 0.02, s * 0.035, s * 0.045 * blink, 0, 0, TAU); c.fill(); });
    c.strokeStyle = "rgba(60,38,28,.65)"; c.lineWidth = s * 0.025; c.lineCap = "round";
    [-1, 1].forEach(k => { c.beginPath(); c.moveTo(cx + k * hw * 0.22, hy - s * 0.1); c.quadraticCurveTo(cx + k * hw * 0.4, hy - s * 0.14, cx + k * hw * 0.56, hy - s * 0.09); c.stroke(); });
    // naso e bocca, solo un accenno
    c.strokeStyle = "rgba(150,90,64,.45)"; c.lineWidth = s * 0.022;
    c.beginPath(); c.moveTo(cx + s * 0.01, hy + s * 0.04); c.quadraticCurveTo(cx + s * 0.05, hy + s * 0.17, cx - s * 0.03, hy + s * 0.19); c.stroke();
    c.strokeStyle = "rgba(150,70,60,.6)"; c.lineWidth = s * 0.028;
    c.beginPath(); c.moveTo(cx - s * 0.11, hy + s * 0.3); c.quadraticCurveTo(cx, hy + s * 0.355, cx + s * 0.11, hy + s * 0.3); c.stroke();
    // capelli: volume sopra e ai lati, con un riflesso
    const hg = c.createLinearGradient(cx - hw, top - s * 0.1, cx + hw, top + s * 0.5);
    hg.addColorStop(0, "#4A3428"); hg.addColorStop(0.5, "#2F2019"); hg.addColorStop(1, "#1F1510");
    c.fillStyle = hg; c.beginPath();
    c.moveTo(cx - hw * 1.08, hy + s * 0.02);
    c.bezierCurveTo(cx - hw * 1.25, top - s * 0.12, cx - hw * 0.2, top - s * 0.24, cx + hw * 0.4, top - s * 0.12);
    c.bezierCurveTo(cx + hw * 1.3, top - s * 0.02, cx + hw * 1.22, hy - s * 0.1, cx + hw * 1.08, hy + s * 0.02);
    c.bezierCurveTo(cx + hw * 0.98, hy - s * 0.2, cx + hw * 0.7, top + s * 0.2, cx + hw * 0.1, top + s * 0.16);
    c.bezierCurveTo(cx - hw * 0.45, top + s * 0.13, cx - hw * 0.92, top + s * 0.3, cx - hw * 1.08, hy + s * 0.02);
    c.fill();
    c.strokeStyle = "rgba(255,230,210,.14)"; c.lineWidth = s * 0.04;
    c.beginPath(); c.moveTo(cx - hw * 0.6, top - s * 0.02); c.quadraticCurveTo(cx - hw * 0.1, top - s * 0.12, cx + hw * 0.4, top - s * 0.05); c.stroke();
    c.restore();
    return { cx, hy, s };
  };

  /* La stanza dietro: parete calda, finestra luminosa, libreria, pianta, lampada */
  window.drawRoom = function (c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#3A4A45"); g.addColorStop(1, "#232E2B"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const wg = c.createLinearGradient(w * 0.06, 0, w * 0.32, 0); wg.addColorStop(0, "#C9D8D1"); wg.addColorStop(1, "#9DB3AA");
    c.fillStyle = "#2B3936"; c.fillRect(w * 0.05, h * 0.1, w * 0.28, h * 0.5);
    c.fillStyle = wg; c.fillRect(w * 0.065, h * 0.125, w * 0.25, h * 0.45);
    c.fillStyle = "rgba(255,245,225,.35)"; c.fillRect(w * 0.065, h * 0.125, w * 0.25, h * 0.45);
    c.fillStyle = "#2B3936"; c.fillRect(w * 0.186, h * 0.125, w * 0.008, h * 0.45); c.fillRect(w * 0.065, h * 0.34, w * 0.25, h * 0.012);
    const lg = c.createRadialGradient(w * 0.19, h * 0.35, 0, w * 0.19, h * 0.35, w * 0.4); lg.addColorStop(0, "rgba(255,240,215,.16)"); lg.addColorStop(1, "rgba(255,240,215,0)"); c.fillStyle = lg; c.fillRect(0, 0, w, h);
    c.fillStyle = "#2C2621"; c.fillRect(w * 0.69, h * 0.08, w * 0.26, h * 0.66);
    const books = ["#8FA199", "#E3B162", "#627A71", "#C9795F", "#B2BFB7", "#9FD0B6", "#7A6B8E"];
    for (let r = 0; r < 3; r++) {
      let x = w * 0.705;
      for (let i = 0; i < 9 && x < w * 0.93; i++) { const bw = w * (0.014 + ((i * 7 + r * 3) % 5) * 0.003), bh = h * (0.12 + ((i * 5 + r) % 4) * 0.012); c.fillStyle = books[(i + r * 2) % books.length]; c.fillRect(x, h * (0.27 + r * 0.2) - bh, bw, bh); x += bw + w * 0.003; }
      c.fillStyle = "#3D342D"; c.fillRect(w * 0.69, h * (0.27 + r * 0.2), w * 0.26, h * 0.015);
    }
    c.fillStyle = "#6E5A48"; c.fillRect(w * 0.08, h * 0.72, w * 0.07, h * 0.12);
    [[0.115, 0.66, 0.05, -0.5], [0.09, 0.62, 0.045, -1], [0.14, 0.6, 0.045, 0.6], [0.115, 0.56, 0.04, 0], [0.07, 0.68, 0.04, -1.3], [0.16, 0.67, 0.04, 1.1]].forEach(([x, y, r, a], i) => {
      c.fillStyle = i % 2 ? "#4F7A5A" : "#3F6B4D"; c.beginPath(); c.ellipse(w * x, h * y, w * r, w * r * 0.42, a, 0, TAU); c.fill();
    });
    const lamp = c.createRadialGradient(w * 0.6, h * 0.2, 0, w * 0.6, h * 0.2, w * 0.18); lamp.addColorStop(0, "rgba(255,214,160,.35)"); lamp.addColorStop(1, "rgba(255,214,160,0)"); c.fillStyle = lamp; c.fillRect(0, 0, w, h);
    c.fillStyle = "#1D2523"; c.fillRect(0, h * 0.88, w, h * 0.12);
  };
})();
