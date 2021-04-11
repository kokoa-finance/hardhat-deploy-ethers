"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const updatable_target_proxy_1 = require("../src/updatable-target-proxy");
describe("updatable target proxy", function () {
    it("should proxy properties", function () {
        const o = {
            a: 1,
            getA() {
                return this.a;
            },
            b: {},
            getB() {
                return this.b;
            },
        };
        const { proxy } = updatable_target_proxy_1.createUpdatableTargetProxy(o);
        chai_1.assert.equal(proxy.a, 1);
        chai_1.assert.equal(proxy.getA(), 1);
        chai_1.assert.equal(proxy.b, o.b);
        chai_1.assert.equal(proxy.getB(), o.b);
    });
    it("should let set a new target", function () {
        const o1 = {
            a: 1,
            getA() {
                return this.a;
            },
            b: {},
            getB() {
                return this.b;
            },
        };
        const o2 = {
            a: 2,
            getA() {
                return this.a;
            },
            b: {},
            getB() {
                return this.b;
            },
        };
        const { proxy, setTarget } = updatable_target_proxy_1.createUpdatableTargetProxy(o1);
        chai_1.assert.equal(proxy.a, 1);
        setTarget(o2);
        chai_1.assert.equal(proxy.a, 2);
        chai_1.assert.equal(proxy.getA(), 2);
        chai_1.assert.equal(proxy.b, o2.b);
        chai_1.assert.equal(proxy.getB(), o2.b);
    });
    it("shouldn't let you modify the proxied object", function () {
        const o = {
            a: 1,
        };
        const { proxy } = updatable_target_proxy_1.createUpdatableTargetProxy(o);
        chai_1.assert.throws(() => {
            proxy.a = 2;
        });
        chai_1.assert.throws(() => {
            delete proxy.a;
        });
        chai_1.assert.throws(() => {
            Object.defineProperty(proxy, "b", {});
        });
        chai_1.assert.throws(() => {
            Object.setPrototypeOf(proxy, {});
        });
    });
    it("should let you call methods that modify the object", function () {
        const o = {
            a: 1,
            inc() {
                this.a++;
            },
        };
        const { proxy } = updatable_target_proxy_1.createUpdatableTargetProxy(o);
        chai_1.assert.equal(proxy.a, 1);
        proxy.inc();
        chai_1.assert.equal(proxy.a, 2);
    });
    it("should trap getOwnPropertyDescriptor correctly", () => {
        const o = { a: 1 };
        const { proxy, setTarget } = updatable_target_proxy_1.createUpdatableTargetProxy(o);
        chai_1.assert.deepEqual(Object.getOwnPropertyDescriptor(proxy, "a"), {
            value: 1,
            writable: true,
            enumerable: true,
            configurable: true,
        });
        const o2 = { a: 2, b: 3 };
        setTarget(o2);
        chai_1.assert.deepEqual(Object.getOwnPropertyDescriptor(proxy, "a"), {
            value: 2,
            writable: true,
            enumerable: true,
            configurable: true,
        });
        chai_1.assert.deepEqual(Object.getOwnPropertyDescriptor(proxy, "b"), {
            value: 3,
            writable: true,
            enumerable: true,
            configurable: true,
        });
    });
    it("should trap getPrototypeOf correctly", () => {
        const proto = {};
        const o = Object.create(proto);
        const { proxy, setTarget } = updatable_target_proxy_1.createUpdatableTargetProxy(o);
        chai_1.assert.equal(Object.getPrototypeOf(proxy), proto);
        const proto2 = {};
        const o2 = Object.create(proto2);
        setTarget(o2);
        chai_1.assert.equal(Object.getPrototypeOf(proxy), proto2);
    });
    it("should trap has correctly", () => {
        const proto = { a: 1 };
        const o = Object.create(proto);
        o.b = 2;
        const { proxy, setTarget } = updatable_target_proxy_1.createUpdatableTargetProxy(o);
        chai_1.assert.isTrue("a" in proxy);
        chai_1.assert.isTrue("b" in proxy);
        chai_1.assert.isFalse("c" in proxy);
        const proto2 = { a: 2 };
        const o2 = Object.create(proto2);
        o2.b = 4;
        o2.c = 6;
        setTarget(o2);
        chai_1.assert.isTrue("a" in proxy);
        chai_1.assert.isTrue("b" in proxy);
        chai_1.assert.isTrue("c" in proxy);
        chai_1.assert.isFalse("d" in proxy);
    });
    it("should return isExtensible correctly", () => {
        const o = {};
        Object.preventExtensions(o);
        const { proxy, setTarget } = updatable_target_proxy_1.createUpdatableTargetProxy(o);
        chai_1.assert.isFalse(Object.isExtensible(proxy));
        // if the proxy is initially not extensible, then it can't be made
        // extensible afterwards
        setTarget({});
        chai_1.assert.isFalse(Object.isExtensible(proxy));
    });
    it("should trap ownKeys correctly", () => {
        const proto = { a: 1 };
        const o = Object.create(proto);
        o.b = 1;
        const { proxy, setTarget } = updatable_target_proxy_1.createUpdatableTargetProxy(o);
        chai_1.assert.deepEqual(Object.getOwnPropertyNames(proxy), ["b"]);
        const proto2 = { c: 1 };
        const o2 = Object.create(proto2);
        o2.d = 1;
        setTarget(o2);
        chai_1.assert.deepEqual(Object.getOwnPropertyNames(proxy), ["d"]);
    });
    it("should trap preventExtensions correctly", () => {
        const o = {};
        const { proxy } = updatable_target_proxy_1.createUpdatableTargetProxy(o);
        chai_1.assert.isTrue(Object.isExtensible(proxy));
        Object.preventExtensions(proxy);
        chai_1.assert.isFalse(Object.isExtensible(proxy));
    });
});
//# sourceMappingURL=updatable-target-proxy.js.map