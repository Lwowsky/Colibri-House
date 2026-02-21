(() => {
  const escapeHtml = window.App?.escapeHtml;
  if (typeof escapeHtml !== "function") return;

  window.MenuModal = window.MenuModal || {
    items: [],
    index: 0,
    built: false,
    isAnimating: false,
    ANIM_MS: 280,
    THRESHOLD: 70,
  };

  const S = window.MenuModal;
  S.escapeHtml = escapeHtml;

  function getMenuGrid() {
    return document.getElementById("menuGrid");
  }

  function getModalEls() {
    const dishModal = document.getElementById("dishModal");
    if (!dishModal) return null;

    return {
      dishModal,
      dishClose: document.getElementById("dishClose"),
      dishTitle: document.getElementById("dishTitle"),
      dishDesc: document.getElementById("dishDesc"),
      dishTag: document.getElementById("dishTag"),
      dishPrice: document.getElementById("dishPrice"),

      carTrack: document.getElementById("carTrack"),
      carDots: document.getElementById("carDots"),
      carPrev: document.getElementById("carPrev"),
      carNext: document.getElementById("carNext"),

      carViewport: dishModal.querySelector(".carViewport"),
    };
  }

  function collectVisibleItems() {
    const menuGrid = getMenuGrid();
    if (!menuGrid) return;

    const cards = [...menuGrid.querySelectorAll(".menuCard")];

    S.items = cards.map((card) => {
      let imgs = [];
      try {
        imgs = JSON.parse(card.dataset.imgs || "[]");
      } catch {
        imgs = [];
      }

      const cover =
        (Array.isArray(imgs) && imgs.length ? imgs[0] : null) ||
        card.dataset.img ||
        "";

      return {
        title: card.dataset.title || "",
        desc: card.dataset.desc || "",
        price: card.dataset.price || "",
        tag: card.dataset.tag || "",
        cover,
      };
    });

    S.built = false;
  }

  // export API
  S.getMenuGrid = getMenuGrid;
  S.getModalEls = getModalEls;
  S.collectVisibleItems = collectVisibleItems;
})();
