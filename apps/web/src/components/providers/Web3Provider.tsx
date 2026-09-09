"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { defineChain } from "viem";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const robinhoodChain = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID),
  name: process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_NAME as string,
  nativeCurrency: { name: "Robinhood Coin", symbol: "RHC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL as string
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL as string
      ],
    },
  },
  blockExplorers: {
    default: { 
      name: "RobinhoodExplorer", 
      url: process.env.NEXT_PUBLIC_ROBINHOOD_EXPLORER_URL as string
    },
  },
  testnet: process.env.NEXT_PUBLIC_IS_TESTNET === "true",
});

const config = getDefaultConfig({
  appName: "Edge Protocol",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string,
  chains: [robinhoodChain],
  ssr: true, // Since we are using Next.js App Router
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config as any}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "rgba(255, 255, 255, 0.1)",
            accentColorForeground: "white",
            borderRadius: "large",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
