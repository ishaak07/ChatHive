import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './FriendRequests.css';

function FriendRequests({ onFriendAccepted }) {
  const [requests, setRequests] = useState([]);
  const { token } = useAuth();

  const fetchRequests = async () => {
    try {
      const res = await api.get('/friends/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (error) {
      console.log('Error fetching requests:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      await api.put(
        `/friends/accept/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Friend request accepted!');
      fetchRequests();
      onFriendAccepted?.();
    } catch (error) {
      toast.error('Error accepting request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.put(
        `/friends/reject/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.info('Request rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Error rejecting request');
    }
  };

  if (requests.length === 0) {
    return <p className="no-requests">No pending requests</p>;
  }

  return (
    <div className="friend-requests">
      {requests.map((req) => (
        <div key={req._id} className="request-item">
          <span>{req.sender.username}</span>
          <div className="request-actions">
            <button className="accept-btn" onClick={() => handleAccept(req._id)}>
              Accept
            </button>
            <button className="reject-btn" onClick={() => handleReject(req._id)}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FriendRequests;