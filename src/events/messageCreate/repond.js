import { config, openai, blockedWords } from "../../main.js";

export default async (client, message) => {
    if (message.author.bot) return;
    if (message.channelId !== config.allowedChannelId) return;
    if (!message.mentions.has(client.user)) return;

    const censorMessage = (msg) => {
        blockedWords.forEach((word) => {
            const regex = new RegExp(`\\b${word.word}\\b|${word.word}(?=[\\W]|$)`, "gi");
            if (!msg.match(regex)) return;

            msg = msg.replace(regex, (match) => {
                if (match.length <= 1) {
                    return match;
                }

                let firstChar = match[0];
                let stars = "\\*".repeat(match.length - 1);

                return firstChar + stars;
            });
        });
        return msg;
    };

    const getOpenAIResponse = async (messages) => {
        try {
            const completions = await openai.chat.completions.create({
                messages: [{ role: "system", content: config.openaiapi.systemPrompt }, ...messages],
                model: config.openaiapi.modelId,
                frequency_penalty: parseFloat(config.openaiapi.frequencyPenalty),
                presence_penalty: parseFloat(config.openaiapi.presencePenalty),
                temperature: parseFloat(config.openaiapi.temperature),
                max_tokens: parseInt(config.openaiapi.maxTokens),
            });

            return completions.choices[0].message.content;
        } catch (error) {
            return error.message;
        }
    };

    const getAIConversation = (msg, role = "user") => {
        let cleanMessage = msg.content
            .replace(`<@${client.user.id}>`, "")
            //.replace(/[^a-zA-Z0-9_-]/g, "")
            .trim();

        if (cleanMessage === "") cleanMessage = "hello";

        return {
            role: role,
            name: `${msg.author.username.replace(/[^a-zA-Z0-9_-]/g, "")}`,
            content: `${cleanMessage}`,
        };
    };

    const traverseMessageChain = async (messages) => {
        const last = messages[messages.length - 1];

        if (messages.length < config.maxMessageChainLength && last && last.reference) {
            const msg = await last.channel.messages.fetch(last.reference.messageId);

            let newMessages = [...messages, msg];

            return traverseMessageChain(newMessages);
        }

        let chain = [];

        messages.forEach((msg) => {
            const role = msg.author.id === client.user.id ? "assistant" : "user";
            chain.push(getAIConversation(msg, role));
        });

        chain = Array.from(new Set(chain.map(JSON.stringify))).map(JSON.parse);

        return chain.reverse();
    };

    await message.channel.sendTyping();

    let messages = [getAIConversation(message)];

    const isReply = message.reference && message.reference.messageId;
    if (isReply) messages = await traverseMessageChain([message]);

    if (!message) return;

    console.log(messages);
    const censoredMessage = censorMessage(await getOpenAIResponse(messages));
    try {
        message.reply({
            content: censoredMessage,
            allowedMentions: { users: [] },
        });
    } catch (error) {
        console.log(error.message);
    }
};
