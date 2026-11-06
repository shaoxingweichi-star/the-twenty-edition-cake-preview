/* THE TWENTY EDITION — independent, no-dependency birthday cake interaction. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  if ($("birthdayCakeModal")) return;
  const config = window.BIRTHDAY_CONFIG || {};
  const person = config.person || {};
  const recipient = person.name || "金琦";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const root = document.createElement("section");
  root.id = "birthdayCakeModal";
  root.className = "birthday-cake";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "bcTitle");
  root.hidden = true;
  root.innerHTML = `
    <div class="bc-stars" aria-hidden="true" id="bcStars"></div>
    <canvas class="bc-celebration" id="bcCanvas" aria-hidden="true"></canvas>
    <div class="bc-toolbar"><span>THE TWENTY / 11.20</span><button class="bc-close" id="bcClose" type="button" aria-label="关闭生日蛋糕">×</button></div>
    <div class="bc-layout">
      <p class="bc-kicker">ONE LAST WISH · CHAPTER 20</p>
      <h2 class="bc-heading" id="bcTitle">A wish, just for you.</h2>
      <p class="bc-subtitle" id="bcSubtitle">这一份小小的生日仪式，留给特别的二十岁。</p>
      <div class="bc-cake-stage" role="img" aria-label="带有二十岁数字蜡烛的双层奶油生日蛋糕">
        <div class="bc-aura" aria-hidden="true"></div>
        <div class="bc-art-anchor" aria-hidden="true"><div class="bc-cake-art">
          <div class="bc-plate"></div>
          <div class="bc-tier bc-tier-lower"><div class="bc-frosting"></div><div class="bc-ribbon"></div></div>
          <div class="bc-tier bc-tier-upper"><div class="bc-frosting"></div><div class="bc-ribbon"></div></div>
          <div class="bc-candles"><div class="bc-candle"><span class="bc-num">2</span><i class="bc-flame"></i><i class="bc-smoke"></i></div><div class="bc-candle"><span class="bc-num">0</span><i class="bc-flame"></i><i class="bc-smoke"></i></div></div>
        </div></div>
      </div>
      <div class="bc-controls"><button id="bcPrimary" class="bc-primary" type="button">点亮生日蜡烛 ✦</button><p id="bcHint" class="bc-hint" aria-live="polite">轻触按钮，点亮属于你的 20 岁。</p></div>
      <div class="bc-message" id="bcMessage" aria-live="polite" aria-hidden="true"><h3 id="bcGreeting">20 岁生日快乐！</h3><p>愿你的二十岁，自由、闪亮，<br>拥有更多值得期待的故事。</p></div>
      <div class="bc-footer">MADE FOR YOU · 20 NOV 2026</div>
    </div>`;
  document.body.appendChild(root);
  $("bcGreeting").textContent = `${recipient}，20 岁生日快乐！`;
  const stars = $("bcStars");
  for (let i = 0; i < 36; i++) {
    const star = document.createElement("span");
    star.className = "bc-star";
    star.style.left = `${(i * 47.7 + 17) % 100}%`;
    star.style.top = `${(i * 31.3 + 8) % 100}%`;
    star.style.setProperty("--speed", `${2 + (i % 5) * .7}s`);
    star.style.setProperty("--delay", `${-(i % 7) * .6}s`);
    stars.appendChild(star);
  }

  const primary = $("bcPrimary"), hint = $("bcHint"), canvas = $("bcCanvas");
  const ctx = canvas.getContext("2d");
  let state = "idle", active = false, savedFocus = null, scrollY = 0, savedBodyStyle = "";
  let inertStates = [], raf = 0, particles = [], confettiStart = 0, lastFrame = 0;
  const colors = ["#f9d7a0", "#fff4d5", "#e9afc0", "#bfa0ca", "#deb678"];
  function resize() {
    // Also supports older iOS / WeChat engines without dynamic viewport units.
    const height = window.visualViewport?.height || window.innerHeight;
    root.style.setProperty("--bc-viewport-height", `${height}px`);
    if (!ctx) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * scale);
    canvas.height = Math.round(window.innerHeight * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  function stopConfetti() {
    cancelAnimationFrame(raf); raf = 0; particles = [];
    if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
  function celebrate() {
    if (!ctx || reduced.matches || document.hidden) return;
    resize(); stopConfetti();
    const width = window.innerWidth, height = window.innerHeight;
    const count = width < 500 ? 80 : 150;
    particles = Array.from({ length: count }, (_, i) => {
      const angle = Math.PI * (1.1 + Math.random() * .8);
      const speed = 2 + Math.random() * 5;
      return { x: width / 2 + (Math.random() -.5) * 95,
        y: height * .58, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3,
        gravity: .075 + Math.random() * .055, turn: Math.random() * Math.PI,
        spin: (Math.random() -.5) * .16, w: 2 + Math.random() * 4, h: 4 + Math.random() * 8,
        color: colors[i % colors.length], alpha: 1 };
    });
    confettiStart = performance.now(); lastFrame = confettiStart;
    function frame(now) {
      if (!active || state !== "wished" || document.hidden) { stopConfetti(); return; }
      const age = now - confettiStart;
      const step = Math.min((now - lastFrame) / (1000 / 60), 2); lastFrame = now;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx * step; p.y += p.vy * step; p.vy += p.gravity * step; p.vx *= Math.pow(.994, step);
        p.turn += p.spin * step; p.alpha = Math.max(0, 1 - age / 2900);
        ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.turn);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (age < 2900) raf = requestAnimationFrame(frame);
      else stopConfetti();
    }
    raf = requestAnimationFrame(frame);
  }
  function reset() {
    stopConfetti(); state = "idle";
    $("bcMessage").setAttribute("aria-hidden", "true");
    root.classList.remove("is-lit", "is-wished");
    primary.textContent = "点亮生日蜡烛 ✦";
    hint.textContent = "轻触按钮，点亮属于你的 20 岁。";
  }
  function onPrimary() {
    // Safari touch clicks do not consistently focus buttons; keep Escape in the dialog.
    primary.focus({ preventScroll: true });
    if (state === "idle") {
      state = "lit"; root.classList.add("is-lit");
      primary.textContent = "许个愿，吹灭蜡烛 ✧";
      hint.textContent = "许下一个心愿，再轻触吹灭蜡烛。";
    } else if (state === "lit") {
      $("bcMessage").setAttribute("aria-hidden", "false");
      state = "wished"; root.classList.remove("is-lit"); root.classList.add("is-wished");
      primary.textContent = "再来一次 ↺";
      hint.textContent = "愿你所盼，皆有回响。";
      celebrate();
    } else reset();
  }
  function open() {
    if (active) return;
    active = true; savedFocus = document.activeElement; scrollY = window.scrollY;
    savedBodyStyle = document.body.style.cssText;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    inertStates = [...document.body.children]
      .filter(el => el !== root && !["SCRIPT", "STYLE", "LINK", "AUDIO"].includes(el.tagName)).map(el => { const old = [el, el.inert, el.getAttribute("aria-hidden")];
        el.inert = true; el.setAttribute("aria-hidden", "true"); return old; });
    reset(); root.hidden = false; root.scrollTop = 0; resize(); $("bcClose").focus({ preventScroll: true });
  }
  function close() {
    if (!active) return;
    active = false; stopConfetti(); root.hidden = true;
    for (const [el, inert, aria] of inertStates) {
      el.inert = inert; if (aria === null) el.removeAttribute("aria-hidden"); else el.setAttribute("aria-hidden", aria);
    }
    inertStates = [];
    document.body.style.cssText = savedBodyStyle;
    const behavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, scrollY);
    document.documentElement.style.scrollBehavior = behavior;
    if (savedFocus?.isConnected && !savedFocus.closest("[hidden]")) savedFocus.focus({ preventScroll: true });
  }
  const filmRoot = $("editionFilm");
  const endingActions = filmRoot?.querySelector(".ef-actions");
  if (endingActions && $("filmClose")) {
    const next = document.createElement("button");
    next.type = "button"; next.id = "filmBirthdayCake"; next.hidden = true;
    next.className = "bc-open-film";
    next.textContent = "最后一份惊喜 · 生日蛋糕 ✧";
    const isFinished = () => !filmRoot.hidden && filmRoot.dataset.scene === "ending" && filmRoot.classList.contains("ef-complete");
    const syncEntry = () => { next.hidden = !isFinished(); };
    // Observe the existing timeline; no duplicate timers or alternate entry points.
    new MutationObserver(syncEntry).observe(filmRoot, { attributes: true, attributeFilter: ["class", "hidden", "data-scene"] });
    next.addEventListener("click", () => {
      if (!isFinished()) return;
      // The existing film controller owns its own scroll/focus/inert cleanup.
      $("filmClose")?.click();
      open();
    });
    endingActions.classList.add("bc-has-cake");
    endingActions.appendChild(next);
    syncEntry();
  }
  primary.addEventListener("click", onPrimary);
  $("bcClose").addEventListener("click", close);
  root.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab") return;
    const controls = [$("bcClose"), primary].filter(el => !el.hidden);
    const index = controls.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); controls[controls.length - 1].focus(); }
    else if (!event.shiftKey && (index === -1 || index === controls.length - 1)) {
      event.preventDefault(); controls[0].focus();
    }
  });
  document.addEventListener("visibilitychange", () => { root.classList.toggle("bc-paused", document.hidden); if (document.hidden) stopConfetti(); });
  window.addEventListener("resize", () => { if (active) resize(); });
  window.visualViewport?.addEventListener("resize", () => { if (active) resize(); });
  const motionChanged = () => { if (reduced.matches) stopConfetti(); };
  if (reduced.addEventListener) reduced.addEventListener("change", motionChanged);
  else reduced.addListener(motionChanged);
  window.addEventListener("pagehide", close);
})();
