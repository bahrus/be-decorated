import {BeDecoratedProps, MinimalProxy, DA, ActionExt} from './types';
import {Action, DefineArgs, PropInfo, WCConfig, Attachable} from 'trans-render/lib/types';
export {BeDecoratedProps} from './types';
export class DE<TControllerProps=any, TControllerActions=TControllerProps> extends HTMLElement implements Attachable{
    static DA: DA;
    connectedCallback(){
        if(!this.hasAttribute('disabled')){
            this.#watchForElementsToUpgrade();
        }
        
    }

    #getAttrs(upDef: string, iwtbDef: string){
        return {
            ifWantsToBe: this.getAttribute('if-wants-to-be') || iwtbDef,
            upgrade: this.getAttribute('upgrade') || upDef,
        }
    }
    async attach(target: Element){
        const da = (this.constructor as any).DA as DA;
        const controller = da.complexPropDefaults.controller;
        const {config} = da;
        const propDefaults = {...config.propDefaults};
        const {ifWantsToBe: iwtbDef, upgrade: upDef} = propDefaults;
        const attr = this.#getAttrs(upDef, iwtbDef);
        const {ifWantsToBe} = attr;
        Object.assign(propDefaults, attr);
        const {noParse} = propDefaults;
        let controllerInstance = new controller() as any;
        controllerInstance[sym] = new Map<string, any>();
        controllerInstance[changedKeySym] = new Set<string>();
        const {nonDryProps, emitEvents} = propDefaults;


        if((<any>target).beDecorated === undefined) (<any>target).beDecorated = {};
        const {lispToCamel} = await import('trans-render/lib/lispToCamel.js');
        const key = lispToCamel(ifWantsToBe);
        const existingProp = (<any>target).beDecorated[key];
        const revocable = Proxy.revocable(target, {
            set:(target: Element & TControllerProps, key: string & keyof TControllerProps, value) => {
                const {virtualProps} = propDefaults;
                const {actions} = config as WCConfig;
                //console.log({key, value, nonDryProps, virtualProps, ci:(controllerInstance as any)[sym].get(key) });
                if(nonDryProps === undefined || !nonDryProps.includes(key)){
                    if((controllerInstance as any)[sym].get(key) === value) {
                        return true;
                    }
                }
                if(reqVirtualProps.includes(key as keyof MinimalProxy) || (virtualProps !== undefined && virtualProps.includes(key))){
                    (controllerInstance as any)[sym].set(key, value);
                }else{
                    target[key] = value;
                }
                controllerInstance[changedKeySym].add(key);
                (async () => {
                    if(actions !== undefined){
                        const filteredActions: any = {};
                        const {getPropsFromActions} = await import('./init.js');
                        const {pq} = await import('trans-render/lib/pq.js');
                        const {intersection} = await import('trans-render/lib/intersection.js');
                        const changedKeys = controllerInstance[changedKeySym] as Set<string>;
                        controllerInstance[changedKeySym] = new Set<string>();
                        let foundAction = false;
                        for(const methodName in actions){
                            const action = actions[methodName]!;
                            const typedAction = (typeof action === 'string') ? {ifAllOf:[action]} as Action<TControllerProps> : action as Action<TControllerProps>;
                            const props = getPropsFromActions(typedAction); //TODO:  cache this
                            const int = intersection(props, changedKeys);
                            if(int.size === 0) continue;
                            //console.log({key, methodName, proxyVal: (controllerInstance.proxy as any)[key]});
                            if(await pq(typedAction, controllerInstance.proxy as any as BeDecoratedProps<any, any>)){
                                //console.log('passedTest', {key, methodName, proxyVal: (controllerInstance.proxy as any)[key]});
                                filteredActions[methodName] = action;
                                foundAction = true;
                            }
                        }
                        
                        if(foundAction){
                            const {doActions} = await import('./doActions.js');
                            await doActions(filteredActions, controllerInstance, controllerInstance.proxy); 
                        }
                        
                    }
                    
                    if(emitEvents !== undefined){
                        let emitEvent = true;
                        if(Array.isArray(emitEvents)){
                            emitEvent = emitEvents.includes(key)
                        }
                        if(emitEvent){
                            const {camelToLisp} = await import('trans-render/lib/camelToLisp.js');
                            const name = `${camelToLisp(key)}-changed`;
                            this.#emitEvent(ifWantsToBe, name, {value}, target, controllerInstance as any as EventTarget);
                        }
                    }
                    if((key==='resolved' || key === 'rejected') && value){
                        this.#emitEvent(ifWantsToBe, key, {value}, target, controllerInstance as any as EventTarget);
                    }
                })();

                return true;
            },
            get:(target: Element & TControllerProps, key: string & keyof TControllerProps)=>{
                let value;// = Reflect.get(target, key);
                const {virtualProps} = propDefaults;
                if( (virtualProps !== undefined && virtualProps.includes(key)) || reqVirtualProps.includes(key as keyof MinimalProxy)){
                    value = (controllerInstance as any)[sym].get(key);
                }else{
                    value = target[key];// = value;
                }
                if(typeof(value) == "function"){
                    return value.bind(target);
                }
                return value;
            }
        });


        const {proxy} = revocable;
        controllerInstance.proxy = proxy;
        (<any>target).beDecorated[key] = proxy;
        (proxy as any).self = target;
        (proxy as any).controller =  controllerInstance; 
        (proxy as any).proxy = proxy;
        if(!noParse){ //yes, parse!
            const {init} = await import('./init.js');
            await init(this, propDefaults, target, controllerInstance, existingProp, ifWantsToBe); 
        }else{
            const {proxyPropDefaults} = propDefaults;
            const objToAssign = proxyPropDefaults !== undefined ? {...proxyPropDefaults} : {};
            if(existingProp !== undefined){
                Object.assign(objToAssign, existingProp);
            }
            (<any>target).beDecorated[key + 'Props'] = objToAssign;
        }
        
        target.dispatchEvent(new CustomEvent('be-decorated.resolved', {
            detail:{
                value: (<any>target).beDecorated
            }
        }));
        const {intro, finale} = propDefaults;
        if(intro !== undefined){
            //TODO:  don't use await if not async
            await (<any>controllerInstance)[intro](proxy, target, propDefaults);
        }
        
        if(emitEvents !== undefined){
            this.#emitEvent(ifWantsToBe, `is-${ifWantsToBe}`, {proxy, controllerInstance}, proxy, controllerInstance as any as EventTarget);
        }
        const {onRemove} = await import('trans-render/lib/onRemove.js')
        onRemove(target!, async (removedEl: Element) => {
            if(controllerInstance !== undefined && finale !== undefined){
                await (<any>controllerInstance)[finale](proxy, removedEl, propDefaults);
            }
            this.#emitEvent(ifWantsToBe, `was-decorated`, {proxy, controllerInstance}, proxy, controllerInstance as any as EventTarget);
            if((<any>removedEl).beDecorated !== undefined) delete (<any>removedEl).beDecorated[key];
            //(<any>proxy).self = undefined;
            (controllerInstance as any) = undefined;
            revocable.revoke();
        });
    }
    async #watchForElementsToUpgrade(){
        const da = (this.constructor as any).DA as DA;
        const {config} = da;
        const propDefaults = config.propDefaults;
        const {upgrade: upDef, ifWantsToBe: iwtbDef} = propDefaults;
        const {ifWantsToBe, upgrade} = this.#getAttrs(upDef, iwtbDef);
        const {forceVisible, upgrade: udef, ifWantsToBe: idef} = propDefaults;
        const {upgrade : u} = await import('./upgrade.js');
        await u({
            shadowDomPeer: this,
            upgrade,
            ifWantsToBe,
            forceVisible,
        }, this.attach.bind(this));
    }

    #emitEvent(ifWantsToBe: string, name: string, detail: any, proxy: Element, controller: EventTarget){
        const namespacedEventName = `be-decorated.${ifWantsToBe}.${name}`;
        proxy.dispatchEvent(new CustomEvent(namespacedEventName,{
            detail
        }));
        if(controller instanceof EventTarget){
            controller.dispatchEvent(new CustomEvent(name));
        } 
    }


}

export function define<
    TControllerProps = any, 
    TControllerActions = TControllerProps,
    TActions = Action<TControllerProps>>(controllerConfig: DefineArgs<TControllerProps, TControllerActions, PropInfo, ActionExt<TControllerProps, TControllerActions>>){
    
    const {config} = controllerConfig;
    const {tagName}  = config as WCConfig<TControllerProps, TControllerActions>;
    if(customElements.get(tagName!) !== undefined) return;
    class DECO extends DE{}
    (DECO as any).DA = controllerConfig;
    customElements.define(tagName!, DECO);
}
const sym = Symbol();
const reqVirtualProps : (keyof MinimalProxy)[] = ['self', 'emitEvents', 'controller', 'resolved', 'rejected', 'proxy'];

const changedKeySym = Symbol();