import React from 'react';
import { ChefHat, Search, Filter, Play, Heart, Clock } from 'lucide-react';
import { motion } from 'motion/react';

const RECIPES = [
  { id: 1, name: 'Quinoa Power Bowl', cal: 420, time: '15 min', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', tags: ['High Protein', 'Vegan'] },
  { id: 2, name: 'Salmon & Asparagus', cal: 380, time: '25 min', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80', tags: ['Keto', 'Omega-3'] },
  { id: 3, name: 'Greek Yogurt Parfait', cal: 250, time: '5 min', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', tags: ['Breakfast', 'Low Fat'] },
];

export function Recipes() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h2 className="text-4xl font-display font-bold">Healthy Recipes</h2>
        <p className="text-gray-500">Delicious meals optimized for your body</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search recipes, ingredients..." 
          className="w-full bg-[#121212] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {RECIPES.map(recipe => (
          <motion.div 
            key={recipe.id}
            whileHover={{ y: -5 }}
            className="bg-[#121212] rounded-[32px] overflow-hidden border border-white/5 group"
          >
            <div className="relative aspect-video">
              <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <button className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                <Heart className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                {recipe.tags.map(tag => (
                  <span key={tag} className="text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-2xl font-display font-bold leading-tight">{recipe.name}</h3>
              <div className="flex items-center gap-6 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {recipe.time}</span>
                <span className="flex items-center gap-1.5"><ChefHat className="w-3.5 h-3.5" /> {recipe.cal} kcal</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
