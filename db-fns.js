import dotenv from "dotenv";
import {
    DynamoDBClient,
    BatchGetItemCommand,
    BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";

dotenv.config();
const client = new DynamoDBClient({
    region: "us-east-1",
    credentials: fromEnv(),
});

async function getNewCars(cars) {
    let command;
    const input = {
        RequestItems: {
            egor_fb_cars: {
                Keys: cars.map((car) => ({ id: { S: car.id } })),
            },
        },
    };
    try {
        command = new BatchGetItemCommand(input);
        const response = await client.send(command);
        const existingIds = response.Responses.egor_fb_cars.map(
            (dbCar) => dbCar?.id?.S
        );
        return {
            data: cars.filter((car) => !existingIds.includes(car.id)),
            isSuccess: true,
        };
    } catch (error) {
        console.error(error);
        return { data: undefined, isSuccess: false };
    }
}

async function storeNewCars(cars) {
    if (cars.length === 0) {
        return true;
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
        client.destroy();
        return true;
    } catch (error) {
        console.log(error.message);
        client.destroy();
        return false;
    }
}

export { getNewCars, storeNewCars };
