import {Attachable} from  'trans-render/lib/types';
import {lispToCamel} from 'trans-render/lib/lispToCamel.js';

export function attachAndResolve(target: Element, behaviorName: string, defaultVals: any): Promise<void>{
    return new Promise(async resolve => {
        const ifWantsToBe = behaviorName.replace('be-', '');
        const camel = lispToCamel(ifWantsToBe);
        
        if((<any>target).beDecorated === undefined){
            (<any>target).beDecorated = {}
        }
        const bed = (<any>target).beDecorated;
        if(bed[camel] === undefined){
            bed[camel] === defaultVals;
        }else{
            Object.assign(bed[camel], defaultVals);
        }
        const bc = bed[camel];
        if(bc.self === target){
            resolve();
            return;
        }
        target.addEventListener('be-decorated.' + ifWantsToBe + '.resolved', e => {
            resolve();
        }, {once: true});
        await customElements.whenDefined(behaviorName);
        const beH = document.createElement(behaviorName) as any as Attachable;
        beH.attach(target);
    });
}