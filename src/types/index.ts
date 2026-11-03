export type HappyTreeClusterKey = 'hatmam' | 'mamxanh' | 'choinon' | 'la' | 'hoa' | 'trai';

export type ActiveTab =
  | 'dashboard'
  | 'video-psychology'
  | 'happy-tree'
  | 'score-analysis'
  | 'workflow'
  | 'lesson-plan'
  | 'meeting';

export interface VideoLogItem {
  id: number;
  date: string; // YYYY-MM-DD
  minutes: number;
  platform: string; // TikTok, YouTube Shorts, Facebook Reels, Instagram Reels, Khác
  slot: string; // Sáng, Trưa, Chiều, Tối, Sau giờ đi ngủ
  trigger: string; // Buồn chán, Căng thẳng / mệt, Thói quen, tay tự mở, Bạn bè gửi link, Chờ đợi / rảnh tay, Khó ngủ
  mood: string; // Vui, Bình thường, Mệt, Buồn, Lo lắng, Hào hứng
  note?: string;
  stopped?: boolean;
}

export interface VideoSwapItem {
  id: number;
  date: string;
  activity: string; // Đọc 15 phút, Đi bộ / vận động, Nghe 3 bài nhạc, Vẽ / viết nhật ký, Dọn bàn học, Gọi điện cho bạn
  durationMinutes?: number;
}

export interface VideoReflectionItem {
  date: string;
  trigger?: string;
  worked?: string;
  commit: string;
}

export interface MindfulJournalEntry {
  id: number;
  date: string;
  emotion: string;
  note: string;
}

export interface VideoChallengeState {
  kind: 'less10' | 'nolatenight' | 'oneswap' | 'pause';
  start: string;
  done?: Record<string, boolean>;
}

export interface StudentVideoRecord {
  id: string;
  createdAt?: number;
  demo?: boolean;
  profile: {
    name: string;
    className: string;
    limit: number;
    bedtime: string;
    pinHash: string;
  };
  logs: VideoLogItem[];
  swaps: VideoSwapItem[];
  reflections: VideoReflectionItem[];
  journalEntries: MindfulJournalEntry[];
  challenge: VideoChallengeState | null;
}

export type BusinessType = 'lesson-plan' | 'meeting' | 'score-analysis' | 'temis' | 'exam-creator' | 'online-exam' | 'classrooms';

export type ExamSubject =
  | 'Toán học'
  | 'Tin học'
  | 'Công nghệ'
  | 'Vật lí'
  | 'Hóa học'
  | 'Sinh học'
  | 'Ngữ văn'
  | 'Tiếng Anh'
  | 'Lịch sử'
  | 'Địa lí'
  | 'GD Kinh tế & Pháp luật';

export type ExamGrade = '10' | '11' | '12';

export type ExamType =
  | 'tot_nghiep' // Cấu trúc mới 2025 của Bộ GD&ĐT (3 Phần: Nhiều phương án, Đúng/Sai, Trả lời ngắn)
  | 'cuoi_ky'
  | 'giua_ky'
  | 'thuong_xuyen';

export type CognitiveLevel = 'NB' | 'TH' | 'VD' | 'VDC'; // Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao

export interface MultipleChoiceQuestion {
  id: string;
  order: number;
  content: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  cognitiveLevel: CognitiveLevel;
  topic: string;
  points: number;
  tikzCode?: string;
  diagramTitle?: string;
}

export interface TrueFalseItem {
  key: 'a' | 'b' | 'c' | 'd';
  statement: string;
  isCorrect: boolean;
  explanation: string;
}

export interface TrueFalseQuestion {
  id: string;
  order: number;
  mainStem: string;
  subItems: TrueFalseItem[];
  cognitiveLevel: CognitiveLevel;
  topic: string;
  points: number;
  tikzCode?: string;
  diagramTitle?: string;
}

export interface ShortAnswerQuestion {
  id: string;
  order: number;
  content: string;
  correctAnswer: string;
  explanation: string;
  cognitiveLevel: CognitiveLevel;
  topic: string;
  points: number;
  tikzCode?: string;
  diagramTitle?: string;
}

export interface EssayQuestion {
  id: string;
  order: number;
  content: string;
  gradingGuide: string;
  cognitiveLevel: CognitiveLevel;
  topic: string;
  points: number;
  tikzCode?: string;
  diagramTitle?: string;
}

export interface ExamMatrixTopic {
  topicName: string;
  periods?: number;
  nbCount: number;
  thCount: number;
  vdCount: number;
  vdcCount: number;
  totalPoints: number;
}

