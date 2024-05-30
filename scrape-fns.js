import * as cheerio from "cheerio";
import { extractKey, getItemFromListing } from "./utils.js";
import request from "request-promise";
import fs from "fs";
import { BD_PROXY_URL } from "./constants.js";

async function scrapeItems(url, headers) {
    const options = {
        url,
        headers,
        // proxy: BD_PROXY_URL, // bright data residential
        // proxy: "http://14a04506e72d0:f7f99d9106@161.77.220.172:12323", // ip royal residential
        // proxy: "http://14a6f5f47bd04:6accb58fa2@185.170.42.13:12323", // ip royal residential
        // rejectUnauthorized: false,
        transform: (body) => {
            fs.writeFileSync("./test.html", body);
            return cheerio.load(body);
        },
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
