import { useAuth } from '../store/auth';
import { Navigate } from 'react-router-dom';

export function AdminPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-semibold mb-3">
          <i className="fas fa-code text-red-500 mr-2" /> Admin Dashboard
        </h1>
        <p className="text-gray-500">Manage orders, view logs, and monitor system activity</p>
      </div>
      <div className="bg-white rounded-3xl border p-8 text-center">
        <i className="fas fa-tools text-5xl text-red-500 mb-4 block" />
        <p className="text-gray-500">Admin panel coming soon</p>
      </div>
    </div>
  );
}