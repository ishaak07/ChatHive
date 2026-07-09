import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        newSocket.emit('setup', user.id); // personal room join karo
      });

      setSocket(newSocket);

      // Cleanup: component unmount ya logout hone par connection band karo
      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);