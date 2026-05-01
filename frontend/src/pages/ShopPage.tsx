import { useState } from 'react';
import { useCart } from '../store/cart';
import { products, categories } from '../data/products';

export function ShopPage() {
  const { addItem } = useCart();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-[fadeIn_0.5s_ease] py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-semibold mb-3">Fireworks Collection</h1>
        <p className="text-gray-500">Choose from our wide selection of premium pyrotechnics</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-full border mb-8">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 flex-1 max-w-xs">
          <i className="fas fa-search text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search fireworks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === 'all' ? 'bg-gray-900 text-white' : 'border hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat ? 'bg-gray-900 text-white' : 'border hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl overflow-hidden border hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="h-40 bg-gray-50 flex items-center justify-center text-6xl">
              {product.image}
            </div>
            <div className="p-4">
              <span className="text-xs uppercase text-red-500 font-medium">{product.category}</span>
              <h3 className="font-semibold text-sm mt-1">{product.name}</h3>
              <p className="text-gray-500 text-xs">{product.description}</p>
              <p className="text-lg font-semibold mt-2">₱{product.price}</p>
              <button
                onClick={() => addItem({ id: product.id, name: product.name, price: product.price, image: product.image })}
                className="w-full mt-3 py-2 bg-gray-900 text-white rounded-full text-sm hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-plus-circle" /> Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}