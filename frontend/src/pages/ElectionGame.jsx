import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { Gamepad2, ShieldCheck, FileText, Megaphone, CheckCircle, ChevronRight, Zap, Trophy, AlertTriangle, Sparkles } from 'lucide-react';

const STAGES = [
  { id: 1, title: 'The Registration Rush', icon: FileText, desc: 'Ensure you have the right documents to enter the electoral roll.', points: 50 },
  { id: 2, title: 'Vision 2026', icon: Zap, desc: 'Plan your manifesto and prioritize development for your constituency.', points: 75 },
  { id: 3, title: 'Campaign Trail', icon: Megaphone, desc: 'Navigate the complex ethical dilemmas of an election campaign.', points: 100 },
  { id: 4, title: 'The Big Vote', icon: ShieldCheck, desc: 'Experience the polling day and ensure a fair voting process.', points: 150 }
];

// Stage Components to avoid hook violations
const RegistrationStage = ({ onComplete }) => {
  const docs = ['Aadhar Card', 'Utility Bill', 'Ration Card', 'PAN Card'];
  const required = ['Aadhar Card', 'Utility Bill'];
  const [selected, setSelected] = useState([]);

  const toggleDoc = (doc) => {
    if (selected.includes(doc)) setSelected(selected.filter(d => d !== doc));
    else setSelected([...selected, doc]);
  };

  return (
    <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-black dark:text-white">Document Matcher</h2>
      <p className="text-slate-500 dark:text-slate-400">Select the 2 mandatory documents required for Proof of Identity and Residence.</p>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {docs.map(doc => (
          <button 
            key={doc} 
            onClick={() => toggleDoc(doc)}
            aria-pressed={selected.includes(doc)}
            aria-label={`Select ${doc}`}
            className={`p-6 rounded-2xl border-2 transition-all font-bold ${selected.includes(doc) ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
          >
            {doc}
          </button>
        ))}
      </div>
      <div className="pt-8">
        <button 
          onClick={() => {
            const isCorrect = required.every(d => selected.includes(d));
            if (isCorrect) onComplete(1, 50);
            else alert('Incorrect documents. Hint: Mandatory documents like Aadhar or Utility Bill are missing.');
          }}
          disabled={selected.length !== 2}
          className="bg-teal-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl disabled:opacity-30 transition-opacity"
        >
          {selected.length === 2 ? 'Verify Documents' : `Select ${2 - selected.length} More Documents`}
        </button>
      </div>
    </div>
  );
};

const ManifestoStage = ({ onComplete }) => {
  const [budget, setBudget] = useState(100);
  const [alloc, setAlloc] = useState({ Healthcare: 0, Education: 0, Infrastructure: 0 });

  const update = (key, val) => {
    const diff = val - alloc[key];
    if (budget - diff >= 0) {
      setAlloc({ ...alloc, [key]: val });
      setBudget(budget - diff);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-2xl font-black dark:text-white mb-2">Manifesto Planner</h2>
        <div className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest">Remaining Budget: {budget} Crore</div>
      </div>
      <div className="max-w-md mx-auto space-y-6">
        {Object.entries(alloc).map(([key, val]) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between text-sm font-bold dark:text-white"><span>{key}</span><span>{val} Cr</span></div>
            <input type="range" min="0" max="100" value={val} onChange={(e) => update(key, parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600" />
          </div>
        ))}
      </div>
      <div className="text-center pt-8">
         <button 
           disabled={budget !== 0}
           onClick={() => onComplete(2, 75)} 
           className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl disabled:opacity-30 transition-opacity"
         >
           {budget === 0 ? 'Submit Manifesto' : `Allocate ${budget} Cr Remaining`}
         </button>
      </div>
    </div>
  );
};

const CampaignStage = ({ scenario, onComplete, loading }) => {
  const [feedback, setFeedback] = useState(null);

  if (loading || !scenario) return <div className="text-center py-20 font-bold animate-pulse text-slate-400">Gemini is thinking of a scenario...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
         <div className="relative z-10">
            <div className="flex items-center gap-2 text-yellow-400 mb-4 font-black uppercase text-xs"><AlertTriangle size={16} /> Campaign Dilemma</div>
            <h3 className="text-xl font-bold leading-relaxed">{scenario.scenario}</h3>
         </div>
         <Sparkles className="absolute -right-10 -top-10 text-white/5" size={200} />
      </div>

      <div className="space-y-4">
         {scenario.options.map((opt, idx) => (
           <button 
             key={idx} 
             onClick={() => setFeedback(opt)}
             disabled={!!feedback}
             className={`w-full text-left p-6 rounded-2xl border-2 transition-all group ${feedback === opt ? (opt.points > 0 ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20') : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
           >
              <div className="flex justify-between items-center">
                 <p className={`font-bold ${feedback === opt ? (opt.points > 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-700 dark:text-red-400') : 'text-slate-700 dark:text-slate-300'}`}>{opt.text}</p>
                 {feedback === opt && (opt.points > 0 ? <CheckCircle className="text-teal-500" /> : <AlertTriangle className="text-red-500" />)}
              </div>
              {feedback === opt && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 animate-in slide-in-from-top-1">{opt.feedback}</p>}
           </button>
         ))}
      </div>

      {feedback && (
        <div className="text-center pt-8">
           <button 
             onClick={() => onComplete(3, feedback.points || 10)}
             className="bg-teal-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl"
           >
              Continue Quest
           </button>
        </div>
      )}
    </div>
  );
};

const VotingStage = ({ onComplete }) => {
  return (
    <div className="text-center space-y-8 animate-in zoom-in duration-500">
       <div className="w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto text-orange-600 mb-8">
          <ShieldCheck size={64} />
       </div>
       <h2 className="text-3xl font-black dark:text-white">Voting Simulation</h2>
       <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Welcome to the polling booth. Your identification is verified. Proceed to the voting compartment and cast your vote carefully.</p>
       <div className="flex justify-center gap-8">
          <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
             <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">🗳️</div>
             <button onClick={() => onComplete(4, 150)} className="bg-slate-900 dark:bg-teal-600 text-white px-8 py-3 rounded-xl font-black">Cast Vote</button>
          </div>
       </div>
    </div>
  );
};

export default function ElectionGame() {
  const { token, updatePoints } = useStore();
  const [progress, setProgress] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, completed
  const [loading, setLoading] = useState(true);

  // Stage 3 AI Scenario
  const [scenario, setScenario] = useState(null);

  useEffect(() => {
    fetchProgress();
  }, [token]);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`/api/v1/game/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProgress(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleStageComplete = async (stageId, points) => {
    try {
      const res = await fetch(`/api/v1/game/complete-stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage_id: stageId, points_earned: points })
      });
      if (res.ok) {
        updatePoints(points);
        fetchProgress();
        setGameState('completed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchScenario = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/game/scenario`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setScenario(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startStage = (stage) => {
    setCurrentStage(stage);
    setGameState('playing');
    if (stage.id === 3) fetchScenario();
  };

  if (loading && !progress) return <div className="p-20 text-center font-black animate-pulse dark:text-white">Syncing Game State...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
            Election <span className="text-teal-600">Quest</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Embark on the journey of a democratic citizen.</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
           <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600"><Trophy size={20} /></div>
           <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Quest Points</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{progress?.total_game_points || 0}</p>
           </div>
        </div>
      </div>

      {gameState === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STAGES.map((stage) => {
            const isUnlocked = progress?.unlocked_stages.includes(stage.id);
            const Icon = stage.icon;
            
            return (
              <button 
                key={stage.id}
                onClick={() => isUnlocked && startStage(stage)}
                className={`text-left p-8 rounded-[40px] border-2 transition-all relative overflow-hidden group ${isUnlocked ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-teal-500 hover:shadow-2xl' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-50 cursor-not-allowed'}`}
              >
                <div className={`p-4 rounded-2xl w-fit mb-6 ${isUnlocked ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  <Icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{stage.id}. {stage.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{stage.desc}</p>
                
                <div className="flex justify-between items-center mt-auto">
                   <div className="flex items-center gap-2 font-black text-xs text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-full">
                      <Zap size={14} /> +{stage.points} Pts
                   </div>
                   {isUnlocked ? (
                     <div className="p-2 bg-slate-900 dark:bg-teal-600 rounded-full text-white transform group-hover:translate-x-2 transition-transform">
                        <ChevronRight size={20} />
                     </div>
                   ) : (
                     <div className="text-[10px] font-black uppercase text-slate-400">Locked</div>
                   )}
                </div>
                {!isUnlocked && <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px]"></div>}
              </button>
            );
          })}
        </div>
      )}

      {gameState === 'playing' && (
        <div className="bg-white dark:bg-slate-800 rounded-[50px] p-12 border border-slate-100 dark:border-slate-700 shadow-2xl relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
             <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center font-black text-xs">
                         {currentStage.id}
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{currentStage.title}</h2>
                   </div>
                   <span className="text-xs font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                      Live Quest
                   </span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                   <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-1000 ease-out" 
                      style={{ width: `${(currentStage.id / 4) * 100}%` }}
                   ></div>
                </div>
             </div>
             
             <button 
                onClick={() => setGameState('menu')} 
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm transition-all shadow-sm"
             >
                <ChevronRight className="rotate-180" size={18} />
                Exit Quest
             </button>
          </div>

          {currentStage.id === 1 && <RegistrationStage onComplete={handleStageComplete} />}
          {currentStage.id === 2 && <ManifestoStage onComplete={handleStageComplete} />}
          {currentStage.id === 3 && <CampaignStage scenario={scenario} loading={loading} onComplete={handleStageComplete} />}
          {currentStage.id === 4 && <VotingStage onComplete={handleStageComplete} />}
        </div>
      )}

      {gameState === 'completed' && (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[50px] border border-slate-100 dark:border-slate-700 shadow-2xl animate-in zoom-in duration-500">
           <div className="w-32 h-32 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto text-yellow-600 mb-8 animate-bounce">
              <Trophy size={64} />
           </div>
           <h2 className="text-4xl font-black dark:text-white mb-2">Stage Accomplished!</h2>
           <p className="text-slate-500 dark:text-slate-400 mb-8">You've earned <strong>{currentStage.points}</strong> points towards your democratic maturity.</p>
           <button 
             onClick={() => setGameState('menu')}
             className="bg-slate-900 dark:bg-teal-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl"
           >
              Return to Quest Menu
           </button>
        </div>
      )}
    </div>
  );
}
