// Website/scripts/bottomRibbon.js
function buildBottomRibbon() {
  const cfg = window.NAV_CONFIG?.bottomLogos || [];

  // Remove existing ribbon if re-run
  const old = document.getElementById("bottomRibbon");
  if (old) old.remove();

  // ---- Inject style override to ensure ribbon stays above collage ----
  const styleId = "bottomRibbon-zfix-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #bottomRibbon {
        position: relative;   /* create a stacking context */
        z-index: 1000 !important; /* above collage & other ribbons */
      }
    `;
    document.head.appendChild(style);
  }

  // Container
  const ribbon = document.createElement("div");
  ribbon.id = "bottomRibbon";
  ribbon.style.width = "100%";
  ribbon.style.height = "15vh";
  ribbon.style.background = "black";
  ribbon.style.display = "flex";
  ribbon.style.flexDirection = "column";
  ribbon.style.justifyContent = "center";
  ribbon.style.alignItems = "center";
  ribbon.style.gap = "2vh";
  ribbon.style.color = "white";
  ribbon.style.zIndex = "1000"; // direct JS fallback

  // Text line
  const text = document.createElement("div");
  text.style.fontSize = "2vh";
  text.style.textAlign = "center";
  text.style.margin = "0 auto";
  text.style.maxWidth = "80vw";

  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  const yearText = currentYear > startYear ? `${startYear}-${currentYear}` : `${startYear}`;
  text.textContent = `© ${yearText} Will Pearce. All rights reserved.  |  🇵🇸`;
  ribbon.appendChild(text);

  // Logos row
  if (cfg.length > 0) {
    const logosRow = document.createElement("div");
    logosRow.style.display = "flex";
    logosRow.style.justifyContent = "center";
    logosRow.style.alignItems = "center";
    logosRow.style.gap = "2.5vw";

    cfg.forEach(item => {
      if (!item.active) return;
      const a = document.createElement("a");
      a.href = item.href;
      a.target = "_blank";
      a.rel = "noopener";

      const img = document.createElement("img");
      img.src = item.logoPath; // ensure your config uses logoPath
      img.style.height = "3vh";
      img.style.width = "auto";
      img.style.objectFit = "contain";

      a.appendChild(img);
      logosRow.appendChild(a);
    });

    ribbon.appendChild(logosRow);
  }

  document.body.appendChild(ribbon);
}
