import { Client, Message } from "discord.js";
import { config, getRandomFunnyMessage, openai } from "../main";
import filter from "../../config/filter.json";
import ignore from "../../config/ignore.json";
import { AIMessage, Role } from "./openAIMessage";

async function openAIRespond(client: Client, message: Message) {
    function censorMessage(message: string): string {
        filter.forEach((str: string) => {
            const regex: RegExp = new RegExp(
                `\\b${str}\\b|${str}(?=[\\W]|$)`,
                "gi"
            );
            if (!message.match(regex)) return;

            message = message.replace(regex, (match: string): string => {
                if (match.length <= 1) {
                    return match;
                }

                let firstChar: string = match[0];
                let stars: string = "\\*".repeat(match.length - 1);

                return firstChar + stars;
            });
        });
        return message;
    }

    async function getOpenAIResponse(
        aiMessages: Array<AIMessage>
    ): Promise<string | null> {
        try {
            const test = [
                { role: "system", content: config.openaiapi.systemPrompt },
                ...aiMessages,
            ];

            console.log(test);
            const completions = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: config.openaiapi.systemPrompt },
                    ...aiMessages,
                ],
                model: config.openaiapi.modelId,
                frequency_penalty: config.openaiapi.frequencyPenalty,
                presence_penalty: config.openaiapi.presencePenalty,
                temperature: config.openaiapi.temperature,
                max_tokens: config.openaiapi.maxTokens,
            });

            return completions.choices[0].message.content;
        } catch (error) {
            console.error(`Error: ${error}`);
            return null;
        }
    }

    function getAIConversation(
        message: Message,
        role: Role = "user"
    ): AIMessage {
        let cleanMessage = message.content
            .replace(`<@${client.user!.id}>`, "")
            .trim();

        if (cleanMessage === "") cleanMessage = "hello";

        const aiMessage: AIMessage = {
            role: role,
            name: `${message.author.username.replace(/[^a-zA-Z0-9_-]/g, "")}`,
            content: `${cleanMessage}`,
        };

        return aiMessage;
    }

    async function traverseMessageChain(
        messages: Array<Message>
    ): Promise<Array<AIMessage>> {
        const last: Message = messages[messages.length - 1];

        for (const word of ignore) {
            if (message.content.includes(word)) {
                message.content = getRandomFunnyMessage();
                break;
            }
        }

        if (
            messages.length < config.maxMessageChainLength &&
            last &&
            last.reference &&
            last.reference.messageId
        ) {
            try {
                if (!last.reference.messageId) {
                    return traverseMessageChain(messages);
                }

                const msg = await last.channel.messages.fetch(
                    last.reference.messageId
                );

                if (!msg) return traverseMessageChain(messages);

                let newMessages = [...messages, msg];

                return traverseMessageChain(newMessages);
            } catch (error) {
                console.error(`Error: ${error}`);
            }

            return traverseMessageChain(messages);
        }

        let chain: Array<AIMessage> = [];

        messages.forEach((msg) => {
            const role: Role =
                msg.author.id === client.user!.id ? "assistant" : "user";
            chain.push(getAIConversation(msg, role));
        });

        return chain.reverse();
    }

    await message.channel.sendTyping();

    let messages: Array<AIMessage> = [getAIConversation(message)];

    const isReply = message.reference && message.reference.messageId;
    if (isReply) messages = await traverseMessageChain([message]);

    let openaiResponse: string | null = await getOpenAIResponse(messages);

    if (!openaiResponse) {
        openaiResponse = "Error! No response from open ai.";
    }

    let censoredMessage: string = censorMessage(openaiResponse);

    //console.log(messages);

    try {
        for (const word of ignore) {
            if (censoredMessage.includes(` ${word}`)) {
                console.log(censoredMessage);
                censoredMessage = "Mods ban this guy!";
                break;
            }
            if (censoredMessage.startsWith(`${word} `)) {
                console.log(censoredMessage);
                censoredMessage = "Mods ban this guy!";
                break;
            }
        }
        function truncateString(str: string, maxLength: number): string {
            return str.length > maxLength ? str.slice(0, maxLength) : str;
        }

        if (message.author.id === "809245562615758898") {
            censoredMessage = "<@809245562615758898> " + censoredMessage;
            message.reply({
                content: truncateString(censoredMessage, 1999),
            });
        } else {
            try {
                message.reply({
                    failIfNotExists: false,
                    content: truncateString(censoredMessage, 1999),
                    allowedMentions: { users: [] },
                });
            } catch (error) {
                console.log(`Error: ${error}`);
            }
        }
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

export { openAIRespond };
