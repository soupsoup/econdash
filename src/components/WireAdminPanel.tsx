import React, { useEffect, useState } from 'react';

export default function WireAdminPanel() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [interval, setInterval] = useState<number>(60);
  const [newAccount, setNewAccount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/wire-settings')
      .then(res => res.json())
      .then(data => {
        setAccounts(data.accounts || []);
        setInterval(data.interval || 60);
      });
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/wire-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts, interval }),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addAccount = () => {
    if (newAccount && !accounts.includes(newAccount)) {
      setAccounts([...accounts, newAccount]);
      setNewAccount('');
    }
  };

  const removeAccount = (acc: string) => {
    setAccounts(accounts.filter(a => a !== acc));
  };

  return (
    <div className="p-4 border rounded bg-white max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Wire Service Admin Panel</h2>
      <div className="mb-4">
        <label className="block font-medium mb-1">Nitter Accounts</label>
        <div className="flex mb-2">
          <input
            type="text"
            value={newAccount}
            onChange={e => setNewAccount(e.target.value)}
            className="border px-2 py-1 mr-2 flex-1"
            placeholder="Add Nitter username"
          />
          <button onClick={addAccount} className="bg-blue-500 text-white px-3 py-1 rounded">Add</button>
        </div>
        <ul>
          {accounts.map(acc => (
            <li key={acc} className="flex items-center justify-between mb-1">
              <span>@{acc}</span>
              <button onClick={() => removeAccount(acc)} className="text-red-500 ml-2">Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Update Interval (seconds)</label>
        <input
          type="number"
          min={10}
          value={interval}
          onChange={e => setInterval(Number(e.target.value))}
          className="border px-2 py-1 w-24"
        />
      </div>
      <button onClick={saveSettings} className="bg-green-600 text-white px-4 py-2 rounded" disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
} 