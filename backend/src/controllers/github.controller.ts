import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';
import axios from 'axios';

// Placeholder config - in a real app these should be in .env
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'placeholder_client_id';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'placeholder_client_secret';
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5173/api/v1/github/callback'; // adjust as needed

export const connectGitHub = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.query;
  
  if (!workspaceId) {
    return res.status(400).json({ success: false, error: { message: 'Workspace ID is required' } });
  }

  // Redirect to GitHub OAuth flow
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo&state=${workspaceId}`;
  
  res.status(200).json({ success: true, data: { url: githubAuthUrl } });
});

export const githubCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state: workspaceId } = req.query;

  if (!code || !workspaceId) {
    return res.status(400).json({ success: false, error: { message: 'Code and state (workspaceId) are required' } });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
    }, {
      headers: {
        Accept: 'application/json'
      }
    });

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      return res.status(400).json({ success: false, error: { message: 'Failed to retrieve access token' } });
    }

    // Save token in the Integration model
    await prisma.integration.upsert({
      where: {
        workspaceId_provider: {
          workspaceId: workspaceId as string,
          provider: 'github'
        }
      },
      update: {
        accessToken: access_token
      },
      create: {
        workspaceId: workspaceId as string,
        provider: 'github',
        accessToken: access_token
      }
    });

    // Redirect back to frontend
    res.redirect('http://localhost:5173/workspaces/' + workspaceId + '/settings'); // Adjust to your frontend URL
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to complete GitHub authentication' } });
  }
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  // We are primarily interested in pull_request events that are closed and merged
  if (event === 'pull_request' && payload.action === 'closed' && payload.pull_request.merged) {
    const prTitle = payload.pull_request.title;
    const prBody = payload.pull_request.body || '';

    // Regex to find things like "ENG-123"
    const taskKeyRegex = /([A-Z]+-\d+)/g;
    const combinedText = `${prTitle} ${prBody}`;
    
    let match;
    const foundKeys = new Set<string>();
    while ((match = taskKeyRegex.exec(combinedText)) !== null) {
      foundKeys.add(match[1]);
    }

    if (foundKeys.size > 0) {
      // Find the issue(s)
      for (const key of foundKeys) {
        const issue = await prisma.issue.findFirst({
          where: { key }
        });

        if (issue) {
          // In a real system, we'd look up the "Done" or "Completed" status column for the project's board
          // and update issue.statusId. For now, we simulate this process.
          console.log(`Auto-completing issue ${key} due to PR merge!`);
          
          // Let's assume there's a BoardColumn with title 'Done' for this issue's board
          if (issue.boardId) {
             const doneColumn = await prisma.boardColumn.findFirst({
               where: { boardId: issue.boardId, title: { contains: 'Done', mode: 'insensitive' } }
             });
             
             if (doneColumn) {
               await prisma.issue.update({
                 where: { id: issue.id },
                 data: { statusId: doneColumn.id }
               });
             }
          }
        }
      }
    }
  }

  // Acknowledge receipt
  res.status(200).send('OK');
});
