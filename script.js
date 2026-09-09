(() => {
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const stage = document.getElementById("networkStage");
  const year = document.getElementById("year");

  if (year) year.textContent = new Date().getFullYear();

  if (menuBtn && mobileMenu) {
    const closeMenu = () => {
      menuBtn.setAttribute("aria-expanded", "false");
      mobileMenu.classList.remove("is-open");
      mobileMenu.setAttribute("aria-hidden", "true");
    };

    menuBtn.addEventListener("click", () => {
      const open = menuBtn.getAttribute("aria-expanded") !== "true";
      menuBtn.setAttribute("aria-expanded", String(open));
      mobileMenu.classList.toggle("is-open", open);
      mobileMenu.setAttribute("aria-hidden", String(!open));
    });

    mobileMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  }

  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });

    items.forEach(item => observer.observe(item));
  } else {
    items.forEach(item => item.classList.add("is-visible"));
  }

  if (stage && window.matchMedia("(pointer:fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stage.addEventListener("pointermove", e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.transform = `perspective(1000px) rotateX(${(-y * 1.4).toFixed(2)}deg) rotateY(${(x * 1.7).toFixed(2)}deg)`;
    });

    stage.addEventListener("pointerleave", () => {
      stage.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    });
  }
})();
