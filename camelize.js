export function camelize(strToCamelize) {
    const statements = strToCamelize.split('.');
    const objToMerge = {};
    for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (trimmedStatement.length === 0)
            continue;
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
    return objToMerge;
}