export interface ExamPaper {
  id: string;
  title: string;
  subject: ExamSubject;
  grade: ExamGrade;
  schoolYear: string;
  term: 'Học kỳ I' | 'Học kỳ II' | 'Cả năm / Tốt nghiệp';
  examType: ExamType;
  examCode: string;
  schoolName: string;
  deptName: string;
  durationMinutes: number;
  description: string;
  structureNote: string;
  matrixTopics: ExamMatrixTopic[];
  part1: MultipleChoiceQuestion[];
  part2: TrueFalseQuestion[];
  part3: ShortAnswerQuestion[];
  essayQuestions?: EssayQuestion[];
  createdAt: string;
  author: string;
}

export interface StudentScore {
  id: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  className: string;
  score1: number; // Điểm kiểm tra thường xuyên
  score2: number; // Điểm kiểm tra giữa kỳ
  scoreFinal: number; // Điểm thi thử / cuối kỳ
  screenTimeMinutes?: number; // Thời lượng xem video ngắn TB/ngày (phút)
  lateNightSessions?: number; // Số đêm lướt video sau giờ ngủ / tuần
  happyTreeStage?: string; // Hạt mầm, Mầm xanh, Chồi non, Lá, Hoa, Trái
  happyTreePoints?: number; // Điểm tích lũy Cây Hạnh Phúc
  mindfulScore?: number; // Điểm tự chủ số (0-10)
  cluster: HappyTreeClusterKey | 'muinhon' | 'antoan' | 'nguyco';
  riskFactors: string[];
  assignedTutor?: string;
  assignedTeacher?: string;
  remedialPlan?: string;
  bonusPointsFromTree?: number; // Điểm cộng quy đổi từ Cây Hạnh Phúc vào điểm kiểm tra thường xuyên
  happyTreeTicksCount?: number; // Số ô tick hoàn thành (0 - 6)
  lastSyncedWithTree?: string; // Thời gian đồng bộ gần nhất từ Cây Hạnh Phúc
}

export interface ClusterSummary {
  name: string;
  key: HappyTreeClusterKey | 'muinhon' | 'antoan' | 'nguyco';
  count: number;
  percentage: number;
  avgScore: number;
  color: string;
  bgLight: string;
  description: string;
}

export interface TemisCriterion {
  id: number;
  standardId: number;
  standardName: string;
  name: string;
  description: string;
  level: 'Chưa đạt' | 'Đạt' | 'Khá' | 'Tốt';
  evidenceCode: string;
  evidenceName: string;
  aiSuggestedEvidence: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  gender?: 'Nam' | 'Nữ';
  birthYear?: string | number;
  phone?: string;
  email?: string;
  subject: string;
  group?: 'Toán' | 'Tin học' | 'Công nghệ';
  duty: 'Tổ trưởng' | 'Tổ phó' | 'Giáo viên';
  degree: string;
  assignedClasses?: string[];
  weeklyPeriods?: number;
  concurrentDuty?: string; // Ví dụ: 'Chủ nhiệm 12A1', 'Phụ trách phòng máy'
  isPartyMember?: boolean; // Đảng viên (X trong danh sách chính thức)
  antiFailStudentsCount?: number; // Số học sinh kèm cặp chống điểm liệt
  temisRating: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
  criteriaScores: Record<number, 'Chưa đạt' | 'Đạt' | 'Khá' | 'Tốt'>;
  avatarColor?: string;
}

export interface MeetingMinutesData {
  id?: string;
  month?: number; // 1-12
  year?: number; // e.g. 2026, 2027
  sessionNumber?: number; // Kỳ sinh hoạt 1 hoặc 2 trong tháng
  mainTopic?: string;
  schoolName: string;
  deptName: string;
  docNumber: string;
  title: string;
  subTitle: string;
  dateTime: string;
  location: string;
  participants: {
    attendees: string;
    absentees: string;
    chairperson: string;
    secretary: string;
  };
  hasDemonstrationLesson: boolean;
  demonstrationLesson?: {
    teacher: string;
    subject: string;
    grade: string;
    topic: string;
    rating: string;
  };
  lessonStudySteps?: {
    step1: string; // Xây dựng bài dạy
    step2: string; // Dạy minh họa và quan sát
    step3: string; // Phân tích bài học & suy ngẫm
    step4: string; // Vận dụng vào thực tiễn
  };
  regularMeetingActivities?: {
    focusTopic: string;
    description: string;
    assignedTasks: string;
  };
  aiAnalysisHighlights: string[];
  remedialAntiFailActions: string[];
  conclusions: string[];
}

