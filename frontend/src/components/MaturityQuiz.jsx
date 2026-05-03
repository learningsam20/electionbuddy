import React, { useState } from 'react';
import useStore from '../store';
import { Award, CheckCircle, XCircle, ArrowRight, BookOpen, BrainCircuit } from 'lucide-react';

const MATURITY_QUESTIONS = [
  {
    question: "What is the primary role of the Election Commission of India?",
    options: [
      "To pass laws in the parliament",
      "To conduct free and fair elections",
      "To represent India in international forums",
      "To manage government finances"
    ],
    correct_answer: "To conduct free and fair elections",
    explanation: "The Election Commission of India is an autonomous constitutional authority responsible for administering election processes in India."
  },
  {
    question: "Which document is essential to carry to the polling booth if your name is on the electoral roll?",
    options: [
      "Birth Certificate",
      "Voter ID (EPIC) or any government-approved photo ID",
      "Ration Card",
      "Bank Passbook only"
    ],
    correct_answer: "Voter ID (EPIC) or any government-approved photo ID",
    explanation: "While Voter ID (EPIC) is preferred, several other photo IDs like Aadhaar, Passport, or DL are also accepted."
  },
  {
    question: "What does 'Model Code of Conduct' refer to?",
    options: [
      "A set of laws passed by the President",
      "Guidelines for candidates and parties during elections",
      "Rules for civil servants only",
      "The process of counting votes"
    ],
    correct_answer: "Guidelines for candidates and parties during elections",
    explanation: "MCC is a set of norms evolved with the consensus of political parties to regulate their conduct during the campaign and election period."
  }
];

export default function MaturityQuiz({ onComplete }) {
  const { token, user } = useStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleSelect = (opt) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);
    if (opt === MATURITY_QUESTIONS[currentIdx].correct_answer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < MATURITY_QUESTIONS.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    const finalScore = Math.round((score / MATURITY_QUESTIONS.length) * 10);
    
    try {
      await fetch(`/api/v1/citizen/maturity-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: finalScore,
          answers_json: JSON.stringify({ score, total: MATURITY_QUESTIONS.length })
        })
      });
      if (onComplete) onComplete(finalScore);
    } catch (err) {
      console.error(err);
    }
  };

  if (isFinished) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700">
        <Award className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Quiz Completed!</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-6">You've reached Maturity Score: <span className="font-bold text-teal-600">{Math.round((score / MATURITY_QUESTIONS.length) * 10)}/10</span></p>
        <button onClick={() => window.location.reload()} className="bg-teal-600 text-white px-8 py-3 rounded-full font-bold hover:bg-teal-700 transition-colors shadow-lg">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = MATURITY_QUESTIONS[currentIdx];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center space-x-3 mb-6">
        <BrainCircuit className="text-teal-500" size={28} />
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Voter Maturity Assessment</h2>
      </div>
      
      <div className="mb-6">
        <p className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase mb-2">Question {currentIdx + 1} of {MATURITY_QUESTIONS.length}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-snug">{currentQ.question}</h3>
      </div>

      <div className="space-y-4">
        {currentQ.options.map((opt, idx) => {
          let buttonClass = "w-full text-left p-5 rounded-2xl border-2 transition-all font-semibold ";
          if (!isAnswered) {
            buttonClass += "border-slate-100 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 dark:text-white";
          } else {
            if (opt === currentQ.correct_answer) {
              buttonClass += "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400";
            } else if (opt === selectedOption) {
              buttonClass += "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
            } else {
              buttonClass += "border-slate-100 dark:border-slate-700 opacity-50 dark:text-slate-300";
            }
          }

          return (
            <button key={idx} onClick={() => handleSelect(opt)} disabled={isAnswered} className={buttonClass}>
              <div className="flex justify-between items-center">
                <span>{opt}</span>
                {isAnswered && opt === currentQ.correct_answer && <CheckCircle className="text-green-500" size={20} />}
                {isAnswered && opt === selectedOption && opt !== currentQ.correct_answer && <XCircle className="text-red-500" size={20} />}
              </div>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="mt-8 p-5 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-2xl">
          <h4 className="font-bold flex items-center mb-2 text-teal-900 dark:text-teal-300">
            <BookOpen className="mr-2" size={18} /> Explanation
          </h4>
          <p className="text-teal-800 dark:text-teal-100/80 text-sm leading-relaxed">{currentQ.explanation}</p>
        </div>
      )}

      {isAnswered && (
        <div className="mt-8 flex justify-end">
          <button onClick={handleNext} className="flex items-center bg-slate-900 dark:bg-teal-600 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 dark:hover:bg-teal-700 transition-colors shadow-lg">
            {currentIdx < MATURITY_QUESTIONS.length - 1 ? 'Next' : 'Finish'}
            <ArrowRight className="ml-2" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
