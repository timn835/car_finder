import * as cheerio from "cheerio";
import axios from "axios";
import { extractKey, getCarFromListing } from "./utils.js";

async function scrapeCars(url, headers) {
    let response;
    try {
        response = await axios.get(url, { headers });
        if (!response || !response.data)
            return { errorMessage: "Axios request is empty" };
    } catch (error) {
        return { errorMessage: "Unable to complete axios request" };
    }
    const html = response.data;
    const $ = cheerio.load(html);
    let listingsData;
    for (let el of $("script[type='application/json'][data-sjs]")) {
        if ($(el).text().includes("marketplace_search")) {
            listingsData = extractKey("edges", JSON.parse($(el).text()));
            break;
        }
    }
    if (!listingsData)
        return { errorMessage: "No data listings were returned" };

    const cars = listingsData.map((element) => {
        return getCarFromListing(element.node.listing);
    });
    return { data: cars };
}

export { scrapeCars };
