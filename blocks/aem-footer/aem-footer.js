import { Block } from '../../scripts/aem.js';

export default class Footer extends Block {
  constructor() {
    super();

    this.render();
  }

  async render() {
    const res = await fetch('/footer.plain.html');

    const [footer] = [
      ...Object.assign(document.createElement('div'), {
        innerHTML: await res.text(),
      }).children,
    ];

    this.shadowRoot.querySelector('slot').append(footer);
  }
}
