"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
class ExtendableError extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.stack = new Error().stack;
        this.name = this.constructor.name;
    }
}
class PromiseUnmapError extends ExtendableError {
    constructor(results = [], message = 'One or more tasks failed') {
        super(message);
        this.fulfillments = results.filter((r) => !(r instanceof Error));
        this.errors = results.filter((r) => r instanceof Error);
    }
}
function promiseUnmap(promises) {
    return Promise.all(promises.map(p => {
        return typeof p === 'function'
            ? p().catch((err) => err)
            : p.catch((err) => err);
    })).then((results) => {
        if (results.some(r => r instanceof Error)) {
            throw new PromiseUnmapError(results);
        }
        return results;
    });
}
exports.promiseUnmap = promiseUnmap;
function promiseUnmapSerial(futures) {
    const safePromises = futures.map(f => {
        const p = typeof f === 'function' ? f() : f;
        return p.catch(err => err);
    });
    return safePromises.reduce((accPromises, currPromise) => accPromises.then(accResults => currPromise.then(currResult => [...accResults, currResult])), Promise.resolve([]))
        .then(results => {
        if (results.some((r) => r instanceof Error)) {
            return Promise.reject(new PromiseUnmapError(results));
        }
        return results;
    });
}
exports.promiseUnmapSerial = promiseUnmapSerial;
