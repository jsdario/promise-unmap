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
    const fulfilled = futures
        .reduce((accPromises, currPromise) => {
        const acc = typeof accPromises === 'function' ? accPromises() : accPromises;
        return acc.then((accResults) => {
            const p = typeof currPromise === 'function' ? currPromise() : currPromise;
            return p
                .then((currResult) => [...accResults, currResult])
                .catch((err) => [...accResults, err]);
        });
    }, Promise.resolve());
    const promises = typeof fulfilled === 'function' ? fulfilled() : fulfilled;
    return promises.then((results) => {
        if (results.some((r) => r instanceof Error)) {
            return Promise.reject(new PromiseUnmapError(results));
        }
        return results;
    });
}
exports.promiseUnmapSerial = promiseUnmapSerial;
