export function inject({ mold, with: w, tbdSlots }) {
    const into1 = mold[1];
    if (w !== undefined) {
        const me0 = w[0];
        const into0 = mold[0];
        if (into0 !== undefined)
            Object.assign(into0, me0);
        const me1 = w[1];
        if (me1 !== undefined) {
            for (const key in me1) {
                const into1val = into1[key];
                if (into1val !== undefined) {
                    Object.assign(into1val, me1[key]);
                }
                else {
                    into1[key] = me1[key];
                }
            }
        }
    }
    if (tbdSlots !== undefined) {
        const props = Object.keys(tbdSlots);
        for (const val of Object.values(into1)) {
            for (const prop of props) {
                if (val[prop] === 'tbd') {
                    val[prop] = tbdSlots[prop];
                }
                const abort = val.abort;
                if (abort?.[prop] === 'tbd') {
                    abort[prop] = tbdSlots[prop];
                }
            }
        }
    }
    return mold;
}
