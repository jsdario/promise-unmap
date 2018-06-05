"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class ExtendableError extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.stack = new Error().stack;
        this.name = this.constructor.name;
    }
}
class PromiseUnmapError extends ExtendableError {
    constructor(results = []) {
        super('One or more tasks failed');
        this.fulfillments = results.filter((r) => !(r instanceof Error));
        this.errors = results.filter((r) => r instanceof Error);
    }
}
function promiseUnmap(futures) {
    return Promise.all(futures.map(f => {
        return typeof f === 'function'
            ? f().catch((err) => err)
            : f.catch((err) => err);
    })).then((results) => {
        if (results.some(r => r instanceof Error)) {
            throw new PromiseUnmapError(results);
        }
        return results;
    });
}
exports.promiseUnmap = promiseUnmap;
function promiseUnmapSerial(futures) {
    return __awaiter(this, void 0, void 0, function* () {
        let safePromises = [];
        for (const f of futures) {
            if (typeof f === 'function') {
                const p = yield f().catch((err) => err);
                safePromises = [...safePromises, Promise.resolve(p)];
            }
            else {
                safePromises = [...safePromises, f.catch((err) => err)];
            }
        }
        return safePromises.reduce((accPromises, currPromise) => accPromises.then(accResults => currPromise.then(currResult => [...accResults, currResult])), Promise.resolve([]))
            .then(results => {
            if (results.some((r) => r instanceof Error)) {
                return Promise.reject(new PromiseUnmapError(results));
            }
            return results;
        });
    });
}
exports.promiseUnmapSerial = promiseUnmapSerial;
