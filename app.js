/* Cosmos UI blocks — one self-contained animation loop per box.
   Icons and timing curves are taken verbatim from hero-loading-animations. */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, REDUCED ? Math.min(ms, 60) : ms));

const SPINNER = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="6" cy="6" r="4.6" opacity="0.25"/><path d="M10.6 6a4.6 4.6 0 0 0-4.6-4.6"/></svg>';
const MAGNIFIER = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="5.2" cy="5.2" r="3.4"/><path d="M8 8l2.6 2.6"/><circle class="t-scan" cx="5.2" cy="5.2" r="3.4" stroke="#e8eaf0" stroke-dasharray="4.8 16.6"/></svg>';
const CHECK_IC = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.4 6.4l2.3 2.3 4.9-5.4"/></svg>';

/* ======================================================================== */
/* 1. QUESTION CARD                                                          */
/* ======================================================================== */

(function questionLoop() {
  const card = document.getElementById("qCard");
  if (!card) return;
  const opts = [...card.querySelectorAll(".q-opt")];
  const go = card.querySelector(".q-go");

  const sweep = (el) => {
    el.classList.remove("is-sweep");
    void el.offsetWidth;
    el.classList.add("is-sweep");
  };

  const reset = () => {
    card.classList.remove("is-out");
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";
    opts.forEach((o) => { o.classList.remove("is-sel", "is-pop"); o.setAttribute("aria-checked", "false"); });
    go.classList.add("is-idle");
    go.classList.remove("is-arm", "is-bloom");
  };

  const select = (i) => {
    opts.forEach((o, j) => {
      o.classList.toggle("is-sel", j === i);
      o.setAttribute("aria-checked", j === i ? "true" : "false");
      o.classList.remove("is-pop");
    });
    const el = opts[i];
    void el.offsetWidth;
    el.classList.add("is-pop");
    go.classList.remove("is-idle");
    go.classList.add("is-arm");
    setTimeout(() => go.classList.remove("is-arm"), 220);
  };

  const run = async () => {
    for (;;) {
      reset();
      sweep(card);
      await sleep(760);
      for (let i = 0; i < opts.length; i++) {
        select(i);
        await sleep(980);
      }
      // a white bloom, armed on Continue once a choice is made
      go.classList.add("is-bloom");
      await sleep(2000);
      go.classList.remove("is-bloom");
      await sleep(160);
      card.classList.add("is-out");
      await sleep(1100);
    }
  };

  run();
})();

/* ======================================================================== */
/* 2. THINKING                                                               */
/* ======================================================================== */

(function thinkingLoop() {
  const wrap = document.getElementById("tWrap");
  if (!wrap) return;

  // label, detail text, the numeral inside it (for the count-up), dwell
  const STEPS = [
    ["Searching apps", "8 platforms", 8, 700],
    ["Importing Chats", "2,148 messages", 2148, 700],
    ["Importing Skills", "31 skills", 31, 700],
    ["Importing Rules", "36 rules", 36, 780],
  ];

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const fadeRemove = (node) => {
    if (!node || !node.parentNode) return;
    if (REDUCED) { node.remove(); return; }
    const a = node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease", fill: "forwards" });
    a.finished.then(() => node.remove()).catch(() => node.remove());
  };

  // the detail count: fades in, then the numeral counts up with an easeOutCubic settle
  const revealDetail = (node, text) => {
    node.textContent = text;
    if (REDUCED) return;
    node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: "ease-out", fill: "forwards" });
    const m = text.match(/\d[\d,]*/);
    if (!m) return;
    const end = parseInt(m[0].replace(/,/g, ""), 10);
    if (end < 2) return;
    const t0 = performance.now(), dur = 450;
    (function tick(now) {
      if (!node.isConnected) return;
      const k = Math.min(1, (now - t0) / dur);
      const v = Math.round(end * (1 - Math.pow(1 - k, 3)));
      node.textContent = text.replace(m[0], v.toLocaleString("en-US"));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  };

  const run = async () => {
    for (;;) {
      wrap.replaceChildren();

      // the reasoning row
      const think = el("div", "t-think");
      think.innerHTML = SPINNER;
      think.appendChild(el("span", null, "Thinking..."));
      wrap.appendChild(think);
      await sleep(880);
      if (!REDUCED) fadeRemove(think); else think.remove();
      await sleep(240);

      // the tool-use checklist
      for (const [label, detail, , dwell] of STEPS) {
        const prev = wrap.querySelector(".t-step.is-live");
        if (prev) {
          prev.classList.remove("is-live");
          prev.classList.add("is-done");
          const svg = prev.querySelector("svg");
          if (svg) svg.outerHTML = CHECK_IC;
        }
        const row = el("div", "t-step is-live");
        row.innerHTML = MAGNIFIER;
        row.appendChild(el("span", "t-label", label));
        const d = el("span", "t-detail");
        row.appendChild(d);
        wrap.appendChild(row);
        revealDetail(d, detail);
        await sleep(dwell);
      }

      const lastRow = wrap.querySelector(".t-step.is-live");
      if (lastRow) {
        lastRow.classList.remove("is-live");
        lastRow.classList.add("is-done");
        const svg = lastRow.querySelector("svg");
        if (svg) svg.outerHTML = CHECK_IC;
      }

      await sleep(420);
      wrap.appendChild(el("div", "t-note", "36 rules checked · 17 idle"));
      await sleep(2100);
    }
  };

  run();
})();

