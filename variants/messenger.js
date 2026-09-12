/* ==========================================================================
   Variant C · Messenger — a messaging app. A header with the assistant's
   avatar, typing dots before every reply, tool calls as centred system
   lines, the questions as quick-reply chips whose pick becomes the user's
   next bubble. Full transcript, start to end. Mounts into #vMessenger.
   ========================================================================== */

(function messengerLoop() {
  const host = document.getElementById("vMessenger");
  if (!host) return;

  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nap = (ms) => new Promise((r) => setTimeout(r, RM ? Math.min(ms, 40) : ms));

  const CHECK = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.4 6.4l2.3 2.3 4.9-5.4"/></svg>';
  const SPINNER = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="6" cy="6" r="4.6" opacity="0.25"/><path d="M10.6 6a4.6 4.6 0 0 0-4.6-4.6"/></svg>';
  const AVATAR = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="16" fill="#1c1c21"/><rect x="8" y="8" width="16" height="16" rx="4.5" fill="none" stroke="#c9ccd6" stroke-width="1.6"/><circle cx="13.8" cy="16" r="1.9" fill="#f7f8fa"/><circle cx="18.8" cy="16" r="1.9" fill="#3a3a3e"/></svg>';

  const SYS_1 = [["Finding McDonald's", "3 nearby · 400 m"], ["Reading the menu", "Big Mac · $5.89"], ["Drafting the order", "Draft #A19"]];
  const SYS_2 = [["Setting the size", "Meal · $9.49"]];
  const SYS_3 = [["Placing the order", "Placed · #A19"]];
  const SIZE_CHIPS = ["Regular meal · $9.49", "Large meal · $10.29", "Just the burger · $5.89"];
  const FULFIL_CHIPS = ["Pickup · 400 m", "Delivery · +$3.99"];

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const replay = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };

  const card = el("div", "vm-card ring");
  const head = el("div", "vm-head");
  const av = el("span", "vm-av");
  av.innerHTML = AVATAR;
  const who = el("div", "vm-who");
  who.append(el("span", "vm-name", "Cosmos"), el("span", "vm-live", "Active now"));
  head.append(av, who);
  const feed = el("div", "vm-feed");
  card.append(head, feed);
  host.appendChild(card);

  /* ---------- builders ---------------------------------------------------- */

  const userBubble = (text) => {
    const row = el("div", "vm-row is-user");
    const b = el("div", "vm-bub is-user", text);
    const meta = el("span", "vm-meta", "Delivered");
    row.append(b, meta);
    feed.appendChild(row);
    return row;
  };

  // typing dots inside an assistant bubble, then the text replaces them
  const asstBubble = async (text, typingMs) => {
    const row = el("div", "vm-row is-asst");
    const b = el("div", "vm-bub is-asst is-typing");
    b.innerHTML = '<span class="vm-typing"><i></i><i></i><i></i></span>';
    row.appendChild(b);
    feed.appendChild(row);
    await nap(typingMs);
    b.classList.remove("is-typing");
    b.textContent = text;
    if (!RM) replay(b, "is-in");
    return row;
  };

  const system = async (lines) => {
    for (const [label, result] of lines) {
      const row = el("div", "vm-sys is-run");
      const ic = el("span", "vm-sys-ic");
      ic.innerHTML = SPINNER;
      const t = el("span", "vm-sys-t", label);
      row.append(ic, t);
      feed.appendChild(row);
      await nap(640);
      row.classList.remove("is-run");
      row.classList.add("is-done");
      ic.innerHTML = CHECK;
      t.textContent = label + " · " + result;
    }
  };

  // quick replies under the last assistant bubble; the pick lifts into a user bubble
  const quick = async (labels, pickIndex) => {
    const wrap = el("div", "vm-quick");
    const chips = labels.map((l) => { const c = el("span", "vm-chip", l); wrap.appendChild(c); return c; });
    feed.appendChild(wrap);
    await nap(900);
    chips[pickIndex].classList.add("is-sel");
    replay(chips[pickIndex], "is-pop");
    await nap(520);
    wrap.classList.add("is-gone");
    await nap(200);
    wrap.remove();
    userBubble(labels[pickIndex].split(" · ")[0]);
  };

  /* ---------- the loop ---------------------------------------------------- */

  const run = async () => {
    for (;;) {
      feed.replaceChildren();
      card.classList.remove("is-out");
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";
      replay(card, "is-sweep");
      setTimeout(() => card.classList.remove("is-sweep"), 1500);
      await nap(360);

      userBubble("order me a big mac");
      await nap(560);
      await asstBubble("On it.", 700);
      await nap(300);
      await system(SYS_1);
      await nap(240);
      await asstBubble("Found a Big Mac for $5.89, 400 m away. Which size?", 900);
      await nap(280);
      await quick(SIZE_CHIPS, 0);
      await nap(360);
      await system(SYS_2);
      await nap(220);
      await asstBubble("Pickup or delivery?", 700);
      await nap(280);
      await quick(FULFIL_CHIPS, 0);
      await nap(360);
      await system(SYS_3);
      await nap(220);
      const fin = await asstBubble("Placed · #A19 · ready in 12 min", 700);
      fin.querySelector(".vm-bub").classList.add("is-final");
      const tick = el("span", "vm-tick");
      tick.innerHTML = CHECK;
      fin.querySelector(".vm-bub").prepend(tick);
      const metas = feed.querySelectorAll(".vm-row.is-user .vm-meta");
      if (metas.length) metas[metas.length - 1].textContent = "Read";

      host.style.minHeight = card.offsetHeight + "px";
      if (RM) return;
      await nap(3400);
      card.classList.add("is-out");
      await nap(420);
    }
  };

  run();
})();
