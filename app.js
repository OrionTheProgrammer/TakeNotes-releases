// Take Notes site: the right download for this computer, the latest version, the theme switch,
// the seasonal look, the feature tabs, the help pages and the reveal animations. Without JavaScript
// every link and section still works.
(() => {
  const root = document.documentElement;
  const REPO = "OrionTheProgrammer/TakeNotes-releases";
  const DOWNLOAD = name => `https://github.com/${REPO}/releases/latest/download/${name}`;
  // Android comes from Google Play, which keeps it up to date.
  const PLAY = "https://play.google.com/store/apps/details?id=app.takenotes.android";
  const LINK = file => file.url ?? DOWNLOAD(file.name);
  const FILES = {
    windows: { name: "TakeNotes-win-Setup.exe", label: "Descargar para Windows", other: "linux", otherLabel: "También para Linux" },
    linux: { name: "TakeNotes.AppImage", label: "Descargar para Linux", other: "windows", otherLabel: "También para Windows" },
    android: { url: PLAY, label: "Descargar en Google Play", other: "windows", otherLabel: "También para Windows" },
  };

  // ---- Download for this computer ----
  const agent = navigator.userAgent.toLowerCase();
  const platform = (navigator.userAgentData?.platform || navigator.platform || agent).toLowerCase();
  const mobile = /android|iphone|ipad|mobile/.test(agent);
  const os = agent.includes("android") ? "android"
    : mobile ? null
    : platform.includes("win") ? "windows"
    : platform.includes("linux") || platform.includes("x11") ? "linux"
    : platform.includes("mac") ? "mac" : null;

  const primary = document.getElementById("primary-download");
  const primaryLabel = document.getElementById("primary-label");
  const secondary = document.getElementById("secondary-download");
  const meta = document.getElementById("release-meta");

  if (primary && FILES[os]) {
    const file = FILES[os];
    primary.href = LINK(file);
    primaryLabel.textContent = file.label;
    secondary.href = LINK(FILES[file.other]);
    secondary.textContent = file.otherLabel;
    // On the phone, a computer download is no use.
    if (os === "android") secondary.hidden = true;
    document.querySelector(`.card[data-os="${os}"]`)?.classList.add("detected");
  } else if (primary) {
    // Mac and iPhone have no build yet: the main button leads to the options.
    primary.href = "#descargar";
    primaryLabel.textContent = "Ver descargas";
    secondary.hidden = true;
    meta.textContent = mobile
      ? "Por ahora Take Notes está disponible para Android, Windows y Linux."
      : "Por ahora Take Notes está disponible para Windows, Linux y Android.";
  }

  const megabytes = bytes => `${Math.round(bytes / 1048576)} MB`;
  const date = iso => new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
  if (primary) fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } })
    .then(response => response.ok ? response.json() : Promise.reject(response.status))
    .then(release => {
      const version = release.tag_name.replace(/^v/, "");
      const changelog = document.getElementById("changelog-link");
      if (changelog) changelog.textContent = `Novedades de la versión ${version}`;
      if (!meta || !FILES[os]) return;
      const asset = release.assets.find(item => item.name === FILES[os].name);
      meta.textContent = `Versión ${version}${asset ? ` · ${megabytes(asset.size)}` : ""} · ${date(release.published_at)}`;
    })
    .catch(() => { /* The static text and links already work. */ });

  // ---- Copy the Linux install command ----
  for (const button of document.querySelectorAll("[data-copy]")) {
    button.addEventListener("click", async () => {
      const text = document.getElementById(button.dataset.copy)?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "¡Copiado!";
      } catch {
        // Without clipboard access, select the command so Ctrl+C works.
        const range = document.createRange();
        range.selectNodeContents(document.getElementById(button.dataset.copy));
        getSelection()?.removeAllRanges();
        getSelection()?.addRange(range);
        button.textContent = "Selecciónalo y copia";
      }
      setTimeout(() => { button.textContent = "Copiar"; }, 2000);
    });
  }

  // ---- Theme: follows the computer until the person picks one ----
  const darkQuery = matchMedia("(prefers-color-scheme: dark)");
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const current = root.dataset.theme || (darkQuery.matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* The choice simply lasts this visit. */ }
  });

  // ---- Seasonal look: set by season.js before the first paint ----
  const season = root.dataset.season;
  if (season) {
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.href = icon.href.replace("favicon.png", `favicon-${season}.png`);
  }

  // ---- Help pages: the topics fold away on the phone, and "En esta página" follows the reading ----
  const topics = document.querySelector(".docs-nav details");
  if (topics && matchMedia("(max-width: 960px)").matches) topics.open = false;
  const tocLinks = [...document.querySelectorAll(".docs-toc a")];
  if (tocLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(tocLinks.map(link => [decodeURIComponent(link.hash.slice(1)), link]));
    const spy = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of tocLinks) link.classList.toggle("active", link === byId.get(entry.target.id));
      }
    }, { rootMargin: "-80px 0px -70% 0px" });
    byId.forEach((_, id) => { const heading = document.getElementById(id); if (heading) spy.observe(heading); });
  }

  // ---- Feature tabs ----
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const shots = [...document.querySelectorAll("#feature-media .shot")];
  const select = tab => {
    document.getElementById("feature-media")?.setAttribute("aria-labelledby", tab.id);
    for (const other of tabs) {
      const selected = other === tab;
      other.setAttribute("aria-selected", String(selected));
      other.tabIndex = selected ? 0 : -1;
    }
    for (const shot of shots) shot.classList.toggle("is-active", shot.dataset.shot === tab.dataset.shot);
  };
  tabs.forEach((tab, index) => {
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", event => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (!step && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      const next = event.key === "Home" ? tabs[0] : event.key === "End" ? tabs.at(-1) : tabs[(index + step + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });

  // ---- Reveal: the headline word by word, then each block as it scrolls in ----
  const headline = document.querySelector("[data-words]");
  if (headline) {
    let i = 0;
    const split = node => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          const fragment = document.createDocumentFragment();
          for (const part of parts) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { fragment.append(part); continue; }
            const word = document.createElement("span");
            word.className = "word";
            word.style.setProperty("--i", i++);
            word.textContent = part;
            fragment.append(word);
          }
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          child.classList.add("word");
          child.style.setProperty("--i", i++);
        }
      }
    };
    split(headline);
    requestAnimationFrame(() => requestAnimationFrame(() => headline.classList.add("in")));
  }

  const blocks = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    blocks.forEach(block => observer.observe(block));
  } else {
    blocks.forEach(block => block.classList.add("in"));
  }
})();
