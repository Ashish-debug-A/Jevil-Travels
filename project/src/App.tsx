import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import DriverPage from './pages/DriverPage';
import OwnerDashboard from './pages/OwnerDashboard';

type Page = { type: 'landing' } | { type: 'driver'; driverId: string } | { type: 'owner' };

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'landing' });

  if (page.type === 'driver') {
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
