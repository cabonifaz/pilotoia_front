import UserDropdown from '../user/UserDropdown';
import { useAuthContext } from '../../contexts/QueryAuthContext';

const Header = () => {
  const { user } = useAuthContext();
  
  // Get actual company and area info
  const actualCompanyArea = (user as any)?.actual_company_area;
  const companyName = actualCompanyArea?.EMPRESA;
  const areaName = actualCompanyArea?.AREA;

  return (
    <div className="flex justify-between items-center px-6 py-2 bg-background border-b">
      <img
        src="/fractal-logo.svg"
        className="h-6 w-auto"
        alt="Logo Fractal"
      />
      <div className="flex items-center gap-4">
        {companyName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{companyName}</span>
            {areaName && (
              <>
                <span>•</span>
                <span>{areaName}</span>
              </>
            )}
          </div>
        )}
        <UserDropdown />
      </div>
    </div>
  );
};

export default Header;