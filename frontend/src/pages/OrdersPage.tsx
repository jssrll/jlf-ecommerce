import { useAuth } from '../store/auth';

export function OrdersPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-20">
        <i className="fas fa-receipt text-6xl text-red-500 mb-4 block" />
        <p className="text-gray-500 mb-4">Please login to view your transactions</p>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease] py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-semibold mb-3">
          <i className="fas fa-history text-red-500 mr-2" /> Transaction History
        </h1>
        <p className="text-gray-500">View all your transactions in one place</p>
      </div>
      <div className="text-center py-20 bg-white rounded-3xl border">
        <i className="fas fa-receipt text-5xl text-red-500 mb-4 block" />
        <p className="text-gray-500">No transactions yet. Start shopping!</p>
      </div>
    </div>
  );
}