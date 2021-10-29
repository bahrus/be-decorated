import {upgrade as upgr, getAttrInfo} from './upgrade.js';
import {BeDecoratedProps, BeDecoratedActions, BeDecoratedConfig} from './types';
import {XE} from 'xtal-element/src/XE.js';
import {DefineArgs} from 'trans-render/lib/types';
import {XAction, PropInfoExt} from 'xtal-element/src/types';
import {onRemove} from 'trans-render/lib/onRemove.js';
import {intersection} from 'xtal-element/lib/intersection.js';

export {BeDecoratedProps, MinimalController} from './types';

export const xe = new XE<BeDecoratedProps, BeDecoratedActions, XAction<BeDecoratedProps>>();

const reqVirtualProps = ['self', 'emitEvents', 'debug'];

export class BeDecoratedCore<TControllerProps, TControllerActions> extends HTMLElement implements BeDecoratedActions{
    targetToController: WeakMap<any, any> = new WeakMap();
    watchForElementsToUpgrade({upgrade, ifWantsToBe, forceVisible}: this){
        const callback = (target: Element) => {
            this.newTarget = target;
        }
        upgr({
            shadowDomPeer: this,
            upgrade: upgrade!,
            ifWantsToBe: ifWantsToBe!,
            forceVisible,
        }, callback);
        // register in the be-hive registry




    }

    parseAttr({targetToController, newTarget, noParse, ifWantsToBe, actions, proxyPropDefaults}: this){
        const controller = targetToController.get(newTarget);
        if(controller){
            if(!noParse){
                const attr = getAttrInfo(newTarget!, ifWantsToBe!, true);
                if(attr !== null && attr.length > 0 && attr[0]!.length > 0){
                    controller.propChangeQueue = new Set<string>();
                    if(proxyPropDefaults !== undefined){
                        Object.assign(controller.proxy, proxyPropDefaults);
                    }
                    let parsedObj: any;
                    try{
                        parsedObj = JSON.parse(attr[0]!);
                    }catch(e){
                        console.error({
                            attr,
                            e,
                            newTarget
                        })
                    }
                    Object.assign(controller.proxy, JSON.parse(attr[0]!));
                    const filteredActions: any = {};
                    const queue = controller.propChangeQueue;
                    controller.propChangeQueue = undefined;
                    if(actions !== undefined){
                        for(const methodName in actions){
                            const action = actions[methodName]!;
                            const props = xe.getProps(xe, action); //TODO:  cache this
                            //if(!props.has(key as string)) continue;
                            if(!intersection(queue, props)) continue;
                            if(xe.pq(xe, action, controller.proxy)){
                                filteredActions[methodName] = action;
                            }
                        }
                        xe.doActions(xe, filteredActions, controller, controller.proxy);
                    }

                }
            }
            return true;
        }
        return false;
    }

    pairTargetWithController({newTarget, actions, targetToController, virtualProps, controller, ifWantsToBe, noParse, finale, intro, nonDryProps}: this){
        if(this.parseAttr(this)) return;
        const controllerInstance = new controller();
        const proxy = new Proxy<Element & TControllerProps>(newTarget! as Element & TControllerProps, {
            set: (target: Element & TControllerProps, key: string & keyof TControllerProps, value) => {
                const {emitEvents, propChangeQueue, debug} = controllerInstance;
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
                            const props = xe.getProps(xe, action); //TODO:  cache this
                            if(!props.has(key as string)) continue;
                            if(xe.pq(xe, action, controllerInstance as any as BeDecoratedProps<any, any>)){
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
                        if(debug){
                            console.log({emitEvents, name, detail, target});
                        }
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
        controllerInstance.proxy = proxy;
        targetToController.set(newTarget, controllerInstance);
        if(intro !== undefined){
            (<any>controllerInstance)[intro](proxy, newTarget, this);
        }
        this.parseAttr(this);
        if((<any>proxy).debug){
            const debugTempl = document.createElement('template');
            debugTempl.setAttribute(`data-debugger-for-${ifWantsToBe}`, '');
            (<any>debugTempl).controller = controllerInstance;
            (<any>debugTempl).proxy = proxy;
            newTarget!.insertAdjacentElement('afterend', debugTempl);
        }
        onRemove(newTarget!, (removedEl: Element) =>{
            if(controllerInstance !== undefined && finale !== undefined)
            (<any>controllerInstance)[finale](proxy, removedEl, this);
            //element might come back -- need to reactivate if it does
            const isAttr = removedEl.getAttribute('is-' + this.ifWantsToBe);
            if(isAttr !== null) {
                setTimeout(() => {
                    removedEl.setAttribute('be-' + this.ifWantsToBe, isAttr);
                }, 50);
            }
            removedEl.removeAttribute('is-' + this.ifWantsToBe);
        });
    }
}

type BeDecoratedMC<TControllerProps, TControllerActions> =  BeDecoratedActions & BeDecoratedProps<TControllerProps, TControllerActions>;

export interface BeDecoratedCore<TControllerProps, TControllerActions> extends BeDecoratedMC<TControllerProps, TControllerActions>{}

// export function define<TControllerProps, TControllerActions>(metaConfig: BeDecoratedConfig<TControllerProps, TControllerActions>){
//     xe.def(metaConfig.wc)
// }

export function define<
    TControllerProps = any, 
    TControllerActions = TControllerProps, 
    TActions = XAction<TControllerProps>>(controllerConfig: DefineArgs<TControllerProps, TControllerActions, PropInfoExt<TControllerProps>, XAction<TControllerProps>>){
    const rC = controllerConfig.config;
    xe.def({
        config:{
            tagName: controllerConfig.config.tagName,
            propDefaults:{
                actions: rC.actions,
                ...rC.propDefaults
            }, 
            actions:{
                watchForElementsToUpgrade:{
                    ifAllOf: ['upgrade', 'ifWantsToBe'],
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
