import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Camera, Trophy, ChevronRight, Apple, Sparkles, Activity, Star, Calendar, BarChart3, Droplets, Scan, Flame, Bot, Dumbbell, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { cn } from '../lib/utils';

interface DashboardProps {
  user: User;
  setActiveTab: (tab: string) => void;
}

export function Dashboard({ user, setActiveTab }: DashboardProps) {
  const [meals, setMeals] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserProfile(userSnap.data());

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mealsQuery = query(
          collection(db, 'meals'),
          where('uid', '==', user.uid),
          where('timestamp', '>=', Timestamp.fromDate(today)),
          orderBy('timestamp', 'desc')
        );
        
        const mealsSnap = await getDocs(mealsQuery);
        setMeals(mealsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.uid]);

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalFats = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

  const calorieTarget = userProfile?.dailyCalorieTarget || 2000;
  const proteinTarget = userProfile?.proteinTarget || 150;
  const carbsTarget = userProfile?.carbsTarget || 250;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-md mx-auto">
      {/* Greeting & Streak */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-display font-black text-[var(--color-text-main)]">Hello, FitFam! 👋</h1>
          <p className="text-[var(--color-text-muted)] text-xs font-medium">Let's achieve your goals today.</p>
        </div>
        <div className="fuelfit-card !p-2 !rounded-2xl flex items-center gap-2 border-primary/20 bg-primary/5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="pr-1">
            <p className="text-lg font-black leading-none text-[var(--color-text-main)]">7</p>
            <p className="text-[7px] font-black text-[var(--color-text-muted)] uppercase tracking-tighter -mt-0.5">Day Streak</p>
          </div>
        </div>
      </div>

      {/* Today's Summary Card */}
      <section className="fuelfit-card bg-gradient-to-br from-[var(--color-bg-card)] to-black/30 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <h2 className="text-[10px] font-black mb-6 text-[var(--color-text-main)]/60 uppercase tracking-[0.2em] relative z-10">Today's Summary</h2>
        
        <div className="flex items-center gap-6 relative z-10">
          {/* Main Calories Circle */}
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-[var(--color-text-main)]/5" />
              <motion.circle 
                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" 
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (Math.min(totalCalories/calorieTarget, 1) * 364.4)}
                className="text-primary drop-shadow-[0_0_8px_rgba(143,255,0,0.5)]"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-display font-black leading-none text-[var(--color-text-main)]">{totalCalories}</span>
              <span className="text-[8px] text-[var(--color-text-muted)] font-black uppercase tracking-widest mt-0.5">/ {calorieTarget} kcal</span>
              <div className="bg-primary/20 px-2 py-0.5 rounded-full mt-2">
                <span className="text-primary text-[8px] font-black uppercase tracking-tighter">{Math.round((totalCalories/calorieTarget)*100)}% Goal</span>
              </div>
            </div>
          </div>

          {/* Horizontal Progress Bars */}
          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-wider">Calories</span>
                </div>
                <p className="text-[10px] font-black text-[var(--color-text-main)]">{totalCalories} <span className="opacity-40">/ {calorieTarget}</span></p>
              </div>
              <div className="h-1.5 bg-[var(--color-text-main)]/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(totalCalories/calorieTarget)*100}%` }} className="h-full bg-primary" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-wider">Protein</span>
                </div>
                <p className="text-[10px] font-black text-[var(--color-text-main)]">{totalProtein}g <span className="opacity-40">/ {proteinTarget}g</span></p>
              </div>
              <div className="h-1.5 bg-[var(--color-text-main)]/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(totalProtein/proteinTarget)*100}%` }} className="h-full bg-blue-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <Apple className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-wider">Carbs</span>
                </div>
                <p className="text-[10px] font-black text-[var(--color-text-main)]">{totalCarbs}g <span className="opacity-40">/ {carbsTarget}g</span></p>
              </div>
              <div className="h-1.5 bg-[var(--color-text-main)]/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(totalCarbs/carbsTarget)*100}%` }} className="h-full bg-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Grid */}
      <section className="grid grid-cols-2 gap-4">
        {[
          { title: 'Scan Meal', sub: 'Scan food instantly', icon: Camera, bg: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', tab: 'scanner' },
          { title: 'Meal Plan', sub: 'Personalized for you', icon: Calendar, bg: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80', tab: 'planner' },
          { title: 'Workouts', sub: 'Track & improve', icon: Dumbbell, bg: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80', tab: 'workouts' },
          { title: 'Progress', sub: 'Monitor your journey', icon: BarChart3, bg: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=400&q=80' },
        ].map((action, idx) => (
          <button 
            key={idx}
            onClick={() => action.tab && setActiveTab(action.tab)}
            className="fuelfit-card !p-0 aspect-[1.3] relative overflow-hidden group active:scale-95 transition-transform"
          >
            <img src={action.bg} className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale group-hover:scale-110 group-hover:grayscale-0 transition-all duration-700" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-base)] via-[var(--color-bg-base)]/20 to-transparent" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <h3 className="font-display font-black text-sm uppercase leading-none tracking-tight text-[var(--color-text-main)]">{action.title}</h3>
                  <p className="text-[8px] text-[var(--color-text-muted)] font-black uppercase tracking-wider">{action.sub}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/5 group-hover:bg-primary group-hover:text-black transition-colors">
                  <action.icon className="w-4 h-4 text-[var(--color-text-main)] group-hover:text-black" />
                </div>
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* Daily Goals Row */}
      <section className="fuelfit-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-black tracking-[0.1em] text-[var(--color-text-main)] uppercase opacity-60">Daily Goals</h2>
          <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-transform">
            Edit Goals <ChevronRight className="inline w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Flame, val: totalCalories, total: calorieTarget, label: 'Calories', color: 'text-primary' },
            { icon: Activity, val: totalProtein, total: proteinTarget, label: 'Protein', color: 'text-blue-500' },
            { icon: Apple, val: totalCarbs, total: carbsTarget, label: 'Carbs', color: 'text-orange-400' },
            { icon: Droplets, val: 6, total: 8, label: 'Glasses', color: 'text-cyan-400' },
          ].map((goal, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[var(--color-text-main)]/5 flex items-center justify-center border border-[var(--color-border)]">
                <goal.icon className={cn("w-5 h-5", goal.color)} />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black leading-none text-[var(--color-text-main)]">{goal.val} <span className="text-[8px] opacity-40">/ {goal.total}</span></p>
                <p className="text-[7px] font-black text-[var(--color-text-muted)] uppercase mt-0.5 tracking-tighter">{goal.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FuelFit Tip Card */}
      <div className="fuelfit-card !p-4 flex items-center gap-4 bg-primary/5 border-primary/20 group cursor-pointer relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12" />
        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center relative z-10 shrink-0 border border-primary/20">
           <Bot className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex-1 space-y-0.5 relative z-10">
          <p className="text-primary text-[8px] font-black uppercase tracking-widest italic">FuelFit Tip</p>
          <p className="text-xs font-bold leading-tight text-[var(--color-text-main)]/90">Great job! You're on track to hit your protein goal today. Keep it up! 💪</p>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-primary transition-all relative z-10 mr-1" />
      </div>

      {/* Main Scan Button */}
      <button 
        onClick={() => setActiveTab('scanner')}
        className="w-full h-16 bg-primary text-black rounded-3xl font-display font-black text-lg uppercase flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(143,255,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        <Scan className="w-6 h-6 relative z-10" />
        <span className="relative z-10">Scan Your Meal</span>
      </button>

    </div>
  );
}

