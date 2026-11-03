import { ExamPaper, OnlineExamSubmission, QuestionResult } from '../types';

/**
 * Normalizes short answer string (Part III) for robust evaluation
 * Handles Vietnamese comma (2,5 -> 2.5), whitespace, signs, and numerical tolerances.
 */
export function normalizeShortAnswer(val: string | undefined | null): string {
  if (!val) return '';
  return val.trim().replace(/\s+/g, '').replace(',', '.').toLowerCase();
}

export function checkShortAnswerMatch(userAnswer: string | undefined | null, correctAnswer: string): boolean {
  if (!userAnswer) return false;
  const normUser = normalizeShortAnswer(userAnswer);
  const normCorrect = normalizeShortAnswer(correctAnswer);

  if (normUser === normCorrect) return true;

  // Try parsing both as numbers
  const numUser = parseFloat(normUser);
  const numCorrect = parseFloat(normCorrect);

  if (!isNaN(numUser) && !isNaN(numCorrect)) {
    return Math.abs(numUser - numCorrect) < 0.001;
  }

  return false;
}

/**
 * MoET 2025 Standard Partial Credit for Part II (Đúng/Sai)
 * 1 correct sub-item = 0.10 pt
 * 2 correct sub-items = 0.25 pt
 * 3 correct sub-items = 0.50 pt
 * 4 correct sub-items = 1.00 pt
 */
export function calculatePart2ScoreForQuestion(correctSubItemCount: number): number {
  switch (correctSubItemCount) {
    case 4:
      return 1.0;
    case 3:
      return 0.5;
    case 2:
      return 0.25;
    case 1:
      return 0.1;
    default:
      return 0.0;
  }
}

export interface GradeExamInput {
  exam: ExamPaper;
  studentName: string;
  studentId: string;
  studentClass: string;
  timeSpentSeconds: number;
  answersPart1: { [questionId: string]: 'A' | 'B' | 'C' | 'D' };
  answersPart2: { [questionId: string]: { [key in 'a' | 'b' | 'c' | 'd']?: boolean } };
  answersPart3: { [questionId: string]: string };
}

export function gradeOnlineExam(input: GradeExamInput): OnlineExamSubmission {
  const { exam, studentName, studentId, studentClass, timeSpentSeconds, answersPart1, answersPart2, answersPart3 } = input;

  const results: QuestionResult[] = [];
  let part1Score = 0;
  let part2Score = 0;
  let part3Score = 0;

  // Cognitive breakdown tracking
  const cognitiveStats = {
    nb: { score: 0, max: 0 },
    th: { score: 0, max: 0 },
    vd: { score: 0, max: 0 },
    vdc: { score: 0, max: 0 },
  };

  const addCognitive = (level: 'NB' | 'TH' | 'VD' | 'VDC' | undefined, earned: number, max: number) => {
    const key = (level?.toLowerCase() || 'nb') as 'nb' | 'th' | 'vd' | 'vdc';
    if (cognitiveStats[key]) {
      cognitiveStats[key].score += earned;
      cognitiveStats[key].max += max;
    }
  };

  // 1. GRADE PART I (Trắc nghiệm nhiều lựa chọn: 0.25đ / câu)
  exam.part1.forEach((q) => {
    const userChoice = answersPart1[q.id];
    const isCorrect = userChoice === q.correctAnswer;
    const scoreEarned = isCorrect ? 0.25 : 0;
    part1Score += scoreEarned;
    addCognitive(q.cognitiveLevel, scoreEarned, 0.25);

    results.push({
      questionId: q.id,
      order: q.order,
      part: 1,
      isCorrect,
      scoreEarned,
      maxScore: 0.25,
      cognitiveLevel: q.cognitiveLevel,
      topic: q.topic,
      userAnswer: userChoice || 'Chưa trả lời',
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    });
  });

  // 2. GRADE PART II (Đúng / Sai theo thang điểm Bộ GD&ĐT 2025)
  exam.part2.forEach((q) => {
    const userSubAnswers = answersPart2[q.id] || {};
    let correctCount = 0;

    const subItemResults = q.subItems.map((sub) => {
      const userChoice = userSubAnswers[sub.key];
      const isCorrect = userChoice !== undefined && userChoice === sub.isCorrect;
      if (isCorrect) correctCount++;

      return {
        key: sub.key,
        statement: sub.statement,
        userChoice,
        correctChoice: sub.isCorrect,
        isCorrect,
        explanation: sub.explanation,
      };
    });

    const scoreEarned = calculatePart2ScoreForQuestion(correctCount);
    part2Score += scoreEarned;
    addCognitive(q.cognitiveLevel, scoreEarned, 1.0);

    results.push({
      questionId: q.id,
      order: q.order,
      part: 2,
      isCorrect: correctCount === 4,
      scoreEarned,
      maxScore: 1.0,
      cognitiveLevel: q.cognitiveLevel,
      topic: q.topic,
      subItemResults,
      explanation: `Đúng ${correctCount}/4 ý (${scoreEarned.toFixed(2)} đ).`,
    });
  });

  // 3. GRADE PART III (Trả lời ngắn: 0.5đ / câu)
  exam.part3.forEach((q) => {
    const userAns = answersPart3[q.id];
    const isCorrect = checkShortAnswerMatch(userAns, q.correctAnswer);
    const scoreEarned = isCorrect ? 0.5 : 0;
    part3Score += scoreEarned;
    addCognitive(q.cognitiveLevel, scoreEarned, 0.5);

    results.push({
      questionId: q.id,
      order: q.order,
      part: 3,
      isCorrect,
      scoreEarned,
      maxScore: 0.5,
      cognitiveLevel: q.cognitiveLevel,
      topic: q.topic,
      userAnswer: userAns && userAns.trim() !== '' ? userAns.trim() : 'Chưa trả lời',
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    });
  });

  const rawTotal = part1Score + part2Score + part3Score;
  const totalScore = Math.round(rawTotal * 100) / 100;
  const maxScore = 10.0;

  // Grade classification
  let gradeClassification: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu' | 'Nguy cơ liệt' = 'Trung bình';
  if (totalScore >= 9.0) {
    gradeClassification = 'Xuất sắc';
  } else if (totalScore >= 8.0) {
    gradeClassification = 'Giỏi';
  } else if (totalScore >= 6.5) {
    gradeClassification = 'Khá';
  } else if (totalScore >= 5.0) {
    gradeClassification = 'Trung bình';
  } else if (totalScore > 1.0) {
    gradeClassification = 'Yếu';
  } else {
    gradeClassification = 'Nguy cơ liệt';
  }

  const submission: OnlineExamSubmission = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    examId: exam.id,
    examTitle: exam.title,
    examSubject: exam.subject,
    examGrade: exam.grade,
    examCode: exam.examCode,
    studentName: studentName.trim() || 'Thí sinh tự do',
    studentId: studentId.trim() || '12001',
    studentClass: studentClass.trim() || '12A1',
    submittedAt: new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    timeSpentSeconds,
    totalScore,
    maxScore,
    part1Score: Math.round(part1Score * 100) / 100,
    part2Score: Math.round(part2Score * 100) / 100,
    part3Score: Math.round(part3Score * 100) / 100,
    status: 'completed',
    gradeClassification,
    cognitiveBreakdown: cognitiveStats,
    results,
    answersPart1,
    answersPart2,
    answersPart3,
  };

  return submission;
}
