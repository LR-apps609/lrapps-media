/* OrbitLR · la scrivania: trascini un file su Orbit, la torta si apre con le azioni giuste
   per quel file, scegli e il risultato finisce accanto all'originale.
   Una foto vera lasciata cadere qui viene convertita davvero, nel browser. */
(function () {
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // i sei colori del logo di OrbitLR
  const COLORS = [["#F7DA8A", "#E0B65E"], ["#9CD8B5", "#5C9A7C"], ["#82A4F5", "#3F55C0"], ["#A57AF5", "#5E34D6"], ["#F28682", "#C7444B"], ["#F3A974", "#D86D45"]];
  const FILES = [
    { id: "foto", name: "Vacanze", ext: "heic", size: "4,8 MB", kind: "Foto", actions: [
      ["JPG", "La foto che si apre ovunque", "Vacanze.jpg", "1,9 MB"],
      ["WEBP", "Stessa foto, molto più leggera", "Vacanze.webp", "1,1 MB"],
      ["Sotto 200 KB", "Per moduli, documenti e visti", "Vacanze.jpg", "196 KB"],
      ["Togli GPS", "Via posizione e fotocamera, stessa qualità", "Vacanze.heic", "4,8 MB"],
      ["PDF", "Una pagina pronta da mandare", "Vacanze.pdf", "2,0 MB"]
    ]},
    { id: "video", name: "Intervista", ext: "mov", size: "1,2 GB", kind: "Video", actions: [
      ["Comprimi", "Stessa qualità, circa metà peso", "Intervista.mp4", "590 MB"],
      ["WhatsApp", "Sotto il limite, senza pensarci", "Intervista.mp4", "15,6 MB"],
      ["Togli i silenzi", "Restano solo i pezzi in cui si parla", "Intervista.mov", "−3:12"],
      ["Sottotitoli", "Parola per parola, calcolati sul Mac", "Intervista.srt", "14 KB"],
      ["Reels 9:16", "Forma, qualità e fluidità giuste", "Intervista-reels.mp4", "48 MB"],
      ["GIF", "Un pezzo, in loop", "Intervista.gif", "6,2 MB"]
    ]},
    { id: "link", name: "youtube.com/watch?v=…", ext: "", kind: "Link copiato", size: "incolla e scegli", actions: [
      ["MP4 1080p", "Il video, pronto per ogni schermo", "Video.mp4", "84 MB"],
      ["Massima qualità", "La risoluzione più alta del sito", "Video.mp4", "312 MB"],
      ["Solo audio", "M4A, come l'originale", "Audio.m4a", "5,2 MB"],
      ["MP3", "Si ascolta ovunque", "Audio.mp3", "4,9 MB"]
    ]},
    { id: "doc", name: "Contratto", ext: "docx", size: "86 KB", kind: "Documento", actions: [
      ["PDF", "Uguale su ogni computer", "Contratto.pdf", "240 KB"],
      ["Pagina web", "Da aprire nel browser", "Contratto.html", "52 KB"],
      ["Solo testo", "Senza formattazione", "Contratto.txt", "18 KB"]
    ]},
    { id: "audio", name: "Nota vocale", ext: "m4a", size: "3,1 MB", kind: "Audio", actions: [
      ["Trascrivi", "Il testo di quello che hai detto", "Nota vocale.txt", "4 KB"],
      ["Voce più pulita", "Meno ronzio, volume uniforme", "Nota vocale.m4a", "3,1 MB"],
      ["MP3", "Si ascolta ovunque", "Nota vocale.mp3", "2,4 MB"],
      ["Suoneria", "30 secondi per l'iPhone", "Nota vocale.m4r", "480 KB"]
    ]}
  ];
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const PREVIEW = {
    foto: `<i class="pv-photo"></i>`,
    video: `<i class="pv-video"><b>12:40</b></i>`,
    doc: `<i class="pv-doc"></i>`,
    audio: `<i class="pv-audio">${Array.from({ length: 9 }, (_, k) => `<u style="height:${[30, 60, 85, 45, 100, 70, 40, 75, 35][k]}%"></u>`).join("")}</i>`,
    link: `<i class="pv-link"></i>`
  };
  const fileIcon = f => `<span class="of-ico" data-k="${f.id}">${PREVIEW[f.id] || ""}<span>${esc((f.ext || "URL").toUpperCase())}</span></span>`;
  const full = f => f.ext ? `${f.name}.${f.ext}` : f.name;
  const bytes = t => { const m = /([\d,]+)\s*(KB|MB|GB)/.exec(t || ""); return m ? parseFloat(m[1].replace(",", ".")) * { KB: 1e3, MB: 1e6, GB: 1e9 }[m[2]] : 0; };
  const human = b => b >= 1e9 ? (b / 1e9).toFixed(1).replace(".", ",") + " GB" : Math.round(b / 1e6) + " MB";

  window.startOrbitDesk = function (root) {
    if (root.dataset.ready) return; root.dataset.ready = "1";
    const desk = root.querySelector(".od-files"), core = root.querySelector(".od-core"), ring = root.querySelector(".od-ring");
    const caption = root.querySelector(".od-caption"), result = root.querySelector(".od-result"), picker = root.querySelector(".od-up input");
    const files = FILES.slice();
    let current = null, hover = -1, busy = false, saved = 3.4e9;
    const savedEl = root.querySelector(".od-saved b");

    function renderDesk() {
      desk.innerHTML = files.map((f, i) => `<button type="button" class="of" data-i="${i}">${f.thumb ? `<span class="of-ico of-thumb" style="background-image:url(${f.thumb})"></span>` : fileIcon(f)}<span class="of-txt"><b>${esc(full(f))}</b><small>${esc(f.kind)} · ${esc(f.size)}</small></span></button>`).join("");
    }
    renderDesk();

    /* Il logo a riposo e la torta aperta usano la stessa geometria */
    const R0 = 86, R1 = 150;
    const P = (r, a) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
    const sector = (a0, a1, r0, r1) => `M${P(r0, a0)} A${r0} ${r0} 0 0 1 ${P(r0, a1)} L${P(r1, a1)} A${r1} ${r1} 0 0 0 ${P(r1, a0)} Z`;
    function drawRing(n, labels) {
      const gap = 0.03, step = Math.PI * 2 / n, start = -Math.PI / 2 - step / 2;
      let html = `<defs>${COLORS.map((c, i) => `<linearGradient id="og${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>`).join("")}</defs>`;
      for (let i = 0; i < n; i++) {
        const a0 = start + i * step + gap, a1 = start + (i + 1) * step - gap, mid = (a0 + a1) / 2;
        const lx = Math.cos(mid) * (R1 + 34), ly = Math.sin(mid) * (R1 + 34), anchor = Math.abs(Math.cos(mid)) < 0.25 ? "middle" : Math.cos(mid) > 0 ? "start" : "end";
        html += `<g class="seg" data-i="${i}" style="--mx:${Math.cos(mid).toFixed(3)};--my:${Math.sin(mid).toFixed(3)};--d:${i * 40}ms">
          <path d="${sector(a0, a1, R0, R1)}" fill="url(#og${i % 6})" stroke="url(#og${i % 6})" stroke-width="6" stroke-linejoin="round"/>
          ${labels ? `<text x="${lx.toFixed(1)}" y="${(ly - 7).toFixed(1)}" text-anchor="${anchor}">${esc(labels[i][0])}<tspan class="sz" x="${lx.toFixed(1)}" dy="18">${esc(labels[i][1] || "")}</tspan></text>` : ""}</g>`;
      }
      html += `<circle class="hole" r="${R0 - 10}"/>`;
      ring.innerHTML = html;
      ring.classList.toggle("open", !!labels);
      requestAnimationFrame(() => ring.classList.add("in"));
    }
    drawRing(6, null);
    const idleCore = () => core.innerHTML = `<span class="od-drop">Trascina qui<br>un file</span>`;
    idleCore();

    function setCaption(main, sub) { caption.innerHTML = `<b>${esc(main)}</b><span>${esc(sub)}</span>`; }
    setCaption("Trascina un file su Orbit", "Oppure toccalo. Puoi anche lasciar cadere qui una tua foto.");

    function open(i) {
      current = files[i]; hover = -1; result.hidden = true;
      core.innerHTML = `${current.thumb ? `<span class="of-ico of-thumb" style="background-image:url(${current.thumb})"></span>` : fileIcon(current)}<b>${esc(full(current))}</b><small>${esc(current.size)}</small>`;
      ring.classList.remove("in");
      drawRing(current.actions.length, current.actions.map(a => [a[0], a[3] && !/^−/.test(a[3]) ? "≈ " + a[3] : a[3] || ""]));
      root.classList.add("has-file");
      setCaption(current.id === "link" ? "Cosa vuoi scaricare?" : `Cosa vuoi fare con ${full(current)}?`, "Punta uno spicchio e clicca.");
    }
    function pick(i) {
      if (!current || i === hover) return; hover = i;
      ring.querySelectorAll(".seg").forEach((g, k) => { g.classList.toggle("hot", k === i); g.classList.toggle("dim", i >= 0 && k !== i); });
      if (i >= 0) setCaption(current.actions[i][0], current.actions[i][1]);
    }
    async function run(i) {
      if (!current || busy) return; busy = true;
      const a = current.actions[i];
      root.classList.add("working");
      let name = a[2], size = a[3], thumb = null, note = "Salvato accanto all'originale";
      if (current.real) {
        try { const r = await current.real(a); name = r.name; size = r.size; thumb = r.thumb; note = `Fatto nel tuo browser: ${current.size} → ${r.size}. Il file non è uscito dal computer.`; }
        catch (e) { note = "Questo formato il browser non lo apre. OrbitLR sì."; }
      } else await new Promise(r => setTimeout(r, REDUCE ? 0 : 900));
      root.classList.remove("working");
      const before = bytes(current.size), after = bytes(size), gain = current.id !== "link" && before && after && after < before ? before - after : 0;
      if (gain) { saved += gain; if (savedEl) savedEl.textContent = human(saved); }
      result.hidden = false;
      result.innerHTML = `${thumb ? `<span class="of-ico of-thumb" style="background-image:url(${thumb})"></span>` : fileIcon({ id: current.id, ext: name.split(".").pop() })}
        <span class="of-txt"><b>${esc(name)}</b><small>${esc(size)}</small></span>
        ${before && after ? `<span class="od-bars"><span><i style="width:100%"></i><small>Prima · ${esc(current.size)}</small></span><span><i class="after" style="width:${Math.max(3, Math.min(100, after / before * 100)).toFixed(1)}%"></i><small>Dopo · ${esc(size)}${gain ? ` · −${Math.round(gain / before * 100)}%` : ""}</small></span></span>` : ""}
        <span class="od-note">${esc(note)}</span>
        <button type="button" class="od-again">Un altro file</button>`;
      setCaption("Fatto", current.real ? "Con OrbitLR lo ritrovi accanto all'originale." : "Esempio: con i tuoi file OrbitLR lo fa davvero, sul Mac.");
      busy = false;
    }
    function reset() {
      current = null; hover = -1; result.hidden = true; root.classList.remove("has-file");
      idleCore(); ring.classList.remove("in"); drawRing(6, null);
      setCaption("Trascina un file su Orbit", "Oppure toccalo. Puoi anche lasciar cadere qui una tua foto.");
    }

    /* Puntare gli spicchi: conta l'angolo del cursore rispetto al centro */
    root.addEventListener("pointermove", e => {
      if (!current || dragging) return;
      const r = ring.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) / (r.width / 2);
      if (d < 0.25 || d > 1.35) return pick(-1);
      const n = current.actions.length, step = Math.PI * 2 / n;
      let a = Math.atan2(dy, dx) + Math.PI / 2 + step / 2; a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      pick(Math.floor(a / step) % n);
    });
    ring.addEventListener("click", () => { if (hover >= 0) run(hover); });
    root.addEventListener("click", e => { if (e.target.closest(".od-again")) reset(); });

    /* Trascinare un file dalla scrivania */
    let dragging = null;
    desk.addEventListener("pointerdown", e => {
      const b = e.target.closest(".of"); if (!b) return;
      const r = b.getBoundingClientRect();
      dragging = { i: +b.dataset.i, el: b, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, moved: false, ghost: null };
      b.setPointerCapture(e.pointerId);
    });
    desk.addEventListener("pointermove", e => {
      if (!dragging) return;
      if (!dragging.moved && Math.hypot(e.clientX - dragging.sx, e.clientY - dragging.sy) < 6) return;
      if (!dragging.moved) {
        dragging.moved = true;
        const g = dragging.el.cloneNode(true); g.classList.add("of-ghost"); root.appendChild(g); dragging.ghost = g; dragging.el.classList.add("lifted");
      }
      const rr = root.getBoundingClientRect();
      dragging.ghost.style.transform = `translate(${e.clientX - rr.left - dragging.ox}px, ${e.clientY - rr.top - dragging.oy}px) rotate(-3deg)`;
      const cr = ring.getBoundingClientRect(), near = Math.hypot(e.clientX - (cr.left + cr.width / 2), e.clientY - (cr.top + cr.height / 2)) < cr.width * 0.55;
      root.classList.toggle("magnet", near);
    });
    const endDrag = e => {
      if (!dragging) return;
      const d = dragging; dragging = null;
      d.el.classList.remove("lifted");
      const over = root.classList.contains("magnet"); root.classList.remove("magnet");
      if (d.ghost) d.ghost.remove();
      if (!d.moved || over) open(d.i);
    };
    desk.addEventListener("pointerup", endDrag);
    desk.addEventListener("pointercancel", () => { if (dragging && dragging.ghost) dragging.ghost.remove(); dragging = null; root.classList.remove("magnet"); });

    /* Tastiera: frecce tra gli spicchi, Invio per scegliere, Esc per tornare */
    root.addEventListener("keydown", e => {
      if (!current) return;
      const n = current.actions.length;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); pick(((hover < 0 ? -1 : hover) + 1) % n); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); pick(((hover < 0 ? 0 : hover) + n - 1) % n); }
      else if (e.key === "Enter" && hover >= 0 && !e.target.closest(".of, .od-again")) { e.preventDefault(); run(hover); }
      else if (e.key === "Escape") reset();
    });

    /* Una foto vera: conversione reale con il canvas del browser */
    function addReal(file) {
      if (!file || !/^image\//.test(file.type)) { setCaption("Solo foto, qui", "Nel browser si provano le foto. OrbitLR fa anche video, audio e documenti."); return; }
      const url = URL.createObjectURL(file), base = file.name.replace(/\.[^.]+$/, "") || "Foto", ext = (file.name.split(".").pop() || "img").toLowerCase();
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"), s = Math.min(1, 160 / Math.max(img.width, img.height));
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const f = { id: "foto", name: base, ext, size: kb(file.size), kind: "La tua foto", thumb: c.toDataURL("image/jpeg", 0.8),
          actions: [["JPG", "Qualità 85%, si apre ovunque"], ["PNG", "Senza perdita"], ["WEBP", "Leggera, per il web"], ["Metà grandezza", "Lati dimezzati, JPG"], ["Sotto 200 KB", "Per moduli e documenti"]] };
        f.real = a => new Promise((res, rej) => {
          let w = img.width, h = img.height, type = "image/jpeg", q = 0.85, outExt = "jpg";
          if (a[0] === "PNG") { type = "image/png"; outExt = "png"; }
          if (a[0] === "WEBP") { type = "image/webp"; q = 0.8; outExt = "webp"; }
          if (a[0] === "Metà grandezza") { w = Math.round(w / 2); h = Math.round(h / 2); }
          const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, 0, 0, w, h);
          const done = blob => blob ? res({ name: `${base}.${outExt}`, size: kb(blob.size), thumb: f.thumb }) : rej();
          if (a[0] === "Sotto 200 KB") {
            let lo = 0.1, hi = 0.95, best = null, tries = 0, scale = 1;
            const attempt = () => {
              const qq = (lo + hi) / 2; cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale); cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
              cv.toBlob(b => {
                if (!b) return rej();
                if (b.size <= 200 * 1024) { best = b; lo = qq; } else hi = qq;
                if (++tries < 7) return attempt();
                if (!best && scale > 0.2) { scale *= 0.6; lo = 0.1; hi = 0.95; tries = 0; return attempt(); }
                done(best || b);
              }, "image/jpeg", qq);
            };
            attempt();
          } else cv.toBlob(done, type, q);
        });
        files.unshift(f); if (files.length > 6) files.splice(6, 1);
        renderDesk(); open(0);
      };
      img.onerror = () => setCaption("Questa foto il browser non la apre", "Succede con le HEIC fuori da Safari. OrbitLR le apre.");
      img.src = url;
    }
    root.addEventListener("dragover", e => { if ([...e.dataTransfer.types].includes("Files")) { e.preventDefault(); root.classList.add("magnet"); } });
    root.addEventListener("dragleave", e => { if (!root.contains(e.relatedTarget)) root.classList.remove("magnet"); });
    root.addEventListener("drop", e => { e.preventDefault(); root.classList.remove("magnet"); addReal(e.dataTransfer.files[0]); });
    picker.addEventListener("change", () => { addReal(picker.files[0]); picker.value = ""; });
  };
})();
