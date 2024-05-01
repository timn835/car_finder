import * as cheerio from "cheerio";
import { extractKey, getItemFromListing } from "./utils.js";
import request from "request-promise";

async function scrapeItems(url, headers) {
    const options = {
        url,
        headers,
        transform: (body) => cheerio.load(body),
    };
    const $ = await request(options);

    if (!$) throw new Error("Error executing scrapeCars function 1");
    let listingsData;
    for (let el of $("script[type='application/json'][data-sjs]")) {
        if ($(el).text().includes("marketplace_search")) {
            listingsData = extractKey("edges", JSON.parse($(el).text()));
            break;
        }
    }
    if (!listingsData) throw new Error("Error executing scrapeCars function 2");
    const items = listingsData.map((element) => {
        return getItemFromListing(element.node.listing);
    });
    return items;
}

export { scrapeItems };
