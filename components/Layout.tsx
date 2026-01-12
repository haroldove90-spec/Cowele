
import React from 'react';
import { Map as MapIcon, PlusCircle, Award, ShieldCheck, Settings, Users, MessageSquare, User, LogOut, UserCog, Repeat, LayoutDashboard } from 'lucide-react';
import { APP_BRANDING, ADMIN_CREDENTIALS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userPoints: number;
  username?: string;
  onLogout?: () => void;
  onToggleRole?: () => void;
  isViewForcedAsUser?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  userPoints, 
  username, 
  onLogout, 
  onToggleRole,
  isViewForcedAsUser 
}) => {
  const isRealAdmin = ADMIN_CREDENTIALS.some(c => c.user === username);
  const isAdminView = isRealAdmin && !isViewForcedAsUser;
  
  const navItems = [
    { id: 'explore', label: 'Explorar', icon: MapIcon },
    { id: 'register', label: 'Registrar', icon: PlusCircle },
    { id: 'reviews_feed', label: 'Reseñas', icon: MessageSquare },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  if (isAdminView) {
    // El Dashboard se coloca como la primera opción para el Arquitecto
    navItems.unshift({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
    navItems.push({ id: 'admin', label: 'Baños', icon: Settings });
    navItems.push({ id: 'users', label: 'Usuarios', icon: Users });
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 bg-secondary text-white shadow-2xl z-30">
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-primary p-2 rounded-2xl">
              <img src={APP_BRANDING.icon} className="w-10 h-10 object-contain" alt="Cowele" />
            </div>
            <h1 className="text-2xl font-black uppercase italic text-primary">COWELE</h1>
          </div>

          <div className={`rounded-3xl p-5 mb-8 border relative overflow-hidden transition-colors ${isAdminView ? 'bg-black/20 border-white/20' : 'bg-primary/10 border-primary/20'}`}>
            <div className="relative z-10">
              <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${isAdminView ? 'text-primary' : 'text-white'}`}>
                {isAdminView ? 'MODO ARQUITECTO' : 'ESTATUS PRO'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black">{isAdminView ? 'INFINITY' : userPoints}</span>
                {!isAdminView && <span className="text-[10px] font-bold opacity-70">XP</span>}
              </div>
            </div>
            {isAdminView ? (
              <ShieldCheck className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10" />
            ) : (
              <Award className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10" />
            )}
          </div>

          <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                  activeTab === item.id ? 'bg-primary text-secondary' : 'hover:bg-white/10 text-white/80'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
            {isRealAdmin && (
              <button 
                onClick={onToggleRole}
                className="w-full flex items-center gap-4 px-6 py-3 rounded-xl font-black uppercase text-[10px] text-primary hover:bg-white/10 transition-all border border-primary/20"
              >
                <Repeat className="w-4 h-4" />
                {isViewForcedAsUser ? 'Activar Modo Admin' : 'Simular Usuario'}
              </button>
            )}
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-6 py-3 rounded-xl font-black uppercase text-[10px] text-white hover:bg-red-500 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 h-full relative overflow-hidden">
        <header className="bg-primary text-secondary p-4 lg:p-6 z-20 shadow-md flex justify-between items-center border-b-2 border-secondary/10">
          <div className="flex items-center gap-4">
            <img src={APP_BRANDING.logo} className="h-8 lg:h-10" alt="Cowele" />
            {isRealAdmin && (
              <div className="hidden lg:flex items-center gap-2 bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                <ShieldCheck className="w-3 h-3 text-secondary" />
                <span className="text-[8px] font-black uppercase text-secondary">ADMIN VERIFICADO</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isRealAdmin && (
              <button 
                onClick={onToggleRole}
                className="lg:hidden p-2.5 bg-secondary text-white rounded-full shadow-lg active:scale-90 transition-transform"
                title="Cambiar Rol"
              >
                <UserCog className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2 bg-secondary text-white px-4 py-1.5 rounded-full border-2 border-white shadow-lg">
               <Award className="w-4 h-4 text-primary" />
               <span className="text-[10px] font-black">{isAdminView ? '∞' : userPoints}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 relative bg-white overflow-hidden">
          {children}
        </main>

        {/* MOBILE NAV */}
        <nav className="lg:hidden bg-white border-t border-gray-100 flex justify-around p-4 pb-8 shadow-2xl z-30 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={`flex flex-col items-center gap-1 min-w-[64px] transition-all ${activeTab === item.id ? 'text-secondary scale-110' : 'text-gray-400'}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[3px]' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
