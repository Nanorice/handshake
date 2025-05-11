import React, { memo } from 'react';
import { Container } from '@mui/material';
import ProfessionalPublicProfileSetup from '../components/Profile/ProfessionalPublicProfileSetup';

/**
 * Page container for the Professional Public Profile Setup
 * Wraps the component in a proper container to avoid layout issues
 * Using memo to prevent unnecessary re-renders
 */
const PublicProfileSetupPage = memo(() => {
  // Create a stable component key to prevent remounting
  const stableKey = 'professional-profile-setup';
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Key prop ensures the component instance remains stable */}
      <ProfessionalPublicProfileSetup key={stableKey} />
    </Container>
  );
});

export default PublicProfileSetupPage; 