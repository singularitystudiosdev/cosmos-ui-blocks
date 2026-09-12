/* ==========================================================================
   Variant A · Thread — conversation-first.
   One transcript, told as a chat column: message bubbles, every tool call
   folded into a burst container inside the thread, and the two clarifying
   questions rendered with the house question pattern.
   Mounts into #vThread (index.html). Loops forever; reduced motion renders
   the transcript once, static.
   ========================================================================== */

(function threadLoop() {
  const host = document.getElementById("vThread");
  if (!host) return;

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, REDUCED ? Math.min(ms, 60) : ms));

  const SPINNER = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="6" cy="6" r="4.6" opacity="0.25"/><path d="M10.6 6a4.6 4.6 0 0 0-4.6-4.6"/></svg>';
  const CHECK = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.4 6.4l2.3 2.3 4.9-5.4"/></svg>';
  const QUESTION = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2.2 3.2h7.6M4.8 3.2V2h2.4v1.2M3.4 3.2l.5 6.3c0 .5.4.9.9.9h2.4c.5 0 .9-.4.9-.9l.5-6.3"/></svg>';
  const ENTER = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2.6v3.2a1.6 1.6 0 0 1-1.6 1.6H2M4.2 5.2 2 7.4l2.2 2.2"/></svg>';
  const DOTS = '<span class="vt-dots"><i></i><i></i><i></i></span>';

  /* ---------- the transcript --------------------------------------------- */

  const OPEN = ["find_restaurants", "3 nearby"];
  const MENU = ["get_menu", "Big Mac · $5.89"];
  const DRAFT = ["draft_order", "Draft #A19"];
  const APPLY = ["apply_size", "Meal · $9.49"];
  const PLACE = ["place_order", "Placed · #A19"];

  const ASK_SIZE = {
    q: "What size?",
    opts: [["Regular meal", "$9.49"], ["Large meal", "$10.29"], ["Just the burger", "$5.89"]],
  };
  const ASK_FULFIL = {
    q: "Pickup or delivery?",
    opts: [["Pickup", "400 m"], ["Delivery", "+$3.99"]],
  };

  const USER_LINE = "order me a big mac";
  const FOUND = "Found it — Big Mac, $5.89.";
  const PLACED = "Placed · #A19 · ready in 12 min";

  /* ---------- helpers ----------------------------------------------------- */

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const replay = (node, cls) => {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  };

  /* ---------- the card ---------------------------------------------------- */

  const card = el("div", "vt-card ring");
  const scroll = el("div", "vt-scroll");
  card.appendChild(scroll);
  host.appendChild(card);

  /* ---------- builders ---------------------------------------------------- */

  const bubble = (kind, text) => {
    const row = el("div", "vt-row is-" + kind);
    const b = el("div", "vt-bub is-" + kind, text);
    row.appendChild(b);
    scroll.appendChild(row);
    return b;
  };

  // one mono row: glyph, tool name, state (a 3-dot shimmer while running,
  // a green tick and the one-line result once done)
  const callRow = (name, result) => {
    const row = el("div", "vt-call" + (result ? " is-done" : " is-run"));
    const ic = el("span", "vt-call-ic");
    ic.innerHTML = result ? CHECK : SPINNER;
    const st = el("span", "vt-call-st");
    if (result) st.textContent = result;
    else st.innerHTML = DOTS;
    row.append(ic, el("span", "vt-call-nm", name), st);
    return row;
  };

  const settle = (row, result) => {
    row.classList.remove("is-run");
    row.classList.add("is-done");
    row.querySelector(".vt-call-ic").innerHTML = CHECK;
    const st = row.querySelector(".vt-call-st");
    st.replaceChildren();
    st.textContent = result;
    if (!REDUCED) replay(st, "is-pop");
  };

  // a burst: one container per burst, its calls running one after another
  const burst = async (calls) => {
    const box = el("div", "vt-burst");
    scroll.appendChild(box);
    for (const [name, result] of calls) {
      const row = callRow(name, null);
      box.appendChild(row);
      await sleep(700);
      settle(row, result);
    }
    return box;
  };

  /* ---------- the question pattern ---------------------------------------- */

  const fillAsk = (panel, spec) => {
    panel.replaceChildren();

    const top = el("div", "vt-ask-top");
    top.innerHTML = QUESTION;
    top.appendChild(el("span", null, "Question"));
    panel.appendChild(top);

    panel.appendChild(el("div", "vt-ask-q", spec.q));

    const body = el("div", "vt-ask-body");
    for (const [label, meta] of spec.opts) {
      const opt = el("button", "vt-opt");
      opt.type = "button";
      opt.setAttribute("role", "radio");
      opt.setAttribute("aria-checked", "false");
      opt.append(el("span", "vt-radio"), el("span", "vt-opt-t", label), el("span", "vt-opt-m", meta));
      body.appendChild(opt);
    }
    panel.appendChild(body);

    const foot = el("div", "vt-ask-foot");
    const go = el("button", "vt-go is-idle");
    go.type = "button";
    go.innerHTML = '<span>Continue</span><span class="vt-go-kb">' + ENTER + "</span>";
    foot.appendChild(go);
    panel.appendChild(foot);
  };

  const buildAsk = (spec) => {
    const panel = el("div", "vt-ask");
    fillAsk(panel, spec);
    return panel;
  };

  const pick = (panel, i, animate) => {
    const opts = [...panel.querySelectorAll(".vt-opt")];
    opts.forEach((o, j) => {
      o.classList.toggle("is-sel", j === i);
      o.setAttribute("aria-checked", j === i ? "true" : "false");
      o.classList.remove("is-pop");
    });
    const go = panel.querySelector(".vt-go");
    go.classList.remove("is-idle");
    if (animate === false) {
      go.classList.add("is-arm");
      return;
    }
    replay(opts[i], "is-pop");
    go.classList.add("is-arm");
    setTimeout(() => go.classList.remove("is-arm"), 220);
  };

  const bloom = async (panel, ms) => {
    const go = panel.querySelector(".vt-go");
    go.classList.add("is-bloom");
    await sleep(ms);
    go.classList.remove("is-bloom");
  };

  const answer = async (panel, i, hold) => {
    pick(panel, i);
    await sleep(470);
    await bloom(panel, hold);
    panel.classList.add("is-fade");
    await sleep(200);
    panel.remove();
  };

  /* ---------- the loop ---------------------------------------------------- */

  const run = async () => {
    for (;;) {
      scroll.replaceChildren();
      card.classList.remove("is-out");
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";
      replay(card, "is-sweep");
      setTimeout(() => card.classList.remove("is-sweep"), 1500);
      await sleep(340);

      bubble("user", USER_LINE);
      await sleep(480);

      // the three opening calls land one by one
      await burst([OPEN, MENU, DRAFT]);
      await sleep(160);

      bubble("asst", FOUND);
      await sleep(560);

      // ask 1 — the size
      const sizePanel = buildAsk(ASK_SIZE);
      scroll.appendChild(sizePanel);
      await sleep(600);
      await answer(sizePanel, 0, 600);
      await sleep(120);

      // the answer is applied, then ask 2 rises in the panel's place
      await burst([APPLY]);
      await sleep(180);

      const fulfilPanel = buildAsk(ASK_FULFIL);
      scroll.appendChild(fulfilPanel);
      await sleep(620);
      await answer(fulfilPanel, 0, 520);
      await sleep(120);

      await burst([PLACE]);
      await sleep(160);

      const row = el("div", "vt-row is-asst");
      const finalBub = el("div", "vt-bub is-asst is-final");
      finalBub.innerHTML = CHECK;
      finalBub.appendChild(el("span", null, PLACED));
      row.appendChild(finalBub);
      scroll.appendChild(row);

      await sleep(1400);
      card.classList.add("is-out");
      await sleep(420);
    }
  };

  /* ---------- reduced motion: the same transcript, held still ------------- */

  const renderStatic = () => {
    bubble("user", USER_LINE);

    const box = el("div", "vt-burst");
    for (const [name, result] of [OPEN, MENU, DRAFT, APPLY, PLACE]) {
      box.appendChild(callRow(name, result));
    }
    scroll.appendChild(box);

    bubble("asst", FOUND);

    const sizePanel = buildAsk(ASK_SIZE);
    scroll.appendChild(sizePanel);
    pick(sizePanel, 0, false);

    const fulfilPanel = buildAsk(ASK_FULFIL);
    scroll.appendChild(fulfilPanel);
    pick(fulfilPanel, 0, false);

    const row = el("div", "vt-row is-asst");
    const finalBub = el("div", "vt-bub is-asst is-final");
    finalBub.innerHTML = CHECK;
    finalBub.appendChild(el("span", null, PLACED));
    row.appendChild(finalBub);
    scroll.appendChild(row);
  };

  if (REDUCED) renderStatic();
  else run();
})();