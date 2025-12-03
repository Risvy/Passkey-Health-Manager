import { useEffect, useState } from 'react';
import { AppState, Passkey } from '../types';
import { getState, addPasskey, sharePasskey, recordExport, clearState } from '../services/storage';
import { generateRandomPublicKey, hashPublicKey } from '../services/crypto';
import { Shield, Share2, Download, AlertTriangle, Plus } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [view, setView] = useState<'list' | 'add' | 'export'>('list');
  
  // Form state
  const [rpId, setRpId] = useState('example.com');
  const [username, setUsername] = useState('user@example.com');
  const [simulateWeak, setSimulateWeak] = useState(false);
  const [exportDest, setExportDest] = useState('');

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    const s = await getState();
    setState(s);
  };

  const handleAddPasskey = async () => {
    let publicKey: string;
    let publicKeyHash: string;

    if (simulateWeak && state && state.passkeys.length > 0) {
      // Simulate weak key by reusing an existing one
      const existing = state.passkeys[0];
      publicKey = existing.publicKey;
      publicKeyHash = existing.publicKeyHash;
    } else {
      publicKey = generateRandomPublicKey();
      publicKeyHash = await hashPublicKey(publicKey);
    }

    const newPasskey: Passkey = {
      id: crypto.randomUUID(),
      rpId,
      username,
      createdAt: Date.now(),
      publicKey,
      publicKeyHash,
      shareCount: 1, // Initial count is 1
      isWeak: false // Will be checked in service
    };

    await addPasskey(newPasskey);
    await loadState();
    setView('list');
  };

  const handleShare = async (id: string) => {
    await sharePasskey(id);
    await loadState();
  };

  const handleExport = async () => {
    if (!exportDest) return;
    await recordExport(exportDest);
    await loadState();
    setView('list');
    setExportDest('');
  };
  
  const handleClear = async () => {
      if(confirm("Are you sure you want to clear all data?")) {
          await clearState();
          await loadState();
      }
  }

  if (!state) return <div className="p-4">Loading...</div>;

  const openHealthDashboard = () => {
    chrome.runtime.openOptionsPage();
  };

  const totalPasskeys = state?.passkeys.length || 0;
  const weakPasskeys = state?.passkeys.filter(p => p.isWeak).length || 0;
  const healthyPasskeys = totalPasskeys - weakPasskeys;
  const healthScore = totalPasskeys > 0 
    ? Math.round(((healthyPasskeys / totalPasskeys) * 100))
    : 100;

  return (
    <div className="flex flex-col h-full bg-gray-50 min-w-[500px] min-h-[650px]">
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Shield className="w-5 h-5" /> Passkey Health
        </h1>
        <button onClick={handleClear} className="text-xs bg-blue-700 px-2 py-1 rounded hover:bg-blue-800">Reset</button>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {view === 'list' && (
          <div className="space-y-4">
            {/* Health Summary Card */}
            <div 
              onClick={openHealthDashboard}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-medium opacity-90">Health Score</h2>
                  <div className="text-3xl font-bold mt-1">{healthScore}%</div>
                  <p className="text-xs mt-1 opacity-80">
                    {healthyPasskeys} of {totalPasskeys} keys healthy
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl mb-1">
                    {healthScore >= 80 ? '🛡️' : healthScore >= 60 ? '✅' : healthScore >= 40 ? '⚠️' : '❌'}
                  </div>
                  <p className="text-xs opacity-80 underline">View Details →</p>
                </div>
              </div>
              {weakPasskeys > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">{weakPasskeys} weak key{weakPasskeys > 1 ? 's' : ''} detected</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-500 uppercase">Your Vault</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setView('export')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Export Vault"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setView('add')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Add Passkey"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {state.passkeys.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No passkeys found. Add one to start.
              </div>
            ) : (
              state.passkeys.map(pk => (
                <div key={pk.id} className={`bg-white p-4 rounded-lg shadow border-l-4 ${pk.isWeak ? 'border-red-500' : 'border-green-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{pk.rpId}</h3>
                      <p className="text-sm text-gray-500">{pk.username}</p>
                    </div>
                    {pk.isWeak && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Weak
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3 bg-gray-50 p-2 rounded">
                    <div className="flex flex-col">
                      <span className="text-gray-400">Share Count</span>
                      <span className={`font-mono font-bold ${pk.shareCount > 1 ? 'text-orange-600' : 'text-green-600'}`}>
                        {pk.shareCount}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                       <button 
                        onClick={() => handleShare(pk.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-1"
                      >
                        <Share2 className="w-3 h-3" /> Share
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {state.exportHistory.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Export History</h2>
                    <div className="space-y-2">
                        {state.exportHistory.map(evt => (
                            <div key={evt.id} className="bg-white p-3 rounded shadow-sm text-xs">
                                <div className="flex justify-between">
                                    <span className="font-medium">{new Date(evt.timestamp).toLocaleString()}</span>
                                    <span className="text-gray-500">{evt.passkeyCount} keys</span>
                                </div>
                                <div className="text-gray-600 mt-1">
                                    To: <span className="font-mono">{evt.destination}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}

        {view === 'add' && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-bold text-lg mb-4">Add New Passkey</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Relying Party (Website)</label>
                <input 
                  type="text" 
                  value={rpId}
                  onChange={e => setRpId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                <input 
                  type="checkbox" 
                  id="weak"
                  checked={simulateWeak}
                  onChange={e => setSimulateWeak(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="weak" className="text-sm text-yellow-800 font-medium">
                  Simulate Weak Key Generation
                </label>
              </div>
              <p className="text-xs text-gray-500">
                If checked, this will generate a key that collides with an existing one (if any), triggering the "Weak Key" alert.
              </p>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setView('list')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddPasskey}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Passkey
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'export' && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-bold text-lg mb-4">Export Vault</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Exporting your vault will create a backup. This action is tracked in your Passkey Health history.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination / Recipient</label>
                <input 
                  type="text" 
                  value={exportDest}
                  onChange={e => setExportDest(e.target.value)}
                  placeholder="e.g., Backup Drive, iPhone, John Doe"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Helps track where your keys are going.</p>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setView('list')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleExport}
                  disabled={!exportDest}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Confirm Export
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}