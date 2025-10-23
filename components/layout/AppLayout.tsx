import { ReactNode } from 'react';
import { User } from '../../types';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset } from '../ui/sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  currentUser: User;
  onLogout: () => void;
}

export function AppLayout({ children, currentUser, onLogout }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar currentUser={currentUser} />
        <SidebarInset className="flex-1">
          <Header currentUser={currentUser} onLogout={onLogout} />
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}