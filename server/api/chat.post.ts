import { readBody } from 'h3';
import { useLLM } from '../utils/llm';

export default defineEventHandler(async (event) => {
  const { explanation, students, topic } = await readBody(event);
  const llm = useLLM();

  try {
    const response = await llm.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are simulating a classroom of students learning '${topic}'.
          You will receive a Teacher's Explanation and a list of Student Personas (with current understanding and specific misconceptions).
          
          For EACH student, evaluate:
          1. Does the explanation address their specific misconception?
          2. Is the explanation clear to their persona?
          
          Update their Understanding Score (0-100).
          - If the misconception is directly debunked with logic they accept: +20-40 points.
          - If the explanation is vague: +0-5 points.
          - If the explanation is confusing: -5 points.
          
          Generate a SHORT (1-2 sentences) response for each student.
          - If score < 50: Ask a question revealing their misconception.
          - If score > 80: Express clarity and excitement.
          - Only 1 or 2 students should speak per turn to avoid noise (use 'shouldSpeak': true/false).
          
          Return JSON:
          {
            "students": [
              { "id": "...", "understanding": 55, "response": "But wait...", "shouldSpeak": true }
            ]
          }`
        },
        {
          role: "user",
          content: JSON.stringify({ explanation, students })
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");

  } catch (error) {
    console.error("Chat Error:", error);
    // Fallback logic
    return {
      students: students.map((s: any) => ({
        id: s.id,
        understanding: Math.min(s.understanding + 10, 100),
        response: "I think I get it...",
        shouldSpeak: Math.random() > 0.5
      }))
    };
  }
});
