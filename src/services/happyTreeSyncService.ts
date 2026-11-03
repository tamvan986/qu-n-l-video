import { StudentScore } from '../types';
import { StudentHappyTree } from '../types/happyTree';
import { INITIAL_HAPPY_TREE_STUDENTS } from '../data/happyTreeData';

export const HAPPY_TREE_STORAGE_KEY = 'BA_TRI_HAPPY_TREE_STUDENTS_V1';

/**
 * Chuẩn hóa họ tên tiếng Việt để so khớp chính xác
 */
export const normalizeVietnameseName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Đọc danh sách học sinh hiện tại từ Cây Hạnh Phúc (localStorage hoặc mẫu)
 */
export const getHappyTreeStudents = (): StudentHappyTree[] => {
  try {
    const raw = localStorage.getItem(HAPPY_TREE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lỗi khi đọc Cây Hạnh Phúc từ localStorage:', err);
  }
  return INITIAL_HAPPY_TREE_STUDENTS;
};

export interface HappyTreeSyncResult {
  updatedScores: StudentScore[];
  syncedCount: number;
  totalTreePoints: number;
  totalBonusTxAdded: number;
  rescuedCount: number; // Số học sinh thoát liệt nhờ tiến bộ Cây Hạnh Phúc
  timestamp: string;
}

/**
 * Đồng bộ toàn diện điểm từ Cây Hạnh Phúc sang Bảng Phân Tích Phổ Điểm
 * - Đồng bộ điểm tích lũy dinh dưỡng (currentPoints -> happyTreePoints)
 * - Đồng bộ cấp độ Cây Hạnh Phúc (currentStage -> happyTreeStage)
 * - Đồng bộ số lượng ô tick (completedCount -> happyTreeTicksCount)
 * - Quy đổi điểm thưởng Cây Hạnh Phúc vào Điểm Kiểm Tra Thường Xuyên (TX - Hệ 1):
 *     + Từ 10 - 19 điểm Cây: +0.5 điểm TX
 *     + Từ 20 - 29 điểm Cây: +1.0 điểm TX
 *     + Từ 30 điểm Cây trở lên: +1.5 điểm TX
 * - Cập nhật điểm thi cải thiện từ hồ sơ rèn luyện (mathScore -> scoreFinal)
 * - Tự động cập nhật lại phân cụm DBSCAN (Mũi nhọn, An toàn, Nguy cơ liệt)
 */
export const syncScoresWithHappyTree = (currentScores: StudentScore[]): HappyTreeSyncResult => {
  const treeStudents = getHappyTreeStudents();
  const timestamp = new Date().toLocaleTimeString('vi-VN');

  let syncedCount = 0;
  let totalTreePoints = 0;
  let totalBonusTxAdded = 0;
  let rescuedCount = 0;

  const updatedScores = currentScores.map((student) => {
    // Tìm kiếm học sinh tương ứng trong danh sách Cây Hạnh Phúc
    const normStudentName = normalizeVietnameseName(student.name);
    const matchedTreeStudent = treeStudents.find((ht) => {
      if (ht.id === student.id) return true;
      const normHtName = normalizeVietnameseName(ht.name);
      if (normHtName === normStudentName) return true;
      // Khớp theo tên lót + tên (ví dụ: Kiều Thơ, Thảo Như, Thế Vinh)
      const studentParts = normStudentName.split(' ');
      const htParts = normHtName.split(' ');
      if (
        studentParts.length >= 2 &&
        htParts.length >= 2 &&
        studentParts.slice(-2).join(' ') === htParts.slice(-2).join(' ')
      ) {
        return true;
      }
      return false;
    });

    if (!matchedTreeStudent) {
      return student;
    }

    syncedCount++;
    const treePoints = matchedTreeStudent.currentPoints || 0;
    totalTreePoints += treePoints;

    // Tính điểm thưởng quy đổi vào điểm TX (Hệ 1)
    let bonusTx = 0;
    if (treePoints >= 30) {
      bonusTx = 1.5;
    } else if (treePoints >= 20) {
      bonusTx = 1.0;
    } else if (treePoints >= 10) {
      bonusTx = 0.5;
    }

    // Tính điểm TX mới có bảo toàn điểm gốc ban đầu
    const previousBonus = student.bonusPointsFromTree || 0;
    const baseScore1 = Math.max(0, student.score1 - previousBonus);
    const newScore1 = Math.min(10, Number((baseScore1 + bonusTx).toFixed(1)));
    totalBonusTxAdded += bonusTx;

    // Cập nhật điểm thi thử / khảo sát nếu học sinh có bước tiến bộ trong Cây Hạnh Phúc
    let newScoreFinal = student.scoreFinal;
    if (matchedTreeStudent.mathScore && matchedTreeStudent.mathScore > 0) {
      // Nếu em đã thi đạt điểm bứt phá (ví dụ Kiều Thơ từ 1.0 lên 3.0đ)
      newScoreFinal = matchedTreeStudent.mathScore;
    }

    // Đánh giá thoát liệt
    const wasLiet = student.scoreFinal <= 1.5;
    const isNowSafe = newScoreFinal > 1.5;
    if (wasLiet && isNowSafe) {
      rescuedCount++;
    }

    // Cập nhật phân cụm đồng bộ chính xác theo 6 nhóm Cây Hạnh Phúc
    let newCluster: 'hatmam' | 'mamxanh' | 'choinon' | 'la' | 'hoa' | 'trai' = 'hatmam';
    if (matchedTreeStudent.currentStage) {
      newCluster = matchedTreeStudent.currentStage as any;
    } else if (treePoints >= 30) {
      newCluster = 'trai';
    } else if (treePoints >= 25) {
      newCluster = 'hoa';
    } else if (treePoints >= 20) {
      newCluster = 'la';
    } else if (treePoints >= 15) {
      newCluster = 'choinon';
    } else if (treePoints >= 10) {
      newCluster = 'mamxanh';
    } else {
      newCluster = 'hatmam';
    }

    // Tính điểm tự chủ số Mindful Score (0 - 10)
    const newMindful = Math.min(10, Math.round((treePoints / 35) * 10 * 10) / 10);

    return {
      ...student,
      happyTreePoints: treePoints,
      happyTreeStage: newCluster,
      happyTreeTicksCount: matchedTreeStudent.completedCount,
      mindfulScore: newMindful,
      score1: newScore1,
      scoreFinal: newScoreFinal,
      bonusPointsFromTree: bonusTx,
      cluster: newCluster,
      lastSyncedWithTree: timestamp,
    };
  });

  return {
    updatedScores,
    syncedCount,
    totalTreePoints,
    totalBonusTxAdded,
    rescuedCount,
    timestamp,
  };
};

/**
 * Phát sự kiện broadcast đồng bộ điểm Cây Hạnh Phúc toàn hệ thống
 */
export const broadcastHappyTreeUpdate = (students: StudentHappyTree[]): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('happyTreeUpdated', {
        detail: {
          students,
          timestamp: new Date().toISOString(),
        },
      })
    );
  }
};
