export type TreeStageKey = 'hatmam' | 'mamxanh' | 'choinon' | 'la' | 'hoa' | 'trai';

export interface TreeStageInfo {
  key: TreeStageKey;
  level: number; // 1 to 6
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  requiredTicks: number; // 1 to 6
  requiredPoints: number; // 5, 10, 15, 20, 25, 30
  scoreRange: string;
  description: string;
  pedagogicalAction: string;
}

export interface AssessmentCriterion {
  id: number;
  type: 'positive' | 'negative';
  name: string;
  points: number; // +2, +3, +5, -1, -2, etc.
  category?: 'mindful' | 'swap' | 'sleep' | 'journal' | 'challenge' | 'peer_tutor' | 'academic' | 'class' | 'exam' | 'attitude';
  description?: string;
}

export interface StudentHappyTree {
  id: string;
  stt: number;
  name: string;
  className: string;
  gender: 'Nam' | 'Nữ';
  currentPoints: number; // Tổng điểm tích lũy
  ticks: [boolean, boolean, boolean, boolean, boolean, boolean]; // 6 ô tick
  currentStage: TreeStageKey;
  previousStage?: TreeStageKey;
  initialScore: number; // Điểm thi thử ban đầu
  targetScore: number; // Mục tiêu thi chính thức
  mathScore?: number;
  socialScore?: number; // Điểm TB Xã hội (Sử + Địa)
  completedCount: number; // 0 - 6
  progressPercent: number; // 0 - 100%
  status: 'Hoàn thành' | 'Chưa xong';
  isPeerTutor?: boolean; // Sứ giả Hạnh phúc (Nhóm Hoa / Trái)
  assignedTutorName?: string;
  lastUpdated: string;
  history: {
    date: string;
    action: string;
    pointsChange: number;
    newTotal: number;
    criteriaName?: string;
  }[];
}

export interface LevelUpEvent {
  student: StudentHappyTree;
  oldStage: TreeStageInfo;
  newStage: TreeStageInfo;
  date: string;
  certificateId: string;
}
