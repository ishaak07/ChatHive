import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import './RoomList.css';

function UserList({ onSelectUser, selectedUserId, refreshTrigger }) {
  const [friends, setFriends] = useState([]);
  const { token } = useAuth();
  const { socket } = useSocket();

  const fetchFriends = async () => {
    try {
      const res = await api.get('/friends', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(res.data);
    } catch (error) {
      console.log('Error fetching friends:', error);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [refreshTrigger]);

  useEffect(() => {
    if (!socket) return;

    const handleStatusChange = ({ userId, isOnline }) => {
      setFriends((prev) =>
        prev.map((f) => (f._id === userId ? { ...f, isOnline } : f))
      );
    };

    socket.on('userStatusChanged', handleStatusChange);
    return () => socket.off('userStatusChanged', handleStatusChange);
  }, [socket]);

  const handleRemoveFriend = async (e, friendId) => {
    e.stopPropagation();

    const confirmDelete = window.confirm('Remove this friend? Your chat history will remain, but they will be removed from your friends list.');
    if (!confirmDelete) return;

    try {
      await api.delete(`/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Friend removed');
      fetchFriends();
    } catch (error) {
      toast.error('Error removing friend');
    }
  };

  if (friends.length === 0) {
    return <p style={{ color: '#888', fontSize: '0.85rem' }}>No friends yet. Search and add some!</p>;
  }

  return (
    <div className="rooms">
      {friends.map((f) => (
        <div
          key={f._id}
          className={`room-item ${selectedUserId === f._id ? 'active' : ''}`}
          onClick={() => onSelectUser(f)}
        >
          <span className="friend-name">
            <span className={`status-dot ${f.isOnline ? 'online' : 'offline'}`}></span>
            {f.username}
          </span>
          <button
            className="remove-friend-btn"
            onClick={(e) => handleRemoveFriend(e, f._id)}
            title="Remove friend"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default UserList;