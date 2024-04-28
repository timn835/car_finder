import { scrapeCars } from "./scrape-fns.js";
import { getNewCars, storeNewCars } from "./db-fns.js";
import { sendEmail } from "./send-fns.js";

async function main() {
    // await sendEmail([]);
    // return;
    const baseUrl = "https://www.facebook.com/marketplace/montreal/search?";
    const searchParams = {
        minPrice: 2000,
        maxPrice: 10000,
        minMileage: 40000,
        maxMileage: 300000,
        minYear: 2010,
        maxYear: 2015,
        transmissionType: "automatic",
        make: "Toyota",
        model: "Corolla",
        mostRecent: true,
    };

    const url = `${baseUrl}minPrice=${searchParams.minPrice}&maxPrice=${
        searchParams.maxPrice
    }&maxMileage=${searchParams.maxMileage}&maxYear=${
        searchParams.maxYear
    }&minMileage=${searchParams.minMileage}&minYear=${
        searchParams.minYear
    }&transmissionType=${searchParams.transmissionType}${
        searchParams.mostRecent ? "&sortBy=creation_time_descend" : ""
    }&query=${searchParams.make}${searchParams.model}&exact=false`;
    console.log(url);

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
    let { data: newCars, isSuccess } = await getNewCars(cars);

    // Check new cars, may not be necessary
    // newCars = checkNewCars(searchParams, newCars);
    if (newCars.length === 0) {
        console.log("No new cars to add.");
        return;
    }

    // Add new cars to DB
    isSuccess = await storeNewCars(newCars);
    if (!isSuccess) {
        console.log("Something went wrong while storing new cars in DB.");
        return;
    }

    // Send message with new cars
    isSuccess = await sendEmail(newCars);
    if (!isSuccess) console.log("Unable to send email to the user.");

    console.log("Process complete!");
}

main();
