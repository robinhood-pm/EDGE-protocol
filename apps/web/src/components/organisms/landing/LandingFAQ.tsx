"use client";
import React, { useState } from 'react';

const faqs = [
  {
    question: "What is EDGE Protocol?",
    answer: "EDGE Protocol is a decentralized prediction market built natively on the Robinhood Chain. It allows users to trade on the outcome of future events across various categories like crypto prices, equity movements, macroeconomic policies, and more, using a central limit order book for deep liquidity."
  },
  {
    question: "How are markets resolved?",
    answer: "Markets are resolved using decentralized oracles. When an event concludes, the oracle verifies the real-world outcome and cryptographically signs the result, ensuring absolute fairness and eliminating counterparty risk."
  },
  {
    question: "What tokens can I use to trade?",
    answer: "Trading on EDGE Protocol is primarily settled in USDG, a stablecoin native to the Robinhood Chain ecosystem. This ensures your positions maintain stable value without crypto volatility exposure."
  },
  {
    question: "How do fees work on EDGE?",
    answer: "Thanks to the Robinhood Chain's infrastructure, network gas fees are incredibly low. EDGE Protocol charges a minimal protocol fee only on profitable trades upon resolution, meaning you never pay just to enter a position."
  }
];

export const LandingFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6 border-b border-white/5">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-medium text-white/70 mb-4">
            FAQ
          </div>
          <h2 className="text-[32px] font-semibold">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-white/5' : 'bg-transparent hover:bg-white/[0.02]'}`}
            >
              <button 
                className="w-full px-6 py-5 text-left flex items-center justify-between"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-[15px]">{faq.question}</span>
                <span className="text-white/40 text-xl font-light">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-[13px] text-white/50 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
