import {MinimalProxy, IEventConfig, EventConfigs, EvTg2DMN2OMN2ET2AC, OMN2ET2AC, OMN, ET2AC, ET, DMN2OMN2ET2AC, DMN} from './types';

export class PE{
    #abortControllers: AbortController[] = [];
    #evTg2DMN2OMN2ET2AC: EvTg2DMN2OMN2ET2AC = new WeakMap<EventTarget, DMN2OMN2ET2AC>();
    async do(proxy: MinimalProxy, originMethodName: string, vals: [any, EventConfigs]){
        //this.disconnect(originMethodName);
        const controller = proxy.controller;
        if(!(controller instanceof EventTarget)) throw ("Controller must extend EventTarget");
        controller.addEventListener('was-decorated', e=> {
            this.disconnectAll();
        } , {once: true});
        if(vals[0] !== undefined){
            Object.assign(proxy, vals[0]);
        }
        if(vals[1] !== undefined){
            for(const methodName in vals[1]){
                const ec = vals[1][methodName]!;
                const {on, abort, options} = ec;
                if(on !== undefined){
                    const {of, doInit} = ec;
                    if(!(of instanceof EventTarget)) throw {of, msg: 'not an EventTarget'};
                    let dmn2omn2et2ac = this.#evTg2DMN2OMN2ET2AC.get(of);
                    if(dmn2omn2et2ac === undefined){
                        dmn2omn2et2ac = new Map<DMN, OMN2ET2AC>();
                        this.#evTg2DMN2OMN2ET2AC.set(of, dmn2omn2et2ac);
                    }
                    
                    let omn2et2ac = dmn2omn2et2ac.get(methodName);
                    if(omn2et2ac === undefined){
                        omn2et2ac = new Map<OMN, ET2AC>();
                        dmn2omn2et2ac.set(methodName, omn2et2ac);
                    }
                    let et2ac = omn2et2ac.get(originMethodName);
                    if(et2ac === undefined){
                        et2ac = new Map<ET, AbortController>();
                        omn2et2ac.set(originMethodName, et2ac);
                    }
                    let ac = et2ac.get(on);
                    if(ac === undefined){
                        ac = new AbortController();
                        this.#abortControllers.push(ac);
                        et2ac.set(on, ac);
                    }
                    
                    const method = (<any>controller)[methodName];
                    const isAsync = method.constructor.name === 'AsyncFunction';
                    //console.log({method, isAsync, key, ec});
                    const addEventListenerOptions : AddEventListenerOptions = options || {};
                    addEventListenerOptions.signal = ac.signal; 
                    of.addEventListener(on, async e => {
                        const {composedPathMatches} = ec;
                        let foundEl: Element | undefined;
                        if(composedPathMatches !== undefined){
                            const composedPath = e.composedPath();// as Element[];
                            
                            for(const el of composedPath){
                                if((el instanceof Element) && el.matches(composedPathMatches)){
                                    foundEl = el;
                                    break;
                                }
                            }
                            if(foundEl === undefined) return;
                        }
                        const ret = isAsync ? await (<any>controller)[methodName](proxy, e, foundEl) : (<any>controller)[methodName](proxy, e, foundEl);
                        
                        await this.recurse(ret, proxy, methodName);
                    }, addEventListenerOptions);
                    if(doInit){
                        const ret = isAsync ? await (<any>controller)[methodName](proxy) : (<any>controller)[methodName](proxy);
                        await this.recurse(ret, proxy, methodName);
                    }
                }
                if(abort !== undefined){
                    const {of, origMethName, on} = abort;
                    if(!(of instanceof EventTarget)) throw {of, msg: 'not an EventTarget'};
                    const et2ac = this.#evTg2DMN2OMN2ET2AC.get(of)?.get(methodName)?.get(origMethName);
                    const ac = et2ac?.get(on);
                    if(ac !== undefined) {
                        ac.abort();
                        et2ac?.set(on, new AbortController());
                    }
                }

            }
        }
        
    }
    async recurse(ret: any, proxy: MinimalProxy, methodName: string){
        if(ret === undefined) return;
        const arg = (Array.isArray(ret) ? ret : [ret]) as [any, EventConfigs] ;
        const pe = new PE();
        await pe.do(proxy, methodName, arg);
    }
    disconnectAll(){
        for(const ac of this.#abortControllers){
            ac.abort();
        }
    }
}