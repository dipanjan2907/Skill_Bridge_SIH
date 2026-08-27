import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import { API_BASE_URL } from "../../config/api";

interface QuestionItem {
  id: number;
  skill_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: string;
}

interface EvaluationResult {
  question_id: number;
  is_correct: boolean;
  user_option: string;
  correct_option: string;
  correct_option_text: string;
  explanation: string;
}

interface FinalResult {
  score_percentage: number;
  correct_answers: number;
  total_questions: number;
  passed: boolean;
}

interface SkillAssessmentProps {
  skillId: number;
  skillName: string;
  skillCategory?: string;
  onClose: () => void;
  onComplete: () => void;
}

export const SkillAssessment: React.FC<SkillAssessmentProps> = ({
  skillId,
  skillName,
  skillCategory = "Technical",
  onClose,
  onComplete,
}) => {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active answer selection for current question
  const [selectedOptionKey, setSelectedOptionKey] = useState<"A" | "B" | "C" | "D" | null>(null);
  
  // Array of submitted answer pairs for batch verification
  const [submittedAnswers, setSubmittedAnswers] = useState<
    Array<{ question_id: number; selected_option: string }>
  >([]);

  const [isSubmittedCurrent, setIsSubmittedCurrent] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<EvaluationResult | null>(null);

  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);

  // Fetch assessment questions from backend for selected skill
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/assessments/questions/${skillId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch questions. Server status: ${response.status}`
        );
      }

      const data = await response.json();
      const fetchedQuestions: QuestionItem[] = data.questions || [];

      if (fetchedQuestions.length === 0) {
        setError(`No assessment questions are currently available for ${skillName}.`);
      } else {
        setQuestions(fetchedQuestions);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load assessment questions."
      );
    } finally {
      setLoading(false);
    }
  }, [skillId, skillName]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const currentQuestion = questions[currentIndex];

  // Map option keys to text
  const getOptionText = (key: "A" | "B" | "C" | "D", q: QuestionItem) => {
    switch (key) {
      case "A":
        return q.option_a;
      case "B":
        return q.option_b;
      case "C":
        return q.option_c;
      case "D":
        return q.option_d;
      default:
        return "";
    }
  };

  // Submit current answer to backend
  const handleSubmitAnswer = async () => {
    if (!selectedOptionKey || !currentQuestion || isSubmittedCurrent || submittingAnswer) {
      return;
    }

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) {
      setError("Authentication required to submit assessment.");
      return;
    }

    setSubmittingAnswer(true);

    const newAnswerPayload = {
      question_id: currentQuestion.id,
      selected_option: selectedOptionKey,
    };

    const updatedAnswers = [...submittedAnswers, newAnswerPayload];

    try {
      const response = await fetch(`${API_BASE_URL}/assessments/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skill_id: skillId,
          answers: updatedAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to submit assessment answer.");
      }

      const result = await response.json();

      // Find feedback for the current question
      const currentEval: EvaluationResult | undefined = (result.results || []).find(
        (resItem: EvaluationResult) => resItem.question_id === currentQuestion.id
      );

      if (currentEval) {
        setCurrentFeedback(currentEval);
      } else {
        // Fallback feedback if item matching is indirect
        const lastResult = result.results[result.results.length - 1];
        setCurrentFeedback(lastResult);
      }

      setSubmittedAnswers(updatedAnswers);
      setIsSubmittedCurrent(true);

      // If this was the last question, store final result
      if (currentIndex === questions.length - 1) {
        setFinalResult({
          score_percentage: result.score_percentage,
          correct_answers: result.correct_answers,
          total_questions: result.total_questions,
          passed: result.passed,
        });
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error evaluating answer."
      );
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Move to next question or display completion screen
  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionKey(null);
      setIsSubmittedCurrent(false);
      setCurrentFeedback(null);
    } else {
      setIsCompleted(true);
      onComplete(); // Refresh parent skill profile data
    }
  };

  // Get difficulty badge color style
  const getDifficultyBadgeStyle = (diff: string) => {
    const d = (diff || "medium").toLowerCase();
    if (d === "easy") {
      return {
        background: "rgba(16, 185, 129, 0.15)",
        color: "#10b981",
        border: "1px solid rgba(16, 185, 129, 0.3)",
      };
    }
    if (d === "hard") {
      return {
        background: "rgba(239, 68, 68, 0.15)",
        color: "#ef4444",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      };
    }
    return {
      background: "rgba(245, 158, 11, 0.15)",
      color: "#f59e0b",
      border: "1px solid rgba(245, 158, 11, 0.3)",
    };
  };

  return createPortal(
    <div className="assessment-modal-overlay" style={{ zIndex: 100000 }}>
      <div className="assessment-modal-card">
        {/* MODAL HEADER */}
        <div className="assessment-header">
          <div className="assessment-header-title">
            <div className="assessment-skill-info">
              <h2>{skillName}</h2>
              <span className="assessment-category-badge">{skillCategory}</span>
            </div>
            <p className="assessment-subtitle">Skill Assessment Flow</p>
          </div>

          <button
            onClick={onClose}
            className="assessment-close-btn"
            title="Close Assessment"
          >
            <X size={20} />
          </button>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="assessment-loading-state">
            <Loader2 className="spin-icon" size={32} />
            <p>Fetching assessment questions from server...</p>
          </div>
        )}

        {/* ERROR OR EMPTY STATE */}
        {!loading && error && (
          <div className="assessment-error-state">
            <AlertCircle size={40} color="#ef4444" />
            <p className="error-message-text">{error}</p>
            <button onClick={onClose} className="assessment-primary-btn">
              Back to Skills
            </button>
          </div>
        )}

        {/* ACTIVE QUESTION SCREEN */}
        {!loading && !error && !isCompleted && currentQuestion && (
          <div className="assessment-body">
            {/* QUESTION METADATA BAR */}
            <div className="question-meta-bar">
              <div className="question-counter">
                Question <strong>{currentIndex + 1}</strong> of {questions.length}
              </div>

              <div
                className="difficulty-badge"
                style={getDifficultyBadgeStyle(currentQuestion.difficulty)}
              >
                Difficulty: {currentQuestion.difficulty}
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="assessment-progress-track">
              <div
                className="assessment-progress-fill"
                style={{
                  width: `${((currentIndex + (isSubmittedCurrent ? 1 : 0.5)) / questions.length) * 100}%`,
                }}
              />
            </div>

            {/* QUESTION TEXT */}
            <div className="question-text-box">
              <h3>{currentQuestion.question}</h3>
            </div>

            {/* OPTIONS LIST */}
            <div className="options-grid">
              {(["A", "B", "C", "D"] as const).map((key) => {
                const optionText = getOptionText(key, currentQuestion);
                const isSelected = selectedOptionKey === key;

                // Determine option feedback styling after submission
                let optionStateClass = "";
                if (isSubmittedCurrent && currentFeedback) {
                  const isUserSelection = currentFeedback.user_option === key;
                  const isCorrectOption = currentFeedback.correct_option === key;

                  if (isUserSelection && currentFeedback.is_correct) {
                    optionStateClass = "option-correct-selected";
                  } else if (isUserSelection && !currentFeedback.is_correct) {
                    optionStateClass = "option-incorrect-selected";
                  } else if (isCorrectOption && !currentFeedback.is_correct) {
                    optionStateClass = "option-correct-reveal";
                  } else {
                    optionStateClass = "option-disabled";
                  }
                } else if (isSelected) {
                  optionStateClass = "option-selected";
                }

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isSubmittedCurrent}
                    onClick={() => setSelectedOptionKey(key)}
                    className={`option-card ${optionStateClass}`}
                  >
                    <span className="option-radio-indicator">
                      {isSelected ? "●" : "○"}
                    </span>
                    <span className="option-text">{optionText}</span>
                  </button>
                );
              })}
            </div>

            {/* FEEDBACK DISPLAY AFTER SUBMISSION */}
            {isSubmittedCurrent && currentFeedback && (
              <div
                className={`feedback-box ${
                  currentFeedback.is_correct ? "feedback-correct" : "feedback-incorrect"
                }`}
              >
                <div className="feedback-status-header">
                  {currentFeedback.is_correct ? (
                    <>
                      <CheckCircle2 size={20} className="feedback-icon success" />
                      <span className="feedback-title success">✓ Correct!</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={20} className="feedback-icon error" />
                      <span className="feedback-title error">✕ Incorrect</span>
                    </>
                  )}
                </div>

                {!currentFeedback.is_correct && currentFeedback.correct_option_text && (
                  <div className="feedback-correct-answer">
                    <strong>Correct answer:</strong>
                    <div className="correct-answer-text">
                      {currentFeedback.correct_option_text}
                    </div>
                  </div>
                )}

                {currentFeedback.explanation && (
                  <div className="feedback-explanation">
                    <strong>Explanation:</strong>
                    <p>{currentFeedback.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* ACTION FOOTER */}
            <div className="assessment-footer">
              {!isSubmittedCurrent ? (
                <button
                  type="button"
                  disabled={!selectedOptionKey || submittingAnswer}
                  onClick={handleSubmitAnswer}
                  className="assessment-primary-btn"
                >
                  {submittingAnswer ? (
                    <Loader2 size={16} className="spin-icon" />
                  ) : null}
                  Submit Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="assessment-primary-btn next-btn"
                >
                  {currentIndex < questions.length - 1 ? (
                    <>
                      Next Question <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      View Final Results <Sparkles size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* COMPLETION SCREEN */}
        {!loading && isCompleted && finalResult && (
          <div className="assessment-completion-screen">
            <div className="completion-icon-wrapper">
              <span role="img" aria-label="Target" className="completion-emoji">
                🎯
              </span>
            </div>

            <h2>Assessment Complete 🎯</h2>
            <div className="completion-skill-name">{skillName}</div>

            <div className="completion-score-card">
              <div className="score-label">Your Score</div>
              <div className="score-percentage">{finalResult.score_percentage}%</div>
              <div className="score-breakdown">
                {finalResult.correct_answers} / {finalResult.total_questions} correct
              </div>
            </div>

            <p className="completion-notice">
              Your <strong>{skillName}</strong> proficiency has been updated.
            </p>

            <button
              onClick={() => {
                onClose();
              }}
              className="assessment-primary-btn"
            >
              Back to Skills
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
