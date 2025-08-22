(function () {
  function buildTopRibbon(opts = {}) {
    const { isHome = false } = opts;
    const cfg   = window.NAV_CONFIG || {};
    const items = (cfg.items || []).filter(i => i && i.active);

    // ---- Ribbon ----
    const ribbon = document.createElement('header');
    ribbon.id = 'topRibbon';
    ribbon.setAttribute('role', 'banner');
    ribbon.style.cssText = [
      'position:relative',
      'width:100%',
      'height:15vh',
      'min-height:64px',
      `background:${isHome ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,1)'}`,
      'display:flex',
      'align-items:center',
      'justify-content:flex-start',
      'box-sizing:border-box',
      'padding:0 2rem',
      'z-index:300',
      'color:#fff',
      'font-family:Arial, sans-serif'
    ].join(';');

    // ---- Left logo (hidden on home) ----
    let logoLink = null, logoImg = null;
    if (!isHome) {
      logoLink = document.createElement('a');
      logoLink.href = '/';   // always root
      logoLink.setAttribute('aria-label', 'Go to homepage');
      logoLink.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:flex-start',
        'height:100%',
        'overflow:hidden'
      ].join(';');

      logoImg = document.createElement('img');
      logoImg.src = cfg.logoPath || 'images/logofull.png';
      logoImg.alt = (cfg.siteName || 'Site') + ' logo';
      logoImg.style.cssText = [
        'height:11.5vh',
        'max-width:50vw',
        'object-fit:contain',
        'display:block'
      ].join(';');

      logoLink.appendChild(logoImg);
      ribbon.appendChild(logoLink);
    }

    // ---- Inline nav ----
    const inlineNav = document.createElement('nav');
    inlineNav.id = 'topRibbonNav';
    inlineNav.setAttribute('aria-label', 'Primary');
    inlineNav.style.cssText = [
      'display:flex',
      'gap:1.25rem',
      'margin-left:auto',
      'align-items:center',
      'flex-wrap:wrap'
    ].join(';');

    const currentPath = normalize(location.href);
    (items.length ? items : [{label:'Home', href:'/'}]).forEach(it => {
      const a = document.createElement('a');
      a.href = it.href;
      a.textContent = it.label;
      a.style.cssText = [
        'text-decoration:none',
        'color:#fff',
        'font-weight:600',
        'font-size:2.5vh',
        'opacity:0.9',
        'white-space:nowrap'
      ].join(';');

      const isActive = normalize(it.href) === currentPath;
      if (isActive) {
        a.style.opacity = '1';
        a.style.borderBottom = '2px solid #fff';
      }

      a.onmouseenter = () => a.style.opacity = '1';
      a.onmouseleave  = () => { if (!isActive) a.style.opacity = '0.9'; };
      inlineNav.appendChild(a);
    });
    ribbon.appendChild(inlineNav);

    // ---- Hamburger ----
    const hamburger = document.createElement('button');
    hamburger.id = 'topRibbonHamburger';
    hamburger.setAttribute('aria-label', 'Toggle navigation');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.style.cssText = [
      'position:absolute',
      'top:50%',
      'right:2rem',
      'transform:translateY(-50%)',
      'display:none',
      'width:56px',
      'height:56px',
      'background:none',
      'border:none',
      'cursor:pointer',
      'z-index:1002',
      'padding:0'
    ].join(';');
    hamburger.innerHTML = `
      <span style="position:absolute;left:14px;right:14px;top:17px;height:3px;background:#fff;border-radius:2px;"></span>
      <span style="position:absolute;left:14px;right:14px;top:26px;height:3px;background:#fff;border-radius:2px;"></span>
      <span style="position:absolute;left:14px;right:14px;top:35px;height:3px;background:#fff;border-radius:2px;"></span>
    `;
    ribbon.appendChild(hamburger);

    // ---- Dropdown ----
    const dropdown = document.createElement('div');
    dropdown.id = 'ribbonDropdown';
    dropdown.style.cssText = [
      'position:relative',
      'width:100%',
      'background:rgba(0,0,0,0.95)',
      'overflow:hidden',
      'max-height:0',
      'opacity:0',
      'visibility:hidden',
      'transition:max-height 0.28s ease, opacity 0.22s ease, visibility 0.22s ease',
      'z-index:250'
    ].join(';');

    const dropNav = document.createElement('nav');
    dropNav.setAttribute('aria-label', 'Dropdown navigation');
    dropNav.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'gap:0.75rem',
      'padding:1.25rem 2rem'
    ].join(';');

    (items.length ? items : [{label:'Home', href:'/'}]).forEach(it => {
      const a = document.createElement('a');
      a.href = it.href;
      a.textContent = it.label;
      a.style.cssText = [
        'text-decoration:none',
        'color:#fff',
        'font-weight:700',
        'font-size:min(5vh,28px)',
        'letter-spacing:0.5px'
      ].join(';');
      a.addEventListener('click', () => closeDropdown());
      dropNav.appendChild(a);
    });
    dropdown.appendChild(dropNav);

    const placeholder = document.getElementById('topRibbon');
    if (placeholder && placeholder.parentElement) placeholder.replaceWith(ribbon);
    else document.body.prepend(ribbon);
    ribbon.insertAdjacentElement('afterend', dropdown);

    // ---- Dropdown logic ----
    function openDropdown() {
      hamburger.setAttribute('aria-expanded', 'true');
      dropdown.style.visibility = 'visible';
      dropdown.style.opacity = '1';
      dropdown.style.maxHeight = '60vh';
    }
    function closeDropdown() {
      hamburger.setAttribute('aria-expanded', 'false');
      dropdown.style.maxHeight = '0';
      dropdown.style.opacity   = '0';
      dropdown.style.visibility = 'hidden';
    }
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      expanded ? closeDropdown() : openDropdown();
    });

    // Layout calc (unchanged)
    function navWraps(el) {
      if (!el || el.children.length <= 1) return false;
      const t0 = el.children[0].offsetTop;
      for (let i = 1; i < el.children.length; i++) {
        if (Math.abs(el.children[i].offsetTop - t0) > 2) return true;
      }
      return false;
    }
    function navOverlapsLogo() {
      if (!logoLink) return false;
      const logoRect = logoLink.getBoundingClientRect();
      const navRect  = inlineNav.getBoundingClientRect();
      return navRect.left < (logoRect.right + 16);
    }
    function logoWouldExceed50vw() {
      if (!logoImg) return false;
      const vh = Math.max(1, window.innerHeight);
      const targetH = 0.125 * vh;
      const nw = logoImg.naturalWidth || 0;
      const nh = logoImg.naturalHeight || 1;
      const widthAtTargetH = nw * (targetH / nh);
      return widthAtTargetH > (0.5 * window.innerWidth);
    }
    function applyLayout() {
      inlineNav.style.display = 'flex';
      hamburger.style.display = 'none';
      closeDropdown();
      const needHamburger =
        logoWouldExceed50vw() || navOverlapsLogo() || navWraps(inlineNav);
      if (needHamburger) {
        hamburger.style.display = 'block';
        inlineNav.style.display = 'none';
      }
    }
    function scheduleLayout() { requestAnimationFrame(applyLayout); }
    if (logoImg) {
      if (logoImg.complete) scheduleLayout();
      else {
        logoImg.addEventListener('load', scheduleLayout, { once:true });
        setTimeout(scheduleLayout, 50);
      }
    } else {
      scheduleLayout();
    }
    window.addEventListener('resize', scheduleLayout);

    // Click outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) &&
          !ribbon.contains(e.target) &&
          hamburger.getAttribute('aria-expanded') === 'true') {
        closeDropdown();
      }
    });
  }

  // --- Normalize full URLs vs. relative paths ---
  function normalize(url) {
    if (!url) return '/';
    // Strip protocol + domain
    try {
      url = new URL(url, location.origin).pathname;
    } catch (e) {
      // if it's relative like "/cv"
      if (!url.startsWith('/')) url = '/' + url;
    }
    url = url.toLowerCase().replace(/\/+$/, '');
    if (url.endsWith('.html')) url = url.replace(/\.html$/, '');
    if (url === '' || url === '/index') return '/';
    return url;
  }

  window.buildTopRibbon = buildTopRibbon;
})();
