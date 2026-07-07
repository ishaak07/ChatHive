import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getAvatarSrc } from '../utils/avatarMap';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'react-toastify';
import './ChatWindow.css';

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

function ChatWindow({ room, privateUser, onPlayGame }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [smartReplies, setSmartReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showExtractor, setShowExtractor] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatTarget = room || privateUser;

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

  const fetchSmartReplies = async (lastMessageContent) => {
    setLoadingReplies(true);
    try {
      const res = await api.post(
        '/ai/smart-replies',
        { lastMessage: lastMessageContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSmartReplies(res.data.suggestions);
    } catch (error) {
      console.log('Error fetching smart replies:', error);
      setSmartReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      if (room && message.room === room._id) {
        setMessages((prev) => [...prev, message]);

        if (message.sender._id !== user.id) {
          fetchSmartReplies(message.content);
        }
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    return () => socket.off('receiveMessage', handleReceiveMessage);
  }, [socket, room]);

  useEffect(() => {
    if (!socket) return;

    const handleReceivePrivateMessage = (message) => {
      if (
        privateUser &&
        (message.sender._id === privateUser._id || message.sender._id === user.id) &&
        (message.receiver === privateUser._id || message.receiver === user.id)
      ) {
        setMessages((prev) => [...prev, message]);

        if (message.sender._id !== user.id) {
          fetchSmartReplies(message.content);
        }
      }
    };

    socket.on('receivePrivateMessage', handleReceivePrivateMessage);
    return () => socket.off('receivePrivateMessage', handleReceivePrivateMessage);
  }, [socket, privateUser, user]);

  useEffect(() => {
    if (!socket) return;

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content: 'This message was deleted', isDeleted: true }
            : msg
        )
      );
    };

    socket.on('messageDeleted', handleMessageDeleted);
    return () => socket.off('messageDeleted', handleMessageDeleted);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleError = (error) => {
      toast.error(error.message);
    };

    socket.on('errorMessage', handleError);
    return () => socket.off('errorMessage', handleError);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = () => setOtherUserTyping(true);
    const handleUserStoppedTyping = () => setOtherUserTyping(false);

    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
    };
  }, [socket]);

  useEffect(() => {
    setOtherUserTyping(false);
    setSmartReplies([]);
  }, [room, privateUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !chatTarget) return;

    socket.emit('typing', {
      roomId: room?._id,
      receiverId: privateUser?._id,
      username: user.username,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', {
        roomId: room?._id,
        receiverId: privateUser?._id,
      });
    }, 2000);
  };

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
    setSmartReplies([]);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('stopTyping', {
      roomId: room?._id,
      receiverId: privateUser?._id,
    });
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleSuggestionClick = (suggestion) => {
    setNewMessage(suggestion);
    setSmartReplies([]);
  };

  const handleDeleteMessage = async (msg) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await api.delete(`/messages/${msg._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id ? { ...m, content: 'This message was deleted', isDeleted: true } : m
        )
      );

      socket.emit('deleteMessage', {
        messageId: msg._id,
        roomId: room?._id,
        receiverId: privateUser?._id,
        senderId: user.id,
      });
    } catch (error) {
      toast.error('Error deleting message');
    }
  };

  const handleSummarize = async () => {
    if (messages.length === 0) {
      toast.info('No messages to summarize yet');
      return;
    }

    setShowSummary(true);
    setLoadingSummary(true);

    try {
      const formattedMessages = messages
        .filter((msg) => !msg.isDeleted)
        .map((msg) => ({
          sender: msg.sender.username,
          content: msg.content,
        }));

      const res = await api.post(
        '/ai/summarize',
        { messages: formattedMessages },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSummary(res.data.summary);
    } catch (error) {
      toast.error('Error generating summary');
      setShowSummary(false);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleExtractInfo = async () => {
    if (messages.length === 0) {
      toast.info('No messages to analyze yet');
      return;
    }

    setShowExtractor(true);
    setLoadingExtract(true);

    try {
      const formattedMessages = messages
        .filter((msg) => !msg.isDeleted)
        .map((msg) => ({
          sender: msg.sender.username,
          content: msg.content,
        }));

      const res = await api.post(
        '/ai/extract',
        { messages: formattedMessages },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setExtractedInfo(res.data.extracted);
    } catch (error) {
      toast.error('Error extracting information');
      setShowExtractor(false);
    } finally {
      setLoadingExtract(false);
    }
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
        {room ? (
          <h3># {room.name}</h3>
        ) : (
          <div className="chat-header-user">
            <img
              src={getAvatarSrc(privateUser.avatar)}
              alt={privateUser.username}
              className="chat-header-avatar"
            />
            <div className="chat-header-info">
              <h3>{privateUser.username}</h3>
              {otherUserTyping && <span className="typing-status">typing...</span>}
            </div>
          </div>
        )}

        <div className="header-actions">
          {privateUser && (
            <button className="play-game-btn-header" onClick={onPlayGame} title="Play Connect 4">
              🎮 Play
            </button>
          )}
          <button className="summarize-btn" onClick={handleSummarize} title="Summarize conversation">
            ✨ Summarize
          </button>
          <button className="extract-btn" onClick={handleExtractInfo} title="Extract important info">
            📌 Extract Info
          </button>
        </div>
      </div>

      <div className="messages-area">
        {messages.map((msg, index) => {
          const showDateSeparator =
            index === 0 ||
            formatDateLabel(msg.createdAt) !== formatDateLabel(messages[index - 1].createdAt);

          const isOwn = msg.sender._id === user.id;

          return (
            <div key={msg._id} className="message-row">
              {showDateSeparator && (
                <div className="date-separator">
                  <span>{formatDateLabel(msg.createdAt)}</span>
                </div>
              )}
              <div className={`message-wrapper ${isOwn ? 'own-wrapper' : ''}`}>
                <div className={`message ${isOwn ? 'own-message' : ''} ${msg.isDeleted ? 'deleted-message' : ''}`}>
                  <span className="message-sender">{msg.sender.username}</span>
                  <p className="message-content">
                    {msg.isDeleted ? <em>This message was deleted</em> : msg.content}
                  </p>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {isOwn && !msg.isDeleted && (
                    <button
                      className="delete-msg-btn"
                      onClick={() => handleDeleteMessage(msg)}
                      title="Delete message"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {smartReplies.length > 0 && (
        <div className="smart-replies">
          {smartReplies.map((reply, index) => (
            <button
              key={index}
              className="smart-reply-chip"
              onClick={() => handleSuggestionClick(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

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
          onChange={handleInputChange}
        />
        <button type="submit">Send</button>
      </form>

      {showSummary && (
        <div className="summary-modal-overlay" onClick={() => setShowSummary(false)}>
          <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="summary-modal-header">
              <h3>✨ Conversation Summary</h3>
              <button onClick={() => setShowSummary(false)}>×</button>
            </div>
            <div className="summary-modal-body">
              {loadingSummary ? (
                <p className="summary-loading">Generating summary...</p>
              ) : (
                <p>{summary}</p>
              )}
            </div>
          </div>
        </div>
      )}
      {showExtractor && (
        <div className="summary-modal-overlay" onClick={() => setShowExtractor(false)}>
          <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="summary-modal-header">
              <h3>📌 Important Information</h3>
              <button onClick={() => setShowExtractor(false)}>×</button>
            </div>
            <div className="summary-modal-body">
              {loadingExtract ? (
                <p className="summary-loading">Analyzing conversation...</p>
              ) : extractedInfo ? (
                <div className="extracted-info">
                  {extractedInfo.meetings?.length > 0 && (
                    <div className="extract-category">
                      <h4>📅 Meetings</h4>
                      <ul>
                        {extractedInfo.meetings.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {extractedInfo.deadlines?.length > 0 && (
                    <div className="extract-category">
                      <h4>📝 Deadlines</h4>
                      <ul>
                        {extractedInfo.deadlines.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {extractedInfo.locations?.length > 0 && (
                    <div className="extract-category">
                      <h4>📍 Locations</h4>
                      <ul>
                        {extractedInfo.locations.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {extractedInfo.contacts?.length > 0 && (
                    <div className="extract-category">
                      <h4>📞 Contacts</h4>
                      <ul>
                        {extractedInfo.contacts.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {extractedInfo.tasks?.length > 0 && (
                    <div className="extract-category">
                      <h4>✅ Tasks</h4>
                      <ul className="task-list">
                        {extractedInfo.tasks.map((item, i) => <li key={i}>☐ {item}</li>)}
                      </ul>
                    </div>
                  )}

                  {Object.values(extractedInfo).every((arr) => arr.length === 0) && (
                    <p>No important information found in this conversation.</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;