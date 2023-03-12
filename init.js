export async function init(self, props, newTarget, controller, passedIn, ifWantsToBe) {
    const { actions, proxyPropDefaults, primaryProp, parseAndCamelize } = props;
    controller.propChangeQueue = new Set();
    const objToAssign = proxyPropDefaults !== undefined ? { ...proxyPropDefaults } : {};
    const { getAttrInfo } = await import('./upgrade.js');
    const attr = getAttrInfo(newTarget, ifWantsToBe, true);
    let parsedObj;
    let json;
    if (attr !== null && attr.length !== 0 && attr[0].length !== 0) {
        json = attr[0].trim();
        if (typeof Sanitizer !== 'undefined') {
            const sanitizer = new Sanitizer();
            if (sanitizer.sanitizeFor !== undefined) {
                json = sanitizer.sanitizeFor('template', json).innerHTML;
            }
        }
        const firstChar = json[0];
        if (firstChar === '{' || firstChar === '[') {
            try {
                if (parseAndCamelize) {
                    const { parseAndCamelize } = await import('./parseAndCamelize.js');
                    parsedObj = parseAndCamelize(json);
                }
                else {
                    parsedObj = JSON.parse(json);
                }
            }
            catch (e) {
                console.error(e);
            }
        }
        else {
            if (parseAndCamelize) {
                const { camelize } = await import('./camelize.js');
                parsedObj = camelize(json);
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
        if (attr !== null && primaryProp && parseAndCamelize) {
            const { camelizeOptions } = props;
            if (camelizeOptions !== undefined) {
                const { camelPlus } = await import('./camelPlus.js');
                await camelPlus(objToAssign, camelizeOptions, primaryProp, props);
            }
        }
    }
    else {
        if (parsedObj !== undefined) {
            Object.assign(objToAssign, parsedObj);
        }
    }
    if (passedIn !== undefined) {
        Object.assign(objToAssign, passedIn);
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
