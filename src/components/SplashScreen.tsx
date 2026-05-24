import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Apple, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  isVisible: boolean;
}

export function SplashScreen({ isVisible }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.1,
            filter: "blur(10px)",
            transition: { duration: 0.8, ease: "easeInOut" } 
          }}
          className="fixed inset-0 z-[100] bg-[#050D08] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute inset-0">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1] 
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full"
            />
          </div>

          <div className="relative flex flex-col items-center space-y-12">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
              className="relative"
            >
              <div className="w-24 h-24 flex items-center justify-center relative z-10">
                <svg viewBox="0 0 100 100" className="w-full h-full text-primary fill-current">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
                  <circle cx="50" cy="50" r="15" />
                  <path d="M50 5 L50 25 M50 75 L50 95 M5 50 L25 50 M75 50 L95 50" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </div>
              {/* Floating Sparkles */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-4 -right-4 text-primary"
              >
                <Sparkles className="w-8 h-8" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <div className="text-center space-y-2">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-6xl font-display font-black text-white italic uppercase tracking-tighter"
              >
                FuelFit
              </motion.h1>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="h-1 bg-primary mx-auto"
              />
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-primary/60 font-black uppercase tracking-[0.4em] text-[10px]"
              >
                AI-Powered Performance
              </motion.p>
            </div>
          </div>

          {/* Bottom Progress Indicator */}
          <div className="absolute bottom-20 left-0 right-0 px-12">
            <div className="max-w-xs mx-auto space-y-4">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                  className="h-full bg-primary shadow-[0_0_15px_rgba(143,255,0,0.8)]"
                />
              </div>
              <p className="text-[10px] text-center font-bold text-white/20 uppercase tracking-widest">
                Optimizing neural paths...
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
