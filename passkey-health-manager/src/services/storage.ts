import { AppState, Passkey, ExportEvent } from '../types';

const STORAGE_KEY = 'passkey_health_manager_data';

const INITIAL_STATE: AppState = {
  passkeys: [],
  exportHistory: [],
  weakKeyDatabase: []
};

export async function getState(): Promise<AppState> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || INITIAL_STATE;
}

export async function saveState(state: AppState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

export async function addPasskey(passkey: Passkey): Promise<void> {
  const state = await getState();
  
  // Check for weak key (collision in database)
  if (state.weakKeyDatabase.includes(passkey.publicKeyHash)) {
    passkey.isWeak = true;
  } else {
    state.weakKeyDatabase.push(passkey.publicKeyHash);
  }
  
  state.passkeys.push(passkey);
  await saveState(state);
}

export async function sharePasskey(id: string): Promise<void> {
  const state = await getState();
  const passkey = state.passkeys.find(p => p.id === id);
  if (passkey) {
    passkey.shareCount += 1;
    await saveState(state);
  }
}

export async function recordExport(destination: string): Promise<void> {
  const state = await getState();
  const event: ExportEvent = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    destination,
    passkeyCount: state.passkeys.length
  };
  state.exportHistory.push(event);
  
  // Increment share count for all passkeys as they are being exported (cloned)
  state.passkeys.forEach(p => {
      p.shareCount += 1;
  });

  await saveState(state);
}

export async function clearState(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEY);
}