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
const _1 = require("./");
const chai = require("chai");
chai.should();
const expect = chai.expect;
const ops = [
    () => __awaiter(this, void 0, void 0, function* () { return 'resolves 1'; }),
    () => __awaiter(this, void 0, void 0, function* () { throw new Error('fails 2'); }),
    Promise.resolve('resolves 3'),
    () => __awaiter(this, void 0, void 0, function* () { return 'resolves 4'; }),
    Promise.reject(new Error('fails 5')),
    () => __awaiter(this, void 0, void 0, function* () { return 'resolves 6'; }),
];
const passingOps = [
    () => __awaiter(this, void 0, void 0, function* () { return 'resolves'; }),
    Promise.resolve('resolves'),
];
describe('promiseUnmap', function () {
    it('should fail with mixed requests', function (done) {
        _1.promiseUnmap(ops)
            .catch(err => {
            expect(err.errors.length).to.equal(2);
            expect(err.fulfillments.length).to.equal(4);
            done();
        });
    });
    it('should not fail if all are passing', function (done) {
        _1.promiseUnmap(passingOps)
            .then(results => {
            expect(results.length).to.equal(2);
            done();
        })
            .catch(done);
    });
    it('should fail with mixed requests in serial', function (done) {
        _1.promiseUnmapSerial(ops)
            .catch(err => {
            expect(err.errors.length).to.equal(2);
            expect(err.fulfillments.length).to.equal(4);
            done();
        });
    });
    it('should not fail if all are passing in serial', function (done) {
        _1.promiseUnmapSerial(passingOps)
            .then(results => {
            expect(results.length).to.equal(2);
            done();
        })
            .catch(done);
    });
    it('should begin all tasks immediately w/ promiseUnmap', function (done) {
        let startedOps = 0;
        const postponedOps = [
            createPostponedFuture(100, () => { startedOps = startedOps + 1; }),
            createPostponedFuture(200, () => { startedOps = startedOps + 1; }),
            createPostponedFuture(300, () => { startedOps = startedOps + 1; }),
        ];
        _1.promiseUnmap(postponedOps)
            .then(results => {
            expect(startedOps).to.equal(3);
            done();
        })
            .catch(done);
        setTimeout(() => expect(startedOps).to.equal(3), 50);
    });
    it('should not begin a task until a previous task has finished w/ promiseUnmapSerial', function (done) {
        let startedOps = 0;
        const postponedOps = [
            createPostponedFuture(100, () => { startedOps = startedOps + 1; }),
            createPostponedFuture(200, () => { startedOps = startedOps + 1; }),
            createPostponedFuture(300, () => { startedOps = startedOps + 1; }),
        ];
        _1.promiseUnmapSerial(postponedOps)
            .then(results => {
            expect(startedOps).to.equal(3);
            done();
        })
            .catch(done);
        expect(startedOps).to.equal(1);
    });
});
function createPostponedFuture(timeoutInMs, onStart = () => { }) {
    return function () {
        onStart();
        return new Promise((resolve, reject) => {
            setTimeout(resolve, timeoutInMs);
        });
    };
}
