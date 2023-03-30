import {Declarations} from './types';
//camel parse utilities

export function lc(s: string){
    if(!s) return s;
    return s[0].toLowerCase() + s.substring(1);
}

export function uc(s: string){
    return s[0].toUpperCase() + s.substring(1);
}

export function toLcGrp(groups: any, declarations: Declarations = {}){
    const lcGroup = {} as any;
    for(const k in groups){
        const val = groups[k];
        const rhs = lc(val);
        const rhs2 = declarations[rhs] || rhs;
        lcGroup[k] = rhs2;
    }
    return lcGroup;
}

export function unescSplit(val: string){
    return val.split('\\').map((s: string, idx: number) => idx === 0 ? lc(s) : uc(s)).join('');
}

export function tryParse(s: string, regExp: RegExp | RegExp[], declarations: Declarations = {}){
    const reArr = arr(regExp);
    for(const re of reArr){
        const test = re.exec(s);
        if(test === null) continue;
        return toLcGrp(test.groups, declarations);
    }
    
}

export function arr<T = any>(inp: T | T[] | undefined) : T[] {
    return inp === undefined ? []
        : Array.isArray(inp) ? inp : [inp];
}

export function append<T = any>(inp: T[], camelStrings: string[], regExp?: RegExp | RegExp[]){
    const regExps = arr(regExp);
    for(const camelString of camelStrings){
        const toDot = camelString.replaceAll(':', '.');
        //TODO:  regexps
        let grp = toDot as string | {[key: string] : string};
        const regExps = arr(regExp);
        for(const r of regExps){
            const test = r.exec(toDot);
            const grps = test?.groups;
            if(grps){
                grp = toLcGrp(grps);
                break;
            }
        }
        inp.push(grp as T);
    }
}

const reSet = /^(?<lhs>\w+)(?<!\\)To(?<rhs>[\w\.]+)/;
type lhs = string;
type rhs = string;

export function parseSet(Set: `${lhs}To${rhs}`[] | undefined, camelConfig: any ){
    if(Set !== undefined){
        const setRules: {lhs: lhs, rhs: rhs}[] = [];
        append(setRules, Set, reSet);
        for(const rule of setRules){
            camelConfig[rule.lhs] = rule.rhs;
        }
    }
}

export interface BeSplitOutput {
    eventName: string,
    path: string,
}

export async function beSplit(s: string): Promise<BeSplitOutput | undefined>{
    const split = s.split('.');
    if(split.length > 1){
        const {camelToLisp} = await import('trans-render/lib/camelToLisp.js');
        let firstTokenCamel = camelToLisp(split[0]);
        if(firstTokenCamel.startsWith('be-')){
            firstTokenCamel = firstTokenCamel.replace('be-', '');
            //const {lc} = await import('be-decorated/cpu.js');
            const path = '.beDecorated.' + lc(s.replace('be', ''));
            const eventName = 'be-decorated.' + firstTokenCamel + '.resolved';
            return {path, eventName};
        }
        
    }
}

