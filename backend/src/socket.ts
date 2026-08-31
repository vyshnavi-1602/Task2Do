import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { env } from './config/env';
import { prisma } from '@task2do/schema';

let io: Server;

export const setupSocketIO = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      if (!cookieHeader) {
        return next(new Error('Authentication error: No cookies found'));
      }

      const cookies = cookie.parse(cookieHeader);
      const token = cookies.task2do_token;

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const payload = jwt.verify(token, env.JWT_SECRET as string) as { id: string };
      // Attach user id to socket instance
      (socket as any).userId = payload.id;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    
    socket.on('joinProjectRoom', async (projectId: string) => {
      try {
        // Verify authorization: is user a member of the workspace containing this project?
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { workspaceId: true },
        });

        if (!project) {
          return socket.emit('error', 'Project not found');
        }

        const member = await prisma.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId,
              workspaceId: project.workspaceId,
            },
          },
        });

        if (!member) {
          return socket.emit('error', 'Unauthorized to access this project');
        }

        socket.join(`project:${projectId}`);
      } catch (error) {
        console.error('Socket joinProjectRoom error:', error);
        socket.emit('error', 'Internal server error');
      }
    });

    socket.on('leaveProjectRoom', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call setupSocketIO first.');
  }
  return io;
};
