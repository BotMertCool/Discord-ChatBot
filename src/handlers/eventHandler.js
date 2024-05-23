import { getAllFiles } from "../util/getAllFiles.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const eventHandler = (client) => {
    const eventFolders = getAllFiles(
        path.join(__dirname, "..", "events"),
        true
    );

    for (const eventFolder of eventFolders) {
        const eventFiles = getAllFiles(eventFolder);

        const eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

        client.on(eventName, async (arg) => {
            for (const eventFile of eventFiles) {
                const { default: eventFunction } = await import(
                    `file://${eventFile}`
                );
                await eventFunction(client, arg);
            }
        });
    }
};

export { eventHandler };
