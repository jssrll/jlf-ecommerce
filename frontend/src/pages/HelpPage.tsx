import { useState } from 'react';

const faqs = [
  { q: 'How do I place an order?', a: 'Browse our Shop page, add fireworks to cart, and proceed to checkout.' },
  { q: 'How do I track my order?', a: 'Track your order in the Transactions page after logging in.' },
  { q: 'What payment methods are accepted?', a: 'GCash and Cash at our physical store in Calapan City.' },
];

export function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="animate-[fadeIn_0.5s_ease] py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-semibold mb-3">Customer Support</h1>
        <p className="text-gray-500">We're here to help you 24/7</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white p-8 rounded-2xl text-center border">
          <i className="fas fa-headset text-3xl text-red-500 mb-4 block" />
          <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
          <p className="text-gray-500 mb-4">Chat with our support team instantly</p>
          <button className="px-6 py-2 border rounded-full hover:bg-red-500 hover:text-white transition-colors">Start Chat</button>
        </div>
        <div className="bg-white p-8 rounded-2xl text-center border">
          <i className="fas fa-envelope text-3xl text-red-500 mb-4 block" />
          <h3 className="text-xl font-semibold mb-2">Email Support</h3>
          <p className="text-gray-500 mb-4">jlfworks.official@gmail.com</p>
          <a href="mailto:jlfworks.official@gmail.com" className="px-6 py-2 border rounded-full hover:bg-red-500 hover:text-white transition-colors inline-block">Send Email</a>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-center mb-6">Frequently Asked Questions</h2>
      <div className="max-w-2xl mx-auto">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-2xl border mb-3 overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-6 py-4 flex justify-between items-center text-left font-medium hover:bg-gray-50"
            >
              {faq.q}
              <i className={`fas fa-chevron-down transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
            </button>
            <div className={`px-6 overflow-hidden transition-all ${openIndex === i ? 'py-4 max-h-48' : 'max-h-0'}`}>
              <p className="text-gray-500">{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}