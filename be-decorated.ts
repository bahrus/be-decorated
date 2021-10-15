import {upgrade as upgr, getAttrInfo} from './upgrade.js';
import {BeDecoratedProps, BeDecoratedActions, BeDecoratedConfig} from './types';
import {XE} from 'xtal-element/src/XE.js';
import {DefineArgs} from 'trans-render/lib/types';
import {onRemove} from 'trans-render/lib/onRemove.js';
import {intersection} from 'xtal-element/lib/intersection.js';

export {BeDecoratedProps} from './types';

export const xe = new XE<BeDecoratedProps, BeDecoratedActions>();

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
    }

    parseAttr({targetToController, newTarget, noParse, ifWantsToBe, actions}: this){
        const controller = targetToController.get(newTarget);
        if(controller){
            if(!noParse){
                const attr = getAttrInfo(newTarget!, ifWantsToBe!, true);
                if(attr !== null && attr.length > 0 && attr[0]!.length > 0){
                    controller.propChangeQueue = new Set<string>();
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
                        xe.doActions(xe, filteredActions, controller, null);
                    }

                }
            }
            return true;
        }
        return false;
    }

    pairTargetWithController({newTarget, actions, targetToController, virtualProps, controller, ifWantsToBe, noParse, finale, intro}: this){
        if(this.parseAttr(this)) return;
        const controllerInstance = new controller();
        const proxy = new Proxy(newTarget!, {
            set: (target: Element & TControllerProps, key: string & keyof TControllerProps, value) => {
                if(key === 'self' || (virtualProps !== undefined && virtualProps.includes(key))){
                    controllerInstance[key] = value;
                }else{
                    target[key] = value;
                }
                if(key === 'self') return true;
                if(controllerInstance.propChangeQueue){
                    controllerInstance.propChangeQueue.add(key);
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
                        xe.doActions(xe, filteredActions, controllerInstance, {key, ov, nv}); 
                    }
                }

                return true;
            },
            get:(target: Element & TControllerProps, key: string & keyof TControllerProps)=>{
                let value;// = Reflect.get(target, key);
                if(key === 'self' || (virtualProps !== undefined && virtualProps.includes(key))){
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
        onRemove(newTarget!, (removedEl: Element) =>{
            if(controllerInstance !== undefined && finale !== undefined)
            (<any>controllerInstance)[finale](proxy, removedEl);
        });
    }
}

type BeDecoratedMC<TControllerProps, TControllerActions> =  BeDecoratedActions & BeDecoratedProps<TControllerProps, TControllerActions>;

export interface BeDecoratedCore<TControllerProps, TControllerActions> extends BeDecoratedMC<TControllerProps, TControllerActions>{}

// export function define<TControllerProps, TControllerActions>(metaConfig: BeDecoratedConfig<TControllerProps, TControllerActions>){
//     xe.def(metaConfig.wc)
// }

export function define<TControllerProps = any, TControllerActions = TControllerProps>(controllerConfig: DefineArgs<TControllerProps, TControllerActions>){
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