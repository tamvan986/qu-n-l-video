import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Users,
  LineChart,
  Award,
  BookOpen,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  CheckSquare,
  Laptop,
  Sprout,
  GraduationCap,
  Clock,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  riskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  riskCount,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Tổng quan Học đường',
      sublabel: 'Bảng chỉ số tổng hợp',
      icon: LayoutDashboard,
      badge: 'Tổng quan',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-400/30 font-bold',
    },
    {
      id: 'video-psychology' as ActiveTab,
      label: 'Quản lý Video Ngắn',
      sublabel: 'Dừng 10s · Đổi 15p · Mã PIN',
      icon: Clock,
      badge: 'Trọng tâm',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-400/30 font-bold',
    },
    {
      id: 'happy-tree' as ActiveTab,
      label: 'Cây Hạnh Phúc',
      sublabel: 'Sức khỏe tinh thần & Thói quen',
      icon: Sprout,
      badge: 'Nuôi dưỡng',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold',
    },
    {
      id: 'score-analysis' as ActiveTab,
      label: 'Phân tích Phổ điểm',
      sublabel: 'DBSCAN & Cụm Cây Hạnh Phúc',
      icon: LineChart,
      badge: riskCount > 0 ? `${riskCount} cảnh báo` : 'Khảo sát',
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-400/30 font-bold',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#001529] text-slate-200 flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand / Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 font-black text-xl tracking-wider">
              MS
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                MINDFUL <span className="text-teal-400">STUDENT</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Tâm lý &amp; Thói quen Video ngắn
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Trọng Tâm Học Đường
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <div className="text-left truncate">
                    <span className="block truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="block text-[10px] text-slate-400 font-normal truncate">
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ml-1.5 whitespace-nowrap ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

        </nav>

        {/* Bottom Educational Guidance Box */}
        <div className="p-3.5 border-t border-slate-800/80 m-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-slate-200">Đổi hành vi thay vì cấm</p>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Dừng 10 giây tĩnh tâm · Đổi 15 phút việc lành mạnh · Nuôi dưỡng Cây Hạnh Phúc &amp; Phục hồi phổ điểm.
              </p>
            </div>
          </div>
        </div>

        {/* Footer status */}
        <div className="px-5 py-2.5 border-t border-slate-800/60 text-slate-500 text-[11px] flex justify-between items-center">
          <span>Tâm lý học đường 2026</span>
          <span className="text-teal-400 font-semibold">Tự chủ là sức mạnh</span>
        </div>
      </aside>
    </>
  );
};
