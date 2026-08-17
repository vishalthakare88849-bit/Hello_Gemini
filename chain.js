const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
// const { StringOutputParser } = require("@langchain/core/output_parser")
const { PromptTemplate } = require("@langchain/core/prompts");
require("dotenv").config();

const model = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7
});

const prompt = PromptTemplate.fromTemplate(`
You are a helpful programming mentor.

Explain the following topic:

Topic: {topic}

Give:
1. Definition
2. Simple explanation
3. Example
4. Interview question
`);

// const outputParser = new StringOutputParser();

const chain = prompt.pipe(model);

async function main() {
    try {
        const response = await chain.invoke({
            topic: "Linked List"
        });

        console.log(response.content);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();