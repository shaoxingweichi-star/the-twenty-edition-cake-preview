(() => {
  const config = window.BIRTHDAY_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const person = config.person || {};
  const portraits = config.portraits || [];
  let currentPhoto = 0;
  let lastFocused = null;
  const gate = $("#accessGate"), site = $("#site"), accessForm = $("#accessForm"), accessCode = $("#accessCode"), accessStatus = $("#accessStatus");

  const unlockSite = () => {
    gate.hidden = true; site.classList.remove("is-locked"); document.body.classList.remove("is-gated");
  };
  if (sessionStorage.getItem("twenty-edition-unlocked") === "true") unlockSite();
  else {
    document.body.classList.add("is-gated");
    accessForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (accessCode.value === String(config.accessCode || "1120")) {
        sessionStorage.setItem("twenty-edition-unlocked", "true"); unlockSite();
      } else {
        accessStatus.textContent = "Try again."; accessCode.value = ""; accessCode.focus();
      }
    });
    accessCode.addEventListener("input", () => { accessCode.value = accessCode.value.replace(/\D/g, ""); accessStatus.textContent = ""; });
    setTimeout(() => accessCode.focus(), 450);
  }

  document.title = `THE ${person.age || 20} EDITION`;
  $("#coverName").textContent = person.displayName || person.name || "JIN QI";
  $("#coverDate").textContent = `BIRTHDAY EDITION / ${person.birthday || "11.20"}`;
  $("#coverBirthday").textContent = `HAPPY ${person.age || 20}TH BIRTHDAY`;
  $("#finaleBirthday").textContent = `HAPPY ${person.age || 20}TH BIRTHDAY, ${person.displayName || person.name || "JIN QI"}.`;

  const fallbackImage = (image, fallback) => {
    image.addEventListener("error", () => { if (image.src !== new URL(fallback, location.href).href) image.src = fallback; }, { once: true });
  };
  const cover = $("#coverImage");
  cover.src = config.cover?.image || "assets/cover-placeholder.svg";
  cover.alt = config.cover?.alt || "";
  fallbackImage(cover, "assets/cover-placeholder.svg");

  const portraitGrid = $("#portraitGrid");
  portraits.forEach((portrait, index) => {
    const item = document.createElement("button");
    item.type = "button"; item.className = "portrait"; item.dataset.index = index;
    item.setAttribute("aria-label", `View ${portrait.title || `portrait ${index + 1}`}`);
    item.innerHTML = `<img src="${portrait.image}" alt="${portrait.alt || ""}"><span>${portrait.title || `Portrait ${index + 1}`}</span><b aria-hidden="true">↗</b>`;
    const image = item.querySelector("img");
    fallbackImage(image, `assets/portrait-0${(index % 4) + 1}.svg`);
    item.addEventListener("click", () => openLightbox(index));
    portraitGrid.appendChild(item);
  });

  const noteText = $("#noteText");
  (config.note?.paragraphs || []).forEach((paragraph) => { const p = document.createElement("p"); p.textContent = paragraph; noteText.appendChild(p); });
  $("#noteSignature").textContent = config.note?.signature || "— With warm wishes";

  const wishList = $("#wishList");
  (config.wishes || []).forEach((wish, index) => {
    const details = document.createElement("details"); details.className = "wish";
    details.innerHTML = `<summary><span class="wish-number">0${index + 1}</span><span class="wish-title">${wish.title}</span><span class="wish-icon" aria-hidden="true">+</span></summary><div class="wish-content"><p>${wish.text}</p></div>`;
    const icon = details.querySelector(".wish-icon");
    details.addEventListener("toggle", () => { icon.textContent = details.open ? "—" : "+"; });
    wishList.appendChild(details);
  });

  $("#openEdition").addEventListener("click", () => {
    site.classList.remove("is-locked"); site.classList.add("has-opened");
    setTimeout(() => $("#cover").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }), reduceMotion ? 0 : 360);
  });

  function openLightbox(index) {
    currentPhoto = index; lastFocused = document.activeElement;
    const photo = portraits[currentPhoto]; const image = $("#lightboxImage");
    image.src = photo.image; image.alt = photo.alt || photo.title || "";
    fallbackImage(image, `assets/portrait-0${(currentPhoto % 4) + 1}.svg`);
    $("#lightboxCaption").textContent = photo.title || "";
    $("#lightbox").hidden = false; document.body.classList.add("no-scroll"); $("#lightboxClose").focus();
  }
  function closeLightbox() { $("#lightbox").hidden = true; document.body.classList.remove("no-scroll"); lastFocused?.focus(); }
  function switchPhoto(delta) { openLightbox((currentPhoto + delta + portraits.length) % portraits.length); }
  $("#lightboxClose").addEventListener("click", closeLightbox);
  $("#lightboxPrev").addEventListener("click", () => switchPhoto(-1));
  $("#lightboxNext").addEventListener("click", () => switchPhoto(1));
  $("#lightbox").addEventListener("click", (event) => { if (event.target === $("#lightbox")) closeLightbox(); });
  document.addEventListener("keydown", (event) => {
    if ($("#lightbox").hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") switchPhoto(-1);
    if (event.key === "ArrowRight") switchPhoto(1);
  });
  let touchStart = 0;
  $("#lightbox").addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0].screenX; }, { passive: true });
  $("#lightbox").addEventListener("touchend", (event) => { const change = event.changedTouches[0].screenX - touchStart; if (Math.abs(change) > 45) switchPhoto(change > 0 ? -1 : 1); }, { passive: true });

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("in-view"); }), { threshold: 0.12 });
  $$(".section, .portrait").forEach((element) => observer.observe(element));
})();
