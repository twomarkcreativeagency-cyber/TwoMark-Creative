import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    try {
      const wsUrl = process.env.REACT_APP_BACKEND_URL.replace('https', 'wss').replace('http', 'ws') + '/ws';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
        console.log('[WebSocket] Connected');
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('[WebSocket] Disconnected');
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Message:', data);
          
          if (data.type === 'new_post') {
            toast.success('Yeni gönderi yayınlandı!');
          } else if (data.type === 'new_event') {
            toast.info('Yeni takvim etkinliği oluşturuldu!');
          } else if (data.type === 'new_payment') {
            toast.info('Yeni ödeme oluşturuldu!');
          } else if (data.type === 'payment_updated') {
            toast.success('Ödeme güncellendi!');
          }
        } catch (error) {
          console.error('[WebSocket] Parse error:', error);
        }
      };

      setSocket(ws);

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
