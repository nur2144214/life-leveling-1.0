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
  ChevronRight, 
  Target, 
  LayoutDashboard, 
  BarChart3, 
  LogOut, 
  Sparkles,
  RefreshCw,
  Edit2,
  Check,
  X,
  Plus,
  CheckCircle2,
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
    if (token) {
      loadUserData();
    } else {
      setLoading(false);
    }
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
      
      if (!profileData.goals) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      console.log('Error message:', error instanceof Error ? error.message : error);
      // Только если явно 404 — показываем онбординг, токен не трогаем
      if (error instanceof Error && error.message.includes('404')) {
        setShowOnboarding(true);
      }
      // НЕ удаляем токен и НЕ сбрасываем юзера при других ошибках
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
      console.log('Login response:', data);
      const { token } = data;
      console.log('Token:', token);
      localStorage.setItem('auth_token', token);
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
    audio.play().catch(e => console.log('Audio play blocked', e));
  };
 
  const completeQuest = async (quest: Quest) => {
  if (!profile || quest.status !== 'pending') return;

  try {
    playSuccessSound();
    setCompletedQuestReward(quest);

    const data = await apiRequest(`/quests/${quest.id}/complete/`, {
      method: 'POST',
    });

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
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-12 h-12 text-indigo-500" />
          </motion.div>
          <p className="text-slate-400 font-medium">Загрузка мира...</p>
        </div>
      </div>
    );
  }
 
  if (!user) {
    return <LoginScreen onLogin={handleSignIn} />;
  }
 
  return (
    <div className="flex min-h-screen bg-[#0F172A] text-slate-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      <AnimatePresence>
        {completedQuestReward && (
          <QuestRewardModal 
            quest={completedQuestReward} 
            onClose={() => setCompletedQuestReward(null)} 
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 hidden lg:flex flex-col p-8 overflow-y-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-500/30">
            {profile?.displayName.substring(0, 2).toUpperCase() || 'LV'}
          </div>
          <div>
            <h2 className="font-bold text-xl leading-tight text-white">{profile?.displayName}</h2>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mt-1">Lvl {profile?.level} Explorer</p>
          </div>
        </div>
 
        <div className="space-y-8">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Характеристики</h3>
          <div className="space-y-6">
            <SidebarStat label="Сила" value={profile?.attributes.strength || 0} color="bg-red-500" />
            <SidebarStat label="Интеллект" value={profile?.attributes.intelligence || 0} color="bg-blue-500" />
            <SidebarStat label="Креативность" value={profile?.attributes.creativity || 0} color="bg-amber-500" />
            <SidebarStat label="Выносливость" value={profile?.attributes.stamina || 0} color="bg-emerald-500" />
          </div>
        </div>
 
        <div className="mt-auto pt-8">
          <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-700/50">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Прогресс уровня</p>
            <div className="flex justify-between items-end mb-2">
              <span className="text-xl font-mono font-bold text-white">{profile?.xp} XP</span>
              <span className="text-xs text-slate-500">/ {profile ? profile.level * 100 : 100}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${profile ? (profile.xp / (profile.level * 100)) * 100 : 0}%` }}
                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              />
            </div>
          </div>
        </div>
      </aside>
 
      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-black italic tracking-tighter text-indigo-500">LIFE LEVELING</div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="flex gap-1 bg-slate-950/50 p-1 rounded-xl border border-slate-800/50">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Квесты
              </button>
              <button 
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Статы
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Общий Опыт</div>
              <div className="text-lg font-mono font-bold text-white">{(profile?.level || 0) * 1000 + (profile?.xp || 0)} XP</div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500 group"
              title="Выйти"
            >
              <LogOut className="w-5 h-5 group-hover:text-rose-400 transition-colors" />
            </button>
          </div>
        </header>
 
        <div ref={mainRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 pb-20"
              >
                <div className="flex justify-between items-end">
                  <h2 className="text-3xl font-bold text-white">Активные квесты</h2>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleGenerateQuests()}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wider border border-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <motion.div
                        animate={isGenerating ? { rotate: 360 } : {}}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </motion.div>
                      {isGenerating ? 'В процессе...' : 'Новые квесты'}
                    </button>
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
                      {quests.filter(q => q.status === 'pending').length} заданий осталось
                    </span>
                  </div>
                </div>
 
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <AttributeCard icon={<Swords className="w-5 h-5 text-red-400" />} label="Сила" value={profile?.attributes.strength || 0} color="border-red-500/10 bg-red-500/5" />
                  <AttributeCard icon={<Brain className="w-5 h-5 text-blue-400" />} label="Интеллект" value={profile?.attributes.intelligence || 0} color="border-blue-500/10 bg-blue-500/5" />
                  <AttributeCard icon={<Palette className="w-5 h-5 text-amber-400" />} label="Креатив" value={profile?.attributes.creativity || 0} color="border-amber-500/10 bg-amber-500/5" />
                  <AttributeCard icon={<Zap className="w-5 h-5 text-emerald-400" />} label="Выносливость" value={profile?.attributes.stamina || 0} color="border-emerald-500/10 bg-emerald-500/5" />
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {[...quests]
                      .sort((a, b) => {
                        if (a.status === 'completed' && b.status !== 'completed') return 1;
                        if (a.status !== 'completed' && b.status === 'completed') return -1;
                        return 0;
                      })
                      .map((quest) => (
                        <QuestCard key={quest.id} quest={quest} onComplete={() => completeQuest(quest)} />
                      ))}
                  </AnimatePresence>
                  {quests.length === 0 && (
                    <div className="col-span-full h-80 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-center p-8">
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
 
        <nav className="fixed bottom-8 left-1/2 lg:left-[calc(50%+160px)] -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-2 flex gap-1 shadow-2xl z-50 ring-1 ring-white/5">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Квесты" />
          <NavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 />} label="Статы" />
        </nav>
      </main>
    </div>
  );
}
 
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await onLogin();
    } catch (err: any) {
      console.error('Login failed:', err);
      setError('Не удалось войти в систему. Пожалуйста, попробуйте снова.');
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
          Превратите свои цели в эпические квесты и прокачайте свою жизнь как персонажа RPG.
        </p>
        
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
 
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full py-4 px-6 bg-white text-black font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-wait"
        >
          {isLoggingIn ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </motion.div>
          ) : (
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          )}
          {isLoggingIn ? 'Вход...' : 'Войти через Google'}
        </button>
      </div>
    </div>
  );
}
 
function Onboarding({ onComplete }: { onComplete: (goals: string) => void }) {
  const [goals, setGoals] = useState('');
 
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl"
      >
        <h2 className="text-2xl font-bold mb-4">Добро пожаловать, Искатель!</h2>
        <p className="text-slate-400 mb-6 leading-relaxed">
          Чтобы нейросеть создала для вас квесты, опишите ваши цели. Чем вы хотите заниматься? Чему научиться? (Напр.: Хочу стать сильнее в спорте, выучить английский и рисовать каждый день)
        </p>
        <textarea 
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="Напишите ваши желания здесь..."
          className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-200"
        />
        <button 
          disabled={!goals.trim()}
          onClick={() => onComplete(goals)}
          className="w-full mt-6 py-4 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
        >
          Начать приключение
        </button>
      </motion.div>
    </motion.div>
  );
}
 
function CharacterCard({ profile }: { profile: UserProfile }) {
  const xpNeeded = profile.level * 100;
  const progress = (profile.xp / xpNeeded) * 100;
 
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group shadow-xl"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Trophy className="w-24 h-24 rotate-12" />
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-2xl text-indigo-400">
          {profile.level}
        </div>
        <div>
          <h3 className="text-xl font-bold">{profile.displayName}</h3>
          <p className="text-slate-400 text-sm italic">Уровень {profile.level} Мастер</p>
        </div>
      </div>
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>Опыт (XP)</span>
          <span>{profile.xp} / {xpNeeded}</span>
        </div>
        <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Attribute value={profile.attributes.strength} label="Сила" icon={<Swords className="w-4 h-4" />} color="text-rose-400" />
        <Attribute value={profile.attributes.intelligence} label="Интеллект" icon={<Brain className="w-4 h-4" />} color="text-blue-400" />
        <Attribute value={profile.attributes.creativity} label="Креатив" icon={<Palette className="w-4 h-4" />} color="text-amber-400" />
        <Attribute value={profile.attributes.stamina} label="Выносливость" icon={<Zap className="w-4 h-4" />} color="text-emerald-400" />
      </div>
    </motion.div>
  );
}
 
function Attribute({ value, label, icon, color }: { value: number, label: string, icon: React.ReactNode, color: string }) {
  const level = Math.floor(value / 100) + 1;
  const progress = value % 100;
  return (
    <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-950 border border-slate-800/50">
      <div className={color}>{icon}</div>
      <div className="text-lg font-bold mt-1 tabular-nums leading-none">LV {level}</div>
      <div className="text-[10px] text-slate-500 uppercase font-black mb-2">{label}</div>
      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full ${color.replace('text-', 'bg-')}`}
        />
      </div>
    </div>
  );
}
 
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
      whileHover={!isCompleted ? { y: -4, borderColor: 'rgba(99, 102, 241, 0.4)' } : {}}
      className={`group p-6 rounded-[2rem] border transition-all duration-300 flex flex-col h-full ${
        isCompleted 
          ? 'bg-slate-900 border-slate-800 opacity-50' 
          : 'bg-slate-800/40 border-slate-700/50 shadow-lg hover:shadow-indigo-500/5'
      }`}
    >
      <div className="flex justify-between items-start mb-5">
        <div className="flex flex-wrap gap-2">
          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${difficultyColors[quest.difficulty]}`}>
            {quest.difficulty === 'easy' ? 'Легко' : quest.difficulty === 'medium' ? 'Средне' : 'Сложно'}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-slate-700 text-slate-500 italic">
            {quest.type === 'daily' ? 'Ежедневный' : 'Особый'}
          </span>
        </div>
      </div>
      <h3 className={`text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors ${isCompleted ? 'line-through text-slate-600' : 'text-white'}`}>
        {quest.title}
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">{quest.description}</p>
      <div className="mt-auto flex items-center justify-between">
        <div>
          <span className="block text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Награда</span>
          <span className={`text-sm font-bold font-mono ${attributeColors[quest.attribute]}`}>
            +{quest.xpReward} XP {quest.attribute.toUpperCase()}
          </span>
        </div>
        <button 
          onClick={onComplete}
          disabled={isCompleted}
          className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            isCompleted 
              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 cursor-default' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95'
          }`}
        >
          {isCompleted ? 'Завершено' : 'Начать'}
        </button>
      </div>
    </motion.div>
  );
}
 
