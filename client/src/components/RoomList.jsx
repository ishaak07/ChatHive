import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './RoomList.css';

function RoomList({ onSelectRoom, selectedRoomId }) {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const { user, token } = useAuth();

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (error) {
      console.log('Error fetching rooms:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      await api.post(
        '/rooms/create',
        { name: newRoomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewRoomName('');
      fetchRooms();
    } catch (error) {
      console.log('Error creating room:', error);
    }
  };

  const handleJoinRoom = async (roomId, e) => {
    e.stopPropagation(); // parent ka onClick (select) trigger na ho
    try {
      await api.put(
        `/rooms/join/${roomId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRooms(); // membership update dikhane ke liye refresh karo
    } catch (error) {
      console.log('Error joining room:', error);
    }
  };

  return (
    <div className="room-list">
      <form onSubmit={handleCreateRoom} className="create-room-form">
        <input
          type="text"
          placeholder="New room name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
        />
        <button type="submit">+</button>
      </form>

      <div className="rooms">
        {rooms.map((room) => {
          const isMember = room.members.includes(user.id);

          return (
            <div
              key={room._id}
              className={`room-item ${selectedRoomId === room._id ? 'active' : ''}`}
              onClick={() => onSelectRoom(room)}
            >
              <span># {room.name}</span>
              {!isMember && (
                <button
                  className="join-btn"
                  onClick={(e) => handleJoinRoom(room._id, e)}
                >
                  Join
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RoomList;