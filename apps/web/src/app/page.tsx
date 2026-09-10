import React from 'react';
import { FerrofluidBackground } from '@/components/FerrofluidBackground';
import { LandingNavbar } from '@/components/organisms/landing/LandingNavbar';
import { LandingHero } from '@/components/organisms/landing/LandingHero';
import { SupportedEcosystem } from '@/components/organisms/landing/SupportedEcosystem';
import { LandingStats } from '@/components/organisms/landing/LandingStats';
import { FeaturesBento } from '@/components/organisms/landing/FeaturesBento';
import { WorkProcess } from '@/components/organisms/landing/WorkProcess';
import { LandingFAQ } from '@/components/organisms/landing/LandingFAQ';
import { LandingCTA } from '@/components/organisms/landing/LandingCTA';
import { LandingFooter } from '@/components/organisms/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative bg-transparent">
      
      {/* Global Ferrofluid Background */}
      <div className="fixed inset-0 w-full h-full flex items-center justify-center" style={{ zIndex: -1, opacity: 0.5 }}>
        <FerrofluidBackground />
      </div>

      <div className="relative z-10 flex flex-col">
        <LandingNavbar />
        <LandingHero />
        <SupportedEcosystem />
        <LandingStats />
        <FeaturesBento />
        <WorkProcess />
        <LandingFAQ />
        <LandingCTA />
        <LandingFooter />
      </div>
    </div>
  );
}