function SidebarStat({ label, value, color }: { label: string, value: number, color: string }) {
  const level = Math.floor(value / 100) + 1;
  const progress = value % 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-semibold">
        <span className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          {label}
        </span>
        <span className="font-mono text-slate-400">LV {level} · {progress}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
 
function StatsScreen({ profile, onUpdateGoals }: { profile: UserProfile | null, onUpdateGoals: (goals: string) => Promise<void> }) {
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editedGoals, setEditedGoals] = useState(profile?.goals || '');
  const [isSaving, setIsSaving] = useState(false);
  const [questStats, setQuestStats] = useState({ total_completed: 0, monthly_completed: 0 });

  useEffect(() => {
    apiRequest('/quests/stats/').then(setQuestStats).catch(console.error);
  }, []);

  const xpNeeded = (profile?.level || 1) * 100;
  const progress = ((profile?.xp || 0) / xpNeeded) * 100;

  const handleSaveGoals = async () => {
    setIsSaving(true);
    await onUpdateGoals(editedGoals);
    setIsSaving(false);
    setIsEditingGoals(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-10 pb-24"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white tracking-tight">Статистика Персонажа</h2>
        <div className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
          {format(new Date(), 'MMMM yyyy', { locale: ru })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600/20 to-purple-600/5 border border-indigo-500/20 rounded-[3rem] p-10 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Trophy className="w-48 h-48" />
          </div>
          <div className="relative mb-8">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
              <motion.circle
                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={552.92}
                initial={{ strokeDashoffset: 552.92 }}
                animate={{ strokeDashoffset: 552.92 - (552.92 * progress) / 100 }}
                className="text-indigo-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Уровень</span>
              <span className="text-6xl font-black text-white leading-none">{profile?.level || 1}</span>
            </div>
          </div>
          <div className="space-y-4 w-full max-w-sm">
            <div className="flex justify-between items-end">
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Текущий Опыт</p>
                <p className="text-2xl font-bold text-white tabular-nums">{profile?.xp || 0} XP</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">До уровня {(profile?.level || 1) + 1}</p>
                <p className="text-xl font-bold text-slate-300 tabular-nums">{xpNeeded - (profile?.xp || 0)} XP</p>
              </div>
            </div>
            <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden p-1 border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <Target className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Твои Цели</p>
              </div>
              {!isEditingGoals ? (
                <button onClick={() => setIsEditingGoals(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-1">
                  <button onClick={handleSaveGoals} disabled={isSaving} className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-500 transition-all disabled:opacity-50">
                    {isSaving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setIsEditingGoals(false); setEditedGoals(profile?.goals || ''); }} className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-500 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {isEditingGoals ? (
              <textarea
                value={editedGoals}
                onChange={(e) => setEditedGoals(e.target.value)}
                className="w-full h-32 bg-slate-950/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Напишите ваши новые цели..."
              />
            ) : (
              <p className="text-sm text-slate-300 leading-relaxed italic">
                {profile?.goals || "Цели не заданы. Нажми редактировать, чтобы добавить их."}
              </p>
            )}
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] p-8 shadow-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Всего завершено</p>
            <div className="text-4xl font-black text-white mb-1">{questStats.total_completed}</div>
            <p className="text-xs text-slate-500">квестов за всё время</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] p-8 shadow-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">За этот месяц</p>
            <div className="text-4xl font-black text-indigo-400 mb-1">{questStats.monthly_completed}</div>
            <p className="text-xs text-slate-500">квестов выполнено</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-[3rem] p-10 shadow-xl">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Мастерство характеристик</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          <StatBar label="Сила" value={profile?.attributes.strength || 0} color="bg-red-500" />
          <StatBar label="Интеллект" value={profile?.attributes.intelligence || 0} color="bg-blue-500" />
          <StatBar label="Креативность" value={profile?.attributes.creativity || 0} color="bg-amber-500" />
          <StatBar label="Выносливость" value={profile?.attributes.stamina || 0} color="bg-emerald-500" />
        </div>
      </div>
    </motion.div>
  );
}
 
function StatBar({ label, value, color }: { label: string, value: number, color: string }) {
  const level = Math.floor(value / 100) + 1;
  const progress = value % 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="uppercase tracking-[0.1em] font-black text-[10px] text-slate-500 flex items-center gap-2">
          {label} <span className="text-white/40">LV {level}</span>
        </span>
        <span className="font-mono font-bold text-white">{progress}%</span>
      </div>
      <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full ${color} shadow-lg`}
        />
      </div>
    </div>
  );
}
 
function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <div className={`${active ? 'text-white' : 'text-slate-500'} w-5 h-5 flex items-center justify-center`}>
        {icon}
      </div>
      {active && <span className="font-bold text-sm tracking-tight">{label}</span>}
    </button>
  );
}
 
function AttributeCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  const level = Math.floor(value / 100) + 1;
  const progress = value % 100;
  const barColor = color.includes('emerald') ? 'bg-emerald-500' : 
                   color.includes('blue') ? 'bg-blue-500' : 
                   color.includes('amber') ? 'bg-amber-500' :
                   color.includes('red') ? 'bg-red-500' : 'bg-indigo-500';
  return (
    <div className={`p-4 rounded-3xl border ${color} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        </div>
        <div className="text-[10px] font-black text-white px-2 py-0.5 bg-white/10 rounded-full">LV {level}</div>
      </div>
      <div className="h-2 bg-slate-950 rounded-full overflow-hidden mt-3 mb-1">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full ${barColor}`} />
      </div>
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[9px] font-bold text-slate-500 tabular-nums">{progress}%</span>
        <span className="text-[9px] font-bold text-slate-600">{(level + 1) * 100 - value} XP to Next</span>
      </div>
    </div>
  );
}
 
function QuestRewardModal({ quest, onClose }: { quest: Quest, onClose: () => void }) {
  const iconMap = {
    strength: <Swords className="w-12 h-12 text-red-400" />,
    intelligence: <Brain className="w-12 h-12 text-blue-400" />,
    creativity: <Palette className="w-12 h-12 text-amber-400" />,
    stamina: <Zap className="w-12 h-12 text-emerald-400" />,
  };
  const nameMap = {
    strength: 'Сила',
    intelligence: 'Интеллект',
    creativity: 'Креативность',
    stamina: 'Выносливость',
  };
 
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 px-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20, rotateX: 10 }}
        animate={{ scale: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 15, stiffness: 300 }}
        className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] max-w-sm w-full text-center relative shadow-[0_0_100px_rgba(99,102,241,0.2)]"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 p-6 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.1 }}
          >
            {iconMap[quest.attribute]}
          </motion.div>
        </div>
        <div className="mt-10 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Квест Завершен!</h3>
            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{quest.title}</h2>
          </motion.div>
          <div className="grid grid-cols-2 gap-4 py-6 px-4 bg-slate-800/40 rounded-3xl border border-slate-800/50">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <div className="text-2xl font-black text-white font-mono">+{quest.xpReward}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Опыт (XP)</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
  <div className="text-2xl font-black text-white font-mono">+{quest.xpReward}</div>
  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{nameMap[quest.attribute]}</div>
  <div className="text-xs font-bold text-indigo-400 mt-1"></div>
</motion.div>
              </div>
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 uppercase tracking-widest text-xs"
          >
            Принять награды
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
 