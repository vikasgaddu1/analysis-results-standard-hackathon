import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { AuthProvider } from '../contexts/AuthContext';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

// Create a wrapper component with all providers
const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <BrowserRouter>
          <AuthProvider>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  fullName: 'Test User',
  isActive: true,
  isSuperuser: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockAnalysis = (overrides = {}) => ({
  id: 'AN001',
  version: '1.0',
  name: 'Test Analysis',
  description: 'Test analysis description',
  reason: 'SPECIFIED',
  purpose: 'PRIMARY_OUTCOME_MEASURE',
  dataset: 'ADSL',
  variable: 'AGE',
  methodId: 'METHOD001',
  reportingEventId: 'RE001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockMethod = (overrides = {}) => ({
  id: 'METHOD001',
  name: 'Descriptive Statistics',
  description: 'Calculate mean and standard deviation',
  label: 'Mean (SD)',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockOutput = (overrides = {}) => ({
  id: 'OUT001',
  version: '1.0',
  name: 'Demographics Table',
  fileType: 'rtf',
  display: {
    order: 1,
    outputId: 'OUT001',
    displayTitle: 'Table 1: Demographics',
    displaySections: [],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockWhereClause = (overrides = {}) => ({
  id: 'WC001',
  label: 'Safety Population',
  level: 1,
  order: 1,
  condition: {
    dataset: 'ADSL',
    variable: 'SAFFL',
    comparator: 'EQ',
    value: ['Y'],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});