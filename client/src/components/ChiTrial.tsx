import { useState } from 'react';
import { hash } from 'starknet';
import { useEventQuery, useModel } from '@dojoengine/sdk/react';
import { KeysClause, ToriiQueryBuilder } from '@dojoengine/sdk';

import { useChiQuiz } from '@/hooks/useChiQuiz';
import { useTrialCompletion } from '@/hooks/useTrialCompletion';
import { TrialStatus } from '@/lib/types';
import { StatusMessage, LoadingSpinner } from './TrialStatus';
import chiData from '../../../spec/chi.json';

interface ChiTrialProps {
  status: TrialStatus;
  onComplete: () => void;
  tokenId: string;
}

interface ChiQuestion {
  id: number;
  question: string;
  options: string[];
  answer_hash: string;
}

interface ShuffledQuestion {
  originalId: number;
  displayId: number;
  question: string;
  options: string[];
  optionMapping: number[]; // Maps displayed index to original index
}

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Hash an answer using the format: keccak256(question_index + ":" + answer_text)
 */
function hashAnswer(questionIndex: number, answerText: string): string {
  const hashInput = `${questionIndex}:${answerText}`;
  return `0x${hash.starknetKeccak(hashInput).toString(16)}`;
}

export function ChiTrial({ status, onComplete, tokenId }: ChiTrialProps) {
  const { submitQuiz, isLoading, error } = useChiQuiz();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  // Subscribe to ChiCompleted event for this token
  useEventQuery(
    new ToriiQueryBuilder()
      .withClause(
        KeysClause(
          ['ronin_quest-ChiCompleted'],
          [tokenId ? `0x${BigInt(tokenId).toString(16)}` : undefined],
          'VariableLen'
        ).build()
      )
      .includeHashedKeys()
  );

  // Retrieve ChiCompleted event from store
  const chiCompletedEvent = useModel(tokenId, 'ronin_quest-ChiCompleted');

  // The event itself confirms completion - no need to refetch
  const localSuccess = !!chiCompletedEvent;

  const isDisabled = status === 'completed' || status === 'locked';
  const isCompleted = status === 'completed';

  // Randomly select 3 questions and shuffle both questions and options
  // Using useState with function initializer ensures fresh shuffle on every mount
  const [shuffledQuestions] = useState<ShuffledQuestion[]>(() => {
    const allQuestions = chiData.questions as ChiQuestion[];

    // Select 3 random questions
    const selectedQuestions = shuffle(allQuestions).slice(0, 3);

    // Shuffle the selected questions
    const shuffledSelected = shuffle(selectedQuestions);

    // For each question, shuffle the options and track the mapping
    return shuffledSelected.map((q, displayIndex) => {
      const optionsWithIndices = q.options.map((opt, idx) => ({ opt, idx }));
      const shuffledOptions = shuffle(optionsWithIndices);

      return {
        originalId: q.id,
        displayId: displayIndex,
        question: q.question,
        options: shuffledOptions.map(o => o.opt),
        optionMapping: shuffledOptions.map(o => o.idx)
      };
    });
  });

  const allAnswered = shuffledQuestions.every((q) => answers[q.displayId] !== undefined);

  useTrialCompletion(success, onComplete);

  const handleAnswerSelect = (displayId: number, displayOptionIndex: number) => {
    if (isDisabled) return;
    setAnswers((prev) => ({ ...prev, [displayId]: displayOptionIndex }));
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      setLocalError('Please answer all questions before submitting');
      return;
    }

    // Prepare data for contract submission
    // Contract expects: arrays of question indices and answer hashes
    const questionIndices: number[] = [];
    const answerHashes: string[] = [];

    shuffledQuestions.forEach((q) => {
      const displayOptionIndex = answers[q.displayId];
      const originalOptionIndex = q.optionMapping[displayOptionIndex];
      const answerText = chiData.questions[q.originalId].options[originalOptionIndex];

      questionIndices.push(q.originalId);
      answerHashes.push(hashAnswer(q.originalId, answerText));
    });

    await submitQuiz(questionIndices, answerHashes);
  };

  return (
    <div className="space-y-4">
      {isCompleted ? (
        <StatusMessage
          type="info"
          message="Trial Complete"
          detail="Your wisdom has been demonstrated"
        />
      ) : (
        <>
          <div className="space-y-6 mb-6">
            {shuffledQuestions.map((question, qIndex) => (
              <div key={question.displayId} className="bg-ronin-dark/30 rounded-md p-4 border border-ronin-light/10">
                <p className="text-ronin-secondary font-medium mb-4 flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ronin-accent/20 text-ronin-accent text-sm flex items-center justify-center font-bold">
                    {qIndex + 1}
                  </span>
                  <span>{question.question}</span>
                </p>
                <div className="space-y-2 ml-8">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = answers[question.displayId] === optionIndex;

                    const borderColor = isSelected ? 'border-ronin-accent/50' : 'border-ronin-light/20';
                    const bgColor = isSelected ? 'bg-ronin-accent/10' : 'bg-ronin-light/10';
                    const textColor = 'text-ronin-secondary';

                    return (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswerSelect(question.displayId, optionIndex)}
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
                <LoadingSpinner />
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

      {isLoading && !isCompleted && (
        <StatusMessage
          type="info"
          message="Transaction submitted"
          detail="Waiting for confirmation on-chain..."
        />
      )}

      {(error || localError) && !isCompleted && (
        <StatusMessage
          type="error"
          message={error || localError || ''}
          detail="You need at least 3 correct answers to pass"
        />
      )}

      {localSuccess && !isCompleted && (
        <StatusMessage
          type="success"
          message="Chi trial completed successfully!"
        />
      )}
    </div>
  );
}
