import { useState, useEffect } from 'react';
import { TrialStatus, QuizQuestion } from '@/types';
import { useChiQuiz } from '@/hooks/useChiQuiz';

interface ChiTrialProps {
  status: TrialStatus;
  onComplete: () => void;
}

// Quiz questions about Dojo 1.7
// In production, these could be fetched from the contract or a config
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: 'What is the primary purpose of Dojo 1.7?',
    options: [
      'To build provably fair onchain games',
      'To create NFT marketplaces',
      'To deploy smart contracts',
      'To mine cryptocurrency',
    ],
  },
  {
    id: 2,
    text: 'Which component is responsible for state management in Dojo?',
    options: [
      'Models',
      'Views',
      'Controllers',
      'Routes',
    ],
  },
  {
    id: 3,
    text: 'What does ECS stand for in the context of Dojo?',
    options: [
      'Entity Component System',
      'Event Control Structure',
      'Encrypted Chain State',
      'External Call Service',
    ],
  },
];

// Correct answer indices (0-based)
const CORRECT_ANSWERS = [0, 0, 0];

export function ChiTrial({ status, onComplete }: ChiTrialProps) {
  const { submitQuiz, isLoading, error, success } = useChiQuiz();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const isDisabled = status === 'completed' || status === 'locked';
  const isCompleted = status === 'completed';
  const allAnswered = QUIZ_QUESTIONS.every((q) => answers[q.id] !== undefined);

  useEffect(() => {
    if (success) {
      onComplete();
    }
  }, [success, onComplete]);

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    if (isDisabled) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setLocalError(null);
    setShowValidation(false);
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      setLocalError('Please answer all questions before submitting');
      return;
    }

    // Validate answers locally first
    const isCorrect = QUIZ_QUESTIONS.every(
      (q, idx) => answers[q.id] === CORRECT_ANSWERS[idx]
    );

    if (!isCorrect) {
      setLocalError('Some answers are incorrect. Review your responses and try again.');
      setShowValidation(true);
      return;
    }

    // Submit to contract
    const answerArray = QUIZ_QUESTIONS.map((q) => answers[q.id].toString());
    await submitQuiz(answerArray);
  };

  const isAnswerCorrect = (questionId: number, optionIndex: number): boolean | null => {
    if (!showValidation) return null;
    const questionIndex = QUIZ_QUESTIONS.findIndex((q) => q.id === questionId);
    return CORRECT_ANSWERS[questionIndex] === optionIndex;
  };

  return (
    <div className="space-y-4">
      {isCompleted ? (
        <div className="bg-ronin-primary/10 border border-ronin-primary/30 rounded-md p-4">
          <p className="text-ronin-primary font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Trial Complete
          </p>
          <p className="text-ronin-secondary/70 text-sm mt-1">
            Your wisdom has been demonstrated
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-6">
            {QUIZ_QUESTIONS.map((question, qIndex) => (
              <div key={question.id} className="bg-ronin-dark/30 rounded-md p-4 border border-ronin-light/10">
                <p className="text-ronin-secondary font-medium mb-4 flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ronin-accent/20 text-ronin-accent text-sm flex items-center justify-center font-bold">
                    {qIndex + 1}
                  </span>
                  <span>{question.text}</span>
                </p>
                <div className="space-y-2 ml-8">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = answers[question.id] === optionIndex;
                    const validationState = isAnswerCorrect(question.id, optionIndex);

                    let borderColor = 'border-ronin-light/20';
                    let bgColor = 'bg-ronin-light/10';
                    let textColor = 'text-ronin-secondary';

                    if (isSelected) {
                      if (validationState === true) {
                        borderColor = 'border-green-500/50';
                        bgColor = 'bg-green-900/20';
                        textColor = 'text-green-400';
                      } else if (validationState === false) {
                        borderColor = 'border-red-500/50';
                        bgColor = 'bg-red-900/20';
                        textColor = 'text-red-400';
                      } else {
                        borderColor = 'border-ronin-accent/50';
                        bgColor = 'bg-ronin-accent/10';
                      }
                    }

                    return (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswerSelect(question.id, optionIndex)}
                        disabled={isDisabled}
                        className={`w-full text-left px-4 py-3 rounded-md border ${borderColor} ${bgColor} hover:border-ronin-accent/40 disabled:cursor-not-allowed transition-all ${textColor}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-ronin-accent bg-ronin-accent'
                              : 'border-ronin-light/30'
                          }`}>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-ronin-dark"></div>
                            )}
                          </div>
                          <span className="text-sm">{option}</span>
                          {validationState === true && (
                            <svg className="w-5 h-5 ml-auto text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {validationState === false && (
                            <svg className="w-5 h-5 ml-auto text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isDisabled || isLoading}
            className="w-full bg-ronin-primary hover:bg-ronin-primary/90 disabled:bg-gray-700/50 disabled:cursor-not-allowed rounded-md px-6 py-3 text-ronin-secondary font-bold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Answers
              </>
            )}
          </button>
        </>
      )}

      {(error || localError) && !isCompleted && (
        <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-md p-4">
          <p className="text-red-400 text-sm font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error || localError}
          </p>
          {showValidation && (
            <p className="text-red-400/70 text-xs mt-1">
              You can retake the quiz as many times as needed
            </p>
          )}
        </div>
      )}

      {success && !isCompleted && (
        <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded-md p-4">
          <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Chi trial completed successfully!
          </p>
        </div>
      )}
    </div>
  );
}
