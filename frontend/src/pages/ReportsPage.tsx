import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient } from '../lib/apiClient';

export default function ReportsPage() {
  const { workspaceId, projectId } = useParams();

  const { data: metrics } = useQuery({
    queryKey: ['sprint-metrics', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/sprints/active/metrics`);
      return res.data?.data || [];
    },
    enabled: !!workspaceId && !!projectId,
  });

  const { data: velocityRes } = useQuery({
    queryKey: ['analytics', 'velocity', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/analytics/velocity`);
      return res.data?.data || [];
    },
    enabled: !!workspaceId && !!projectId,
  });

  const { data: performanceRes } = useQuery({
    queryKey: ['analytics', 'member-performance', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/analytics/member-performance`);
      return res.data?.data || [];
    },
    enabled: !!workspaceId && !!projectId,
  });

  const avgVelocity = velocityRes?.length > 0 
    ? Math.round(velocityRes.reduce((acc: number, cur: any) => acc + cur.completedPoints, 0) / velocityRes.length) 
    : 0;

  return (
    <div className="p-6" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Sprint Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="bg-white p-6 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--surface-color)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 className="text-sm font-medium text-gray-500" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Average Velocity</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2" style={{ fontSize: '32px', fontWeight: 700, margin: '8px 0 0 0' }}>{avgVelocity} pts</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--surface-color)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
        <h3 className="text-lg font-bold mb-4" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Active Sprint Burndown</h3>
        <div className="h-96 w-full" style={{ height: '400px', width: '100%' }}>
          {metrics && metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ideal" stroke="#9ca3af" strokeWidth={2} name="Ideal Guideline" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={3} name="Actual Remaining" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full w-full text-gray-500 text-sm font-medium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: 'var(--text-secondary)' }}>
              No active sprint data available
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--surface-color)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
        <h3 className="text-lg font-bold mb-4" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Velocity History</h3>
        <div className="h-96 w-full" style={{ height: '400px', width: '100%' }}>
          {velocityRes && velocityRes.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityRes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sprintName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalPoints" fill="#dfe1e6" name="Committed" />
                <Bar dataKey="completedPoints" fill="#0052cc" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full w-full text-gray-500 text-sm font-medium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: 'var(--text-secondary)' }}>
              No velocity data available
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--surface-color)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 className="text-lg font-bold mb-4" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Member Performance</h3>
        <div className="h-96 w-full" style={{ height: '400px', width: '100%' }}>
          {performanceRes && performanceRes.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceRes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="assigneeName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completedIssues" fill="#36B37E" name="Completed Issues" />
                <Bar dataKey="completedPoints" fill="#0052cc" name="Completed Points" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full w-full text-gray-500 text-sm font-medium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: 'var(--text-secondary)' }}>
              No member performance data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
