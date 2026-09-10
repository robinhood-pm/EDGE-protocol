"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const Ferrofluid = dynamic(() => import('@/components/Ferrofluid'), {
  ssr: false,
});

export const FerrofluidBackground = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Ferrofluid
        colors={["#ffffff","#fcddc2","#e6c9ba"]}
        speed={0.6}
        scale={1.1}
        turbulence={0.95}
        fluidity={0.11}
        rimWidth={0.25}
        sharpness={2}
        shimmer={1.5}
        glow={1.9}
        flowDirection="down"
        opacity={1}
        mouseInteraction
        mouseStrength={1.2}
        mouseRadius={0.15}
      />
    </div>
  );
};
