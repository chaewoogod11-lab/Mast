const events = [
  {
    title: "Strategy Workshop #1 - Case Fundamentals",
    date: "Mar 18, 2026",
    time: "6:30 PM",
    location: "IU Campus - Room TBD",
    tag: "Workshop",
    description: "Learn structured thinking, problem framing, and how to communicate recommendations clearly."
  },
  {
    title: "Guest Speaker - Strategy in Real Business",
    date: "Apr 2, 2026",
    time: "7:00 PM",
    location: "Zoom / Hybrid",
    tag: "Speaker",
    description: "Industry partner session + Q&A on real-world decision-making."
  },
  {
    title: "Project Kickoff - Team Matching",
    date: "Apr 9, 2026",
    time: "6:30 PM",
    location: "IU Campus",
    tag: "Project",
    description: "Form teams, pick themes, and set weekly deliverables with mentor feedback."
  }
];

const team = [
  { name: "Heejung Kang", role: "President" },
  { name: "Chaewoo Cha", role: "Vice President" },
  { name: "Inseok Song", role: "External Team Leader" },
  { name: "Jay Lee", role: "Analyst" },
  { name: "Claire Kim", role: "Analyst" },
  { name: "Benny Lim", role: "Analyst" },
  { name: "Gunn Park", role: "Analyst" },
  { name: "Hwiro Kim", role: "Analyst" },
  { name: "Sia Park", role: "Analyst" },
  { name: "Jennifer Ha", role: "Analyst" }
];

const resources = [
  {
    title: "MAST Case Template (Google Docs)",
    desc: "A clean structure for writing recommendations and supporting analysis.",
    href: "#"
  },
  {
    title: "Workshop Slides Archive",
    desc: "All decks and notes organized by semester.",
    href: "#"
  },
  {
    title: "Interview Prep Pack",
    desc: "Behavioral + basic case frameworks + practice prompts.",
    href: "#"
  }
];

const stats = {
  workshopsPerSemester: 6,
  guestSpeakersPerYear: 8,
  handsOnProjects: 3
};

function mountEvents() {
  const grid = document.getElementById("eventsGrid");
  if (!grid) return;

  grid.innerHTML = events.map((e) => `
    <article class="card">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <h3 style="margin:0;">${e.title}</h3>
        <span class="badge">${e.tag}</span>
      </div>
      <p class="event__meta" style="margin:10px 0 10px;">
        <b>${e.date}</b> - ${e.time}<br/>
        ${e.location}
      </p>
      <p class="muted">${e.description}</p>
    </article>
  `).join("");
}

function mountTeam() {
  const grid = document.getElementById("teamGrid");
  if (!grid) return;

  grid.innerHTML = team.map((m) => `
    <article class="card">
      <div class="avatar" aria-hidden="true"></div>
      <div>
        <div style="font-weight:900;">${m.name}</div>
        <div class="role">${m.role}</div>
      </div>
    </article>
  `).join("");
}

function mountResources() {
  const grid = document.getElementById("resourcesGrid");
  if (!grid) return;

  grid.innerHTML = resources.map((r) => `
    <a class="resource__link" href="${r.href}" target="_blank" rel="noreferrer">
      <div class="resource__title">${r.title}</div>
      <div class="resource__desc">${r.desc}</div>
      <div class="badge" style="width:max-content; margin-top:6px;">Open</div>
    </a>
  `).join("");
}

function mountStats() {
  const workshops = document.getElementById("statWorkshops");
  const speakers = document.getElementById("statSpeakers");
  const projects = document.getElementById("statProjects");

  if (!workshops || !speakers || !projects) return;

  workshops.textContent = stats.workshopsPerSemester;
  speakers.textContent = stats.guestSpeakersPerYear;
  projects.textContent = stats.handsOnProjects;
}

function setupNav() {
  const btn = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    });
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

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = data.get("name");
    const org = data.get("org");
    const email = data.get("email");
    const message = data.get("message");

    const subject = encodeURIComponent(`[MAST Partnership Inquiry] ${org ? `${org} - ` : ""}${name}`);
    const body = encodeURIComponent(
`Name: ${name}
Organization: ${org || "-"}
Email: ${email}

Message:
${message}
`
    );

    window.location.href = `mailto:mast@iu.edu?subject=${subject}&body=${body}`;
  });
}

function setupTeamSubnav() {
  const links = document.querySelectorAll(".team-subnav__link");
  if (!links.length) return;

  const sectionIds = Array.from(links).map((a) => a.getAttribute("href").replace("#", ""));
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

  const subnavHeight = document.querySelector(".team-subnav")?.offsetHeight || 0;
  const topbarHeight = document.querySelector(".topbar")?.offsetHeight || 0;
  const offset = topbarHeight + subnavHeight + 16;

  const activate = () => {
    let current = sectionIds[0];
    sections.forEach((sec) => {
      if (window.scrollY + offset >= sec.offsetTop) {
        current = sec.id;
      }
    });
    links.forEach((a) => {
      a.classList.toggle("team-subnav__link--active", a.getAttribute("href") === `#${current}`);
    });
  };

  activate();
  window.addEventListener("scroll", activate, { passive: true });
}

const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear();
}

mountEvents();
mountTeam();
mountResources();
mountStats();
setupNav();
setupTopbarScroll();
setupReveal();
setupContactForm();
setupTeamSubnav();