import React, { useState } from 'react';
import {
  X,
  User,
  FileText,
  Save,
  Printer,
  FileDown,
  Award,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  Building,
  BookOpen,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { exportToWordDocument } from '../services/aiService';

export interface UserProfileData {
  name: string;
  role: string;
  degree: string;
  subject: string;
  email: string;
  phone: string;
  department: string;
  school: string;
  joinedYear: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileData;
  onSaveProfile: (updated: UserProfileData) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'report'>('info');
  const [formData, setFormData] = useState<UserProfileData>(profile);
  const [isSavedAlert, setIsSavedAlert] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  const handleExportPersonalReport = () => {
    const reportHtml = `
      <div style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.6;">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="width: 45%; text-align: center; border: none;">
              <b>${formData.school.toUpperCase()}</b><br/>
              <b>${formData.department.toUpperCase()}</b><br/>
              <hr style="width: 120px; border-top: 1px solid black; margin: 4px auto;"/>
            </td>
            <td style="width: 55%; text-align: center; border: none;">
              <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/>
              <b>Độc lập - Tự do - Hạnh phúc</b>
              <hr style="width: 160px; border-top: 1px solid black; margin: 4px auto;"/>
            </td>
          </tr>
        </table>

        <h2 style="text-align: center; margin-top: 25px; text-transform: uppercase;">
          BÁO CÁO CÔNG TÁC CHUYÊN MÔN CÁ NHÂN<br/>
          <span style="font-size: 13pt; font-weight: normal;">HỌC KỲ I - NĂM HỌC 2026 - 2027</span>
        </h2>

        <h3>I. Thông tin giáo viên:</h3>
        <p>- <b>Họ và tên:</b> ${formData.name}</p>
        <p>- <b>Chức vụ / Phân quyền:</b> ${formData.role}</p>
        <p>- <b>Trình độ chuyên môn:</b> ${formData.degree}</p>
        <p>- <b>Môn giảng dạy:</b> ${formData.subject}</p>
        <p>- <b>Tổ chuyên môn:</b> ${formData.department} - ${formData.school}</p>

        <h3>II. Kết quả thực hiện nhiệm vụ giảng dạy (CV 5512):</h3>
        <p>- Thực hiện đúng, đủ phân phối chương trình môn ${formData.subject} Khối 12: 54/54 tiết học kỳ I.</p>
        <p>- 100% kế hoạch bài dạy soạn theo mẫu CV 5512/BGDĐT-GDTrH, ứng dụng Geogebra và PowerPoint.</p>
        <p>- Tham gia 04 buổi sinh hoạt chuyên môn theo nghiên cứu bài học (chủ trì 03 buổi).</p>

        <h3>III. Công tác bồi dưỡng & Phụ đạo học sinh chống liệt:</h3>
        <p>- Trực tiếp phụ trách phụ đạo 03 học sinh nhóm nguy cơ điểm liệt lớp 12A1: Dương Văn Khang, Bùi Gia Huy, Võ Minh Quân.</p>
        <p>- Triển khai thành công mô hình "Đôi bạn cùng tiến", cấp phát 20 phiếu nhận biết/tuần.</p>
        <p>- Kết quả khảo sát đợt 1: 100% học sinh phụ trách đã vượt ngưỡng 2.0 điểm, không có học sinh bị điểm 0.</p>

        <h3>IV. Tự đánh giá chuẩn nghề nghiệp giáo viên (TEMIS - TT 20/2018):</h3>
        <p>- <b>Xếp loại chung:</b> MỨC TỐT (15/15 Tiêu chí đạt Mức Tốt)</p>
        <p>- Tiêu chuẩn 1 (Phẩm chất nhà giáo): Đạt Tốt (Tiêu chí 1, 2)</p>
        <p>- Tiêu chuẩn 2 (Chuyên môn nghiệp vụ): Đạt Tốt (Tiêu chí 3, 4, 5, 6, 7)</p>
        <p>- Tiêu chuẩn 3 (Môi trường giáo dục): Đạt Tốt (Tiêu chí 8, 9, 10)</p>
        <p>- Tiêu chuẩn 4 (Mối quan hệ XH): Đạt Tốt (Tiêu chí 11, 12, 13)</p>
        <p>- Tiêu chuẩn 5 (Ngoại ngữ & CNTT): Đạt Tốt (Tiêu chí 14, 15 - Ứng dụng AI phân tích phổ điểm)</p>

        <table style="width: 100%; border: none; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center; border: none;">
              <b>Ý KIẾN BAN GIÁM ĐỐC</b><br/><br/><br/><br/>
            </td>
            <td style="width: 50%; text-align: center; border: none;">
              <b>GIÁO VIÊN BÁO CÁO</b><br/>
              <i>(Ký và ghi rõ họ tên)</i><br/><br/><br/><br/>
              <b>${formData.name}</b>
            </td>
          </tr>
        </table>
      </div>
    `;
    exportToWordDocument(`Bao_Cao_Ca_Nhan_${formData.name}`, reportHtml);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Hồ Sơ Cá Nhân & Báo Cáo Giáo Viên
              </h3>
              <p className="text-xs text-slate-500">
                {formData.name} • {formData.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Chỉnh Sửa Thông Tin</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'report'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Báo Cáo Cá Nhân & TEMIS</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isSavedAlert && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã cập nhật thông tin tài khoản thành công!</span>
            </div>
          )}

          {activeTab === 'info' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Phân quyền / Chức vụ
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="Giáo viên hướng dẫn">Giáo viên hướng dẫn</option>
                    <option value="Tư vấn tâm lý / GVCN">Tư vấn tâm lý / GVCN</option>
                    <option value="Giáo viên bộ môn">Giáo viên bộ môn</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Học hàm / Học vị
                  </label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="VD: Thạc sĩ Toán học - ĐH Sư Phạm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Môn phụ trách
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Email công vụ
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Số điện thoại / Zalo
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Tổ chuyên môn
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Đơn vị công tác
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thông tin</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Report Summary Card */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-900 text-sm">
                    Báo cáo Kết quả Cá nhân (Học kỳ I 2026 - 2027)
                  </span>
                  <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                    Xếp loại: TỐT
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Đã hoàn thành 54/54 tiết dạy theo CV 5512 môn Toán Khối 12. Trực tiếp kèm cặp 03 học
                  sinh có nguy cơ điểm liệt, tiến độ đạt 100% mục tiêu chuyên môn.
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Tiết giảng dạy
                  </span>
                  <span className="text-lg font-black text-slate-800">54 / 54</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Đạt 100% CV 5512</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Tiêu chí TEMIS
                  </span>
                  <span className="text-lg font-black text-emerald-600">15 / 15</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">12 Tốt, 3 Khá</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Học sinh kèm
                  </span>
                  <span className="text-lg font-black text-blue-600">03 em</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Đã vượt ngưỡng 2đ</span>
                </div>
              </div>

              {/* TEMIS Self-evaluation breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Tổng hợp kết quả 5 Tiêu chuẩn TEMIS (Thông tư 20/2018):</span>
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">TC 1: Phẩm chất nhà giáo</span>
                    <span className="font-bold text-emerald-700">Mức Tốt</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">TC 2: Phát triển chuyên môn, nghiệp vụ</span>
                    <span className="font-bold text-emerald-700">Mức Tốt</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">TC 3: Xây dựng môi trường giáo dục</span>
                    <span className="font-bold text-emerald-700">Mức Tốt</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">TC 4: Quan hệ nhà trường, gia đình và xã hội</span>
                    <span className="font-bold text-emerald-700">Mức Tốt</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">TC 5: Sử dụng ngoại ngữ và ứng dụng CNTT</span>
                    <span className="font-bold text-emerald-700">Mức Tốt</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition flex items-center gap-1"
                >
                  <Printer className="w-4 h-4" />
                  <span>In báo cáo</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPersonalReport}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Xuất Báo Cáo Word</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
