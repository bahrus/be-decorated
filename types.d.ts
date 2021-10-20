import {XAction} from 'xtal-element/src/types';
import {DefineArgs} from 'trans-render/lib/types';

export interface BeDecoratedConfig<TControllerProps, TControllerActions = TControllerProps>{
    config: {
        // upgrade: string;
        // ifWantsToBe: string;
    
        // init: keyof TControllerActions;
    
        // finale: keyof TControllerActions;
    
        // on: {[key: string]: keyof TControllerActions};

        // actions: Partial<{[key in keyof TControllerActions]: XAction}>;

        
    };

    wc: DefineArgs<any, any> //types TBD

    controller: TControllerProps & TControllerActions;
}

export interface MinimalController{
    propChangeQueue?: Set<string>;
    proxy?: Element;
    emitEvent?: boolean;
}

export interface BeDecoratedProps<TControllerProps = any, TControllerActions = TControllerProps>{
    upgrade: string;
    ifWantsToBe: string;

    intro: keyof TControllerActions;

    finale: keyof TControllerActions;


    actions: Partial<{[key in keyof TControllerActions]: XAction<TControllerProps>}>;

    controller: {new(): TControllerProps & TControllerActions & MinimalController};


    newTarget: Element | undefined;

    forceVisible: boolean;

    virtualProps: (keyof TControllerProps)[];

    noParse: boolean;

    proxyPropDefaults: Partial<{[key in keyof TControllerProps]: any}>;

    emitEvent: boolean;
}

export interface BeDecoratedActions{
    watchForElementsToUpgrade(self: this): void;
    pairTargetWithController(self: this): void;
}


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

export interface EventHandler{
    on: keyof ElementEventMap;
    elementToObserve: Element;
    fn: (e: Event) => void;
}