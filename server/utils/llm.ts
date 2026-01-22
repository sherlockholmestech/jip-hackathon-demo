import OpenAI from 'openai';

export const useLLM = () => {
  const config = useRuntimeConfig();

  // Default to a standard configuration if env vars are missing
  // This helps prevents crashes if the user forgot the .env file
  const apiKey = config.openaiApiKey || 'mock-key';
  const baseURL = config.openaiBaseUrl || 'https://api.openai.com/v1';

  return new OpenAI({
    apiKey,
    baseURL,
  });
};

export const MOCK_STUDENTS = [
  {
    id: 's1',
    name: "Lawrence 'Larry' Page",
    persona: "Takes everything extremely literally and struggles with metaphors.",
    misconception: "Believes that because 'arrays' start at 0, the first item doesn't exist.",
    understanding: 10,
    avatar: "🤖"
  },
  {
    id: 's2',
    name: "Vera Wang",
    persona: "Needs to see things drawn out. Gets lost in abstract text.",
    misconception: "Thinks the 'cloud' is literally in the sky.",
    understanding: 20,
    avatar: "🎨"
  },
  {
    id: 's3',
    name: "Samuel Cohen",
    persona: "Doubts everything unless proven with logic.",
    misconception: "Believes open source code is insecure because anyone can read it.",
    understanding: 15,
    avatar: "🕵️"
  },
  {
    id: 's4',
    name: "Curious George",
    persona: "Asks endless 'why' questions to get to the root.",
    misconception: "Thinks internet latency is caused by wind resistance.",
    understanding: 5,
    avatar: "🐒"
  },
  {
    id: 's5',
    name: "Practical Patty",
    persona: "Only cares about how to use the concept in real life.",
    misconception: "Believes algorithms are only for mathematicians, not programmers.",
    understanding: 25,
    avatar: "🛠️"
  }
];
