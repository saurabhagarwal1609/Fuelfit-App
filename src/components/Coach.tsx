import React from 'react';
import { MessageSquare, Sparkles, Send, Brain, Bot, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

export function Coach() {
  return (
    <div className="h-[calc(100vh-180px)] flex flex-col space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Bot className="w-6 h-6 text-black" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">AI Health Coach</h2>
          <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Online & Ready
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-4">
        <div className="flex gap-4 max-w-[80%]">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex-shrink-0 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div className="bg-[#121212] p-5 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl border border-white/5 space-y-2">
            <p className="text-gray-300 leading-relaxed">
              Hey there! I'm your FuelFit coach. Based on your activity yesterday, I'd recommend focusing on hydration today.
            </p>
            <p className="text-gray-300 leading-relaxed">
              How are you feeling about your current nutrition goals?
            </p>
          </div>
        </div>

        <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
          <div className="w-8 h-8 bg-gray-800 rounded-lg flex-shrink-0" />
          <div className="bg-primary p-5 rounded-tl-3xl rounded-bl-3xl rounded-br-3xl text-black font-medium">
            Feeling good! Just finished my morning workout.
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 pt-4">
          <button className="bg-[#121212] border border-white/5 px-4 py-2 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:border-primary/40 transition-colors">
            Ask about macros
          </button>
          <button className="bg-[#121212] border border-white/5 px-4 py-2 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:border-primary/40 transition-colors">
            Workout tips
          </button>
          <button className="bg-[#121212] border border-white/5 px-4 py-2 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:border-primary/40 transition-colors">
            Recipe help
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative pt-4 border-t border-white/5">
        <input 
          type="text" 
          placeholder="Ask anything about your health..." 
          className="w-full bg-[#121212] border border-white/5 rounded-[24px] pl-6 pr-16 py-5 text-white focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-gray-600"
        />
        <button className="absolute right-3 top-[calc(50%+8px)] -translate-y-1/2 w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-black shadow-lg shadow-primary/20 transition-transform active:scale-95">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
