import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';

export function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { items } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCart, setShowCart] = useState(false);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop' },
    { path: '/featured', label: 'Featured' },
    { path: '/orders', label: 'Transactions' },
    { path: '/help', label: 'Help' },
  ];

  if (isAdmin) {
    return (
      <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">
              JLF
            </div>
            <div className="flex items-center gap-4">
              <Link to="/admin" className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm">
                Admin Dashboard
              </Link>
              <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded-full text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4 flex-wrap gap-4">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">
              JLF
            </Link>

            <nav className="flex gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'text-red-500'
                      : 'text-gray-700 hover:text-red-500'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              {/* Cart */}
              <button
                onClick={() => setShowCart(true)}
                className="relative text-gray-700 hover:text-red-500 transition-colors"
              >
                <i className="fas fa-shopping-bag text-lg" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User */}
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-red-500">{user.name.split(' ')[0]}</span>
                  <span className="text-sm text-gray-500">₱{user.balance.toLocaleString()}</span>
                  <button
                    onClick={() => navigate('/settings')}
                    className="text-gray-700 hover:text-red-500"
                  >
                    <i className="fas fa-cog" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm hover:bg-red-500 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold">Cart</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-red-500">
                <i className="fas fa-times text-xl" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
              {items.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Your cart is empty</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center bg-gray-50 p-3 rounded-xl">
                    <span className="text-2xl">{item.image}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-red-500 text-sm">₱{item.price}</p>
                    </div>
                    <span className="text-sm">x{item.quantity}</span>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="p-5 border-t">
                <p className="flex justify-between font-semibold mb-3">
                  <span>Total</span>
                  <span>₱{items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}</span>
                </p>
                <button className="w-full py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-red-500 transition-colors">
                  Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}