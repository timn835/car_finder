import * as cheerio from "cheerio";
import { extractKey, getCarFromListing } from "./utils.js";
import request from "request-promise";

async function scrapeCars(url, headers) {
    try {
        const options = {
            url,
            headers,
            transform: (body) => cheerio.load(body),
        };
        const $ = await request(options);
        if (!$) return { errorMessage: "Unable to complete request" };
        let listingsData;
        for (let el of $("script[type='application/json'][data-sjs]")) {
            if ($(el).text().includes("marketplace_search")) {
                listingsData = extractKey("edges", JSON.parse($(el).text()));
                break;
            }
        }
        if (!listingsData)
            return { errorMessage: "No data listings were returned", $ };
        const cars = listingsData.map((element) => {
            return getCarFromListing(element.node.listing);
        });
        return { data: cars };
    } catch (error) {
        return { errorMessage: `Unable to complete request: ${error.message}` };
    }
}

export { scrapeCars };
