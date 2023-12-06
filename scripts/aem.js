/**
 * Load HTML Template
 * @param {string} name The name of the template
 * @returns {Promise<HTMLTemplateElement>} The template
 */
async function loadTemplate(name) {
  const href = `${window.hlx.codeBasePath}/bricks/${name}/${name}.html`;

  return new Promise((resolve, reject) => {
    const id = href.split('/').pop().split('.').shift();

    const brick = document.querySelector(`template[id="${id}"]`);

    if (brick) {
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
 * Load Brick
 * @param {string} href The path to the brick
 * @returns {Promise<HTMLElement>} The brick
 */
async function loadBrick(name) {
  const href = `${window.hlx.codeBasePath}/bricks/${name}/${name}.js`;

  return new Promise((resolve, reject) => {
    import(href)
      .then((mod) => {
        if (mod.default) {
          resolve({
            name,
            className: mod.default,
          });
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn(`Failed to load module for ${name}`, error);
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
  if (elem.dataset.decorated) return;

  const iconName = Array.from(elem.classList)
    .find((c) => c.startsWith('icon-'))
    .substring(5);
  const img = document.createElement('img');
  img.dataset.iconName = iconName;
  img.src = `${window.hlx.codeBasePath}/icons/${iconName}.svg`;
  img.loading = 'lazy';
  elem.append(img);
  elem.dataset.decorated = true;
}

/**
 * Decorates paragraphs containing a single link as buttons.
 * @param {Element} element container element
 */
function decorateButton(a) {
  if (a.dataset.decorated) return;

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

    a.dataset.decorated = true;
  }
}

/**
 * Builds hero brick and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBrick() {
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
 * Decorate root.
 */
function decorateRoot() {
  const root = document.createElement('aem-root');
  root.append(document.querySelector('header'));
  root.append(document.querySelector('main'));
  root.append(document.querySelector('footer'));
  document.body.prepend(root);
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
 * Setup brick utils.
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
  const hero = document.querySelector('main img');
  hero?.setAttribute('loading', 'eager');
}

function transformToCustomElement(brick) {
  const tagName = `aem-${brick.getAttribute('class')?.split(' ')[0] || brick.tagName.toLowerCase()}`;
  const customElement = document.createElement(tagName);

  customElement.innerHTML = brick.innerHTML;

  brick.parentNode.replaceChild(customElement, brick);

  // Slots
  [...customElement.children].forEach((slot) => {
    slot.setAttribute('slot', 'item');
  });

  return customElement;
}

function getBrickResources() {
  const components = new Set(['aem-root', 'aem-header', 'aem-footer']);
  const templates = new Set(['aem-root', 'aem-header', 'aem-footer']);

  // Load Bricks
  document.body
    .querySelectorAll('div[class]:not(.fragment)')
    .forEach((brick) => {
      const { status } = brick.dataset;

      if (status === 'loading' || status === 'loaded') return;

      brick.dataset.status = 'loading';

      const customElement = transformToCustomElement(brick);
      const tagName = customElement.tagName.toLowerCase();

      components.add(tagName);

      // only add templates for non-metadata bricks
      if (!tagName.endsWith('-metadata')) {
        templates.add(tagName);
      }

      brick.dataset.status = 'loaded';
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

async function getCommonBrickStyles() {
  const res = await fetch(`${window.hlx.codeBasePath}/styles/bricks-common.css`);

  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load block common styles');
    return null;
  }

  const css = await res.text();

  return css;
}

/**
 * Initializiation.
 */
export default async function initialize() {
  setup();

  // Eager load first image
  loadEagerImages();

  // Build hero brick
  buildHeroBrick();

  // Preload fragments
  await Promise.allSettled(
    [...document.querySelectorAll('.fragment')].map(preloadFragment),
  );

  // Load brick resources
  const { components, templates } = getBrickResources();

  const [css, loadedComponents] = await Promise.allSettled([
    getCommonBrickStyles(),
    Promise.allSettled([...components].map(loadBrick)),
    Promise.allSettled([...templates].map(loadTemplate)),
  ]);

  // Decorate Root
  decorateRoot();

  // common brick styles
  window.hlx.blockStyles = css.value;

  // Define custom elements
  loadedComponents.value.forEach(async ({ status, value }) => {
    if (status === 'fulfilled') {
      // If not already defined, define it.
      if (!customElements.get(value.name)) {
        customElements.define(value.name, value.className);
      }
    }
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
 * Brick Definition
 */
export class Brick extends HTMLElement {
  constructor(options = {}) {
    super();

    this.values = options.mapValues ? new Map() : [];

    const id = this.tagName.toLowerCase();

    const shadowRoot = this.attachShadow({ mode: 'open' });

    const template = document.getElementById(id);

    if (template) {
      const { blockStyles } = window.hlx;

      shadowRoot.appendChild(template.content.cloneNode(true));

      if (blockStyles) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(blockStyles);
        shadowRoot.adoptedStyleSheets = [sheet];
      }
    }

    const slots = this.querySelectorAll('[slot="item"]');

    if (options.mapValues) {
      slots.forEach((element) => {
        const [key, value] = element.children;
        this.values.set(key.innerText, value.innerHTML);
      });
    }

    // clone root
    const root = document.createElement('div');
    root.innerHTML = this.innerHTML;
    this.root = root.cloneNode(true);
    this.innerHTML = '';

    // Set up MutationObserver to detect changes in child nodes
    this.observer = new MutationObserver((event) => {
      event.forEach((mutation) => {
        mutation.addedNodes?.forEach((node) => {
          node.querySelectorAll?.('.icon:not([data-decorated])').forEach(decorateIcon);
          node.querySelectorAll?.('a:not([data-decorated])').forEach(decorateButton);
        });
      });
    });

    this.observer.observe(this.shadowRoot, { childList: true, subtree: true });
  }
}
