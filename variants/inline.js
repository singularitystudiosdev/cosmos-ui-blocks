/* ==========================================================================
   Variant B · Inline — assistant-app style. No bubbles for the assistant:
   a small mark, plain text, tool calls as inline rows on a hairline rail,
   the questions as a bare radio list under the assistant's line.
   Full transcript, start to end, nothing scrolled away. Mounts into #vInline.
   ========================================================================== */

(function inlineLoop() {
  const host = document.getElementById("vInline");
  if (!host) return;

  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nap = (ms) => new Promise((r) => setTimeout(r, RM ? Math.min(ms, 40) : ms));

  const SPINNER = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="6" cy="6" r="4.6" opacity="0.25"/><path d="M10.6 6a4.6 4.6 0 0 0-4.6-4.6"/></svg>';
  const CHECK = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.4 6.4l2.3 2.3 4.9-5.4"/></svg>';
  const CHEV = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 2.5 8 6l-3.5 3.5"/></svg>';
  const MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="5" width="22" height="22" rx="6" fill="none" stroke="#c9ccd6" stroke-width="2"/><circle cx="13" cy="16" r="2.6" fill="#f7f8fa"/><circle cx="20" cy="16" r="2.6" fill="#3a3a3e"/></svg>';

  const CALLS_1 = [["find_restaurants", 'near: "current"', "3 nearby · 400 m"], ["get_menu", 'store: "mcd-4471"', "Big Mac · $5.89"], ["draft_order", "qty: 1", "Draft #A19"]];
  const CALLS_2 = [["apply_size", 'size: "regular"', "Meal · $9.49"]];
  const CALLS_3 = [["place_order", 'fulfil: "pickup"', "Placed · #A19"]];
  const ASK_SIZE = { q: "Which size?", opts: [["Regular meal", "$9.49"], ["Large meal", "$10.29"], ["Just the burger", "$5.89"]] };
  const ASK_FULFIL = { q: "Pickup or delivery?", opts: [["Pickup", "400 m"], ["Delivery", "+$3.99"]] };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const replay = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };

  const card = el("div", "vi-card ring");
  host.appendChild(card);

  /* ---------- builders ---------------------------------------------------- */

  const userTurn = (text) => {
    const row = el("div", "vi-user");
    row.appendChild(el("div", "vi-user-t", text));
    card.appendChild(row);
  };

  // an assistant turn: the mark on the left, a body column on the right
  const asstTurn = () => {
    const row = el("div", "vi-asst");
    const mark = el("span", "vi-mark");
    mark.innerHTML = MARK;
    const body = el("div", "vi-body");
    row.append(mark, body);
    card.appendChild(row);
    return body;
  };

  const say = (body, text, cls) => {
    const p = el("div", "vi-text" + (cls ? " " + cls : ""), text);
    body.appendChild(p);
    return p;
  };

  const tools = async (body, calls) => {
    const rail = el("div", "vi-rail");
    body.appendChild(rail);
    for (const [name, args, result] of calls) {
      const row = el("div", "vi-tool is-run");
      const ic = el("span", "vi-tool-ic");
      ic.innerHTML = SPINNER;
      const chev = el("span", "vi-tool-chev");
      chev.innerHTML = CHEV;
      row.append(ic, el("span", "vi-tool-nm", name), el("span", "vi-tool-args", args), chev);
      rail.appendChild(row);
      await nap(680);
      row.classList.remove("is-run");
      row.classList.add("is-done");
      ic.innerHTML = CHECK;
      const res = el("div", "vi-tool-res", result);
      row.appendChild(res);
      if (!RM) replay(res, "is-in");
    }
  };

  const ask = async (body, spec, pickIndex) => {
    say(body, spec.q, "is-q");
    const list = el("div", "vi-radios");
    const opts = spec.opts.map(([label, meta]) => {
      const o = el("div", "vi-radio-row");
      o.append(el("span", "vi-radio"), el("span", "vi-radio-t", label), el("span", "vi-radio-m", meta));
      list.appendChild(o);
      return o;
    });
    body.appendChild(list);
    const go = el("button", "vi-go is-idle");
    go.type = "button";
    go.textContent = "Continue";
    body.appendChild(go);

    await nap(820);
    opts[pickIndex].classList.add("is-sel");
    replay(opts[pickIndex], "is-pop");
    go.classList.remove("is-idle");
    await nap(560);
    go.classList.add("is-hit");
    await nap(260);

    // the unchosen options and the button fold away; the pick stays, ticked
    opts.forEach((o, j) => { if (j !== pickIndex) o.classList.add("is-gone"); });
    go.classList.add("is-gone");
    await nap(240);
    opts.forEach((o, j) => { if (j !== pickIndex) o.remove(); });
    go.remove();
    list.classList.add("is-answered");
    const tick = el("span", "vi-radio-tick");
    tick.innerHTML = CHECK;
    opts[pickIndex].querySelector(".vi-radio").replaceWith(tick);
  };

  /* ---------- the loop ---------------------------------------------------- */

  const run = async () => {
    for (;;) {
      card.replaceChildren();
      card.classList.remove("is-out");
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";
      replay(card, "is-sweep");
      setTimeout(() => card.classList.remove("is-sweep"), 1500);
      await nap(360);

      userTurn("order me a big mac");
      await nap(560);

      const a1 = asstTurn();
      say(a1, "On it — checking McDonald's near you.");
      await nap(520);
      await tools(a1, CALLS_1);
      await nap(240);
      say(a1, "Big Mac, $5.89, 400 m away. Drafted #A19.");
      await nap(640);
      await ask(a1, ASK_SIZE, 0);
      await nap(300);

      const a2 = asstTurn();
      await tools(a2, CALLS_2);
      await nap(260);
      await ask(a2, ASK_FULFIL, 0);
      await nap(300);

      const a3 = asstTurn();
      await tools(a3, CALLS_3);
      await nap(240);
      const fin = say(a3, "", "is-final");
      fin.innerHTML = CHECK;
      fin.appendChild(el("span", null, "Placed · #A19 · ready in 12 min"));

      host.style.minHeight = card.offsetHeight + "px";
      if (RM) return;
      await nap(3400);
      card.classList.add("is-out");
      await nap(420);
    }
  };

  run();
})();
