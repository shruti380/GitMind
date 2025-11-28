"use server";

import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbedding } from "~/lib/gemini";
import { db } from "~/server/db";

export async function askQuestion(question: string, projectId: string) {
  const queryVector = await generateEmbedding(question);
  const vectorQuery = `[${queryVector.join(",")}]`;

  const result = (await db.$queryRaw`
    SELECT "fileName","sourceCode","summary",
    1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
    FROM "SourceCodeEmbedding"
    WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.5
    AND "projectId"=${projectId}
    ORDER BY similarity DESC
    LIMIT 10
    `) as { fileName: string; sourceCode: string; summary: string }[];

  let context = "";

  for (const doc of result) {
    context += `source: ${doc.fileName}\ncode content: ${doc.sourceCode}\nsummary of file: ${doc.summary}\n\n`;
  }

  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await streamText({
      model: google("gemini-2.5-flash"),
      prompt: `You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern with a basic understanding of programming and software development.

The AI assistant is a brand new, powerful, human-like artificial intelligence.
The traits of the AI include expert knowledge, helpfulness, cleverness, and articulateness.
The AI is a well-behaved and well-mannered individual.
The AI is always friendly, kind, and inspiring, and it is eager to provide vivid and thoughtful responses to the user.
The AI has the sum of all knowledge in its brain and is able to accurately answer nearly any question about any topic in the codebase.

If the question is about code or a specific file, the AI will provide a detailed answer, giving step-by-step instructions and explanations as needed.

CONTEXT BLOCK:
${context}
END OF CONTEXT BLOCK

QUESTION:
${question}
END OF QUESTION

INSTRUCTIONS:
- Take into account the CONTEXT BLOCK provided above
- If the context does not provide the answer to the question, say "I'm sorry, but I don't know the answer based on the provided context."
- Do not apologize for previous responses but indicate when new information has been gained
- Do not invent anything that is not directly drawn from the context or facts provided
- Answer in markdown syntax with code snippets if needed
- Be as detailed as possible, providing clear explanations, logical steps, and practical examples

Provide your answer now:`,
    });

    return {
      output: response.textStream,
      filesReferences: result,
    };
  } catch (error) {
    console.error("Error in askQuestion:", error);
    throw new Error("Failed to generate response");
  }
}
