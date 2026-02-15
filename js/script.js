(() => {
  const el = document.getElementById("yearRange");
  if (!el) return;

  const start = Number(el.dataset.start) || new Date().getFullYear();
  const now = new Date().getFullYear();

  el.textContent = (start === now) ? `${now}` : `${start}–${now}`;
})();

const photos = [
  "img/hero/photo1.jpg",
  "img/hero/photo2.jpg",
  "img/hero/photo3.jpg",
  "img/hero/photo4.jpg",
  "img/hero/photo5.jpg",
  "img/hero/photo6.jpg",
  "img/hero/photo7.jpg",
  "img/hero/photo8.jpg",
  "img/hero/photo9.jpg",
  "img/hero/photo10.jpg",
  "img/hero/photo11.jpg",
  "img/hero/photo12.jpg",
  "img/hero/photo13.jpg",
];

const img = document.getElementById("heroPhoto");
let i = 0;

const SHOW_MS = 3500;   // скільки показуємо кадр
const FADE_MS = 700;    // тривалість fade (має збігатися з CSS)

// (необов'язково) попереднє завантаження, щоб переходи були ще рівніші
photos.forEach(src => { const pre = new Image(); pre.src = src; });

function сменитьФото() {
  img.classList.add("fade-out");

  setTimeout(() => {
    i = (i + 1) % photos.length;
    const nextSrc = photos[i];

    // чекаємо, поки наступне фото завантажиться
    const pre = new Image();
    pre.src = nextSrc;
    pre.onload = () => {
      img.src = nextSrc;
      img.classList.remove("fade-out");
      setTimeout(сменитьФото, SHOW_MS);
    };
  }, FADE_MS);
}

// старт
setTimeout(сменитьФото, SHOW_MS);