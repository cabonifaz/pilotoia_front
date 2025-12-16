import { Menu } from 'lucide-react';
import UserDropdown from '../user/UserDropdown';
import CompanyAreaDropdown from '../user/CompanyAreaDropdown';
import { Button } from '../shadcn/button';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';

interface HeaderProps {
  isStreaming?: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const Header = ({
  isStreaming = false,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: HeaderProps) => {
  const { user } = useQueryAuthContext();
  const actualCompanyArea = (user as any)?.actual_company_area;

  // Determine logo URL based on company logo
  const logoUrl = actualCompanyArea?.LOGO
    ? `${import.meta.env.VITE_LOGO_URL_BASE}${actualCompanyArea.LOGO}`
    : '/fractal-logo.svg';

  return (
    <div className="flex justify-between items-center px-4 md:px-8 py-4 bg-background border-b">
      <div className="flex items-center gap-4 md:gap-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="w-[98px] flex items-center justify-center">
          <img
            src={logoUrl}
            alt={actualCompanyArea?.RAZON_SOCIAL || "Logo Fractal"}
            className="w-auto h-auto min-h-4 max-h-8 max-w-full object-contain"
          />
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <CompanyAreaDropdown isDisabled={isStreaming} />
        <UserDropdown />
      </div>
    </div>
  );
};

export default Header;