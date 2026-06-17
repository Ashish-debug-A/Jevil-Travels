import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import DriverPage from './pages/DriverPage';
import OwnerDashboard from './pages/OwnerDashboard';
import { isValidUUID } from './lib/validation';

type Page = { type: 'landing' } | { type: 'driver'; driverId: string } | { type: 'owner' };

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'landing' });

  if (page.type === 'driver') {
    if (!isValidUUID(page.driverId)) {
      return (
        <div className="page-container flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-400 text-sm mb-4">Invalid driver ID</p>
            <button
              onClick={() => setPage({ type: 'landing' })}
              className="text-brand-500 text-sm font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
    return (
      <DriverPage
        driverId={page.driverId}
        onBack={() => setPage({ type: 'landing' })}
      />
    );
  }

  if (page.type === 'owner') {
    return (
      <OwnerDashboard
        onBack={() => setPage({ type: 'landing' })}
      />
    );
  }

  return (
    <LandingPage
      onSelectDriver={(id) => setPage({ type: 'driver', driverId: id })}
      onOpenOwner={() => setPage({ type: 'owner' })}
    />
  );
}
