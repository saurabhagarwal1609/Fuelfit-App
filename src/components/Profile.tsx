import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Camera, Settings, ChevronRight, Save, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../services/firestore';

interface ProfileProps {
  user: User;
  setActiveTab: (tab: string) => void;
}

export function Profile({ user, setActiveTab }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch User Profile
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setProfile({ id: snap.id, ...snap.data() });
        }

        // Fetch Weekly Stats
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const mealsQuery = query(
          collection(db, 'meals'),
          where('uid', '==', user.uid),
          where('timestamp', '>=', Timestamp.fromDate(weekAgo))
        );
        const mealsSnap = await getDocs(mealsQuery);
        const meals = mealsSnap.docs.map(d => d.data());
        
        if (meals.length > 0) {
          const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0) / 7;
          const totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0) / 7;
          const totalFats = meals.reduce((s, m) => s + (m.fat || 0), 0) / 7;
          setStats({
            protein: Math.round(totalProtein),
            carbs: Math.round(totalCarbs),
            fats: Math.round(totalFats)
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.uid]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
      />
    </div>
  );

  const menuItems = [
    { label: 'Personal Information', sub: 'Details about your physical body' },
    { label: 'Dietary Preferences', sub: 'Vegetarian, Vegan, Allergies etc' },
    { label: 'Notifications', sub: 'Manage alerts and reminders' },
    { label: 'Subscription', sub: 'Manage your pro features' },
    { label: 'Log Out', sub: 'Sign out of your account', color: 'text-red-500' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col items-center gap-6 text-center pt-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-2xl relative">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-4xl font-bold text-black font-display uppercase">
                {user.displayName?.[0]}
              </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-10 h-10 bg-[var(--color-bg-base)] rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--color-border)]">
            <Camera className="w-5 h-5 text-[var(--color-text-main)]" />
          </button>
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-[var(--color-text-main)]">{user.displayName || 'Saurabh Agarwal'}</h2>
          <p className="text-[var(--color-text-muted)] font-medium">Fitness enthusiast and tech explorer</p>
        </div>
      </div>

      {/* Weekly Averages */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold font-display text-[var(--color-text-main)]">Weekly Average</h3>
          <span className="text-[var(--color-text-muted)] text-sm font-medium italic">Last 7 days</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Protein', value: stats.protein, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { label: 'Carbs', value: stats.carbs, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { label: 'Fats', value: stats.fats, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
          ].map((macro) => (
            <motion.div 
              key={macro.label}
              whileHover={{ y: -5 }}
              className={cn("p-4 rounded-[28px] border flex flex-col gap-2 transition-all", macro.bg, macro.border)}
            >
              <span className={cn("text-[10px] font-bold uppercase tracking-widest", macro.color)}>{macro.label}</span>
              <p className="text-2xl font-bold text-[var(--color-text-main)]">{macro.value}<span className="text-sm font-medium lowercase opacity-60">g</span></p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Menu / Settings */}
      <div className="bg-[var(--color-bg-card)] rounded-[40px] overflow-hidden border border-[var(--color-border)]">
        {menuItems.map((item, index) => (
          <button 
            key={item.label}
            className={cn(
              "w-full flex items-center justify-between p-6 hover:bg-[var(--color-text-main)]/5 transition-colors text-left",
              index !== menuItems.length - 1 ? "border-b border-[var(--color-border)]" : ""
            )}
          >
            <div className="space-y-1">
              <span className={cn("font-bold text-lg", item.color || "text-[var(--color-text-main)]")}>{item.label}</span>
              <p className="text-[var(--color-text-muted)] text-sm font-medium truncate max-w-xs">{item.sub}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        ))}
      </div>

      {/* Stats Card */}
      <div className="bg-primary/5 rounded-[40px] p-8 border border-primary/10 flex items-center justify-between">
        <div className="space-y-2">
          <h4 className="text-primary font-bold">Pro Membership</h4>
          <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-[200px]">Unlock advanced AI meal tracking and personal coaching.</p>
        </div>
        <button className="bg-primary text-black font-bold px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
          Upgrade
        </button>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
