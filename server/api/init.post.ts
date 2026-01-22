import { readMultipartFormData, readBody, getRequestHeader } from 'h3';
import { useLLM, MOCK_STUDENTS } from '../utils/llm';

export default defineEventHandler(async (event) => {
  let text = "";
  let fileName = "Upload";

  // Check for multipart form data (file upload)
  const contentType = getRequestHeader(event, 'content-type');

  if (contentType?.includes('multipart/form-data')) {
    const body = await readMultipartFormData(event);
    const filePart = body?.find(part => part.name === 'notes');

    if (filePart) {
      if (filePart.type === 'application/pdf') {
        try {
          const data = await pdfParse(filePart.data);
          text = data.text;
        } catch (e) {
          console.error("PDF Parse Error", e);
          text = "Error parsing PDF.";
        }
      } else {
        // Assume text/plain or markdown
        text = filePart.data.toString();
      }
      fileName = filePart.filename || fileName;
    }
  } else {
    // Fallback for simple JSON text input
    const body = await readBody(event);
    text = body.notes || "";
    fileName = body.fileName || fileName;
  }

  // If text is empty or too short, return mock data
  if (!text || text.length < 10) {
    return {
      topic: "Sample Topic: Introduction to Computing",
      students: MOCK_STUDENTS
    };
  }

  // 2. Generate Students via LLM
  const llm = useLLM();

  try {
    const response = await llm.chat.completions.create({
      model: "gpt-4o", // Or generic model
      messages: [
        {
          role: "system",
          content: `You are an expert educational simulator. 
          Analyze the provided notes and identify the core topic.
          Then, generate 5 distinct 'Student Personas'. 
          Each student must have:
          - A Name (Use realistic, diverse full names, e.g., 'Sarah Chen', 'Marcus Johnson', 'Elena Rodriguez'. Do NOT use puns or thematic nicknames.)
          - A Persona (learning style description - keep this internal, it won't be shown to the user but defines behavior)
          - An Emoji Avatar (related to the topic or their personality)
          - A SPECIFIC Misconception related to the notes. This misconception should be plausible but wrong.
          - An initial Understanding Score (0-30).
          
          Return ONLY valid JSON in this format:
          {
            "topic": "The Topic Title",
            "students": [
              { "id": "1", "name": "Name", "persona": "Description", "misconception": "Specific wrong belief", "understanding": 10, "avatar": "🤖" }
            ]
          }`
        },
        {
          role: "user",
          content: `Notes: ${text.substring(0, 3000)}` // Truncate to avoid limits
        }
      ],
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");
    return data;

  } catch (error) {
    console.error("LLM Error:", error);
    // Fallback to mock data
    return {
      topic: `Topic from ${fileName}`,
      students: MOCK_STUDENTS
    };
  }
});
