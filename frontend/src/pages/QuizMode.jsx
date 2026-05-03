import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { Award, CheckCircle, XCircle, ArrowRight, BookOpen, Settings2, CheckSquare } from 'lucide-react';

export default function QuizMode() {
  const { token, updatePoints } = useStore();
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(true);

  // Configuration state
  const [difficulty, setDifficulty] = useState('auto');
  const [numQuestions, setNumQuestions] = useState(3);

  const startQuiz = () => {
    setLoading(true);
    setShowConfig(false);
    const diffParam = difficulty === 'auto' ? '' : difficulty;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/quiz/generate?phase=Voter Registration&difficulty=${diffParam}&num_questions=${numQuestions}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setQuestions(data.questions);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const handleSelect = (opt) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);
    if (opt === questions[currentIdx].correct_answer) {
      setScore(prev => prev + 10);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    updatePoints(score);
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ points_earned: score })
    });
  };

  if (showConfig) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-10 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-2xl">
              <Settings2 className="text-teal-600 dark:text-teal-400" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Quiz Setup</h1>
              <p className="text-slate-500 dark:text-slate-400">Configure your knowledge check</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Difficulty Level</label>
              <div className="grid grid-cols-4 gap-4">
                {['auto', 'easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`py-4 rounded-2xl font-bold border-2 transition-all capitalize ${
                      difficulty === level 
                      ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' 
                      : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Number of Questions: {numQuestions}</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={numQuestions} 
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            <button 
              onClick={startQuiz}
              className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
            >
              Start AI Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto py-24 text-center">
      <div className="inline-block w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white">ElectionBuddy AI is generating your quiz...</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2">Personalizing questions for {difficulty} level</p>
    </div>
  );

  if (!questions || !questions.length) return <div className="p-12 text-center text-xl font-bold dark:text-white">Error loading quiz.</div>;

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-10 text-center border border-slate-100 dark:border-slate-700">
          <Award className="w-24 h-24 mx-auto text-yellow-500 mb-6" />
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Quiz Completed!</h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">You earned <span className="font-bold text-teal-600 dark:text-teal-400">{score} Points</span>!</p>
          <div className="flex flex-col space-y-4">
            <button onClick={() => setShowConfig(true)} className="bg-teal-600 text-white px-8 py-4 rounded-full font-bold hover:bg-teal-700 transition-colors shadow-lg">
              Take New Quiz
            </button>
            <button onClick={() => window.location.href = '/dashboard'} className="text-slate-500 font-bold hover:text-slate-800 dark:hover:text-white">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
          <CheckSquare className="text-teal-500 mr-3" size={28} />
          Election Knowledge Check
        </h1>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{difficulty}</span>
          <span className="text-teal-700 dark:text-teal-300 font-black bg-teal-50 dark:bg-teal-900/30 px-5 py-2 rounded-full border border-teal-100 dark:border-teal-800 text-lg">Score: {score}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8 border border-slate-100 dark:border-slate-700">
        <p className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-4">Question {currentIdx + 1} of {questions.length}</p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 leading-snug">{currentQ.question}</h2>

        <div className="space-y-4">
          {currentQ.options.map((opt, idx) => {
            let buttonClass = "w-full text-left p-5 rounded-2xl border-2 transition-all font-semibold text-lg ";
            
            if (!isAnswered) {
              buttonClass += "border-slate-200 dark:border-slate-600 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 dark:text-white";
            } else {
              if (opt === currentQ.correct_answer) {
                buttonClass += "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400";
              } else if (opt === selectedOption) {
                buttonClass += "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
              } else {
                buttonClass += "border-slate-200 dark:border-slate-700 opacity-50 dark:text-slate-300";
              }
            }

            return (
              <button key={idx} onClick={() => handleSelect(opt)} disabled={isAnswered} className={buttonClass}>
                <div className="flex justify-between items-center">
                  <span>{opt}</span>
                  {isAnswered && opt === currentQ.correct_answer && <CheckCircle className="text-green-500" />}
                  {isAnswered && opt === selectedOption && opt !== currentQ.correct_answer && <XCircle className="text-red-500" />}
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-8 p-6 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-2xl">
            <h3 className="font-bold flex items-center mb-3 text-teal-900 dark:text-teal-300 text-lg">
              <BookOpen className="mr-2" size={20} /> Explanation
            </h3>
            <p className="text-teal-800 dark:text-teal-100/80 leading-relaxed mb-4">{currentQ.explanation || "No explanation provided."}</p>
            {currentQ.reference_link && (
              <a href={currentQ.reference_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 underline underline-offset-4">
                Learn more <ArrowRight size={16} className="ml-1" />
              </a>
            )}
          </div>
        )}

        {isAnswered && (
          <div className="mt-8 flex justify-end">
            <button onClick={handleNext} className="flex items-center bg-slate-900 dark:bg-teal-600 text-white px-8 py-4 rounded-full font-bold hover:bg-slate-800 dark:hover:bg-teal-700 transition-colors shadow-lg text-lg">
              {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              <ArrowRight className="ml-2" size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}