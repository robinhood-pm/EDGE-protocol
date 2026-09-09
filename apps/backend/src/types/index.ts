export enum Side {
  BUY = 0,
  SELL = 1,
}

export interface Order {
  maker: string;
  signer: string;
  token: string;
  tokenId: string; // Using string for BigInt representation
  price: string;
  amount: string;
  expiration: string;
  nonce: string;
  side: Side;
}

export const EIP712_DOMAIN = {
  name: 'RobinhoodChainPredictionMarket',
  version: '1',
  chainId: 46630, // Testnet
  verifyingContract: '0x0000000000000000000000000000000000000000', // To be filled after deploy
};

export const ORDER_TYPES = {
  Order: [
    { name: 'maker', type: 'address' },
    { name: 'signer', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
    { name: 'expiration', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'side', type: 'uint8' },
  ],
};
