import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { LogIn, LogOut, Loader2, User as UserIcon, Check, ArrowRight, Sparkles, Scale, Ruler, Target, Activity, Scan, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateMealPlan } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { handleFirestoreError, OperationType } from '../services/firestore';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export function Auth({ children }: { children: (user: User) => React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    age: 25,
    height: 170,
    weight: 70,
    goal: 'maintain',
    activityLevel: 'moderate'
  });
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authStep, setAuthStep] = useState<'landing' | 'phone' | 'otp'>('landing');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          return;
        }

        if (!userSnap.exists()) {
          const names = currentUser.displayName?.split(' ') || [];
          const firstName = names[0] || '';
          const lastName = names.slice(1).join(' ') || '';

          const newUser = {
            uid: currentUser.uid,
            firstName,
            lastName,
            displayName: currentUser.displayName,
            email: currentUser.email,
            createdAt: serverTimestamp(),
            weight: 70,
            height: 170,
            age: 25,
            gender: 'other',
            activityLevel: 'moderate',
            goal: 'maintain',
            dailyCalorieTarget: 2000,
            onboardingCompleted: false
          };

          try {
            await setDoc(userRef, newUser);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
          }
          setOnboarding(true);
        } else {
          const data = userSnap.data();
          if (!data.onboardingCompleted) {
            setOnboarding(true);
          }
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setGeneratingSuggestions(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const calorieTarget = calculateCalories(onboardingData);
      
      const updatedProfile = {
        ...onboardingData,
        dailyCalorieTarget: calorieTarget,
        onboardingCompleted: true
      };

      try {
        await updateDoc(userRef, updatedProfile);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
      
      // Generate initial suggestions
      try {
        const plan = await generateMealPlan(updatedProfile);
        setSuggestions(plan);
      } catch (error) {
        console.error("Meal plan generation error:", error);
      }
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setGeneratingSuggestions(false);
      setOnboardingStep(3); // Move to suggestions view
    }
  };

  const calculateCalories = (data: any) => {
    // Basic BMR calculation (Mifflin-St Jeor)
    let bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
    const multipliers: any = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    let tdee = bmr * (multipliers[data.activityLevel] || 1.2);
    
    if (data.goal === 'lose_weight') return Math.round(tdee - 500);
    if (data.goal === 'gain_muscle') return Math.round(tdee + 300);
    return Math.round(tdee);
  };

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return;
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => {
        console.log('Recaptcha verified');
      }
    });
  };

  const handlePhoneSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setAuthStep('otp');
    } catch (error: any) {
      console.error("Phone sign in error:", error);
      setAuthError(error.message || "Failed to send OTP. Please check the number.");
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const verifyOtp = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (!confirmationResult) throw new Error("No confirmation result");
      await confirmationResult.confirm(otpCode);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      setAuthError("Invalid OTP code. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

    if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div id="recaptcha-container"></div>
        {/* Navigation */}
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Scan className="w-5 h-5 text-black" />
            </div>
            <span className="text-2xl font-display font-bold text-black italic">FuelFit</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm font-bold text-gray-400 hover:text-black transition-colors hidden md:block">Features</button>
            <button className="text-sm font-bold text-gray-400 hover:text-black transition-colors hidden md:block">Pricing</button>
            <button 
              onClick={() => setAuthStep('phone')}
              className="text-sm font-bold text-black hover:text-primary transition-colors border-2 border-black/5 px-6 py-2.5 rounded-full"
            >
              Sign In
            </button>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          {authStep === 'landing' ? (
            <motion.section 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-6 pt-12 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
              <div className="space-y-10">
                <div className="space-y-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">New: AI Meal Scanner 2.0</span>
                  </motion.div>
                  <h1 className="text-6xl md:text-8xl font-display font-black text-black leading-[0.9] tracking-tight">
                    FUEL YOUR <br />
                    <span className="text-primary italic">PROGRESS.</span>
                  </h1>
                  <p className="text-xl text-gray-500 font-medium max-w-lg leading-relaxed pt-4">
                    The most advanced AI-powered health companion. Scan your meals, track your workouts, and reach your goals.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => setAuthStep('phone')}
                    className="bg-black text-white px-10 py-5 rounded-[24px] font-bold text-lg hover:bg-primary hover:text-black transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 active:scale-95"
                  >
                    Start Free Today <ArrowRight className="w-5 h-5" />
                  </button>
                  <button className="bg-white text-black border-2 border-black/5 px-10 py-5 rounded-[24px] font-bold text-lg hover:border-black/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                    Watch Demo
                  </button>
                </div>

                <div className="flex items-center gap-8 pt-8">
                  <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-4 border-white overflow-hidden shadow-sm">
                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="" />
                      </div>
                    ))}
                    <div className="w-12 h-12 rounded-full border-4 border-white bg-primary flex items-center justify-center font-bold text-xs shadow-sm">
                      +2k
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}
                    </div>
                    <p className="text-sm font-bold text-gray-400">Join 2,000+ happy users</p>
                  </div>
                </div>
              </div>

              {/* Hero Image / Visual */}
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-[80px] blur-[120px] group-hover:bg-primary/30 transition-all duration-700" />
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative aspect-square md:aspect-[4/5] lg:aspect-[3/4] rounded-[60px] overflow-hidden border-[12px] border-white shadow-2xl skew-y-3 group-hover:skew-y-0 transition-transform duration-700"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80" 
                    alt="Healthy Meal" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-12">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[32px] space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-bold text-xl font-display italic">Bowl of Freshness</h4>
                        <span className="bg-primary text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">AI Analyzed</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl">
                        <div className="text-center">
                          <p className="text-white font-bold text-lg">420</p>
                          <p className="text-white/40 text-[8px] font-black uppercase">Calories</p>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="text-center">
                          <p className="text-white font-bold text-lg">24g</p>
                          <p className="text-white/40 text-[8px] font-black uppercase">Protein</p>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="text-center">
                          <p className="text-white font-bold text-lg">38g</p>
                          <p className="text-white/40 text-[8px] font-black uppercase">Carbs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.section>
          ) : (
            <motion.div 
              key="auth-form"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[48px] shadow-[0_32px_64px_rgba(0,0,0,0.05)] border border-gray-50"
            >
              <div className="text-center space-y-4 mb-10">
                <h2 className="text-4xl font-display font-black text-black">
                  {authStep === 'phone' ? 'WELCOME BACK' : 'VERIFY CODE'}
                </h2>
                <p className="text-gray-400 font-medium italic">
                  {authStep === 'phone' 
                    ? 'Enter your phone number to continue' 
                    : `We've sent a code to ${phoneNumber}`}
                </p>
              </div>

              {authStep === 'phone' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+1 234 567 8900"
                      className="w-full h-16 px-6 rounded-[24px] bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 text-lg font-bold"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  
                  {authError && (
                    <p className="text-xs font-bold text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 italic">
                      {authError}
                    </p>
                  )}

                  <button 
                    disabled={authLoading || !phoneNumber}
                    onClick={handlePhoneSignIn}
                    className="w-full h-16 bg-black text-white rounded-[24px] font-bold text-lg hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-5 h-5" /></>}
                  </button>

                  <div className="relative flex items-center justify-center py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <span className="relative px-4 bg-white text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Or continue with</span>
                  </div>

                  <button 
                    onClick={signIn}
                    className="w-full h-16 bg-white border-2 border-gray-100 rounded-[24px] font-bold text-lg hover:border-black/10 transition-all flex items-center justify-center gap-4 group"
                  >
                    <img src="https://www.google.com/favicon.ico" className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
                    Google Account
                  </button>

                  <button 
                    onClick={() => setAuthStep('landing')}
                    className="w-full text-center text-xs font-black text-gray-400 hover:text-black transition-colors uppercase tracking-widest pt-4"
                  >
                    Back to home
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">6-Digit Code</label>
                    <input 
                      type="text" 
                      placeholder="000 000"
                      maxLength={6}
                      className="w-full h-20 text-center text-4xl tracking-[0.5em] font-black px-6 rounded-[24px] bg-gray-50 border-none focus:ring-2 focus:ring-primary/20"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                  </div>

                  {authError && (
                    <p className="text-xs font-bold text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 italic">
                      {authError}
                    </p>
                  )}

                  <button 
                    disabled={authLoading || otpCode.length !== 6}
                    onClick={verifyOtp}
                    className="w-full h-16 bg-black text-white rounded-[24px] font-bold text-lg hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-black/10"
                  >
                    {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Finish <Check className="w-5 h-5" /></>}
                  </button>

                  <button 
                    onClick={() => setAuthStep('phone')}
                    className="w-full text-center text-xs font-black text-gray-400 hover:text-black transition-colors uppercase tracking-widest pt-4"
                  >
                    Change phone number
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (onboarding) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-[32px] p-8 shadow-sm">
          <AnimatePresence mode="wait">
            {onboardingStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-light text-gray-900">Welcome, {user.displayName?.split(' ')[0]}!</h2>
                  <p className="text-gray-500 mt-2">Let's personalize your fitness journey.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <UserIcon className="w-3 h-3" /> Age
                    </label>
                    <input
                      type="number"
                      value={onboardingData.age}
                      onChange={(e) => setOnboardingData({ ...onboardingData, age: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={onboardingData.weight}
                      onChange={(e) => setOnboardingData({ ...onboardingData, weight: parseFloat(e.target.value) })}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Ruler className="w-3 h-3" /> Height (cm)
                    </label>
                    <input
                      type="number"
                      value={onboardingData.height}
                      onChange={(e) => setOnboardingData({ ...onboardingData, height: parseFloat(e.target.value) })}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Activity
                    </label>
                    <select
                      value={onboardingData.activityLevel}
                      onChange={(e) => setOnboardingData({ ...onboardingData, activityLevel: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
                    >
                      <option value="sedentary">Sedentary</option>
                      <option value="light">Lightly Active</option>
                      <option value="moderate">Moderately Active</option>
                      <option value="active">Very Active</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => setOnboardingStep(2)}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {onboardingStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-light text-gray-900">What's your goal?</h2>
                  <p className="text-gray-500 mt-2">We'll tailor your experience to match.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'lose_weight', label: 'Lose Weight', desc: 'Burn fat and get leaner' },
                    { id: 'maintain', label: 'Maintain', desc: 'Stay healthy and fit' },
                    { id: 'gain_muscle', label: 'Gain Muscle', desc: 'Build strength and size' },
                  ].map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setOnboardingData({ ...onboardingData, goal: goal.id })}
                      className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
                        onboardingData.goal === goal.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{goal.label}</p>
                          <p className="text-sm text-gray-500">{goal.desc}</p>
                        </div>
                        {onboardingData.goal === goal.id && <Check className="w-6 h-6 text-orange-500" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="flex-1 py-4 rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={completeOnboarding}
                    disabled={generatingSuggestions}
                    className="flex-[2] bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generatingSuggestions ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-orange-400" />}
                    Complete Setup
                  </button>
                </div>
              </motion.div>
            )}

            {onboardingStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-3xl font-light text-gray-900">Your AI Plan is Ready!</h2>
                  <p className="text-gray-500 mt-2">Based on your profile, here's our initial suggestion.</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 max-h-[400px] overflow-y-auto prose prose-orange">
                  <ReactMarkdown>{suggestions || ''}</ReactMarkdown>
                </div>

                <button
                  onClick={() => setOnboarding(false)}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut(auth)}
      className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span className="text-sm">Sign Out</span>
    </button>
  );
}
