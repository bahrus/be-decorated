import {BeDecoratedProps, MinimalController, MinimalProxy} from './types';
import {IActionProcessor, Action, DefineArgs, PropInfo, WCConfig} from 'trans-render/lib/types';

export class DE<TControllerProps=any, TControllerActions=TControllerProps> extends HTMLElement implements IActionProcessor{
    static DA: DefineArgs;
    #ifWantsToBe!: string;
    #upgrade!: string;
    connectedCallback(){
        this.#ifWantsToBe = this.getAttribute('if-wants-to-be')!;
        this.#upgrade = this.getAttribute('upgrade')!;
        this.#watchForElementsToUpgrade();
    }

    async #watchForElementsToUpgrade(){
        const da = (this.constructor as any).DA as DefineArgs;
        const controller = (da as any).complexPropDefaults.controller;
        const {config} = da;
        const propDefaults = (<any>config).propDefaults as BeDecoratedProps;
        const {upgrade, ifWantsToBe, forceVisible, batonPass, noParse} = propDefaults;
        const callback = async (target: Element) => {
            const controllerInstance = new controller();
            if(batonPass){
                const {grabTheBaton} = await import('./relay.js');
                const baton = grabTheBaton(ifWantsToBe, target);
                if(baton !== undefined){
                    throw 'NI'
                    //controller[batonPass](controller.proxy, newTarget, this, baton);
                    return;
                }

            }
            const {nonDryProps, emitEvents} = propDefaults;


            if((<any>target).beDecorated === undefined) (<any>target).beDecorated = {};
            const {lispToCamel} = await import('trans-render/lib/lispToCamel.js');
            const key = lispToCamel(ifWantsToBe!);
            const existingProp = (<any>target).beDecorated[key];
            const revocable = Proxy.revocable(target, {
                set:(target: Element & TControllerProps, key: string & keyof TControllerProps, value) => {
                    const {virtualProps, actions} = propDefaults;
                    if(nonDryProps === undefined || !nonDryProps.includes(key)){
                        if(controllerInstance[key] === value) {
                            return true;
                        }
                        if(reqVirtualProps.includes(key as keyof MinimalProxy) || (virtualProps !== undefined && virtualProps.includes(key))){
                            controllerInstance[key] = value;
                        }else{
                            target[key] = value;
                        }
                        if(key === 'self') return true;
                    }
                    (async () => {

                        if(actions !== undefined){
                            const filteredActions: any = {};
                            const {getPropsFromActions} = await import('./parse.js');
                            const {pq} = await import('trans-render/lib/pq.js');
                            for(const methodName in actions){
                                const action = actions[methodName]!;
                                const typedAction = (typeof action === 'string') ? {ifAllOf:[action]} as Action<TControllerProps> : action as Action<TControllerProps>;
                                const props = getPropsFromActions(typedAction); //TODO:  cache this
                                if(!props.has(key as string)) continue;
                                if(await pq(typedAction, controllerInstance as any as BeDecoratedProps<any, any>)){
                                    filteredActions[methodName] = action;
                                }
                            }
                            const nv = value;
                            const ov = controllerInstance[key];
                            this.doActions(this, filteredActions, controllerInstance, controllerInstance.proxy); 
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
                        value = controllerInstance[key];
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

            if(!noParse){ //yes, parse!
                const {parse} = await import('./parse.js');
                await parse(this, propDefaults, target, controllerInstance); 
            }

            if(existingProp !== undefined){
                Object.assign(proxy, existingProp);
            }
            (<any>target).beDecorated[key] = proxy;
            (proxy as any).self = target;
            (proxy as any).controller =  controllerInstance; 
            target.dispatchEvent(new CustomEvent('be-decorated.resolved', {
                detail:{
                    value: (<any>target).beDecorated
                }
            }));
            const {intro, finale} = propDefaults;
            if(intro !== undefined){
                await (<any>controllerInstance)[intro](proxy, target, this);
            }
            
            if(emitEvents !== undefined){
                this.#emitEvent(ifWantsToBe, `is-${ifWantsToBe}`, {proxy, controllerInstance}, proxy, controllerInstance as any as EventTarget);
            }
            const {onRemove} = await import('trans-render/lib/onRemove.js')
            onRemove(target!, async (removedEl: Element) => {
                if(controllerInstance !== undefined && finale !== undefined){
                    await (<any>controllerInstance)[finale](proxy, removedEl, this);
                }
                if((<any>removedEl).beDecorated !== undefined) delete (<any>removedEl).beDecorated[key];
                (<any>proxy).self = undefined;
                revocable.revoke();
            });
    

        }
        const {upgrade : u} = await import('./upgrade.js');
        
        await u({
            shadowDomPeer: this,
            upgrade,
            ifWantsToBe: ifWantsToBe!,
            forceVisible,
        }, callback);
    }

    #emitEvent(ifWantsToBe: string, name: string, detail: any, proxy: Element, controller: EventTarget){
        const namespacedEventName = `be-decorated.${ifWantsToBe}.${name}`;
        proxy.dispatchEvent(new CustomEvent(namespacedEventName,{
            detail
        }));
        if(controller instanceof EventTarget){
            proxy.dispatchEvent(new CustomEvent(name));
        } 
    }

    async doActions(self: IActionProcessor, actions: {[methodName: string]: Action}, target: any, proxy?: any){
        const {doActions} = await  import('trans-render/lib/doActions.js');
        await doActions(self, actions, target, proxy);
    }

    postHoc(self: this, action: Action<any>, target: any, returnVal: any, proxy?: any): void {
        
    }
}

export function define<
    TControllerProps = any, 
    TControllerActions = TControllerProps,
    TActions = Action<TControllerProps>>(controllerConfig: DefineArgs<TControllerProps, TControllerActions, PropInfo, Action<TControllerProps>>){
    
    const {config} = controllerConfig;
    const {tagName}  = config as WCConfig<TControllerProps, TControllerActions>;
    if(customElements.get(tagName!) !== undefined) return;
    class DECO extends DE{

    }
    DECO.DA = controllerConfig;
    customElements.define(tagName!, DECO);
}

const reqVirtualProps : (keyof MinimalProxy)[] = ['self', 'emitEvents', 'controller', 'resolved', 'rejected'];