import axios from 'axios';

async function testCreateIssue() {
  try {
    // 1. Login to get cookie
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'nakkakarthikyadav@gmail.com',
      password: 'password123'
    });
    
    const cookie = loginRes.headers['set-cookie']?.[0];
    if (!cookie) throw new Error('No cookie returned');

    // 2. Fetch workspaces to find workspaceId
    const wsRes = await axios.get('http://localhost:3000/api/v1/workspaces', {
      headers: { Cookie: cookie }
    });
    const workspaceId = wsRes.data.data[0].id;

    // 3. Fetch projects to find projectId
    const projRes = await axios.get(`http://localhost:3000/api/v1/workspaces/${workspaceId}/projects`, {
      headers: { Cookie: cookie }
    });
    const projectId = projRes.data.data[0].id;

    // 4. Create Issue
    console.log(`Creating issue in Workspace: ${workspaceId}, Project: ${projectId}`);
    const issueRes = await axios.post(`http://localhost:3000/api/v1/workspaces/${workspaceId}/projects/${projectId}/issues`, {
      title: 'Test Issue via API'
    }, {
      headers: { Cookie: cookie }
    });
    
    console.log('Issue created successfully:', issueRes.data);
  } catch (err: any) {
    console.error('Failed to create issue:', err.response?.data || err.message);
  }
}

testCreateIssue();
