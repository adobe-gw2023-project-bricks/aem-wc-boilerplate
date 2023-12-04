import { Brick } from '../../scripts/aem.js';

export default class Columns extends Brick {
  connectedCallback() {
    const items = [...this.root.children];
    const size = items.length;
    const slot = this.shadowRoot.querySelector('slot');
    slot.style.setProperty('--columns', size);

    items.forEach((item) => {
      // create row
      const row = document.createElement('div');
      row.classList.add('row');

      // create columns
      [...item.children].forEach((column) => {
        column.classList.add('column');

        if (column.querySelector('picture')) {
          column.classList.add('with-image');
        }

        row.append(column);
      });

      slot.append(row);
    });
  }
}
