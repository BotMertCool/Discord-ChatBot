import {
    Client,
    GatewayIntentBits,
    DefaultWebSocketManagerOptions,
    Message,
    PermissionsBitField,
} from "discord.js";
import { OpenAI } from "openai";
import config from "../config/config.json";
import ignore from "../config/ignore.json";
import funnymessages from "../config/funnymessages.json";
import { openAIRespond } from "./chatbot/openAIRespond";

const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// @ts-ignore: Ignore readonly error
DefaultWebSocketManagerOptions.identifyProperties.browser = "Discord iOS";

const openai: OpenAI = new OpenAI({ apiKey: config.openaiapi.apiKey });

function getRandomFunnyMessage(): string {
    const randomIndex = Math.floor(Math.random() * funnymessages.length);
    return funnymessages[randomIndex];
}

let count: number = 0;
let onMention: boolean = false;
let mentioning: boolean = false;
let replyCount: number = 33;

function mentionCommand(message: Message) {
    if (!message.member) return;
    const isBotMert: boolean = message.author.id === "348595558468026369";
    const isAdmin: boolean = message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
    );
    if (!isBotMert && !isAdmin) return;

    onMention = !onMention;

    const penis = (): string => {
        if (onMention) return "Now sends message every mention.";
        return `Now sends message every ${replyCount} messages.`;
    };

    message.reply({
        content: penis(),
    });
}

function replyCountCommand(message: Message, newReplyCount: number) {
    if (!message.member) return;
    const isBotMert: boolean = message.author.id === "348595558468026369";
    const isAdmin: boolean = message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
    );
    if (!isBotMert && !isAdmin) return;

    replyCount = newReplyCount;

    message.reply({
        content: `Now sending messages every ${replyCount} messages`,
    });
}

client.on("messageCreate", async (message: Message) => {
    if (message.author.id === "1239278693663379497") {
        return;
    }

    if (message.content.trim() === `<@${client.user!.id}> onmentions`) {
        mentionCommand(message);
        return;
    }

    if (message.content.trim() === `<@${client.user!.id}> mentioning`) {
        mentioning = !mentioning;
        message.reply({
            content: `Mentioning set to: ${mentioning}`,
        });
        return;
    }

    if (message.content.startsWith(`<@${client.user!.id}> replycount `)) {
        replyCountCommand(message, parseInt(message.content.split(" ")[2]));
        return;
    }

    if (!config.allowedChannelIds.includes(message.channel.id)) return;
    if (onMention && !message.mentions.has(client.user!)) {
        return;
    }

    if (!onMention) {
        count++;
        console.log(count);
        if (count < replyCount) return;
        count = 0;
    }

    for (const word of ignore) {
        if (message.content.includes(word)) {
            message.content = getRandomFunnyMessage();
            break;
        }
    }

    await openAIRespond(client, message, mentioning);
});

client.on("ready", async () => {
    console.log(`Logged in as ${client.user!.tag}`);
});

client.login(config.token);

export { config, openai, getRandomFunnyMessage };
