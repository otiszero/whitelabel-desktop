import { Routes, Route, NavLink } from 'react-router-dom';
import { Home, Wallet, PenTool, BookOpen, History, Settings } from 'lucide-react';

// Import pages
import WalletsPage from './pages/wallets';
import SignPage from './pages/sign';

// Dashboard page
function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-slate-400">Welcome to AirGap Wallet. Your keys never leave this device.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['BTC', 'ETH', 'XRP', 'TRON'].map(chain => (
          <div key={chain} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold">{chain}</h3>
            <p className="text-sm text-slate-400 mt-1">No wallet</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-green-900/20 border border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-400 font-medium">Air-Gap Mode Active</span>
        </div>
        <p className="text-green-300/70 text-sm mt-1">
          No network connections are allowed. All transactions are signed offline.
        </p>
      </div>
    </div>
  );
}

// Address book page
function AddressBookPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Address Book</h1>
      <p className="text-slate-400">Save frequently used addresses here.</p>
      <div className="mt-6 text-center py-12 bg-slate-800 rounded-lg">
        <p className="text-slate-500">No saved addresses yet</p>
      </div>
    </div>
  );
}

// History page
function HistoryPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Transaction History</h1>
      <p className="text-slate-400">View your signed transactions.</p>
      <div className="mt-6 text-center py-12 bg-slate-800 rounded-lg">
        <p className="text-slate-500">No transactions signed yet</p>
      </div>
    </div>
  );
}

// Settings page
function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <div className="space-y-6 max-w-lg">
        <div className="p-4 bg-slate-800 rounded-lg">
          <h2 className="font-semibold mb-2">Security</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Auto-lock timeout</span>
              <select className="bg-slate-700 rounded px-2 py-1">
                <option>5 minutes</option>
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>Never</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800 rounded-lg">
          <h2 className="font-semibold mb-2">About</h2>
          <div className="space-y-1 text-sm text-slate-400">
            <p>AirGap Wallet v1.0.0</p>
            <p>Electron {process.versions?.electron || 'N/A'}</p>
            <p>Node {process.versions?.node || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sidebar navigation
const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/wallets', label: 'Wallets', icon: Wallet },
  { path: '/sign', label: 'Sign', icon: PenTool },
  { path: '/address-book', label: 'Address Book', icon: BookOpen },
  { path: '/history', label: 'History', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function App() {
  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-blue-400">AirGap Wallet</h1>
          <p className="text-xs text-slate-500 mt-1">Offline • Secure • Private</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Air-Gapped Mode Active</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wallets" element={<WalletsPage />} />
          <Route path="/sign" element={<SignPage />} />
          <Route path="/address-book" element={<AddressBookPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
