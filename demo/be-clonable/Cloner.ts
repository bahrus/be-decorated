import {BCP, VirtualProps, EndUserProps} from './types';
import {findAdjacentElement} from 'be-decorated/findAdjacentElement.js';

export class Cloner{
    #trigger: HTMLButtonElement | undefined;
    constructor(public proxy: Element | undefined, public props: VirtualProps){
        if(props === undefined) {
            this.props = proxy as any as VirtualProps;
        }
    }

    async addCloneButtonTrigger({text, triggerInsertPosition}: BCP){
        if(this.#trigger === undefined){
            const trigger = findAdjacentElement(triggerInsertPosition!, this.proxy!, 'button.be-clonable-trigger');
            if(trigger !== null) this.#trigger = trigger as HTMLButtonElement;
            if(this.#trigger === undefined){
                this.#trigger = document.createElement('button');
                this.#trigger.type = 'button';
                this.#trigger.classList.add('be-clonable-trigger');
                this.#trigger.ariaLabel = 'Clone this.';
                this.#trigger.title = 'Clone this.';
                this.proxy!.insertAdjacentElement(triggerInsertPosition!, this.#trigger);
            }
            this.setText(this.props);
            this.#trigger.addEventListener('click', this.handleClick);
        }

    }

    setText({text}: VirtualProps): void{
        if(this.#trigger !== undefined){
            this.#trigger.innerHTML = text!;//TODO:  sanitize
        }
    }

    handleClick = async (e: Event) => {
        const clone = this.proxy!.cloneNode(true) as Element;
        const {beatify} = await import('be-hive/beatify.js');
        const beHive = (this.proxy!.getRootNode() as ShadowRoot).querySelector('be-hive') as Element;
        if(beHive !== null){
            beatify(clone, beHive);
        }
        this.proxy!.insertAdjacentElement(this.props.cloneInsertPosition!, clone);
    }

    dispose(){
        if(this.#trigger !== undefined){
            this.#trigger.removeEventListener('click', this.handleClick);
            this.#trigger.remove();
        }
        this.proxy = undefined;
    }
}

export const proxyPropDefaults: EndUserProps = {
    triggerInsertPosition: 'beforeend',
    cloneInsertPosition: 'afterend',
    text: '&#10063;'
}