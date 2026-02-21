(() => {
  const S = window.MenuModal;
  if (!S || typeof S.escapeHtml !== "function") return;

  function buildSlidesOnce(els) {
    if (S.built) return;
    S.built = true;

    if (!els?.carTrack || !els?.carDots) return;

    els.carTrack.innerHTML = "";
    els.carDots.innerHTML = "";

    if (!S.items.length) {
      els.carTrack.innerHTML = `<div class="carSlide placeholder"></div>`;
      return;
    }

    S.items.forEach((it) => {
      const slide = document.createElement("div");
      slide.className = "carSlide";
      slide.innerHTML = it.cover
        ? `<img src="${S.escapeHtml(it.cover)}" alt="${S.escapeHtml(
            it.title,
          )}" loading="eager" decoding="async" draggable="false">`
        : `<div class="carSlide placeholder"></div>`;
      els.carTrack.appendChild(slide);
    });

    const many = S.items.length > 1;
    if (els.carPrev) els.carPrev.style.display = many ? "grid" : "none";
    if (els.carNext) els.carNext.style.display = many ? "grid" : "none";
    if (els.carDots) els.carDots.style.display = many ? "flex" : "none";

    if (many) {
      S.items.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carDot";
        dot.addEventListener("click", () => S.goToDish(i, true));
        els.carDots.appendChild(dot);
      });
    }
  }

  function updateText(i, els) {
    const item = S.items[i];
    if (!item || !els) return;

    if (els.dishTitle) els.dishTitle.textContent = item.title || "";
    if (els.dishDesc) els.dishDesc.textContent = item.desc || "";
    if (els.dishTag) els.dishTag.textContent = item.tag || "";
    if (els.dishPrice) els.dishPrice.textContent = item.price || "";
  }

  function updateDots(els) {
    if (!els?.carDots) return;
    const dots = [...els.carDots.querySelectorAll(".carDot")];
    dots.forEach((d, i) => d.classList.toggle("isActive", i === S.index));
  }

  function setTransformIndex(i, animate, els) {
    if (!els?.carTrack) return;
    els.carTrack.style.transition = animate
      ? `transform ${S.ANIM_MS}ms ease`
      : "none";
    els.carTrack.style.transform = `translate3d(${-i * 100}%, 0, 0)`;
  }

  function goToDish(i, animate = true) {
    const els = S.getModalEls();
    if (!S.items.length || !els?.carTrack) return;
    if (S.isAnimating && animate) return;

    S.index = (i + S.items.length) % S.items.length;

    updateText(S.index, els);
    updateDots(els);

    if (!animate) {
      setTransformIndex(S.index, false, els);
      requestAnimationFrame(() => {
        if (els.carTrack)
          els.carTrack.style.transition = `transform ${S.ANIM_MS}ms ease`;
      });
      return;
    }

    S.isAnimating = true;
    setTransformIndex(S.index, true, els);
    window.setTimeout(() => (S.isAnimating = false), S.ANIM_MS + 30);
  }

  function openDishByIndex(i) {
    const els = S.getModalEls();
    if (!els?.dishModal) return;

    if (!S.items.length) S.collectVisibleItems();
    if (!S.items.length) return;

    buildSlidesOnce(els);

    els.dishModal.classList.add("open");
    els.dishModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    goToDish(i, false);
  }

  function closeDishModal() {
    const els = S.getModalEls();
    if (!els?.dishModal) return;

    els.dishModal.classList.remove("open");
    els.dishModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function prevDish() {
    goToDish(S.index - 1, true);
  }

  function nextDish() {
    goToDish(S.index + 1, true);
  }

  // export API for other modules
  S.buildSlidesOnce = buildSlidesOnce;
  S.goToDish = goToDish;
  S.openDishByIndex = openDishByIndex;
  S.closeDishModal = closeDishModal;
  S.prevDish = prevDish;
  S.nextDish = nextDish;
})();
