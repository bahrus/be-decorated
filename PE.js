export class PE {
    #abortControllers = [];
    #evTg2DMN2OMN2ET2AC = new WeakMap();
    async do(proxy, originMethodName, vals) {
        //this.disconnect(originMethodName);
        const controller = proxy.controller;
        if (!(controller instanceof EventTarget))
            throw ("Controller must extend EventTarget");
        controller.addEventListener('was-decorated', e => {
            this.disconnectAll();
        }, { once: true });
        if (vals[0] !== undefined) {
            Object.assign(proxy, vals[0]);
        }
        if (vals[1] !== undefined) {
            for (const methodName in vals[1]) {
                const ec = vals[1][methodName];
                const { on, abort } = ec;
                if (on !== undefined) {
                    const { of, doInit } = ec;
                    let dmn2omn2et2ac = this.#evTg2DMN2OMN2ET2AC.get(of);
                    if (dmn2omn2et2ac === undefined) {
                        dmn2omn2et2ac = new Map();
                        this.#evTg2DMN2OMN2ET2AC.set(of, dmn2omn2et2ac);
                    }
                    let omn2et2ac = dmn2omn2et2ac.get(methodName);
                    if (omn2et2ac === undefined) {
                        omn2et2ac = new Map();
                        dmn2omn2et2ac.set(methodName, omn2et2ac);
                    }
                    let et2ac = omn2et2ac.get(originMethodName);
                    if (et2ac === undefined) {
                        et2ac = new Map();
                        omn2et2ac.set(originMethodName, et2ac);
                    }
                    let ac = et2ac.get(on);
                    if (ac === undefined) {
                        ac = new AbortController();
                        this.#abortControllers.push(ac);
                        et2ac.set(on, ac);
                    }
                    const method = controller[methodName];
                    const isAsync = method.constructor.name === 'AsyncFunction';
                    //console.log({method, isAsync, key, ec});
                    of.addEventListener(on, async (e) => {
                        const ret = isAsync ? await controller[methodName](proxy, e) : controller[methodName](proxy, e);
                        //console.log({ret});
                        await this.recurse(ret, proxy, methodName);
                    }, { signal: ac.signal });
                    if (doInit) {
                        const ret = isAsync ? await controller[methodName](proxy) : controller[methodName](proxy);
                        await this.recurse(ret, proxy, methodName);
                    }
                }
                if (abort !== undefined) {
                    const et2ac = this.#evTg2DMN2OMN2ET2AC.get(abort.of)?.get(methodName)?.get(abort.origMethName);
                    const ac = et2ac?.get(abort.on);
                    if (ac !== undefined) {
                        ac.abort();
                        et2ac?.set(abort.on, new AbortController());
                    }
                }
            }
        }
    }
    async recurse(ret, proxy, methodName) {
        if (ret === undefined)
            return;
        const arg = (Array.isArray(ret) ? ret : [ret]);
        const pe = new PE();
        await pe.do(proxy, methodName, arg);
    }
    disconnectAll() {
        for (const ac of this.#abortControllers) {
            ac.abort();
        }
    }
}
