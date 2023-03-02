import {Action, PropInfo, DefineArgs} from 'trans-render/lib/types';
import {IEventConfig as IBaseEventConfig} from 'trans-render/froop/types';

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

export interface ActionExt<TControllerProps = any, TControllerActions = TControllerProps> extends Action<TControllerProps, TControllerActions>{
    returnObjMold?: Partial<TControllerProps> | [Partial<TControllerProps> | undefined, EventConfigs<TControllerProps, TControllerActions> | undefined]
}

export interface BeDecoratedProps<TControllerProps = any, TControllerActions = TControllerProps, TPrimaryProp = any>{
    upgrade: string;
    ifWantsToBe: string;
    disabled: boolean;

    intro: keyof TControllerActions;

    finale: keyof TControllerActions;

    actions: Partial<{[key in keyof TControllerActions]: keyof TControllerProps | ActionExt<TControllerProps, TControllerActions>}>;

    controller: {new(): TControllerProps & TControllerActions};

    newTargets: Element[];

    forceVisible: string[];

    virtualProps: (keyof TControllerProps)[];

    nonDryProps: (keyof TControllerProps)[];

    noParse: boolean;

    proxyPropDefaults: Partial<TControllerProps>;

    emitEvents: boolean | (keyof TControllerProps)[];

    resolved: boolean | string | undefined;

    rejected: boolean | string | undefined;

    primaryProp: (keyof TControllerProps);

    primaryPropReq: boolean;

    parseAndCamelize: boolean;

    camelizeOptions: CamelizeOptions<TPrimaryProp>
 

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

export interface CamelizeOptions<TPrimaryProp = any>{
    simpleSets: (keyof TPrimaryProp)[];
    doSets: boolean;
}

export interface BeDecoratedActions{
    watchForElementsToUpgrade(self: this): void;
    pairTargetsWithController(self: this): void;
}

// export interface DEMethods{
//     attach(target: Element): Promise<void>;
// }


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

export interface IEventConfig<MCProps = any, MCActions = MCProps, TAction = Action>
    extends IBaseEventConfig<MCProps, MCActions, TAction>
{
    abort?: {
        origMethName: string & keyof MCActions,
        //destMethName: string & keyof MCActions,
        of: 'tbd' | EventTarget,
        on: string, 
        
    },
    composedPathMatches?: string,
}

//export type EventConfigs<MCProps = any, MCActions = MCProps, TAction = Action> = {[key: string]: IEventConfig<MCProps, MCActions, TAction>}

export type EventConfigs<MCProps = any, MCActions = MCProps, TAction = Action> = Partial<{[key in keyof MCActions]: true | IEventConfig<MCProps, MCActions, TAction>}>

export type OriginatingMethodName = string;

export type OMN = OriginatingMethodName;

export type EventType = string;

export type ET = EventType;

export type EventType2AbortController = Map<EventType, AbortController>;

export type ET2AC = EventType2AbortController;

export type OMN2ET2AC = Map<OMN, ET2AC>;

export type DestinationMethodName = string;

export type DMN = DestinationMethodName;

export type DMN2OMN2ET2AC = Map<DMN, OMN2ET2AC>;

export type EvTg2DMN2OMN2ET2AC = WeakMap<EventTarget, DMN2OMN2ET2AC>;