"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Briefcase, TrendingUp, History, Activity, PieChart, 
  ExternalLink, XCircle, User, Edit3, CheckCircle2, Copy, Check, 
  X, Loader2, Sparkles, Camera, Globe 
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/organisms/Header';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { toast } from 'react-hot-toast';

interface UserProfileData {
  id?: string;
  walletAddress: string;
  handle: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string;
  xHandle?: string | null;
  isVerified?: boolean;
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // User Profile state
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false);

  // Profile Edit form states
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editXHandle, setEditXHandle] = useState('');

  // Fetch real user profile from API when wallet is connected
  useEffect(() => {
    if (!address || !isConnected) {
      setProfile(null);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
        const backendUrl = rawApiUrl ? rawApiUrl : '';
        const rawNetwork = process.env.NEXT_PUBLIC_NETWORK;
        const network = rawNetwork ? rawNetwork : 'testnet';

        const res = await fetch(`${backendUrl}/api/profiles/wallet/${address}?network=${network}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            setProfile(data.profile);
            return;
          }
        }

        // Fallback initial state for newly connected wallet
        const defaultHandle = `trader_${address.substring(2, 8).toLowerCase()}`;
        const defaultName = `Trader ${address.substring(0, 6)}`;
        const defaultAvatar = `https://api.dicebear.com/9.x/thumbs/svg?seed=${address}`;
        
        setProfile({
          walletAddress: address,
          handle: defaultHandle,
          displayName: defaultName,
          avatarUrl: defaultAvatar,
          isVerified: true,
        });
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
    };

    fetchUserProfile();
  }, [address, isConnected]);

  // Open Edit Profile modal pre-filled with current state
  const handleOpenEditModal = () => {
    if (!profile && address) {
      setEditDisplayName(`Trader ${address.substring(0, 6)}`);
      setEditHandle(`trader_${address.substring(2, 8).toLowerCase()}`);
      setEditAvatarUrl(`https://api.dicebear.com/9.x/thumbs/svg?seed=${address}`);
      setEditBio('');
      setEditXHandle('');
    } else if (profile) {
      setEditDisplayName(profile.displayName || '');
      setEditHandle(profile.handle || '');
      setEditBio(profile.bio || '');
      setEditAvatarUrl(profile.avatarUrl || `https://api.dicebear.com/9.x/thumbs/svg?seed=${address}`);
      setEditXHandle(profile.xHandle || '');
    }
    setIsEditModalOpen(true);
  };

  // Save profile updates to backend API
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    if (!editDisplayName.trim()) {
      toast.error('Display Name cannot be empty');
      return;
    }
    if (!editHandle.trim()) {
      toast.error('Username / Handle cannot be empty');
      return;
    }

    setIsSavingProfile(true);

    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
      const backendUrl = rawApiUrl ? rawApiUrl : '';

      const res = await fetch(`${backendUrl}/api/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address.toLowerCase(),
          handle: editHandle.trim(),
          displayName: editDisplayName.trim(),
          bio: editBio.trim(),
          avatarUrl: editAvatarUrl.trim(),
          xHandle: editXHandle.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update profile');
      }

      const responseData = await res.json();
      const updatedProfile = responseData.profile || {
        walletAddress: address,
        handle: editHandle.trim(),
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl.trim(),
        xHandle: editXHandle.trim(),
        isVerified: true,
      };

      setProfile(updatedProfile);
      toast.success('Profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const copyAddressToClipboard = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setHasCopiedAddress(true);
    toast.success('Wallet address copied to clipboard');
    setTimeout(() => setHasCopiedAddress(false), 2000);
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancelingId(orderId);
      const signature = await signMessageAsync({ message: `Cancel Order: ${orderId}` });
      
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
      const backendUrl = rawApiUrl ? rawApiUrl : '';
      const res = await fetch(`${backendUrl}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel order');
      }

      queryClient.invalidateQueries({ queryKey: ['portfolio', address] });
    } catch (err: any) {
      console.error("Cancel failed:", err);
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setCancelingId(null);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio', address],
    queryFn: async () => {
      if (!address) return null;
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
      const backendUrl = rawApiUrl ? rawApiUrl : '';
      const res = await fetch(`${backendUrl}/api/portfolio/${address}`);
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      return res.json();
    },
    enabled: !!address,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <Briefcase className="w-10 h-10 text-muted" />
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">Connect Wallet</h1>
          <p className="text-muted max-w-md mb-8">Please connect your wallet to view your profile, active positions, trading history, and portfolio analytics.</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  const positions = data?.positions || [];
  const history = data?.history || [];
  const totalInvested = positions.reduce((acc: number, pos: any) => acc + pos.totalInvested, 0);
  const totalPositions = positions.length;

  const currentAvatar = profile?.avatarUrl || `https://api.dicebear.com/9.x/thumbs/svg?seed=${address}`;
  const currentDisplayName = profile?.displayName || `Trader ${address?.substring(0, 6)}`;
  const currentHandle = profile?.handle || `trader_${address?.substring(2, 8).toLowerCase()}`;
  const currentXHandle = profile?.xHandle || '';
  const currentBio = profile?.bio || '';

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-white">
      <Header />
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 space-y-8">

        {/* User Profile Card Header */}
        <div className="bg-[#0b0e14] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yes/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar Box */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#151924] border-2 border-yes/40 overflow-hidden shadow-xl shrink-0">
                  <img src={currentAvatar} alt={currentDisplayName} className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={handleOpenEditModal}
                  className="absolute -bottom-1 -right-1 bg-yes text-black p-1.5 rounded-lg shadow-lg hover:scale-110 transition-all"
                  title="Change Avatar"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Account Meta */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{currentDisplayName}</h1>
                  <CheckCircle2 className="w-5 h-5 text-yes fill-yes/20" />
                  <Badge variant="secondary" className="bg-yes/10 text-yes border-yes/30 text-[11px] font-bold">
                    VERIFIED TRADER
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/60 flex-wrap">
                  <span className="font-mono text-white/80">@{currentHandle}</span>
                  <span>•</span>
                  {/* Wallet address badge */}
                  <button 
                    onClick={copyAddressToClipboard} 
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-colors font-mono text-xs text-white/70"
                  >
                    <span>{address?.substring(0, 6)}...{address?.substring(address.length - 4)}</span>
                    {hasCopiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                  </button>
                </div>

                {/* X (Twitter) Link */}
                {currentXHandle && (
                  <div className="pt-1">
                    <a
                      href={currentXHandle.startsWith('http') ? currentXHandle : `https://x.com/${currentXHandle.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>x.com/{currentXHandle.replace(/^https?:\/\/(www\.)?x\.com\//, '').replace(/^@/, '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Bio text */}
                {currentBio && (
                  <p className="text-xs sm:text-sm text-white/80 pt-1 leading-relaxed max-w-xl">
                    {currentBio}
                  </p>
                )}
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleOpenEditModal}
                className="w-full sm:w-auto font-bold gap-2 bg-white text-black hover:bg-white/90 rounded-xl px-5 h-10 text-xs shadow-lg"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Portfolio Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16 text-yes" />
            </div>
            <div className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
              Total Invested Value
            </div>
            <div className="text-3xl font-bold tracking-tight text-white">${totalInvested.toFixed(2)}</div>
          </div>
          
          <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <PieChart className="w-16 h-16 text-emerald-400" />
            </div>
            <div className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
              Active Open Positions
            </div>
            <div className="text-3xl font-bold tracking-tight text-white">{totalPositions}</div>
          </div>
          
          <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-16 h-16 text-sky-400" />
            </div>
            <div className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
              Total Trades Executed
            </div>
            <div className="text-3xl font-bold tracking-tight text-white">{history.length}</div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="flex space-x-1 border-b border-white/10">
          <button
            onClick={() => setActiveTab('positions')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'positions' ? 'text-white font-bold' : 'text-white/50 hover:text-white/80'}`}
          >
            <span className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span>Active Positions ({totalPositions})</span>
            </span>
            {activeTab === 'positions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yes rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'history' ? 'text-white font-bold' : 'text-white/50 hover:text-white/80'}`}
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Transaction History ({history.length})</span>
            </span>
            {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yes rounded-t-full" />}
          </button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-yes" />
            <p className="text-sm">Loading portfolio data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-sm">
            Failed to load portfolio positions. Please refresh to try again.
          </div>
        ) : activeTab === 'positions' ? (
          /* Positions View */
          positions.length === 0 ? (
            <div className="text-center py-20 bg-[#0b0e14] border border-white/10 rounded-2xl border-dashed space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                <PieChart className="w-8 h-8 text-white/40" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1 text-white">No Active Positions</h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto">You don't have any active positions yet. Open a position in Perps to start building your portfolio.</p>
              </div>
              <Link href="/perps" className="inline-block">
                <Button className="bg-yes text-black font-bold text-xs h-10 px-6 rounded-xl hover:bg-yes/90">
                  Trade Perps Markets
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {positions.map((pos: any) => (
                <div key={pos.marketId || pos.id} className="bg-[#0b0e14] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-white/5">
                        {pos.marketImage ? (
                          <img src={pos.marketImage} alt={pos.marketTitle} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-white/40">Market</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-white truncate">{pos.marketTitle || pos.marketId}</h3>
                        <div className="text-xs text-white/50 mt-0.5 flex items-center gap-2">
                          <span>Invested: <strong className="text-white">${pos.totalInvested?.toFixed(2) || '0.00'}</strong></span>
                          <span>•</span>
                          <Link href={`/market/${pos.marketSlug || pos.marketId}`} className="hover:text-yes flex items-center gap-0.5 text-xs text-white/70">
                            <span>Market</span> <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      OPEN
                    </Badge>
                  </div>

                  <div className="flex gap-3 shrink-0 bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-xs justify-around">
                    <div className="text-center">
                      <div className="text-[10px] text-white/40 font-bold mb-0.5 uppercase">YES Shares</div>
                      <div className="font-bold text-yes text-base">{Number(pos.yesShares || 0).toFixed(1)}</div>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="text-center">
                      <div className="text-[10px] text-white/40 font-bold mb-0.5 uppercase">NO Shares</div>
                      <div className="font-bold text-no text-base">{Number(pos.noShares || 0).toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* History View */
          history.length === 0 ? (
            <div className="text-center py-20 bg-[#0b0e14] border border-white/10 rounded-2xl border-dashed space-y-3">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                <History className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-xl font-bold text-white">No Transaction History</h3>
              <p className="text-xs text-white/50 max-w-xs mx-auto">Your trading activity and orders will appear here once executed.</p>
            </div>
          ) : (
            <div className="bg-[#0b0e14] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/50 border-b border-white/10 text-white/40 text-xs uppercase tracking-wider font-mono">
                      <th className="py-4 px-6 font-semibold">Date</th>
                      <th className="py-4 px-6 font-semibold">Market</th>
                      <th className="py-4 px-6 font-semibold">Side</th>
                      <th className="py-4 px-6 font-semibold">Price</th>
                      <th className="py-4 px-6 font-semibold">Status</th>
                      <th className="py-4 px-6 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-mono">
                    {history.map((order: any) => (
                      <tr 
                        key={order.id} 
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-6 text-white/70 whitespace-nowrap">
                          <div className="font-medium text-white">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                          <div className="text-[10px] text-white/40">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="py-4 px-6 font-medium text-white max-w-[200px] truncate">
                          {order.markets?.title || order.market_id || 'Market'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${order.side === 'YES' ? 'bg-yes/10 text-yes border-yes/20' : 'bg-no/10 text-no border-no/20'}`}>
                            {order.side}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-white">{Number(order.price).toFixed(1)}¢</td>
                        <td className="py-4 px-6">
                          <span className="text-emerald-400 font-bold">{order.status}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={cancelingId === order.id}
                              className="px-3 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-bold disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>

      {/* Edit Profile Modal Dialog */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0b0e14] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yes" />
              <h2 className="text-lg font-bold text-white tracking-tight">Edit Profile</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Avatar Selector */}
              <div>
                <label className="block font-semibold text-white/70 uppercase tracking-wider mb-2">
                  Avatar Image URL *
                </label>
                <div className="flex gap-3 items-center mb-2">
                  <img src={editAvatarUrl} alt="Preview" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 shrink-0 object-cover" />
                  <input
                    type="text"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-yes text-xs"
                  />
                </div>

                {/* Preset Avatar Selector */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {['CryptoWhale', 'MacroMaster', 'EthMaxi', 'TechBear', 'AlphaHunter', 'Robinhood'].map((seed) => {
                    const presetUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setEditAvatarUrl(presetUrl)}
                        className={`w-9 h-9 rounded-lg border overflow-hidden transition-all shrink-0 ${
                          editAvatarUrl === presetUrl ? 'border-yes ring-2 ring-yes/40 scale-105' : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={presetUrl} alt={seed} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="e.g. Satoshi Nakamoto"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-yes font-medium text-xs"
                  maxLength={50}
                />
              </div>

              {/* Handle / Username */}
              <div>
                <label className="block font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Username / Handle *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-mono text-xs">@</span>
                  <input
                    type="text"
                    value={editHandle}
                    onChange={(e) => setEditHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="username"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-yes font-mono text-xs"
                    maxLength={30}
                  />
                </div>
              </div>

              {/* X / Twitter Link */}
              <div>
                <label className="block font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  X (Twitter) Link / Handle
                </label>
                <input
                  type="text"
                  value={editXHandle}
                  onChange={(e) => setEditXHandle(e.target.value)}
                  placeholder="e.g. CryptoWhale or https://x.com/CryptoWhale"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-yes text-xs"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Bio / Description
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  placeholder="Share your trading style or bio..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-yes text-xs leading-relaxed"
                  maxLength={160}
                />
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={isSavingProfile}
                className="w-full bg-yes text-black hover:bg-yes/90 font-bold h-10 rounded-xl text-xs mt-2"
              >
                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Profile Updates'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

