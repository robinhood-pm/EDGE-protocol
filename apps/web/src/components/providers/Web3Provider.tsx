"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, useAccount } from "wagmi";
import { defineChain } from "viem";
import { toast } from "react-hot-toast";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { logActivity } from "@/lib/logger";
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

// Internal component to listen for connection events
function WalletEventsListener() {
  const { isConnected, isConnecting, address } = useAccount();
  const prevConnectedRef = React.useRef(false);

  React.useEffect(() => {
    if (isConnected && !prevConnectedRef.current) {
      toast.success(`Wallet connected: ${address?.substring(0,6)}...${address?.substring(address.length - 4)}`);
      logActivity('WALLET_CONNECT', { method: 'RainbowKit' }, address);
      prevConnectedRef.current = true;
    } else if (!isConnected && !isConnecting && prevConnectedRef.current) {
      toast.error("Wallet disconnected");
      logActivity('WALLET_DISCONNECT', { method: 'RainbowKit' }, address);
      prevConnectedRef.current = false;
    }
  }, [isConnected, isConnecting, address]);

  return null;
}

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
          <WalletEventsListener />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
