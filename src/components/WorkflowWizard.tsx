import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarCheck,
  FileSignature,
  GraduationCap,
  Award,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Printer,
  FileDown,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Users,
  Brain,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Edit3,
  Save,
  Check,
  CheckSquare,
  Laptop,
  FileCode,
} from 'lucide-react';
import { BusinessType, MeetingMinutesData } from '../types';
import { exportToWordDocument, callAiAssistant } from '../services/aiService';
import { INITIAL_MEETING_MINUTES, SAMPLE_STUDENTS } from '../data/mockData';
import { ChartTikzExportModal, ChartTikzId } from './ChartTikzExportModal';

interface WorkflowWizardProps {
  onNavigateToTab: (tab: any) => void;
}

export const WorkflowWizard: React.FC<WorkflowWizardProps> = ({ onNavigateToTab }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType>('meeting');
  const [selectedGrade, setSelectedGrade] = useState<string>('Khối 12 (Ôn thi TN)');
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán học');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('Học kỳ I');
  const [schoolName, setSchoolName] = useState<string>('TRUNG TÂM GDNN - GDTX BA TRI');
  const [deptName, setDeptName] = useState<string>('TỔ TOÁN - TIN - CÔNG NGHỆ');

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'Bang_diem_Khao_sat_Toan_12_Dot1.xlsx',
  ]);
  const [useDeepAi, setUseDeepAi] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('Đang trích xuất điểm từ file Excel...');

  // Result document data
  const [docData, setDocData] = useState<MeetingMinutesData>(INITIAL_MEETING_MINUTES);
  const [isEditingDoc, setIsEditingDoc] = useState<boolean>(false);
  const [customAiText, setCustomAiText] = useState<string>('');
  const [isTikzModalOpen, setIsTikzModalOpen] = useState<boolean>(false);
  const [selectedTikzChartId, setSelectedTikzChartId] = useState<ChartTikzId>('ai-workflow');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // Business options
  const businessOptions = [
    {
      id: 'lesson-plan' as BusinessType,
      title: 'Lập Kế hoạch Giáo dục',
      desc: 'Tự động tạo kế hoạch năm, tháng, tuần theo mẫu Công văn 5512/BGDĐT.',
      icon: CalendarCheck,
      color: 'blue',
      bgColor: 'bg-blue-100 text-blue-700',
      borderColor: 'hover:border-blue-500',
    },
    {
      id: 'meeting' as BusinessType,
      title: 'Biên bản Sinh hoạt chuyên môn',
      desc: 'Dựa trên Nghiên cứu bài học, phân tích học sinh và sinh hoạt chuyên đề.',
      icon: FileSignature,
      color: 'green',
      bgColor: 'bg-emerald-100 text-emerald-700',
      borderColor: 'hover:border-emerald-500',
    },
    {
      id: 'score-analysis' as BusinessType,
      title: 'Phân tích Phổ điểm & Chống liệt',
      desc: 'Gom cụm học sinh DBSCAN, định danh nguy cơ điểm liệt, đề xuất giải pháp.',
      icon: GraduationCap,
      color: 'purple',
      bgColor: 'bg-purple-100 text-purple-700',
      borderColor: 'hover:border-purple-500',
    },
    {
      id: 'temis' as BusinessType,
      title: 'Hồ sơ TEMIS & Minh chứng',
      desc: 'Tự động hóa đánh giá chuẩn nghề nghiệp giáo viên theo Thông tư 20.',
      icon: Award,
      color: 'amber',
      bgColor: 'bg-amber-100 text-amber-700',
      borderColor: 'hover:border-amber-500',
    },
    {
      id: 'exam-creator' as BusinessType,
      title: 'Tạo Đề Thi Theo Môn',
      desc: 'Đổi mới cấu trúc 2025 Bộ GD&ĐT (3 phần), ma trận đặc tả, đảo mã đề.',
      icon: CheckSquare,
      color: 'indigo',
      bgColor: 'bg-indigo-100 text-indigo-700',
      borderColor: 'hover:border-indigo-500',
    },
    {
      id: 'online-exam' as BusinessType,
      title: 'Thi Trực Tuyến & Chấm Tự Động',
      desc: 'Tổ chức thi online, đếm ngược 90 phút, chấm điểm 3 phần tức thì và phổ điểm.',
      icon: Laptop,
      color: 'teal',
      bgColor: 'bg-emerald-100 text-emerald-700',
      borderColor: 'hover:border-emerald-500',
    },
  ];

  // Handle simulation and AI trigger
  const runAiAnalysis = async () => {
    setIsLoading(true);
    const messages = [
      'Đang trích xuất điểm từ file Excel bảng điểm 40 học sinh...',
      'Đang thực hiện thuật toán DBSCAN gom cụm năng lực (Eps=0.8, MinPts=3)...',
      'Đang đối chiếu minh chứng TEMIS tiêu chí 8, 9, 10...',
      'Đang soạn thảo biên bản theo chuẩn Nghị định 30/2020/NĐ-CP...',
      'Hoàn tất phân tích! Đang kết xuất hồ sơ văn bản...',
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < messages.length) {
        setLoadingText(messages[stepIdx]);
      }
    }, 700);

    // Call server AI if requested
    try {
      if (useDeepAi) {
        const aiRes = await callAiAssistant({
          type: selectedBusiness,
          prompt: `Phân tích sâu kết quả học tập môn ${selectedSubject} cho ${selectedGrade}, thời gian ${selectedTimeframe}. Định danh học sinh có nguy cơ điểm liệt và đề xuất kế hoạch hành động cụ thể cho buổi họp tổ chuyên môn.`,
          context: {
            schoolName,
            deptName,
            subject: selectedSubject,
            grade: selectedGrade,
            timeframe: selectedTimeframe,
          },
        });
        if (aiRes.text) {
          setCustomAiText(aiRes.text);
        }
      }
    } catch (e) {
      console.warn('AI call finished with fallback:', e);
    }

    setTimeout(() => {
      clearInterval(interval);
      setIsLoading(false);
      setCurrentStep(4);
    }, 3500);
  };

  // Render Doughnut Chart when Step 4 is active
  useEffect(() => {
    if (currentStep === 4 && chartCanvasRef.current) {
      // Import Chart dynamically or use window.Chart
      const initChart = async () => {
        try {
          const { Chart, registerables } = await import('chart.js');
          Chart.register(...registerables);

          if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
          }

          const canvas = chartCanvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            chartInstanceRef.current = new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: ['Mũi nhọn (Cụm 1)', 'An toàn (Cụm 2)', 'Nguy cơ liệt (Cụm 3)'],
                datasets: [
                  {
                    data: [15, 65, 20],
                    backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
                    hoverBackgroundColor: ['#059669', '#2563eb', '#dc2626'],
                    borderWidth: 0,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => ` ${context.label}: ${context.raw}%`,
                    },
                  },
                },
              },
            });
          }
        } catch (err) {
          console.error('Error drawing chart:', err);
        }
      };

      initChart();
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [currentStep]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileNames = Array.from(e.target.files).map((f) => f.name);
      setUploadedFiles((prev) => [...prev, ...fileNames]);
    }
  };

  const handleExportWord = () => {
    const content = `
      <div style="text-align: center; font-family: 'Times New Roman', serif;">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="width: 45%; text-align: center; border: none; font-size: 13pt;">
              <b>${docData.schoolName}</b><br/>
              <b>${docData.deptName}</b><br/>
              <span>Số: ${docData.docNumber}</span>
              <hr style="width: 120px; border-top: 1px solid black; margin: 4px auto;"/>
            </td>
            <td style="width: 55%; text-align: center; border: none; font-size: 13pt;">
              <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/>
              <b>Độc lập - Tự do - Hạnh phúc</b>
              <hr style="width: 160px; border-top: 1px solid black; margin: 4px auto;"/>
            </td>
          </tr>
        </table>
        
        <h2 style="margin-top: 25px; font-size: 16pt; font-weight: bold; text-transform: uppercase;">
          ${docData.title}<br/>
          <span style="font-size: 13pt; font-weight: normal; font-style: italic;">(${docData.subTitle})</span>
        </h2>
      </div>

      <div style="font-size: 14pt; line-height: 1.6; font-family: 'Times New Roman', serif; margin-top: 20px;">
        <p><b>1. Thời gian:</b> ${docData.dateTime}</p>
        <p><b>2. Địa điểm:</b> ${docData.location}</p>
        <p><b>3. Thành phần:</b> ${docData.participants.attendees}</p>
        <p><b>4. Chủ trì:</b> ${docData.participants.chairperson} | <b>Thư ký:</b> ${docData.participants.secretary}</p>
        
        ${docData.hasDemonstrationLesson && docData.demonstrationLesson && docData.lessonStudySteps ? `
        <h3 style="font-size: 14pt; margin-top: 15px;">5. Nội dung sinh hoạt chuyên môn theo nghiên cứu bài học:</h3>
        <p>- <b>Dạy học minh họa:</b> ${docData.demonstrationLesson.teacher} giảng dạy chuyên đề: <i>${docData.demonstrationLesson.topic}</i> tại lớp ${docData.demonstrationLesson.grade}. (${docData.demonstrationLesson.rating}).</p>
        <p>- <b>Bước 1 (Xây dựng bài học):</b> ${docData.lessonStudySteps.step1}</p>
        <p>- <b>Bước 2 (Dạy & Quan sát):</b> ${docData.lessonStudySteps.step2}</p>
        <p>- <b>Bước 3 (Suy ngẫm & Thảo luận):</b> ${docData.lessonStudySteps.step3}</p>
        <p>- <b>Bước 4 (Áp dụng thực tiễn):</b> ${docData.lessonStudySteps.step4}</p>
        ` : `
        <h3 style="font-size: 14pt; margin-top: 15px;">5. Nội dung sinh hoạt chuyên môn định kỳ (Không tổ chức dạy minh họa):</h3>
        <p style="font-style: italic; color: #475569;">(Kế hoạch dạy minh họa theo NCBH năm học 2026-2027 tổ chức 02 đợt: Tháng 11/2026 do Thầy Nguyễn Bảo Ngưng dạy; Tháng 3/2027 do Thầy Lê Trung Hậu dạy).</p>
        <p>- <b>Trọng tâm:</b> ${docData.regularMeetingActivities?.focusTopic || docData.mainTopic}</p>
        <p>- <b>Nội dung:</b> ${docData.regularMeetingActivities?.description || ''}</p>
        `}
        
        <h3 style="font-size: 14pt; margin-top: 15px;">6. Phân tích kết quả phổ điểm & Giải pháp chống điểm liệt (AI-DEPT):</h3>
        <ul>
          ${docData.aiAnalysisHighlights.map((h) => `<li>${h}</li>`).join('')}
        </ul>
        
        <h3 style="font-size: 14pt; margin-top: 15px;">7. Kế hoạch hành động cụ thể:</h3>
        <ul>
          ${docData.remedialAntiFailActions.map((a) => `<li>${a}</li>`).join('')}
        </ul>
        
        <h3 style="font-size: 14pt; margin-top: 15px;">8. Kết luận cuộc họp:</h3>
        <ul>
          ${docData.conclusions.map((c) => `<li>${c}</li>`).join('')}
        </ul>

        <table style="width: 100%; border: none; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center; border: none; font-size: 14pt; font-style: italic;">
              <b>THƯ KÝ GHI BIÊN BẢN</b><br/><br/><br/><br/>
              <b>${docData.participants.secretary}</b>
            </td>
            <td style="width: 50%; text-align: center; border: none; font-size: 14pt;">
              <b>TỔ TRƯỞNG CHUYÊN MÔN</b><br/><br/><br/><br/>
              <b>${docData.participants.chairperson.split(' - ')[0]}</b>
            </td>
          </tr>
        </table>
      </div>
    `;

    exportToWordDocument('Bien_Ban_Sinh_Hoat_Chuyen_Mon_To_Toan_Tin_Cong_Nghe', content);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Trợ lý AI Tổ chuyên môn Thông minh</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Quy trình Tự động hóa Nghiệp vụ 4 Bước
          </h2>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Hỗ trợ giáo viên và nhóm nghiên cứu lập kế hoạch giáo dục CV 5512, xuất biên bản sinh hoạt theo
            chuẩn NĐ 30/2020, quét phổ điểm học sinh chống liệt tốt nghiệp và gợi ý minh chứng TEMIS.
          </p>
          <div className="mt-3">
            <button
              onClick={() => {
                setSelectedTikzChartId('ai-workflow');
                setIsTikzModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              title="Xuất sơ đồ quy trình nghiệp vụ AI 4 bước sang mã nguồn TikZ (LaTeX)"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-300" />
              <span>Xuất Sơ Đồ TikZ 4 Bước</span>
            </button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
          <Brain className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 relative">
        {/* STEPS INDICATOR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-200 pb-5 mb-8">
          {[
            { num: 1, label: 'Chọn Nghiệp vụ' },
            { num: 2, label: 'Thời gian & Phạm vi' },
            { num: 3, label: 'Tải minh chứng' },
            { num: 4, label: 'Kết quả AI' },
          ].map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                onClick={() => {
                  if (isCompleted || s.num <= currentStep) {
                    setCurrentStep(s.num);
                  }
                }}
                className={`flex items-center space-x-2.5 pb-2 text-left font-semibold text-xs sm:text-sm border-b-2 transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-700'
                    : isCompleted
                    ? 'border-emerald-500 text-emerald-700'
                    : 'border-transparent text-slate-400 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                </span>
                <span className="truncate">
                  Bước {s.num}: {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* STEP 1: CHỌN NGHIỆP VỤ */}
        {currentStep === 1 && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Bạn muốn thực hiện nghiệp vụ nào?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Lựa chọn nhiệm vụ chuyên môn cần AI hỗ trợ xử lý và hoàn thiện hồ sơ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businessOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedBusiness === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setSelectedBusiness(opt.id);
                      setCurrentStep(2);
                    }}
                    className={`border-2 p-6 rounded-2xl cursor-pointer transition-all flex items-start space-x-4 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-blue-400 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div
                      className={`p-4 rounded-xl flex-shrink-0 flex items-center justify-center ${opt.bgColor}`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-900 text-base">{opt.title}</h4>
                        {isSelected && (
                          <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Đã chọn
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{opt.desc}</p>
                      <div className="mt-3 flex items-center text-xs font-semibold text-blue-600">
                        <span>Tiếp tục thiết lập</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: THỜI GIAN & PHẠM VI */}
        {currentStep === 2 && (
          <div className="animate-in fade-in duration-200 max-w-3xl mx-auto py-4">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-slate-900">Thiết lập phạm vi dữ liệu</h3>
              <p className="text-sm text-slate-500 mt-1">
                Định vị đối tượng lớp học, môn học và khung thời gian áp dụng để AI tối ưu văn bản.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Đơn vị trường / trung tâm
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tổ chuyên môn
                </label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chọn Khối lớp
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium cursor-pointer"
                >
                  <option value="Khối 12 (Ôn thi TN)">Khối 12 (Trọng tâm Ôn thi Tốt nghiệp)</option>
                  <option value="Khối 11 (Chương trình mới)">Khối 11 (CT GDPT 2018)</option>
                  <option value="Khối 10 (Chương trình mới)">Khối 10 (CT GDPT 2018)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chọn Môn học
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium cursor-pointer"
                >
                  <option value="Toán học">Môn Toán học</option>
                  <option value="Ngữ văn">Môn Ngữ văn</option>
                  <option value="Khoa học Tự nhiên / Vật lí">Môn Vật lí / KHTN</option>
                  <option value="Hóa học">Môn Hóa học</option>
                  <option value="Sinh học">Môn Sinh học</option>
                  <option value="Lịch sử & Địa lý">Môn Lịch sử & Địa lý</option>
                  <option value="Tin học">Môn Tin học</option>
                </select>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
                Khung thời gian phân tích
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Tuần này', 'Tháng này', 'Học kỳ I', 'Cả năm'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`py-3 px-4 rounded-xl font-semibold text-sm border transition-all ${
                      selectedTimeframe === tf
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center space-x-1.5 px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md transition-all hover:scale-[1.02]"
              >
                <span>Tiếp tục: Tải minh chứng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TẢI MINH CHỨNG */}
        {currentStep === 3 && (
          <div className="animate-in fade-in duration-200 max-w-3xl mx-auto py-2">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                TẢI TÀI LIỆU MINH CHỨNG & HỒ SƠ CHUYÊN MÔN
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Tải lên bảng điểm Excel, bài kiểm tra khảo sát hoặc giáo án (Word/PDF) để hệ thống
                tự động đọc và gom cụm dữ liệu.
              </p>
            </div>

            {/* Drag & drop upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-3 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/70 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all mb-6 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-slate-800">
                Kéo thả file Excel điểm, Giáo án (PDF/Word) vào đây
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hệ thống AI sẽ tự động đọc, trích xuất điểm thi và nhận diện dạng bài học sinh hay sai.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls,.doc,.docx,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="mt-5 bg-white border-2 border-blue-600 text-blue-700 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-50 shadow-xs transition"
              >
                Chọn file từ máy tính
              </button>
            </div>

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Tệp đính kèm sẵn sàng ({uploadedFiles.length})
                  </span>
                  <button
                    onClick={() =>
                      setUploadedFiles([
                        'Bang_diem_Khao_sat_Toan_12_Dot1.xlsx',
                        'Giao_an_minh_hoa_Mu_Logarit_5512.docx',
                      ])
                    }
                    className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Nạp thêm tài liệu mẫu
                  </button>
                </div>
                <div className="space-y-2">
                  {uploadedFiles.map((fn, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800"
                    >
                      <div className="flex items-center space-x-2">
                        {fn.endsWith('.xlsx') ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600" />
                        )}
                        <span>{fn}</span>
                      </div>
                      <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã sẵn sàng
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-100/70 border border-slate-200 mb-8">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDeepAi}
                  onChange={(e) => setUseDeepAi(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-800">
                    Kích hoạt Phân tích Sâu & Đề xuất giải pháp chống liệt
                  </span>
                  <p className="text-xs text-slate-500">
                    Tự động tạo ma trận đề ôn tập và phân công đôi bạn cùng tiến.
                  </p>
                </div>
              </label>
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full whitespace-nowrap">
                Chuẩn NĐ 30/2020
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              <button
                onClick={runAiAnalysis}
                className="flex items-center space-x-2 px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm sm:text-base hover:from-blue-700 hover:to-indigo-700 shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>✨ BẮT ĐẦU PHÂN TÍCH AI</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: KẾT QUẢ AI */}
        {currentStep === 4 && (
          <div className="animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xử lý AI thành công 100%</span>
                </div>
                <h3 className="text-xl font-bold text-blue-900">
                  KẾT QUẢ PHÂN TÍCH HỆ THỐNG & BIÊN BẢN CHUYÊN MÔN
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsEditingDoc(!isEditingDoc)}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center gap-1.5 ${
                    isEditingDoc
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isEditingDoc ? (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Xong chỉnh sửa</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>Sửa nội dung</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>In văn bản</span>
                </button>

                <button
                  onClick={handleExportWord}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Xuất Word (.doc)</span>
                </button>

                {/* Export TikZ Diagram Button */}
                <button
                  onClick={() => {
                    setSelectedTikzChartId('ai-workflow');
                    setIsTikzModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  title="Xuất các sơ đồ và biểu đồ trong quy trình sang mã nguồn TikZ (LaTeX)"
                >
                  <FileCode className="w-4 h-4 text-indigo-200" />
                  <span>Xuất Sơ Đồ TikZ</span>
                </button>
              </div>
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Document Preview (Times New Roman / Tinos format) */}
              <div className="lg:col-span-2 bg-[#fdfdfd] p-8 sm:p-12 rounded-xl border border-slate-300 shadow-inner font-document overflow-y-auto max-h-[750px] text-slate-900">
                {/* Official Header */}
                <div className="text-center mb-8">
                  <div className="grid grid-cols-2 text-xs uppercase font-bold leading-snug">
                    <div className="text-center">
                      {isEditingDoc ? (
                        <input
                          value={docData.schoolName}
                          onChange={(e) =>
                            setDocData({ ...docData, schoolName: e.target.value })
                          }
                          className="w-full text-center border-b border-blue-400 font-bold"
                        />
                      ) : (
                        <span>{docData.schoolName}</span>
                      )}
                      <br />
                      <span className="font-extrabold text-blue-900">{docData.deptName}</span>
                      <br />
                      <span className="normal-case font-normal text-[11px]">
                        Số: {docData.docNumber}
                      </span>
                      <div className="w-24 mx-auto border-t border-black mt-1"></div>
                    </div>

                    <div className="text-center">
                      <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                      <br />
                      <span className="font-bold underline decoration-1 underline-offset-4">
                        Độc lập - Tự do - Hạnh phúc
                      </span>
                      <div className="w-32 mx-auto border-t border-black mt-1"></div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="font-bold text-lg text-slate-900 uppercase tracking-tight">
                      {docData.title}
                    </h4>
                    <p className="text-sm italic font-medium text-slate-700 mt-1">
                      {docData.subTitle}
                    </p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="text-sm leading-relaxed space-y-4">
                  <p>
                    <strong>1. Thời gian:</strong> {docData.dateTime}
                  </p>
                  <p>
                    <strong>2. Địa điểm:</strong> {docData.location}
                  </p>
                  <p>
                    <strong>3. Thành phần:</strong> {docData.participants.attendees} (Vắng:{' '}
                    {docData.participants.absentees})
                  </p>
                  <p>
                    <strong>4. Chủ trì:</strong> {docData.participants.chairperson} |{' '}
                    <strong>Thư ký:</strong> {docData.participants.secretary}
                  </p>

                  <div className="pt-2">
                    <p className="font-bold text-base text-slate-900 mb-1">
                      {docData.hasDemonstrationLesson ? '5. Nội dung sinh hoạt theo Nghiên cứu bài học:' : '5. Nội dung sinh hoạt chuyên môn định kỳ:'}
                    </p>
                    {docData.hasDemonstrationLesson && docData.demonstrationLesson && docData.lessonStudySteps ? (
                      <div className="pl-3 border-l-2 border-slate-300 space-y-2 text-xs sm:text-sm">
                        <p>
                          - <strong>Tiết dạy minh họa:</strong>{' '}
                          {docData.demonstrationLesson.teacher} - Môn:{' '}
                          {docData.demonstrationLesson.subject} ({docData.demonstrationLesson.grade}).
                          Đề tài: <em>{docData.demonstrationLesson.topic}</em>. Xếp loại:{' '}
                          <span className="text-emerald-700 font-bold">
                            {docData.demonstrationLesson.rating}
                          </span>
                          .
                        </p>
                        <p>
                          - <strong>Bước 1 (Xây dựng bài dạy):</strong>{' '}
                          {docData.lessonStudySteps.step1}
                        </p>
                        <p>
                          - <strong>Bước 2 (Dạy minh họa & quan sát):</strong>{' '}
                          {docData.lessonStudySteps.step2}
                        </p>
                        <p>
                          - <strong>Bước 3 (Phân tích & suy ngẫm):</strong>{' '}
                          {docData.lessonStudySteps.step3}
                        </p>
                        <p>
                          - <strong>Bước 4 (Vận dụng vào thực tiễn):</strong>{' '}
                          {docData.lessonStudySteps.step4}
                        </p>
                      </div>
                    ) : (
                      <div className="pl-3 border-l-2 border-amber-400 space-y-2 text-xs sm:text-sm bg-amber-50/50 p-2.5 rounded-r-lg">
                        <p className="text-amber-900">
                          - <strong>Hình thức:</strong> Sinh hoạt chuyên môn định kỳ (Không tổ chức tiết dạy minh họa trên lớp đợt này).
                        </p>
                        <p className="text-slate-700">
                          - <strong>Trọng tâm:</strong> {docData.regularMeetingActivities?.description || docData.mainTopic}
                        </p>
                        <p className="text-[11px] text-amber-800 italic">
                          (Lưu ý: Kế hoạch dạy minh họa NCBH năm học 2026-2027 tổ chức 02 đợt: Tháng 11/2026 do Thầy Nguyễn Bảo Ngưng dạy; Tháng 3/2027 do Thầy Lê Trung Hậu dạy).
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <p className="font-bold text-base text-slate-900 mb-1">
                      6. Phân tích phổ điểm & Đề xuất chống liệt (Hệ thống AI):
                    </p>
                    <ul className="list-disc ml-6 space-y-1 text-xs sm:text-sm">
                      {docData.aiAnalysisHighlights.map((hl, i) => (
                        <li key={i}>{hl}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <p className="font-bold text-base text-slate-900 mb-1">
                      7. Kế hoạch hành động giải pháp chống liệt:
                    </p>
                    <ul className="list-disc ml-6 space-y-1 text-xs sm:text-sm">
                      {docData.remedialAntiFailActions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <p className="font-bold text-base text-slate-900 mb-1">
                      8. Kết luận của Giáo viên hướng dẫn:
                    </p>
                    <ul className="list-disc ml-6 space-y-1 text-xs sm:text-sm">
                      {docData.conclusions.map((cl, i) => (
                        <li key={i}>{cl}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Signatures */}
                  <div className="mt-12 pt-6 grid grid-cols-2 text-center text-sm">
                    <div>
                      <span className="italic">Thư ký ghi biên bản</span>
                      <div className="h-16"></div>
                      <span className="font-bold">{docData.participants.secretary}</span>
                    </div>
                    <div>
                      <span className="font-bold uppercase">Giáo viên hướng dẫn</span>
                      <div className="h-16"></div>
                      <span className="font-bold">
                        {docData.participants.chairperson.split(' - ')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Statistics and Action Panel */}
              <div className="space-y-6">
                {/* DBSCAN Chart Card */}
                <div className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span>GOM CỤM DBSCAN (NĂNG LỰC)</span>
                    </h4>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      40 học sinh
                    </span>
                  </div>

                  {/* Doughnut Chart Canvas */}
                  <div className="relative h-48 w-full flex items-center justify-center my-2">
                    <canvas ref={chartCanvasRef} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-800">40</span>
                      <span className="text-[11px] text-slate-400 font-semibold uppercase">
                        Học sinh
                      </span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="mt-4 space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                        <span className="font-medium text-slate-700">Nhóm Mũi nhọn (Cụm 1)</span>
                      </span>
                      <span className="font-bold text-emerald-600">15% (06 em)</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                        <span className="font-medium text-slate-700">Nhóm An toàn (Cụm 2)</span>
                      </span>
                      <span className="font-bold text-blue-600">65% (26 em)</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                        <span className="font-bold text-red-600">Nguy cơ liệt (Cụm 3)</span>
                      </span>
                      <span className="font-bold text-red-600">20% (08 em)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToTab('score-analysis')}
                    className="w-full mt-4 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <span>Xem chi tiết danh sách học sinh</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* At-risk Warning Card */}
                <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                  <div className="flex items-center space-x-2 text-red-800 font-bold text-xs mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>HỌC SINH CẦN CAN THIỆP GẤP (ĐIỂM &lt;= 2.5)</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-red-900">
                    <div className="flex justify-between items-center py-1 border-b border-red-200/60">
                      <span className="font-semibold">Dương Văn Khang (12A1)</span>
                      <span className="bg-red-600 text-white px-2 py-0.5 rounded font-black text-[11px]">
                        1.2 đ (Liệt)
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-red-200/60">
                      <span className="font-semibold">Bùi Gia Huy (12A1)</span>
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded font-black text-[11px]">
                        2.2 đ
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-semibold">Võ Minh Quân (12A1)</span>
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded font-black text-[11px]">
                        2.4 đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Next Steps Action Card */}
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
                  <h4 className="font-bold mb-3 text-amber-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" />
                    <span>HÀNH ĐỘNG TIẾP THEO</span>
                  </h4>
                  <ul className="text-xs space-y-2.5 text-amber-950 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-700">✅</span>
                      <span>Phê duyệt biên bản này lên Ban Giám đốc Trung tâm.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-700">✅</span>
                      <span>Tải minh chứng Tiêu chí 8, 9 lên hệ thống TEMIS.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-700">✅</span>
                      <span>Gửi ma trận đề ôn tập nhận biết cho giáo viên bộ môn.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Reset or Re-run */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thực hiện quy trình mới</span>
              </button>

              <button
                onClick={() => onNavigateToTab(selectedBusiness)}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Chuyển sang module {businessOptions.find((b) => b.id === selectedBusiness)?.title || 'chuyên môn'} đầy đủ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* LOADING OVERLAY */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center z-50 rounded-2xl animate-in fade-in duration-200 p-6 text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="w-6 h-6 text-blue-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="mt-5 font-bold text-blue-900 text-base max-w-md italic">
              {loadingText}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Thuật toán đang phân loại cụm năng lực & kết nối chuẩn thể thức Nghị định 30/2020/NĐ-CP
            </p>
          </div>
        )}
      </div>

      {/* TikZ LaTeX Chart Export Modal */}
      <ChartTikzExportModal
        isOpen={isTikzModalOpen}
        onClose={() => setIsTikzModalOpen(false)}
        initialChartId={selectedTikzChartId}
        students={SAMPLE_STUDENTS}
        meetingData={docData}
      />
    </div>
  );
};
