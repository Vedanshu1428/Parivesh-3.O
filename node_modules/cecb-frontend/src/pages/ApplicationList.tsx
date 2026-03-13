import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FileText, ArrowRight, User } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';

export default function ApplicationList() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['applications', statusFilter],
    queryFn: () => api.get('/applications', { params: { status: statusFilter || undefined } }).then((r) => r.data),
  });

  const applications = data?.data || [];
  const filtered = applications.filter((app: any) => 
    app.projectName.toLowerCase().includes(search.toLowerCase()) ||
    app.proponent?.name.toLowerCase().includes(search.toLowerCase())
  );

  const viewApplication = (id: string) => {
    if (user?.role === 'PROPONENT') {
      navigate(`/dashboard/proponent/application/${id}`);
    } else if (user?.role === 'SCRUTINY') {
      navigate(`/dashboard/scrutiny/review/${id}`);
    } else if (user?.role === 'MOM_TEAM') {
      // MoM Team can view but might go to editor or status-specific page
      navigate(`/dashboard/mom/editor/${id}`);
    } else {
      navigate(`/dashboard/application/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 text-sm">View and manage all project applications</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects or proponents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_SCRUTINY">Under Scrutiny</option>
              <option value="EDS">Deficiency</option>
              <option value="REFERRED">Referred</option>
              <option value="MOM_GENERATED">MoM Ready</option>
              <option value="FINALIZED">Finalized</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-gray-900 font-semibold">No applications found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Project Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Proponent</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Last Updated</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((app: any) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">{app.projectName}</div>
                      <div className="text-xs text-gray-500">{app.sector} • {app.district}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-sm">
                          <div className="text-gray-900">{app.proponent?.name || 'Unknown'}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">{app.proponent?.organization || 'Individual'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(app.updatedAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => viewApplication(app.id)}
                        className="inline-flex items-center gap-1.5 text-primary text-xs font-bold hover:underline"
                      >
                        Details <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
