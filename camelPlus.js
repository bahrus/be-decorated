export async function camelPlus(objToAssign, options, primaryProp, props) {
    const { doSets } = options;
    if (doSets) {
        const camelConfig = objToAssign[primaryProp];
        const { Set } = camelConfig;
        if (Set !== undefined) {
            const { parseSet } = await import('be-decorated/cpu.js');
            parseSet(Set, camelConfig);
        }
    }
}
