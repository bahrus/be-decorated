import {lispToCamel} from 'trans-render/lib/lispToCamel.js';
export function doThen(proxy: Element, then: string | any[] | any){
    switch(typeof then){
        case 'string':
            proxy.setAttribute(lispToCamel(then), '');
            break;
        case 'object':
            if(Array.isArray(then)){
                throw 'NI';//not implemented
            }else{
                for(const key in then){
                    const val = then[key];
                    const ltc = lispToCamel(key);
                    switch(typeof val){
                        case 'string':
                            proxy.setAttribute(ltc, val);
                            break;
                        case 'object':
                            proxy.setAttribute(ltc, JSON.stringify(val));
                            break;
                        default:
                            throw 'NI';//not implemented
                    }
                }
            }
            break;
        default:
            throw 'NI';//not implemented
    }
}