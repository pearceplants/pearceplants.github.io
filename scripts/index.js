// Website/scripts/index.js
(function () {
  const root = document.getElementById('introSection');
  if (!root) return;

  // Ensure the section doesn't force extra height
  root.style.minHeight = 'auto';

  // Wipe any existing placeholder content
  root.innerHTML = '';

  // --- Inject CSS (once) ---
  const styleId = 'intro-responsive-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .introFlex {
        display: flex;
        flex-direction: row;
        align-items: center; /* vertical centering of image vs text */
        justify-content: space-between;
        gap: 2rem;
        max-width: 900px;
        margin: 0 auto;
        height: auto;       /* don't force full height */
      }

      .introText {
        flex: 2;
        line-height: 1.7;
        font-size: 1.05rem;
        min-width: 0;
      }

      .introImg {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .introImg img {
        max-width: 240px;   /* slightly larger */
        height: auto;
        border-radius: 0;   /* no rounded corners */
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: block;
      }

      /* Style for disabled (inactive) nav-like text */
      .link-disabled {
        color: #666;
        text-decoration: none;
        cursor: not-allowed;
      }

      @media (max-width: 700px) {
        .introFlex {
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }
        .introImg img {
          max-width: 75vw;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Helper: make a link or an inert text node depending on active flag
  function linkOrText({ label, href, active }) {
    if (active && href && href !== 'EXTERNAL') {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      return a;
    }
    // Inactive: render as accessible, non-clickable text
    const span = document.createElement('span');
    span.textContent = label;
    span.className = 'link-disabled';
    span.setAttribute('aria-disabled', 'true');
    return span;
  }

  // Get hrefs/active from NAV_CONFIG
  const items = (window.NAV_CONFIG?.items || []);
  const photoItem = items.find(i => i.label === 'Photography') || { href: 'photography/', active: true };
  const researchItem = items.find(i => i.label === 'Research')   || { href: 'research/', active: true };

  // --- Outer container (flex row for text + image) ---
  const outer = document.createElement('div');
  outer.className = 'introFlex';

  // --- Text wrapper ---
  const wrap = document.createElement('div');
  wrap.className = 'introText';

  const h = document.createElement('h2');
  h.textContent = 'About Me';
  h.style.margin = '0 0 0.75rem 0';
  h.style.fontWeight = '700';
  h.style.fontFamily = 'Arial, sans-serif';

  const p1 = document.createElement('p');
  p1.innerHTML =
    'I’m a botanist currently studying as an undergraduate student at the University of Utah in the Salt Lake Valley. I am interested in researching the taxonomy, evolution, and pollination ecology of native plants, with a focus on the genus <i>Ribes</i> (currants and gooseberries), as well as the Composite family.';

  const p2 = document.createElement('p');
  p2.textContent =
    'I also love plant macro photography and cultivating native plants from seed. I spend much of my free time looking for cool plants, taking and editing macro photos to showcase them, and growing their seeds in my backyard.';

  // Build p3 with inline (possibly disabled) links pulled from NAV_CONFIG
  const p3 = document.createElement('p');
  // Compose: "This website showcases my [photography] and my [botanical research]. ..."
  const p3Start = document.createTextNode('This website showcases my ');
  const p3And   = document.createTextNode(' and my ');
  const p3Rest  = document.createTextNode('. Whenever possible, I aim to synthesize the two; I view science and art as complementary, and I believe that both sides of my work complement the other.');

  const photoNode   = linkOrText({ label: 'photography', href: photoItem.href, active: !!photoItem.active });
  const researchNode= linkOrText({ label: 'botanical research', href: researchItem.href, active: !!researchItem.active });

  p3.append(p3Start, photoNode, p3And, researchNode, p3Rest);

  const p4 = document.createElement('p');
  p4.textContent = 'Follow me on the below platforms for updates:';

  const p5 = document.createElement('p');
  p5.innerHTML =
    '<a href="https://instagram.com/w_pearce_plants" target="_blank" rel="noopener">Instagram</a>';

  const p6 = document.createElement('p');
  p6.innerHTML =
    '<a href="https://inaturalist.org/people/4449395" target="_blank" rel="noopener">iNaturalist</a>';

  const p7 = document.createElement('p');
  p7.innerHTML =
    '<a href="https://bsky.app/profile/w-pearce-plants.bsky.social" target="_blank" rel="noopener">Bluesky</a>';

  wrap.append(h, p1, p2, p3, p4, p5, p6, p7);

  // --- Image wrapper ---
  const imgWrap = document.createElement('div');
  imgWrap.className = 'introImg';

  const img = document.createElement('img');
  img.src = 'images/headshot.jpg';
  img.alt = 'Headshot of Will Pearce';
  img.loading = 'eager';
  img.decoding = 'async';
  img.setAttribute('fetchpriority', 'low');

  imgWrap.appendChild(img);

  // --- Assemble ---
  outer.append(wrap, imgWrap);
  root.appendChild(outer);
})();