export interface LessonPlan5512 {
  schoolName: string;
  deptName: string;
  subject: string;
  grade: string;
  schoolYear: string;
  timeAllocation: {
    term1Weeks: number;
    term1Periods: number;
    term2Weeks: number;
    term2Periods: number;
    totalPeriods: number;
  };
  topics: {
    order: number;
    name: string;
    periods: number;
    deliveryTime: string;
    deviceTools: string;
    learningOutcomes: string;
  }[];
}

export interface QuestionResult {
  questionId: string;
  order: number;
  part: 1 | 2 | 3;
  isCorrect: boolean;
  scoreEarned: number;
  maxScore: number;
  cognitiveLevel?: CognitiveLevel;
  topic?: string;
  userAnswer?: string;
  correctAnswer?: string;
  subItemResults?: {
    key: 'a' | 'b' | 'c' | 'd';
    statement: string;
    userChoice?: boolean;
    correctChoice: boolean;
    isCorrect: boolean;
    explanation: string;
  }[];
  explanation: string;
}

export interface OnlineExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  examSubject: ExamSubject;
  examGrade: ExamGrade;
  examCode: string;
  studentName: string;
  studentId: string; // SBD
  studentClass: string;
  submittedAt: string;
  timeSpentSeconds: number;
  totalScore: number;
  maxScore: number;
  part1Score: number;
  part2Score: number;
  part3Score: number;
  status: 'completed' | 'in_progress';
  gradeClassification: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu' | 'Nguy cơ liệt';
  cognitiveBreakdown: {
    nb: { score: number; max: number };
    th: { score: number; max: number };
    vd: { score: number; max: number };
    vdc: { score: number; max: number };
  };
  results: QuestionResult[];
  answersPart1: { [questionId: string]: 'A' | 'B' | 'C' | 'D' };
  answersPart2: { [questionId: string]: { [key in 'a' | 'b' | 'c' | 'd']?: boolean } };
  answersPart3: { [questionId: string]: string };
}

export type AttendanceStatus = 'present' | 'absent_excused' | 'absent_unexcused' | 'late';

export interface StudentAttendanceItem {
  studentId: string;
  studentName: string;
  studentCode: string;
  gender?: 'Nam' | 'Nữ';
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  date: string; // YYYY-MM-DD
  sessionPeriod: 'Sáng' | 'Chiều' | 'Tối';
  subject: string;
  teacherName: string;
  topic?: string;
  totalStudents: number;
  presentCount: number;
  absentExcusedCount: number;
  absentUnexcusedCount: number;
  lateCount: number;
  attendanceRate: number; // Tỷ lệ %
  records: StudentAttendanceItem[];
  createdAt: string;
}

export interface ClassAssignedExam {
  id: string; // ID lượt giao
  examId: string; // ID của đề thi gốc (từ ExamPaper)
  examTitle: string;
  examCode: string; // Mã gốc đề thi (vd: TOAN12-TN2025)
  accessCode: string; // Mã phòng thi đồng bộ cấp cho học sinh vào thi (vd: THI-12A1-01)
  assignedDate: string; // YYYY-MM-DD
  deadline?: string; // YYYY-MM-DD hoặc ghi chú hạn chót
  durationMinutes: number;
  isOpen: boolean; // Trạng thái mở cho học sinh vào làm bài
  allowReview: boolean; // Cho xem giải chi tiết sau nộp
  note?: string;
  submissionsCount: number; // Số học sinh đã nộp
  avgScore?: number; // Điểm trung bình của lớp
}

export interface ClassroomStudent {
  id: string;
  studentCode: string; // Mã HS / SBD (vd: HS01, 12001)
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  phone?: string;
  parentPhone?: string;
  cluster?: 'muinhon' | 'antoan' | 'nguyco';
  assignedTeacher?: string;
  notes?: string;
}

export interface Classroom {
  id: string;
  name: string; // vd: 12A1 (GDTX)
  grade: ExamGrade; // '10' | '11' | '12'
  code: string; // Mã vào lớp (vd: GDTX-12A1, LOP-12A1)
  schoolYear: string; // "2026 - 2027"
  room: string; // "Phòng Thư viện"
  homeroomTeacher: string; // GVCN
  subjectTeacher: string; // GV bộ môn
  subject: string; // Môn học
  description?: string;
  students: ClassroomStudent[];
  assignedExams: ClassAssignedExam[];
  attendanceHistory: AttendanceSession[];
  createdAt: string;
}

