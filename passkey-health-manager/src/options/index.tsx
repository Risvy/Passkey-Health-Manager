import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import { AppState } from '../types';
import { getState } from '../services/storage';
import { Shield, AlertTriangle, Share2, Download, CheckCircle, XCircle } from 'lucide-react';

function Options() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    loadState();
    
    // Listen for storage changes to update in real-time
    const listener = () => loadState();
    chrome.storage.onChanged.addListener(listener);
    
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const loadState = async () => {
    const s = await getState();
    setState(s);
  };

  if (!state) {
    return <div className="p-8">Loading...</div>;
  }

  const totalPasskeys = state.passkeys.length;
  const weakPasskeys = state.passkeys.filter(p => p.isWeak).length;
  const healthyPasskeys = totalPasskeys - weakPasskeys;
  const highShareCount = state.passkeys.filter(p => p.shareCount >= 3).length;
  const totalShares = state.passkeys.reduce((sum, p) => sum + p.shareCount, 0);
  const avgShareCount = totalPasskeys > 0 ? (totalShares / totalPasskeys).toFixed(1) : '0';
  const totalExports = state.exportHistory.length;

  const healthScore = totalPasskeys > 0 
    ? Math.round(((healthyPasskeys / totalPasskeys) * 100))
    : 100;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Passkey Health Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive security audit of your passkey vault</p>
        </div>

        {/* Health Score Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Overall Health Score</h2>
              <div className="text-6xl font-bold">{healthScore}%</div>
              <p className="mt-2 text-blue-100">
                {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Poor'} security posture
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl mb-2">
                {healthScore >= 80 ? '🛡️' : healthScore >= 60 ? '✅' : healthScore >= 40 ? '⚠️' : '❌'}
              </div>
              <p className="text-sm text-blue-100">
                {healthyPasskeys} of {totalPasskeys} keys are healthy
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Total Passkeys</h3>
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalPasskeys}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Weak Keys</h3>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">{weakPasskeys}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Total Shares</h3>
              <Share2 className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalShares}</p>
            <p className="text-xs text-gray-500 mt-1">Avg: {avgShareCount} per key</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Total Exports</h3>
              <Download className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalExports}</p>
          </div>
        </div>

        {/* Detailed Passkey Health */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Passkey Health Details
          </h2>
          
          {state.passkeys.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No passkeys to display</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Website</th>
                    <th className="text-left py-3 px-4">Username</th>
                    <th className="text-center py-3 px-4">Share Count</th>
                    <th className="text-center py-3 px-4">Created</th>
                    <th className="text-center py-3 px-4">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {state.passkeys.map(pk => {
                    const age = Math.floor((Date.now() - pk.createdAt) / (1000 * 60 * 60 * 24));
                    const isHighShare = pk.shareCount >= 3;
                    
                    return (
                      <tr key={pk.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {pk.isWeak ? (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-5 h-5" />
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-5 h-5" />
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium">{pk.rpId}</td>
                        <td className="py-3 px-4 text-gray-600">{pk.username}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-mono font-bold ${isHighShare ? 'text-orange-600' : 'text-gray-900'}`}>
                            {pk.shareCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-500">
                          {age === 0 ? 'Today' : `${age}d ago`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {pk.isWeak ? (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Compromised</span>
                          ) : isHighShare ? (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">High Risk</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Healthy</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            Security Recommendations
          </h2>
          <div className="space-y-3">
            {weakPasskeys > 0 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Critical: Weak Keys Detected</h3>
                  <p className="text-sm text-red-700">
                    You have {weakPasskeys} passkey{weakPasskeys > 1 ? 's' : ''} with weak or compromised key generation. 
                    Delete and recreate these passkeys immediately.
                  </p>
                </div>
              </div>
            )}
            
            {highShareCount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900">Warning: High Share Count</h3>
                  <p className="text-sm text-orange-700">
                    {highShareCount} passkey{highShareCount > 1 ? 's have' : ' has'} been shared 3+ times. 
                    Consider rotating these keys to reduce exposure.
                  </p>
                </div>
              </div>
            )}
            
            {weakPasskeys === 0 && highShareCount === 0 && totalPasskeys > 0 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">All Clear!</h3>
                  <p className="text-sm text-green-700">
                    Your passkey vault is healthy. No immediate action required.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export History */}
        {state.exportHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Download className="w-6 h-6 text-purple-600" />
              Export History
            </h2>
            <div className="space-y-3">
              {state.exportHistory.map(evt => (
                <div key={evt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(evt.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Destination: <span className="font-mono">{evt.destination}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{evt.passkeyCount} passkeys</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);