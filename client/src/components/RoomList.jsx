import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
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
      toast.success('Room created!');
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating room');
    }
  };

  const handleJoinRoom = async (roomId, e) => {
    e.stopPropagation();
    try {
      await api.put(
        `/rooms/join/${roomId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Room joined!');
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error joining room');
    }
  };

  const handleLeaveOrDelete = async (e, room) => {
    e.stopPropagation();

    const isCreator = room.createdBy === user.id;

    const confirmMsg = isCreator
      ? `Delete room "${room.name}"? This will remove it for everyone and cannot be undone.`
      : `Leave room "${room.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (isCreator) {
        await api.delete(`/rooms/${room._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Room deleted');
      } else {
        await api.put(
          `/rooms/leave/${room._id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Left the room');
      }

      if (selectedRoomId === room._id) {
        onSelectRoom(null);
      }

      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing request');
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
          const isCreator = room.createdBy === user.id;

          return (
            <div
              key={room._id}
              className={`room-item ${selectedRoomId === room._id ? 'active' : ''}`}
              onClick={() => onSelectRoom(room)}
            >
              <span># {room.name}</span>

              <div className="room-item-actions">
                {!isMember && (
                  <button
                    className="join-btn"
                    onClick={(e) => handleJoinRoom(room._id, e)}
                  >
                    Join
                  </button>
                )}

                {isMember && (
                  <button
                    className="leave-btn"
                    onClick={(e) => handleLeaveOrDelete(e, room)}
                    title={isCreator ? 'Delete room' : 'Leave room'}
                  >
                    {isCreator ? '🗑' : '⏻'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RoomList;