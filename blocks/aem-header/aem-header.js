import { Block } from '../../scripts/aem.js';

export default class Header extends Block {
  constructor() {
    super();

    this.render();
  }

  async render() {
    const res = await fetch('/nav.plain.html');

    const [brand, sections, tools] = [
      ...Object.assign(document.createElement('div'), {
        innerHTML: await res.text(),
      }).children,
    ];

    this.shadowRoot.querySelector('slot[name="brand"]').append(brand);
    this.shadowRoot.querySelector('slot[name="sections"]').append(sections);
    this.shadowRoot.querySelector('slot[name="tools"]').append(tools);
  }
}
