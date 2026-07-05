import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import RoomList from '../components/RoomList';
import UserList from '../components/UserList';
import FriendSearch from '../components/FriendSearch';
import FriendRequests from '../components/FriendRequests';
import ChatWindow from '../components/ChatWindow';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './ChatPage.css';

function ChatPage() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [friendSubTab, setFriendSubTab] = useState('list');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const { token } = useAuth();

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/friends/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingCount(res.data.length);
    } catch (error) {
      console.log('Error fetching pending count:', error);
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, [refreshTrigger]);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setSelectedUser(null);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSelectedRoom(null);
  };

  const handleFriendAccepted = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="chat-page">
      <Navbar />
      <div className="chat-body">
        <div className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={activeTab === 'rooms' ? 'active' : ''}
              onClick={() => setActiveTab('rooms')}
            >
              Rooms
            </button>
            <button
              className={activeTab === 'friends' ? 'active' : ''}
              onClick={() => setActiveTab('friends')}
            >
              Friends
            </button>
          </div>

          {activeTab === 'rooms' && (
            <RoomList onSelectRoom={handleSelectRoom} selectedRoomId={selectedRoom?._id} />
          )}

          {activeTab === 'friends' && (
            <div>
              <div className="friend-sub-tabs">
                <button
                  className={friendSubTab === 'list' ? 'active' : ''}
                  onClick={() => setFriendSubTab('list')}
                >
                  Friends
                </button>
                <button
                  className={friendSubTab === 'search' ? 'active' : ''}
                  onClick={() => setFriendSubTab('search')}
                >
                  Search
                </button>
                <button
                  className={`requests-tab-btn ${friendSubTab === 'requests' ? 'active' : ''}`}
                  onClick={() => setFriendSubTab('requests')}
                >
                  Requests
                  {pendingCount > 0 && (
                    <span className="notification-badge">{pendingCount}</span>
                  )}
                </button>
              </div>

              {friendSubTab === 'list' && (
                <UserList
                  onSelectUser={handleSelectUser}
                  selectedUserId={selectedUser?._id}
                  refreshTrigger={refreshTrigger}
                />
              )}
              {friendSubTab === 'search' && <FriendSearch />}
              {friendSubTab === 'requests' && (
                <FriendRequests onFriendAccepted={handleFriendAccepted} />
              )}
            </div>
          )}
        </div>

        <ChatWindow room={selectedRoom} privateUser={selectedUser} />
      </div>
    </div>
  );
}

export default ChatPage;