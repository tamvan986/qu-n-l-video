import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Users,
  Plus,
  Trash2,
  RefreshCw,
  FileCheck,
  ClipboardPaste,
  ShieldAlert,
  Sprout,
  HelpCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Classroom, ClassroomStudent } from '../types';

interface ClassroomStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  onConfirmReplace: (
    newStudents: ClassroomStudent[],
    syncOptions: { syncHappyTree: boolean; syncAttendance: boolean }
  ) => void;
}

// 20 realistic student presets for 12A3 (GDNN-GDTX Ba Tri)
export const PRESET_12A3_STUDENTS: ClassroomStudent[] = [
  {
    id: 'HV12A3_01',
    studentCode: 'HV12301',
    name: 'Võ Thị Kiều Thơ',
    gender: 'Nữ',
    dob: '15/04/2007',
    phone: '0984123001',
    parentPhone: '0913123001',
    cluster: 'nguyco',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm Hạt mầm -> Mầm xanh. Điểm đầu vào 1.0 (nguy cơ liệt), hiện đã đạt 3.0 điểm nhờ rèn Casio và bạn Như kèm cặp.',
  },
  {
    id: 'HV12A3_02',
    studentCode: 'HV12302',
    name: 'Huỳnh Thị Tiền',
    gender: 'Nữ',
    dob: '20/09/2007',
    phone: '0984123002',
    parentPhone: '0913123002',
    cluster: 'nguyco',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm Hạt mầm. Điểm đầu vào 0.85 (dưới liệt), hiện đạt 2.8 điểm, rèn dứt điểm 12 câu Phần I.',
  },
  {
    id: 'HV12A3_03',
    studentCode: 'HV12303',
    name: 'Nguyễn Thế Vinh',
    gender: 'Nam',
    dob: '12/03/2007',
    phone: '0984123003',
    parentPhone: '0913123003',
    cluster: 'muinhon',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Sứ giả Hạnh phúc / Nhóm Hoa. Điểm tiến bộ từ 3.75 lên 5.25 (mục tiêu 7.0+), hỗ trợ bạn Huỳnh Thị Tiền.',
  },
  {
    id: 'HV12A3_04',
    studentCode: 'HV12304',
    name: 'Nguyễn Ngọc Thảo Như',
    gender: 'Nữ',
    dob: '08/11/2007',
    phone: '0984123004',
    parentPhone: '0913123004',
    cluster: 'muinhon',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Sứ giả Hạnh phúc tiêu biểu / Nhóm Trái (35 điểm). Điểm Toán 8.8, hướng dẫn bạn Võ Thị Kiều Thơ giải đề.',
  },
  {
    id: 'HV12A3_05',
    studentCode: 'HV12305',
    name: 'Nguyễn Phương Đông',
    gender: 'Nam',
    dob: '25/06/2007',
    phone: '0984123005',
    parentPhone: '0913123005',
    cluster: 'antoan',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm Lá (21 điểm). Điểm kiểm tra bứt phá từ 2.5 lên 5.0 (chính thức thoát liệt).',
  },
  {
    id: 'HV12A3_06',
    studentCode: 'HV12306',
    name: 'Đặng Thị Thúy Nga',
    gender: 'Nữ',
    dob: '18/02/2007',
    phone: '0984123006',
    parentPhone: '0913123006',
    cluster: 'antoan',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm Chồi non (17 điểm). Điểm khảo sát từ 2.0 lên 4.0, hoàn thành đầy đủ phiếu bài tập.',
  },
  {
    id: 'HV12A3_07',
    studentCode: 'HV12307',
    name: 'Dương Lê Xuân Nhi',
    gender: 'Nữ',
    dob: '05/08/2007',
    phone: '0984123007',
    parentPhone: '0913123007',
    cluster: 'antoan',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm Chồi non (18 điểm). Điểm kiểm tra đạt 4.2, thường xuyên thi trắc nghiệm online.',
  },
  {
    id: 'HV12A3_08',
    studentCode: 'HV12308',
    name: 'Lê Phúc Hậu',
    gender: 'Nam',
    dob: '30/10/2007',
    phone: '0984123008',
    parentPhone: '0913123008',
    cluster: 'muinhon',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Sứ giả Hạnh phúc / Nhóm Hoa (26 điểm). Điểm môn Toán 6.2, giải tốt cấu trúc đề thi 3 phần.',
  },
  {
    id: 'HV12A3_09',
    studentCode: 'HV12309',
    name: 'Lê Bảo Phương Anh',
    gender: 'Nữ',
    dob: '14/01/2007',
    phone: '0984123009',
    parentPhone: '0913123009',
    cluster: 'muinhon',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Sứ giả Hạnh phúc / Nhóm Trái (31 điểm). Điểm Toán 7.8, hỗ trợ kèm cặp nhóm bạn yếu.',
  },
  {
    id: 'HV12A3_10',
    studentCode: 'HV12310',
    name: 'Trần Đăng Khoa',
    gender: 'Nam',
    dob: '22/07/2007',
    phone: '0984123010',
    parentPhone: '0913123010',
    cluster: 'muinhon',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Sứ giả Hạnh phúc / Nhóm Trái (32 điểm). Điểm Toán 8.2, thủ lĩnh điều phối nhóm ôn thi.',
  },
  {
    id: 'HV12A3_11',
    studentCode: 'HV12311',
    name: 'Bùi Hoàng Long',
    gender: 'Nam',
    dob: '16/09/2007',
    phone: '0984123011',
    parentPhone: '0913123011',
    cluster: 'antoan',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm An toàn. Điểm 5.5, tiếp thu tốt phần hình học không gian Oxyz và đạo hàm.',
  },
  {
    id: 'HV12A3_12',
    studentCode: 'HV12312',
    name: 'Phạm Thị Mỹ Duyên',
    gender: 'Nữ',
    dob: '02/05/2007',
    phone: '0984123012',
    parentPhone: '0913123012',
    cluster: 'antoan',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm An toàn. Điểm 4.8, chăm chỉ luyện tập đề trắc nghiệm online hàng tuần.',
  },
  {
    id: 'HV12A3_13',
    studentCode: 'HV12313',
    name: 'Trương Minh Nhật',
    gender: 'Nam',
    dob: '19/12/2007',
    phone: '0984123013',
    parentPhone: '0913123013',
    cluster: 'nguyco',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm Hạt mầm (nguy cơ). Điểm 2.2 -> 3.5, được bạn Vinh kèm cặp bấm máy tính Casio fx-580VNX.',
  },
  {
    id: 'HV12A3_14',
    studentCode: 'HV12314',
    name: 'Phan Cẩm Tú',
    gender: 'Nữ',
    dob: '11/03/2007',
    phone: '0984123014',
    parentPhone: '0913123014',
    cluster: 'antoan',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm An toàn. Điểm 5.2, chuyên cần tốt, tích cực phát biểu xây dựng bài.',
  },
  {
    id: 'HV12A3_15',
    studentCode: 'HV12315',
    name: 'Nguyễn Hữu Trọng',
    gender: 'Nam',
    dob: '28/08/2007',
    phone: '0984123015',
    parentPhone: '0913123015',
    cluster: 'nguyco',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm Hạt mầm (nguy cơ). Điểm 2.0 -> 3.2, rèn luyện 20 câu nhận biết - thông hiểu mỗi ngày.',
  },
  {
    id: 'HV12A3_16',
    studentCode: 'HV12316',
    name: 'Vũ Quốc Cường',
    gender: 'Nam',
    dob: '09/01/2007',
    phone: '0984123016',
    parentPhone: '0913123016',
    cluster: 'antoan',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm An toàn. Điểm 4.6, tích cực tham gia các buổi học phụ đạo chiều thứ Năm.',
  },
  {
    id: 'HV12A3_17',
    studentCode: 'HV12317',
    name: 'Mai Thanh Thảo',
    gender: 'Nữ',
    dob: '14/10/2007',
    phone: '0984123017',
    parentPhone: '0913123017',
    cluster: 'muinhon',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Sứ giả Hạnh phúc / Nhóm Hoa. Điểm 6.8, làm tốt các câu ứng dụng tích phân thực tế.',
  },
  {
    id: 'HV12A3_18',
    studentCode: 'HV12318',
    name: 'Hồ Tuấn Kiệt',
    gender: 'Nam',
    dob: '03/06/2007',
    phone: '0984123018',
    parentPhone: '0913123018',
    cluster: 'nguyco',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm Hạt mầm (nguy cơ). Điểm 1.8, cần kèm bấm nghiệm phương trình và bảng xét dấu.',
  },
  {
    id: 'HV12A3_19',
    studentCode: 'HV12319',
    name: 'Đặng Ngọc Ánh',
    gender: 'Nữ',
    dob: '23/11/2007',
    phone: '0984123019',
    parentPhone: '0913123019',
    cluster: 'antoan',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm An toàn. Điểm 5.0, chuyên cần 100%, chăm chỉ luyện trắc nghiệm trực tuyến.',
  },
  {
    id: 'HV12A3_20',
    studentCode: 'HV12320',
    name: 'Trần Gia Bảo',
    gender: 'Nam',
    dob: '17/07/2007',
    phone: '0984123020',
    parentPhone: '0913123020',
    cluster: 'antoan',
    assignedTeacher: 'Nguyễn Văn Tâm (GVCN)',
    notes: 'Nhóm An toàn. Điểm 4.9, đã khắc phục được lỗi nhầm lẫn công thức thể tích khối chóp.',
  },
];

