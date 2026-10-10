// Take Notes site: the right download for this computer, the latest version, the theme switch,
// the feature tabs and the reveal animations. Without JavaScript every link and section still works.
(() => {
  const root = document.documentElement;
  const REPO = "OrionTheProgrammer/TakeNotes-releases";
  const DOWNLOAD = name => `https://github.com/${REPO}/releases/latest/download/${name}`;
  const FILES = {
    windows: { name: "TakeNotes-win-Setup.exe", label: "Descargar para Windows", other: "linux", otherLabel: "También para Linux" },
    linux: { name: "TakeNotes.AppImage", label: "Descargar para Linux", other: "windows", otherLabel: "También para Windows" },
  };

  // ---- Download for this computer ----
  const agent = navigator.userAgent.toLowerCase();
  const platform = (navigator.userAgentData?.platform || navigator.platform || agent).toLowerCase();
  const mobile = /android|iphone|ipad|mobile/.test(agent);
  const os = mobile ? null
    : platform.includes("win") ? "windows"
    : platform.includes("linux") || platform.includes("x11") ? "linux"
    : platform.includes("mac") ? "mac" : null;

  const primary = document.getElementById("primary-download");
  const primaryLabel = document.getElementById("primary-label");
  const secondary = document.getElementById("secondary-download");
  const meta = document.getElementById("release-meta");

  if (FILES[os]) {
    const file = FILES[os];
    primary.href = DOWNLOAD(file.name);
    primaryLabel.textContent = file.label;
    secondary.href = DOWNLOAD(FILES[file.other].name);
    secondary.textContent = file.otherLabel;
    document.querySelector(`.card[data-os="${os}"]`)?.classList.add("detected");
  } else {
    // Mac and phones have no build yet: the main button leads to both options.
    primary.href = "#descargar";
    primaryLabel.textContent = "Ver descargas";
    secondary.hidden = true;
    meta.textContent = mobile
      ? "Take Notes es una app de computador para Windows y Linux."
      : "Por ahora Take Notes está disponible para Windows y Linux.";
  }

  const megabytes = bytes => `${Math.round(bytes / 1048576)} MB`;
  const date = iso => new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } })
    .then(response => response.ok ? response.json() : Promise.reject(response.status))
    .then(release => {
      const version = release.tag_name.replace(/^v/, "");
      const changelog = document.getElementById("changelog-link");
      changelog.href = release.html_url;
      changelog.textContent = `Novedades de la versión ${version} y versiones anteriores`;
      if (!FILES[os]) return;
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
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = root.dataset.theme || (darkQuery.matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* The choice simply lasts this visit. */ }
  });

  // ---- Feature tabs ----
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const shots = [...document.querySelectorAll("#feature-media .shot")];
  const select = tab => {
    document.getElementById("feature-media").setAttribute("aria-labelledby", tab.id);
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
