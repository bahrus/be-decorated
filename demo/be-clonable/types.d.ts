import {BeDecoratedProps, MinimalProxy} from 'be-decorated/types';

export interface EndUserProps {
    triggerInsertPosition?: InsertPosition;
    cloneInsertPosition?: InsertPosition;
    text?: string;
}

export interface VirtualProps extends EndUserProps, MinimalProxy{}

export type Proxy = Element & VirtualProps;

export interface ProxyProps extends VirtualProps{
    proxy: Proxy;
}

export type PP = ProxyProps;

export interface Actions{
    batonPass(proxy: PP, target: Element, beDecorProps: BeDecoratedProps, baton: any): void;
    finale(proxy: Proxy, target: Element, beDecorProps: BeDecoratedProps): void;
    onTriggerInsertPosition(proxy: PP): void;
    onText(proxy: PP): void;
}