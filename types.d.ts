import {XAction, PropInfoExt} from 'xtal-element/src/types';
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
    emitEvents?: boolean | string[];
    beDecorated?: any;
    //debug?: boolean;
}

export interface BeDecoratedProps<TControllerProps = any, TControllerActions = TControllerProps>{
    upgrade: string;
    ifWantsToBe: string;

    intro: keyof TControllerActions;

    finale: keyof TControllerActions;

    batonPass: keyof TControllerActions;

    actions: Partial<{[key in keyof TControllerActions]: keyof TControllerProps | XAction<TControllerProps>}>;

    controller: {new(): TControllerProps & TControllerActions & MinimalController};

    newTarget: Element | undefined;

    forceVisible: string[];

    virtualProps: (keyof TControllerProps)[];

    nonDryProps: (keyof TControllerProps)[];

    noParse: boolean;

    proxyPropDefaults: Partial<{[key in keyof TControllerProps]: any}>;

    emitEvents: boolean | string[];

    primaryProp: string;

    isC: boolean;

    virtualPropsMap: WeakMap<Element, any>;
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

    forceVisible: string[],

    

    
}

export interface EventHandler{
    on: string;
    elementToObserve: Element;
    fn: (e: Event) => void;
}