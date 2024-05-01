import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { fromEnv } from "@aws-sdk/credential-providers";

const client = new SESClient({
    region: "us-east-1",
    credentials: fromEnv(),
});

async function sendEmail(items) {
    const input = {
        Destinations: ["timour.nesterov@gmail.com"], // Set the destination email address
        FromArn: "",
        RawMessage: {
            Data: `From: timour.nesterov@gmail.com\nTo: timour.nesterov@gmail.com\nSubject: We have found ${
                items.length
            } relevant listing${
                items.length > 1 ? "s" : ""
            }.\nMIME-Version: 1.0\nContent-type: text/plain\n\n
            ${items
                .map(
                    (item) => `Title: ${item.title}
            Price: ${item.priceFormatted}
            Location: ${item.locationDisplay}
            Subtitles: ${item.subtitles?.join(", ")}
            Seller: ${item.seller}
            Link: ${item.url}
            ==========================================
            `
                )
                .join("")}`,
        },
        ReturnPathArn: "",
        Source: "timour.nesterov@gmail.com", // Set the source email address
        SourceArn: "",
    };
    try {
        const command = new SendRawEmailCommand(input);
        await client.send(command);
        client.destroy();
        return true;
    } catch (error) {
        console.error(error.message);
        return false;
    }
}

export { sendEmail };
