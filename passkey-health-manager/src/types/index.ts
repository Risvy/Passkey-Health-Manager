export interface Passkey {
  id: string;
  rpId: string;
  username: string;
  createdAt: number;
  publicKey: string;
  publicKeyHash: string;
  shareCount: number;
  isWeak: boolean;
}

export interface ExportEvent {
  id: string;
  timestamp: number;
  destination: string;
  passkeyCount: number;
}

export interface AppState {
  passkeys: Passkey[];
  exportHistory: ExportEvent[];
  weakKeyDatabase: string[];
}