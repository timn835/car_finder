import dotenv from "dotenv";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";

const TABLE_NAME = "fb_cars";
dotenv.config();
const db = new DynamoDBClient({
    region: "us-east-1",
    credentials: fromEnv(),
});

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

export { getNewCars };
