import { Entity } from "@allenzhong/squid-mongo";

export interface ITransfer extends Entity {
  id: string;
  contractAddress: string;
  tokenId: string;
  from: string;
  to: string;
  timestamp: Date;
  blockNumber: number;
  txHash: string;
}

export interface IOwner extends Entity {
  address: string;
}

export interface IToken extends Entity {
  owner: string;
  tokenId: string;
  contractAddress: string;
}
