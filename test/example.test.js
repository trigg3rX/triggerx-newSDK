"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../src/utils/errors");
describe('wrapError', () => {
    it('should wrap a standard error', () => {
        const err = new Error('fail');
        const wrapped = (0, errors_1.wrapError)(err);
        expect(wrapped).toBeInstanceOf(Error);
        expect(wrapped.message).toBe('fail');
    });
});
