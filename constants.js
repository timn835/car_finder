const HEADERS = {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "sec-ch-ua":
        '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "sec-ch-ua-full-version-list":
        '"Chromium";v="124.0.6367.61", "Google Chrome";v="124.0.6367.61", "Not-A.Brand";v="99.0.0.0"',
    "sec-ch-ua-platform-version": '"6.0"',
    "sec-fetch-site": "same-origin",
    "user-agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
};

const SEARCHES_TABLE = "egor_searches";
const ITEMS_TABLE = "egor_fb_items";

export { HEADERS, SEARCHES_TABLE, ITEMS_TABLE };
