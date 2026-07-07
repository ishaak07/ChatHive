const Room = require('../models/Room');
const Message = require('../models/Message');
// CREATE ROOM
const createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId; // middleware se aayega

    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room already exists' });
    }

    const newRoom = new Room({
      name,
      members: [userId],
      createdBy: userId,
    });

    await newRoom.save();

    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET ALL ROOMS
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().select('name members createdBy');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// JOIN ROOM
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Agar already member hai to dobara add mat karo
    if (!room.members.includes(userId)) {
      room.members.push(userId);
      await room.save();
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// LEAVE ROOM
const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Creator leave nahi kar sakta, use delete karna chahiye
    if (room.createdBy.toString() === userId) {
      return res.status(400).json({ message: 'Room creator cannot leave. Delete the room instead.' });
    }

    room.members = room.members.filter((memberId) => memberId.toString() !== userId);
    await room.save();

    res.status(200).json({ message: 'Left the room successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE ROOM (only creator can delete)
const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only the room creator can delete this room' });
    }

    await Room.findByIdAndDelete(roomId);

    // Us room ke saare messages bhi delete kar do
    await Message.deleteMany({ room: roomId });

    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createRoom, getRooms, joinRoom, leaveRoom, deleteRoom };