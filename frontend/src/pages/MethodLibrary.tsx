import React from 'react';
import { Box, Container } from '@mui/material';
import { MethodLibrary as MethodLibraryComponent } from '../components/MethodLibrary';

/**
 * Method Library Page Component
 * 
 * This is the main page component that provides a comprehensive interface
 * for managing statistical analysis methods. It includes:
 * 
 * Features:
 * - Browse and search analysis methods
 * - Create new methods from scratch or templates
 * - Edit existing methods and their operations
 * - Manage code templates for different programming contexts
 * - Configure method parameters
 * - Validate method definitions
 * - Preview and export methods
 * - Import/export method libraries
 * 
 * The page uses the MethodLibrary component which provides all the
 * functionality in a comprehensive interface.
 */
const MethodLibraryPage: React.FC = () => {
  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ width: '100%', height: 'calc(100vh - 100px)' }}>
        <MethodLibraryComponent />
      </Box>
    </Container>
  );
};

export default MethodLibraryPage;