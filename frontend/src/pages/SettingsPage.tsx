import { useAuth } from '../store/auth';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease] py-10 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-semibold mb-3">
          <i className="fas fa-sliders-h text-red-500 mr-2" /> Settings
        </h1>
        <p className="text-gray-500">Customize your JLF Fireworks experience</p>
      </div>

      {user && (
        <div className="bg-white rounded-3xl border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4"><i className="fas fa-user text-red-500 mr-2" /> Profile</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{user.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Account ID</span><span className="font-medium">{user.accountId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{user.phone}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Balance</span><span className="font-medium text-red-500">₱{user.balance.toLocaleString()}</span></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4"><i className="fas fa-info-circle text-red-500 mr-2" /> About</h3>
        <div className="flex justify-between mb-3">
          <span className="text-gray-500">App Version</span>
          <span className="font-medium">2.0.0</span>
        </div>
        <button
          onClick={() => window.location.href = 'mailto:jessrell1010@gmail.com'}
          className="w-full py-3 border rounded-full text-center hover:bg-red-500 hover:text-white transition-colors mb-2"
        >
          <i className="fas fa-envelope mr-2" /> Contact Developer
        </button>
        <button
          onClick={() => navigate('/help')}
          className="w-full py-3 border rounded-full text-center hover:bg-red-500 hover:text-white transition-colors mb-2"
        >
          <i className="fas fa-question-circle mr-2" /> FAQ
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-4 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors"
      >
        <i className="fas fa-sign-out-alt mr-2" /> Logout
      </button>
    </div>
  );
}