import UserDropdown from '../user/UserDropdown';
import CompanyAreaDropdown from '../user/CompanyAreaDropdown';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  isStreaming?: boolean;
}

const Header = ({ isStreaming = false }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation options
  const navigationItems = [
    { path: '/rag', label: 'Chat', icon: '💬' },
    { path: '/upload', label: 'Upload', icon: '📁' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex justify-between items-center px-6 py-2 bg-background border-b">
      <div className="flex items-center gap-6">
        <img
          src="/fractal-logo.svg"
          className="h-6 w-auto"
          alt="Logo Fractal"
        />

        {/* Navigation Router */}
        <nav className="flex items-center gap-1">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <CompanyAreaDropdown isDisabled={isStreaming} />
        <UserDropdown />
      </div>
    </div>
  );
};

export default Header;