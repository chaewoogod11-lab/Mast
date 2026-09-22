function setupNav() {
  const btn = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(isOpen));
    btn.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open navigation");
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open navigation");
    btn.focus();
  });
}

function setupTopbarScroll() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  const syncTopbar = () => {
    topbar.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  syncTopbar();
  window.addEventListener("scroll", syncTopbar, { passive: true });
}

function setupReveal() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = Array.from(document.querySelectorAll(".hero__content, .section"));
  if (!targets.length) return;

  targets.forEach((el) => {
    el.classList.add("reveal-up");
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  targets.forEach((el) => observer.observe(el));
}


function setupSectionNav() {
  const topbar = document.querySelector('.topbar');
  const subnav = document.querySelector('.site-subnav');
  const links = Array.from(subnav?.querySelectorAll('a[href^="#"]') || []);
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  const sync = () => {
    const headerHeight = topbar?.getBoundingClientRect().height || 0;
    const navHeight = subnav?.getBoundingClientRect().height || 0;
    document.documentElement.style.setProperty('--topbar-height', `${headerHeight}px`);
    document.documentElement.style.setProperty('--subnav-height', `${navHeight}px`);
    let current = 0;
    sections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= headerHeight + navHeight + 24) current = index;
    });
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = sections.length - 1;
    }
    links.forEach((link, index) => {
      // Remove the original static state; aria-current is the single source of truth.
      Array.from(link.classList).filter(name => name.endsWith('--active')).forEach(name => link.classList.remove(name));
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  sync();
  const observer = new ResizeObserver(sync);
  if (topbar) observer.observe(topbar);
  if (subnav) observer.observe(subnav);
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
setupNav();
setupTopbarScroll();
setupReveal();
setupSectionNav();
