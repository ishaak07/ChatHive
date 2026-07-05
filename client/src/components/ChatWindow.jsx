import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import EmojiPicker from 'emoji-picker-react';
import './ChatWindow.css';

// Date ko readable format mein convert karta hai (Today / Yesterday / actual date)
const formatDateLabel = (dateString) => {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  if (isSameDay(messageDate, today)) return 'Today';
  if (isSameDay(messageDate, yesterday)) return 'Yesterday';

  return messageDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

function ChatWindow({ room, privateUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);

  const chatTarget = room || privateUser;

  // Chat target badalne par purane messages fetch karo
  useEffect(() => {
    const fetchHistory = async () => {
      if (!chatTarget) return;

      try {
        const url = room
          ? `/messages/room/${room._id}`
          : `/messages/private/${privateUser._id}`;

        const res = await api.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMessages(res.data);
      } catch (error) {
        console.log('Error fetching history:', error);
      }
    };

    fetchHistory();

    if (room) {
      socket?.emit('joinRoom', room._id);
    }
  }, [room, privateUser, socket, token]);

  // Room messages receive karna (real-time)
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      if (room && message.room === room._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    return () => socket.off('receiveMessage', handleReceiveMessage);
  }, [socket, room]);

  // Private messages receive karna (real-time)
  useEffect(() => {
    if (!socket) return;

    const handleReceivePrivateMessage = (message) => {
      if (
        privateUser &&
        (message.sender._id === privateUser._id || message.sender._id === user.id) &&
        (message.receiver === privateUser._id || message.receiver === user.id)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('receivePrivateMessage', handleReceivePrivateMessage);
    return () => socket.off('receivePrivateMessage', handleReceivePrivateMessage);
  }, [socket, privateUser, user]);

  // Error messages sunna
  useEffect(() => {
    if (!socket) return;

    const handleError = (error) => {
      alert(error.message);
    };

    socket.on('errorMessage', handleError);
    return () => socket.off('errorMessage', handleError);
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !chatTarget) return;

    if (room) {
      socket.emit('sendMessage', {
        roomId: room._id,
        senderId: user.id,
        content: newMessage,
      });
    } else if (privateUser) {
      socket.emit('sendPrivateMessage', {
        senderId: user.id,
        receiverId: privateUser._id,
        content: newMessage,
      });
    }

    setNewMessage('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  if (!chatTarget) {
    return (
      <div className="chat-window-empty">
        <p>Select a room or user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{room ? `# ${room.name}` : `@ ${privateUser.username}`}</h3>
      </div>

      <div className="messages-area">
        {messages.map((msg, index) => {
          const showDateSeparator =
            index === 0 ||
            formatDateLabel(msg.createdAt) !== formatDateLabel(messages[index - 1].createdAt);

          return (
            <div key={msg._id} className="message-row">
              {showDateSeparator && (
                <div className="date-separator">
                  <span>{formatDateLabel(msg.createdAt)}</span>
                </div>
              )}
              <div className={`message-wrapper ${msg.sender._id === user.id ? 'own-wrapper' : ''}`}>
                <div className={`message ${msg.sender._id === user.id ? 'own-message' : ''}`}>
                  <span className="message-sender">{msg.sender.username}</span>
                  <p className="message-content">{msg.content}</p>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-area" onSubmit={handleSendMessage}>
        <div className="emoji-wrapper">
          <button
            type="button"
            className="emoji-btn"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            😊
          </button>
          {showEmojiPicker && (
            <div className="emoji-picker-container">
              <EmojiPicker onEmojiClick={handleEmojiClick} height={350} width={300} />
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatWindow;