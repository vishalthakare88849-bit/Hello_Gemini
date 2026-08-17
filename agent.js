require("dotenv").config();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { tool } = require("@langchain/core/tools");
const { HumanMessage, ToolMessage } = require("@langchain/core/messages");
const { getJson } = require("serpapi");

require("dotenv").config();


// 1. Gemini Model
const model = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7
});


// 2. SerpAPI Tool
const searchTool = tool(
    async ({ query }) => {

        const result = await getJson({
            engine: "google",
            q: query,
            api_key: process.env.SERPAPI_API_KEY
        });

        return JSON.stringify(result.organic_results?.slice(0, 3));
    },
    {
        name: "google_search",
        description: "Search Google for current information",
        schema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Search query"
                }
            },
            required: ["query"]
        }
    }
);


// 3. Give the tool to Gemini
const agent = model.bindTools([searchTool]);


// 4. Prompt
const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant.

Answer the following question:

Question: {question}

If you need current information, use the Google search tool.
`);


// 5. Agent Function
async function main() {

    try {

        const formattedPrompt = await prompt.format({
            question: "What is the latest version of Node.js?"
        });

        const messages = [
            new HumanMessage(formattedPrompt)
        ];


        // Ask Gemini
        const response = await agent.invoke(messages);

        messages.push(response);


        // Check if Gemini wants to use SerpAPI
        if (response.tool_calls?.length > 0) {

            for (const call of response.tool_calls) {

                console.log("Using Google Search...");

                const result = await searchTool.invoke(call.args);

                messages.push(
                    new ToolMessage({
                        content: result,
                        tool_call_id: call.id
                    })
                );
            }


            // Give search result back to Gemini
            const finalResponse = await agent.invoke(messages);

            console.log("\nAnswer:\n");
            console.log(finalResponse.content);

        } else {

            // Gemini answered directly
            console.log("\nAnswer:\n");
            console.log(response.content);
        }

    } catch (error) {

        console.error("Error:", error);

    }
}

main();