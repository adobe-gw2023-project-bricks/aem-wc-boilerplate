import { Brick } from '../../scripts/aem.js';

export default class SectionMetadata extends Brick {
  constructor() {
    super({ mapValues: true });
  }

  connectedCallback() {
    [...this.values].forEach(([key, value]) => {
      if (key.toLowerCase() === 'style') {
        this.parentElement.classList.add(value);
      } else {
        this.parentElement.dataset[key] = value;
      }
    });
  }
}
