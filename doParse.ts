import {BeDecoratedProps} from './types';
import {getVal} from './upgrade.js';
export function doParse(target: Element, beDecorProps: BeDecoratedProps){
    let params: any;
    const {ifWantsToBe, virtualPropsMap} = beDecorProps;
    const val = getVal(target, ifWantsToBe);
    const attr = val[0]!.trim();
    if(virtualPropsMap.has(target)){
        //this may happen if an element is moved or "frozen" via trans-render/lib/freeze.js after already initialized
        params = virtualPropsMap.get(target);
        if(attr.length > 0){
            try{
                const parsedObj = JSON.parse(attr);
                Object.assign(params, parsedObj);
            }catch(e){
                console.error(e);
            }
        }        
    }
    if(params === undefined){
        try{
            params = JSON.parse(attr);
        }catch(e){
            console.error({
                e,
                target,
                attr
            });
            return;
        }
        
        beDecorProps.virtualPropsMap.set(target, params);
    }
    return params;
}