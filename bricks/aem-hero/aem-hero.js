import { Brick } from '../../scripts/aem.js';

export default class Hero extends Brick {
  constructor() {
    super();

    this.render();
  }

  render() {
    const [image, title] = [...this.values];

    this.shadowRoot.querySelector('slot[name="title"]').append(title);
    this.shadowRoot.querySelector('slot[name="picture"]').append(image);
  }
}
