const Message = require('../models/Message');
const User = require('../models/User');
const Room = require('../models/Room');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    let currentUserId = null;

    socket.on('setup', async (userId) => {
      socket.join(userId);
      currentUserId = userId;

      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('userStatusChanged', { userId, isOnline: true });

      console.log(`User ${userId} joined their personal room`);
    });

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Room mein message bhejna — ab membership check ke sath
    socket.on('sendMessage', async ({ roomId, senderId, content }) => {
      try {
        const room = await Room.findById(roomId);

        if (!room) {
          return socket.emit('errorMessage', { message: 'Room not found' });
        }

        // Check karo sender is room ka member hai ya nahi
        if (!room.members.includes(senderId)) {
          return socket.emit('errorMessage', { message: 'You must join this room to send messages' });
        }

        const message = new Message({
          sender: senderId,
          room: roomId,
          content,
        });
        await message.save();

        const populatedMessage = await message.populate('sender', 'username');
        io.to(roomId).emit('receiveMessage', populatedMessage);
      } catch (error) {
        console.log('Error sending message:', error.message);
      }
    });

    socket.on('sendPrivateMessage', async ({ senderId, receiverId, content }) => {
      try {
        const message = new Message({
          sender: senderId,
          receiver: receiverId,
          content,
        });
        await message.save();

        const populatedMessage = await message.populate('sender', 'username');

        io.to(receiverId).emit('receivePrivateMessage', populatedMessage);
        io.to(senderId).emit('receivePrivateMessage', populatedMessage);
      } catch (error) {
        console.log('Error sending private message:', error.message);
      }
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);

      if (currentUserId) {
        await User.findByIdAndUpdate(currentUserId, { isOnline: false });
        io.emit('userStatusChanged', { userId: currentUserId, isOnline: false });
      }
    });
  });
};

module.exports = socketHandler;