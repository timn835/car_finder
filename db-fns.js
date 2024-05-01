import dotenv from "dotenv";
import {
    DynamoDBClient,
    ScanCommand,
    BatchGetItemCommand,
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
    const input = {
        RequestItems: {
            [ITEMS_TABLE]: {
                Keys: items.map((item) => ({ id: { S: item.id } })),
            },
        },
    };
    const command = new BatchGetItemCommand(input);
    const response = await client.send(command);
    const existingIds = response.Responses[ITEMS_TABLE].map(
        (dbItem) => dbItem?.id?.S
    );
    return items.filter((item) => !existingIds.includes(item.id));
}

async function storeNewItems(items) {
    console.log("hello");
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
        client.destroy();
        return true;
    } catch (error) {
        console.log(error.message);
        client.destroy();
        return false;
    }
}

export { fetchSearches, getNewItems, storeNewItems };
