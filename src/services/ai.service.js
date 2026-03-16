const OpenAI = require('openai');
const { generateText } = require('ai');

const openAIClient = new OpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY,
    baseURL: process.env.AI_GATEWAY_BASE_URL,
});

class AIService {
    async completions(messages, model, options) {
        const response = await openAIClient.chat.completions.create({
            model,
            messages: messages,
            ...options
        });
        if (options.stream) return response;

        return response.choices[0].message.content
    }

    async generateText(prompt, model, options) {
        const result = await generateText({ model, prompt, ...options });
        return result.text;
    }
}

module.exports = new AIService();