import React, { useEffect, useState, useRef } from 'react';
import { apiRequest } from './lib/api';
import { UserProfile, Quest, AttributeType } from './types';
import { generateQuests } from './services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Brain, 
  Palette, 
  Zap, 
  Trophy, 
  LayoutDashboard, 
  BarChart3, 
  LogOut, 
  Sparkles,
  RefreshCw,
  Edit2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
 
export default function App() {
  const [user, setUser] = useState<{ uid: string, email: string, displayName: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats'>('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [completedQuestReward, setCompletedQuestReward] = useState<Quest | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) loadUserData();
    else setLoading(false);
  }, []);
 
  const loadUserData = async () => {
    try {
      const profileData = await apiRequest('/profile');
      setProfile(profileData);
      setUser({
        uid: profileData.uid,
        email: profileData.email,
        displayName: profileData.displayName
      });
      
      const questsData = await apiRequest('/quests');
      setQuests(questsData);
      
      if (!profileData.goals) setShowOnboarding(true);
    } catch (error) {
      console.error('Failed to load user data:', error);
      if (error instanceof Error && error.message.includes('404')) {
        setShowOnboarding(true);
      }
    } finally {
      setLoading(false);
    }
  };
 
  const handleSignIn = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Ошибка входа');
      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      await loadUserData();
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };
 
  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setProfile(null);
    setQuests([]);
  };
 
  const handleGenerateQuests = async () => {
    if (!profile || isGenerating) return;
    setIsGenerating(true);
    try {
      await generateQuests(profile, { date: format(new Date(), 'yyyy-MM-dd') });
      const updatedQuests = await apiRequest('/quests/');
      setQuests(updatedQuests);
    } catch (error) {
      console.error('Failed to generate quests:', error);
    } finally {
      setIsGenerating(false);
    }
  };
 
  const handleUpdateGoals = async (newGoals: string) => {
    if (!profile) return;
    try {
      const updatedProfile = await apiRequest('/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ goals: newGoals })
      });
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to update goals:', error);
    }
  };
 
  const handleOnboardingComplete = async (goals: string) => {
    if (!user) return;
    try {
      const updatedProfile = await apiRequest('/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ 
          goals,
          level: 1,
          xp: 0,
          attributes: { strength: 10, intelligence: 10, creativity: 10, stamina: 10 }
        })
      });
      setProfile(updatedProfile);
      setShowOnboarding(false);
      const initialQuests = await apiRequest('/quests/');
      setQuests(initialQuests);
    } catch (error) {
      console.error('Onboarding failed:', error);
    }
  };
 
  const playSuccessSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };
 
  const completeQuest = async (quest: Quest) => {
    if (!profile || quest.status !== 'pending') return;
    try {
      playSuccessSound();
      setCompletedQuestReward(quest);

      const data = await apiRequest(`/quests/${quest.id}/complete/`, { method: 'POST' });

      setQuests(prev => prev.map(q => q.id === quest.id ? data.quest : q));
      setProfile(prev => prev ? { ...prev, ...data.profile } : prev);
    } catch (error) {
      console.error('Failed to complete quest:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <Sparkles className="w-12 h-12 text-indigo-500" />
          </motion.div>
          <p className="text-slate-400 font-medium">Загрузка мира...</p>
        </div>
      </div>
    );
  }
 
  if (!user) return <LoginScreen onLogin={handleSignIn} />;
 
  return (
    <div className="flex min-h-screen bg-[#0F172A] text-slate-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      <AnimatePresence>
        {completedQuestReward && (
          <QuestRewardModal quest={completedQuestReward} onClose={() => setCompletedQuestReward(null)} />
        )}
      </AnimatePresence>
      
      {/* Sidebar — только для больших экранов */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 hidden lg:flex flex-col p-8 overflow-y-auto">
        {/* ... твой sidebar остаётся без изменений ... */}
      </aside>
 
      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Адаптивный Header */}
        <header className="h-16 sm:h-20 border-b border-slate-800 flex items-center justify-between px-4 sm:px-8 bg-slate-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-2xl sm:text-3xl font-black italic tracking-tighter text-indigo-500">LIFE LEVELING</div>
            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
            
            <div className="flex bg-slate-950/70 p-1 rounded-2xl border border-slate-700/50 text-sm">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all ${
                  activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Квесты
              </button>
              <button 
                onClick={() => setActiveTab('stats')}
                className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all ${
                  activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Статы
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Общий XP</div>
              <div className="font-mono font-bold text-white text-sm">
                {(profile?.level || 0) * 1000 + (profile?.xp || 0)}
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-3 hover:bg-slate-800 rounded-2xl transition-colors"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </header>
 
        <div ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <h2 className="text-3xl font-bold text-white">Активные квесты</h2>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleGenerateQuests}
                      disabled={isGenerating}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-2xl text-sm font-bold uppercase tracking-wider border border-indigo-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <motion.div animate={isGenerating ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <RefreshCw className="w-4 h-4" />
                      </motion.div>
                      {isGenerating ? 'В процессе...' : 'Новые квесты'}
                    </button>
                    <span className="px-5 py-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl text-sm font-bold border border-indigo-500/20 whitespace-nowrap">
                      {quests.filter(q => q.status === 'pending').length} осталось
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <AttributeCard icon={<Swords className="w-5 h-5 text-red-400" />} label="Сила" value={profile?.attributes.strength || 0} color="border-red-500/10 bg-red-500/5" />
                  <AttributeCard icon={<Brain className="w-5 h-5 text-blue-400" />} label="Интеллект" value={profile?.attributes.intelligence || 0} color="border-blue-500/10 bg-blue-500/5" />
                  <AttributeCard icon={<Palette className="w-5 h-5 text-amber-400" />} label="Креатив" value={profile?.attributes.creativity || 0} color="border-amber-500/10 bg-amber-500/5" />
                  <AttributeCard icon={<Zap className="w-5 h-5 text-emerald-400" />} label="Выносливость" value={profile?.attributes.stamina || 0} color="border-emerald-500/10 bg-emerald-500/5" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <AnimatePresence mode="popLayout">
                    {[...quests]
                      .sort((a, b) => (a.status === 'completed' ? 1 : b.status === 'completed' ? -1 : 0))
                      .map((quest) => (
                        <QuestCard key={quest.id} quest={quest} onComplete={() => completeQuest(quest)} />
                      ))}
                  </AnimatePresence>
                  {quests.length === 0 && (
                    <div className="col-span-full h-80 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-8">
                      <div className="text-slate-600 text-4xl mb-4 font-black">✦</div>
                      <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Нажми «Новые квесты» чтобы начать</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <StatsScreen profile={profile} onUpdateGoals={handleUpdateGoals} />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-4 left-1/2 lg:left-[calc(50%+160px)] -translate-x-1/2 bg-slate-900/95 backdrop-blur-2xl border border-slate-700 rounded-3xl p-2 shadow-2xl z-50 flex gap-1">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-5 h-5" />} label="Квесты" />
          <NavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 className="w-5 h-5" />} label="Статы" />
        </nav>
      </main>
    </div>
  );
}

/* ====================== Остальные компоненты ====================== */

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await onLogin();
    } catch {
      setError('Не удалось войти. Попробуйте снова.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="inline-flex p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
          <Sparkles className="w-12 h-12 text-indigo-500" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          Life Leveling
        </h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          Превратите свои цели в эпические квесты
        </p>
        
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full py-4 px-6 bg-white text-black font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {isLoggingIn ? 'Вход...' : 'Войти через Google'}
        </button>
      </div>
    </div>
  );
}

function Onboarding({ onComplete }: { onComplete: (goals: string) => void }) {
  const [goals, setGoals] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">Добро пожаловать, Искатель!</h2>
        <p className="text-slate-400 mb-6 leading-relaxed">Опишите ваши цели...</p>
        <textarea 
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="Хочу стать сильнее, выучить английский..."
          className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-200"
        />
        <button 
          disabled={!goals.trim()}
          onClick={() => onComplete(goals)}
          className="w-full mt-6 py-4 bg-indigo-600 disabled:bg-slate-800 text-white font-bold rounded-xl active:scale-95 transition-all"
        >
          Начать приключение
        </button>
      </motion.div>
    </motion.div>
  );
}

