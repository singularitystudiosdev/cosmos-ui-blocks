/* ==========================================================================
   Variant A · Thread — bubbles. The transcript IS the artifact.
   Plays the whole conversation from the user's first message to the final
   confirmation, top-anchored, nothing scrolled away: an answered question
   collapses to a one-line answer row instead of leaving the thread.
   Mounts into #vThread. Loops forever; reduced motion plays it once, fast.
   ========================================================================== */

(function threadLoop() {
  const host = document.getElementById("vThread");
  if (!host) return;

  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nap = (ms) => new Promise((r) => setTimeout(r, RM ? Math.min(ms, 40) : ms));

  const SPINNER = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="6" cy="6" r="4.6" opacity="0.25"/><path d="M10.6 6a4.6 4.6 0 0 0-4.6-4.6"/></svg>';
  const CHECK = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.4 6.4l2.3 2.3 4.9-5.4"/></svg>';
  const QUESTION = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2.2 3.2h7.6M4.8 3.2V2h2.4v1.2M3.4 3.2l.5 6.3c0 .5.4.9.9.9h2.4c.5 0 .9-.4.9-.9l.5-6.3"/></svg>';
  const ENTER = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2.6v3.2a1.6 1.6 0 0 1-1.6 1.6H2M4.2 5.2 2 7.4l2.2 2.2"/></svg>';
  const DOTS = '<span class="vt-dots"><i></i><i></i><i></i></span>';

  /* ---------- the transcript --------------------------------------------- */

  const OPENING = [["find_restaurants", "3 nearby"], ["get_menu", "Big Mac · $5.89"], ["draft_order", "Draft #A19"]];
  const APPLY = [["apply_size", "Meal · $9.49"]];
  const PLACE = [["place_order", "Placed · #A19"]];
  const ASK_SIZE = { q: "What size?", opts: [["Regular meal", "$9.49"], ["Large meal", "$10.29"], ["Just the burger", "$5.89"]] };
  const ASK_FULFIL = { q: "Pickup or delivery?", opts: [["Pickup", "400 m"], ["Delivery", "+$3.99"]] };
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
  const replay = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };

  const card = el("div", "vt-card ring");
  const col = el("div", "vt-col");
  card.appendChild(col);
  host.appendChild(card);

  /* ---------- builders ---------------------------------------------------- */

  const bubble = (kind, text) => {
    const row = el("div", "vt-row is-" + kind);
    row.appendChild(el("div", "vt-bub is-" + kind, text));
    col.appendChild(row);
    return row;
  };

  const callRow = (name) => {
    const row = el("div", "vt-call is-run");
    const ic = el("span", "vt-call-ic");
    ic.innerHTML = SPINNER;
    const st = el("span", "vt-call-st");
    st.innerHTML = DOTS;
    row.append(ic, el("span", "vt-call-nm", name), st);
    return row;
  };
  const settle = (row, result) => {
    row.classList.remove("is-run");
    row.classList.add("is-done");
    row.querySelector(".vt-call-ic").innerHTML = CHECK;
    const st = row.querySelector(".vt-call-st");
    st.textContent = result;
    if (!RM) replay(st, "is-pop");
  };
  const burst = async (calls) => {
    const box = el("div", "vt-burst");
    col.appendChild(box);
    for (const [name, result] of calls) {
      const row = callRow(name);
      box.appendChild(row);
      await nap(680);
      settle(row, result);
    }
  };

  const buildAsk = (spec) => {
    const panel = el("div", "vt-ask");
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
    col.appendChild(panel);
    return panel;
  };

  // pick an option, bloom Continue, then fold the panel down to its answer
  const answer = async (panel, i) => {
    const opts = [...panel.querySelectorAll(".vt-opt")];
    opts.forEach((o, j) => { o.classList.toggle("is-sel", j === i); o.setAttribute("aria-checked", j === i ? "true" : "false"); });
    replay(opts[i], "is-pop");
    const go = panel.querySelector(".vt-go");
    go.classList.remove("is-idle");
    go.classList.add("is-arm");
    setTimeout(() => go.classList.remove("is-arm"), 220);
    await nap(520);
    go.classList.add("is-bloom");
    await nap(560);

    const [label, meta] = [opts[i].querySelector(".vt-opt-t").textContent, opts[i].querySelector(".vt-opt-m").textContent];
    const ans = el("div", "vt-ans");
    ans.innerHTML = CHECK;
    ans.append(el("span", "vt-ans-t", label), el("span", "vt-ans-m", meta));
    panel.querySelector(".vt-ask-body").replaceWith(ans);
    panel.querySelector(".vt-ask-foot").remove();
    panel.classList.add("is-done");
  };

  /* ---------- the loop ---------------------------------------------------- */

  const run = async () => {
    for (;;) {
      col.replaceChildren();
      card.classList.remove("is-out");
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";
      replay(card, "is-sweep");
      setTimeout(() => card.classList.remove("is-sweep"), 1500);
      await nap(360);

      bubble("user", USER_LINE);
      await nap(520);
      await burst(OPENING);
      await nap(200);
      bubble("asst", FOUND);
      await nap(640);

      const size = buildAsk(ASK_SIZE);
      await nap(760);
      await answer(size, 0);
      await nap(260);
      await burst(APPLY);
      await nap(220);

      const fulfil = buildAsk(ASK_FULFIL);
      await nap(760);
      await answer(fulfil, 0);
      await nap(260);
      await burst(PLACE);
      await nap(220);

      const row = el("div", "vt-row is-asst");
      const fin = el("div", "vt-bub is-asst is-final");
      fin.innerHTML = CHECK;
      fin.appendChild(el("span", null, PLACED));
      row.appendChild(fin);
      col.appendChild(row);

      // the full transcript is now on screen: hold the row at this height so
      // the restart does not collapse the grid
      host.style.minHeight = card.offsetHeight + "px";
      if (RM) return;
      await nap(3400);
      card.classList.add("is-out");
      await nap(420);
    }
  };

  run();
})();
