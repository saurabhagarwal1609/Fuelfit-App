import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { generateMealPlan } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { Utensils, Sparkles, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../services/firestore';

interface MealPlannerProps {
  user: User;
}

export function MealPlanner({ user }: MealPlannerProps) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const userRef = doc(db, 'users', user.uid);
      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setUserProfile(snap.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.uid]);

  const handleGenerate = async () => {
    if (!userProfile) return;
    setGenerating(true);
    const plan = await generateMealPlan(userProfile);
    setMealPlan(plan);
    setGenerating(false);
  };

  if (loading) return <div className="animate-pulse h-64 bg-[var(--color-bg-card)] rounded-3xl" />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-display font-bold text-[var(--color-text-main)]">Personal Planner</h2>
          <p className="text-[var(--color-text-muted)] font-medium italic">Custom nutrition paths powered by AI</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-primary text-black px-8 py-4 rounded-[20px] font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-primary/20"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 fill-black" />}
          {mealPlan ? 'Refresh Strategy' : 'Design My Plan'}
        </button>
      </div>

      {!mealPlan && !generating ? (
        <div className="bg-[var(--color-bg-card)] rounded-[40px] p-16 text-center border border-[var(--color-border)] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 blur-[100px] -translate-y-1/2 group-hover:bg-primary/10 transition-colors" />
          <div className="relative">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-primary/20">
              <Utensils className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-3xl font-display font-bold mb-4 text-[var(--color-text-main)]">Your plate is a canvas.</h3>
            <p className="text-[var(--color-text-muted)] max-w-sm mx-auto mb-10 font-medium leading-relaxed">
              We'll analyze your {userProfile?.goal?.replace('_', ' ')} goal and {userProfile?.dailyCalorieTarget} kcal target to construct the perfect daily menu.
            </p>
            <button
              onClick={handleGenerate}
              className="bg-[var(--color-text-main)] text-[var(--color-bg-base)] px-10 py-4 rounded-2xl font-bold hover:bg-primary hover:text-black transition-all inline-flex items-center gap-2 group/btn"
            >
              Initialize AI Engine <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-bg-card)] rounded-[40px] border border-[var(--color-border)] shadow-2xl overflow-hidden"
        >
          {generating ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
                <Sparkles className="w-8 h-8 text-primary absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-display font-bold text-2xl text-[var(--color-text-main)]">Building your path...</p>
                <p className="text-[var(--color-text-muted)] text-xs font-black uppercase tracking-[0.2em]">Neural processing in progress</p>
              </div>
            </div>
          ) : (
            <div className="p-10">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest">Optimized Strategy</p>
                    <p className="font-display font-bold text-xl uppercase italic text-[var(--color-text-main)]">Fuel Protocol</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Target Intake</p>
                  <p className="text-2xl font-display font-bold text-[var(--color-text-main)]">{userProfile?.dailyCalorieTarget}<span className="text-xs text-primary ml-1 italic">kcal</span></p>
                </div>
              </div>
              <div className="markdown-body">
                <ReactMarkdown>{mealPlan || ''}</ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Intensity', value: 'High', icon: RefreshCw },
          { label: 'Mode', value: userProfile?.goal?.replace('_', ' '), icon: Utensils },
          { label: 'Target', value: `${userProfile?.dailyCalorieTarget} kcal`, icon: Sparkles },
          { label: 'System', value: 'Active', icon: ChevronRight },
        ].map((stat, i) => (
          <div key={i} className="bg-[var(--color-bg-card)] p-6 rounded-[24px] border border-[var(--color-border)] space-y-1">
            <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">{stat.label}</p>
            <p className="font-display font-bold text-lg italic uppercase text-[var(--color-text-main)]">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