/* QuestCard, AttributeCard, StatsScreen, NavButton и другие компоненты — оставил как были, но можешь улучшить дальше по необходимости */

function QuestCard({ quest, onComplete }: { quest: Quest, onComplete: () => void }) {
  const isCompleted = quest.status === 'completed';
  const difficultyColors = {
    easy: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    medium: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
    hard: 'border-red-500/20 bg-red-500/5 text-red-400'
  };
  const attributeColors = {
    strength: 'text-red-400',
    intelligence: 'text-blue-400',
    creativity: 'text-amber-400',
    stamina: 'text-emerald-400',
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={!isCompleted ? { y: -4 } : {}}
      className={`group p-5 sm:p-6 rounded-3xl border transition-all flex flex-col h-full ${
        isCompleted 
          ? 'bg-slate-900 border-slate-800 opacity-50' 
          : 'bg-slate-800/40 border-slate-700/50 hover:border-indigo-500/30'
      }`}
    >
      {/* ... остальной код QuestCard без изменений ... */}
      <button 
        onClick={onComplete}
        disabled={isCompleted}
        className={`mt-auto px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isCompleted ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'}`}
      >
        {isCompleted ? 'Завершено' : 'Начать'}
      </button>
    </motion.div>
  );
}

// AttributeCard, NavButton, StatsScreen и т.д. можно оставить как в оригинале или тоже подправить по аналогии.

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl flex items-center gap-2 transition-all ${active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
    >
      {icon}
      {active && <span className="font-bold text-sm">{label}</span>}
    </button>
  );
}