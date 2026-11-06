/* One timeline, one dialog, and the magazine's single audio controller. */
(() => {
  const config = window.BIRTHDAY_CONFIG || {};
  const film = config.easterEgg || {};
  const root = document.getElementById("editionFilm");
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const scenes = ["opening", "portraits", "note", "ending"];
  const defaults = [4000, 8000, 9000, 9000];
  const durations = scenes.map((name, i) => Math.max(100, Number(film.durations?.[name]) || defaults[i]));
  const boundaries = durations.map((_, i) => durations.slice(0, i).reduce((a, b) => a + b, 0));
  const total = durations.reduce((a, b) => a + b, 0);
  let active = false, raf = 0, elapsed = 0, lastTime = 0, scene = -1, previousFocus, scrollY = 0;
  let bodyStyle = "", inertStates = [];
  const fill = (id, value) => { $(id).textContent = value || ""; };
  fill("filmMoment", film.moment); fill("filmChapter", film.chapter); fill("filmStory", film.story);
  fill("filmTitle", film.title); fill("filmBlessing", film.blessing); fill("filmPromise", film.promise);
  fill("filmDate", film.date); fill("filmDedication", film.dedication);
  root.querySelectorAll(".ef-number").forEach((el) => { el.textContent = film.number || "20"; });
  const lines = (film.lines || []).map((text) => {
    const p = document.createElement("p"); p.textContent = text; $("filmLines").append(p); return p;
  });
  const photos = (film.photos || []).map((entry) => {
    const portrait = config.portraits?.[entry.portraitIndex];
    const img = document.createElement("img"); img.alt = portrait?.alt || "";
    img.style.objectPosition = entry.position || "50% 40%";
    img.addEventListener("error", () => { img.hidden = true; });
    if (entry.image || portrait?.image) img.src = entry.image || portrait.image;
    else img.hidden = true;
    $("filmImages").append(img); return img;
  });
  function syncSound() {
    const playing = Boolean(window.editionSound?.isPlaying());
    $("filmSound").textContent = playing ? "静音" : "开启声音";
    $("filmSound").setAttribute("aria-pressed", String(playing));
  }
  function render() {
    const next = elapsed >= boundaries[3] ? 3 : elapsed >= boundaries[2] ? 2 : elapsed >= boundaries[1] ? 1 : 0;
    if (scene !== next) {
      scene = next; root.dataset.scene = scenes[next];
      root.querySelectorAll(".ef-stage").forEach((el) => el.setAttribute("aria-hidden", String(el.dataset.scene !== scenes[next])));
      $("filmStatus").textContent = next === 3 ? film.title : next === 2 ? "一段想对你说的话" : next === 1 ? film.chapter : film.moment;
      if (next === 3) $("filmTitle").focus({ preventScroll: true });
    }
    photos.forEach((img, i) => img.classList.toggle("ef-photo-visible", scene === 1 && i === Math.min(photos.length - 1, Math.floor((elapsed - boundaries[1]) / durations[1] * photos.length))));
    lines.forEach((p, i) => p.classList.toggle("ef-line-visible", scene === 2 && elapsed - boundaries[2] >= durations[2] / Math.max(1, lines.length) * i));
    root.classList.toggle("ef-complete", elapsed >= total);
    $("filmSkip").hidden = elapsed >= total;
  }
  function tick(now) {
    if (!active || document.hidden) return;
    if (lastTime) elapsed = Math.min(total, elapsed + now - lastTime);
    lastTime = now; render();
    if (elapsed < total) raf = requestAnimationFrame(tick);
  }
  function reset() {
    cancelAnimationFrame(raf); elapsed = reduced.matches ? total : 0; lastTime = 0; scene = -1;
    root.classList.remove("ef-skipped");
    root.classList.toggle("ef-reduced", reduced.matches); render();
    if (!document.hidden && elapsed < total) raf = requestAnimationFrame(tick);
  }
  function open() {
    if (active) return;
    // Safari touch activation need not focus its button. The film has one opener.
    previousFocus = $("surpriseButton"); active = true; scrollY = window.scrollY;
    bodyStyle = document.body.style.cssText;
    document.body.style.position = "fixed"; document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    inertStates = [$("site"), $("accessGate"), $("lightbox")].map((el) => {
      const state = [el, el.inert, el.getAttribute("aria-hidden")]; el.inert = true; el.setAttribute("aria-hidden", "true"); return state;
    });
    root.hidden = false; $("filmClose").focus(); syncSound(); reset();
    // Do not undo the recipient's existing mute choice. Sound can be enabled here by a tap.
  }
  function close() {
    if (!active) return;
    active = false; cancelAnimationFrame(raf); root.hidden = true;
    inertStates.forEach(([el, inert, aria]) => { el.inert = inert; if (aria === null) el.removeAttribute("aria-hidden"); else el.setAttribute("aria-hidden", aria); });
    document.body.style.cssText = bodyStyle;
    const behavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, scrollY);
    document.documentElement.style.scrollBehavior = behavior;
    previousFocus?.focus({ preventScroll: true });
  }
  $("surpriseButton").addEventListener("click", open);
  $("filmClose").addEventListener("click", close); $("filmReturn").addEventListener("click", close);
  $("filmReplay").addEventListener("click", () => { $("filmClose").focus(); reset(); });
  $("filmSkip").addEventListener("click", () => { cancelAnimationFrame(raf); root.classList.add("ef-skipped"); elapsed = total; render(); });
  $("filmSound").addEventListener("click", () => window.editionSound?.toggle());
  document.addEventListener("edition:sound", syncSound);
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key !== "Tab") return;
    const buttons = [...root.querySelectorAll("button")].filter((el) => !el.hidden && !el.disabled && !el.closest('[aria-hidden="true"]') && getComputedStyle(el).visibility !== "hidden" && el.getClientRects().length);
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && (document.activeElement === first || !buttons.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !buttons.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener("visibilitychange", () => {
    if (!active) return;
    cancelAnimationFrame(raf); lastTime = 0;
    root.classList.toggle("ef-paused", document.hidden);
    if (!document.hidden && elapsed < total) raf = requestAnimationFrame(tick);
    syncSound();
  });
  window.addEventListener("pagehide", close);
  const motionChanged = () => { if (active && reduced.matches) { cancelAnimationFrame(raf); elapsed = total; root.classList.add("ef-reduced"); render(); } };
  if (reduced.addEventListener) reduced.addEventListener("change", motionChanged);
})();
