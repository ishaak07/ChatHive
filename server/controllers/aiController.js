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


const extractInfo = async (req, res) => {
  try {
    const { messages } = req.body; 

    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: 'No messages to analyze' });
    }

    const conversationText = messages
      .map((msg) => `${msg.sender}: ${msg.content}`)
      .join('\n');

    const prompt = `Analyze this conversation and extract important information into these categories: Meetings, Deadlines, Locations, Contacts, and Tasks.

Conversation:
${conversationText}

Respond ONLY in this exact JSON format (no extra text, no markdown formatting, just raw JSON):
{
  "meetings": ["item1", "item2"],
  "deadlines": ["item1"],
  "locations": ["item1"],
  "contacts": ["item1"],
  "tasks": ["item1", "item2"]
}

If a category has no items, use an empty array. Keep each item short (under 10 words).`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const extracted = JSON.parse(text);

    res.status(200).json({ extracted });
  } catch (error) {
    console.log('Extractor error:', error.message);
    res.status(500).json({ message: 'Error extracting information' });
  }
};

module.exports = { getSmartReplies, summarizeChat, extractInfo };

