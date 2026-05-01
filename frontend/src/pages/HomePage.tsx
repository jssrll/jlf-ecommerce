import { Link } from 'react-router-dom';
import { useCart } from '../store/cart';
import { products } from '../data/products';

export function HomePage() {
  const { addItem } = useCart();

  const bestSellers = products.filter(p => [1, 5, 6, 7].includes(p.id));

  return (
    <div className="animate-[fadeIn_0.5s_ease]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a0f2a] to-[#1a1f3a] rounded-3xl p-12 md:p-20 my-10 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-red-500 bg-clip-text text-transparent">
          JLFireworks
        </h1>
        <p className="text-lg opacity-90 max-w-xl mx-auto">
          Quality Is Our Top Priority
        </p>
      </div>

      {/* Best Sellers */}
      <div className="my-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold mb-3">Best Sellers</h2>
          <p className="text-gray-500">Our most popular fireworks for every celebration</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all">
              <span className="text-5xl block mb-3">{product.image}</span>
              <h3 className="font-semibold mb-2">{product.name}</h3>
              <p className="text-red-500 font-semibold text-lg mb-4">₱{product.price}</p>
              <button
                onClick={() => addItem({ id: product.id, name: product.name, price: product.price, image: product.image })}
                className="w-full py-2 bg-gray-900 text-white rounded-full text-sm hover:bg-red-500 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
        <div className="bg-white p-8 rounded-2xl text-center border border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-truck-fast text-2xl text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Free Express Delivery</h3>
          <p className="text-gray-500">On all orders ₱1999+. Guaranteed free delivery/meet-up.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl text-center border border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-gift text-2xl text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Exclusive Codes</h3>
          <p className="text-gray-500">Redeem special codes for instant credits</p>
        </div>
        <div className="bg-white p-8 rounded-2xl text-center border border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-headset text-2xl text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-3">24/7 Support</h3>
          <p className="text-gray-500">We're here to help with your celebrations</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="my-12 text-center">
        <h2 className="text-3xl font-semibold mb-8">How It Works</h2>
        <div className="flex flex-wrap justify-center items-center gap-4">
          {[
            { num: 1, icon: 'fa-user-plus', title: 'Create Account', desc: 'Sign up in seconds' },
            { num: 2, icon: 'fa-shopping-cart', title: 'Shop Fireworks', desc: 'Choose your favorites' },
            { num: 3, icon: 'fa-ticket-alt', title: 'Redeem Codes', desc: 'Get instant credits' },
            { num: 4, icon: 'fa-fire', title: 'Light Up!', desc: 'Enjoy your celebration' },
          ].map((step, i) => (
            <div key={step.num} className="flex items-center gap-4">
              <div className="bg-white p-6 rounded-2xl text-center border min-w-[160px]">
                <div className="w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                  {step.num}
                </div>
                <i className={`fas ${step.icon} text-2xl text-red-500 mb-3 block`} />
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
              {i < 3 && <i className="fas fa-arrow-right text-red-500 text-xl hidden md:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 my-12 text-center">
        <div>
          <div className="text-3xl font-bold text-red-500">49+</div>
          <div className="text-gray-500 text-sm">Happy Customers</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-red-500">200+</div>
          <div className="text-gray-500 text-sm">Products Available</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-red-500">24/7</div>
          <div className="text-gray-500 text-sm">Support Available</div>
        </div>
      </div>
    </div>
  );
}