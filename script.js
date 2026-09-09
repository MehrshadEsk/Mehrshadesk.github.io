(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const topbar = document.getElementById("topbar");
  const progressLine = document.getElementById("progressLine");
  const cursorAura = document.getElementById("cursorAura");

  // Visual themes — four curated art directions
  const themeToggle = document.getElementById("themeToggle");
  const themePanel = document.getElementById("themePanel");
  const themeClose = document.getElementById("themeClose");
  const themeOptions = [...document.querySelectorAll("[data-theme-choice]")];
  const modeBadge = document.getElementById("modeBadge");
  const themeMeta = document.getElementById("themeColorMeta");
  const themeNames = {
    obsidian: "OBSIDIAN SIGNAL",
    cobalt: "DEEP COBALT",
    ivory: "IVORY EDITORIAL",
    orchid: "GRAPHITE ORCHID"
  };
  const themeColors = {
    obsidian: "#06080d", cobalt: "#061020", ivory: "#f2efe8", orchid: "#0b0a10"
  };
  const validThemes = Object.keys(themeNames);
  let storedTheme = localStorage.getItem("mehrshad-theme");
  if (storedTheme === "dark") storedTheme = "obsidian";
  if (storedTheme === "light") storedTheme = "ivory";

  const applyTheme = (theme, persist = true) => {
    const next = validThemes.includes(theme) ? theme : "obsidian";
    root.dataset.theme = next;
    themeOptions.forEach(option => {
      const active = option.dataset.themeChoice === next;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-selected", String(active));
    });
    if (modeBadge) modeBadge.querySelector("span").textContent = themeNames[next];
    if (themeMeta) themeMeta.setAttribute("content", themeColors[next]);
    if (persist) localStorage.setItem("mehrshad-theme", next);
  };
  applyTheme(storedTheme || "obsidian", false);

  const setThemePanel = (open) => {
    if (!themePanel || !themeToggle) return;
    themePanel.classList.toggle("is-open", open);
    themePanel.setAttribute("aria-hidden", String(!open));
    themeToggle.setAttribute("aria-expanded", String(open));
  };
  themeToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    setThemePanel(!themePanel?.classList.contains("is-open"));
  });
  themeClose?.addEventListener("click", () => setThemePanel(false));
  themeOptions.forEach(option => option.addEventListener("click", () => {
    applyTheme(option.dataset.themeChoice);
    setThemePanel(false);
  }));
  document.addEventListener("pointerdown", (event) => {
    if (!themePanel?.classList.contains("is-open")) return;
    if (!themePanel.contains(event.target) && !themeToggle?.contains(event.target)) setThemePanel(false);
  });

  // Scroll state + progress
  const updateScroll = () => {
    const y = window.scrollY;
    topbar?.classList.toggle("is-scrolled", y > 18);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (y / max) * 100 : 0;
    if (progressLine) progressLine.style.width = `${pct}%`;
  };
  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });

  // Cursor aura
  if (cursorAura && window.matchMedia("(pointer:fine)").matches) {
    let tx = -1000, ty = -1000, x = tx, y = ty;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive:true });
    const follow = () => {
      x += (tx - x) * 0.11;
      y += (ty - y) * 0.11;
      cursorAura.style.transform = `translate3d(${x}px,${y}px,0)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  // Reveal observer
  const revealItems = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    revealItems.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min((i % 4) * 55, 165)}ms`;
      revealObserver.observe(el);
    });
  } else {
    revealItems.forEach(el => el.classList.add("is-visible"));
  }

  // Animated counters
  const counters = [...document.querySelectorAll("[data-count]")];
  const animateCounter = (el) => {
    const target = Number(el.dataset.count || 0);
    const start = performance.now();
    const duration = 1150;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .6 });
    counters.forEach(el => countObserver.observe(el));
  }

  // Active section rail
  const sections = [...document.querySelectorAll("main section[id]")];
  const railDots = [...document.querySelectorAll(".rail-dot")];
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      railDots.forEach(dot => dot.classList.toggle("is-active", dot.dataset.section === visible.target.id));
    }, { threshold: [0.18, 0.35, 0.55], rootMargin: "-20% 0px -55% 0px" });
    sections.forEach(s => sectionObserver.observe(s));
  }

  // Mobile menu
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  const setMobileMenu = (open) => {
    if (!mobileBtn || !mobileMenu) return;
    mobileBtn.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open);
  };

  mobileBtn?.addEventListener("click", () => {
    setMobileMenu(mobileBtn.getAttribute("aria-expanded") !== "true");
  });
  mobileMenu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMobileMenu(false)));

  // Publication filters
  const filterButtons = [...document.querySelectorAll(".filter-btn")];
  const papers = [...document.querySelectorAll(".paper-row")];
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.dataset.filter;
      papers.forEach(paper => {
        const types = (paper.dataset.type || "").split(/\s+/);
        paper.classList.toggle("is-hidden", filter !== "all" && !types.includes(filter));
      });
    });
  });

  // Hero visual: gentle pointer parallax
  const signalScene = document.getElementById("signalScene");
  if (signalScene && window.matchMedia("(pointer:fine)").matches) {
    signalScene.addEventListener("pointermove", (e) => {
      const r = signalScene.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      signalScene.style.transform = `perspective(1100px) rotateX(${(-py * 2.2).toFixed(2)}deg) rotateY(${(px * 2.6).toFixed(2)}deg)`;
    });
    signalScene.addEventListener("pointerleave", () => {
      signalScene.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)";
    });
  }

  // Command palette
  const commandOpen = document.getElementById("commandOpen");
  const commandOverlay = document.getElementById("commandOverlay");
  const commandInput = document.getElementById("commandInput");
  const commandList = document.getElementById("commandList");
  let keyboardIndex = 0;

  const commandItems = () => [...commandList.querySelectorAll("button, a")].filter(el => el.style.display !== "none");

  const highlightCommand = () => {
    const items = commandItems();
    items.forEach(i => i.classList.remove("is-keyboard"));
    if (items.length) {
      keyboardIndex = Math.max(0, Math.min(keyboardIndex, items.length - 1));
      items[keyboardIndex].classList.add("is-keyboard");
      items[keyboardIndex].scrollIntoView({ block:"nearest" });
    }
  };

  const setCommand = (open) => {
    if (!commandOverlay) return;
    commandOverlay.classList.toggle("is-open", open);
    commandOverlay.setAttribute("aria-hidden", String(!open));
    body.classList.toggle("command-open", open);
    if (open) {
      commandInput.value = "";
      commandItems().forEach(i => i.style.display = "");
      keyboardIndex = 0;
      highlightCommand();
      setTimeout(() => commandInput.focus(), 40);
    }
  };

  commandOpen?.addEventListener("click", () => setCommand(true));
  commandOverlay?.addEventListener("click", e => {
    if (e.target === commandOverlay) setCommand(false);
  });

  commandInput?.addEventListener("input", () => {
    const q = commandInput.value.trim().toLowerCase();
    [...commandList.querySelectorAll("button,a")].forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(q) ? "" : "none";
    });
    keyboardIndex = 0;
    highlightCommand();
  });

  commandList?.querySelectorAll("button[data-target]").forEach(btn => {
    btn.addEventListener("click", () => {
      setCommand(false);
      document.querySelector(btn.dataset.target)?.scrollIntoView({ behavior:"smooth" });
    });
  });

  document.addEventListener("keydown", e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "t" && !commandOverlay?.classList.contains("is-open")) {
      e.preventDefault();
      setThemePanel(!themePanel?.classList.contains("is-open"));
      return;
    }
    if (e.key === "Escape" && themePanel?.classList.contains("is-open")) {
      setThemePanel(false);
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setCommand(!commandOverlay.classList.contains("is-open"));
      return;
    }
    if (!commandOverlay?.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      setCommand(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault(); keyboardIndex++; highlightCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); keyboardIndex--; highlightCommand();
    } else if (e.key === "Enter") {
      const item = commandItems()[keyboardIndex];
      if (item) item.click();
    }
  });

  // Smooth same-page anchor behavior
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior:"smooth", block:"start" });
      history.replaceState(null, "", id);
    });
  });

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
