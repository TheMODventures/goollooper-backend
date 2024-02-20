"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleMapHelper = exports.GoogleMapApiHelper = void 0;
const axios_1 = __importDefault(require("axios"));
const environment_config_1 = require("../../config/environment.config");
class GoogleMapApiHelper {
    async searchLocation(postalCode, countryCode) {
        const address = `${postalCode},${countryCode}`;
        try {
            const response = await axios_1.default.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${environment_config_1.GOOGLE_MAP_KEY}`);
            const results = response.data.results;
            if (results.length > 0) {
                const firstResult = results[0];
                return [
                    firstResult.geometry.location.lng,
                    firstResult.geometry.location.lat,
                ];
            }
            else {
                return null; // No results found
            }
        }
        catch (error) {
            console.error("Error fetching location:", error);
            return null;
        }
    }
}
exports.GoogleMapApiHelper = GoogleMapApiHelper;
exports.GoogleMapHelper = new GoogleMapApiHelper();
//# sourceMappingURL=googleMapApi.helper.js.map