export const ClassroomStudentImportModal: React.FC<ClassroomStudentImportModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onConfirmReplace,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file' | 'editor'>('paste');
  const [pasteText, setPasteText] = useState<string>('');
  const [studentsList, setStudentsList] = useState<ClassroomStudent[]>(classroom.students || []);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sync checkboxes
  const [syncHappyTree, setSyncHappyTree] = useState<boolean>(true);
  const [syncAttendance, setSyncAttendance] = useState<boolean>(true);

  // Reset or load current class students when opened
  useEffect(() => {
    if (isOpen) {
      setStudentsList(classroom.students ? [...classroom.students] : []);
      setErrorMessage(null);
      setSuccessNotice(null);
    }
  }, [isOpen, classroom]);

  if (!isOpen) return null;

  // Smart Parser for pasted text
  const parseRawTextToStudents = (text: string): ClassroomStudent[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: ClassroomStudent[] = [];
    let order = 1;

    for (const rawLine of lines) {
      // Skip header lines
      const lower = rawLine.toLowerCase();
      if (
        lower.startsWith('stt') ||
        lower.includes('họ và tên') ||
        lower.includes('mã học sinh') ||
        lower.includes('danh sách học sinh')
      ) {
        continue;
      }

      // Detect separator: Tab, Pipe, Comma, Semicolon
      let parts: string[] = [];
      if (rawLine.includes('\t')) {
        parts = rawLine.split('\t').map((p) => p.trim());
      } else if (rawLine.includes('|')) {
        parts = rawLine.split('|').map((p) => p.trim());
      } else if (rawLine.includes(';') || (rawLine.includes(',') && !rawLine.match(/\d+,\d+/))) {
        parts = rawLine.split(/[;,]/).map((p) => p.trim());
      } else {
        // Plain text: possibly "1. Nguyễn Văn A" or just "Nguyễn Văn A"
        parts = [rawLine];
      }

      parts = parts.filter((p) => p.length > 0);
      if (parts.length === 0) continue;

      let name = '';
      let gender: 'Nam' | 'Nữ' = 'Nam';
      let dob = '2007-05-15';
      let phone = '';
      let cluster: 'muinhon' | 'antoan' | 'nguyco' = 'antoan';
      let notes = '';

      // If parts has STT as first part
      let startIndex = 0;
      if (/^\d+[\.\/\-]?$/.test(parts[0])) {
        startIndex = 1;
      }

      // Name is usually the first non-numeric part
      if (parts[startIndex]) {
        name = parts[startIndex].replace(/^\d+[\.\-\s]+/, '').trim();
      } else {
        continue;
      }

      // Check remaining tokens
      const remaining = parts.slice(startIndex + 1);
      for (const tok of remaining) {
        const tLower = tok.toLowerCase();
        // Check gender
        if (tLower === 'nữ' || tLower === 'nu' || tLower === 'female' || tLower === 'f') {
          gender = 'Nữ';
        } else if (tLower === 'nam' || tLower === 'male' || tLower === 'm') {
          gender = 'Nam';
        }
        // Check DOB
        else if (/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/.test(tok)) {
          dob = tok;
        }
        // Check Phone
        else if (/^0\d{8,10}$/.test(tok.replace(/\s+/g, ''))) {
          phone = tok.replace(/\s+/g, '');
        }
        // Check Cluster
        else if (
          tLower.includes('nguy cơ') ||
          tLower.includes('nguyco') ||
          tLower.includes('liệt') ||
          tLower.includes('hạt mầm') ||
          tLower.includes('yếu')
        ) {
          cluster = 'nguyco';
        } else if (
          tLower.includes('mũi nhọn') ||
          tLower.includes('muinhon') ||
          tLower.includes('giỏi') ||
          tLower.includes('sứ giả') ||
          tLower.includes('hoa') ||
          tLower.includes('trái')
        ) {
          cluster = 'muinhon';
        } else if (tLower.includes('an toàn') || tLower.includes('antoan') || tLower.includes('khá')) {
          cluster = 'antoan';
        } else {
          // Additional notes
          if (!notes) {
            notes = tok;
          } else {
            notes += `, ${tok}`;
          }
        }
      }

      // Default notes if empty
      if (!notes) {
        if (cluster === 'nguyco') notes = 'Cần hỗ trợ chống liệt, rèn Casio và 20 câu đầu';
        else if (cluster === 'muinhon') notes = 'Sứ giả Hạnh phúc, phát huy giải toán vận dụng';
        else notes = 'Học lực an toàn, chuyên cần tốt';
      }

      const stdCode = `HV123${order.toString().padStart(2, '0')}`;
      parsed.push({
        id: `HV_${Date.now()}_${order}`,
        studentCode: stdCode,
        name,
        gender,
        dob,
        phone: phone || `0984${Math.floor(100000 + Math.random() * 900000)}`,
        cluster,
        assignedTeacher: classroom.homeroomTeacher || 'Nguyễn Văn Tâm (GVCN)',
        notes,
      });

      order++;
    }

    return parsed;
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) {
      setErrorMessage('Vui lòng dán văn bản danh sách học sinh vào ô bên dưới');
      return;
    }
    try {
      const results = parseRawTextToStudents(pasteText);
      if (results.length === 0) {
        setErrorMessage('Không nhận diện được học sinh nào từ văn bản đã dán. Vui lòng kiểm tra định dạng.');
        return;
      }
      setStudentsList(results);
      setErrorMessage(null);
      setSuccessNotice(`Đã nhận diện thành công ${results.length} học sinh! Bạn có thể xem và chỉnh sửa ở tab "Chỉnh sửa danh sách".`);
      setActiveTab('editor');
    } catch (err: any) {
      setErrorMessage(`Lỗi phân tích: ${err.message || 'Không thể đọc dữ liệu'}`);
    }
  };

  // Handle Excel or Word File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!json || json.length === 0) {
          throw new Error('File Excel rỗng, không có dữ liệu');
        }

        // Convert rows to text lines and parse
        const lines: string[] = [];
        for (const row of json) {
          if (Array.isArray(row) && row.some((cell) => cell !== undefined && cell !== '')) {
            lines.push(row.map((cell) => (cell !== undefined ? String(cell).trim() : '')).join('\t'));
          }
        }

        const results = parseRawTextToStudents(lines.join('\n'));
        if (results.length === 0) {
          throw new Error('Không bóc tách được danh sách học viên từ file Excel');
        }

        setStudentsList(results);
        setSuccessNotice(`Đã nạp thành công ${results.length} học viên từ file "${file.name}"!`);
        setActiveTab('editor');
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const extracted = await mammoth.extractRawText({ arrayBuffer });
        const text = extracted.value || '';
        const results = parseRawTextToStudents(text);

        if (results.length === 0) {
          throw new Error('Không bóc tách được danh sách học viên từ file Word');
        }

        setStudentsList(results);
        setSuccessNotice(`Đã nạp thành công ${results.length} học viên từ file Word "${file.name}"!`);
        setActiveTab('editor');
      } else {
        throw new Error('Định dạng file không hỗ trợ. Vui lòng chọn .xlsx, .xls, .csv hoặc .docx');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi đọc file');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // Clear all students to start clean
  const handleClearList = () => {
    setStudentsList([]);
    setPasteText('');
    setSuccessNotice('Đã làm trống danh sách! Bây giờ bạn có thể dán hoặc tải file danh sách mới.');
    setErrorMessage(null);
  };

  // Load Preset Reference (Optional)
  const handleLoadPreset12A3 = () => {
    setStudentsList(PRESET_12A3_STUDENTS);
    setSuccessNotice(`Đã nạp danh sách mẫu tham khảo 20 học viên (GDNN - GDTX Ba Tri)!`);
    setErrorMessage(null);
    setActiveTab('editor');
  };

  // Editor Actions
  const handleUpdateStudent = (index: number, field: keyof ClassroomStudent, value: any) => {
    setStudentsList((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  };

  const handleRemoveStudent = (index: number) => {
    setStudentsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddNewRow = () => {
    const nextOrder = studentsList.length + 1;
    const newStudent: ClassroomStudent = {
      id: `HV_${Date.now()}_${nextOrder}`,
      studentCode: `HV123${nextOrder.toString().padStart(2, '0')}`,
      name: `Học viên mới ${nextOrder}`,
      gender: 'Nam',
      dob: '2007-05-15',
      phone: `0984${Math.floor(100000 + Math.random() * 900000)}`,
      cluster: 'antoan',
      assignedTeacher: classroom.homeroomTeacher || 'Nguyễn Văn Tâm (GVCN)',
      notes: 'Học lực an toàn, tham gia học đều đặn',
    };
    setStudentsList((prev) => [...prev, newStudent]);
  };

  // Confirm replacement
  const handleConfirm = () => {
    if (studentsList.length === 0) {
      setErrorMessage('Danh sách không được để trống. Hãy nhập ít nhất 1 học viên.');
      return;
    }

    onConfirmReplace(studentsList, { syncHappyTree, syncAttendance });
    onClose();
  };

  const muinhonCount = studentsList.filter((s) => s.cluster === 'muinhon').length;
  const antoanCount = studentsList.filter((s) => s.cluster === 'antoan').length;
  const nguycoCount = studentsList.filter((s) => s.cluster === 'nguyco').length;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center space-x-2">
                <span>Thay Thế Danh Sách Học Viên Lớp {classroom.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/30">
                  Tự động khớp mục
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Hỗ trợ dán trực tiếp từ Excel / Word, tải file hoặc chỉnh sửa nhanh • Tự động phân nhóm chống liệt DBSCAN & Cây Hạnh Phúc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS & STATS */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>1. Dán văn bản / Excel</span>
            </button>

            <button
              onClick={() => setActiveTab('file')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'file'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>2. Tải File Excel / Word</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>3. Bảng học sinh ({studentsList.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {studentsList.length > 0 && (
              <button
                type="button"
                onClick={handleClearList}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[11px] font-bold flex items-center space-x-1 transition"
                title="Làm trống toàn bộ danh sách để bắt đầu dán danh sách mới"
              >
                <Trash2 className="w-3 h-3 text-rose-600" />
                <span>Xóa làm mới</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLoadPreset12A3}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-bold flex items-center space-x-1 transition"
              title="Xem hoặc nạp thử danh sách mẫu tham khảo"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Mẫu tham khảo</span>
            </button>
          </div>
        </div>

        {/* NOTICES */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successNotice && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successNotice}</div>
          </div>
        )}

        {/* BODY CONTENT */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <ClipboardPaste className="w-4 h-4 text-blue-600" />
                  <span>Dán nội dung danh sách (từ Excel, Word, Google Sheets hoặc tin nhắn):</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Tự động nhận diện Họ tên, Ngày sinh, Giới tính, SĐT, Phân nhóm
                </span>
              </div>

              <textarea
                rows={10}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Ví dụ sao chép các dòng từ Excel hoặc bảng Word:\n1	Võ Thị Kiều Thơ	Nữ	15/04/2007	0984123001	nguyco	Rèn Casio\n2	Huỳnh Thị Tiền	Nữ	20/09/2007	0984123002	nguyco	Rèn 12 câu P1\n3	Nguyễn Thế Vinh	Nam	12/03/2007	0984123003	muinhon	Sứ giả Hạnh phúc\n4	Nguyễn Ngọc Thảo Như	Nữ	08/11/2007	0984123004	muinhon	Kèm Kiều Thơ\n...\nHoặc đơn giản là danh sách họ tên mỗi dòng 1 người!`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span>Hệ thống tự nhận diện cột cách nhau bởi dấu Tab, dấu phẩy, gạch đứng | hoặc xuống dòng.</span>
                </div>

                <button
                  type="button"
                  onClick={handleParsePaste}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Phân Tích & Chuyển Sang Bảng</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center transition bg-slate-50/70 hover:bg-blue-50/40">
                <input
                  type="file"
                  id="student-file-input"
                  accept=".xlsx, .xls, .csv, .docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="student-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-800 block">
                      Chọn file Excel (.xlsx, .xls, .csv) hoặc Word (.docx)
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Kéo thả file vào đây hoặc bấm để duyệt từ máy tính
                    </span>
                  </div>
                  <span className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                    Chọn File Danh Sách
                  </span>
                </label>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center space-x-2 text-xs text-blue-700 font-bold py-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang đọc và phân tích cấu trúc dữ liệu...</span>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <p className="font-bold text-slate-800">Cấu trúc file khuyên dùng:</p>
                <p>• <b>Cột 1:</b> STT hoặc Mã học viên</p>
                <p>• <b>Cột 2:</b> Họ và tên học sinh / học viên</p>
                <p>• <b>Cột 3:</b> Giới tính (Nam / Nữ)</p>
                <p>• <b>Cột 4:</b> Ngày sinh (dd/mm/yyyy)</p>
                <p>• <b>Cột 5:</b> Số điện thoại</p>
                <p>• <b>Cột 6:</b> Phân loại năng lực (Mũi nhọn, An toàn, Nguy cơ) hoặc Ghi chú bồi dưỡng</p>
              </div>
            </div>
          )}

          {/* TAB 3: TABLE EDITOR */}
          {activeTab === 'editor' && (
            <div className="space-y-3">
              {/* SUMMARY BADGES */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-700">Tổng cộng: {studentsList.length} học viên</span>
                  <span className="text-slate-300">|</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    🌟 Mũi nhọn: {muinhonCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                    🛡️ An toàn: {antoanCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
                    ⚠️ Nguy cơ: {nguycoCount}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddNewRow}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm dòng</span>
                </button>
              </div>

              {/* TABLE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2 px-2.5 w-10 text-center">STT</th>
                      <th className="py-2 px-2.5 w-20">Mã HV</th>
                      <th className="py-2 px-2.5">Họ và tên</th>
                      <th className="py-2 px-2.5 w-16 text-center">Giới tính</th>
                      <th className="py-2 px-2.5 w-24">Ngày sinh</th>
                      <th className="py-2 px-2.5 w-28 text-center">Phân nhóm</th>
                      <th className="py-2 px-2.5">Ghi chú bồi dưỡng</th>
                      <th className="py-2 px-2.5 w-10 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {studentsList.map((st, idx) => (
                      <tr key={st.id || idx} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-2.5 text-center text-slate-500 font-bold">{idx + 1}</td>
                        <td className="py-2 px-2.5">
                          <input
                            type="text"
                            value={st.studentCode}
                            onChange={(e) => handleUpdateStudent(idx, 'studentCode', e.target.value)}
                            className="w-full font-mono font-bold text-blue-700 bg-transparent border-b border-transparent focus:border-blue-400 outline-hidden py-0.5"
                          />
                        </td>
                        <td className="py-2 px-2.5">
                          <input
                            type="text"
                            value={st.name}
                            onChange={(e) => handleUpdateStudent(idx, 'name', e.target.value)}
                            className="w-full font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-blue-400 outline-hidden py-0.5"
                          />
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <select
                            value={st.gender}
                            onChange={(e) => handleUpdateStudent(idx, 'gender', e.target.value as any)}
                            className="bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 text-xs"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                          </select>
                        </td>
                        <td className="py-2 px-2.5">
                          <input
                            type="text"
                            value={st.dob}
                            onChange={(e) => handleUpdateStudent(idx, 'dob', e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full text-slate-600 bg-transparent border-b border-transparent focus:border-blue-400 outline-hidden py-0.5 font-mono text-[11px]"
                          />
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <select
                            value={st.cluster}
                            onChange={(e) => handleUpdateStudent(idx, 'cluster', e.target.value as any)}
                            className={`rounded px-1.5 py-0.5 font-bold text-[11px] border ${
                              st.cluster === 'muinhon'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : st.cluster === 'nguyco'
                                ? 'bg-red-50 text-red-800 border-red-300'
                                : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            <option value="muinhon">🌟 Mũi nhọn</option>
                            <option value="antoan">🛡️ An toàn</option>
                            <option value="nguyco">⚠️ Nguy cơ</option>
                          </select>
                        </td>
                        <td className="py-2 px-2.5">
                          <input
                            type="text"
                            value={st.notes || ''}
                            onChange={(e) => handleUpdateStudent(idx, 'notes', e.target.value)}
                            placeholder="Kế hoạch phụ đạo..."
                            className="w-full text-slate-600 bg-transparent border-b border-transparent focus:border-blue-400 outline-hidden py-0.5 text-[11px]"
                          />
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                            title="Xóa học sinh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SYNC OPTIONS */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
            <span className="font-bold text-xs text-amber-900 block flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Tự động đồng bộ các mục liên kết toàn hệ thống:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={syncHappyTree}
                  onChange={(e) => setSyncHappyTree(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <span className="font-medium">
                  Đồng bộ sang <b>Cây Hạnh Phúc (Happy Tree)</b>
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={syncAttendance}
                  onChange={(e) => setSyncAttendance(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <span className="font-medium">
                  Cập nhật <b>Danh sách điểm danh</b> hôm nay
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Sẽ thay thế <b>{classroom.students.length}</b> học viên cũ bằng <b>{studentsList.length}</b> học viên mới cho lớp <b>{classroom.name}</b>.
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs transition"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition"
            >
              <FileCheck className="w-4 h-4" />
              <span>Xác Nhận Thay Thế ({studentsList.length} Học Viên)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
