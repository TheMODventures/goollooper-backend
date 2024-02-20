"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
class BaseRoutes {
    constructor() { }
    initializeRoutes() {
        this.router = (0, express_1.Router)();
        this.routes();
    }
}
exports.default = BaseRoutes;
//# sourceMappingURL=base.route.js.map