import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  AlertTriangle,
  Users,
  Brain,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  X,
  FileCode,
  Smartphone,
  Moon,
  Sprout,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StudentScore } from '../types';
import { SAMPLE_STUDENTS } from '../data/mockData';
import { exportToWordDocument } from '../services/aiService';
import { ChartTikzExportModal, ChartTikzId } from './ChartTikzExportModal';
import { DbscanClusteringChart } from './DbscanClusteringChart';
import { syncScoresWithHappyTree, HappyTreeSyncResult } from '../services/happyTreeSyncService';

interface ScoreAnalysisViewProps {
  students?: StudentScore[];
  onUpdateStudents?: (students: StudentScore[]) => void;
}

export const ScoreAnalysisView: React.FC<ScoreAnalysisViewProps> = ({
  students: propStudents,
  onUpdateStudents,
}) => {
  const [students, setStudents] = useState<StudentScore[]>(propStudents || SAMPLE_STUDENTS);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<
    'all' | 'hatmam' | 'mamxanh' | 'choinon' | 'la' | 'hoa' | 'trai'
  >('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'dbscan' | 'tutors' | 'matrix' | 'ai-report'>('list');
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{
    total: number;
    hatmam: number;
    mamxanh: number;
    choinon: number;
    la: number;
    hoa: number;
    trai: number;
    liet: number;
  } | null>(null);
  const [syncStats, setSyncStats] = useState<HappyTreeSyncResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isTikzModalOpen, setIsTikzModalOpen] = useState<boolean>(false);
  const [selectedTikzChartId, setSelectedTikzChartId] = useState<ChartTikzId>('score-spectrum');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const barChartInstanceRef = useRef<any>(null);

  const doughnutChartRef = useRef<HTMLCanvasElement>(null);
  const doughnutChartInstanceRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Đồng bộ điểm từ Cây Hạnh Phúc (tích hợp điểm dinh dưỡng, cấp độ, cộng điểm TX)
  const handleSyncWithHappyTree = (isManual = true) => {
    setStudents((prev) => {
      const result = syncScoresWithHappyTree(prev);
      setSyncStats(result);
      if (onUpdateStudents) {
        onUpdateStudents(result.updatedScores);
      }
      if (isManual) {
        showToast(
          `Đã đồng bộ thành công ${result.syncedCount} học sinh từ Cây Hạnh Phúc! Tổng điểm dinh dưỡng: ${result.totalTreePoints}đ, cộng +${result.totalBonusTxAdded}đ TX.`
        );
      }
      return result.updatedScores;
    });
  };

  // Sync if propStudents changes externally
  useEffect(() => {
    if (propStudents && propStudents.length > 0) {
      setStudents(propStudents);
    }
  }, [propStudents]);

  // Real-time synchronization with Happy Tree updates & storage events
  useEffect(() => {
    // Initial sync
    handleSyncWithHappyTree(false);

    const handleRemoteSync = () => {
      handleSyncWithHappyTree(false);
    };

    window.addEventListener('happyTreeUpdated', handleRemoteSync);
    window.addEventListener('storage', handleRemoteSync);
    return () => {
      window.removeEventListener('happyTreeUpdated', handleRemoteSync);
      window.removeEventListener('storage', handleRemoteSync);
    };
  }, []);

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const matchesCluster = selectedClusterFilter === 'all' || s.cluster === selectedClusterFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      s.id.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesCluster && matchesSearch;
  });

  const hatmamCount = students.filter((s) => s.cluster === 'hatmam').length;
  const mamxanhCount = students.filter((s) => s.cluster === 'mamxanh').length;
  const choinonCount = students.filter((s) => s.cluster === 'choinon').length;
  const laCount = students.filter((s) => s.cluster === 'la').length;
  const hoaCount = students.filter((s) => s.cluster === 'hoa').length;
  const traiCount = students.filter((s) => s.cluster === 'trai').length;
  const lietDirectCount = students.filter((s) => s.scoreFinal <= 1.5).length;

  const avgScore = (
    students.reduce((acc, curr) => acc + curr.scoreFinal, 0) / (students.length || 1)
  ).toFixed(2);

  // Draw Charts
  useEffect(() => {
    const drawCharts = async () => {
      try {
        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);

        // 1. Bar Chart: Phổ điểm 0-10
        if (barChartRef.current) {
          if (barChartInstanceRef.current) {
            barChartInstanceRef.current.destroy();
          }

          // Group into bins: [0-2], (2-3.5], (3.5-5], (5-6.5], (6.5-8], (8-10]
          const bins = [0, 0, 0, 0, 0, 0];
          students.forEach((s) => {
            const sc = s.scoreFinal;
            if (sc <= 2) bins[0]++;
            else if (sc <= 3.5) bins[1]++;
            else if (sc <= 5) bins[2]++;
            else if (sc <= 6.5) bins[3]++;
            else if (sc <= 8) bins[4]++;
            else bins[5]++;
          });

          const ctxBar = barChartRef.current.getContext('2d');
          if (ctxBar) {
            barChartInstanceRef.current = new Chart(ctxBar, {
              type: 'bar',
              data: {
                labels: [
                  '0.0 - 2.0 (Nguy kịch)',
                  '2.1 - 3.5 (Yếu kém)',
                  '3.6 - 5.0 (Cận an toàn)',
                  '5.1 - 6.5 (Trung bình)',
                  '6.6 - 8.0 (Khá)',
                  '8.1 - 10.0 (Giỏi)',
                ],
                datasets: [
                  {
                    label: 'Số lượng học sinh',
                    data: bins,
                    backgroundColor: [
                      '#dc2626', // red-600
                      '#f87171', // red-400
                      '#fbbf24', // amber-400
                      '#60a5fa', // blue-400
                      '#3b82f6', // blue-600
                      '#10b981', // emerald-500
                    ],
                    borderRadius: 6,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                  },
                },
              },
            });
          }
        }

        // 2. Doughnut Chart: Gom cụm 6 nhóm Cây Hạnh Phúc
        if (doughnutChartRef.current) {
          if (doughnutChartInstanceRef.current) {
            doughnutChartInstanceRef.current.destroy();
          }

          const ctxDoughnut = doughnutChartRef.current.getContext('2d');
          if (ctxDoughnut) {
            doughnutChartInstanceRef.current = new Chart(ctxDoughnut, {
              type: 'doughnut',
              data: {
                labels: [
                  '🌱 Hạt mầm tự chủ',
                  '🌿 Mầm xanh tĩnh tâm',
                  '🌲 Chồi non cân bằng',
                  '🍃 Lá xanh vững vàng',
                  '🌸 Hoa thơm bản lĩnh',
                  '🍎 Trái ngọt',
                ],
                datasets: [
                  {
                    data: [hatmamCount, mamxanhCount, choinonCount, laCount, hoaCount, traiCount],
                    backgroundColor: [
                      '#ef4444', // Hạt mầm - đỏ
                      '#f59e0b', // Mầm xanh - vàng/amber
                      '#3b82f6', // Chồi non - xanh dương
                      '#10b981', // Lá xanh - xanh lá
                      '#a855f7', // Hoa thơm - tím
                      '#f97316', // Trái ngọt - cam
                    ],
                    borderWidth: 0,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
                },
              },
            });
          }
        }
      } catch (err) {
        console.error('Error in Score Charts:', err);
      }
    };

    drawCharts();

    return () => {
      if (barChartInstanceRef.current) barChartInstanceRef.current.destroy();
      if (doughnutChartInstanceRef.current) doughnutChartInstanceRef.current.destroy();
    };
  }, [students, hatmamCount, mamxanhCount, choinonCount, laCount, hoaCount, traiCount]);

  // Download sample Excel template
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          STT: 1,
          'Mã HS': 'HS01',
          'Họ và Tên': 'Nguyễn Hoàng Anh',
          'Giới tính': 'Nam',
          Lớp: '12A1',
          'Điểm TX': 8.5,
          'Điểm GK': 8.0,
          'Điểm Khảo Sát / Thi Thử': 8.8,
          'Vấn đề kiến thức / Ghi chú': '',
          'Đôi bạn kèm cặp': '',
          'Giáo viên phụ trách': 'Nguyễn Văn Tâm',
        },
        {
          STT: 2,
          'Mã HS': 'HS02',
          'Họ và Tên': 'Trần Thị Mai',
          'Giới tính': 'Nữ',
          Lớp: '12A1',
          'Điểm TX': 7.5,
          'Điểm GK': 8.0,
          'Điểm Khảo Sát / Thi Thử': 8.2,
          'Vấn đề kiến thức / Ghi chú': '',
          'Đôi bạn kèm cặp': '',
          'Giáo viên phụ trách': 'Nguyễn Bảo Ngưng',
        },
        {
          STT: 3,
          'Mã HS': 'HS03',
          'Họ và Tên': 'Phạm Minh Đức',
          'Giới tính': 'Nam',
          Lớp: '12A1',
          'Điểm TX': 6.0,
          'Điểm GK': 6.5,
          'Điểm Khảo Sát / Thi Thử': 6.4,
          'Vấn đề kiến thức / Ghi chú': 'Hay nhầm dấu đạo hàm cấp 1',
          'Đôi bạn kèm cặp': 'Nguyễn Hoàng Anh',
          'Giáo viên phụ trách': 'Nguyễn Bảo Ngưng',
        },
        {
          STT: 4,
          'Mã HS': 'HS04',
          'Họ và Tên': 'Bùi Gia Huy',
          'Giới tính': 'Nam',
          Lớp: '12A1',
          'Điểm TX': 2.5,
          'Điểm GK': 2.0,
          'Điểm Khảo Sát / Thi Thử': 2.2,
          'Vấn đề kiến thức / Ghi chú': 'Mất gốc công thức Logarit, hay bỏ câu nhận biết',
          'Đôi bạn kèm cặp': 'Nguyễn Hoàng Anh',
          'Giáo viên phụ trách': 'Nguyễn Văn Tâm',
        },
        {
          STT: 5,
          'Mã HS': 'HS05',
          'Họ và Tên': 'Dương Văn Khang',
          'Giới tính': 'Nam',
          Lớp: '12A1',
          'Điểm TX': 1.5,
          'Điểm GK': 1.0,
          'Điểm Khảo Sát / Thi Thử': 1.2,
          'Vấn đề kiến thức / Ghi chú': 'Nguy cơ điểm liệt (< 1.0), mất căn bản môn Toán',
          'Đôi bạn kèm cặp': 'Trần Thị Mai',
          'Giáo viên phụ trách': 'Nguyễn Văn Tâm',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 10 },
        { wch: 22 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 24 },
        { wch: 38 },
        { wch: 20 },
        { wch: 22 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bang_Diem_Khao_Sat');
      XLSX.writeFile(wb, 'Mau_Bang_Diem_Khao_Sat_Chong_Liet_Toan_12.xlsx');

      showToast('Đã tải xuống file Excel mẫu: Mau_Bang_Diem_Khao_Sat_Chong_Liet_Toan_12.xlsx');
    } catch (err: any) {
      console.error('Lỗi xuất file mẫu:', err);
      showToast('Có lỗi khi tạo file mẫu Excel: ' + (err?.message || ''));
    }
  };

  // Reset back to mock/sample data
  const handleResetSampleData = () => {
    setStudents([...SAMPLE_STUDENTS]);
    if (onUpdateStudents) {
      onUpdateStudents([...SAMPLE_STUDENTS]);
    }
    setImportedFileName(null);
    setImportStats(null);
    showToast('Đã khôi phục dữ liệu mẫu ban đầu (40 học sinh lớp 12A1)');
  };

  // Process uploaded Excel / CSV file
  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          showToast('Không đọc được nội dung file.');
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          showToast('File không có bảng tính hợp lệ.');
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          showToast('File trống hoặc không chứa dữ liệu.');
          return;
        }

        // Find header row: scan first 15 rows for columns containing "tên", "họ", "điểm", "sbd", "hs", etc.
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
          const rowStr = rawRows[i].map((c) => String(c).toLowerCase()).join(' ');
          if (
            (rowStr.includes('tên') || rowStr.includes('name') || rowStr.includes('họ')) &&
            (rowStr.includes('điểm') ||
              rowStr.includes('khảo sát') ||
              rowStr.includes('toán') ||
              rowStr.includes('stt') ||
              rowStr.includes('lớp') ||
              rowStr.includes('sbd'))
          ) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          headerRowIndex = 0;
        }

        const headers = rawRows[headerRowIndex].map((h) => String(h || '').trim());

        const findCol = (regex: RegExp) => headers.findIndex((h) => regex.test(h));

        const colId = findCol(/^(mã|sbd|số báo danh|id|stt|mã hs|ma hs)/i);
        const colName = findCol(/(họ và tên|họ tên|ho va ten|ho ten|tên học sinh|tên|name)/i);
        const colClass = findCol(/(lớp|lop|class)/i);
        const colGender = findCol(/(giới tính|gioi tinh|phái|gender)/i);
        const colScore1 = findCol(/(thường xuyên|tx|kttx|hệ 1|he 1|điểm 1|score1)/i);
        const colScore2 = findCol(/(giữa kỳ|giua ky|gk|ktgk|hệ 2|he 2|điểm 2|score2)/i);
        const colScoreFinal = findCol(
          /(khảo sát|khao sat|thi thử|thi thu|điểm thi|tốt nghiệp|tot nghiep|cuối kỳ|cuoi ky|tổng kết|final|điểm ks|điểm tn)/i
        );
        const colGenericScore = findCol(/(điểm|diem|score)/i);
        const colRisk = findCol(/(ghi chú|vấn đề|nguy cơ|lưu ý|nhận xét|risk)/i);
        const colTutor = findCol(/(kèm cặp|người kèm|đôi bạn|tutor)/i);
        const colTeacher = findCol(/(giáo viên|gv phụ trách|gv|teacher)/i);

        const parsedStudents: StudentScore[] = [];

        const parseScore = (val: any, fallback = 0): number => {
          if (val === undefined || val === null || val === '') return fallback;
          const cleaned = String(val).replace(',', '.').replace(/[^\d.]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? fallback : Math.min(10, Math.max(0, parseFloat(num.toFixed(1))));
        };

        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const rawName = colName !== -1 ? String(row[colName] || '').trim() : '';
          if (!rawName) continue; // Skip empty name rows

          const rawId =
            colId !== -1 && row[colId]
              ? String(row[colId]).trim()
              : `HS${String(parsedStudents.length + 1).padStart(2, '0')}`;
          const rawClass =
            colClass !== -1 && row[colClass] ? String(row[colClass]).trim() : '12A1 (GDTX)';
          const rawGenderStr =
            colGender !== -1 ? String(row[colGender] || '').trim().toLowerCase() : '';
          const gender: 'Nam' | 'Nữ' =
            rawGenderStr === 'nữ' || rawGenderStr === 'nu' || rawGenderStr === 'female'
              ? 'Nữ'
              : 'Nam';

          const score1 = colScore1 !== -1 ? parseScore(row[colScore1], 6.0) : 6.0;
          const score2 = colScore2 !== -1 ? parseScore(row[colScore2], 6.0) : 6.0;

          let scoreFinal = 5.0;
          if (colScoreFinal !== -1 && row[colScoreFinal] !== '') {
            scoreFinal = parseScore(row[colScoreFinal]);
          } else if (colGenericScore !== -1 && row[colGenericScore] !== '') {
            scoreFinal = parseScore(row[colGenericScore]);
          } else {
            scoreFinal = Number(((score1 + score2 * 2) / 3).toFixed(1));
          }

          const rawRisk = colRisk !== -1 && row[colRisk] ? String(row[colRisk]).trim() : '';
          const customRisks = rawRisk
            ? rawRisk
                .split(/[,;\n]/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

          let cluster: 'hatmam' | 'mamxanh' | 'choinon' | 'la' | 'hoa' | 'trai' = 'la';
          const riskFactors: string[] = [...customRisks];

          if (scoreFinal <= 2.0) {
            cluster = 'hatmam';
            if (scoreFinal <= 1.0) {
              if (!riskFactors.some((rf) => rf.includes('liệt trực tiếp'))) {
                riskFactors.unshift('Nguy cơ điểm liệt trực tiếp (<= 1.0) - Cảnh báo đỏ');
              }
            } else {
              if (!riskFactors.some((rf) => rf.includes('nguy kịch'))) {
                riskFactors.unshift('Điểm nguy kịch (<= 2.0) - Nguy cơ trượt tốt nghiệp');
              }
            }
          } else if (scoreFinal <= 3.5) {
            cluster = 'mamxanh';
            if (!riskFactors.some((rf) => rf.includes('dưới 3.5'))) {
              riskFactors.unshift('Điểm dưới 3.5 - Cần củng cố 25 câu nhận biết');
            }
          } else if (scoreFinal <= 4.8) {
            cluster = 'choinon';
          } else if (scoreFinal <= 6.2) {
            cluster = 'la';
          } else if (scoreFinal <= 7.8) {
            cluster = 'hoa';
          } else {
            cluster = 'trai';
          }

          if (score2 > 0 && scoreFinal < score2 - 1.5) {
            riskFactors.push(`Điểm thi tụt dốc so với giữa kỳ (${scoreFinal} so với ${score2})`);
          }

          const assignedTutor =
            colTutor !== -1 && row[colTutor] ? String(row[colTutor]).trim() : undefined;
          const assignedTeacher =
            colTeacher !== -1 && row[colTeacher] ? String(row[colTeacher]).trim() : undefined;

          parsedStudents.push({
            id: rawId,
            name: rawName,
            gender,
            dob: '2007',
            className: rawClass,
            score1,
            score2,
            scoreFinal,
            cluster,
            happyTreeStage: cluster,
            riskFactors,
            assignedTutor,
            assignedTeacher,
          });
        }

        if (parsedStudents.length === 0) {
          showToast(
            'Không trích xuất được học sinh nào từ file. Vui lòng kiểm tra lại cấu trúc hoặc tải file mẫu Excel.'
          );
          return;
        }

        // Auto-assign tutors and teachers for weak students if not specified
        const topStudents = parsedStudents.filter((s) => s.cluster === 'trai' || s.cluster === 'hoa');
        const teachersPool = [
          'Cô Nguyễn Thị Kiều Ân (GV Hướng dẫn)',
          'Thầy Nguyễn Bảo Ngưng',
          'Thầy Vũ Đức Thành',
          'Cô Phan Ngọc Trinh',
          'Thầy Lê Trung Hậu',
        ];

        let weakIdx = 0;
        parsedStudents.forEach((st) => {
          if (st.cluster === 'hatmam' || st.cluster === 'mamxanh') {
            if (!st.assignedTutor) {
              st.assignedTutor =
                topStudents.length > 0
                  ? topStudents[weakIdx % topStudents.length].name
                  : 'Nguyễn Thế Vinh';
            }
            if (!st.assignedTeacher) {
              st.assignedTeacher = teachersPool[weakIdx % teachersPool.length];
            }
            if (!st.remedialPlan) {
              st.remedialPlan =
                st.scoreFinal <= 1.5
                  ? 'Phụ đạo đặc biệt 2 tiết/tuần, báo cáo GVCN, ôn 20 câu nhận biết.'
                  : 'Rèn 25 câu nhận biết - thông hiểu, đôi bạn kèm cặp 15 phút đầu giờ hàng ngày.';
            }
            weakIdx++;
          }
        });

        // Apply new students state
        setStudents(parsedStudents);
        if (onUpdateStudents) {
          onUpdateStudents(parsedStudents);
        }
        setImportedFileName(file.name);

        const hatmam = parsedStudents.filter((s) => s.cluster === 'hatmam').length;
        const mamxanh = parsedStudents.filter((s) => s.cluster === 'mamxanh').length;
        const choinon = parsedStudents.filter((s) => s.cluster === 'choinon').length;
        const la = parsedStudents.filter((s) => s.cluster === 'la').length;
        const hoa = parsedStudents.filter((s) => s.cluster === 'hoa').length;
        const trai = parsedStudents.filter((s) => s.cluster === 'trai').length;
        const liet = parsedStudents.filter((s) => s.scoreFinal <= 1.5).length;

        setImportStats({
          total: parsedStudents.length,
          hatmam,
          mamxanh,
          choinon,
          la,
          hoa,
          trai,
          liet,
        });

        showToast(
          `✅ Đã nạp thành công ${parsedStudents.length} học sinh từ file "${file.name}"! Phổ điểm & gom cụm DBSCAN đã được tính toán lại.`
        );
      } catch (err: any) {
        console.error('Lỗi phân tích file Excel/CSV:', err);
        showToast(
          `Đã xảy ra lỗi khi đọc file: ${err?.message || 'Vui lòng kiểm tra định dạng .xlsx, .xls hoặc .csv'}`
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleExportWordReport = () => {
    const content = `
      <div style="font-family: 'Times New Roman', serif;">
        <h2 style="text-align: center; text-transform: uppercase;">BÁO CÁO PHÂN TÍCH PHỔ ĐIỂM & ĐỒNG BỘ 6 NHÓM CÂY HẠNH PHÚC</h2>
        <p style="text-align: center; font-style: italic;">Trường THPT Phan Thanh Giản - Dự án Nghiên cứu Khoa học Kỹ thuật về Xã hội Hành vi</p>
        <p style="text-align: center; font-style: italic;">Giáo viên hướng dẫn: Nguyễn Thị Kiều Ân</p>
        
        <h3>I. Tổng quan số liệu thống kê:</h3>
        <p>- Tổng số học sinh dự thi: ${students.length} học sinh</p>
        <p>- Điểm trung bình: ${avgScore} / 10 điểm</p>
        <p>- 🌱 Hạt mầm tự chủ (<= 2.0đ): ${hatmamCount} em (${((hatmamCount / students.length) * 100).toFixed(1)}%)</p>
        <p>- 🌿 Mầm xanh tĩnh tâm (2.1 - 3.5đ): ${mamxanhCount} em (${((mamxanhCount / students.length) * 100).toFixed(1)}%)</p>
        <p>- 🌲 Chồi non cân bằng (3.6 - 4.8đ): ${choinonCount} em (${((choinonCount / students.length) * 100).toFixed(1)}%)</p>
        <p>- 🍃 Lá xanh vững vàng (5.0 - 6.2đ): ${laCount} em (${((laCount / students.length) * 100).toFixed(1)}%)</p>
        <p>- 🌸 Hoa thơm bản lĩnh (6.5 - 7.8đ): ${hoaCount} em (${((hoaCount / students.length) * 100).toFixed(1)}%)</p>
        <p>- 🍎 Trái ngọt (>= 8.0đ): ${traiCount} em (${((traiCount / students.length) * 100).toFixed(1)}%)</p>
        <p>- Số học sinh có nguy cơ liệt trực tiếp (&le; 1.5đ): ${lietDirectCount} em</p>
        ${importedFileName ? `<p style="color: #047857; font-weight: bold;">(Dữ liệu thực tế được nạp từ tệp: ${importedFileName})</p>` : ''}
        
        <h3>II. Danh sách học sinh nhóm Hạt mầm & Mầm xanh cần kèm cặp:</h3>
        <table border="1" style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <th>STT</th>
            <th>Họ và tên</th>
            <th>Lớp</th>
            <th>Điểm thi</th>
            <th>Nhóm Cây Hạnh Phúc</th>
            <th>Dạng bài hay sai</th>
            <th>Học sinh kèm cặp</th>
            <th>Kế hoạch phụ đạo</th>
          </tr>
          ${students
            .filter((s) => s.cluster === 'hatmam' || s.cluster === 'mamxanh')
            .map(
              (s, i) => `
            <tr>
              <td align="center">${i + 1}</td>
              <td><b>${s.name}</b></td>
              <td align="center">${s.className}</td>
              <td align="center" style="color: red; font-weight: bold;">${s.scoreFinal}</td>
              <td align="center">${s.cluster === 'hatmam' ? 'Hạt mầm tự chủ' : 'Mầm xanh tĩnh tâm'}</td>
              <td>${s.riskFactors.join('; ')}</td>
              <td>${s.assignedTutor || 'Chưa phân công'}</td>
              <td>${s.remedialPlan || 'Luyện đề nhận biết'}</td>
            </tr>
          `
            )
            .join('')}
        </table>

        <h3>III. Giải pháp nâng đỡ của Nhóm nghiên cứu & Tổ bộ môn:</h3>
        <p>1. Thực hiện nghiêm mô hình "Đôi bạn cùng tiến" và quy tắc Dừng 10 giây tĩnh tâm trước khi mở video ngắn.</p>
        <p>2. Đổi 15 phút tích cực (đọc sách, thể thao, nghe nhạc) mỗi ngày để tích dưỡng chất Cây Hạnh Phúc.</p>
        <p>3. Phối hợp phụ huynh học sinh quản lý thời gian sử dụng điện thoại và không mang điện thoại vào phòng ngủ.</p>
      </div>
    `;
    exportToWordDocument('Bao_Cao_Pho_Diem_Cay_Hanh_Phuc_THPT_Phan_Thanh_Gian', content);
  };

  return (
    <div
      className={`space-y-6 relative ${isDragging ? 'ring-4 ring-emerald-400 ring-offset-4 rounded-2xl' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden file input for uploading real Excel/CSV */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full mb-1 border border-teal-200">
            <Sprout className="w-3.5 h-3.5 text-teal-600" />
            <span>Đồng Bộ 6 Nhóm Cây Hạnh Phúc &amp; Phân Cụm DBSCAN</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Phân Tích Phổ Điểm &amp; Năng Lực Học Sinh
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Trường THPT Phan Thanh Giản • GV Hướng dẫn: Cô Nguyễn Thị Kiều Ân
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Replacement Button: Upload Real File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
            title="Tải lên file Excel (.xlsx, .xls) hoặc CSV bảng điểm thực tế của trường"
          >
            <Upload className="w-4 h-4" />
            <span>Tải file thực tế (Excel/CSV)</span>
          </button>

          {/* Download Sample Excel Template */}
          <button
            onClick={handleDownloadTemplate}
            className="bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Tải file mẫu Excel (.xlsx) chuẩn cấu trúc điểm khảo sát của tổ chuyên môn"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Tải file mẫu</span>
            <span className="sm:hidden">File mẫu</span>
          </button>

          {/* Reset to sample data */}
          <button
            onClick={handleResetSampleData}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Khôi phục lại dữ liệu mẫu 40 học sinh ban đầu"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Dữ liệu mẫu</span>
          </button>

          {/* Sync from Happy Tree Button */}
          <button
            onClick={() => handleSyncWithHappyTree(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
            title="Đồng bộ điểm dinh dưỡng, cấp độ và điểm thưởng kiểm tra thường xuyên từ Cây Hạnh Phúc"
          >
            <Sprout className="w-4 h-4 text-emerald-200" />
            <span>Đồng bộ Cây Hạnh Phúc</span>
          </button>

          {/* Export Word Report */}
          <button
            onClick={handleExportWordReport}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo cáo Word</span>
          </button>

          {/* Export TikZ LaTeX Button */}
          <button
            onClick={() => {
              setSelectedTikzChartId('score-spectrum');
              setIsTikzModalOpen(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
            title="Xuất các biểu đồ & sơ đồ phân tích điểm số sang định dạng mã nguồn TikZ (LaTeX) chuyên nghiệp"
          >
            <FileCode className="w-4 h-4 text-indigo-200" />
            <span>Xuất TikZ (LaTeX)</span>
          </button>
        </div>
      </div>

      {/* Live Happy Tree Synchronization Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-2 border-emerald-300 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
            <Sprout className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-900 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                ĐỒNG BỘ ĐIỂM TỪ CÂY HẠNH PHÚC
              </span>
              <span className="text-xs text-slate-500 font-mono font-bold">
                {syncStats?.timestamp ? `Cập nhật: ${syncStats.timestamp}` : 'Đã kết nối trực tiếp'}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              Đã liên kết <strong className="text-emerald-700 font-black">{syncStats?.syncedCount || students.length}</strong> học sinh • 
              Tổng dinh dưỡng Cây: <strong className="text-emerald-700 font-black">{syncStats?.totalTreePoints || students.reduce((acc, s) => acc + (s.happyTreePoints || 0), 0)} điểm CP</strong> • 
              Điểm TX thưởng đã cộng: <strong className="text-blue-700 font-black">+{syncStats?.totalBonusTxAdded || students.reduce((acc, s) => acc + (s.bonusPointsFromTree || 0), 0)}đ</strong>
              {syncStats && syncStats.rescuedCount > 0 && (
                <span className="ml-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {syncStats.rescuedCount} học sinh thoát liệt
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSyncWithHappyTree(true)}
          className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Đồng bộ ngay</span>
        </button>
      </div>

      {/* Real File Imported Alert & Stats Banner */}
      {importedFileName && importStats && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Dữ liệu thực tế đang kích hoạt
                </span>
                <span className="text-xs text-slate-600 font-mono font-medium">
                  {importedFileName}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-semibold mt-1">
                Đã nạp <strong className="text-emerald-700 font-black">{importStats.total}</strong> học sinh • Hạt mầm: <strong className="text-red-700">{importStats.hatmam}</strong> • Mầm xanh: <strong className="text-amber-700">{importStats.mamxanh}</strong> • Chồi non: <strong className="text-blue-700">{importStats.choinon}</strong> • Lá xanh: <strong className="text-emerald-700">{importStats.la}</strong> • Hoa thơm: <strong className="text-purple-700">{importStats.hoa}</strong> • Trái ngọt: <strong className="text-orange-700">{importStats.trai}</strong> {importStats.liet > 0 && <span className="text-red-600 font-black">({importStats.liet} em &le; 1.5đ)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs bg-white border border-emerald-400 text-emerald-800 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-50 transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Đổi file khác</span>
            </button>
            <button
              onClick={handleResetSampleData}
              className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-50 transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>Về dữ liệu mẫu</span>
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Overlay Indicator */}
      {isDragging && (
        <div className="border-2 border-dashed border-emerald-500 bg-emerald-50/80 p-8 rounded-2xl text-center text-emerald-800 font-bold text-sm flex flex-col items-center justify-center space-y-2">
          <Upload className="w-8 h-8 text-emerald-600 animate-bounce" />
          <span>Thả file Excel (.xlsx, .xls) hoặc CSV vào đây để tải dữ liệu điểm thực tế</span>
        </div>
      )}

      {/* 6 Nhóm Đồng Bộ Cây Hạnh Phúc KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Hạt mầm tự chủ */}
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
              <span>🌱 Hạt mầm</span>
            </span>
            {lietDirectCount > 0 && (
              <span className="bg-rose-600 text-white text-[9px] px-1 py-0.2 rounded font-black">
                {lietDirectCount} Liệt
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
            {hatmamCount}{' '}
            <span className="text-xs font-semibold text-rose-500">
              ({((hatmamCount / (students.length || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-rose-800">Điểm &le; 2.0 • Xem &gt;90p</div>
        </div>

        {/* 2. Mầm xanh tĩnh tâm */}
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            🌿 Mầm xanh
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
            {mamxanhCount}{' '}
            <span className="text-xs font-semibold text-amber-600">
              ({((mamxanhCount / (students.length || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-amber-800">Điểm 2.1-3.5 • Dừng 10s</div>
        </div>

        {/* 3. Chồi non cân bằng */}
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
            🌲 Chồi non
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">
            {choinonCount}{' '}
            <span className="text-xs font-semibold text-blue-600">
              ({((choinonCount / (students.length || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-blue-800">Điểm 3.6-4.8 • Đổi 15p</div>
        </div>

        {/* 4. Lá xanh vững vàng */}
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            🍃 Lá xanh
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
            {laCount}{' '}
            <span className="text-xs font-semibold text-emerald-600">
              ({((laCount / (students.length || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-800">Điểm 5.0-6.2 • Vững vàng</div>
        </div>

        {/* 5. Hoa thơm bản lĩnh */}
        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 shadow-xs">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
            🌸 Hoa thơm
          </span>
          <div className="text-xl sm:text-2xl font-black text-purple-700 mt-1">
            {hoaCount}{' '}
            <span className="text-xs font-semibold text-purple-600">
              ({((hoaCount / (students.length || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-purple-800">Điểm 6.5-7.8 • Bản lĩnh</div>
        </div>

        {/* 6. Trái ngọt */}
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 shadow-xs">
          <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">
            🍎 Trái ngọt
          </span>
          <div className="text-xl sm:text-2xl font-black text-orange-700 mt-1">
            {traiCount}{' '}
            <span className="text-xs font-semibold text-orange-600">
              ({((traiCount / (students.length || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-orange-800">Điểm &ge; 8.0 • Sứ giả</div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phổ điểm Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Biểu Đồ Phổ Điểm Khảo Sát Tốt Nghiệp
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phân bố số lượng học sinh theo từng khoảng điểm môn Toán
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedTikzChartId('score-spectrum');
                  setIsTikzModalOpen(true);
                }}
                className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
                title="Xuất biểu đồ phổ điểm này sang mã nguồn TikZ (pgfplots)"
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Xuất TikZ</span>
              </button>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                Thang điểm 10
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <canvas ref={barChartRef} />
          </div>
        </div>

        {/* Gom cụm DBSCAN Doughnut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Tỷ Lệ Phân Cụm DBSCAN</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tối ưu chiến lược can thiệp sư phạm</p>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => {
                  setSelectedTikzChartId('cluster-donut');
                  setIsTikzModalOpen(true);
                }}
                className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
                title="Xuất biểu đồ tròn vành khăn sang mã TikZ"
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>TikZ Tròn</span>
              </button>
              <button
                onClick={() => {
                  setSelectedTikzChartId('dbscan-scatter');
                  setIsTikzModalOpen(true);
                }}
                className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
                title="Xuất biểu đồ phân tán tọa độ gom cụm DBSCAN sang mã TikZ"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>TikZ 2D</span>
              </button>
            </div>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <canvas ref={doughnutChartRef} />
          </div>
          <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Mô hình phân tán 2D mật độ</span>
            <button
              onClick={() => setActiveSubTab('dbscan')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition cursor-pointer"
            >
              <span>Xem biểu đồ 2D DBSCAN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'list', label: 'Bảng Điểm & Gom Cụm', icon: Users },
              { id: 'dbscan', label: 'Biểu Đồ Phân Cụm DBSCAN 2D', icon: Brain, badge: 'DBSCAN AI' },
              { id: 'tutors', label: 'Mô Hình "Đôi Bạn Cùng Tiến"', icon: Users },
              { id: 'matrix', label: 'Ma Trận Đề Chống Liệt (Bộ GD)', icon: BookOpen },
              { id: 'ai-report', label: 'Khuyến Nghị Sư Phạm AI', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search and Cluster Filter */}
          {activeSubTab === 'list' && (
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Tìm tên hoặc mã học sinh..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <select
                value={selectedClusterFilter}
                onChange={(e) => setSelectedClusterFilter(e.target.value as any)}
                className="text-xs border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-hidden bg-white"
              >
                <option value="all">Tất cả ({students.length})</option>
                <option value="hatmam">🌱 Hạt mầm tự chủ ({hatmamCount})</option>
                <option value="mamxanh">🌿 Mầm xanh tĩnh tâm ({mamxanhCount})</option>
                <option value="choinon">🌲 Chồi non cân bằng ({choinonCount})</option>
                <option value="la">🍃 Lá xanh vững vàng ({laCount})</option>
                <option value="hoa">🌸 Hoa thơm bản lĩnh ({hoaCount})</option>
                <option value="trai">🍎 Trái ngọt ({traiCount})</option>
              </select>
            </div>
          )}
        </div>

        {/* SUB-TAB 1: BẢNG DANH SÁCH HỌC SINH */}
        {activeSubTab === 'list' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-y border-slate-200">
                  <th className="py-3 px-3">Mã HS</th>
                  <th className="py-3 px-3">Họ và Tên</th>
                  <th className="py-3 px-3">Lớp</th>
                  <th className="py-3 px-3 text-center">TX (Hệ 1)</th>
                  <th className="py-3 px-3 text-center">GK (Hệ 2)</th>
                  <th className="py-3 px-3 text-center">Thi Khảo Sát</th>
                  <th className="py-3 px-3">Phân loại DBSCAN</th>
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-rose-500" />
                      <span>Video Ngắn / Khuya</span>
                    </div>
                  </th>
                  <th className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cây Hạnh Phúc</span>
                    </div>
                  </th>
                  <th className="py-3 px-3">Vấn đề kiến thức</th>
                  <th className="py-3 px-3">Đôi bạn kèm cặp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => {
                  const screenTime = st.screenTimeMinutes ?? 45;
                  const lateNight = st.lateNightSessions ?? 0;
                  const isHighScreen = screenTime > 75 || lateNight >= 3;
                  const isSafeScreen = screenTime <= 45 && lateNight <= 1;

                  const stageMap: Record<string, { label: string; bg: string; text: string }> = {
                    hatmam: { label: 'Hạt mầm (Cấp 1)', bg: 'bg-amber-100', text: 'text-amber-800' },
                    mamxanh: { label: 'Mầm xanh (Cấp 2)', bg: 'bg-lime-100', text: 'text-lime-800' },
                    choinon: { label: 'Chồi non (Cấp 3)', bg: 'bg-emerald-100', text: 'text-emerald-800' },
                    la: { label: 'Lá xanh (Cấp 4)', bg: 'bg-teal-100', text: 'text-teal-800' },
                    hoa: { label: 'Hoa thơm (Cấp 5)', bg: 'bg-pink-100', text: 'text-pink-800' },
                    trai: { label: 'Trái ngọt (Cấp 6)', bg: 'bg-purple-100', text: 'text-purple-800' },
                  };
                  const stageInfo = stageMap[st.happyTreeStage || 'hatmam'] || stageMap.hatmam;

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-slate-50 transition ${
                        st.cluster === 'nguyco' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-semibold text-slate-500">{st.id}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {st.name}
                        {st.scoreFinal <= 1.5 && (
                          <span className="ml-1.5 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black animate-pulse">
                            LIỆT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{st.className}</td>
                      <td className="py-3 px-3 text-center font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold">{st.score1}</span>
                          {st.bonusPointsFromTree !== undefined && st.bonusPointsFromTree > 0 && (
                            <span
                              className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300 shadow-2xs"
                              title={`Đã cộng +${st.bonusPointsFromTree}đ TX quy đổi từ Cây Hạnh Phúc`}
                            >
                              +{st.bonusPointsFromTree}đ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-medium">{st.score2}</td>
                      <td className="py-3 px-3 text-center font-black">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            st.scoreFinal >= 7.0
                              ? 'text-emerald-700 bg-emerald-100'
                              : st.scoreFinal >= 4.5
                              ? 'text-blue-700 bg-blue-100'
                              : 'text-red-700 bg-red-100'
                          }`}
                        >
                          {st.scoreFinal} đ
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {st.cluster === 'hatmam' && (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🌱 Hạt mầm tự chủ
                          </span>
                        )}
                        {st.cluster === 'mamxanh' && (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🌿 Mầm xanh tĩnh tâm
                          </span>
                        )}
                        {st.cluster === 'choinon' && (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🌲 Chồi non cân bằng
                          </span>
                        )}
                        {st.cluster === 'la' && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🍃 Lá xanh vững vàng
                          </span>
                        )}
                        {st.cluster === 'hoa' && (
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🌸 Hoa thơm bản lĩnh
                          </span>
                        )}
                        {st.cluster === 'trai' && (
                          <span className="text-[11px] font-bold text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🍎 Trái ngọt
                          </span>
                        )}
                        {st.cluster === 'muinhon' && (
                          <span className="text-[11px] font-bold text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🍎 Trái ngọt
                          </span>
                        )}
                        {st.cluster === 'antoan' && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🍃 Lá xanh vững vàng
                          </span>
                        )}
                        {st.cluster === 'nguyco' && (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🌱 Hạt mầm tự chủ
                          </span>
                        )}
                      </td>
                      {/* Short-Video Screen Time & Late Night sessions */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                              isHighScreen
                                ? 'text-rose-700 font-extrabold'
                                : isSafeScreen
                                ? 'text-emerald-700 font-semibold'
                                : 'text-amber-700'
                            }`}
                          >
                            <Smartphone className="w-3 h-3 shrink-0" />
                            <span>{screenTime}p/ngày</span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] ${
                              lateNight >= 3
                                ? 'text-rose-600 font-bold'
                                : lateNight > 0
                                ? 'text-slate-500'
                                : 'text-slate-400'
                            }`}
                          >
                            <Moon className="w-2.5 h-2.5 shrink-0" />
                            <span>{lateNight > 0 ? `${lateNight} đêm thức khuya` : 'Giấc ngủ điều độ'}</span>
                          </span>
                        </div>
                      </td>
                      {/* Happy Tree Stage & Nutrition Points */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stageInfo.bg} ${stageInfo.text}`}
                            >
                              {stageInfo.label}
                            </span>
                            {st.happyTreePoints !== undefined && (
                              <span className="text-[11px] font-mono font-black text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-200">
                                {st.happyTreePoints}đ CP
                              </span>
                            )}
                          </div>
                          {st.happyTreeTicksCount !== undefined && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Đạt {st.happyTreeTicksCount}/6 ô tick sinh trưởng
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs">
                        {st.riskFactors.length > 0 ? (
                          <span className="text-red-700 text-[11px] font-medium">
                            {st.riskFactors.join(', ')}
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-[11px]">Đạt chuẩn tốt</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-800">
                        {st.assignedTutor ? `Kèm bởi: ${st.assignedTutor}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB-TAB: BIỂU ĐỒ PHÂN CỤM DBSCAN 2D */}
        {activeSubTab === 'dbscan' && (
          <DbscanClusteringChart
            students={students}
            onExportTikz={() => {
              setSelectedTikzChartId('dbscan-scatter');
              setIsTikzModalOpen(true);
            }}
          />
        )}

        {/* SUB-TAB 2: ĐÔI BẠN CÙNG TIẾN */}
        {activeSubTab === 'tutors' && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 leading-relaxed">
                <strong>Mô hình "Đôi bạn cùng tiến":</strong> Hệ thống AI tự động bắt cặp học sinh
                nhóm Mũi nhọn (điểm từ 7.5 - 8.8) với học sinh nhóm Nguy cơ liệt (điểm &le; 3.0). Mỗi
                ngày hai em ngồi cùng bàn, bạn khá hướng dẫn bạn yếu giải 5 bài tập nhận biết cơ bản
                vào 15 phút đầu giờ.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students
                .filter((s) => s.cluster === 'nguyco')
                .map((weak, idx) => (
                  <div
                    key={weak.id}
                    className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-400 transition shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        Cặp đôi hỗ trợ #{idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        Cần can thiệp
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {/* Học sinh yếu */}
                      <div className="p-3 rounded-xl bg-red-50/70 border border-red-100">
                        <span className="text-[10px] font-bold text-red-600 uppercase">
                          Học sinh được kèm
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{weak.name}</h4>
                        <p className="text-xs text-red-700 font-extrabold mt-1">
                          Điểm thi: {weak.scoreFinal} đ
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                          {weak.riskFactors[0] || 'Yếu công thức căn bản'}
                        </p>
                      </div>

                      {/* Học sinh kèm */}
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">
                          Học sinh trợ giảng (Khá/Giỏi)
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                          {weak.assignedTutor || 'Nguyễn Hoàng Anh'}
                        </h4>
                        <p className="text-xs text-emerald-700 font-extrabold mt-1">
                          Điểm thi: 8.5+ đ
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Nhiệm vụ: Chữa 5 câu nhận biết/ngày
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Giáo viên giám sát:</span>{' '}
                      {weak.assignedTeacher || 'Nguyễn Văn Tâm'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* SUB-TAB 3: MA TRẬN ĐỀ CHỐNG LIỆT */}
        {activeSubTab === 'matrix' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 leading-relaxed">
              <strong>Khung ma trận chống điểm liệt môn Toán Khối 12:</strong> Tập trung tối đa 25 -
              28 câu hỏi ở mức độ <strong>Nhận biết (4.0 điểm)</strong> và{' '}
              <strong>Thông hiểu (2.0 điểm)</strong>. Học sinh chỉ cần làm đúng phần này là đạt từ
              5.0 - 6.0 điểm, tuyệt đối không bị điểm liệt (&le; 1.0).
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-3 border-r border-slate-300">Chủ đề kiến thức</th>
                    <th className="p-3 border-r border-slate-300 text-center">Số câu Nhận biết (1)</th>
                    <th className="p-3 border-r border-slate-300 text-center">Số câu Thông hiểu (2)</th>
                    <th className="p-3 border-r border-slate-300 text-center">Tổng điểm mục tiêu</th>
                    <th className="p-3">Kỹ năng cốt lõi cần rèn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-semibold border-r border-slate-200">
                      1. Hàm số và Đồ thị (Khảo sát)
                    </td>
                    <td className="p-3 text-center font-bold text-blue-600 border-r border-slate-200">
                      06 câu
                    </td>
                    <td className="p-3 text-center font-bold text-blue-600 border-r border-slate-200">
                      03 câu
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700 border-r border-slate-200">
                      1.8 điểm
                    </td>
                    <td className="p-3 text-slate-600">
                      Nhận diện đường tiệm cận, điểm cực trị từ bảng biến thiên; nhận dạng đồ thị hàm
                      bậc 3, bậc 4 trùng phương.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold border-r border-slate-200">
                      2. Luỹ thừa, Mũ và Logarit
                    </td>
                    <td className="p-3 text-center font-bold text-blue-600 border-r border-slate-200">
                      05 câu
                    </td>
                    <td className="p-3 text-center font-bold text-blue-600 border-r border-slate-200">
                      02 câu
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700 border-r border-slate-200">
                      1.4 điểm
                    </td>
                    <td className="p-3 text-slate-600">
                      Tập xác định logarit, công thức biến đổi loga, giải phương trình mũ cơ bản a^x = b.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold border-r border-slate-200">
                      3. Nguyên hàm - Tích phân
                    </td>
                    <td className="p-3 text-center font-bold text-blue-600 border-r border-slate-200">
                      04 câu
                    </td>
                    <td className="p-3 text-center font-bold text-blue-600 border-r border-slate-200">
                      02 câu
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700 border-r border-slate-200">
                      1.2 điểm
                    </td>
                    <td className="p-3 text-slate-600">
                      Bảng nguyên hàm cơ bản, tính tích phân bằng máy tính cầm tay Casio fx-580VNX.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold border-r border-slate-200">
                      4. Tọa độ Oxyz trong không gian
                    </td>
                    <td className="p-3 text-center font-bold text-blue-600 border-r border-slate-200">
                      05 câu
                    </td>
                    <td className="p-3 text-center font-bold text-blue-600 border-r border-slate-200">
                      02 câu
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700 border-r border-slate-200">
                      1.4 điểm
                    </td>
                    <td className="p-3 text-slate-600">
                      Tọa độ điểm, vectơ, tâm và bán kính mặt cầu (S), vectơ pháp tuyến mặt phẳng (P).
                    </td>
                  </tr>
                  <tr className="bg-emerald-50 font-bold">
                    <td className="p-3 border-r border-slate-300">TỔNG CỘNG CHỐNG LIỆT</td>
                    <td className="p-3 text-center border-r border-slate-300 text-emerald-800">
                      20 CÂU
                    </td>
                    <td className="p-3 text-center border-r border-slate-300 text-emerald-800">
                      09 CÂU
                    </td>
                    <td className="p-3 text-center border-r border-slate-300 text-emerald-800 text-sm">
                      5.8 ĐIỂM
                    </td>
                    <td className="p-3 text-emerald-900">
                      Vượt ngưỡng an toàn, tỷ lệ đỗ tốt nghiệp môn Toán &gt; 98%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-TAB 4: KHUYẾN NGHỊ SƯ PHẠM AI */}
        {activeSubTab === 'ai-report' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200">
              <div className="flex items-center space-x-2 text-purple-900 font-bold text-sm mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>CHẨN ĐOÁN AI LIÊN KẾT: TƯƠNG QUAN VIDEO NGẮN, TÂM LÝ & NGUY CƠ ĐIỂM LIỆT</span>
              </div>
              <p className="text-xs text-purple-950 leading-relaxed">
                Phân tích gom cụm DBSCAN kết hợp thói quen sử dụng thiết bị số của 40 học sinh cho thấy:{' '}
                <strong>87.5% học sinh thuộc Cụm Nguy cơ liệt (&le; 3.5đ)</strong> xem video ngắn trên{' '}
                <strong>85 phút/ngày</strong> và có ít nhất <strong>3-6 đêm thức sau 23:00</strong> lướt TikTok/Shorts.
                Vòng lặp Dopamine ngắn hạn khiến não bộ mất kiên nhẫn khi đọc đề bài có lời văn &gt; 3 dòng. Ngược lại,{' '}
                <strong>100% học sinh nhóm Mũi nhọn</strong> đạt cấp độ Cây Hạnh Phúc từ{' '}
                <em>"Lá xanh"</em> trở lên và giữ thời lượng màn hình &le; 40 phút/ngày.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs uppercase text-blue-700">
                    Quy tắc "Dừng 10s & Đổi 15p"
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Thay vì cấm đoán điện thoại, hướng dẫn học sinh bấm <strong>Dừng 10 giây</strong> hít thở trước khi mở app, và hoán đổi{' '}
                  <strong>15 phút lướt video</strong> thành 15 phút giải 10 câu nhận biết Casio fx-580VNX. Tích ngay +3 điểm dinh dưỡng vào Cây Hạnh Phúc.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs uppercase text-emerald-700">
                    Giờ giới nghiêm số sau 22:30
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Khảo sát cho thấy học sinh thức khuya lướt mạng giảm 40% khả năng tính toán chuẩn xác vào buổi sáng hôm sau.
                  Tổ chuyên môn phối hợp cùng phụ huynh bật chế độ "Không làm phiền", cam kết không mang điện thoại vào giường ngủ.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs uppercase text-rose-700">
                    Kèm cặp kép: Kiến thức & Cai nghiện
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đối với trường hợp em Dương Văn Khang (1.2đ, 145p/ngày, 6 đêm thức khuya), phân công bạn Thảo Như (Sứ giả Hạnh phúc, 8.8đ)
                  nhắc nhở qua Zalo lúc 21h45 và cùng làm bộ phiếu trắc nghiệm nhận biết 10 câu để bảo vệ điểm học bạ.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TikZ LaTeX Chart Export Modal */}
      <ChartTikzExportModal
        isOpen={isTikzModalOpen}
        onClose={() => setIsTikzModalOpen(false)}
        initialChartId={selectedTikzChartId}
        students={students}
      />
    </div>
  );
};
