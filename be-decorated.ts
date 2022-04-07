import {upgrade as upgr, getVal} from './upgrade.js';
import {BeDecoratedProps, BeDecoratedActions, BeDecoratedConfig} from './types';
import {XE} from 'xtal-element/src/XE.js';
import {DefineArgs, WCConfig} from 'trans-render/lib/types';
import {XAction, PropInfoExt} from 'xtal-element/src/types';
import {onRemove} from 'trans-render/lib/onRemove.js';
import {intersection} from 'xtal-element/lib/intersection.js';
//be careful about adopting async with onRemove, intersection.  Test be-repeated, example IIb, make sure no repeated calls to renderlist.

export {BeDecoratedProps, MinimalController} from './types';

export const xe = new XE<BeDecoratedProps, BeDecoratedActions, PropInfoExt, XAction<BeDecoratedProps>>();

const reqVirtualProps = ['self', 'emitEvents'];


export class BeDecoratedCore<TControllerProps, TControllerActions> extends HTMLElement implements BeDecoratedActions{
    targetToController: WeakMap<any, any> = new WeakMap();
    virtualPropsMap = new WeakMap<Element, any>();
    watchForElementsToUpgrade({upgrade, ifWantsToBe, forceVisible}: this){
        const self = this;
        const callback = (target: Element) => {
            self.newTarget = target;
        }
        upgr({
            shadowDomPeer: this,
            upgrade: upgrade!,
            ifWantsToBe: ifWantsToBe!,
            forceVisible,
        }, callback);
        // register in the be-hive registry




    }

    parseAttr({targetToController, newTarget, noParse, ifWantsToBe, actions, proxyPropDefaults, primaryProp, virtualPropsMap}: this){
        const controller = targetToController.get(newTarget);
        if(controller){
            if(!noParse){ //yes, parse please
                controller.propChangeQueue = new Set<string>();
                if(proxyPropDefaults !== undefined){
                    Object.assign(controller.proxy, proxyPropDefaults);
                }
                const val = getVal(newTarget!, ifWantsToBe);
                const attr = val[0]!.trim();
                if(this.virtualPropsMap.has(newTarget!)){
                    //this may happen if an element is moved or "frozen" via trans-render/lib/freeze.js after already initialized
                    
                    if(attr.length > 0){
                        try{
                            const parsedObj = JSON.parse(attr);
                            Object.assign(virtualProps, parsedObj);
                        }catch(e){
                            console.error(e);
                        }
                    }
                    Object.assign(controller.proxy, virtualProps);
                }else{

                    if(attr !== null && attr.length > 0 && attr[0]!.length > 0){
                    
                        if(proxyPropDefaults !== undefined){
                            Object.assign(controller.proxy, proxyPropDefaults);
                        }
                        let parsedObj: any;
                        const proxy = controller.proxy;
                        if(primaryProp !== undefined && attr[0] !== '{'){
                            if(attr[0] === '['){
                                try{
                                    parsedObj = JSON.parse(attr);
                                    proxy[primaryProp] = parsedObj;
                                    virtualPropsMap.set(newTarget!, parsedObj);
                                }catch(e){
                                    proxy[primaryProp] = attr;
                                    virtualPropsMap.set(newTarget!, {[primaryProp]: attr});
                                }
                            }else{
                                proxy[primaryProp] = attr;
                                virtualPropsMap.set(newTarget!, {[primaryProp]: attr});
                            }
                            
                        }else{
                            try{
                                parsedObj = JSON.parse(attr);
                                Object.assign(proxy, parsedObj);
                                virtualPropsMap.set(newTarget!, parsedObj);
                            }catch(e){
                                console.error({
                                    attr,
                                    e,
                                    newTarget
                                })
                            }
                        }
                    }
                    
                }
                

                const filteredActions: any = {};
                const queue = controller.propChangeQueue;
                controller.propChangeQueue = undefined;
                if(actions !== undefined){
                    for(const methodName in actions){
                        const action = actions[methodName]!;
                        const typedAction = (typeof action === 'string') ? {ifAllOf:[action]} as XAction<TControllerProps> : action as XAction<TControllerProps>;
                        const props = xe.getProps(xe, typedAction); //TODO:  cache this
                        //if(!props.has(key as string)) continue;
                        if(!intersection(queue, props)) continue;
                        if(xe.pq(xe, typedAction, controller.proxy)){
                            filteredActions[methodName] = action;
                        }
                    }
                    xe.doActions(xe, filteredActions, controller, controller.proxy);
                }
            }
            return true;
        }
        return false;
    }

