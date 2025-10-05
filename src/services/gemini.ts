import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

const createResponseSchema = (count: number) => ({
  type: Type.OBJECT,
  properties: {
    subtasks: {
      type: Type.ARRAY,
      description: "A list of actionable subtasks.",
      items: {
        type: Type.STRING,
        description: "A single, actionable subtask."
      },
      maxItems: count,
    }
  },
  required: ["subtasks"]
});

export const breakDownTask = async (
  taskText: string, 
  subtaskCount: number = 5
): Promise<string[]> => {
  try {
    const count = Math.min(Math.max(subtaskCount, 1), 10);
    
    const prompt = `Break down the following complex task into exactly ${count} smaller, actionable subtasks. Ensure the subtasks are clear, concise, and logically ordered. Task: "${taskText}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: createResponseSchema(count),
        temperature: 0.7,
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      throw new Error("Empty response from Gemini API");
    }
    const parsedResponse = JSON.parse(jsonText);
    
    if (parsedResponse && Array.isArray(parsedResponse.subtasks)) {
      return parsedResponse.subtasks.slice(0, count);
    } else {
      console.error("Unexpected JSON structure:", parsedResponse);
      return [];
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get subtasks from AI. Make sure GEMINI_API_KEY is set.");
  }
};
