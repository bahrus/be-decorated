import {XAction} from 'xtal-element/src/types';

export interface BeDecoratedConfig<TControllerProps, TControllerActions = TControllerProps>{
    config: {
        upgrade: string;
        ifWantsToBe: string;
    
        init: keyof TControllerActions;
    
        finale: keyof TControllerActions;
    
        on: {[key: string]: keyof TControllerActions};

        actions: Partial<{[key in keyof TControllerActions]: XAction}>
    };

    controller: TControllerProps & TControllerActions;
}

export interface BeDecoratedProps{}

export interface BeDecoratedActions{}


export interface UpgradeArg<T extends Object>{
    /**
     * Apply trait to all elements within the specified ShadowDOM realm.  
     */
    shadowDomPeer: Node,
    /**
     * CSS query to monitor for matching elements within ShadowDOM Realm.
     */
    upgrade: string,
    /**
     * Monitor for attributes that start with be-[ifWantsToBe]
     */
    ifWantsToBe: string,

    forceVisible: boolean,
}