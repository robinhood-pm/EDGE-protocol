export const logActivity = async (action: string, details?: any, walletAddress?: string) => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) return;
    
    // Fire and forget
    fetch(`${backendUrl}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        wallet_address: walletAddress,
        details,
      }),
    }).catch(console.error); // Silently catch network errors so it doesn't break UI
  } catch (error) {
    console.error('Failed to send activity log', error);
  }
};
