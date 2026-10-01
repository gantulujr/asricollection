import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Shirt, ShoppingBag, Footprints, MessageSquare } from 'lucide-react';

interface BottomNavProps {
  unreadChatCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ unreadChatCount = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: <Home className="w-5 h-5 stroke-[1.8]" />,
    },
    {
      path: '/clothes',
      label: 'Clothes',
      icon: <Shirt className="w-5 h-5 stroke-[1.8]" />,
    },
    {
      path: '/bag',
      label: 'Bag',
      icon: <ShoppingBag className="w-5 h-5 stroke-[1.8]" />,
    },
    {
      path: '/shoes',
      label: 'Shoes',
      icon: <Footprints className="w-5 h-5 stroke-[1.8]" />,
    },
    {
      path: '/livechat',
      label: 'Chat',
      icon: (
        <div className="relative">
          <MessageSquare className="w-5 h-5 stroke-[1.8]" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#C85A32]" />
          )}
        </div>
      ),
    },
  ];

  return (
    <nav className="sticky bottom-0 z-30 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#EAE4DC] flex items-center justify-around h-[58px] px-2 select-none">
      {navItems.map((item) => {
        const isActive =
          item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
              isActive ? 'text-[#C85A32]' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className={`transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
              {item.icon}
            </div>
            <span
              className={`text-[10px] mt-1 font-medium tracking-tight ${
                isActive ? 'font-semibold text-[#C85A32]' : 'text-stone-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
