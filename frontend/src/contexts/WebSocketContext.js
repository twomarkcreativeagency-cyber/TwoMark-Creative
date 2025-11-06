import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { toast } from 'sonner';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children, token }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const wsUrl = process.env.REACT_APP_BACKEND_URL.replace('https', 'wss').replace('http', 'ws');
    const newSocket = io(wsUrl, {
      path: '/ws',
      transports: ['websocket'],
      auth: { token },
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    });

    newSocket.on('new_post', (data) => {
      toast.success('New post published!');
    });

    newSocket.on('new_event', (data) => {
      toast.info('New calendar event created!');
    });

    newSocket.on('new_payment', (data) => {
      toast.info('New payment created!');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return (
    <WebSocketContext.Provider value={{ socket, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
