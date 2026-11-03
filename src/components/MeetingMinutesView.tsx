import React, { useState } from 'react';
import {
  FileText,
  FileDown,
  Printer,
  Sparkles,
  Users,
  CheckCircle2,
  Edit3,
  Save,
  Plus,
  RefreshCw,
  Calendar,
  ChevronRight,
  BookOpen,
  Award,
  Layers,
  Clock,
  MapPin,
  UserCheck,
  GraduationCap,
  Copy,
  Trash2,
  FileCode,
} from 'lucide-react';
import { MeetingMinutesData } from '../types';
import { INITIAL_MEETING_MINUTES } from '../data/mockData';
import { MONTHLY_MEETING_MINUTES } from '../data/monthlyMeetingMinutes';
import { exportToWordDocument, callAiAssistant } from '../services/aiService';
import { ChartTikzExportModal } from './ChartTikzExportModal';

export const MeetingMinutesView: React.FC = () => {
  const [minutesList, setMinutesList] = useState<MeetingMinutesData[]>(MONTHLY_MEETING_MINUTES);
  const [selectedMonthId, setSelectedMonthId] = useState<string>('bb-thang-11'); // Default to Tháng 11 (Thầy Nguyễn Bảo Ngưng)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isTikzModalOpen, setIsTikzModalOpen] = useState<boolean>(false);

  // Active meeting data
  const currentMinute = minutesList.find((m) => m.id === selectedMonthId) || minutesList[0] || INITIAL_MEETING_MINUTES;

  // Update field in current minute
  const handleUpdateCurrentMinute = (updater: (prev: MeetingMinutesData) => MeetingMinutesData) => {
    setMinutesList((prev) =>
      prev.map((item) => {
        if (item.id === currentMinute.id) {
          return updater(item);
        }
        return item;
      })
    );
  };

  // Export word doc
  const handleExportWord = () => {
    const data = currentMinute;
    const content = `
      <div style="font-family: 'Times New Roman', serif; line-height: 1.5; font-size: 14pt;">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="width: 45%; text-align: center; border: none; font-size: 13pt;">
              <b>${data.schoolName}</b><br/>
              <b>${data.deptName}</b><br/>
              <span>Số: ${data.docNumber}</span>
              <hr style="width: 120px; border-top: 1px solid black; margin: 4px auto;"/>
            </td>
            <td style="width: 55%; text-align: center; border: none; font-size: 13pt;">
              <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/>
              <b>Độc lập - Tự do - Hạnh phúc</b>
              <hr style="width: 160px; border-top: 1px solid black; margin: 4px auto;"/>
            </td>
          </tr>
        </table>
        
        <h2 style="text-align: center; margin-top: 25px; font-size: 16pt; font-weight: bold; text-transform: uppercase;">
          ${data.title}<br/>
          <span style="font-size: 13pt; font-weight: normal; font-style: italic;">(${data.subTitle})</span>
        </h2>

        <p><b>1. Thời gian:</b> ${data.dateTime}</p>
        <p><b>2. Địa điểm:</b> ${data.location}</p>
        <p><b>3. Thành phần:</b> ${data.participants.attendees} (Vắng: ${data.participants.absentees})</p>
        <p><b>4. Chủ trì:</b> ${data.participants.chairperson} | <b>Thư ký:</b> ${data.participants.secretary}</p>
        
        ${data.hasDemonstrationLesson && data.demonstrationLesson && data.lessonStudySteps ? `
        <h3 style="font-size: 14pt; margin-top: 15px;">5. Nội dung sinh hoạt theo nghiên cứu bài học (CV 5555/BGDĐT):</h3>
        <p>- <b>Tiết dạy minh họa:</b> ${data.demonstrationLesson.teacher} giảng dạy môn ${data.demonstrationLesson.subject} (${data.demonstrationLesson.grade}). Chuyên đề: <i>${data.demonstrationLesson.topic}</i>. (${data.demonstrationLesson.rating}).</p>
        <p>- <b>Bước 1 (Xây dựng bài học):</b> ${data.lessonStudySteps.step1}</p>
        <p>- <b>Bước 2 (Dạy & Quan sát):</b> ${data.lessonStudySteps.step2}</p>
        <p>- <b>Bước 3 (Suy ngẫm & Thảo luận):</b> ${data.lessonStudySteps.step3}</p>
        <p>- <b>Bước 4 (Áp dụng thực tiễn):</b> ${data.lessonStudySteps.step4}</p>
        ` : `
        <h3 style="font-size: 14pt; margin-top: 15px;">5. Nội dung sinh hoạt chuyên môn định kỳ (Không tổ chức dạy minh họa):</h3>
        <p style="font-style: italic; color: #475569;">(Kế hoạch dạy minh họa theo NCBH năm học 2026-2027 tổ chức 02 đợt: Tháng 11/2026 do Thầy Nguyễn Bảo Ngưng dạy; Tháng 3/2027 do Thầy Lê Trung Hậu dạy. Kỳ sinh hoạt này không tổ chức dạy minh họa).</p>
        <p>- <b>Chủ đề trọng tâm:</b> ${data.regularMeetingActivities?.focusTopic || data.mainTopic}</p>
        <p>- <b>Nội dung triển khai:</b> ${data.regularMeetingActivities?.description || ''}</p>
        <p>- <b>Phân công nhiệm vụ:</b> ${data.regularMeetingActivities?.assignedTasks || 'Toàn thể giáo viên tổ thực hiện theo kế hoạch giáo dục.'}</p>
        `}
        
        <h3 style="font-size: 14pt; margin-top: 15px;">6. Phân tích phổ điểm & Giải pháp chống điểm liệt:</h3>
        <ul>
          ${data.aiAnalysisHighlights.map((h) => `<li>${h}</li>`).join('')}
        </ul>
        
        <h3 style="font-size: 14pt; margin-top: 15px;">7. Kế hoạch hành động cụ thể:</h3>
        <ul>
          ${data.remedialAntiFailActions.map((a) => `<li>${a}</li>`).join('')}
        </ul>
        
        <h3 style="font-size: 14pt; margin-top: 15px;">8. Kết luận cuộc họp:</h3>
        <ul>
          ${data.conclusions.map((c) => `<li>${c}</li>`).join('')}
        </ul>
        <p style="font-style: italic;">Biên bản kết thúc vào hồi 16 giờ 30 phút cùng ngày. Toàn thể giáo viên trong tổ biểu quyết nhất trí 100%.</p>

        <table style="width: 100%; border: none; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center; border: none; font-size: 14pt; font-style: italic;">
              <b>THƯ KÝ GHI BIÊN BẢN</b><br/><br/><br/><br/>
              <b>${data.participants.secretary}</b>
            </td>
            <td style="width: 50%; text-align: center; border: none; font-size: 14pt;">
              <b>TỔ TRƯỞNG CHUYÊN MÔN</b><br/><br/><br/><br/>
              <b>${data.participants.chairperson.split(' - ')[0]}</b>
            </td>
          </tr>
        </table>
      </div>
    `;

    const fileName = `Bien_Ban_SHCM_Thang_${data.month || 'X'}_${data.year || '2026'}`;
    exportToWordDocument(fileName, content);
  };

  // AI assistant generation
  const handleGenerateNewWithAi = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await callAiAssistant({
        type: 'meeting',
        prompt: `Tạo biên bản sinh hoạt chuyên môn theo nghiên cứu bài học môn Toán Khối 12 GDNN-GDTX tháng ${currentMinute.month}/${currentMinute.year} về chủ đề: ${currentMinute.mainTopic || currentMinute.subTitle}.`,
        context: {
          schoolName: currentMinute.schoolName,
          deptName: currentMinute.deptName,
          subject: 'Toán học - Tin - Công nghệ',
          grade: 'Khối 12 GDNN-GDTX',
          month: currentMinute.month,
          year: currentMinute.year,
        },
      });

      if (res.text) {
        handleUpdateCurrentMinute((prev) => ({
          ...prev,
          aiAnalysisHighlights: [
            ...prev.aiAnalysisHighlights,
            `Đề xuất bổ sung từ AI: Tăng cường rèn luyện kỹ năng thực hành phân hóa cho học sinh nhóm nguy cơ trong tháng ${prev.month}.`,
          ],
        }));
      }
    } catch (e) {
      console.warn('AI generate error', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Create a new month's meeting minutes
  const handleAddNewMonth = () => {
    const newMonthNum = (minutesList.length % 12) + 1;
    const newId = `bb-thang-${newMonthNum < 10 ? '0' + newMonthNum : newMonthNum}-${Date.now()}`;
    const newDocNumber = `0${minutesList.length + 1}/BB-TTCN`;
    const newMeeting: MeetingMinutesData = {
      id: newId,
      month: newMonthNum,
      year: 2027,
      sessionNumber: 1,
      mainTopic: `Sinh hoạt chuyên môn định kỳ tháng ${newMonthNum} - Nghiên cứu bài học & chống điểm liệt`,
      schoolName: 'TRƯỜNG THPT PHAN THANH GIẢN',
      deptName: 'TỔ TOÁN - TIN - CÔNG NGHỆ',
      docNumber: newDocNumber,
      title: `BIÊN BẢN SINH HOẠT CHUYÊN MÔN THÁNG ${newMonthNum}`,
      subTitle: `Nghiên cứu bài học và giải pháp nâng cao chất lượng giáo dục tháng ${newMonthNum}/2027`,
      dateTime: `14 giờ 00 phút, ngày 15 tháng ${newMonthNum < 10 ? '0' + newMonthNum : newMonthNum} năm 2027`,
      location: 'Phòng Thư viện',
      participants: {
        attendees: '14/14 giáo viên trong tổ (Có mặt đầy đủ)',
        absentees: 'Không',
        chairperson: 'Nguyễn Thị Kiều Ân - Giáo viên hướng dẫn',
        secretary: 'Lê Thị Huyền Trân - Giáo viên tổ',
      },
      hasDemonstrationLesson: false,
      regularMeetingActivities: {
        focusTopic: `Sinh hoạt chuyên môn định kỳ tháng ${newMonthNum}`,
        description: `Tổ chuyên môn thảo luận các nhiệm vụ giảng dạy và ôn tập theo kế hoạch giáo dục. (Lưu ý: Tiết dạy minh họa NCBH chỉ tổ chức vào Tháng 11/2026 do Thầy Nguyễn Bảo Ngưng dạy và Tháng 3/2027 do Thầy Lê Trung Hậu dạy).`,
        assignedTasks: 'Toàn thể giáo viên trong tổ thực hiện theo phân công chuyên môn.',
      },
      aiAnalysisHighlights: [
        `Tỷ lệ học sinh đạt chuẩn yêu cầu tháng ${newMonthNum} duy trì ổn định trên 90%.`,
        `Nhóm học sinh cần hỗ trợ chống liệt được kiểm tra tiến độ định kỳ hàng tuần.`,
      ],
      remedialAntiFailActions: [
        `Tiếp tục duy trì kèm cặp đôi bạn cùng tiến và các buổi phụ đạo chiều.`,
        `Giao bài tập phân hóa theo ma trận đặc tả đề thi tốt nghiệp của Bộ GD&ĐT.`,
      ],
      conclusions: [
        `Thông qua biên bản sinh hoạt chuyên môn tháng ${newMonthNum}.`,
        `Phân công các đồng chí giáo viên thực hiện nghiêm túc kết luận cuộc họp.`,
      ],
    };

    setMinutesList((prev) => [...prev, newMeeting]);
    setSelectedMonthId(newId);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedNotification('Đã sao chép liên kết hồ sơ biên bản!');
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-1 border border-blue-200">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Nghiên Cứu Bài Học • Chuẩn Thể Thức Nghị Định 30/2020/NĐ-CP • Theo Từng Tháng</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Biên Bản Sinh Hoạt Chuyên Môn Từng Tháng
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Trọn bộ biên bản sinh hoạt từ Tháng 9 đến Tháng 5 năm học 2026-2027 kèm 4 bước nghiên cứu bài học & giải pháp chống điểm liệt
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddNewMonth}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Thêm biên bản tháng mới</span>
          </button>

          <button
            onClick={handleGenerateNewWithAi}
            disabled={isGeneratingAi}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isGeneratingAi ? 'Đang tạo...' : 'AI hỗ trợ nội dung'}</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center gap-1.5 ${
              isEditing
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>In A4</span>
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
            onClick={() => setIsTikzModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            title="Xuất sơ đồ chu trình nghiên cứu bài học 4 bước sang mã nguồn TikZ (LaTeX)"
          >
            <FileCode className="w-4 h-4 text-indigo-200" />
            <span>Xuất Sơ Đồ TikZ</span>
          </button>
        </div>
      </div>

      {copiedNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* NCBH Schedule Clarification Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
        <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-blue-900 text-sm">
            Kế hoạch sinh hoạt chuyên môn theo Nghiên cứu bài học (NCBH) năm học 2026 - 2027:
          </p>
          <p className="mt-1 text-slate-600">
            Tổ chuyên môn chỉ tổ chức tiết dạy minh họa NCBH <strong>02 đợt / năm học</strong> theo đúng quy định:
            <span className="text-blue-800 font-bold ml-1.5 bg-blue-100 px-2 py-0.5 rounded">
              ⭐ Đợt 1 (Tháng 11/2026): Thầy Nguyễn Bảo Ngưng
            </span>
            <span className="text-purple-800 font-bold ml-1.5 bg-purple-100 px-2 py-0.5 rounded">
              ⭐ Đợt 2 (Tháng 3/2027): Thầy Lê Trung Hậu
            </span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Các tháng còn lại sinh hoạt chuyên môn định kỳ (thống nhất ma trận đề, phân tích phổ điểm, phụ đạo học sinh yếu, sơ kết, sinh hoạt chuyên đề, TEMIS...).
          </p>
        </div>
      </div>

      {/* Month Navigator Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Chọn tháng sinh hoạt chuyên môn (Năm học 2026 - 2027):</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Tổng cộng: <strong className="text-blue-600">{minutesList.length}</strong> biên bản
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {minutesList.map((item) => {
            const isSelected = item.id === selectedMonthId;
            const monthLabel = `Tháng ${item.month}`;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedMonthId(item.id || '');
                  setIsEditing(false);
                }}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-start gap-1 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full justify-between">
                  <span className="font-extrabold">{monthLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.year}
                  </span>
                </div>
                <div
                  className={`text-[11px] truncate max-w-[150px] font-normal ${
                    isSelected ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {item.hasDemonstrationLesson && item.demonstrationLesson
                    ? `⭐ NCBH: ${item.demonstrationLesson.teacher.split(' (')[0]}`
                    : 'Sinh hoạt định kỳ'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Summary Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
          <div className="text-xs font-semibold text-blue-600 uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Kỳ sinh hoạt & Số hiệu</span>
          </div>
          <div className="text-base font-extrabold text-blue-950 mt-1">
            {currentMinute.docNumber}
          </div>
          <div className="text-xs text-blue-700 mt-0.5">{currentMinute.dateTime}</div>
        </div>

        {currentMinute.hasDemonstrationLesson && currentMinute.demonstrationLesson ? (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
            <div className="text-xs font-semibold text-purple-600 uppercase flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Dạy minh họa (NCBH)</span>
            </div>
            <div className="text-base font-extrabold text-purple-950 mt-1 truncate">
              {currentMinute.demonstrationLesson.teacher}
            </div>
            <div className="text-xs text-purple-700 mt-0.5 truncate">
              {currentMinute.demonstrationLesson.grade} • {currentMinute.demonstrationLesson.subject}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Hình thức sinh hoạt</span>
            </div>
            <div className="text-sm font-extrabold text-slate-800 mt-1 truncate">
              Sinh hoạt chuyên môn định kỳ
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">
              Không tổ chức dạy minh họa
            </div>
          </div>
        )}

        {currentMinute.hasDemonstrationLesson && currentMinute.demonstrationLesson ? (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
            <div className="text-xs font-semibold text-emerald-600 uppercase flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Đánh giá tiết minh họa</span>
            </div>
            <div className="text-base font-extrabold text-emerald-950 mt-1">
              {currentMinute.demonstrationLesson.rating}
            </div>
            <div className="text-xs text-emerald-700 mt-0.5">Tiêu chuẩn Công văn 5555/BGDĐT</div>
          </div>
        ) : (
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
            <div className="text-xs font-semibold text-indigo-600 uppercase flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Kế hoạch dạy NCBH</span>
            </div>
            <div className="text-xs font-bold text-indigo-950 mt-1">
              T11 (Thầy Ngưng) • T3 (Thầy Hậu)
            </div>
            <div className="text-xs text-indigo-700 mt-0.5">Thực hiện 02 đợt / năm học</div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <div className="text-xs font-semibold text-amber-600 uppercase flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Chủ trì & Thư ký</span>
          </div>
          <div className="text-sm font-bold text-amber-950 mt-1 truncate">
            {currentMinute.participants.chairperson}
          </div>
          <div className="text-xs text-amber-800 mt-0.5 truncate">
            Thư ký: {currentMinute.participants.secretary}
          </div>
        </div>
      </div>

      {/* Main Document Preview in Times New Roman Paper Layout */}
      <div className="bg-[#fcfcfc] p-6 sm:p-14 rounded-2xl border border-slate-300 shadow-sm max-w-4xl mx-auto font-document text-slate-900">
        {/* National Emblem & Agency Header */}
        <div className="grid grid-cols-2 text-xs sm:text-sm uppercase font-bold leading-normal mb-8">
          <div className="text-center">
            {isEditing ? (
              <input
                value={currentMinute.schoolName}
                onChange={(e) =>
                  handleUpdateCurrentMinute((prev) => ({ ...prev, schoolName: e.target.value }))
                }
                className="w-full text-center border-b border-blue-400 font-bold p-1"
              />
            ) : (
              <span>{currentMinute.schoolName}</span>
            )}
            <br />
            {isEditing ? (
              <input
                value={currentMinute.deptName}
                onChange={(e) =>
                  handleUpdateCurrentMinute((prev) => ({ ...prev, deptName: e.target.value }))
                }
                className="w-full text-center border-b border-blue-400 font-bold p-1 text-blue-900"
              />
            ) : (
              <span className="text-blue-900 font-black">{currentMinute.deptName}</span>
            )}
            <br />
            {isEditing ? (
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="normal-case font-normal text-xs">Số:</span>
                <input
                  value={currentMinute.docNumber}
                  onChange={(e) =>
                    handleUpdateCurrentMinute((prev) => ({ ...prev, docNumber: e.target.value }))
                  }
                  className="w-28 text-center border-b border-blue-400 text-xs p-0.5"
                />
              </div>
            ) : (
              <span className="normal-case font-normal text-xs">Số: {currentMinute.docNumber}</span>
            )}
            <div className="w-24 mx-auto border-t-2 border-slate-800 mt-1"></div>
          </div>

          <div className="text-center">
            <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
            <br />
            <span className="font-bold underline decoration-1 underline-offset-4">
              Độc lập - Tự do - Hạnh phúc
            </span>
            <div className="w-36 mx-auto border-t-2 border-slate-800 mt-1"></div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-6">
          {isEditing ? (
            <input
              value={currentMinute.title}
              onChange={(e) =>
                handleUpdateCurrentMinute((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full text-center border-b border-blue-400 font-bold text-lg p-1 text-slate-900 uppercase"
            />
          ) : (
            <h3 className="font-bold text-lg sm:text-xl text-slate-900 uppercase tracking-tight">
              {currentMinute.title}
            </h3>
          )}

          {isEditing ? (
            <input
              value={currentMinute.subTitle}
              onChange={(e) =>
                handleUpdateCurrentMinute((prev) => ({ ...prev, subTitle: e.target.value }))
              }
              className="w-full text-center border-b border-blue-400 italic text-sm p-1 text-slate-700 mt-1"
            />
          ) : (
            <p className="text-sm italic font-medium text-slate-700 mt-1">({currentMinute.subTitle})</p>
          )}
        </div>

        {/* Meeting Details */}
        <div className="text-sm sm:text-base leading-relaxed space-y-4 pt-2">
          <p>
            <strong>1. Thời gian:</strong>{' '}
            {isEditing ? (
              <input
                value={currentMinute.dateTime}
                onChange={(e) =>
                  handleUpdateCurrentMinute((prev) => ({ ...prev, dateTime: e.target.value }))
                }
                className="border-b border-blue-400 p-0.5 w-72"
              />
            ) : (
              currentMinute.dateTime
            )}
          </p>

          <p>
            <strong>2. Địa điểm:</strong>{' '}
            {isEditing ? (
              <input
                value={currentMinute.location}
                onChange={(e) =>
                  handleUpdateCurrentMinute((prev) => ({ ...prev, location: e.target.value }))
                }
                className="border-b border-blue-400 p-0.5 w-72"
              />
            ) : (
              currentMinute.location
            )}
          </p>

          <p>
            <strong>3. Thành phần:</strong>{' '}
            {isEditing ? (
              <input
                value={currentMinute.participants.attendees}
                onChange={(e) =>
                  handleUpdateCurrentMinute((prev) => ({
                    ...prev,
                    participants: { ...prev.participants, attendees: e.target.value },
                  }))
                }
                className="border-b border-blue-400 p-0.5 w-60"
              />
            ) : (
              currentMinute.participants.attendees
            )}{' '}
            (Vắng: {currentMinute.participants.absentees})
          </p>

          <p>
            <strong>4. Chủ trì cuộc họp:</strong>{' '}
            {isEditing ? (
              <input
                value={currentMinute.participants.chairperson}
                onChange={(e) =>
                  handleUpdateCurrentMinute((prev) => ({
                    ...prev,
                    participants: { ...prev.participants, chairperson: e.target.value },
                  }))
                }
                className="border-b border-blue-400 p-0.5 w-64"
              />
            ) : (
              currentMinute.participants.chairperson
            )}
          </p>

          <p>
            <strong>Thư ký ghi biên bản:</strong>{' '}
            {isEditing ? (
              <input
                value={currentMinute.participants.secretary}
                onChange={(e) =>
                  handleUpdateCurrentMinute((prev) => ({
                    ...prev,
                    participants: { ...prev.participants, secretary: e.target.value },
                  }))
                }
                className="border-b border-blue-400 p-0.5 w-64"
              />
            ) : (
              currentMinute.participants.secretary
            )}
          </p>

          {/* Section 5: Demonstration Lesson (NCBH) OR Regular Meeting Activities */}
          {currentMinute.hasDemonstrationLesson && currentMinute.demonstrationLesson && currentMinute.lessonStudySteps ? (
            <div className="pt-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-slate-900 uppercase">
                  5. Nội dung sinh hoạt theo Nghiên cứu bài học (CV 5555/BGDĐT):
                </h4>
                <button
                  type="button"
                  onClick={() => setIsTikzModalOpen(true)}
                  className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer no-print"
                  title="Xuất sơ đồ chu trình 4 bước này sang mã nguồn TikZ"
                >
                  <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xuất Sơ Đồ TikZ (CV 5555)</span>
                </button>
              </div>
              <div className="pl-4 border-l-2 border-indigo-400 space-y-3 mt-2 text-sm">
                <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-200">
                  <span className="font-bold text-indigo-950">Tiết dạy minh họa:</span>{' '}
                  {isEditing ? (
                    <div className="space-y-1.5 mt-1">
                      <div className="flex gap-2">
                        <span className="font-semibold text-xs">Giáo viên:</span>
                        <input
                          value={currentMinute.demonstrationLesson.teacher}
                          onChange={(e) =>
                            handleUpdateCurrentMinute((prev) => ({
                              ...prev,
                              demonstrationLesson: prev.demonstrationLesson
                                ? { ...prev.demonstrationLesson, teacher: e.target.value }
                                : undefined,
                            }))
                          }
                          className="border-b border-blue-400 text-xs flex-1 p-0.5"
                        />
                      </div>
                      <div className="flex gap-2">
                        <span className="font-semibold text-xs">Bài học:</span>
                        <input
                          value={currentMinute.demonstrationLesson.topic}
                          onChange={(e) =>
                            handleUpdateCurrentMinute((prev) => ({
                              ...prev,
                              demonstrationLesson: prev.demonstrationLesson
                                ? { ...prev.demonstrationLesson, topic: e.target.value }
                                : undefined,
                            }))
                          }
                          className="border-b border-blue-400 text-xs flex-1 p-0.5"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <strong className="text-indigo-900">{currentMinute.demonstrationLesson.teacher}</strong> dạy môn{' '}
                      {currentMinute.demonstrationLesson.subject} ({currentMinute.demonstrationLesson.grade}). Bài học:{' '}
                      <em>{currentMinute.demonstrationLesson.topic}</em>. (
                      <span className="text-emerald-700 font-bold">{currentMinute.demonstrationLesson.rating}</span>)
                    </>
                  )}
                </div>

                <p>
                  <strong>Bước 1 (Xây dựng kế hoạch bài dạy):</strong>{' '}
                  {isEditing ? (
                    <textarea
                      value={currentMinute.lessonStudySteps.step1}
                      onChange={(e) =>
                        handleUpdateCurrentMinute((prev) => ({
                          ...prev,
                          lessonStudySteps: prev.lessonStudySteps
                            ? { ...prev.lessonStudySteps, step1: e.target.value }
                            : undefined,
                        }))
                      }
                      rows={2}
                      className="w-full border border-blue-400 p-1.5 rounded text-xs mt-1"
                    />
                  ) : (
                    currentMinute.lessonStudySteps.step1
                  )}
                </p>

                <p>
                  <strong>Bước 2 (Tiến hành dạy và quan sát học sinh):</strong>{' '}
                  {isEditing ? (
                    <textarea
                      value={currentMinute.lessonStudySteps.step2}
                      onChange={(e) =>
                        handleUpdateCurrentMinute((prev) => ({
                          ...prev,
                          lessonStudySteps: prev.lessonStudySteps
                            ? { ...prev.lessonStudySteps, step2: e.target.value }
                            : undefined,
                        }))
                      }
                      rows={2}
                      className="w-full border border-blue-400 p-1.5 rounded text-xs mt-1"
                    />
                  ) : (
                    currentMinute.lessonStudySteps.step2
                  )}
                </p>

                <p>
                  <strong>Bước 3 (Phân tích hoạt động học & suy ngẫm):</strong>{' '}
                  {isEditing ? (
                    <textarea
                      value={currentMinute.lessonStudySteps.step3}
                      onChange={(e) =>
                        handleUpdateCurrentMinute((prev) => ({
                          ...prev,
                          lessonStudySteps: prev.lessonStudySteps
                            ? { ...prev.lessonStudySteps, step3: e.target.value }
                            : undefined,
                        }))
                      }
                      rows={2}
                      className="w-full border border-blue-400 p-1.5 rounded text-xs mt-1"
                    />
                  ) : (
                    currentMinute.lessonStudySteps.step3
                  )}
                </p>

                <p>
                  <strong>Bước 4 (Vận dụng kết quả vào các tiết tiếp theo):</strong>{' '}
                  {isEditing ? (
                    <textarea
                      value={currentMinute.lessonStudySteps.step4}
                      onChange={(e) =>
                        handleUpdateCurrentMinute((prev) => ({
                          ...prev,
                          lessonStudySteps: prev.lessonStudySteps
                            ? { ...prev.lessonStudySteps, step4: e.target.value }
                            : undefined,
                        }))
                      }
                      rows={2}
                      className="w-full border border-blue-400 p-1.5 rounded text-xs mt-1"
                    />
                  ) : (
                    currentMinute.lessonStudySteps.step4
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-3">
              <h4 className="font-bold text-base text-slate-900 uppercase">
                5. Nội dung sinh hoạt chuyên môn định kỳ (Không tổ chức dạy minh họa):
              </h4>
              <div className="pl-4 border-l-2 border-amber-400 space-y-3 mt-2 text-sm">
                <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-amber-900">
                  <p className="font-bold text-amber-950 flex items-center gap-1.5">
                    <span>📌 Kế hoạch sinh hoạt chuyên môn theo NCBH năm học 2026 - 2027:</span>
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    Kỳ sinh hoạt này không tổ chức dạy minh họa trên lớp. Kế hoạch dạy minh họa theo Nghiên cứu bài học (NCBH) của tổ trong năm học được thực hiện <strong>02 đợt</strong>:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="font-bold text-blue-900 text-xs">⭐ Đợt 1 (Tháng 11/2026):</span>
                      <p className="text-[11px] text-slate-700 mt-0.5">
                        <strong>ThS. Nguyễn Bảo Ngưng</strong> dạy minh họa môn Tin học 12 (Ứng dụng Python xử lý dữ liệu - Lớp 12A1).
                      </p>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="font-bold text-purple-900 text-xs">⭐ Đợt 2 (Tháng 3/2027):</span>
                      <p className="text-[11px] text-slate-700 mt-0.5">
                        <strong>Thầy Lê Trung Hậu</strong> dạy minh họa môn Toán 12 (Phương pháp tọa độ Oxyz - Lớp 12A3).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-bold text-blue-900 text-xs uppercase tracking-wide">
                    Chủ đề trọng tâm kỳ sinh hoạt tháng {currentMinute.month}:
                  </p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {currentMinute.regularMeetingActivities?.focusTopic || currentMinute.mainTopic}
                  </p>
                  <p className="mt-1 text-slate-600 text-xs leading-relaxed">
                    {currentMinute.regularMeetingActivities?.description}
                  </p>
                </div>

                {currentMinute.regularMeetingActivities?.assignedTasks && (
                  <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 text-xs">
                    <strong>Phân công nhiệm vụ thực hiện:</strong>{' '}
                    <span className="text-slate-700">{currentMinute.regularMeetingActivities.assignedTasks}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 6: Score Analysis Highlights */}
          <div className="pt-3">
            <h4 className="font-bold text-base text-slate-900 uppercase">
              6. Phân tích phổ điểm khảo sát & Nhận diện nguy cơ điểm liệt:
            </h4>
            <ul className="list-disc ml-6 space-y-1.5 mt-2 text-sm">
              {currentMinute.aiAnalysisHighlights.map((hl, i) => (
                <li key={i}>{hl}</li>
              ))}
            </ul>
          </div>

          {/* Section 7: Anti-fail Plan */}
          <div className="pt-3">
            <h4 className="font-bold text-base text-slate-900 uppercase">
              7. Kế hoạch hành động giải pháp chống điểm liệt:
            </h4>
            <ul className="list-disc ml-6 space-y-1.5 mt-2 text-sm">
              {currentMinute.remedialAntiFailActions.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>

          {/* Section 8: Conclusions */}
          <div className="pt-3">
            <h4 className="font-bold text-base text-slate-900 uppercase">
              8. Kết luận và Biểu quyết:
            </h4>
            <ul className="list-disc ml-6 space-y-1.5 mt-2 text-sm">
              {currentMinute.conclusions.map((cl, i) => (
                <li key={i}>{cl}</li>
              ))}
            </ul>
            <p className="mt-2 italic text-slate-700">
              Biên bản kết thúc vào hồi 16 giờ 30 phút cùng ngày. Toàn thể giáo viên trong tổ biểu
              quyết nhất trí 100%.
            </p>
          </div>

          {/* Signatures */}
          <div className="mt-14 pt-6 grid grid-cols-2 text-center text-sm">
            <div>
              <span className="italic">Thư ký ghi biên bản</span>
              <div className="h-20"></div>
              <span className="font-bold">{currentMinute.participants.secretary}</span>
            </div>
            <div>
              <span className="font-bold uppercase">Giáo viên hướng dẫn / Chủ nhiệm</span>
              <div className="h-20"></div>
              <span className="font-bold">{currentMinute.participants.chairperson.split(' - ')[0]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TikZ LaTeX Chart Export Modal */}
      <ChartTikzExportModal
        isOpen={isTikzModalOpen}
        onClose={() => setIsTikzModalOpen(false)}
        initialChartId="lesson-study"
        meetingData={currentMinute}
      />
    </div>
  );
};
