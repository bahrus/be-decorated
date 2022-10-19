export class PE {
    #abortControllers = [];
    constructor(proxy, vals) {
        const controller = proxy.controller;
        if (!(controller instanceof EventTarget))
            throw ("Controller must extend EventTarget");
        controller.addEventListener('was-decorated', this.disconnect, { once: true });
        if (vals[0] !== undefined) {
            Object.assign(proxy, vals[0]);
        }
        if (vals[1] !== undefined) {
            for (const key in vals[1]) {
                const ec = vals[1][key];
                const ac = new AbortController();
                ec.targetToObserve.addEventListener(key, e => {
                    const ret = controller[ec.actions](proxy, e);
                    this.recurse(ret, proxy);
                }, { signal: ac.signal });
                this.#abortControllers.push(ac);
                if (ec.doInit) {
                    const ret = controller[ec.actions](proxy);
                    this.recurse(ret, proxy);
                }
            }
        }
    }
    recurse(ret, proxy) {
        if (ret === undefined)
            return;
        const arg = Array.isArray(ret) ? ret : [ret];
        const pe = new PE(proxy, arg);
    }
    disconnect() {
        for (const c of this.#abortControllers) {
            c.abort();
        }
        this.#abortControllers = [];
    }
}
