"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const calendar_service_1 = __importDefault(require("../../services/calendar.service"));
class CalendarController {
    constructor() {
        this.index = async (req, res) => {
            const { limit, page, date = "" } = req.query;
            const limitNow = limit ? limit : 10;
            const filter = {
                user: req.locals.auth?.userId,
                isDeleted: false,
            };
            if (date !== "")
                filter.date = date;
            // else filter.date = moment(new Date()).format("YYYY-MM-DD");
            const response = await this.calendarService.index(Number(page), Number(limitNow), filter);
            return res.status(response.code).json(response);
        };
        this.create = async (req, res) => {
            const payload = { ...req.body };
            const response = await this.calendarService.create(payload);
            return res.status(response.code).json(response);
        };
        this.show = async (req, res) => {
            const { id } = req.params;
            const response = await this.calendarService.show(id);
            return res.status(response.code).json(response);
        };
        this.update = async (req, res) => {
            const { id } = req.params;
            const dataset = { ...req.body };
            const response = await this.calendarService.update(id, dataset);
            return res.status(response.code).json(response);
        };
        this.delete = async (req, res) => {
            const { id } = req.params;
            const response = await this.calendarService.delete(id);
            return res.status(response.code).json(response);
        };
        this.calendarService = new calendar_service_1.default();
    }
}
exports.default = CalendarController;
//# sourceMappingURL=calendar.controller.js.map