import './index.css';
import './i18n/index.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  MantineProvider,
  createTheme,
  localStorageColorSchemeManager,
  ColorSchemeScript,
} from '@mantine/core';
import { Dashboard } from './pages/Dashboard.js';
import { ContractList } from './pages/ContractList.js';
import { ContractNew } from './pages/ContractNew.js';
import { ContractEdit } from './pages/ContractEdit.js';
import { ContractImport } from './pages/ContractImport.js';
import { SignIn } from './pages/SignIn.js';
import { AcceptInvitation } from './pages/AcceptInvitation.js';
import { AccountSettings } from './pages/AccountSettings.js';
import { AccountsAdmin } from './pages/admin/AccountsAdmin.js';
import { AppShell } from './components/AppShell/AppShell.js';
import { RequireAuth } from './components/RequireAuth.js';
import { RequireAdmin } from './components/RequireAdmin.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const theme = createTheme({});
const colorSchemeManager = localStorageColorSchemeManager({ key: 'pcm-color-scheme' });

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="auto" />
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="auto"
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/invitations/:token" element={<AcceptInvitation />} />
            <Route
              path="*"
              element={
                <RequireAuth>
                  <AppShell>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/contracts" element={<ContractList />} />
                      <Route path="/contracts/new" element={<ContractNew />} />
                      <Route path="/contracts/import" element={<ContractImport />} />
                      <Route path="/contracts/:id/edit" element={<ContractEdit />} />
                      <Route path="/account" element={<AccountSettings />} />
                      <Route
                        path="/admin/accounts"
                        element={
                          <RequireAdmin>
                            <AccountsAdmin />
                          </RequireAdmin>
                        }
                      />
                    </Routes>
                  </AppShell>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);
