/**
 * Load HTML Template
 * @param {string} name The name of the template
 * @returns {Promise<HTMLTemplateElement>} The template
 */
async function loadTemplate(blockName) {
  const href = `${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.html`;

  return new Promise((resolve, reject) => {
    const id = href.split('/').pop().split('.').shift();

    const block = document.querySelector(`template[id="${id}"]`);

    if (block) {
      resolve();
      return;
    }

    fetch(href).then((response) => {
      if (response.ok) {
        response
          .text()
          .then((text) => {
            const container = document.createElement('div');

            container.innerHTML = text.trim();

            const html = container.firstChild;

            if (html) {
              html.id = id;
              document.body.append(html);
            }
          })
          .finally(resolve);
      } else {
        reject();
      }
    });
  });
}

/**
 * Load Block
 * @param {string} href The path to the block
 * @returns {Promise<HTMLElement>} The block
 */
async function loadBlock(blockName) {
  const href = `${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.js`;

  return new Promise((resolve, reject) => {
    import(href)
      .then((mod) => {
        if (mod.default) {
          resolve({
            name: blockName,
            className: mod.default,
          });
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn(`Failed to load module for ${blockName}`);
        reject(error);
      });
  });
}

/**
 * Loads a CSS file.
 * @param {string} href URL to the CSS file
 */
async function loadCSS(href) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.append(link);
    } else {
      resolve();
    }
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);

  try {
    if (!window.location.hostname.includes('localhost')) { sessionStorage.setItem('fonts-loaded', 'true'); }
  } catch (e) {
    // do nothing
  }
}

/**
 * Add <img> for icon, prefixed with codeBasePath and optional prefix.
 * @param {span} [element] span element with icon classes
 */
function decorateIcon(elem) {
  const iconName = Array.from(elem.classList)
    .find((c) => c.startsWith('icon-'))
    .substring(5);
  const img = document.createElement('img');
  img.dataset.iconName = iconName;
  img.src = `${window.hlx.codeBasePath}/icons/${iconName}.svg`;
  img.loading = 'lazy';
  elem.append(img);
}

/**
 * Decorates paragraphs containing a single link as buttons.
 * @param {Element} element container element
 */
