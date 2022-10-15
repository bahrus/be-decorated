export async function init(self, props, newTarget, controller, passedIn) {
    const { actions, proxyPropDefaults, primaryProp, ifWantsToBe } = props;
    controller.propChangeQueue = new Set();
    const objToAssign = proxyPropDefaults !== undefined ? { ...proxyPropDefaults } : {};
    const { getAttrInfo } = await import('./upgrade.js');
    const attr = getAttrInfo(newTarget, ifWantsToBe, true);
    let parsedObj;
    let json;
    let err;
    if (attr !== null && attr.length !== 0 && attr[0].length !== 0) {
        json = attr[0].trim();
        const firstChar = json[0];
        if (firstChar === '{' || firstChar === '[') {
            try {
                parsedObj = JSON.parse(json);
            }
            catch (e) {
                err = e;
            }
        }
    }
    const proxy = controller.proxy;
    if (primaryProp !== undefined) {
        if (parsedObj === undefined) {
            if (json)
                objToAssign[primaryProp] = json;
        }
        else {
            const { primaryPropReq } = props;
            if (Array.isArray(parsedObj) || (primaryPropReq && parsedObj[primaryProp] === undefined)) {
                objToAssign[primaryProp] = parsedObj;
            }
            else {
                Object.assign(objToAssign, parsedObj);
            }
        }
    }
    else {
        if (parsedObj !== undefined) {
            Object.assign(objToAssign, parsedObj);
        }
    }
    Object.assign(controller.proxy, objToAssign);
}
export function getPropsFromActions(action) {
    return typeof (action) === 'string' ? new Set([action]) : new Set([
        ...(action.ifAllOf || []),
        ...(action.ifKeyIn || []),
        ...(action.ifNoneOf || []),
        ...(action.ifEquals || []),
        ...(action.ifAtLeastOneOf || [])
    ]);
}
