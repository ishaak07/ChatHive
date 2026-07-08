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

    socket.on('sendMessage', async ({ roomId, senderId, content }) => {
      try {
        const room = await Room.findById(roomId);

        if (!room) {
          return socket.emit('errorMessage', { message: 'Room not found' });
        }

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

    socket.on('typing', ({ roomId, receiverId, username }) => {
      if (roomId) {
        socket.to(roomId).emit('userTyping', { username, roomId });
      } else if (receiverId) {
        io.to(receiverId).emit('userTyping', { username, receiverId: socket.id });
      }
    });

    socket.on('stopTyping', ({ roomId, receiverId }) => {
      if (roomId) {
        socket.to(roomId).emit('userStoppedTyping', { roomId });
      } else if (receiverId) {
        io.to(receiverId).emit('userStoppedTyping', {});
      }
    });

    socket.on('deleteMessage', ({ messageId, roomId, receiverId, senderId }) => {
      if (roomId) {
        io.to(roomId).emit('messageDeleted', { messageId });
      } else if (receiverId) {
        io.to(receiverId).emit('messageDeleted', { messageId });
        io.to(senderId).emit('messageDeleted', { messageId });
      }
    });

    socket.on('gameInvite', ({ toUserId, fromUserId, fromUsername }) => {
      console.log('Game invite - sending to room:', toUserId, 'from:', fromUsername);
      io.to(toUserId).emit('gameInviteReceived', { fromUserId, fromUsername });
    });

    socket.on('gameInviteResponse', ({ toUserId, accepted, fromUserId }) => {
      io.to(toUserId).emit('gameInviteResponded', { accepted, fromUserId });
    });

    socket.on('gameMove', ({ toUserId, board, currentPlayer, column, row }) => {
      io.to(toUserId).emit('gameMoveReceived', { board, currentPlayer, column, row });
    });

    socket.on('gameRestart', ({ toUserId }) => {
      io.to(toUserId).emit('gameRestarted');
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