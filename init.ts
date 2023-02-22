import { BeDecoratedProps } from './types';
import { Action} from 'trans-render/lib/types';
declare const Sanitizer: any;

export async function init<TControllerProps = any>(self: any, props: BeDecoratedProps, newTarget: Element, controller: any, passedIn: any, ifWantsToBe: string) {
    const { actions, proxyPropDefaults, primaryProp, parseAndCamelize } = props;
    controller.propChangeQueue = new Set<string>();
    const objToAssign = proxyPropDefaults !== undefined ? {...proxyPropDefaults} : {};
    const { getAttrInfo } = await import('./upgrade.js');
    const attr = getAttrInfo(newTarget!, ifWantsToBe!, true);
    let parsedObj: any;
    let json: string | undefined;
    if(attr !== null && attr.length !== 0 && attr[0]!.length !== 0){
        json = attr[0]!.trim();
        if(typeof Sanitizer !== undefined){
            const sanitizer = new Sanitizer();
            json = sanitizer.sanitizeFor('template', json).innerHTML as string;
        }
        const firstChar = json[0];
        if (firstChar === '{' || firstChar === '[') {
            try {
                if(parseAndCamelize){
                    const {parseAndCamelize} = await import('./parseAndCamelize.js');
                    parsedObj = parseAndCamelize(json!);

                }else{
                    parsedObj = JSON.parse(json!);
                }
                
            } catch (e) {
                console.error(e);
            }
        }else{
            if(parseAndCamelize){
                const {camelize} = await import('./camelize.js');
                parsedObj = camelize(json);
            }
        }
    }
    const proxy = controller.proxy;
    if (primaryProp !== undefined) {
        if (parsedObj === undefined) {
            if(json) objToAssign[primaryProp as string] = json;
        } else {
            const { primaryPropReq } = props;
            if (Array.isArray(parsedObj) || (primaryPropReq && parsedObj[primaryProp] === undefined)) {
                objToAssign[primaryProp as string] = parsedObj;
            } else {
                Object.assign(objToAssign, parsedObj);
            }
        }
    } else {
        if (parsedObj !== undefined) {
            Object.assign(objToAssign, parsedObj);
        }
    }
    if(passedIn !== undefined){
        Object.assign(objToAssign, passedIn);
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