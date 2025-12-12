import { Menu } from 'lucide-react';
import UserDropdown from '../user/UserDropdown';
import CompanyAreaDropdown from '../user/CompanyAreaDropdown';
import { Button } from '../shadcn/button';

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
        {/*<img
          src="/fractal-logo.svg"
          className="h-4 w-auto"
          alt="Logo Fractal"
        />*/}
        <img
          src="/norma-logo.jpg"
          className="h-8 w-auto"
          alt="Logo Norma"
        />
      </div>

      <div className="hidden md:flex items-center gap-4">
        <CompanyAreaDropdown isDisabled={isStreaming} />
        <UserDropdown />
      </div>
    </div>
  );
};

export default Header;