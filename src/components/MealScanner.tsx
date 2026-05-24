import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, Check, X, ArrowLeft, Lightbulb, Info } from 'lucide-react';
import { analyzeMealImage, MealAnalysis } from '../services/gemini';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../services/firestore';

interface MealScannerProps {
  user: User;
  onMealLogged: () => void;
  setActiveTab: (tab: string) => void;
}

export function MealScanner({ user, onMealLogged, setActiveTab }: MealScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        analyzeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeMealImage(base64.split(',')[1]);
      setAnalysis(result);
    } catch (e) {
      console.error("AI Analysis failed", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'meals'), {
        uid: user.uid,
        name: analysis.name,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fat: analysis.fat,
        imageUrl: image,
        timestamp: serverTimestamp()
      });
      onMealLogged();
      reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'meals');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setImage(null);
    setAnalysis(null);
    setAnalyzing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <button 
          onClick={() => image ? reset() : setActiveTab('dashboard')} 
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold font-display">Scan Meal</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <AnimatePresence mode="wait">
        {!image ? (
          <motion.div
            key="scanner-home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Visual Frame */}
            <div className="relative w-48 h-48">
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
              {/* Main Circle */}
              <div className="absolute inset-0 border-[6px] border-primary/20 rounded-full flex items-center justify-center">
                <div className="w-40 h-40 border-[3px] border-primary rounded-full flex items-center justify-center bg-transparent">
                  <Camera className="w-16 h-16 text-primary" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tight">Scan Your Meal</h3>
              <p className="text-[var(--color-text-muted)] max-w-[240px] mx-auto text-sm font-medium">
                Take a photo or select from gallery to analyze nutritional content
              </p>
            </div>

            <div className="w-full space-y-4 pt-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-primary hover:bg-primary/90 text-black font-black py-5 rounded-[24px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 italic uppercase"
              >
                <Camera className="w-6 h-6" />
                Take Photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-transparent border-2 border-primary hover:bg-primary/10 text-primary font-black py-5 rounded-[24px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] italic uppercase"
              >
                Choose from Gallery
              </button>
            </div>

            {/* Tips Card */}
            <div className="w-full bg-[var(--color-bg-card)] rounded-[32px] p-6 space-y-5 border border-[var(--color-border)] mt-4">
              <h4 className="font-bold text-lg text-[var(--color-text-main)]">Tips for best results:</h4>
              <ul className="space-y-3">
                {[
                  'Ensure good lighting',
                  'Capture the entire meal',
                  'Keep items separated'
                ].map((tip, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(143,255,0,0.4)]">
                      <Check className="w-4 h-4 text-black stroke-[3px]" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-text-main)]/80">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="analysis-view"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="relative aspect-square rounded-[40px] overflow-hidden border border-white/5 shadow-2xl">
              <img src={image} alt="Taken meal" className="w-full h-full object-cover" />
              {analyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6"
                  >
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  </motion.div>
                  <h3 className="text-2xl font-bold">AI Analyzing...</h3>
                  <p className="text-gray-400 mt-2">Identifying ingredients and calculating nutrition</p>
                </div>
              )}
            </div>

            {analysis && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-display font-bold">{analysis.name}</h3>
                    <p className="text-gray-500">{analysis.description}</p>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl flex flex-col items-center">
                    <span className="text-3xl font-display font-bold text-primary">{analysis.calories}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Kcal</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Protein', value: analysis.protein, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Carbs', value: analysis.carbs, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { label: 'Fats', value: analysis.fat, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                  ].map((macro) => (
                    <div key={macro.label} className={cn("p-4 rounded-[24px] border border-white/5 flex flex-col gap-2", macro.bg)}>
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest", macro.color)}>{macro.label}</span>
                      <p className="text-2xl font-bold">{macro.value}g</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={saveMeal}
                    disabled={saving}
                    className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-5 rounded-[24px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                    Confirm & Log Meal
                  </button>
                  <button
                    onClick={reset}
                    disabled={saving}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-[24px] transition-all active:scale-[0.98]"
                  >
                    Retake Photo
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
