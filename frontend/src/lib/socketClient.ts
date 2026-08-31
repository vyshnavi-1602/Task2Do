import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';

export const socket: Socket = io(env.API_BASE_URL, {
  withCredentials: true,
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('Connected to socket server');
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err.message);
});
