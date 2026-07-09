import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import RoomList from '../components/RoomList';
import UserList from '../components/UserList';
import FriendSearch from '../components/FriendSearch';
import FriendRequests from '../components/FriendRequests';
import ChatWindow from '../components/ChatWindow';
import Connect4Game from '../components/Connect4Game';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import './ChatPage.css';

function ChatPage() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [friendSubTab, setFriendSubTab] = useState('list');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [gameInvite, setGameInvite] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const { token, user } = useAuth();
  const { socket } = useSocket();

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

  useEffect(() => {
    if (!socket) return;

    const handleInviteReceived = ({ fromUserId, fromUsername }) => {
      setGameInvite({ fromUserId, fromUsername });
    };

    const handleInviteResponded = ({ accepted, fromUserId }) => {
      if (accepted) {
        setActiveGame({ _id: fromUserId, username: selectedUser?.username || 'Opponent', isInviter: true });
      } else {
        toast.info('Game invite declined');
      }
    };

    socket.on('gameInviteReceived', handleInviteReceived);
    socket.on('gameInviteResponded', handleInviteResponded);

    return () => {
      socket.off('gameInviteReceived', handleInviteReceived);
      socket.off('gameInviteResponded', handleInviteResponded);
    };
  }, [socket, selectedUser]);

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

  const handleBackToList = () => {
    setSelectedRoom(null);
    setSelectedUser(null);
  };

  const handleSendGameInvite = () => {
    if (!selectedUser) return;
    console.log('Sending invite to:', selectedUser._id, 'from:', user.id);
    socket.emit('gameInvite', {
      toUserId: selectedUser._id,
      fromUserId: user.id,
      fromUsername: user.username,
    });

    toast.info('Game invite sent!');
  };

  const handleRespondToInvite = (accepted) => {
    socket.emit('gameInviteResponse', {
      toUserId: gameInvite.fromUserId,
      accepted,
      fromUserId: user.id,
    });

    if (accepted) {
      setActiveGame({ _id: gameInvite.fromUserId, username: gameInvite.fromUsername, isInviter: false });
    }

    setGameInvite(null);
  };

  const chatTarget = selectedRoom || selectedUser;

  return (
    <div className="chat-page">
      <Navbar />
      <div className="chat-body">
        <div className={`sidebar ${chatTarget ? 'sidebar-hidden-mobile' : ''}`}>
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

        <div className={`chat-window-container ${chatTarget ? '' : 'chat-hidden-mobile'}`}>
          {chatTarget && (
            <button className="back-to-list-btn" onClick={handleBackToList}>
              ← Back
            </button>
          )}
          <ChatWindow room={selectedRoom} privateUser={selectedUser} onPlayGame={handleSendGameInvite} />
        </div>
      </div>

      {gameInvite && (
        <div className="game-invite-popup">
          <p>{gameInvite.fromUsername} invited you to play Connect 4!</p>
          <div className="game-invite-actions">
            <button onClick={() => handleRespondToInvite(true)}>Accept</button>
            <button onClick={() => handleRespondToInvite(false)}>Decline</button>
          </div>
        </div>
      )}

      {activeGame && (
        <Connect4Game opponent={activeGame} onClose={() => setActiveGame(null)} />
      )}
    </div>
  );
}

export default ChatPage;