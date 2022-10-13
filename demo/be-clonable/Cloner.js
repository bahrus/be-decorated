import { findAdjacentElement } from 'be-decorated/findAdjacentElement.js';
export class Cloner {
    proxy;
    props;
    #trigger;
    constructor(proxy, props) {
        this.proxy = proxy;
        this.props = props;
        if (props === undefined) {
            this.props = proxy;
        }
    }
    async addCloneButtonTrigger({ text, triggerInsertPosition }) {
        if (this.#trigger === undefined) {
            const trigger = findAdjacentElement(triggerInsertPosition, this.proxy, 'button.be-clonable-trigger');
            if (trigger !== null)
                this.#trigger = trigger;
            if (this.#trigger === undefined) {
                this.#trigger = document.createElement('button');
                this.#trigger.type = 'button';
                this.#trigger.classList.add('be-clonable-trigger');
                this.#trigger.ariaLabel = 'Clone this.';
                this.#trigger.title = 'Clone this.';
                this.proxy.insertAdjacentElement(triggerInsertPosition, this.#trigger);
            }
            this.setText(this.props);
            this.#trigger.addEventListener('click', this.handleClick);
        }
    }
    setText({ text }) {
        if (this.#trigger !== undefined) {
            this.#trigger.innerHTML = text; //TODO:  sanitize
        }
    }
    handleClick = async (e) => {
        const clone = this.proxy.cloneNode(true);
        const { beatify } = await import('be-hive/beatify.js');
        const beHive = this.proxy.getRootNode().querySelector('be-hive');
        if (beHive !== null) {
            beatify(clone, beHive);
        }
        this.proxy.insertAdjacentElement(this.props.cloneInsertPosition, clone);
    };
    dispose() {
        if (this.#trigger !== undefined) {
            this.#trigger.removeEventListener('click', this.handleClick);
            this.#trigger.remove();
        }
        this.proxy = undefined;
    }
}
export const proxyPropDefaults = {
    triggerInsertPosition: 'beforeend',
    cloneInsertPosition: 'afterend',
    text: '&#10063;'
};
