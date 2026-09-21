export async function summarizeChatMessages(messages: { sender_name: string; content: string }[]): Promise<string[]> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.');
  }

  if (messages.length === 0) return ['No messages to summarize.'];

  // Format messages into a conversation script
  const conversation = messages.map(m => `${m.sender_name || 'Member'}: ${m.content}`).join('\n');
  
  const prompt = `
You are an AI assistant helping a user catch up on their Islamic study circle group chat.
Read the following recent messages and provide a concise, 3-bullet point summary of what was discussed, any decisions made, or important links shared. 
Keep the tone helpful and respectful. Return ONLY the 3 bullet points, each starting with a dash (-).

Conversation:
${conversation}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Failed to fetch summary');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Split into bullets and clean up
    const bullets = text.split('\n')
      .map((line: string) => line.replace(/^-/, '').trim())
      .filter((line: string) => line.length > 0);
      
    return bullets.slice(0, 3);
  } catch (err: any) {
    throw err;
  }
}
