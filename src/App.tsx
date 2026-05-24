import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Auth, Layout } from './components';
import { Dashboard, MealScanner, MealPlanner, Profile, SplashScreen, WorkoutTracker } from './components';
import { User } from 'firebase/auth';

// Error Boundary for Firestore and App errors
 class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
   constructor(props: { children: ReactNode }) {
     super(props);
     this.state = { hasError: false, error: null };
   }

   static getDerivedStateFromError(error: any) {
     return { hasError: true, error };
   }

   componentDidCatch(error: any, errorInfo: ErrorInfo) {
     console.error("Uncaught error:", error, errorInfo);
   }

   render() {
     if (this.state.hasError) {
       return (
         <div className="min-h-screen bg-black flex items-center justify-center p-6">
           <div className="max-w-md w-full bg-[#121212] rounded-[40px] p-10 border border-white/5 text-center space-y-6">
             <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
               <Activity className="w-10 h-10" />
             </div>
             <div className="space-y-2">
               <h2 className="text-3xl font-display font-bold text-white tracking-tight">System Halted</h2>
               <p className="text-gray-500 font-medium">
                 {this.state.error?.message || "An unexpected error occurred in your flight path."}
               </p>
             </div>
             <button
               onClick={() => window.location.reload()}
               className="w-full bg-primary text-black font-black py-5 rounded-[24px] hover:scale-105 transition-transform"
             >
               REBOOT SYSTEM
             </button>
           </div>
         </div>
       );
     }

     return this.props.children;
   }
 }

import { Activity } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleMealLogged = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('dashboard');
  };

  const renderContent = (user: User) => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard key={refreshKey} user={user} setActiveTab={setActiveTab} />;
      case 'scanner':
        return <MealScanner user={user} onMealLogged={handleMealLogged} setActiveTab={setActiveTab} />;
      case 'planner':
        return <MealPlanner user={user} />;
      case 'workouts':
        return <WorkoutTracker user={user} />;
      case 'profile':
        return <Profile user={user} setActiveTab={setActiveTab} />;
      default:
        return <Dashboard user={user} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <ErrorBoundary>
      <SplashScreen isVisible={showSplash} />
      <Auth>
        {(user) => (
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderContent(user)}
          </Layout>
        )}
      </Auth>
    </ErrorBoundary>
  );
}
