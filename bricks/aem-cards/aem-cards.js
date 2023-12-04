import { Brick } from '../../scripts/aem.js';

export default class Cards extends Brick {
  connectedCallback() {
    const items = [...this.root.children];

    const slot = this.shadowRoot.querySelector('slot');

    items.forEach((item) => {
      const [img, text] = [...item.children];

      const card = document.createElement('li');

      card.innerHTML = img.innerHTML;

      card.append(text);

      slot.append(card);
    });
  }
}
