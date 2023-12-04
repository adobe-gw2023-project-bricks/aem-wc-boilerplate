import { Block } from '../../scripts/aem.js';

export default class Hero extends Block {
  connectedCallback() {
    const image = this.root.querySelector('picture');
    const title = this.root.querySelector('h1');

    this.shadowRoot.querySelector('slot[name="picture"]').append(image);
    this.shadowRoot.querySelector('slot[name="title"]').append(title);
  }
}
