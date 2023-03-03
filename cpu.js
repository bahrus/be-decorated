//camel parse utilities
export function lc(s) {
    return s[0].toLowerCase() + s.substring(1);
}
export function uc(s) {
    return s[0].toUpperCase() + s.substring(1);
}
export function toLcGrp(groups) {
    const lcGroup = {};
    for (const k in groups) {
        const val = groups[k];
        lcGroup[k] = val.split('\\').map((s, idx) => idx === 0 ? lc(s) : uc(s)).join('');
    }
    return lcGroup;
}
export function tryParse(s, re) {
    const test = re.exec(s);
    if (test === null)
        return null;
    return toLcGrp(test.groups);
}
export function arr(inp) {
    return inp === undefined ? []
        : Array.isArray(inp) ? inp : [inp];
}
export function append(inp, camelStrings, regExp) {
    const regExps = arr(regExp);
    for (const camelString of camelStrings) {
        const toDot = camelString.replaceAll(':', '.');
        //TODO:  regexps
        let grp = toDot;
        const regExps = arr(regExp);
        for (const r of regExps) {
            const test = r.exec(toDot);
            const grps = test?.groups;
            if (grps) {
                grp = toLcGrp(grps);
                break;
            }
        }
        inp.push(grp);
    }
}
const reSet = /^(?<lhs>\w+)(?<!\\)To(?<rhs>[\w\.]+)/;
export function parseSet(Set, camelConfig) {
    if (Set !== undefined) {
        const setRules = [];
        append(setRules, Set, reSet);
        for (const rule of setRules) {
            camelConfig[rule.lhs] = rule.rhs;
        }
    }
}
export async function beSplit(s) {
    const split = s.split('.');
    if (split.length > 1) {
        const { camelToLisp } = await import('trans-render/lib/camelToLisp.js');
        let firstTokenCamel = camelToLisp(split[0]);
        if (firstTokenCamel.startsWith('be-')) {
            firstTokenCamel = firstTokenCamel.replace('be-', '');
            //const {lc} = await import('be-decorated/cpu.js');
            const path = '.beDecorated.' + lc(s.replace('be', ''));
            const eventName = 'be-decorated.' + firstTokenCamel + '.resolved';
            return { path, eventName };
        }
    }
}