function decorateButton(a) {
  a.title = a.title || a.textContent;

  if (a.href !== a.textContent) {
    const up = a.parentElement;
    const twoup = a.parentElement.parentElement;

    if (a.querySelector('img')) return;

    if (
      up.childNodes.length === 1
      && up.tagName === 'STRONG'
      && twoup.childNodes.length === 1
      && twoup.tagName === 'P'
    ) {
      a.className = 'button primary';
    }

    if (
      up.childNodes.length === 1
      && up.tagName === 'EM'
      && twoup.childNodes.length === 1
      && twoup.tagName === 'P'
    ) {
      a.className = 'button secondary';
    }
  }
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock() {
  const main = document.querySelector('main');
  const h1 = main.querySelector('main h1');
  const picture = main.querySelector('main p > picture');

  if (
    h1
    && picture
    // eslint-disable-next-line no-bitwise
    && h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING
  ) {
    const section = document.createElement('div');
    section.classList.add('hero');
    section.append(picture.cloneNode(true));
    section.append(h1.cloneNode(true));

    picture.parentElement.remove();
    h1.remove();

    main.prepend(section);
  }
}

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 * @param {string} data.source DOM node that is the source of a checkpoint event,
 * identified by #id or .classname
 * @param {string} data.target subject of the checkpoint event,
 * for instance the href of a link, or a search term
 */
export function sampleRUM(checkpoint, data = {}) {
  sampleRUM.defer = sampleRUM.defer || [];
  const defer = (fnname) => {
    sampleRUM[fnname] = sampleRUM[fnname]
      || ((...args) => sampleRUM.defer.push({ fnname, args }));
  };
  sampleRUM.drain = sampleRUM.drain
    || ((dfnname, fn) => {
      sampleRUM[dfnname] = fn;
      sampleRUM.defer
        .filter(({ fnname }) => dfnname === fnname)
        .forEach(({ fnname, args }) => sampleRUM[fnname](...args));
    });
  sampleRUM.always = sampleRUM.always || [];
  sampleRUM.always.on = (chkpnt, fn) => {
    sampleRUM.always[chkpnt] = fn;
  };
  sampleRUM.on = (chkpnt, fn) => {
    sampleRUM.cases[chkpnt] = fn;
  };
  defer('observe');
  defer('cwv');
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum) {
      const usp = new URLSearchParams(window.location.search);
      const weight = usp.get('rum') === 'on' ? 1 : 100; // with parameter, weight is 1. Defaults to 100.
      const id = Array.from({ length: 75 }, (_, i) => String.fromCharCode(48 + i))
        .filter((a) => /\d|[A-Z]/i.test(a))
        .filter(() => Math.random() * 75 > 70)
        .join('');
      const random = Math.random();
      const isSelected = random * weight < 1;
      const firstReadTime = Date.now();
      const urlSanitizers = {
        full: () => window.location.href,
        origin: () => window.location.origin,
        path: () => window.location.href.replace(/\?.*$/, ''),
      };
      // eslint-disable-next-line object-curly-newline, max-len
      window.hlx.rum = {
        weight,
        id,
        random,
        isSelected,
        firstReadTime,
        sampleRUM,
        sanitizeURL: urlSanitizers[window.hlx.RUM_MASK_URL || 'path'],
      };
    }
    const { weight, id, firstReadTime } = window.hlx.rum;
    if (window.hlx && window.hlx.rum && window.hlx.rum.isSelected) {
      const knownProperties = [
        'weight',
        'id',
        'referer',
        'checkpoint',
        't',
        'source',
        'target',
        'cwv',
        'CLS',
        'FID',
        'LCP',
        'INP',
      ];
      const sendPing = (pdata = data) => {
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const body = JSON.stringify(
          {
            weight,
            id,
            referer: window.hlx.rum.sanitizeURL(),
            checkpoint,
            t: Date.now() - firstReadTime,
            ...data,
          },
          knownProperties,
        );
        const url = `https://rum.hlx.page/.rum/${weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
        // eslint-disable-next-line no-console
        console.debug(`ping:${checkpoint}`, pdata);
      };
      sampleRUM.cases = sampleRUM.cases || {
        cwv: () => sampleRUM.cwv(data) || true,
        lazy: () => {
          // use classic script to avoid CORS issues
          const script = document.createElement('script');
          script.src = 'https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@^1/src/index.js';
          document.head.appendChild(script);
          return true;
        },
      };
      sendPing(data);
      if (sampleRUM.cases[checkpoint]) {
        sampleRUM.cases[checkpoint]();
      }
    }
    if (sampleRUM.always[checkpoint]) {
      sampleRUM.always[checkpoint](data);
    }
  } catch (error) {
    // something went wrong
  }
}

/**
 * Setup block utils.
 */
function setup() {
  window.hlx = window.hlx || {};
  window.hlx.RUM_MASK_URL = 'full';
  window.hlx.codeBasePath = '';
  window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';

  const scriptEl = document.querySelector('script[src$="/scripts/scripts.js"]');
  if (scriptEl) {
    try {
      [window.hlx.codeBasePath] = new URL(scriptEl.src).pathname.split(
        '/scripts/scripts.js',
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }
}

/** Eager load first image */
function loadEagerImages() {
  // on load, eager load if image is majorly visible in the viewport
  const images = document.querySelectorAll('img');

  images.forEach((img) => {
    const visible = img.getBoundingClientRect().top < window.innerHeight / 1.5;

    if (visible) {
      img.setAttribute('loading', 'eager');
    }
  });
}

function transformToCustomElement(block) {
  const tagName = `aem-${block.getAttribute('class')?.split(' ')[0] || block.tagName.toLowerCase()}`;
  const customElement = document.createElement(tagName);

  customElement.innerHTML = block.innerHTML;

  block.parentNode.replaceChild(customElement, block);

  // Slots
  [...customElement.children].forEach((slot) => {
    slot.setAttribute('slot', 'item');
  });

  return customElement;
}

function getBlockResources() {
  const components = new Set();
  const templates = new Set();

  document
    .querySelectorAll('header, footer, div[class]:not(.fragment):not(.section)')
    .forEach((block) => {
      const { status } = block.dataset;

      if (status === 'loading' || status === 'loaded') return;

      block.dataset.status = 'loading';

      const customElement = transformToCustomElement(block);
      const tagName = customElement.tagName.toLowerCase();

      components.add(tagName);

      // only add templates for non-metadata blocks
      if (!tagName.endsWith('-metadata')) {
        templates.add(tagName);
      }

      block.dataset.status = 'loaded';
    });

  return { components, templates };
}

async function preloadFragment(element) {
  const slot = element.querySelector('div > div');
  const path = slot.innerText;

  const url = new URL(`${path}.plain.html`, window.location.origin);

  try {
    const res = await fetch(url);

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(`failed to preload fragment ${path}`);
    }

    slot.innerHTML = await res.text();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Loading fragment ${path} failed:`, error);
  }
}

