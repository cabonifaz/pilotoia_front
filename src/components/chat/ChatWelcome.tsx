import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/shadcn/skeleton';
import { QueryInputSection } from './QueryInputSection';

interface ChatWelcomeProps {
  logoUrl: string;
  userName: string;
  company: string;
  area: string;
}

export const ChatWelcome = ({ logoUrl, userName, company, area }: ChatWelcomeProps) => {
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  useEffect(() => {
    setIsLogoLoading(true);
  }, [logoUrl]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-center mb-2">
          <div className="w-[148px] min-h-[48px] relative flex items-center justify-center">
            {isLogoLoading && <Skeleton className="w-full h-12 rounded-md" />}
            <img
              key={logoUrl}
              src={logoUrl}
              alt={userName}
              className={cn(
                'w-auto h-auto max-h-12 max-w-full object-contain transition-opacity duration-300',
                isLogoLoading ? 'opacity-0 absolute' : 'opacity-100',
              )}
              onLoad={() => setIsLogoLoading(false)}
              onError={() => setIsLogoLoading(false)}
            />
          </div>
        </div>
        <h3 className="text-3xl font-semibold text-center">
          Bueno verte, {userName}
        </h3>
        <QueryInputSection company={company} area={area} />
      </div>
    </div>
  );
};
