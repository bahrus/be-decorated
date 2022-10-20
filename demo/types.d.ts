import {MinimalProxy} from '../types';
export interface EndUserProps{
    on: string;
}

export interface VirtualProps extends EndUserProps, MinimalProxy<HTMLButtonElement>{
    count: number;
}

export type Proxy = HTMLButtonElement & VirtualProps;

export interface ProxyProps extends VirtualProps{
    proxy: Proxy;
}

export type PP = ProxyProps;

export interface Actions{
    hydrate(pp: PP): void;
}