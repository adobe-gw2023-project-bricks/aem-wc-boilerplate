import { Brick } from '../../scripts/aem.js';

export default class Footer extends Brick {
  async connectedCallback() {
    // Main Sections
    const main = this.shadowRoot.querySelector('slot[name="main"]');
    main.innerHTML = this.root.querySelector('main').innerHTML;

    // Decorate Sections
    [...main.children].forEach((section) => {
      // Purge empty DIVs
      if (section.children.length === 0) {
        section.remove();
        return;
      }

      // Sections
      if (section.tagName === 'DIV') {
        section.classList.add('wrapper');

        const wrapper = document.createElement('div');
        wrapper.classList.add('section');
        section.parentNode.insertBefore(wrapper, section);
        wrapper.appendChild(section);
      }
    });
  }
}
