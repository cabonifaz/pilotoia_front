import UserDropdown from '../user/UserDropdown';

const Header = () => {
  return (
    <div className="flex justify-between items-center px-6 py-2 bg-background border-b">
      <img
        src="/fractal-logo.svg"
        className="h-6 w-auto"
        alt="Logo Fractal"
      />
      <UserDropdown />
    </div>
  );
};

export default Header;