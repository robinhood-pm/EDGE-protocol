import React from 'react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/organisms/landing/LandingNavbar';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col">
      <LandingNavbar />
      
      <div className="flex-1 flex container max-w-7xl mx-auto px-6 pt-10 pb-20 mt-20">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0 hidden md:block pr-8 border-r border-white/5">
          <div className="sticky top-28">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Introduction</h3>
            <ul className="space-y-3 mb-8">
              <li><a href="#overview" className="text-sm text-indigo-400 font-medium">Overview</a></li>
              <li><a href="#robinhood-chain" className="text-sm text-white/60 hover:text-white transition-colors">Robinhood Chain</a></li>
              <li><a href="#core-concepts" className="text-sm text-white/60 hover:text-white transition-colors">Core Concepts</a></li>
            </ul>

            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Smart Contracts</h3>
            <ul className="space-y-3 mb-8">
              <li><a href="#architecture" className="text-sm text-white/60 hover:text-white transition-colors">Architecture</a></li>
              <li><a href="#conditional-tokens" className="text-sm text-white/60 hover:text-white transition-colors">Conditional Tokens</a></li>
              <li><a href="#market-factory" className="text-sm text-white/60 hover:text-white transition-colors">Market Factory</a></li>
              <li><a href="#oracles" className="text-sm text-white/60 hover:text-white transition-colors">Oracles</a></li>
            </ul>

            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Trading & API</h3>
            <ul className="space-y-3 mb-8">
              <li><a href="#clob" className="text-sm text-white/60 hover:text-white transition-colors">Order Book (CLOB)</a></li>
              <li><a href="#fees" className="text-sm text-white/60 hover:text-white transition-colors">Fees & Yields</a></li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:pl-10 max-w-3xl">
          <div className="inline-flex px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[11px] font-medium text-indigo-400 mb-6">
            Documentation
          </div>
          
          <h1 className="text-4xl font-bold mb-6 tracking-tight">EDGE Protocol Overview</h1>
          <p className="text-lg text-white/60 leading-relaxed mb-10">
            EDGE Protocol is a decentralized prediction market built natively on the Robinhood Chain. It allows users to trade the probability of future outcomes across Equities, Crypto, Macro, and Rates with deep liquidity and zero counterparty risk.
          </p>

          <hr className="border-white/5 mb-10" />

          <section id="overview" className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">What is a Prediction Market?</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              A prediction market is a decentralized exchange where individuals can trade shares representing the outcome of future events. The price of these shares reflects the market's aggregate belief in the probability of that event occurring.
            </p>
            <div className="bg-[#121215] border border-white/10 rounded-xl p-6">
              <h4 className="font-semibold mb-2">Example:</h4>
              <p className="text-sm text-white/60 leading-relaxed">
                If the market for "Will Bitcoin cross $100k?" is trading at <span className="text-green-400 font-mono">0.65 USDG</span> for a YES share, it implies a <span className="text-white font-bold">65% probability</span>. If the event happens, each YES share pays out exactly <span className="text-white font-mono">1.00 USDG</span>.
              </p>
            </div>
          </section>

          <section id="robinhood-chain" className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Why Robinhood Chain?</h2>
            <p className="text-white/60 leading-relaxed mb-4">
              EDGE Protocol leverages the underlying speed, low transaction fees, and deep ecosystem liquidity of the Robinhood Chain. This allows us to provide an order-book (CLOB) experience that rivals centralized exchanges.
            </p>
            <ul className="list-disc list-inside text-white/60 space-y-2 ml-2">
              <li><strong className="text-white">Low Gas Fees:</strong> Enables high-frequency trading and algorithmic market making.</li>
              <li><strong className="text-white">Fast Finality:</strong> Orders are matched and settled in milliseconds.</li>
              <li><strong className="text-white">USDG Integration:</strong> Native stablecoin integration for seamless on/off ramps.</li>
            </ul>
          </section>

          <section id="architecture" className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Smart Contract Architecture</h2>
            <p className="text-white/60 leading-relaxed mb-4">
              Our contracts are based on the battle-tested ERC-1155 Conditional Tokens framework.
            </p>
            <div className="bg-black/50 border border-white/5 rounded-xl p-6 overflow-x-auto">
              <pre className="text-xs text-indigo-300 font-mono">
{`interface IConditionalTokens {
    function prepareCondition(
        address oracle, 
        bytes32 questionId, 
        uint outcomeSlotCount
    ) external;

    function reportPayouts(
        bytes32 questionId, 
        uint[] calldata payouts
    ) external;
}`}
              </pre>
            </div>
          </section>
          
          <section id="oracles">
            <h2 className="text-2xl font-semibold mb-4">Oracles & Resolution</h2>
            <p className="text-white/60 leading-relaxed">
              Markets are resolved via decentralized Oracles. Once the real-world condition is met, the Oracle pushes the result on-chain, immediately allowing winning share holders to redeem their positions for the underlying collateral (USDG) at a 1:1 ratio.
            </p>
          </section>

        </main>
      </div>
    </div>
  );
}
