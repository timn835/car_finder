import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { fromEnv } from "@aws-sdk/credential-providers";

const client = new SESClient({
    region: "us-east-1",
    credentials: fromEnv(),
});

async function sendEmail(cars) {
    const input = {
        Destinations: ["timour.nesterov@gmail.com"], // Set the destination email address
        FromArn: "",
        RawMessage: {
            Data: `From: timour.nesterov@gmail.com\nTo: timour.nesterov@gmail.com\nSubject: Test email (no attachment)\nMIME-Version: 1.0\nContent-type: text/plain\n\n
            We have found ${cars.length} relevant listing${
                cars.length > 1 ? "s" : ""
            }.
            ${cars
                .map(
                    (car) => `
            ==========================================
            Title: ${car.title}
            Price: ${car.priceFormatted}
            Location: ${car.locationDisplay}
            Mileage: ${car.mileage}
            Seller: ${car.seller}
            Link: ${car.url}
            ==========================================
            `
                )
                .join("")}
            `,
        },
        ReturnPathArn: "",
        Source: "timour.nesterov@gmail.com", // Set the source email address
        SourceArn: "",
    };
    try {
        const command = new SendRawEmailCommand(input);
        const response = await client.send(command);
        console.log("Email sent:", response);
        return true;
    } catch (err) {
        console.error("Error sending email:", err);
        return false;
    }
}

export { sendEmail };
