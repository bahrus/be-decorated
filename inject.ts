import {EventConfigs} from './types';
export function inject<T extends [any, EventConfigs]>(into: T, me: T, of?: EventTarget): T{
    const me0 = me[0];
    const into0 = into[0];
    if(into0 !== undefined) Object.assign(into0, me0);
    const me1 = me[1];
    const into1 = into[1];
    for(const key in me1){
        const into1val = into1[key];
        if(into1val !== undefined){
            Object.assign(into1val, me1[key]);
        }else{
            into1[key] = me1[key];
        }
    }
    if(of !== undefined){
        for(const val of Object.values(into1)){
            if(val?.of ===  'tbd'){
                val.of = of;
            }
            if(val?.abort?.of === 'tbd'){
                val.abort.of = of;
            }
        }
    }
    return into;
}