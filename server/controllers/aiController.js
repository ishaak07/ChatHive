const model = require('../utils/gemini');

const getSmartReplies = async (req, res) => {
  try {
    const { lastMessage } = req.body;

    if (!lastMessage) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const prompt = `Given this chat message: "${lastMessage}"

Generate exactly 3 short, casual reply suggestions (each under 8 words) that someone could send in response. Return ONLY the 3 replies, one per line, no numbering, no extra text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const suggestions = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);

    res.status(200).json({ suggestions });
  } catch (error) {
    console.log('Gemini error:', error.message);
    res.status(500).json({ message: 'Error generating smart replies' });
  }
};

// SUMMARIZE
const summarizeChat = async (req, res) => {
  try {
    const { messages } = req.body; // array of { sender, content }

    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: 'No messages to summarize' });
    }

    const conversationText = messages
      .map((msg) => `${msg.sender}: ${msg.content}`)
      .join('\n');

    const prompt = `Summarize the following conversation in 2-3 short sentences. Focus on key points and decisions made:

${conversationText}

Summary:`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    res.status(200).json({ summary });
  } catch (error) {
    console.log('Gemini error:', error.message);
    res.status(500).json({ message: 'Error generating summary' });
  }
};

module.exports = { getSmartReplies, summarizeChat};
