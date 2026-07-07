const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// SEARCH USER by username or email
const searchUser = async (req, res) => {
  try {
    const { query } = req.query;
    const myId = req.userId;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      _id: { $ne: myId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).select('username email');

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// SEND FRIEND REQUEST
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params; // jisko request bhejni hai
    const myId = req.userId;

    if (userId === myId) {
      return res.status(400).json({ message: "You can't send request to yourself" });
    }

    // Check if already friends
    const me = await User.findById(myId);
    if (me.friends.includes(userId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already exists (pending)
    const existingRequest = await FriendRequest.findOne({
      sender: myId,
      receiver: userId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    const request = new FriendRequest({
      sender: myId,
      receiver: userId,
    });

    await request.save();

    res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET PENDING REQUESTS (received by me)
const getPendingRequests = async (req, res) => {
  try {
    const myId = req.userId;

    const requests = await FriendRequest.find({
      receiver: myId,
      status: 'pending',
    }).populate('sender', 'username email');

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ACCEPT FRIEND REQUEST
const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const myId = req.userId;

    const request = await FriendRequest.findById(requestId);

    if (!request || request.receiver.toString() !== myId) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'accepted';
    await request.save();

    // Dono users ke friends array mein ek dusre ko add karo
    await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
    await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// REJECT FRIEND REQUEST
const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const myId = req.userId;

    const request = await FriendRequest.findById(requestId);

    if (!request || request.receiver.toString() !== myId) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'rejected';
    await request.save();

    res.status(200).json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET MY FRIENDS LIST
const getFriends = async (req, res) => {
  try {
    const myId = req.userId;

    const me = await User.findById(myId).populate('friends', 'username email isOnline avatar');

    res.status(200).json(me.friends);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// REMOVE FRIEND
const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const myId = req.userId;

    await User.findByIdAndUpdate(myId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: myId } });

    res.status(200).json({ message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  searchUser,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend,
};
