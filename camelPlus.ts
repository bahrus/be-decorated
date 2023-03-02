import {BeDecoratedProps, CamelizeOptions} from './types';
export async function camelPlus(objToAssign: any, options: CamelizeOptions, primaryProp: string, props: BeDecoratedProps){
    const {doSets, simpleSets} = options;
    const camelConfig = objToAssign[primaryProp];
    if(doSets){
        
        const {Set} = camelConfig!;
        if(Set !== undefined){
            const {parseSet} = await import('be-decorated/cpu.js');
            parseSet(Set, camelConfig);
        }
    }
    if(simpleSets !== undefined){
        const {lc} = await import('./cpu.js');
        for(const simpleSet of simpleSets){
            const propName = lc(simpleSet);
            camelConfig[propName] = camelConfig[simpleSet][0];
        }
    }
}