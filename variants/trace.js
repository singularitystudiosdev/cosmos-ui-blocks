/* Variant B — Trace.
   The tool-call rail is the artifact: one numbered node per call, two nodes
   for the clarifying questions, bookended by a request bar and a counted
   footer. Same reduced-motion idiom as the top of app.js. */

(function traceLoop() {
  const mount = document.getElementById("vTrace");
  if (!mount) return;

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, REDUCED ? Math.min(ms, 45) : ms));

  const ARC =
    '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
    '<circle cx="6" cy="6" r="4.6" opacity="0.25"/>' +
    '<path d="M10.6 6a4.6 4.6 0 0 0-4.6-4.6"/></svg>';
  const TICK =
    '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M2.4 6.4l2.3 2.3 4.9-5.4"/></svg>';

  // the same transcript the other two variants tell
  const STEPS = [
    {
      kind: "call", i: 1, tool: "find_restaurants",
      args: 'query: "McDonald\'s" · near: current',
      dur: "0.4s", res: "3 nearby · nearest 400 m", hold: 540,
    },
    {
      kind: "call", i: 2, tool: "get_menu",
      args: 'store: "mcd-4471"',
      dur: "0.2s", res: "Big Mac · $5.89", hold: 500,
    },
    {
      kind: "call", i: 3, tool: "draft_order",
      args: "item: big_mac · qty: 1",
      dur: "0.2s", res: "Draft #A19", hold: 500,
    },
    {
      kind: "ask", q: "What size?",
      opts: ["Regular meal · $9.49", "Large meal · $10.29", "Just the burger · $5.89"],
      pick: 0,
    },
    {
      kind: "call", i: 4, tool: "apply_size",
      args: "draft: A19 · size: regular",
      dur: "0.2s", res: "Meal · $9.49", hold: 500,
    },
    {
      kind: "ask", q: "Pickup or delivery?",
      opts: ["Pickup · 400 m", "Delivery · +$3.99"],
      pick: 0,
    },
    {
      kind: "call", i: 5, tool: "place_order",
      args: "draft: A19 · fulfil: pickup",
      dur: "1.1s", res: "Placed · #A19 · ready in 12 min", hold: 620,
    },
  ];

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // re-add an animation class so it replays (the app.js idiom)
  const replay = (node, cls) => {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  };

  // ---- the card is built once; each cycle refills the rail ----------------

  const card = el("div", "vx-card ring");

  const req = el("div", "vx-req");
  req.appendChild(el("b", "vx-caret", ">"));
  req.appendChild(el("span", "vx-req-txt", "order me a big mac"));

  const rail = el("div", "vx-rail");

  const foot = el("div", "vx-foot", "5 calls · 2.1s · order placed");

  card.append(req, rail, foot);
  mount.replaceChildren(card);

  const callNode = (s) => {
    const node = el("div", "vx-node is-run");
    const body = el("div", "vx-body");

    const top = el("div", "vx-top");
    top.appendChild(el("span", "vx-tool", s.tool));
    const st = el("span", "vx-st vx-arc");
    st.innerHTML = ARC;
    top.appendChild(st);
    top.appendChild(el("span", "vx-dur", s.dur));

    const args = el("div", "vx-args", s.args);
    const res = el("div", "vx-res");
    res.appendChild(el("span", "vx-ar", "→"));
    res.appendChild(document.createTextNode(s.res));

    body.append(top, args, res);
    node.append(el("span", "vx-badge", String(s.i)), body);
    return { node, st, res };
  };

  const askNode = (s) => {
    const node = el("div", "vx-node is-q");
    const body = el("div", "vx-body");
    body.appendChild(el("div", "vx-q", s.q));
    const pills = el("div", "vx-pills");
    s.opts.forEach((o, i) => pills.appendChild(el("span", "vx-pill", o)));
    body.appendChild(pills);
    node.append(el("span", "vx-badge", "?"), body);
    return { node, pills };
  };

  // once the first pass has shown the full rail, lock the card's height so the
  // node-by-node growth does not reflow the whole 3-up row on every cycle
  let locked = false;

  const run = async () => {
    for (;;) {
      // reset
      card.classList.remove("is-out");
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";
      rail.replaceChildren();
      foot.classList.remove("is-in");

      // the circle fires twice a cycle: on the request bar, then on the card
      replay(card, "is-sweep");
      replay(req, "is-in");
      await sleep(280);

      // nodes arrive one by one, each running then done
      for (const s of STEPS) {
        if (s.kind === "call") {
          const { node, st, res } = callNode(s);
          rail.appendChild(node);
          await sleep(s.hold);
          st.className = "vx-st vx-chk";
          st.innerHTML = TICK;
          node.classList.remove("is-run");
          node.classList.add("is-done");
          res.classList.add("is-in");
          await sleep(190);
        } else {
          const { node, pills } = askNode(s);
          rail.appendChild(node);
          await sleep(560);
          const pick = pills.children[s.pick];
          pick.classList.add("is-sel");
          replay(pick, "is-pop");
          await sleep(900);
        }
      }

      // footer settles, then the whole card fades and the loop restarts
      foot.classList.add("is-in");
      if (!locked && card.offsetHeight) {
        locked = true;
        card.style.minHeight = card.offsetHeight + "px";
      }
      await sleep(1500);
      card.classList.add("is-out");
      await sleep(1150);
    }
  };

  run();
})();