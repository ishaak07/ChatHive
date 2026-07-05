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

module.exports = { getRoomMessages, getPrivateMessages };