/**
 * Initializiation.
 */
export default async function initialize() {
  setup();

  // Eager load first image
  loadEagerImages();

  // Build hero block
  buildHeroBlock();

  // Preload fragments
  await Promise.allSettled(
    [...document.querySelectorAll('.fragment')].map(preloadFragment),
  );

  // Load block resources
  const { components, templates } = getBlockResources();

  const [, loadedComponents] = await Promise.allSettled([
    Promise.allSettled([...templates].map(loadTemplate)),
    Promise.allSettled([...components].map(loadBlock)),
  ]);

  // Define custom elements
  loadedComponents.value.forEach(async ({ status, value }) => {
    if (status === 'fulfilled') {
      // If not already defined, define it.
      if (!customElements.get(value.name)) {
        customElements.define(value.name, value.className);
      }
    }
  });

  // Add sections class to all parent divs
  document.querySelectorAll('main > div').forEach((section) => {
    section.classList.add('section');
  });

  // Page is fully loaded
  document.body.dataset.status = 'loaded';

  // load fonts
  loadFonts();

  // rest of EDS setup...
  sampleRUM('top');

  window.addEventListener('load', () => sampleRUM('load'));

  window.addEventListener('unhandledrejection', (event) => {
    sampleRUM('error', {
      source: event.reason.sourceURL,
      target: event.reason.line,
    });
  });

  window.addEventListener('error', (event) => {
    sampleRUM('error', { source: event.filename, target: event.lineno });
  });
}

/**
 * Block Definition
 */
export class Block extends HTMLElement {
  constructor(options = {}) {
    super();

    this.values = options.mapValues ? new Map() : [];

    const id = this.tagName.toLowerCase();

    const shadowRoot = this.attachShadow({ mode: 'open' });

    const template = document.getElementById(id);

    if (template) {
      shadowRoot.appendChild(template.content.cloneNode(true));
    }

    const slots = this.querySelectorAll('[slot="item"]');

    slots.forEach((element) => {
      if (options.mapValues) {
        const [key, value] = element.children;
        this.values.set(key.innerText, value.innerHTML);
      } else {
        this.values.push(element);
      }
    });

    this.innerHTML = '';

    // Set up MutationObserver to detect changes in child nodes
    this.observer = new MutationObserver((event) => {
      event.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          node.querySelectorAll('.icon').forEach(decorateIcon);
          node.querySelectorAll('a').forEach(decorateButton);
        });
      });
    });

    this.observer.observe(this.shadowRoot, { childList: true, subtree: true });
  }
}
