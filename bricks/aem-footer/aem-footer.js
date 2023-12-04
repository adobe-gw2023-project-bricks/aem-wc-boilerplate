import { Brick } from '../../scripts/aem.js';

export default class Footer extends Brick {
  async connectedCallback() {
    const res = await fetch('/footer.plain.html');

    const [footer] = [
      ...Object.assign(document.createElement('div'), {
        innerHTML: await res.text(),
      }).children,
    ];

    this.shadowRoot.querySelector('slot').append(footer);
  }
}
