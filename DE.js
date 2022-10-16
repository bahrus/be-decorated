export class DE extends HTMLElement {
    static DA;
    #ifWantsToBe;
    #upgrade;
    connectedCallback() {
        this.#ifWantsToBe = this.getAttribute('if-wants-to-be');
        this.#upgrade = this.getAttribute('upgrade');
        this.#watchForElementsToUpgrade();
    }
    async attach(target) {
        const da = this.constructor.DA;
        const controller = da.complexPropDefaults.controller;
        const { config } = da;
        const propDefaults = config.propDefaults;
        const { ifWantsToBe, batonPass, noParse } = propDefaults;
        let controllerInstance = new controller();
        controllerInstance[sym] = new Map();
        const { nonDryProps, emitEvents } = propDefaults;
        if (target.beDecorated === undefined)
            target.beDecorated = {};
        const { lispToCamel } = await import('trans-render/lib/lispToCamel.js');
        const key = lispToCamel(ifWantsToBe);
        const existingProp = target.beDecorated[key];
        const revocable = Proxy.revocable(target, {
            set: (target, key, value) => {
                const { virtualProps } = propDefaults;
                const { actions } = config;
                if (nonDryProps === undefined || !nonDryProps.includes(key)) {
                    if (controllerInstance[sym].get(key) === value) {
                        return true;
                    }
                }
                if (reqVirtualProps.includes(key) || (virtualProps !== undefined && virtualProps.includes(key))) {
                    controllerInstance[sym].set(key, value);
                }
                else {
                    target[key] = value;
                }
                (async () => {
                    if (actions !== undefined) {
                        const filteredActions = {};
                        const { getPropsFromActions } = await import('./init.js');
                        const { pq } = await import('trans-render/lib/pq.js');
                        let foundAction = false;
                        for (const methodName in actions) {
                            const action = actions[methodName];
                            const typedAction = (typeof action === 'string') ? { ifAllOf: [action] } : action;
                            const props = getPropsFromActions(typedAction); //TODO:  cache this
                            if (!props.has(key))
                                continue;
                            if (await pq(typedAction, controllerInstance.proxy)) {
                                filteredActions[methodName] = action;
                                foundAction = true;
                            }
                        }
                        if (foundAction) {
                            await this.doActions(this, filteredActions, controllerInstance, controllerInstance.proxy);
                        }
                    }
                    if (emitEvents !== undefined) {
                        let emitEvent = true;
                        if (Array.isArray(emitEvents)) {
                            emitEvent = emitEvents.includes(key);
                        }
                        if (emitEvent) {
                            const { camelToLisp } = await import('trans-render/lib/camelToLisp.js');
                            const name = `${camelToLisp(key)}-changed`;
                            this.#emitEvent(ifWantsToBe, name, { value }, target, controllerInstance);
                        }
                    }
                    if ((key === 'resolved' || key === 'rejected') && value) {
                        this.#emitEvent(ifWantsToBe, key, { value }, target, controllerInstance);
                    }
                })();
                return true;
            },
            get: (target, key) => {
                let value; // = Reflect.get(target, key);
                const { virtualProps } = propDefaults;
                if ((virtualProps !== undefined && virtualProps.includes(key)) || reqVirtualProps.includes(key)) {
                    value = controllerInstance[sym].get(key);
                }
                else {
                    value = target[key]; // = value;
                }
                if (typeof (value) == "function") {
                    return value.bind(target);
                }
                return value;
            }
        });
        const { proxy } = revocable;
        controllerInstance.proxy = proxy;
        target.beDecorated[key] = proxy;
        proxy.self = target;
        proxy.controller = controllerInstance;
        proxy.proxy = proxy;
        if (batonPass) {
            const { grabTheBaton } = await import('./relay.js');
            const baton = grabTheBaton(ifWantsToBe, target);
            if (baton !== undefined) {
                controllerInstance[batonPass](controllerInstance.proxy, target, this, baton);
                return;
            }
        }
        if (!noParse) { //yes, parse!
            const { init } = await import('./init.js');
            await init(this, propDefaults, target, controllerInstance, existingProp);
        }
        target.dispatchEvent(new CustomEvent('be-decorated.resolved', {
            detail: {
                value: target.beDecorated
            }
        }));
        const { intro, finale } = propDefaults;
        if (intro !== undefined) {
            //TODO:  don't use await if not async
            await controllerInstance[intro](proxy, target, propDefaults);
        }
        if (emitEvents !== undefined) {
            this.#emitEvent(ifWantsToBe, `is-${ifWantsToBe}`, { proxy, controllerInstance }, proxy, controllerInstance);
        }
        const { onRemove } = await import('trans-render/lib/onRemove.js');
        onRemove(target, async (removedEl) => {
            if (controllerInstance !== undefined && finale !== undefined) {
                await controllerInstance[finale](proxy, removedEl, propDefaults);
            }
            if (removedEl.beDecorated !== undefined)
                delete removedEl.beDecorated[key];
            proxy.self = undefined;
            controllerInstance = undefined;
            revocable.revoke();
        });
    }
    async #watchForElementsToUpgrade() {
        const da = this.constructor.DA;
        const { config } = da;
        const propDefaults = config.propDefaults;
        const { upgrade, ifWantsToBe, forceVisible } = propDefaults;
        const { upgrade: u } = await import('./upgrade.js');
        await u({
            shadowDomPeer: this,
            upgrade,
            ifWantsToBe: ifWantsToBe,
            forceVisible,
        }, this.attach.bind(this));
    }
    #emitEvent(ifWantsToBe, name, detail, proxy, controller) {
        const namespacedEventName = `be-decorated.${ifWantsToBe}.${name}`;
        proxy.dispatchEvent(new CustomEvent(namespacedEventName, {
            detail
        }));
        if (controller instanceof EventTarget) {
            proxy.dispatchEvent(new CustomEvent(name));
        }
    }
    async doActions(self, actions, target, proxy) {
        for (const methodName in actions) {
            const action = actions[methodName];
            if (action.debug)
                debugger;
            //https://lsm.ai/posts/7-ways-to-detect-javascript-async-function/#:~:text=There%205%20ways%20to%20detect%20an%20async%20function,name%20property%20of%20the%20AsyncFunction%20is%20%E2%80%9CAsyncFunction%E2%80%9D.%202.
            const method = target[methodName];
            if (method === undefined) {
                throw {
                    message: 404,
                    methodName,
                    target,
                };
            }
            const isAsync = method.constructor.name === 'AsyncFunction';
            const ret = isAsync ? await target[methodName](proxy) : target[methodName](proxy);
            if (ret === undefined)
                continue;
            Object.assign(proxy, ret);
        }
    }
}
export function define(controllerConfig) {
    const { config } = controllerConfig;
    const { tagName } = config;
    if (customElements.get(tagName) !== undefined)
        return;
    class DECO extends DE {
    }
    DECO.DA = controllerConfig;
    customElements.define(tagName, DECO);
}
const sym = Symbol();
const reqVirtualProps = ['self', 'emitEvents', 'controller', 'resolved', 'rejected', 'proxy'];
