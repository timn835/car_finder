import dotenv from "dotenv";
import {
    DynamoDBClient,
    ScanCommand,
    BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import { ITEMS_TABLE, SEARCHES_TABLE } from "./constants.js";

dotenv.config();
const client = new DynamoDBClient({
    region: "us-east-1",
    credentials: fromEnv(),
});

async function fetchSearches() {
    const command = new ScanCommand({ TableName: SEARCHES_TABLE });
    try {
        const response = await client.send(command);
        return response.Items.map((item) =>
            Object.fromEntries(
                Object.entries(item).map(([key, value]) => [
                    key,
                    `${Object.values(value)[0]}`,
                ])
            )
        );
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

async function getNewItems(items) {
    const command = new ScanCommand({
        TableName: ITEMS_TABLE,
        AttributesToGet: ["id"],
    });
    try {
        const response = await client.send(command);
        // TODO: implement binary search here for optimization
        const existingIds = response.Items.map((item) => item.id.S);
        return items.filter((item) => !existingIds.includes(item.id));
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

async function storeNewItems(items) {
    if (items.length === 0) return true;
    const dynamoItems = items.map((item) =>
        Object.fromEntries(
            Object.entries(item).map(([key, value]) => [
                key,
                typeof value === "number"
                    ? { N: `${value}` }
                    : typeof value === "string"
                    ? { S: value }
                    : Array.isArray(value)
                    ? { L: value.map((attr) => ({ S: attr })) }
                    : undefined,
            ])
        )
    );
    const params = {
        RequestItems: {
            [ITEMS_TABLE]: dynamoItems.map((dynamoItem) => ({
                PutRequest: {
                    Keys: {
                        id: dynamoItem.id,
                    },
                    Item: dynamoItem,
                },
            })),
        },
    };
    try {
        const command = new BatchWriteItemCommand(params);
        await client.send(command);
        return true;
    } catch (error) {
        // console.log(error.message);
        return false;
    }
}

export { fetchSearches, getNewItems, storeNewItems };
