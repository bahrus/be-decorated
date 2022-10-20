export class PE {
    #abortControllers = new Map();
    async do(proxy, methodName, vals) {
        this.disconnect(methodName);
        const controller = proxy.controller;
        if (!(controller instanceof EventTarget))
            throw ("Controller must extend EventTarget");
        controller.addEventListener('was-decorated', this.disconnectAll, { once: true });
        if (vals[0] !== undefined) {
            Object.assign(proxy, vals[0]);
        }
        if (vals[1] !== undefined) {
            for (const key in vals[1]) {
                const ec = vals[1][key];
                const ac = new AbortController();
                const method = controller[ec.action];
                const isAsync = method.constructor.name === 'AsyncFunction';
                console.log({ method, isAsync, key, ec });
                ec.observe.addEventListener(key, async (e) => {
                    const ret = isAsync ? await controller[ec.action](proxy, e) : controller[ec.action](proxy, e);
                    console.log({ ret });
                    this.recurse(ret, proxy, ec.action);
                }, { signal: ac.signal });
                this.#abortControllers.get(methodName).push(ac);
                if (ec.doInit) {
                    const ret = isAsync ? await controller[ec.action](proxy) : controller[ec.action](proxy);
                    this.recurse(ret, proxy, ec.action);
                }
            }
        }
    }
    recurse(ret, proxy, methodName) {
        if (ret === undefined)
            return;
        const arg = (Array.isArray(ret) ? ret : [ret]);
        const pe = new PE();
        pe.do(proxy, methodName, arg);
    }
    disconnectAll() {
        for (const key of this.#abortControllers.keys()) {
            this.disconnect(key);
        }
    }
    disconnect(methodName) {
        if (this.#abortControllers.has(methodName)) {
            const abortControllers = this.#abortControllers.get(methodName);
            for (const c of abortControllers) {
                c.abort();
            }
        }
        this.#abortControllers.set(methodName, []);
    }
}
