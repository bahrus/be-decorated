import {Action, PropInfo} from 'trans-render/lib/types';
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

// export interface MinimalController{
//     propChangeQueue?: Set<string>;
//     proxy?: Element;
//     emitEvents?: boolean | string[];
//     beDecorated?: any;
//     //debug?: boolean;
// }

export interface MinimalProxy<TTargetElement = Element>{
    self: TTargetElement,
    resolved?: boolean | string | undefined;
    rejected?: boolean | string | undefined;
    emitEvents?: boolean | string[];
    controller: any;
    proxy: TTargetElement;
}

export interface BeDecoratedProps<TControllerProps = any, TControllerActions = TControllerProps>{
    upgrade: string;
    ifWantsToBe: string;
    disabled: boolean;

    intro: keyof TControllerActions;

    finale: keyof TControllerActions;


    actions: Partial<{[key in keyof TControllerActions]: keyof TControllerProps | Action<TControllerProps>}>;

    controller: {new(): TControllerProps & TControllerActions};

    //newTarget: Element | undefined;

    newTargets: Element[];

    forceVisible: string[];

    virtualProps: (keyof TControllerProps)[];

    nonDryProps: (keyof TControllerProps)[];

    noParse: boolean;

    proxyPropDefaults: Partial<{[key in keyof TControllerProps]: any}>;

    emitEvents: boolean | string[];

    resolved: boolean | string | undefined;

    rejected: boolean | string | undefined;

    primaryProp: string;

    primaryPropReq: boolean;

    //isC: boolean;

    //virtualPropsMap: WeakMap<Element, any>;

    /**
     * Do an aggressive querySelectorAll for the matching elements, prior to monitoring css animation
     */
    //doInitSearch: boolean;

    /**
     * Don't use css animation hack to monitor for matching elements appearing in Shadow DOM realm.
     */
    //searchOnce: boolean;
}

export interface BeDecoratedActions{
    watchForElementsToUpgrade(self: this): void;
    pairTargetsWithController(self: this): void;
}

export interface DEMethods{
    attach(target: Element): Promise<void>;
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

export interface DA<TControllerProps = any, TControllerActions=TControllerProps> {
    
    config:{
        propDefaults: BeDecoratedProps<TControllerProps, TControllerActions>
    },
    complexPropDefaults: {
        controller: {new(): any}
    }
    
}

export interface IEventConfig<MCProps = any, MCActions = MCProps, TAction = Action>{
    on: string,
    of: EventTarget,
    doInit?: boolean,
}

//export type EventConfigs<MCProps = any, MCActions = MCProps, TAction = Action> = {[key: string]: IEventConfig<MCProps, MCActions, TAction>}

export type EventConfigs<MCProps = any, MCActions = MCProps, TAction = Action> = Partial<{[key in keyof MCActions]: IEventConfig<MCProps, MCActions, TAction>}>