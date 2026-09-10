"use client";
import React, { useState } from 'react';
import GlassSurface from '@/components/GlassSurface';

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
    <section id="faq" className="py-24 px-6 relative z-10">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <GlassSurface
            width="auto"
            height="auto"
            borderRadius={999}
            borderWidth={0.05}
            backgroundOpacity={0.05}
            opacity={0.3}
            className="inline-flex mb-4"
          >
            <div className="px-1 text-[11px] font-medium text-white/70 whitespace-nowrap">
              FAQ
            </div>
          </GlassSurface>
          <h2 className="text-[32px] font-semibold">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="w-full relative">
              <GlassSurface
                width="100%"
                height="100%"
                borderRadius={16}
                borderWidth={0.05}
                backgroundOpacity={openIndex === index ? 0.05 : 0.02}
                opacity={openIndex === index ? 0.4 : 0.2}
                className="w-full relative transition-all duration-300"
              >
                <div className="flex flex-col w-full h-full rounded-2xl overflow-hidden relative z-10">
                  <button 
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-white/[0.02] transition-colors"
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
              </GlassSurface>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