/* ======================================================================== */
/* 3. CODE BLOCK                                                             */
/* ======================================================================== */

(function codeLoop() {
  const host = document.getElementById("cCodeIn");
  const status = document.getElementById("cStatus");
  const copy = document.getElementById("cCopy");
  const card = document.getElementById("cCard");
  if (!host || !status) return;

  // pre-tokenised to match the exported card exactly
  const CODE = [
    [["tk-tag", "<!doctype html>"]],
    [["tk-tag", "<html lang="], ["tk-str", '"en"'], ["tk-tag", ">"]],
    [["tk-tag", "<head>"]],
    [["tk-pl", "  "], ["tk-tag", "<meta charset="], ["tk-str", '"utf-8"'], ["tk-tag", ">"]],
    [["tk-pl", "  "], ["tk-tag", "<title>"], ["tk-pl", "Input event demo"], ["tk-tag", "</title>"]],
    [["tk-pl", "  "], ["tk-tag", "<style>"]],
    [["tk-pl", "    "], ["tk-key", "body"], ["tk-pl", " { "], ["tk-key", "background"], ["tk-pl", ": "], ["tk-num", "#0d0d0f"], ["tk-pl", "; "], ["tk-key", "color"], ["tk-pl", ": "], ["tk-num", "#e6e6ea"], ["tk-pl", ";"]],
    [["tk-pl", "           "], ["tk-key", "font"], ["tk-pl", ": "], ["tk-num", "14px"], ["tk-pl", " "], ["tk-id", "system-ui"], ["tk-pl", ", "], ["tk-id", "sans-serif"], ["tk-pl", "; }"]],
    [["tk-pl", "    "], ["tk-key", "textarea, button"], ["tk-pl", " { "], ["tk-key", "font"], ["tk-pl", ": "], ["tk-pl", "inherit"], ["tk-pl", "; "], ["tk-key", "margin"], ["tk-pl", ": "], ["tk-hl", "8px"], ["tk-pl", " "], ["tk-num", "0"], ["tk-pl", "; }"]],
    [["tk-pl", "  "], ["tk-tag", "</style>"]],
    [["tk-tag", "</head>"]],
    [["tk-tag", "<body>"]],
    [["tk-pl", "  "], ["tk-tag", "<label for="], ["tk-str", '"demo"'], ["tk-tag", ">"], ["tk-pl", "Type here to test keyboard events"], ["tk-tag", "</label>"]],
    [["tk-pl", "  "], ["tk-tag", "<textarea id="], ["tk-str", '"demo"'], ["tk-tag", " rows="], ["tk-str", '"4"'], ["tk-tag", " cols="], ["tk-str", '"40"']],
  ];
  const PLAIN = CODE.map((line) => line.map(([, t]) => t).join("")).join("\n");

  copy?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(PLAIN); } catch { /* clipboard unavailable */ }
    copy.classList.add("is-hit");
    setTimeout(() => copy.classList.remove("is-hit"), 420);
  });

  const paintLine = (parts) => {
    const line = document.createElement("span");
    line.className = "c-line";
    for (const [cls, text] of parts) {
      const s = document.createElement("span");
      s.className = cls;
      s.textContent = text;
      line.appendChild(s);
    }
    return line;
  };

  const setStatus = (writing) => {
    status.classList.toggle("is-writing", writing);
    status.classList.remove("is-pop");
    status.lastChild.textContent = writing ? "Writing" : "Complete";
    if (!writing && !REDUCED) {
      void status.offsetWidth;
      status.classList.add("is-pop");
    }
  };

  const run = async () => {
    for (;;) {
      host.replaceChildren();
      setStatus(true);

      // the lines are block-level, so each already breaks — the caret rides
      // inside the line being painted rather than adding one of its own
      let caret = null;
      for (const parts of CODE) {
        if (caret) caret.remove();
        const line = paintLine(parts);
        caret = document.createElement("span");
        caret.className = "c-caret";
        line.appendChild(caret);
        host.appendChild(line);
        requestAnimationFrame(() => line.classList.add("is-in"));
        await sleep(120);
      }
      if (caret) caret.remove();

      setStatus(false);
      await sleep(2400);
    }
  };

  if (card) {
    card.classList.add("is-sweep");
    setTimeout(() => card.classList.remove("is-sweep"), 1500);
  }

  run();
})();

/* ======================================================================== */
/* 4. TASK COMPLETE                                                          */
/* ======================================================================== */

(function taskLoop() {
  const card = document.getElementById("dCard");
  const media = document.getElementById("dMedia");
  if (!card || !media) return;

  const replay = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  const run = async () => {
    for (;;) {
      card.classList.remove("is-out");
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";
      media.classList.remove("is-sheen");
      void media.offsetWidth;

      await sleep(340);
      replay(media, "is-sheen");
      replay(card, "is-sweep");
      await sleep(2800);

      card.classList.add("is-out");
      await sleep(340);
    }
  };

  run();
})();