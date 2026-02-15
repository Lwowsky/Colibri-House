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

let i = 0;
const img = document.getElementById("heroPhoto");

setInterval(() => {
  i = (i + 1) % photos.length;
  img.src = photos[i];
}, 5500);
