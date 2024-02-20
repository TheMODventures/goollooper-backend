"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarRepository = void 0;
const calendar_model_1 = require("../../../database/models/calendar.model");
const base_repository_1 = require("../base.repository");
class CalendarRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(calendar_model_1.Calendar);
    }
}
exports.CalendarRepository = CalendarRepository;
//# sourceMappingURL=calendar.repository.js.map