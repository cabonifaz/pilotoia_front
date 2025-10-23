import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Clipboard } from 'lucide-react';
import { Button } from '../shadcn/button';

interface SidebarProps {
  isStreaming?: boolean;
}

const Sidebar = ({ isStreaming = false }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { path: '/rag', label: 'Chat', icon: MessageCircle },
    { path: '/upload', label: 'Documentos', icon: Clipboard },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-[250px] bg-background border-r border-border shadow-sm flex flex-col">
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Button
              key={item.path}
              variant={active ? 'default' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => navigate(item.path)}
              disabled={isStreaming}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
