import {MinimalProxy, IEventConfig, EventConfigs} from './types';
export class PE{
    #abortControllers: AbortController[] = [];
    constructor(proxy: MinimalProxy, vals: [any, EventConfigs]){
        const controller = proxy.controller;
        if(!(controller instanceof EventTarget)) throw ("Controller must extend EventTarget");
        controller.addEventListener('remove', this.disconnect, {once: true});
        if(vals[0] !== undefined){
            Object.assign(proxy, vals[0]);
        }
        if(vals[1] !== undefined){
            for(const key in vals[1]){
                const ec = vals[1][key];
                const ac = new AbortController();
                ec.targetToObserve.addEventListener(key, e => {
                    (<any>controller)[ec.actions!](proxy, e);
                }, {signal: ac.signal});
                this.#abortControllers.push(ac);
                if(ec.doInit){
                    (<any>controller)[ec.actions!](proxy);
                }
            }
        }
        
    }
    disconnect(){
        for(const c of this.#abortControllers){
            c.abort();
        }
        this.#abortControllers = [];
    }
}