// Seasonal look of the site, like the app's: Halloween from 1 October to 2 November. Runs before the
// first paint so the page never flashes the regular colours. ?temporada=halloween shows it any day.
(() => {
  const root = document.documentElement;
  root.classList.add("js");
  try { const theme = localStorage.getItem("theme"); if (theme) root.dataset.theme = theme; } catch { /* Private mode: follow the system. */ }
  const today = new Date();
  const month = today.getMonth(), day = today.getDate();
  let season = month === 9 || (month === 10 && day <= 2) ? "halloween" : null;
  const asked = new URLSearchParams(location.search).get("temporada");
  if (asked === "halloween") season = "halloween";
  if (asked === "ninguna") season = null;
  if (season) root.dataset.season = season;
})();
