/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ActiveTab, StudentScore } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ShortVideoManagerView } from './components/ShortVideoManagerView';
import { WorkflowWizard } from './components/WorkflowWizard';
import { DashboardView } from './components/DashboardView';
import { ScoreAnalysisView } from './components/ScoreAnalysisView';
import { MeetingMinutesView } from './components/MeetingMinutesView';
import { LessonPlanView } from './components/LessonPlanView';
import { HappyTreeView } from './components/HappyTreeView';
import { UserProfileModal, UserProfileData } from './components/UserProfileModal';
import { SAMPLE_STUDENTS } from './data/mockData';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Clock, Sprout } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<string>('Giáo viên hướng dẫn');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Students list state (syncs when real Excel/CSV file is uploaded)
  const [studentsList, setStudentsList] = useState<StudentScore[]>(SAMPLE_STUDENTS);

  const [userProfile, setUserProfile] = useState<UserProfileData>({
    name: 'Nguyễn Thị Kiều Ân',
    role: 'Giáo viên hướng dẫn',
    degree: 'Thạc sĩ Toán học',
    subject: 'Toán học Khối 12',
    email: 'kieuan787@gmail.com',
    phone: '0987023770',
    department: 'Tổ Toán - Tin - Công nghệ',
    school: 'Trường THPT Phan Thanh Giản',
    joinedYear: '2016',
  });

  const handleRoleChange = (role: string) => {
    setCurrentRole(role);
    setUserProfile((prev) => ({ ...prev, role }));
  };

  const handleSaveProfile = (updated: UserProfileData) => {
    setUserProfile(updated);
    setCurrentRole(updated.role);
  };

  const atRiskCount = studentsList.filter(
    (s) => s.cluster === 'hatmam' || s.cluster === 'nguyco' || s.scoreFinal <= 2.0
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 font-sans">
      <div className="flex flex-1 min-h-screen overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
          riskCount={atRiskCount}
        />

        {/* MAIN APPLICATION CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* HEADER */}
          <Header
            currentRole={currentRole}
            onChangeRole={handleRoleChange}
            onToggleSidebar={() => setIsOpenMobileSidebar(true)}
            onOpenNotifications={() => setIsNotificationOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            userName={userProfile.name}
          />

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'video-psychology' && (
              <ShortVideoManagerView
                onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
                onRewardHappyTree={(points, habitName) => {
                  try {
                    const STORAGE_KEY = 'BA_TRI_HAPPY_TREE_STUDENTS_V1';
                    const saved = localStorage.getItem(STORAGE_KEY);
                    if (saved) {
                      const list = JSON.parse(saved);
                      if (Array.isArray(list) && list.length > 0) {
                        list[0].totalPositiveTicks = (list[0].totalPositiveTicks || 0) + 1;
                        list[0].currentPoints = (list[0].currentPoints || 0) + points;
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
                        window.dispatchEvent(new CustomEvent('happyTreeUpdated', { detail: list }));
                      }
                    }
                  } catch (e) {
                    console.warn('Could not auto-award Happy Tree', e);
                  }
                }}
              />
            )}

            {activeTab === 'happy-tree' && <HappyTreeView />}

            {activeTab === 'score-analysis' && (
              <ScoreAnalysisView
                students={studentsList}
                onUpdateStudents={setStudentsList}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenWorkflow={() => setActiveTab('video-psychology')}
                students={studentsList}
              />
            )}

            {activeTab === 'workflow' && (
              <WorkflowWizard onNavigateToTab={(tab) => setActiveTab(tab)} />
            )}

            {activeTab === 'meeting' && <MeetingMinutesView />}

            {activeTab === 'lesson-plan' && <LessonPlanView />}



            {/* Official Legal & Compliance Footer */}
            <footer className="mt-12 mb-6 text-center text-slate-500 text-xs space-y-2 no-print border-t border-slate-200 pt-6">
              <p className="font-semibold text-slate-700">
                © 2026 - 2027 MINDFUL SCREEN &amp; TÂM LÝ HỌC ĐƯỜNG - Quản lý xem video ngắn hiệu quả, Cây Hạnh Phúc &amp; Phổ điểm học sinh
              </p>
              <p className="text-[11px] text-teal-800 italic bg-teal-50 border border-teal-200 py-1.5 px-4 rounded-full max-w-2xl mx-auto">
                🌱 Phương châm: Xem ít hơn không phải vì bị cấm — mà vì mình chủ động chọn. Dừng 10 giây · Đổi 15 phút · Tự chủ là sức mạnh.
              </p>
            </footer>
          </main>
        </div>
      </div>

      {/* NOTIFICATIONS MODAL */}
      {isNotificationOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">Thông Báo Tâm Lý Học Đường</h3>
              </div>
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-teal-800">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Dừng 10 giây tĩnh tâm</span>
                </div>
                <p className="text-teal-950 mt-1">
                  Đã ghi nhận 85% học sinh áp dụng quy tắc 10 giây trước khi mở ứng dụng video ngắn.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  <span>Nuôi dưỡng Cây Hạnh Phúc</span>
                </div>
                <p className="text-emerald-950 mt-1">
                  Mỗi lần đổi 15 phút (đọc sách, thể thao, nghe nhạc) sẽ tự động tích điểm dưỡng chất cho cây của em.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Tương quan xem khuya &amp; Điểm số</span>
                </div>
                <p className="text-rose-950 mt-1">
                  DBSCAN phát hiện 03 học sinh thức khuya lướt video sau 23:00 có dấu hiệu sa sút phổ điểm khảo sát.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsNotificationOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition cursor-pointer"
            >
              Đã hiểu và đóng
            </button>
          </div>
        </div>
      )}

      {/* USER PROFILE & PERSONAL REPORT MODAL */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}
