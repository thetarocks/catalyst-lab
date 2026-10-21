// Reading position is ephemeral: no tracking, cookies or persistence.
const progress = document.createElement("div");
progress.className = "read-progress";
progress.setAttribute("aria-hidden", "true");
document.body.append(progress);
let scheduled = false;
function update() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, scrollY / distance) : 0})`;
  scheduled = false;
}
addEventListener(
  "scroll",
  () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(update);
    }
  },
  { passive: true },
);
addEventListener("resize", update);
const links = [...document.querySelectorAll('.contents a[href^="#"]')];
const chapters = [...document.querySelectorAll(".chapter[id]")];
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries)
      if (entry.isIntersecting) {
        for (const link of links) {
          if (link.hash === `#${entry.target.id}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        }
      }
  },
  { rootMargin: "-5% 0px -70% 0px", threshold: 0 },
);
chapters.forEach((chapter) => observer.observe(chapter));
update();
