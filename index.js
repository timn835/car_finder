import { scrapeItems } from "./scrape-fns.js";
import { fetchSearches, getNewItems, storeNewItems } from "./db-fns.js";
import { sendEmail } from "./send-fns.js";
import { checkNewItems } from "./utils.js";
import { HEADERS } from "./constants.js";

async function scrape({ url, query, exact }) {
    const items = await scrapeItems(url, HEADERS);
    if (exact) return checkNewItems(query, items);
    return items;
}

async function handler() {
    let isSuccess;
    const searches = await fetchSearches();
    if (searches === undefined)
        return { isSuccess: false, message: "Could not fetch searches" };
    const searchesInfo = searches.map((search) => {
        let baseUrl = `https://www.facebook.com/marketplace/${
            search?.city
        }/search?query=${search?.query?.split(" ").join("%20")}`;
        for (let [criteria, criteriaValue] of Object.entries(search)) {
            if (
                criteria === "city" ||
                criteria === "query" ||
                criteria === "exact"
            )
                continue;
            baseUrl += `&${criteria}=${criteriaValue}`;
        }
        baseUrl += "&sortBy=creation_time_descend";
        return {
            url: baseUrl,
            query: search?.query,
            exact: search?.exact ? true : false,
        };
    });

    // Scrape items
    const scrapePromises = searchesInfo.map((searchInfo) => scrape(searchInfo));
    const scrapedSearchResults = await Promise.allSettled(scrapePromises);
    const items = [];
    for (let searchResult of scrapedSearchResults) {
        if (searchResult.status !== "fulfilled") continue;
        items.push(...searchResult.value);
    }

    // Get new items
    if (items.length === 0)
        return { isSuccess: false, message: "No scraped results" };
    let newItems = await getNewItems(items);
    if (newItems.length === 0)
        return { isSuccess: true, message: "No new items to add" };

    // Add new cars to DB
    isSuccess = await storeNewItems(newItems);
    if (!isSuccess)
        return { isSuccess: false, message: "Unable to store new items" };

    // Send message with new cars
    isSuccess = await sendEmail(newItems);
    if (!isSuccess)
        return { isSuccess: false, message: "Unable to send email" };

    return {
        isSuccess: true,
        message: `${newItems.length} item${
            newItems.length ? "s" : ""
        } successfully added`,
    };
}

const res = await handler();

console.log(res);
