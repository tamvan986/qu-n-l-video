import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Clock,
  Layers,
  ArrowRight,
  Eye,
  FileCode,
  FileSpreadsheet,
  RefreshCw,
  FolderOpen,
  Laptop,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ExamPaper, ExamSubject, ExamGrade } from '../types';
import {
  extractTextFromFile,
  parseExamFromRawText,
  SAMPLE_DOCUMENT_EXAMS,
  downloadStandardExamTemplate,
  ParseResult,
} from '../services/documentExamParserService';

interface DocumentExamImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportExam: (exam: ExamPaper, launchOnline?: boolean) => void;
}

export const DocumentExamImportModal: React.FC<DocumentExamImportModalProps> = ({
  isOpen,
  onClose,
  onImportExam,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'samples' | 'paste'>('upload');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);

  // Form override values
  const [editTitle, setEditTitle] = useState<string>('');
  const [editSubject, setEditSubject] = useState<ExamSubject>('Toán học');
  const [editGrade, setEditGrade] = useState<ExamGrade>('12');
  const [editDuration, setEditDuration] = useState<number>(90);
  const [editExamCode, setEditExamCode] = useState<string>('301');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process text and update state
  const handleProcessText = (text: string, fileName: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setRawText(text);
    setSelectedFileName(fileName);

    try {
      const result = parseExamFromRawText(text, fileName);
      setParseResult(result);

      if (result.exam) {
        setEditTitle(result.exam.title);
        setEditSubject(result.exam.subject);
        setEditGrade(result.exam.grade);
        setEditDuration(result.exam.durationMinutes);
        setEditExamCode(result.exam.examCode);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể phân tích nội dung tệp.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const extractedText = await extractTextFromFile(file);
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Tệp không chứa văn bản đọc được hoặc định dạng bị mã hóa.');
      }
      handleProcessText(extractedText, file.name);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi đọc file. Vui lòng kiểm tra lại định dạng tệp (.docx, .pdf, .txt).');
      setIsProcessing(false);
    }
  };

  // Handle sample file select
  const handleSelectSample = (sample: (typeof SAMPLE_DOCUMENT_EXAMS)[0]) => {
    handleProcessText(sample.rawText, sample.name);
  };

  // Handle save
  const handleConfirmImport = (launchOnline = false) => {
    if (!parseResult?.exam) return;

    const finalExam: ExamPaper = {
      ...parseResult.exam,
      title: editTitle || parseResult.exam.title,
      subject: editSubject,
      grade: editGrade,
      durationMinutes: editDuration,
      examCode: editExamCode,
    };

    onImportExam(finalExam, launchOnline);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <UploadCloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Tạo Đề Thi Từ File Word (.docx) hoặc PDF (.pdf) Có Sẵn
                </h3>
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Chuẩn 2025
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Tự động bóc tách Phần I (Trắc nghiệm), Phần II (Đúng/Sai), Phần III (Trả lời ngắn) và đưa vào hệ thống thi online
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Tải file từ máy tính (.docx, .pdf)
            </button>
            <button
              onClick={() => setActiveTab('samples')}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'samples'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Chọn file đề mẫu có sẵn (1-Click)
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'paste'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Dán nội dung văn bản đề
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Lỗi xử lý file:</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* TAB 1: Upload from computer */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Template Download & Anti-Error Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-50 via-amber-50/50 to-orange-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        File Mẫu Chuẩn Bộ GD&ĐT 2025 (Để Tải Lên Không Lỗi & Đọc Chuẩn Đáp Án)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                        Khuyên Dùng
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Tải mẫu về máy, sao chép câu hỏi vào file và tải lên để hệ thống nhận diện 100% cấu trúc 3 phần và bảng đáp án.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => downloadStandardExamTemplate('docx')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Mẫu Word (.docx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadStandardExamTemplate('txt')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Mẫu Text (.txt)</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-7 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf,.doc,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto mb-2 bg-white rounded-2xl shadow-md border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-7 h-7 text-blue-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Nhấp để chọn file hoặc kéo thả file Word (.docx) / PDF (.pdf) vào đây
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Hỗ trợ định dạng Microsoft Word (.docx), PDF (.pdf) và Text (.txt). Tự động nhận diện cấu trúc đề thi 3 phần năm 2025.
                </p>
                <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm">
                  <FolderOpen className="w-4 h-4" />
                  Chọn File Từ Máy Tính
                </div>
              </div>

              {/* Format guidelines collapsible */}
              <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowFormatGuide(!showFormatGuide)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <span className="flex items-center gap-2 text-blue-700">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    Hướng dẫn quy chuẩn định dạng để đọc đúng 100% đáp án (3 cách nhận diện)
                  </span>
                  {showFormatGuide ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {showFormatGuide && (
                  <div className="p-4 border-t border-slate-200 bg-white text-xs text-slate-700 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                        <h5 className="font-bold text-blue-900 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          Cách 1: Bảng đáp án cuối file (Chuẩn nhất)
                        </h5>
                        <p className="text-[11px] text-slate-600 mb-2">
                          Thêm mục ở cuối đề, hệ thống sẽ tự động ghép đáp án vào từng câu:
                        </p>
                        <pre className="p-2 bg-white rounded border border-blue-200 text-[10px] font-mono text-slate-800 leading-relaxed overflow-x-auto">
{`BẢNG ĐÁP ÁN:
PHẦN I: 1.A  2.B  3.C  4.D ...
PHẦN II:
Câu 1: a-Đ, b-S, c-Đ, d-S
Câu 2: a-Đ, b-Đ, c-S, d-S
PHẦN III:
Câu 1: 15.5
Câu 2: 3`}
                        </pre>
                      </div>

                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                        <h5 className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Cách 2: Đánh dấu sao (*) hoặc [A]
                        </h5>
                        <p className="text-[11px] text-slate-600 mb-2">
                          Đánh dấu trực tiếp trước phương án đúng:
                        </p>
                        <pre className="p-2 bg-white rounded border border-emerald-200 text-[10px] font-mono text-slate-800 leading-relaxed overflow-x-auto">
{`Câu 1. Giá trị x là:
A. x = 1
*B. x = 2   <-- Đáp án đúng
C. x = 3
D. x = 4

Phần II:
a) Hàm số đồng biến. (Đúng)
b) Tiệm cận đứng x = 1. (Sai)

Phần III:
Đáp số: 24`}
                        </pre>
                      </div>

                      <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                        <h5 className="font-bold text-purple-900 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          Cách 3: Chú thích đáp án / lời giải
                        </h5>
                        <p className="text-[11px] text-slate-600 mb-2">
                          Ghi chú thích rõ ở cuối câu:
                        </p>
                        <pre className="p-2 bg-white rounded border border-purple-200 text-[10px] font-mono text-slate-800 leading-relaxed overflow-x-auto">
{`Câu 1. ...
A. 1  B. 2  C. 3  D. 4
[Đáp án: B]
Lời giải: ...

Phần III:
Câu 1. Tính thể tích khối chóp.
[Đáp án: 12]`}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Sample pre-loaded files */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Chọn ngay một đề thi thực tế đã được chuẩn bị sẵn dưới dạng Word hoặc PDF để kiểm tra chức năng bóc tách tức thì:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {SAMPLE_DOCUMENT_EXAMS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="p-4 bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            sample.fileType.includes('Word')
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {sample.fileType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {sample.size}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {sample.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {sample.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Môn: {sample.subject} - {sample.duration} phút</span>
                      <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Sử dụng đề này <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Paste text directly */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Dán nội dung đề thi từ Word/PDF vào đây:
                </label>
                <button
                  type="button"
                  onClick={() => handleProcessText(rawText, 'Đề thi dán trực tiếp')}
                  disabled={!rawText.trim()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Bóc Tách Nội Dung Đề
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Dán nội dung đề thi vào đây... Ví dụ:&#10;PHẦN I. Câu 1. Cho hàm số y = f(x)...&#10;A. x = 1   B. x = 2   C. x = 3   D. x = 4&#10;PHẦN II. Câu 1. Xét tính đúng sai: a) ... b) ...&#10;PHẦN III. Câu 1. Tính thể tích khối chóp..."
                rows={9}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Parsed Result Preview & Form */}
          {isProcessing && (
            <div className="p-8 text-center bg-blue-50/50 rounded-2xl border border-blue-200">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Đang phân tích cấu trúc văn bản và trích xuất câu hỏi 3 phần...
              </p>
            </div>
          )}

          {parseResult?.exam && !isProcessing && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      Kết quả bóc tách thành công từ: {selectedFileName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Phát hiện: Phần I ({parseResult.part1Count} câu) | Phần II ({parseResult.part2Count} câu) | Phần III ({parseResult.part3Count} câu)
                    </p>
                    {parseResult.hasAnswerKey && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Đã tự động đọc và khớp BẢNG ĐÁP ÁN từ tệp!
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    Sẵn sàng đưa vào ngân hàng đề & thi online
                  </span>
                  {parseResult.hasAnswerKey ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">100% câu hỏi đã có đáp án</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Đáp án từ ký hiệu câu hoặc mặc định</span>
                  )}
                </div>
              </div>

              {/* Editable metadata fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tên Đề Thi:
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Môn Học:
                  </label>
                  <select
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value as ExamSubject)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Tin học">Tin học</option>
                    <option value="Công nghệ">Công nghệ</option>
                    <option value="Vật lí">Vật lí</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Địa lí">Địa lí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Thời Gian:
                  </label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value, 10) || 90)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Mã Đề Thi:
                  </label>
                  <input
                    type="text"
                    value={editExamCode}
                    onChange={(e) => setEditExamCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sample preview of extracted questions */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  Xem Trước Một Số Câu Hỏi Đã Trích Xuất:
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                  {parseResult.exam.part1.slice(0, 2).map((q) => (
                    <div key={q.id} className="p-2 bg-slate-50 rounded-lg">
                      <span className="font-bold text-blue-700">Câu {q.order} (Phần I):</span> {q.content}
                      <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] text-slate-600 font-mono">
                        <div>A. {q.options.A}</div>
                        <div>B. {q.options.B}</div>
                        <div>C. {q.options.C}</div>
                        <div>D. {q.options.D}</div>
                      </div>
                    </div>
                  ))}
                  {parseResult.exam.part2.slice(0, 1).map((q) => (
                    <div key={q.id} className="p-2 bg-indigo-50/50 rounded-lg">
                      <span className="font-bold text-indigo-700">Câu {q.order} (Phần II Đúng/Sai):</span> {q.mainStem}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Đề nhập từ Word/PDF có thể hoán vị mã đề, xuất LaTeX TikZ và thi online trực tiếp.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!parseResult?.exam}
              onClick={() => handleConfirmImport(false)}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              Lưu Đề Vào Ngân Hàng
            </button>
            <button
              type="button"
              disabled={!parseResult?.exam}
              onClick={() => handleConfirmImport(true)}
              className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Laptop className="w-4 h-4" />
              Lưu & Vào Thi Online Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
