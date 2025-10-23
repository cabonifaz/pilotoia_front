import UserDropdown from '../user/UserDropdown';
import CompanyAreaDropdown from '../user/CompanyAreaDropdown';

interface HeaderProps {
  isStreaming?: boolean;
}

const Header = ({ isStreaming = false }: HeaderProps) => {

  return (
    <div className="flex justify-between items-center px-8 py-4 bg-background border-b">
      <div className="flex items-center gap-6">
        <img
          src="/fractal-logo.svg"
          className="h-4 w-auto"
          alt="Logo Fractal"
        />
      </div>

      <div className="flex items-center gap-4">
        <CompanyAreaDropdown isDisabled={isStreaming} />
        <UserDropdown />
      </div>
    </div>
  );
};

export default Header;