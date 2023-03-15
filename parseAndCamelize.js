export function parseAndCamelize(json) {
    if (json.startsWith('```')) {
        const split = json.split('```').filter(s => s.trim() !== '');
        //No nested ```'s
        return split.map(s => parseAndCamelize(s));
    }
    const lastChar = json.lastIndexOf('}');
    const strToCamelize = json.substring(lastChar + 1);
    json = json?.substring(0, lastChar + 1);
    const parsedObj = JSON.parse(json);
    const statements = strToCamelize.split('.');
    const objToMerge = {};
    for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (trimmedStatement.startsWith('//'))
            continue;
        const normalizedStatement = trimmedStatement.replace(/\s+/g, ' ');
        const splitStatement = normalizedStatement.split(' ');
        const head = splitStatement[0];
        let bucket = objToMerge[head];
        if (bucket === undefined) {
            bucket = [];
            objToMerge[head] = bucket;
        }
        const tail = splitStatement.slice(1).map((s, idx) => idx === 0 ? s : s[0].toUpperCase() + s.substring(1)).join('');
        bucket.push(tail);
    }
    Object.assign(parsedObj, objToMerge);
    return parsedObj;
}
