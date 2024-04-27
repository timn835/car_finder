import dotenv from "dotenv";
import {
    DynamoDBClient,
    GetItemCommand,
    BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";

dotenv.config();
const client = new DynamoDBClient({
    region: "us-east-1",
    credentials: fromEnv(),
});

async function getNewCars(cars) {
    const newCars = [];
    let params;
    let command;
    for (let car of cars) {
        params = {
            TableName: "egor_fb_cars",
            Key: {
                id: { S: car.id },
            },
        };
        command = new GetItemCommand(params);
        try {
            const { Item } = await client.send(command);
            if (!Item) newCars.push(car);
        } catch (error) {
            console.error(error);
        }
    }
    return newCars;
}

async function storeNewCars(cars) {
    let isSuccess = true;
    if (cars.length === 0) {
        return { isSuccess };
    }
    const dynamoItems = cars.map((car) =>
        Object.fromEntries(
            Object.entries(car).map(([key, value]) => [
                key,
                typeof value === "number" ? { N: `${value}` } : { S: value },
            ])
        )
    );
    console.log(`Storing ${dynamoItems.length} new cars.`);
    const params = {
        RequestItems: {
            egor_fb_cars: dynamoItems.map((item) => ({
                PutRequest: {
                    Keys: {
                        id: item.id,
                    },
                    Item: item,
                },
            })),
        },
    };
    try {
        const command = new BatchWriteItemCommand(params);
        await client.send(command);
    } catch (error) {
        console.log(error.message);
        isSuccess = false;
    } finally {
        client.destroy(); // destroys DynamoDBClient
        return { isSuccess };
    }
}

export { getNewCars, storeNewCars };
