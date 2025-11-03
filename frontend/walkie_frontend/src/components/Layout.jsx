// src/components/Layout.jsx (Corrigido)

import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Home,
  User,
  MapPin,
  Trophy,
  Heart, // <-- Mantido, pois é usado no item 'Pets'
  LogOut,
  Menu,
  X
} from 'lucide-react';
import logo from '@/assets/LOGO-PRPL.png'; // 1. IMPORTAR O LOGO

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Perfil' },
    { path: '/pets', icon: Heart, label: 'Pets' },
    { path: '/walk', icon: MapPin, label: 'Passeio' },
    { path: '/ranking', icon: Trophy, label: 'Ranking' }
  ];

  const NavLink = ({ item, onClick }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <li key={item.path}>
        <Link
          to={item.path}
          onClick={onClick}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive
              ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side: Logo and Mobile Menu Trigger */}
            <div className="flex items-center">
              {/* Mobile Menu Button - shown only on small screens */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                
                <SheetTrigger asChild className="md:hidden mr-4">
                  <Button variant="ghost" size="icon">
                    <span> 
                      <Menu className="w-6 h-6" />
                      <span className="sr-only">Abrir menu</span>
                    </span>
                  </Button>
                </SheetTrigger>
                
                <SheetContent side="left" className="w-64 p-4"> {/* Mobile Sidebar */}
                   <div className="flex justify-between items-center mb-6">
                     
                     {/* 2. LOGO PADRONIZADO (Mobile Menu) */}
                     <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                       {/* Substituí o ícone e o texto pelo seu logo */}
                       <img src={logo} alt="Walkie Logo" className="h-8" /> 
                     </Link>

                      <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                        <X className="w-6 h-6" />
                        <span className="sr-only">Fechar menu</span>
                      </Button>
                   </div>
                   <nav>
                    <ul className="space-y-2">
                      {navItems.map((item) => (
                        <NavLink key={item.path} item={item} onClick={() => setIsMobileMenuOpen(false)} />
                      ))}
                    </ul>
                   </nav>
                </SheetContent>
              </Sheet>

              {/* 3. LOGO PADRONIZADO (Header Principal) */}
              <Link to="/dashboard" className="flex items-center">
                {/* Substituí o ícone e o texto pelo seu logo */}
                <img src={logo} alt="Walkie Logo" className="h-8" />
              </Link>
            </div>

            {/* Right side: User info and Logout */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:inline text-sm text-gray-600">Olá, {user?.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
                 <span className="sr-only">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - hidden on small screens, shown on medium and up */}
        <nav className="hidden md:block w-64 bg-white shadow-lg min-h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                 <NavLink key={item.path} item={item} />
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;