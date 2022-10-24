import {MinimalProxy, IEventConfig, EventConfigs} from './types';

export class PE{
    #abortControllers = new Map<string, AbortController[]>();
    async do(proxy: MinimalProxy, originMethodName: string, vals: [any, EventConfigs]){
        this.disconnect(originMethodName);
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
                const ac = new AbortController();
                const method = (<any>controller)[methodName];
                const isAsync = method.constructor.name === 'AsyncFunction';
                //console.log({method, isAsync, key, ec});
                ec.of.addEventListener(ec.on, async e => {
                    const ret = isAsync ? await (<any>controller)[methodName](proxy, e) : (<any>controller)[methodName](proxy, e);
                    //console.log({ret});
                    await this.recurse(ret, proxy, methodName);
                }, {signal: ac.signal});
                this.#abortControllers.get(originMethodName)!.push(ac);
                if(ec.doInit){
                    const ret = isAsync ? await (<any>controller)[methodName](proxy) : (<any>controller)[methodName](proxy);
                    await this.recurse(ret, proxy, methodName);
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
        for(const key of this.#abortControllers.keys()){
            this.disconnect(key);
        }
    }
    disconnect(methodName: string){
        if(this.#abortControllers.has(methodName)) {
            const abortControllers = this.#abortControllers.get(methodName)!;
            for(const c of abortControllers){
                c.abort();
            }
        }
        this.#abortControllers.set(methodName, []);
    }
}