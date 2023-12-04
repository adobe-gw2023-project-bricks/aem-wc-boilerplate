import { Brick } from '../../scripts/aem.js';

export default class Columns extends Brick {
  constructor() {
    super();

    this.render();
  }

  render() {
    const size = this.values.length;
    const slot = this.shadowRoot.querySelector('slot');

    this.values.forEach((row) => {
      [...row.children].forEach((column, index) => {
        if (size % index === 0) {
          column.classList.add('last');
        }

        column.classList.add('column');
        slot.append(column);
      });
    });
  }
}
