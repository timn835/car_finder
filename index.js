import readline from "readline";
import { scrape } from "./scrape-fns.js";
import { fetchSearches, getNewItems, storeNewItems } from "./db-fns.js";
import { sendEmail } from "./send-fns.js";
import {
	isCityValid,
	isExactValid,
	isFrequencyValid,
	isMaxPriceValid,
	isMinPriceValid,
	isQueryValid,
} from "./utils.js";

// Wait function
async function wait(time) {
	await new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
}

// Function to prompt user for input
function promptUser(question) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}

async function handler() {
	// Prompt user for each piece of information
	let city, query, exact, frequency, minPrice, maxPrice;
	while (!isCityValid(city)) city = await promptUser("Enter your city: ");
	while (!isQueryValid(query)) query = await promptUser("Enter your query: ");
	while (!isExactValid(exact)) exact = await promptUser("Exact match (y/n): ");
	while (!isFrequencyValid(frequency))
		frequency = await promptUser(
			"Frequency of search in minutes (enter an integer): "
		);
	while (!isMinPriceValid(minPrice))
		minPrice = await promptUser("Enter the minimum price: ");
	while (!isMaxPriceValid(minPrice, maxPrice))
		maxPrice = await promptUser("Enter the maximum price: ");

	const searches = [
		{
			city,
			exact: exact.slice(0, 1).toLowerCase() === "y" ? true : false,
			query,
			frequency: parseInt(frequency) * 60000,
			minPrice: parseFloat(minPrice),
			maxPrice: parseFloat(maxPrice),
		},
	];

	let isSuccess;
	// const searches = await fetchSearches();
	if (searches === undefined)
		return { isSuccess: false, message: "Could not fetch searches" };
	const searchesInfo = searches.map((search) => {
		let baseUrl = `https://www.facebook.com/marketplace/${search?.city
			?.split(" ")
			.join("%20")}/search?query=${search?.query?.split(" ").join("%20")}`;
		for (let [criteria, criteriaValue] of Object.entries(search)) {
			if (criteria === "city" || criteria === "query" || criteria === "exact")
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

	// Run the below indefinitely

	while (true) {
		// Scrape items
		const scrapePromises = searchesInfo.map((searchInfo) => scrape(searchInfo));
		const scrapedSearchResults = await Promise.allSettled(scrapePromises);
		const items = [];
		for (let searchResult of scrapedSearchResults) {
			if (searchResult.status !== "fulfilled") continue;
			items.push(...searchResult.value);
		}

		// Get new items
		if (items.length === 0) {
			console.log({ isSuccess: false, message: "No scraped results" });
			await wait(searches[0].frequency);
			continue;
		}
		// continue
		// return { isSuccess: false, message: "No scraped results" };
		let newItems = await getNewItems(items);
		if (newItems === undefined) {
			console.log({
				isSuccess: false,
				message: "Unable to determine new itmes",
			});
			await wait(searches[0].frequency);
			continue;
		}
		// continue
		// return { isSuccess: false, message: "Unable to determine new items" };
		if (newItems.length === 0) {
			console.log({ isSuccess: true, message: "No new items to add" });
			await wait(searches[0].frequency);
			continue;
		}
		// continue
		// return { isSuccess: true, message: "No new items to add" };

		// Add new cars to DB
		for (let i = 0; i < Math.ceil(newItems.length / 25); i++) {
			isSuccess = await storeNewItems(
				newItems.slice(25 * i, Math.min(newItems.length, 25 * (i + 1)))
			);
		}
		if (!isSuccess) {
			console.log({ isSuccess: false, message: "Unable to store new items" });
			await wait(searches[0].frequency);
			continue;
		}
		// return { isSuccess: false, message: "Unable to store new items" };

		// Send message with new cars
		isSuccess = await sendEmail(newItems);
		if (!isSuccess) {
			console.log({ isSuccess: false, message: "Unable to send email" });
			await wait(searches[0].frequency);
			continue;
		}
		// return { isSuccess: false, message: "Unable to send email" };

		// TODO: add clean up function to erase old items from db

		console.log({
			isSuccess: true,
			message: `${newItems.length} item${
				newItems.length ? "s" : ""
			} successfully added`,
		});

		await wait(searches[0].frequency);
	}

	// // Scrape items
	// const scrapePromises = searchesInfo.map((searchInfo) => scrape(searchInfo));
	// const scrapedSearchResults = await Promise.allSettled(scrapePromises);
	// const items = [];
	// for (let searchResult of scrapedSearchResults) {
	// 	if (searchResult.status !== "fulfilled") continue;
	// 	items.push(...searchResult.value);
	// }

	// // Get new items
	// if (items.length === 0)
	// 	return { isSuccess: false, message: "No scraped results" };
	// let newItems = await getNewItems(items);
	// if (newItems === undefined)
	// 	return { isSuccess: false, message: "Unable to determine new items" };
	// if (newItems.length === 0)
	// 	return { isSuccess: true, message: "No new items to add" };

	// // Add new cars to DB
	// for (let i = 0; i < Math.ceil(newItems.length / 25); i++) {
	// 	isSuccess = await storeNewItems(
	// 		newItems.slice(25 * i, Math.min(newItems.length, 25 * (i + 1)))
	// 	);
	// }
	// if (!isSuccess)
	// 	return { isSuccess: false, message: "Unable to store new items" };

	// // Send message with new cars
	// isSuccess = await sendEmail(newItems);
	// if (!isSuccess) return { isSuccess: false, message: "Unable to send email" };

	// // TODO: add clean up function to erase old items from db

	// return {
	// 	isSuccess: true,
	// 	message: `${newItems.length} item${
	// 		newItems.length ? "s" : ""
	// 	} successfully added`,
	// };
}

await handler();

console.log(res);
