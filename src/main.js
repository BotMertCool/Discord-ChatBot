import { Client, GatewayIntentBits, DefaultWebSocketManagerOptions } from "discord.js";
import { OpenAI } from "openai";
import { eventHandler } from "./handlers/eventHandler.js";
import { getBlockedWords } from "./util/getBlockedWords.js";
import config from "../config.json" assert { type: "json" };

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Makes robot look like its on phone lol
DefaultWebSocketManagerOptions.identifyProperties.browser = "Discord iOS";

const openai = new OpenAI({ apiKey: config.openaiapi.apiKey });
const blockedWords = getBlockedWords(config.severityCategory);

eventHandler(client);

client.login(config.token);

export { config, openai, blockedWords };
