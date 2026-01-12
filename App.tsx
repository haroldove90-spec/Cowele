
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Layout from './components/Layout';
import MapView from './components/MapView';
import RegistrationMap from './components/RegistrationMap';
import BathroomDetailCard from './components/BathroomDetailCard';
import { SLP_CENTER, SUPABASE_CONFIG, APP_BRANDING, ADMIN_CREDENTIALS } from './constants';
import { Bathroom, UserLocation, BathroomStatus } from './types';
import { calculateDistance } from './utils';
// Added Award to the list of icons imported from lucide-react to fix reference error on line 526
import { Camera, Loader2, Search, CheckCircle, Smartphone, RefreshCcw, LogOut, MapPin, CheckCircle2, Map as MapIcon, UserPlus, Key, AlertTriangle, ImageIcon, Edit, Trash2, Settings, ExternalLink, Eye, EyeOff, Users, ShieldCheck, Ban, CheckCircle as StatusOk, X, Save, UserSearch, Crown, MousePointer2, MessageSquare, Star, User, Upload, Repeat, UserCog, LayoutDashboard, TrendingUp, Calendar, Users as UsersIcon, Plus, Award } from 'lucide-react';

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.apiKey);
const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({ user: '', pass: '', fullName: '' });
  const [activeTab, setActiveTab] = useState('explore');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [selectedBathroom, setSelectedBathroom] = useState<Bathroom | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [newlyCreatedBathroomId, setNewlyCreatedBathroomId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingBathroom, setEditingBathroom] = useState<Bathroom | null>(null);
  
  // Estado para gestión de roles dinámicos
  const [isViewForcedAsUser, setIsViewForcedAsUser] = useState(false);

  // Estados de perfil
  const [profileForm, setProfileForm] = useState({ fullName: '', password: '', avatarUrl: '' });
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [regForm, setRegForm] = useState({
    name: '', 
    address: '', 
    coords: `${SLP_CENTER.lat}, ${SLP_CENTER.lng}`, 
    photo: null as string | null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBathrooms();
    requestLocation();
    const session = localStorage.getItem('cowele_session');
    if (session) {
      try {
        const data = JSON.parse(session);
        setCurrentUser(data);
        setIsLoggedIn(true);
        setUserPoints(data.points || 0);
        setProfileForm({
          fullName: data.full_name || '',
          password: data.password || '',
          avatarUrl: data.avatar_url || DEFAULT_AVATAR
        });
        
        // Si es admin, por defecto ir al Dashboard
        if (ADMIN_CREDENTIALS.some(c => c.user === data.username)) {
          setActiveTab('dashboard');
        }
      } catch (e) {
        localStorage.removeItem('cowele_session');
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'users' || activeTab === 'dashboard') fetchProfiles();
      if (activeTab === 'reviews_feed' || activeTab === 'dashboard') fetchAllReviews();
    }
  }, [activeTab, isLoggedIn]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          if (regForm.coords === `${SLP_CENTER.lat}, ${SLP_CENTER.lng}`) {
            setRegForm(prev => ({ ...prev, coords: `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}` }));
          }
        },
        () => console.warn("GPS OFF"),
        { enableHighAccuracy: true }
      );
    }
  };

  const fetchBathrooms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('bathrooms').select('*, reviews(*)').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const formatted: Bathroom[] = data.map(b => ({
          ...b,
          id: b.id.toString(),
          address: b.full_address || b.address,
          isPaid: b.is_paid || false,
          photo: b.photo_url || DEFAULT_PHOTO,
          accessibility: { wheelchair: true, babyChanging: false, genderNeutral: false },
          payment: { coins: true, card: false, consumptionRequired: false },
          isAccessible: true,
          lastReported: b.created_at,
          price: 0,
          reviews: (b.reviews || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }));
        setBathrooms(formatted);
        
        if (selectedBathroom) {
          const updated = formatted.find(f => f.id === selectedBathroom.id);
          if (updated) setSelectedBathroom(updated);
        }
      }
    } catch (e) { console.error("Fetch error:", e); }
    finally { setIsLoading(false); }
  };

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProfiles(data || []);
    } catch (e: any) { console.error("Profiles fetch error:", e); }
    finally { setIsLoading(false); }
  };

  const fetchAllReviews = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAllReviews(data || []);
    } catch (e: any) { console.error("Reviews feed fetch error:", e); }
    finally { setIsLoading(false); }
  };

  const parseCoords = (input: string): { lat: number, lng: number } => {
    const parts = input.split(/[,\s]+/).map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
    if (parts.length >= 2) return { lat: parts[0], lng: parts[1] };
    return { lat: SLP_CENTER.lat, lng: SLP_CENTER.lng };
  };

  const login = (user: any) => {
    if (user.status === 'inactive') {
      alert("🚫 CUENTA BLOQUEADA.");
      return;
    }
    setCurrentUser(user);
    setIsLoggedIn(true);
    setUserPoints(user.points || 0);
    setProfileForm({
      fullName: user.full_name || '',
      password: user.password || '',
      avatar_url: user.avatar_url || DEFAULT_AVATAR
    } as any);
    localStorage.setItem('cowele_session', JSON.stringify(user));
    
    if (ADMIN_CREDENTIALS.some(c => c.user === user.username)) {
      setActiveTab('dashboard');
    }
  };

  const logout = () => {
    if(!confirm("¿Deseas cerrar tu sesión?")) return;
    localStorage.removeItem('cowele_session');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTab('explore');
    setIsViewForcedAsUser(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = authForm.user.trim().toLowerCase();
    const adminMatch = ADMIN_CREDENTIALS.find(c => c.user === user && c.pass === authForm.pass);
    if (adminMatch) {
      const { data } = await supabase.from('profiles').select('*').eq('username', user).maybeSingle();
      if (data) login(data);
      else login({ id: 'admin-' + user, username: user, full_name: user === 'harold_anguiano' ? 'Harold Anguiano' : 'Daniel Herrera', points: 9999, status: 'active' });
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').eq('username', user).eq('password', authForm.pass).maybeSingle();
      if (data) login(data);
      else alert("⚠️ ACCESO DENEGADO.");
    } catch (err) { alert("❌ Error."); } finally { setIsLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = authForm.user.trim().toLowerCase();
    if (!user || !authForm.pass || !authForm.fullName) { alert("⚠️ Datos incompletos."); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').insert([{ username: user, password: authForm.pass, full_name: authForm.fullName, points: 0, status: 'active' }]).select().single();
      if (data) login(data); else throw error;
    } catch (err) { alert("⚠️ El usuario ya existe."); } finally { setIsLoading(false); }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.id.startsWith('admin-')) {
      alert("⚠️ Los administradores maestros deben gestionar datos vía configuración avanzada.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('profiles').update({
        full_name: profileForm.fullName,
        password: profileForm.password,
        avatar_url: profileForm.avatarUrl
      }).eq('id', currentUser.id).select().single();
      
      if (error) throw error;
      
      const updatedUser = { ...currentUser, ...data };
      setCurrentUser(updatedUser);
      localStorage.setItem('cowele_session', JSON.stringify(updatedUser));
      alert("✅ Perfil actualizado con éxito.");
    } catch (err: any) {
      alert("Error al actualizar perfil: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsSubmitting(true);
    try {
      const fileName = `avatar_${currentUser.id}_${Date.now()}`;
      const { error } = await supabase.storage.from('bathrooms').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('bathrooms').getPublicUrl(fileName);
      setProfileForm(prev => ({ ...prev, avatarUrl: publicUrl }));
    } catch (err: any) {
      alert("Error al subir avatar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (bathroomId: string, rating: number, comment: string) => {
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      const reviewPayload: any = {
        bathroom_id: parseInt(bathroomId),
        user_name: currentUser.full_name || currentUser.username,
        rating: rating,
        comment: comment
      };

      if (!currentUser.id.startsWith('admin-')) {
        reviewPayload.profile_id = currentUser.id;
      }

      const { error } = await supabase.from('reviews').insert([reviewPayload]);
      
      if (error) throw error;

      if (!currentUser.id.startsWith('admin-')) {
        const newPoints = userPoints + 10;
        await supabase.from('profiles').update({ points: newPoints }).eq('id', currentUser.id);
        setUserPoints(newPoints);
        setCurrentUser((prev: any) => ({...prev, points: newPoints}));
      }

      await fetchBathrooms();
      if (activeTab === 'reviews_feed' || activeTab === 'dashboard') await fetchAllReviews();
      
      alert("⭐ ¡Gracias por tu reseña! +10 XP");
    } catch (e: any) { 
      console.error("Review error:", e);
      alert("Error al guardar reseña."); 
    }
    finally { setIsSubmitting(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { error } = await supabase.storage.from('bathrooms').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('bathrooms').getPublicUrl(fileName);
      setRegForm({ ...regForm, photo: publicUrl });
    } catch (err: any) { 
      console.error("Upload error:", err);
      alert("Error al subir foto: " + err.message); 
    }
    finally { setIsSubmitting(false); }
  };

  const handleRegisterBathroom = async (e: React.FormEvent) => {
    e.preventDefault();
    const { lat, lng } = parseCoords(regForm.coords);
    setIsSubmitting(true);
    try {
      let result;
      if (editingBathroom) {
        result = await supabase.from('bathrooms').update({ 
          name: regForm.name, 
          full_address: regForm.address, 
          lat, 
          lng, 
          photo_url: regForm.photo 
        }).eq('id', editingBathroom.id).select().single();
      } else {
        result = await supabase.from('bathrooms').insert([{ 
          name: regForm.name, 
          full_address: regForm.address, 
          lat, 
          lng, 
          photo_url: regForm.photo, 
          created_by: currentUser.username, 
          status: 'clean', 
          rating: 5.0 
        }]).select().single();
      }
      
      if (result.error) throw result.error;
      
      const newId = result.data.id.toString();
      await fetchBathrooms(); 
      setNewlyCreatedBathroomId(newId);
      setShowSuccessPopup(true);
      setRegForm({ name: '', address: '', coords: `${SLP_CENTER.lat}, ${SLP_CENTER.lng}`, photo: null });
      setEditingBathroom(null);
    } catch (e: any) { alert("Error: " + e.message); }
    finally { setIsSubmitting(false); }
  };

  const handleShowInMap = (id: string) => {
    const b = bathrooms.find(item => item.id === id);
    if (b) {
      setSelectedBathroom(b);
      setActiveTab('explore');
    }
    setShowSuccessPopup(false);
    setNewlyCreatedBathroomId(null);
  };

  const handleDeleteBathroom = async (id: string) => {
    if (!confirm("¿Borrar?")) return;
    try {
      const { error } = await supabase.from('bathrooms').delete().eq('id', id);
      if (error) throw error;
      fetchBathrooms();
    } catch (e: any) { alert("Error: " + e.message); }
  };

  const handleUserStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      await fetchProfiles();
    } catch (e: any) { alert("Error: " + e.message); }
  };

  const handleUserDelete = async (id: string) => {
    if (!confirm("¿Borrar usuario permanentemente?")) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      await fetchProfiles();
    } catch (e: any) { alert("Error: " + e.message); }
  };

  const startEditing = (b: Bathroom) => {
    setEditingBathroom(b);
    setRegForm({ 
      name: b.name, 
      address: b.address, 
      coords: `${b.lat}, ${b.lng}`, 
      photo: b.photo === DEFAULT_PHOTO ? null : b.photo 
    });
    setActiveTab('register');
  };

  const toggleRole = () => {
    setIsViewForcedAsUser(!isViewForcedAsUser);
    alert(isViewForcedAsUser ? "Modo Arquitecto Restaurado" : "Simulando vista de Usuario Pro");
  };

  // CÁLCULO DE ESTADÍSTICAS PARA DASHBOARD
  const analytics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Baños por día (últimos 7 días)
    const bathroomsByDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = bathrooms.filter(b => b.lastReported?.startsWith(dateStr)).length;
      return { date: dateStr, count };
    }).reverse();

    // Usuarios por día (últimos 7 días)
    const usersByDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = profiles.filter(p => p.created_at?.startsWith(dateStr)).length;
      return { date: dateStr, count };
    }).reverse();

    return {
      totalBathrooms: bathrooms.length,
      todayBathrooms: bathrooms.filter(b => b.lastReported?.startsWith(today)).length,
      totalUsers: profiles.length,
      todayUsers: profiles.filter(p => p.created_at?.startsWith(today)).length,
      bathroomsByDay,
      usersByDay
    };
  }, [bathrooms, profiles]);

  const { lat: currentLat, lng: currentLng } = parseCoords(regForm.coords);
  const isRealAdmin = currentUser && ADMIN_CREDENTIALS.some(c => c.user === currentUser.username);

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-primary p-6 overflow-hidden">
        <div className="w-full max-sm:max-w-xs max-w-sm bg-white p-10 rounded-[40px] shadow-2xl border-b-8 border-secondary/20">
          <img src={APP_BRANDING.logo} className="w-32 mx-auto mb-8" alt="Logo" />
          <h2 className="text-xl font-black text-secondary text-center uppercase italic mb-8 tracking-tighter">{isRegistering ? 'REGISTRO PRO' : 'ENTRAR PRO'}</h2>
          <form onSubmit={isRegistering ? handleRegister : handleAuth} className="space-y-4">
            {isRegistering && <input type="text" placeholder="Nombre Completo" className="w-full p-4 bg-gray-100 rounded-2xl font-black text-black outline-none border-2 border-transparent focus:border-secondary shadow-inner" required value={authForm.fullName} onChange={e => setAuthForm({...authForm, fullName: e.target.value})} />}
            <input type="text" placeholder="Usuario" className="w-full p-4 bg-gray-100 rounded-2xl font-black text-black outline-none border-2 border-transparent focus:border-secondary shadow-inner" required value={authForm.user} onChange={e => setAuthForm({...authForm, user: e.target.value})} />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Contraseña" className="w-full p-4 bg-gray-100 rounded-2xl font-black text-black outline-none border-2 border-transparent focus:border-secondary shadow-inner" required value={authForm.pass} onChange={e => setAuthForm({...authForm, pass: e.target.value})} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
            </div>
            <button disabled={isLoading} className="w-full py-4 bg-secondary text-white font-black rounded-2xl uppercase shadow-xl flex items-center justify-center gap-2">{isLoading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Crear' : 'Ingresar')}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-[10px] font-black uppercase text-gray-400 underline decoration-secondary/30 underline-offset-4">{isRegistering ? '¿Ya tienes cuenta? Entra' : '¿Nuevo? Regístrate aquí'}</button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userPoints={userPoints} 
      username={currentUser?.username}
      onLogout={logout}
      onToggleRole={toggleRole}
      isViewForcedAsUser={isViewForcedAsUser}
    >
      {activeTab === 'dashboard' && (
        <div className="h-full overflow-y-auto bg-gray-50 p-8 pb-40">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col gap-2">
              <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">Análisis Cowele SLP</h2>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Monitor Maestro de Infraestructura</p>
              </div>
            </header>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                   <MapPin className="w-24 h-24 text-secondary" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase italic mb-1">Total Baños</h4>
                  <div className="text-3xl font-black text-secondary">{analytics.totalBathrooms}</div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-green-500">
                  <Plus className="w-3 h-3" /> {analytics.todayBathrooms} registrados hoy
                </div>
              </div>

              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                   <UsersIcon className="w-24 h-24 text-secondary" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase italic mb-1">Usuarios Pro</h4>
                  <div className="text-3xl font-black text-secondary">{analytics.totalUsers}</div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-green-500">
                  <TrendingUp className="w-3 h-3" /> {analytics.todayUsers} nuevos hoy
                </div>
              </div>

              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                   <MessageSquare className="w-24 h-24 text-secondary" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase italic mb-1">Reseñas Totales</h4>
                  <div className="text-3xl font-black text-secondary">{allReviews.length}</div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-secondary">
                  <Star className="w-3 h-3 fill-current" /> Feedback comunidad
                </div>
              </div>

              <div className="bg-primary p-6 rounded-[32px] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                   <Award className="w-24 h-24 text-secondary" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-secondary/60 uppercase italic mb-1">XP Distribuido</h4>
                  <div className="text-3xl font-black text-secondary">{(profiles.reduce((acc, p) => acc + (p.points || 0), 0) / 1000).toFixed(1)}K</div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-secondary uppercase italic">
                  Gabinete de Estrellas
                </div>
              </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bathrooms Growth Chart */}
              <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-gray-800 uppercase italic">Crecimiento de Infraestructura</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Historial de registros (últimos 7 días)</p>
                  </div>
                  <Calendar className="text-secondary w-6 h-6" />
                </div>
                
                <div className="h-64 flex items-end gap-2 px-2 border-b-2 border-gray-100 pb-2">
                  {analytics.bathroomsByDay.map((day, i) => {
                    const maxCount = Math.max(...analytics.bathroomsByDay.map(d => d.count), 1);
                    const heightPercent = (day.count / maxCount) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <div 
                          className="w-full bg-secondary/10 rounded-t-xl group-hover:bg-secondary/30 transition-all relative overflow-hidden" 
                          style={{ height: `${heightPercent}%`, minHeight: '8px' }}
                        >
                          <div className="absolute inset-x-0 top-0 h-1 bg-secondary shadow-[0_0_10px_#F14513]"></div>
                        </div>
                        <span className="text-[8px] font-black text-gray-400 rotate-45 mt-2">{day.date.split('-').slice(1).join('/')}</span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary text-white text-[10px] font-black px-2 py-1 rounded-lg pointer-events-none">
                          {day.count} Baños
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Users Growth Chart */}
              <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-gray-800 uppercase italic">Adopción de Usuarios</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Nuevos arquitectos Pro (últimos 7 días)</p>
                  </div>
                  <TrendingUp className="text-secondary w-6 h-6" />
                </div>
                
                <div className="h-64 flex items-end gap-2 px-2 border-b-2 border-gray-100 pb-2">
                  {analytics.usersByDay.map((day, i) => {
                    const maxCount = Math.max(...analytics.usersByDay.map(d => d.count), 1);
                    const heightPercent = (day.count / maxCount) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <div 
                          className="w-full bg-primary rounded-t-xl group-hover:brightness-90 transition-all relative" 
                          style={{ height: `${heightPercent}%`, minHeight: '8px' }}
                        >
                          <div className="absolute inset-x-0 top-0 h-1 bg-white/50"></div>
                        </div>
                        <span className="text-[8px] font-black text-gray-400 rotate-45 mt-2">{day.date.split('-').slice(1).join('/')}</span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-black px-2 py-1 rounded-lg pointer-events-none">
                          {day.count} Pro
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RECENT ACTIVITY TABLE */}
            <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
               <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-800 uppercase italic">Últimos Registros</h3>
                  <button onClick={fetchBathrooms} className="text-[10px] font-black text-secondary uppercase border-2 border-secondary/20 px-4 py-2 rounded-xl active:scale-95 transition-all">Sincronizar Datos</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase italic">
                       <tr>
                          <th className="px-8 py-4">Baño</th>
                          <th className="px-8 py-4">Arquitecto</th>
                          <th className="px-8 py-4">Status</th>
                          <th className="px-8 py-4 text-right">Fecha</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-600">
                       {bathrooms.slice(0, 5).map(b => (
                         <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <img src={b.photo} className="w-8 h-8 rounded-lg object-cover" />
                                  <span className="font-black text-black uppercase">{b.name}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6">@{b.createdBy || 'Sistema'}</td>
                            <td className="px-8 py-6">
                               <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Verificado</span>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-gray-400 italic">{new Date(b.lastReported).toLocaleDateString()}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'explore' && (
        <>
          <div className="absolute top-4 left-4 right-4 z-20 max-w-lg mx-auto flex gap-2">
            <div className="flex-1 bg-white rounded-2xl shadow-xl flex items-center px-4 py-1 border border-gray-100 overflow-hidden">
              <Search className="w-4 h-4 text-gray-300 ml-2" />
              <input type="text" placeholder="Buscar sitio..." className="w-full py-3 px-2 font-black text-sm outline-none text-black bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={fetchBathrooms} className="bg-white p-4 rounded-2xl shadow-xl text-secondary active:scale-90 transition-transform"><RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
          </div>
          <MapView bathrooms={bathrooms.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))} userLocation={userLocation} onSelectBathroom={setSelectedBathroom} filterRadius={5} selectedBathroom={selectedBathroom} />
          {selectedBathroom && <BathroomDetailCard bathroom={selectedBathroom} distance={userLocation ? calculateDistance(userLocation.lat, userLocation.lng, selectedBathroom.lat, selectedBathroom.lng) : null} onClose={() => setSelectedBathroom(null)} onStatusReport={() => {}} onSubmitReview={handleReviewSubmit} />}
        </>
      )}

      {activeTab === 'register' && (
        <div className="h-full overflow-y-auto bg-gray-50 p-6 pb-40">
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-2xl font-black text-gray-800 uppercase italic">Registro Cowele</h2>
            <form onSubmit={handleRegisterBathroom} className="bg-white p-8 rounded-[40px] shadow-xl space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 block italic">Evidencia Visual (Opcional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`w-full aspect-video bg-gray-100 rounded-[30px] border-4 border-dashed ${regForm.photo ? 'border-secondary/40' : 'border-primary/30'} flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all group hover:bg-gray-200`}
                >
                  {regForm.photo ? (
                    <>
                      <img src={regForm.photo} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <Camera className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Camera className="w-6 h-6 text-secondary" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-gray-500 block">Capturar Foto o Subir</span>
                      <p className="text-[8px] text-gray-400 font-bold mt-1">Sube una imagen para +20 XP extra</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={fileInputRef} 
                    hidden 
                    onChange={handleFileUpload} 
                  />
                </div>
                {isSubmitting && <div className="flex items-center gap-2 justify-center text-secondary"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[9px] font-black">Procesando...</span></div>}
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="Nombre del Establecimiento" required className="w-full p-4 bg-gray-100 rounded-2xl font-black text-black outline-none border-2 border-transparent focus:border-secondary shadow-inner" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                <textarea placeholder="Dirección Exacta o Referencias" required className="w-full p-4 bg-gray-100 rounded-2xl font-black h-20 text-black outline-none border-2 border-transparent focus:border-secondary shadow-inner resize-none" value={regForm.address} onChange={e => setRegForm({...regForm, address: e.target.value})} />
                <div className="relative">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Coordenadas del Sistema</label>
                  <input type="text" placeholder="Latitud, Longitud" required className="w-full p-5 bg-gray-100 rounded-2xl font-black text-black border-2 border-primary/30 focus:border-secondary shadow-inner" value={regForm.coords} onFocus={() => setRegForm(prev => ({ ...prev, coords: '' }))} onChange={e => setRegForm({...regForm, coords: e.target.value})} />
                </div>
              </div>
              <RegistrationMap lat={currentLat} lng={currentLng} onLocationSelect={(lat, lng) => setRegForm({...regForm, coords: `${lat}, ${lng}`})} />
              <button disabled={isSubmitting} className="w-full py-5 bg-secondary text-white font-black rounded-2xl uppercase shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" /> : editingBathroom ? 'Actualizar Registro' : 'Registrar Baño'}
              </button>
            </form>
          </div>
          
          {showSuccessPopup && (
            <div className="fixed inset-0 z-[500] bg-secondary/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center w-full max-w-sm border-t-8 border-secondary">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-secondary uppercase mb-8 italic">¡REGISTRO ÉXITO!</h3>
                <div className="flex flex-col gap-3">
                   <button 
                    onClick={() => newlyCreatedBathroomId && handleShowInMap(newlyCreatedBathroomId)} 
                    className="w-full py-4 bg-secondary text-white font-black rounded-2xl uppercase italic shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <MapPin className="w-4 h-4" /> Ver en Mapa
                  </button>
                  <button 
                    onClick={() => {
                      setShowSuccessPopup(false);
                      setNewlyCreatedBathroomId(null);
                    }} 
                    className="w-full py-4 bg-primary text-secondary font-black rounded-2xl uppercase italic active:scale-95 transition-transform"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="h-full overflow-y-auto bg-gray-50 p-8 pb-40">
          <div className="max-w-xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-gray-900 uppercase italic">Configuración</h2>
              <div className="flex gap-2">
                {isRealAdmin && (
                  <button onClick={toggleRole} className="flex items-center gap-2 bg-primary text-secondary px-4 py-2 rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all shadow-md border border-secondary/20">
                    <Repeat className="w-4 h-4" /> {isViewForcedAsUser ? 'Ser Admin' : 'Ser Usuario'}
                  </button>
                )}
                <button onClick={logout} className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all shadow-sm">
                  <LogOut className="w-4 h-4" /> Salir
                </button>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="bg-white p-8 rounded-[40px] shadow-xl space-y-8 border-t-8 border-primary">
              <div className="flex flex-col items-center gap-4">
                <div 
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-32 h-32 rounded-[40px] bg-gray-100 border-4 border-primary overflow-hidden relative group cursor-pointer shadow-xl"
                >
                  <img src={profileForm.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={handleAvatarUpload} />
                </div>
                <div className="text-center">
                  <h3 className="font-black text-xl text-secondary uppercase italic">@{currentUser?.username}</h3>
                  <div className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block mt-2">
                    {isRealAdmin ? 'ARQUITECTO MASTER' : `${userPoints} XP ACUMULADOS`}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={profileForm.fullName} 
                    onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                    placeholder="Tu nombre completo"
                    className="w-full p-4 bg-gray-100 rounded-2xl font-black text-black outline-none border-2 border-transparent focus:border-secondary shadow-inner" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 italic">Actualizar Contraseña</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={profileForm.password} 
                      onChange={e => setProfileForm({...profileForm, password: e.target.value})}
                      placeholder="Nueva contraseña"
                      className="w-full p-4 bg-gray-100 rounded-2xl font-black text-black outline-none border-2 border-transparent focus:border-secondary shadow-inner" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button disabled={isSubmitting} className="w-full py-5 bg-secondary text-white font-black rounded-2xl uppercase shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5" /> Guardar Perfil</>}
                </button>
                
                {isRealAdmin && (
                   <button type="button" onClick={toggleRole} className="w-full py-4 bg-white text-secondary border-2 border-secondary font-black rounded-2xl uppercase text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Repeat className="w-4 h-4" /> {isViewForcedAsUser ? 'Restaurar Modo Administrador' : 'Simular Experiencia Usuario'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'reviews_feed' && (
        <div className="h-full overflow-y-auto bg-gray-50 p-8 pb-40">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase italic">Comunidad Cowele</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Voz de los arquitectos y usuarios</p>
              </div>
              <button onClick={fetchAllReviews} className="p-3 bg-white rounded-full shadow-lg text-secondary active:rotate-180 transition-all border border-secondary/10">
                <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoading && allReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-300">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-secondary" />
                <p className="font-black uppercase italic tracking-widest text-[10px]">Cargando feed de estrellas...</p>
              </div>
            ) : allReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-300 text-center">
                <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
                <p className="font-black uppercase italic mb-4">Aún no hay reseñas en el sistema</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allReviews.map(r => (
                  <div key={r.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom duration-300 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-[10px] uppercase text-black italic">{r.user_name || 'Anónimo'}</h4>
                          <span className="text-[8px] font-bold text-gray-400 uppercase">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`w-3 h-3 ${star <= (r.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                       <p className="text-xs font-bold text-gray-600 italic">"{r.comment}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="h-full overflow-y-auto bg-gray-50 p-8 pb-40">
          <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-3xl font-black text-gray-900 uppercase italic">Gestión de Baños</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bathrooms.map(b => (
                <div key={b.id} className="bg-white p-4 rounded-[32px] shadow-sm flex items-center gap-4 border border-gray-100 hover:shadow-lg transition-shadow">
                  <img src={b.photo} className="w-16 h-16 rounded-2xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm uppercase truncate text-black italic">{b.name}</h3>
                    <p className="text-[9px] font-bold text-gray-400 truncate">{b.address}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-2 h-2 ${s <= b.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEditing(b)} className="p-3 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-100 transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteBathroom(b.id)} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="h-full overflow-y-auto bg-gray-50 p-8 pb-40">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
               <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase italic">Control de Usuarios</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Gabinete Cowele SLP</p>
               </div>
               <button onClick={fetchProfiles} className="p-3 bg-white rounded-full shadow-lg text-secondary active:rotate-180 transition-all border border-secondary/10">
                  <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map(p => {
                const isAdminInCode = ADMIN_CREDENTIALS.some(c => c.user === p.username);
                return (
                  <div key={p.id} className={`p-6 rounded-[32px] shadow-sm flex items-center gap-4 border animate-in fade-in slide-in-from-bottom duration-300 transition-all hover:shadow-md ${isAdminInCode ? 'bg-secondary/5 border-secondary/20' : 'bg-white border-gray-100'}`}>
                    <div className={`p-4 rounded-2xl shadow-inner ${isAdminInCode ? 'bg-secondary text-white' : p.status === 'active' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                      {isAdminInCode ? <Crown className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-xs uppercase text-black italic truncate">{p.full_name || 'Sin Nombre'}</h3>
                        {isAdminInCode && <span className="bg-secondary text-white text-[6px] font-black px-1 py-0.5 rounded italic">ARQUITECTO</span>}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400">@{p.username} | <span className="text-secondary">{p.points || 0} XP</span></p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditingUser(p)} className="p-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 active:scale-90 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleUserStatusChange(p.id, p.status === 'active' ? 'inactive' : 'active')} className={`p-2.5 rounded-xl active:scale-90 transition-all ${p.status === 'active' ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}>
                        {p.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <StatusOk className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleUserDelete(p.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 active:scale-90 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
