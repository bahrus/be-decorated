import {upgrade} from './upgrade.js';
import {BeDecoratedProps, BeDecoratedActions} from './types';
import {XE} from 'xtal-element/src/XE.js';

export const xe = new XE<BeDecoratedProps, BeDecoratedActions>();

export class BeDecoratedCore{}

export function define(){
    xe.def({
        config:{
    
        }
    })
}
