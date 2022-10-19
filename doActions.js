export async function doActions(actions, target, proxy) {
    for (const methodName in actions) {
        const action = actions[methodName];
        if (action.debug)
            debugger;
        //https://lsm.ai/posts/7-ways-to-detect-javascript-async-function/#:~:text=There%205%20ways%20to%20detect%20an%20async%20function,name%20property%20of%20the%20AsyncFunction%20is%20%E2%80%9CAsyncFunction%E2%80%9D.%202.
        const method = target[methodName];
        if (method === undefined) {
            throw {
                message: 404,
                methodName,
                target,
            };
        }
        const isAsync = method.constructor.name === 'AsyncFunction';
        const ret = isAsync ? await target[methodName](proxy) : target[methodName](proxy);
        if (ret === undefined)
            continue;
        Object.assign(proxy, ret);
    }
}