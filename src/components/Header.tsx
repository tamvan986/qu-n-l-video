import React from 'react';
import { Bell, Sparkles, School, GraduationCap, Menu, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  currentRole: string;
  onChangeRole: (role: string) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  currentRole,
  onChangeRole,
  onOpenNotifications,
  onOpenProfile,
  userName = 'Nguyễn Thị Kiều Ân',
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden focus:outline-hidden"
            title="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-xs">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Tâm lý &amp; Thói quen học đường
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
                  THPT Phan Thanh Giản
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Quản lý Video Ngắn · Cây Hạnh Phúc &amp; Phổ Điểm
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Role selector & Profile link */}
          <div className="hidden sm:flex flex-col items-start">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs">
              <span className="text-slate-500 px-2 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                Vai trò:
              </span>
              <select
                value={currentRole}
                onChange={(e) => onChangeRole(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 font-semibold text-teal-800 shadow-2xs focus:outline-hidden cursor-pointer"
              >
                <option value="Giáo viên hướng dẫn">Giáo viên hướng dẫn</option>
                <option value="Tư vấn tâm lý / GVCN">Tư vấn tâm lý / GVCN</option>
                <option value="Giáo viên bộ môn">Giáo viên bộ môn</option>
                <option value="Học sinh tự quản">Học sinh tự quản</option>
                <option value="Phụ huynh đồng hành">Phụ huynh đồng hành</option>
              </select>
            </div>
            <button
              type="button"
              onClick={onOpenProfile}
              className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer mt-1 px-0.5 flex items-center gap-1 transition"
              title="Xem hồ sơ cá nhân và báo cáo chuyên môn"
            >
              <User className="w-3.5 h-3.5" />
              <span>Xem hồ sơ cá nhân</span>
            </button>
          </div>

          {/* AI Status badge */}
          <div className="hidden md:flex items-center text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600 animate-pulse" />
            <span>AI Đang Sẵn Sàng</span>
          </div>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Xem thông báo chuyên môn"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User profile avatar */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={onOpenProfile}
              title="Xem hồ sơ cá nhân"
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs ring-2 ring-blue-100 hover:opacity-90 transition cursor-pointer"
            >
              {userName.charAt(0) || 'T'}
            </button>
            <div className="text-left">
              <p
                className="text-xs font-bold text-white leading-none px-1.5 py-0.5 rounded inline-block"
                style={{ backgroundColor: '#915353' }}
              >
                {userName}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{currentRole}</p>
              <button
                type="button"
                onClick={onOpenProfile}
                className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer block mt-1 transition text-left"
              >
                Xem hồ sơ cá nhân
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
