import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const rpcUrl = process.env.PRIVATE_ROBINHOOD_RPC_URL;
  
  if (!rpcUrl) {
    return NextResponse.json({ error: 'RPC URL not configured on server' }, { status: 500 });
  }

  try {
    const body = await req.json();

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[RPC Proxy Error]', error);
    return NextResponse.json({ error: 'Failed to proxy RPC request' }, { status: 500 });
  }
}
