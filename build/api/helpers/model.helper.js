"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelHelper = void 0;
class ModelHelperC {
    constructor() {
        this.populateData = (path, select, model, populate) => {
            return {
                path,
                model,
                select,
                populate,
            };
        };
        this.userSelect = "username firstName lastName email phone profileImage ratingCount averageRating";
        this.subscriptionSelect = "name";
        this.taskSelect = "title description";
    }
}
exports.ModelHelper = new ModelHelperC();
//# sourceMappingURL=model.helper.js.map