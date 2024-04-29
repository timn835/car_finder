import { scrapeCars } from "./scrape-fns.js";
import { getNewCars, storeNewCars } from "./db-fns.js";
import { sendEmail } from "./send-fns.js";
import { checkNewCars } from "./utils.js";

async function handler() {
    const baseUrl = "https://www.facebook.com/marketplace/montreal/search?";
    const searchParams = {
        minPrice: 2000,
        maxPrice: 15000,
        minMileage: 40000,
        maxMileage: 200000,
        minYear: 2012,
        maxYear: 2012,
        transmissionType: "automatic",
        make: "Audi",
        model: "a5",
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
    }&query=${searchParams.make}%20${searchParams.model}&exact=false`;
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
        return { isSuccess: false, message: errorMessage };
    }
    // Get new cars
    let { data: newCars, isSuccess } = await getNewCars(cars);
    if (!isSuccess)
        return { isSuccess: false, message: "Could not get new cars" };

    // Check new cars
    newCars = checkNewCars(searchParams, newCars);
    if (newCars.length === 0) {
        return { isSuccess: true, message: "No new cars to add." };
    }

    // Add new cars to DB
    isSuccess = await storeNewCars(newCars);
    if (!isSuccess) {
        return {
            isSuccess: false,
            message: "Something went wrong while storing new cars in DB.",
        };
    }

    // Send message with new cars
    isSuccess = await sendEmail(newCars);
    if (!isSuccess)
        return {
            isSuccess: false,
            message: "Unable to send email to the user.",
        };

    return { isSuccess: true, message: "Process completed successfully!" };
}

const { message } = await handler();
console.log(message);
