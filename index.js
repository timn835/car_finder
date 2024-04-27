import { scrapeCars } from "./scrape-fns.js";
import { getNewCars } from "./db-fns.js";

async function main() {
    const baseUrl = "https://www.facebook.com/marketplace/montreal/search?";
    const minPrice = 2000;
    const maxPrice = 10000;
    const minMileage = 40000;
    const maxMileage = 300000;
    const minYear = 2010;
    const maxYear = 2015;
    const transmissionType = "automatic";
    const make = "Toyota";
    const model = "Corolla";
    // optional parameter &sortBy=creation_time_descend,
    // not used because it stops following the query
    const url = `${baseUrl}minPrice=${minPrice}&maxPrice=${maxPrice}&maxMileage=${maxMileage}&maxYear=${maxYear}&minMileage=${minMileage}&minYear=${minYear}&transmissionType=${transmissionType}&query=${make}${model}&exact=false`;

    const headers = {
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
    const { data: cars, errorMessage } = await scrapeCars(url, headers);
    if (errorMessage) {
        console.log(errorMessage);
        return;
    }

    // Get new cars
    let newCars;
    newCars = await getNewCars(cars);

    // Check new cars
    console.log(newCars);

    // Add new cars to DB

    // Send message regarding new cars

    // fs.writeFileSync("./test.html", result);
}

main();