    async pairTargetWithController({newTarget, actions, targetToController, virtualProps, controller, ifWantsToBe, noParse, finale, intro, nonDryProps, emitEvents, virtualPropsMap}: this){
        if(this.parseAttr(this)) return;
        const controllerInstance = new controller();
        const revocable = Proxy.revocable(newTarget! as Element & TControllerProps, {
            set: (target: Element & TControllerProps, key: string & keyof TControllerProps, value) => {
                const {emitEvents, propChangeQueue} = controllerInstance;
                if(nonDryProps === undefined || !nonDryProps.includes(key)){
                    if(controllerInstance[key] === value) {
                        if(propChangeQueue !== undefined){
                            propChangeQueue.add(key);
                        }
                        return true;
                    }
                }
                
                if(reqVirtualProps.includes(key) || (virtualProps !== undefined && virtualProps.includes(key))){
                    controllerInstance[key] = value;
                    // if(virtualPropsMap.has(target)){
                    //     virtualPropsMap.get(target)![key] = value;
                    // }
                }else{
                    target[key] = value;
                }
                if(key === 'self') return true;
                if(propChangeQueue !== undefined){
                    propChangeQueue.add(key);
                }else{
                    if(actions !== undefined){
                        const filteredActions: any = {};
                        for(const methodName in actions){
                            const action = actions[methodName]!;
                            const typedAction = (typeof action === 'string') ? {ifAllOf:[action]} as XAction<TControllerProps> : action as XAction<TControllerProps>;
                            const props = xe.getProps(xe, typedAction); //TODO:  cache this
                            if(!props.has(key as string)) continue;
                            if(xe.pq(xe, typedAction, controllerInstance as any as BeDecoratedProps<any, any>)){
                                filteredActions[methodName] = action;
                            }
                        }
                        const nv = value;
                        const ov = controllerInstance[key];
                        xe.doActions(xe, filteredActions, controllerInstance, controllerInstance.proxy); 
                    }
                }
                if(emitEvents !== undefined){
                    let emitEvent = true;
                    if(Array.isArray(emitEvents)){
                        emitEvent = emitEvents.includes(key)
                    }
                    if(emitEvent){
                        const name = `${ifWantsToBe}::${xe.toLisp(key)}-changed`;
                        const detail: CustomEventInit = {
                            detail:{
                                value
                            }
                        };
                        target.dispatchEvent(new CustomEvent(name, detail));

                    }
                }
                return true;
            },
            get:(target: Element & TControllerProps, key: string & keyof TControllerProps)=>{
                let value;// = Reflect.get(target, key);
                if(key === 'self' || (virtualProps !== undefined && virtualProps.includes(key)) || reqVirtualProps.includes(key)){
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
        controllerInstance.proxy = revocable.proxy;
        if((<any>newTarget).beDecorated === undefined) (<any>newTarget).beDecorated = {};
        const key = xe.toCamel(ifWantsToBe!);
        const existingProp = (<any>newTarget).beDecorated[key];
        if(existingProp !== undefined){
            Object.assign(proxy, existingProp);
        }
        (<any>newTarget).beDecorated[key] = proxy;
        targetToController.set(newTarget, controllerInstance);
        if(intro !== undefined){
            await (<any>controllerInstance)[intro](proxy, newTarget, this);
        }
        if(emitEvents !== undefined){
            const name = `${ifWantsToBe}::is-${ifWantsToBe}`;
            const detail: CustomEventInit = {
                detail:{
                    proxy,
                    controllerInstance
                }
            };
            newTarget!.dispatchEvent(new CustomEvent(name, detail));
        }
        this.parseAttr(this);
        onRemove(newTarget!, async (removedEl: Element) => {
            if(controllerInstance !== undefined && finale !== undefined){
                await (<any>controllerInstance)[finale](proxy, removedEl, this);
            }
            if((<any>removedEl).beDecorated !== undefined) delete (<any>removedEl).beDecorated[key];
            // Commented out code below doesn't seem to work, so leaving out for now.
            // //element might come back -- need to reactivate if it does
            // const isAttr = removedEl.getAttribute('is-' + this.ifWantsToBe);
            // if(isAttr !== null) {
            //     setTimeout(() => {
            //         removedEl.setAttribute('be-' + this.ifWantsToBe, isAttr);
            //     }, 50);
            // }
            // removedEl.removeAttribute('is-' + this.ifWantsToBe);
            targetToController.delete(removedEl);
            revocable.revoke();
        });
    }
}

type BeDecoratedMC<TControllerProps, TControllerActions> =  BeDecoratedActions & BeDecoratedProps<TControllerProps, TControllerActions>;

export interface BeDecoratedCore<TControllerProps, TControllerActions> extends BeDecoratedMC<TControllerProps, TControllerActions>{}

export function define<
    TControllerProps = any, 
    TControllerActions = TControllerProps,
    TActions = XAction<TControllerProps>>(controllerConfig: DefineArgs<TControllerProps, TControllerActions, PropInfoExt<TControllerProps>, XAction<TControllerProps>>){
    const rC = controllerConfig.config as WCConfig;
    xe.def({
        config:{
            tagName: rC.tagName,
            propDefaults:{
                actions: rC.actions,
                ...rC.propDefaults,
                isC: true,
            },
            propInfo:{
                newTarget:{
                    dry: false,
                }
            },
            actions:{
                watchForElementsToUpgrade:{
                    ifAllOf: ['isC', 'upgrade', 'ifWantsToBe'],
                    ifKeyIn: ['forceVisible'],
                },
                pairTargetWithController:{
                    ifAllOf:['newTarget', 'ifWantsToBe', 'controller'],
                    ifKeyIn:['finale',  'virtualProps', 'intro', 'actions']
                },             
            },
            style:{
                display: 'none'
            }

        },
        complexPropDefaults:{
            ...controllerConfig.complexPropDefaults
        },
        superclass: BeDecoratedCore
    })
}
