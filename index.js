import * as cheerio from "cheerio";
import axios from "axios";
import dotenv from "dotenv";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";

const TABLE_NAME = "fb_cars";

dotenv.config();

const db = new DynamoDBClient({
    region: "us-east-1",
    credentials: fromEnv(),
});

function extractKey(key, data) {
    // we assume data is either null, a string, an array or an object
    if (!data || typeof data === "string") return null;
    if (Array.isArray(data)) {
        for (let value of data) {
            let res = extractKey(key, value);
            if (res) return res;
        }
    } else {
        for (let [currKey, value] of Object.entries(data)) {
            if (currKey === key) return value;
            let res = extractKey(key, value);
            if (res) return res;
        }
    }
    return null;
}

async function getCars(url, headers) {
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
        const listing = element.node.listing;
        let priceUSD = parseInt(
            listing?.listing_price?.amount_with_offset_in_currency
        );
        if (!isNaN(priceUSD)) priceUSD = `${priceUSD / 100}`;
        else priceUSD = undefined;
        return {
            id: listing?.id,
            created_at: `${Date.now()}`,
            title: listing?.custom_title,
            url: listing?.id
                ? `https://www.facebook.com/marketplace/item/${listing.id}`
                : undefined,
            pictureUrl: listing?.primary_listing_photo?.image?.uri,
            price: listing?.listing_price?.amount,
            priceUSD,
            priceFormatted: listing?.listing_price?.formatted_amount,
            locationDisplay:
                listing?.location?.reverse_geocode?.city_page?.display_name,
            city: listing?.location?.reverse_geocode?.city,
            state: listing?.location?.reverse_geocode?.state,
            subtitles: listing?.custom_sub_titles_with_rendering_flags?.map(
                (el) => el?.subtitle
            ),
            seller: listing?.marketplace_listing_seller?.name,
        };
    });

    return { data: cars };
}

async function getNewCars(cars) {
    const newCars = [];
    let params;
    let command;
    for (let car of cars) {
        params = {
            TableName: TABLE_NAME,
            Key: {
                id: { S: car.id },
                created_at: { S: car.created_at },
            },
        };
        command = new GetItemCommand(params);
        try {
            const { Item } = await db.send(command);
            if (!Item) newCars.push(car);
        } catch (error) {
            console.error(error);
        }
    }
    return newCars;
}

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
    const { data: cars, errorMessage } = await getCars(url, headers);
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
    console.log(newCars);

    // fs.writeFileSync("./test.html", result);
}

main();
