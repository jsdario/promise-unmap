declare type Future = Promise<any> | (() => Promise<any>);
export declare function promiseUnmap(futures: Array<Future>): Promise<any[]>;
export declare function promiseUnmapSerial(futures: Array<Future>): Promise<any>;
export {};
