const Message = require('../models/Message');

// GET ROOM MESSAGES
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username')
      .sort({ createdAt: 1 }); // purane pehle, naye baad mein

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET PRIVATE MESSAGES (between logged-in user and another user)
const getPrivateMessages = async (req, res) => {
  try {
    const { userId } = req.params; // doosra user jiske sath chat dekhni hai
    const myId = req.userId;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// DELETE MESSAGE (sirf sender delete kar sakta hai)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    message.content = 'This message was deleted';
    message.isDeleted = true;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getRoomMessages, getPrivateMessages, deleteMessage };
