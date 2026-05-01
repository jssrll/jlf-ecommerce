import { useState } from 'react';
import { useAuth } from '../store/auth';
import toast from 'react-hot-toast';

export function FeaturedPage() {
  const { user } = useAuth();
  const [code, setCode] = useState('');

  const redeemCode = async () => {
    if (!user) {
      toast.error('Please login to redeem codes');
      return;
    }
    toast.success('Code redemption coming soon!');
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease] py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-semibold mb-3">Rewards & Investment</h1>
        <p className="text-gray-500">Redeem exclusive codes and grow your credit balance</p>
      </div>

      {/* Code Redemption */}
      <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl border text-center mb-12">
        <h2 className="text-2xl font-semibold mb-6">
          <i className="fas fa-ticket-alt text-red-500 mr-2" /> Code Redemption
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your code"
            className="flex-1 px-4 py-3 border rounded-full outline-none focus:border-red-500"
          />
          <button
            onClick={redeemCode}
            className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-red-500 transition-colors"
          >
            Redeem
          </button>
        </div>
      </div>

      {/* Bond Investments */}
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-3xl p-8 md:p-12 shadow-sm">
        <h2 className="text-3xl font-semibold text-center mb-3">
          <i className="fas fa-chart-pie text-red-500 mr-2" /> Bond Investment Options
        </h2>
        <p className="text-center text-gray-500 mb-8">Choose your investment term and earn guaranteed returns!</p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {[
            { icon: '📈', title: 'Option 1', desc: 'Short-term bond', ret: '3%', duration: '90 days (3 months)' },
            { icon: '📊', title: 'Option 2', desc: 'Long-term bond', ret: '6%', duration: '150 days (5 months)' },
          ].map((opt) => (
            <div key={opt.title} className="bg-white p-8 rounded-3xl text-center shadow-md hover:-translate-y-1 transition-all">
              <span className="text-5xl block mb-4">{opt.icon}</span>
              <h3 className="text-2xl font-semibold text-red-500 mb-2">Bond Investment - {opt.title}</h3>
              <p className="text-gray-500 mb-4">{opt.desc}</p>
              <div className="bg-gray-50 p-4 rounded-2xl mb-4 flex justify-around text-sm">
                <span className="text-red-500 font-bold">Return: {opt.ret}</span>
                <span>Duration: {opt.duration}</span>
                <span>Min: ₱500</span>
              </div>
              <input
                type="number"
                placeholder="Amount in ₱ (min ₱500)"
                className="w-full px-4 py-3 border rounded-full text-center mb-3"
              />
              <button className="w-full py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-red-500 transition-colors">
                Invest in {opt.title}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}