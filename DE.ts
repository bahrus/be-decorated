import {BeDecoratedProps} from './types';
export class DE extends HTMLElement{
    static bdProps: BeDecoratedProps;
    #ifWantsToBe: string;
    #upgrade: string;
    connectedCallback(){
        this.#ifWantsToBe = this.getAttribute('if-wants-to-be')!;
        this.#upgrade = this.getAttribute('upgrade')!;
        this.#watchForElementsToUpgrade();
    }

    async #watchForElementsToUpgrade(){
        const config = (this.constructor as any).bdProps as BeDecoratedProps;
        const callback = (target: Element) => {
            
        }
        const {upgrade : u} = await import('./upgrade.js');
        const {upgrade} = config;
        await u({
            shadowDomPeer: this,
            upgrade: upgrade!,
            ifWantsToBe: ifWantsToBe!,
            forceVisible,
        }, callback);
    }
}