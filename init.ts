import { BeDecoratedProps } from './types';
import { Action} from 'trans-render/lib/types';

export async function init<TControllerProps = any>(self: any, props: BeDecoratedProps, newTarget: Element, controller: any, passedIn: any) {
    const { actions, proxyPropDefaults, primaryProp, ifWantsToBe } = props;
    controller.propChangeQueue = new Set<string>();
    const objToAssign = proxyPropDefaults !== undefined ? {...proxyPropDefaults} : {};
    const { getAttrInfo } = await import('./upgrade.js');
    const attr = getAttrInfo(newTarget!, ifWantsToBe!, true);
    let parsedObj: any;
    let json: string | undefined;
    let err: any;
    if(attr !== null && attr.length !== 0 && attr[0]!.length !== 0){
        
        json = attr[0]!.trim();
        const firstChar = json[0];
        if (firstChar === '{' || firstChar === '[') {
            try {
                parsedObj = JSON.parse(json);
            } catch (e) {
                err = e;
            }
        }
    }
    const proxy = controller.proxy;
    if (primaryProp !== undefined) {
        if (parsedObj === undefined) {
            if(json) objToAssign[primaryProp] = json;
        } else {
            const { primaryPropReq } = props;
            if (Array.isArray(parsedObj) || (primaryPropReq && parsedObj[primaryProp] === undefined)) {
                objToAssign[primaryProp] = parsedObj;
            } else {
                Object.assign(objToAssign, parsedObj);
            }
        }
    } else {
        if (parsedObj !== undefined) {
            Object.assign(objToAssign, parsedObj);
        }
    }
    Object.assign(controller.proxy, objToAssign);
}

export function getPropsFromActions(action: Action): Set<string>{
    return typeof(action) === 'string' ? new Set<string>([action]) : new Set<string>([
        ...(action.ifAllOf || []) as string[], 
        ...(action.ifKeyIn || []) as string[], 
        ...(action.ifNoneOf || []) as string[],
        ...(action.ifEquals || []) as string[],
        ...(action.ifAtLeastOneOf || []) as string[]
    ]);
}