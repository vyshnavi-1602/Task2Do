import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { asyncHandler } from '../utils/async-handler';
import { prisma } from '@task2do/schema';

// Initialize the Google Gen AI SDK inside the function to ensure env is loaded
let ai: GoogleGenAI;

export const chatWithAI = asyncHandler(async (req: Request, res: Response) => {
  const { prompt } = req.body;
  const userId = req.user?.id;

  if (!prompt) {
    return res.status(400).json({ success: false, error: { message: 'Prompt is required' } });
  }

  const p = prompt.toLowerCase();
  
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  // Basic context gathering: fetch the user's workspaces and recent projects
  let contextStr = '';
  if (userId) {
    const workspaces = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            projects: {
              select: { id: true, name: true, key: true },
              take: 3
            }
          }
        }
      }
    });

    if (workspaces.length > 0) {
      contextStr = `You are "Task2Do Assistant", a helpful and intelligent AI guide for the Task2Do agile project management app. 
Here is some context about the current user asking the question:
They are a member of the following workspaces:
${workspaces.map(wm => `- Workspace: ${wm.workspace.name} (Role: ${wm.role}). Projects: ${wm.workspace.projects.map(p => p.name).join(', ')}`).join('\n')}

STRICT RULES:
1. Task2Do is a professional Agile Project Management tool (similar to Jira or Linear). 
2. It features Workspaces, Projects, Backlogs, active Sprints, and Kanban Boards.
3. It is designed for software teams, companies, and students building complex projects.
4. DO NOT mention personal to-do lists, alarms, grocery shopping, or mobile home screen widgets.
5. Always be helpful, concise, and friendly. Do not use markdown unless formatting a list or code.`;
    } else {
      contextStr = `You are "Task2Do Assistant", a helpful and intelligent AI guide for the Task2Do agile project management app. 
STRICT RULES:
1. Task2Do is a professional Agile Project Management tool (similar to Jira or Linear) used by companies and development teams. 
2. It features Workspaces, Projects, Backlogs, active Sprints, and Kanban Boards.
3. DO NOT hallucinate features like personal to-do lists, alarms, grocery shopping, or widgets.
4. The user asking this question is NOT currently logged in. Your primary goal is to briefly explain what Task2Do does based ONLY on the features above, and politely encourage them to sign up or log in.`;
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: contextStr,
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        response: response.text,
      }
    });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to communicate with AI service.', details: error.message }
    });
  }
});
