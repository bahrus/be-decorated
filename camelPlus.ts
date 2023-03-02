import {BeDecoratedProps, CamelizeOptions} from './types';
export async function camelPlus(objToAssign: any, options: CamelizeOptions, primaryProp: string, props: BeDecoratedProps){
    const {doSets} = options;
    if(doSets){
        const camelConfig = objToAssign[primaryProp];
        const {Set} = camelConfig!;
        if(Set !== undefined){
            const {parseSet} = await import('be-decorated/cpu.js');
            parseSet(Set, camelConfig);
        }
    }
}