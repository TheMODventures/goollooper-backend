import axios from "axios";
import { GOOGLE_MAP_KEY } from "../../config/environment.config";

export class GoogleMapApiHelper {
  async searchLocation(
    postalCode: string,
    countryCode: string
  ): Promise<any[] | null> {
    const address = `${postalCode},${countryCode}`;

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_MAP_KEY}`
      );
      const results = response.data.results;

      if (results.length > 0) {
        const firstResult = results[0];
        return [
          firstResult.geometry.location.lng,
          firstResult.geometry.location.lat,
        ];
      } else {
        return null; // No results found
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      return null;
    }
  }
}

export const GoogleMapHelper = new GoogleMapApiHelper();
