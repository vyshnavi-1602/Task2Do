import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient } from '../lib/apiClient';

export default function ReportsPage() {
  const { workspaceId, projectId } = useParams();

  const { data: metrics } = useQuery({
    queryKey: ['sprint-metrics', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${workspaceId}/projects/${projectId}/sprints/active/metrics`);
      return res.data;
    },
    enabled: !!workspaceId && !!projectId,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sprint Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Average Velocity</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">42 pts</p>
          <span className="text-sm text-green-600">↑ 12% from last sprint</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-bold mb-4">Active Sprint Burndown</h3>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ideal" stroke="#9ca3af" strokeWidth={2} name="Ideal Guideline" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={3} name="Actual Remaining" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
