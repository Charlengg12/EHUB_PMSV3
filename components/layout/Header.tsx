import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LogOut, Shield, Crown } from 'lucide-react';
import { User } from '../../types';
import { CompanyLogo } from '../ui/company-logo';
import { ThemeToggle } from '../ui/theme-toggle';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  currentTheme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
  isTransitioning?: boolean;
}

export function Header({ currentUser, onLogout, currentTheme, onThemeChange, isTransitioning }: HeaderProps) {
  const getRoleIcon = () => {
    switch (currentUser.role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'supervisor':
        return <Shield className="h-4 w-4" />;
      case 'fabricator':
        return <Shield className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return <Badge className="bg-accent text-accent-foreground">Admin</Badge>;
      case 'supervisor':
        return <Badge className="bg-primary text-primary-foreground">Supervisor</Badge>;
      case 'fabricator':
        return <Badge className="bg-secondary text-secondary-foreground">Fabricator</Badge>;
      case 'client':
        return <Badge variant="outline" className="border-primary text-primary">Client</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-card border-b shadow-sm">
      <div className="flex items-center gap-4">
        <CompanyLogo size="md" showText={true} clickable={true} />
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle
          currentTheme={currentTheme}
          onThemeChange={onThemeChange}
          isTransitioning={isTransitioning}
        />

        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
          {getRoleIcon()}
          <div className="text-right">
            <p className="text-sm">{currentUser.name}</p>
            <div className="flex items-center gap-2">
              {getRoleBadge()}
              <span className="text-xs text-muted-foreground font-mono">
                {currentUser.secureId}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="ml-2 border-border hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}