//camel parse utilities

export function lc(s: string){
    return s[0].toLowerCase() + s.substring(1);
}

export function toLcGrp(groups: any){
    const lcGroup = {} as any;
    for(const k in groups){
        lcGroup[k] = lc(groups[k]);
    }
    return lcGroup;
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
            const test = r.exec(camelString);
            const grps = test?.groups;
            if(grps){
                grp = toLcGrp(grps);
                break;
            }
        }
        inp.push(grp as T);
    }
}

const reSet = /^(?<lhs>\w+)(?<!\\)To(?<rhs>\w+)/;
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

