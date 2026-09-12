"use client";

import React from 'react';
import { Header } from '@/components/organisms/Header';
import { CalloutComposer } from '@/components/organisms/social/CalloutComposer';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateCalloutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-white">
      <Header />

      <main className="flex-1 container max-w-screen-md mx-auto px-4 py-8">
        <Link
          href="/callouts"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>

        <CalloutComposer onSuccess={() => (window.location.href = '/profile/CryptoWhale')} />
      </main>
    </div>
  );
}
