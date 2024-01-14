const express = require("express");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const OpenAIAPI = require("openai");
require("dotenv").config();

const app = express();
const port = 3000;

const { MONGODB_ATLAS_URI, OPENAI_API_KEY } = process.env;

// MongoDB Atlas setup
const mongoUri = MONGODB_ATLAS_URI;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB Atlas");
});

// OpenAI GPT-3 setup
const openai = new OpenAIAPI({ apiKey: OPENAI_API_KEY });

// Define a schema for MongoDB
const responseSchema = new mongoose.Schema({
  template: String,
  prompt: String,
  response: String,
});

// Create a model based on the schema
const Response = mongoose.model("Response", responseSchema);

// Express route to handle requests
app.get("/test", async (req, res) => {
  const templateName = req.query.template || "default_template";
  const prompt = req.query.prompt || "default_prompt";

  console.log(prompt);

  // Generate response from chat-GPT
  const response = await generateChatGptResponse({
    messages: [{ content: prompt }],
    model: "gpt-3.5-turbo-1106",
    response_format: { type: "json_object" },
  });

  // Save response to MongoDB
  saveResponseToDatabase(templateName, prompt, response);

  // Render the page with the template and new content
  res.sendFile(`${__dirname}/templates/${templateName}.html`);
});

// Function to generate response from chat-GPT
async function generateChatGptResponse(prompt) {
  try {
    const response = await openai.chat.completions.create(prompt);
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating response from chat-GPT:", error.message);
    return "Error generating response";
  }
}

// Function to save response to MongoDB
async function saveResponseToDatabase(template, prompt, response) {
  const newResponse = new Response({ template, prompt, response });
  // newResponse.save((err) => {
  //   if (err) console.error("Error saving response to MongoDB:", err.message);
  // });
  await newResponse.save();
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
