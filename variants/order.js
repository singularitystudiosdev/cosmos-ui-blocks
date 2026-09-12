/* Variant C — ORDER CARD loop. Artifact-first: the ticket assembles itself while
   the conversation is a single muted aside.
   `REDUCED` and `sleep` come from app.js (declared there at the top of a classic
   script) — they are reused, never re-declared, so no sibling variant collides. */

(function orderLoop() {
  const host = document.getElementById("vOrder");
  if (!host) return;

  const RED = typeof REDUCED === "boolean"
    ? REDUCED
    : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nap = typeof sleep === "function" ? sleep : (ms) => new Promise((r) => setTimeout(r, ms));

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ---------- the card chrome, built once ------------------------------- */

  const card = el("div", "vo-card ring");

  const top = el("div", "vo-top");
  const pill = el("span", "vo-pill is-draft");
  const pillDot = el("i");
  const pillText = el("span", null, "Drafting");
  pill.append(pillDot, pillText);
  top.append(el("span", "vo-no", "Order #A19"), pill);

  const quote = el("div", "vo-quote", "— “order me a big mac”");
  const items = el("div", "vo-items");

  const total = el("div", "vo-total");
  const totalVal = el("span", "vo-sum", "$0.00");
  total.append(el("span", null, "Total"), totalVal);

  const say = el("div", "vo-say", "Checking McDonald's…");
  const ask = el("div", "vo-ask");

  card.append(top, quote, items, total, say, ask);
  host.replaceChildren(card);

  /* ---------- helpers --------------------------------------------------- */

  const fmt = (n) => "$" + n.toFixed(2);

  let rows = []; // { node, price, superseded }
  let totalTick = 0; // invalidates any count-up still in flight (reset, next row)

  // the running total counts up to the new sum rather than snapping.
  // progress is measured from the rAF timestamp itself, so a tick can never
  // outlive its own animation and overwrite a later total.
  const setTotal = (next) => {
    const token = ++totalTick;
    const from = parseFloat(totalVal.dataset.v || "0");
    totalVal.dataset.v = String(next);
    if (RED || from === next || !isFinite(from)) {
      totalVal.textContent = fmt(next);
      return;
    }
    const dur = 420;
    let start = null;
    const tick = (now) => {
      if (token !== totalTick || !totalVal.isConnected) return;
      if (start === null) start = now;
      const k = Math.min(1, (now - start) / dur);
      totalVal.textContent = k < 1
        ? fmt(from + (next - from) * (1 - Math.pow(1 - k, 3)))
        : fmt(next);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const recount = () => setTotal(rows.filter((r) => !r.superseded).reduce((a, r) => a + r.price, 0));

  const addRow = (name, price) => {
    const row = el("div", "vo-row");
    row.append(el("span", "vo-name", name), el("span", "vo-lead"), el("span", "vo-price", fmt(price)));
    items.appendChild(row);
    const rec = { node: row, price, superseded: false };
    rows.push(rec);
    recount();
    return rec;
  };

  const setSay = (text) => {
    say.textContent = text;
    if (RED) return;
    say.classList.remove("is-in");
    void say.offsetWidth;
    say.classList.add("is-in");
  };

  const setStatus = (ready) => {
    pillText.textContent = ready ? "Ready" : "Drafting";
    pill.classList.toggle("is-ready", ready);
    pill.classList.toggle("is-draft", !ready);
    pill.classList.remove("is-pop");
    if (ready && !RED) {
      void pill.offsetWidth;
      pill.classList.add("is-pop");
    }
  };

  const showAsk = (options) => {
    ask.classList.remove("is-out");
    ask.replaceChildren();
    options.forEach(([label, note], i) => {
      const opt = el("span", "vo-opt");
      opt.append(el("span", null, label), el("span", "vo-opt-x", note));
      if (!RED) opt.style.animationDelay = i * 45 + "ms";
      ask.appendChild(opt);
    });
  };

  const highlight = (i) => {
    const opts = [...ask.querySelectorAll(".vo-opt")];
    opts.forEach((o, j) => o.classList.toggle("is-on", j === i));
  };

  const collapseAsk = async () => {
    if (!ask.querySelector(".vo-opt")) return;
    if (!RED) {
      ask.classList.add("is-out");
      await nap(240);
    }
    ask.classList.remove("is-out");
    ask.replaceChildren();
  };

  const replay = (node, cls) => {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  };

  /* ---------- the loop -------------------------------------------------- */

  const ASK_SIZE = [
    ["Regular meal", "· $9.49"],
    ["Large meal", "· $10.29"],
    ["Just the burger", "· $5.89"],
  ];
  const ASK_FULFIL = [
    ["Pickup", "· 400 m"],
    ["Delivery", "· +$3.99"],
  ];

  const run = async () => {
    for (;;) {
      // reset to an empty draft
      items.replaceChildren();
      rows = [];
      ask.classList.remove("is-out");
      ask.replaceChildren();
      totalTick++; // kill any count-up left over from the previous pass
      totalVal.dataset.v = "0";
      totalVal.textContent = "$0.00";
      setStatus(false);
      say.textContent = "Checking McDonald's…";
      card.classList.remove("is-out");
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";

      await nap(520);
      replay(card, "is-sweep");
      await nap(460);

      // draft_order → the first line lands
      addRow("Big Mac", 5.89);
      await nap(560);
      setSay("One Big Mac, $5.89.");
      await nap(600);

      // ask 1 → size, answered from the pills
      setSay("Which size?");
      showAsk(ASK_SIZE);
      await nap(560);
      highlight(0);
      await nap(760);
      await collapseAsk();

      // apply_size → the burger becomes the meal; the total re-settles on it
      const burger = rows[0];
      burger.superseded = true;
      burger.node.classList.add("is-sup");
      addRow("Regular meal", 9.49);
      await nap(640);

      // ask 2 → fulfilment
      setSay("Pickup or delivery?");
      showAsk(ASK_FULFIL);
      await nap(560);
      highlight(0);
      await nap(720);
      await collapseAsk();

      // place_order → the ticket closes
      addRow("Pickup · 400 m", 0);
      await nap(520);
      setStatus(true);
      setSay("Placed — ready in 12 min");
      await nap(1700);

      card.classList.add("is-out");
      await nap(RED ? 80 : 620);
    }
  };

  run();
})();