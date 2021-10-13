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

export interface BeDecoratedProps<TControllerProps = any, TControllerActions = TControllerProps>{
    upgrade: string;
    ifWantsToBe: string;

    intro: keyof TControllerActions;

    finale: keyof TControllerActions;

    //on: {[key: string]: keyof TControllerActions};

    actions: Partial<{[key in keyof TControllerActions]: XAction}>;

    controllerCtor: any;// TControllerProps & TControllerActions;

    //controllerConfig: DefineArgs<TControllerProps, TControllerActions>

    newTarget: Element | undefined;

    forceVisible: boolean;

    virtualProps: string[];

    noParse: boolean;
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