import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Search, SlidersHorizontal, Play, Lock, Star, ChevronRight, Activity, Dumbbell, History, Plus, Check, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { cn } from '../lib/utils';

interface WorkoutTrackerProps {
  user: User;
}

const MUSCLE_GROUPS = ['All', 'Chest', 'Abs', 'Arms', 'Legs', 'Cardio', 'Back'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export function WorkoutTracker({ user }: WorkoutTrackerProps) {
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Beginner');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogForm, setShowLogForm] = useState(false);
  
  // For logging
  const [Saving, setSaving] = useState(false);
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const exercises = [
    { id: 1, name: 'Lunges', level: 'Beginner', points: 30, muscle: 'Legs', image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&q=80' },
    { id: 2, name: 'Plank', level: 'Beginner', points: 20, muscle: 'Abs', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80' },
    { id: 3, name: 'Push Ups', level: 'Intermediate', points: 40, muscle: 'Chest', image: 'https://images.unsplash.com/photo-1598971639058-aba7c043d8c7?w=800&q=80' },
    { id: 4, name: 'Burpees', level: 'Advanced', points: 50, muscle: 'Cardio', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80' },
  ];

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise || !sets || !reps) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'workouts'), {
        uid: user.uid,
        exerciseName: exercise,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: parseFloat(weight) || 0,
        timestamp: serverTimestamp()
      });
      setExercise(''); setSets(''); setReps(''); setWeight('');
      setShowLogForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'workouts');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Guided Exercises</span>
        </div>
        <div className="space-y-1">
          <h2 className="text-4xl font-display font-black text-[var(--color-text-main)] leading-tight">Train <span className="text-primary italic">smarter.</span></h2>
          <p className="text-[var(--color-text-muted)] text-sm font-medium leading-relaxed max-w-sm">
            500+ exercises with proper form videos, muscle targeting, and difficulty levels — tailored to your goals.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input 
            type="text" 
            placeholder="Search exercises, muscles, equipment..."
            className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl pl-12 pr-4 py-4 text-[var(--color-text-main)] shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] px-1">Muscle Group</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {MUSCLE_GROUPS.map(muscle => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-2",
                  selectedMuscle === muscle 
                    ? "bg-black text-white border-black" 
                    : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                )}
              >
                {muscle === 'All' && <Bot className="w-4 h-4" />}
                {muscle}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] px-1">Difficulty</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All', ...DIFFICULTIES].map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={cn(
                  "px-6 py-2 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all",
                  selectedDifficulty === diff 
                    ? "bg-primary text-black border-primary font-black" 
                    : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                )}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-display font-black text-[var(--color-text-main)]">All Exercises</h3>
          <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-wider">22 results</span>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {exercises.map(ex => (
            <motion.div 
              key={ex.id}
              className="fuelfit-card !p-0 overflow-hidden group border-[var(--color-border)]"
            >
              <div className="relative aspect-video overflow-hidden">
                <img src={ex.image} alt={ex.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 right-4">
                  <span className="bg-[#FEF3C7] text-[#92400E] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {ex.level}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-primary/90 rounded-full flex items-center justify-center text-black shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-300">
                    <Play className="w-6 h-6 fill-black" />
                  </div>
                </div>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-display font-black text-[var(--color-text-main)] italic uppercase">{ex.name}</h4>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{ex.muscle} • PROPER FORM</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)]" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Custom Workout Log Section */}
      <div className="pt-10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display font-bold text-black">Your Sessions</h3>
          <button 
            onClick={() => setShowLogForm(!showLogForm)}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Log Manually
          </button>
        </div>

        <AnimatePresence>
          {showLogForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleLogWorkout} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl space-y-4">
                <input 
                  type="text" placeholder="Exercise Name" value={exercise} onChange={e => setExercise(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl"
                />
                <div className="grid grid-cols-3 gap-4">
                  <input type="number" placeholder="Sets" value={sets} onChange={e => setSets(e.target.value)} className="p-4 bg-gray-50 border-none rounded-2xl" />
                  <input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} className="p-4 bg-gray-50 border-none rounded-2xl" />
                  <input type="number" placeholder="Weight" value={weight} onChange={e => setWeight(e.target.value)} className="p-4 bg-gray-50 border-none rounded-2xl" />
                </div>
                <button type="submit" className="w-full bg-primary text-black font-bold py-4 rounded-2xl">
                  {Saving ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Save Session'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
