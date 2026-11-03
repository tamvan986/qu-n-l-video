import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Square,
  Copy,
  Mail,
  Download,
  Upload,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  Smile,
  Meh,
  Frown,
  Brain,
  HelpCircle,
  FileSpreadsheet,
  Check,
  Flame,
  ArrowRight,
  TrendingDown,
  Moon,
  Trash2,
  Settings,
  Heart,
  Sprout,
  Info,
} from 'lucide-react';
import { StudentVideoRecord, VideoLogItem, VideoSwapItem, VideoReflectionItem, VideoChallengeState, MindfulJournalEntry } from '../types';

interface ShortVideoManagerViewProps {
  onNavigateTab?: (tab: string) => void;
  onRewardHappyTree?: (points: number, habitName: string) => void;
}

const STORE_KEY = 'qvn-hieu-qua-v1';

const TRIGGERS = [
  'Buồn chán',
  'Căng thẳng / mệt',
  'Thói quen, tay tự mở',
  'Bạn bè gửi link',
  'Chờ đợi / rảnh tay',
  'Khó ngủ',
];

const MOODS = [
  'Vui',
  'Bình thường',
  'Mệt',
  'Buồn',
  'Lo lắng',
  'Hào hứng',
];

const SLOTS = ['Sáng', 'Trưa', 'Chiều', 'Tối', 'Sau giờ đi ngủ'];

const SWAPS = [
  'Đọc 15 phút',
  'Đi bộ / vận động',
  'Nghe 3 bài nhạc',
  'Vẽ / viết nhật ký',
  'Dọn bàn học',
  'Gọi điện cho bạn',
];

function hashPin(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return 'h' + (h >>> 0).toString(36);
}

function validPin(s: string): boolean {
  return /^\d{4,6}$/.test(s);
}

function newId(): string {
  return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  const da = ('0' + d.getDate()).slice(-2);
  return `${y}-${m}-${da}`;
}

function todayStr(): string {
  return dateStr(new Date());
}

function dayLabel(ds: string): string {
  const d = new Date(ds + 'T12:00:00');
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

function fmtDateVN(ds: string): string {
  return ds.split('-').reverse().join('/');
}

function encodeData(obj: any): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  } catch (e) {
    return '';
  }
}

function decodeData(code: string): any {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(String(code).trim().replace(/\s+/g, '')))));
  } catch (e) {
    return null;
  }
}

function createBlankRecord(): StudentVideoRecord {
  return {
    id: newId(),
    profile: {
      name: '',
      className: '',
      limit: 45,
      bedtime: '22:00',
      pinHash: '',
    },
    logs: [],
    swaps: [],
    reflections: [],
    journalEntries: [],
    challenge: null,
    demo: false,
  };
}

export const ShortVideoManagerView: React.FC<ShortVideoManagerViewProps> = ({
  onNavigateTab,
  onRewardHappyTree,
}) => {
  // Main view mode: 'student' | 'teacher' | 'why'
  const [activeRole, setActiveRole] = useState<'student' | 'teacher' | 'why'>('student');

  // Persistence store
  const [profiles, setProfiles] = useState<StudentVideoRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Gate dialog states
  const [isGateOpen, setIsGateOpen] = useState<boolean>(true);
  const [gateSelectedId, setGateSelectedId] = useState<string | null>(null);
  const [gatePinInput, setGatePinInput] = useState<string>('');
  const [gateError, setGateError] = useState<string>('');
  const [pendingForgetId, setPendingForgetId] = useState<string | null>(null);
  const [pendingForgetNote, setPendingForgetNote] = useState<string>('');
  const [pendingWipeNote, setPendingWipeNote] = useState<string>('');
  const [isSettingInitialPin, setIsSettingInitialPin] = useState<boolean>(false);
  const [gateNewPin, setGateNewPin] = useState<string>('');
  const [gateNewPin2, setGateNewPin2] = useState<string>('');

  // Create profile form
  const [gcName, setGcName] = useState<string>('');
  const [gcClass, setGcClass] = useState<string>('');
  const [gcLimit, setGcLimit] = useState<number>(45);
  const [gcBedtime, setGcBedtime] = useState<string>('22:00');
  const [gcPin, setGcPin] = useState<string>('');
  const [gcPin2, setGcPin2] = useState<string>('');
  const [gcError, setGcError] = useState<string>('');
  const [gcDupNotice, setGcDupNotice] = useState<string>('');

  // Profile Edit Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [pfName, setPfName] = useState<string>('');
  const [pfClass, setPfClass] = useState<string>('');
  const [pfLimit, setPfLimit] = useState<number>(45);
  const [pfBedtime, setPfBedtime] = useState<string>('22:00');
  const [pfCurrentPin, setPfCurrentPin] = useState<string>('');
  const [pfNewPin, setPfNewPin] = useState<string>('');
  const [pfNewPin2, setPfNewPin2] = useState<string>('');
  const [pfError, setPfError] = useState<string>('');
  const [showDeleteArea, setShowDeleteArea] = useState<boolean>(false);
  const [pfDeletePin, setPfDeletePin] = useState<string>('');
  const [pfDeleteError, setPfDeleteError] = useState<string>('');

  // Active student record in memory
  const currentRecord = useMemo<StudentVideoRecord>(() => {
    const found = profiles.find((p) => p.id === activeId);
    return found || createBlankRecord();
  }, [profiles, activeId]);

  // Selected chips in student form
  const [selectedSlot, setSelectedSlot] = useState<string>('Tối');
  const [selectedTrigger, setSelectedTrigger] = useState<string>('Buồn chán');
  const [selectedMood, setSelectedMood] = useState<string>('Bình thường');
  const [selectedSwapActivity, setSelectedSwapActivity] = useState<string>(SWAPS[0]);
  const [pauseTrigger, setPauseTrigger] = useState<string>('Buồn chán');

  // 10-second Pause state
  const [pauseStep, setPauseStep] = useState<'countdown' | 'question'>('countdown');
  const [pauseSecondsLeft, setPauseSecondsLeft] = useState<number>(10);
  const [isPauseCounting, setIsPauseCounting] = useState<boolean>(false);
  const [pauseIntendedMinutes, setPauseIntendedMinutes] = useState<number>(15);
  const pauseIntervalRef = useRef<any>(null);

  // Watch timer countdown
  const [isWatchingWithTimer, setIsWatchingWithTimer] = useState<boolean>(false);
  const [watchTimerSecondsLeft, setWatchTimerSecondsLeft] = useState<number>(0);
  const [watchTimerTotalSeconds, setWatchTimerTotalSeconds] = useState<number>(0);
  const [watchTimerNotice, setWatchTimerNotice] = useState<string>('');
  const watchTimerIntervalRef = useRef<any>(null);

  // 15-minute Swap timer
  const [isSwapTimerActive, setIsSwapTimerActive] = useState<boolean>(false);
  const [swapTimerSecondsLeft, setSwapTimerSecondsLeft] = useState<number>(15 * 60);
  const [activeSwapName, setActiveSwapName] = useState<string>(SWAPS[0]);
  const swapTimerIntervalRef = useRef<any>(null);

  // Quick log form
  const [logMinutes, setLogMinutes] = useState<string>('');
  const [logPlatform, setLogPlatform] = useState<string>('TikTok');
  const [logNote, setLogNote] = useState<string>('');
  const [logStoppedOnTime, setLogStoppedOnTime] = useState<boolean>(false);
  const [logError, setLogError] = useState<string>('');

  // Challenge selection
  const [challengeSelect, setChallengeSelect] = useState<'less10' | 'nolatenight' | 'oneswap' | 'pause'>('less10');

  // Evening reflection form
  const [refTrigger, setRefTrigger] = useState<string>('');
  const [refWorked, setRefWorked] = useState<string>('');
  const [refCommit, setRefCommit] = useState<string>('');

  // Mindful journaling
  const [journalEmotion, setJournalEmotion] = useState<string>('');
  const [journalNote, setJournalNote] = useState<string>('');

  // Sharing / Report code state
  const [shareRecipientEmail, setShareRecipientEmail] = useState<string>('');
  const [generatedReportCode, setGeneratedReportCode] = useState<string>('');
  const [shareStatusMessage, setShareStatusMessage] = useState<string>('');
  const fileImportRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toastText, setToastText] = useState<string | null>(null);
  const showToast = (txt: string) => {
    setToastText(txt);
    setTimeout(() => setToastText(null), 3500);
  };

  // Teacher / Parent View states
  const [teacherCodesInput, setTeacherCodesInput] = useState<string>('');
  const [classReferenceLimit, setClassReferenceLimit] = useState<number>(45);
  const [classReferenceBedtime, setClassReferenceBedtime] = useState<string>('22:00');
  const [classSettingsStatus, setClassSettingsStatus] = useState<string>('');
  const [aggregatedReports, setAggregatedReports] = useState<any[] | null>(null);
  const [aggregatedStats, setAggregatedStats] = useState<any | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.v === 2 && Array.isArray(parsed.profiles)) {
          setProfiles(parsed.profiles);
          if (parsed.profiles.length > 0) {
            setIsGateOpen(true);
            setIsUnlocked(false);
          }
        }
      }
    } catch (e) {
      console.warn('Error loading short video data', e);
    }
  }, []);

  // Save to LocalStorage whenever profiles update
  const persistStore = (newProfiles: StudentVideoRecord[], curActiveId?: string | null) => {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({
          v: 2,
          profiles: newProfiles,
          activeId: curActiveId !== undefined ? curActiveId : activeId,
        })
      );
    } catch (e) {
      console.error('Error saving store', e);
    }
  };

  // Update current record helper
  const updateCurrentRecord = (updater: (prev: StudentVideoRecord) => StudentVideoRecord) => {
    setProfiles((prev) => {
      const next = prev.map((p) => {
        if (p.id === activeId) {
          return updater(p);
        }
        return p;
      });
      persistStore(next);
      return next;
    });
  };

  // Today calculations
  const todayMinutes = useMemo(() => {
    const today = todayStr();
    return currentRecord.logs
      .filter((l) => l.date === today)
      .reduce((sum, l) => sum + Number(l.minutes || 0), 0);
  }, [currentRecord.logs]);

  const todaySwaps = useMemo(() => {
    const today = todayStr();
    return currentRecord.swaps.filter((s) => s.date === today).length;
  }, [currentRecord.swaps]);

  const todayLate = useMemo(() => {
    const today = todayStr();
    return currentRecord.logs.filter((l) => l.date === today && l.slot === 'Sau giờ đi ngủ').length;
  }, [currentRecord.logs]);

  // Consecutive streak in limit
  const currentStreak = useMemo(() => {
    const limit = currentRecord.profile.limit || 45;
    let streak = 0;
    const cursor = new Date();

    for (let i = 0; i < 30; i++) {
      const ds = dateStr(cursor);
      const dayLogs = currentRecord.logs.filter((l) => l.date === ds);
      const daySwaps = currentRecord.swaps.filter((s) => s.date === ds);
      const hasData = dayLogs.length > 0 || daySwaps.length > 0;

      if (!hasData) {
        if (i === 0) {
          // If no logs yet today, inspect from yesterday
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      }

      const mins = dayLogs.reduce((sum, l) => sum + Number(l.minutes || 0), 0);
      if (mins <= limit) {
        streak++;
      } else {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [currentRecord.logs, currentRecord.swaps, currentRecord.profile.limit]);

  // 7-day average
  const sevenDayAverage = useMemo(() => {
    const daysData: number[] = [];
    for (let j = 6; j >= 0; j--) {
      const d = new Date();
      d.setDate(d.getDate() - j);
      const ds = dateStr(d);
      const dayLogs = currentRecord.logs.filter((l) => l.date === ds);
      if (dayLogs.length > 0) {
        const sum = dayLogs.reduce((acc, l) => acc + Number(l.minutes || 0), 0);
        daysData.push(sum);
      }
    }
    if (daysData.length === 0) return '—';
    const avg = Math.round(daysData.reduce((a, b) => a + b, 0) / daysData.length);
    return `${avg} phút`;
  }, [currentRecord.logs]);

  // Latest reflection commitment
  const latestCommitment = useMemo(() => {
    const today = todayStr();
    const todayRef = currentRecord.reflections.find((r) => r.date === today);
    if (todayRef?.commit) return todayRef.commit;
    const sorted = [...currentRecord.reflections].sort((a, b) => (a.date < b.date ? -1 : 1));
    const last = sorted.pop();
    return last?.commit || null;
  }, [currentRecord.reflections]);

  // 7-day bar chart data
  const chartDays = useMemo(() => {
    const arr = [];
    const maxVal = Math.max(currentRecord.profile.limit || 45, 1);
    let maxFound = maxVal;

    for (let j = 6; j >= 0; j--) {
      const d = new Date();
      d.setDate(d.getDate() - j);
      const ds = dateStr(d);
      const dayMins = currentRecord.logs
        .filter((l) => l.date === ds)
        .reduce((sum, l) => sum + Number(l.minutes || 0), 0);
      maxFound = Math.max(maxFound, dayMins);
      arr.push({
        date: ds,
        label: dayLabel(ds),
        minutes: dayMins,
        isOver: dayMins > (currentRecord.profile.limit || 45),
      });
    }

    return arr.map((item) => ({
      ...item,
      heightPercent: item.minutes === 0 ? 4 : Math.max(8, Math.round((item.minutes / maxFound) * 120)),
    }));
  }, [currentRecord.logs, currentRecord.profile.limit]);

  // Pattern Insight Calculation
  const patternInsight = useMemo(() => {
    const all = currentRecord.logs;
    if (all.length === 0) return null;

    const countBy = (key: keyof VideoLogItem) => {
      const counts: Record<string, number> = {};
      all.forEach((l) => {
        const val = String(l[key] || '');
        if (val) counts[val] = (counts[val] || 0) + 1;
      });
      let best = '—';
      let max = 0;
      Object.keys(counts).forEach((k) => {
        if (counts[k] > max) {
          max = counts[k];
          best = k;
        }
      });
      return `${best} (${max} lần)`;
    };

    const lateTotal = all.filter((l) => l.slot === 'Sau giờ đi ngủ').length;
    const uniqueDays = Array.from(new Set(all.map((l) => l.date)));
    const overDays = uniqueDays.filter((ds) => {
      const mins = all.filter((l) => l.date === ds).reduce((s, l) => s + Number(l.minutes || 0), 0);
      return mins > (currentRecord.profile.limit || 45);
    }).length;

    return {
      topTrigger: countBy('trigger'),
      topSlot: countBy('slot'),
      topPlatform: countBy('platform'),
      lateTotal,
      overDays,
    };
  }, [currentRecord.logs, currentRecord.profile.limit]);

  // Challenge Status Helper
  const challengeEvaluated = useMemo(() => {
    if (!currentRecord.challenge) return null;
    const kind = currentRecord.challenge.kind;
    const start = currentRecord.challenge.start;

    const days = [];
    let passedCount = 0;

    for (let j = 0; j < 7; j++) {
      const d = new Date(start + 'T12:00:00');
      d.setDate(d.getDate() + j);
      const ds = dateStr(d);
      const isToday = ds === todayStr();

      const dayLogs = currentRecord.logs.filter((l) => l.date === ds);
      const dayMins = dayLogs.reduce((s, l) => s + Number(l.minutes || 0), 0);
      const daySwaps = currentRecord.swaps.filter((s) => s.date === ds).length;
      const dayLates = dayLogs.filter((l) => l.slot === 'Sau giờ đi ngủ').length;

      let met = false;
      if (kind === 'nolatenight') {
        met = dayLates === 0 && dayLogs.length > 0;
      } else if (kind === 'oneswap') {
        met = daySwaps >= 1;
      } else if (kind === 'less10') {
        const prev = new Date(ds + 'T12:00:00');
        prev.setDate(prev.getDate() - 1);
        const prevMins = currentRecord.logs
          .filter((l) => l.date === dateStr(prev))
          .reduce((s, l) => s + Number(l.minutes || 0), 0);
        met = dayMins < prevMins || (dayMins === 0 && dayLogs.length > 0);
      } else {
        met = !!(currentRecord.challenge.done && currentRecord.challenge.done[ds]);
      }

      if (met) passedCount++;

      days.push({
        date: ds,
        label: dayLabel(ds),
        isToday,
        minutes: dayMins,
        swaps: daySwaps,
        met,
        checked: !!(currentRecord.challenge.done && currentRecord.challenge.done[ds]),
      });
    }

    const labels: Record<string, string> = {
      less10: 'Giảm 10 phút mỗi ngày so với hôm qua',
      nolatenight: 'Không xem sau giờ đi ngủ',
      oneswap: 'Mỗi ngày 1 lần đổi 15 phút',
      pause: 'Dừng 10 giây trước mỗi lần xem',
    };

    return {
      kind,
      label: labels[kind] || kind,
      startDate: fmtDateVN(start),
      passedCount,
      days,
    };
  }, [currentRecord.challenge, currentRecord.logs, currentRecord.swaps]);

  // Handlers for Gate Screen
  const handleSelectGateProfile = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setGateSelectedId(id);
    setGateError('');
    setPendingForgetId(null);
    setPendingForgetNote('');

    if (!p.profile.pinHash) {
      setIsSettingInitialPin(true);
      setGateNewPin('');
      setGateNewPin2('');
    } else {
      setIsSettingInitialPin(false);
      setGatePinInput('');
    }
  };

  const handleUnlockWithPin = () => {
    const p = profiles.find((x) => x.id === gateSelectedId);
    if (!p) return;
    if (hashPin(gatePinInput.trim()) === p.profile.pinHash) {
      setActiveId(p.id);
      setIsUnlocked(true);
      setIsGateOpen(false);
      persistStore(profiles, p.id);
      showToast(`Chào mừng ${p.profile.name || 'em'} trở lại!`);
    } else {
      setGateError('Mã chưa đúng. Kiểm tra lại — mã chỉ có 4–6 chữ số và chỉ em biết.');
    }
  };

  const handleSetInitialPin = () => {
    const p = profiles.find((x) => x.id === gateSelectedId);
    if (!p) return;
    const a = gateNewPin.trim();
    const b = gateNewPin2.trim();
    if (!validPin(a)) {
      setGateError('Mã riêng phải là 4–6 chữ số.');
      return;
    }
    if (a !== b) {
      setGateError('Hai lần nhập mã chưa khớp nhau.');
      return;
    }

    const updated = profiles.map((item) =>
      item.id === p.id ? { ...item, profile: { ...item.profile, pinHash: hashPin(a) } } : item
    );
    setProfiles(updated);
    setActiveId(p.id);
    setIsUnlocked(true);
    setIsGateOpen(false);
    persistStore(updated, p.id);
    showToast('Đã đặt mã riêng và mở hồ sơ thành công!');
  };

  const handleCreateNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setGcError('');
    setGcDupNotice('');

    const name = gcName.trim();
    const pin = gcPin.trim();
    const pin2 = gcPin2.trim();

    if (!name) {
      setGcError('Vui lòng nhập tên thật của em.');
      return;
    }
    if (!validPin(pin)) {
      setGcError('Mã riêng là bắt buộc: phải là 4–6 chữ số. Không có mã thì không tạo được hồ sơ.');
      return;
    }
    if (pin !== pin2) {
      setGcError('Hai lần nhập mã chưa giống nhau. Hãy nhập lại cả hai ô.');
      return;
    }

    const dup = profiles.some(
      (p) =>
        p.profile.name.toLowerCase() === name.toLowerCase() &&
        (p.profile.className || '').toLowerCase() === gcClass.trim().toLowerCase()
    );
    if (dup) {
      setGcDupNotice(
        'Đã có hồ sơ cùng tên và lớp. Em hãy nhớ mã riêng của mình để mở đúng hồ sơ cá nhân.'
      );
    }

    const newRec: StudentVideoRecord = {
      id: newId(),
      createdAt: Date.now(),
      demo: false,
      profile: {
        name,
        className: gcClass.trim(),
        limit: Math.max(10, Math.min(240, Number(gcLimit) || 45)),
        bedtime: gcBedtime || '22:00',
        pinHash: hashPin(pin),
      },
      logs: [],
      swaps: [],
      reflections: [],
      journalEntries: [],
      challenge: null,
    };

    const nextList = [...profiles, newRec];
    setProfiles(nextList);
    setActiveId(newRec.id);
    setIsUnlocked(true);
    setIsGateOpen(false);
    persistStore(nextList, newRec.id);

    setGcName('');
    setGcClass('');
    setGcPin('');
    setGcPin2('');
    showToast(`Hồ sơ của ${name} đã được tạo an toàn!`);
  };

  const handleForgetProfile = () => {
    const p = profiles.find((x) => x.id === gateSelectedId);
    if (!p) return;
    if (pendingForgetId !== p.id) {
      setPendingForgetId(p.id);
      setPendingForgetNote(
        'Bấm lại một lần nữa để xóa vĩnh viễn hồ sơ này (toàn bộ nhật ký sẽ mất, không khôi phục được). Nếu em nhớ ra mã, hãy nhập mã ở trên thay vì xóa.'
      );
      return;
    }

    const nextList = profiles.filter((x) => x.id !== p.id);
    setProfiles(nextList);
    setGateSelectedId(null);
    setPendingForgetId(null);
    setPendingForgetNote('');
    persistStore(nextList, null);
    showToast('Đã xóa hồ sơ thành công.');
  };

  const handleWipeAll = () => {
    if (!pendingWipeNote) {
      setPendingWipeNote(
        'Bấm lại một lần nữa để xóa vĩnh viễn TẤT CẢ hồ sơ trên máy này. Hành động này không thể hoàn tác!'
      );
      return;
    }
    setProfiles([]);
    setActiveId(null);
    setIsUnlocked(false);
    setPendingWipeNote('');
    try {
      localStorage.removeItem(STORE_KEY);
    } catch (e) {}
    showToast('Đã xóa sạch tất cả hồ sơ trên thiết bị này.');
  };

  // Lock current profile
  const handleLockProfile = () => {
    setIsUnlocked(false);
    setIsGateOpen(true);
    setGateSelectedId(null);
    setGatePinInput('');
  };

  // Demo profile loader
  const handleLoadDemo = () => {
    const today = new Date();
    const dsOff = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return dateStr(d);
    };

    let demoRec = profiles.find((p) => p.demo);
    if (!demoRec) {
      demoRec = {
        id: 'demo-profile',
        createdAt: Date.now(),
        demo: true,
        profile: {
          name: 'Bạn mẫu',
          className: '12A3',
          limit: 45,
          bedtime: '22:00',
          pinHash: hashPin('1234'),
        },
        logs: [
          { id: 1, date: dsOff(6), minutes: 70, platform: 'TikTok', slot: 'Tối', trigger: 'Buồn chán', mood: 'Mệt', note: '', stopped: false },
          { id: 2, date: dsOff(5), minutes: 55, platform: 'YouTube Shorts', slot: 'Tối', trigger: 'Thói quen, tay tự mở', mood: 'Bình thường', note: '', stopped: false },
          { id: 3, date: dsOff(4), minutes: 40, platform: 'TikTok', slot: 'Chiều', trigger: 'Buồn chán', mood: 'Bình thường', note: '', stopped: true },
          { id: 4, date: dsOff(3), minutes: 30, platform: 'Facebook Reels', slot: 'Trưa', trigger: 'Bạn bè gửi link', mood: 'Vui', note: '', stopped: true },
          { id: 5, date: dsOff(2), minutes: 48, platform: 'TikTok', slot: 'Sau giờ đi ngủ', trigger: 'Khó ngủ', mood: 'Mệt', note: '', stopped: false },
          { id: 6, date: dsOff(1), minutes: 35, platform: 'TikTok', slot: 'Tối', trigger: 'Buồn chán', mood: 'Bình thường', note: '', stopped: true },
          { id: 7, date: dsOff(0), minutes: 20, platform: 'TikTok', slot: 'Chiều', trigger: 'Chờ đợi / rảnh tay', mood: 'Bình thường', note: '', stopped: true },
        ],
        swaps: [
          { id: 11, date: dsOff(1), activity: 'Đi bộ / vận động' },
          { id: 12, date: dsOff(0), activity: 'Đọc 15 phút' },
        ],
        reflections: [
          { date: dsOff(1), trigger: 'Buồn chán sau giờ học', worked: 'Hẹn giờ 15 phút', commit: 'Không mở TikTok sau 21:30' },
        ],
        challenge: { kind: 'less10', start: dsOff(6), done: {} },
        journalEntries: [],
      };
      const nextList = [...profiles, demoRec];
      setProfiles(nextList);
      persistStore(nextList, demoRec.id);
    }
    if (demoRec) {
      setActiveId(demoRec.id);
      setIsUnlocked(true);
      setIsGateOpen(false);
      showToast('Đang xem dữ liệu mẫu (Mã PIN: 1234)');
    }
  };

  // 10-Second Pause Action
  const handleStartPause = () => {
    setIsPauseCounting(true);
    setPauseSecondsLeft(10);
    clearInterval(pauseIntervalRef.current);
    pauseIntervalRef.current = setInterval(() => {
      setPauseSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(pauseIntervalRef.current);
          setIsPauseCounting(false);
          setPauseStep('question');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Choice: Watch with timer
  const handleChooseWatchWithTimer = () => {
    const mins = pauseIntendedMinutes || 15;
    const totalSecs = mins * 60;
    setWatchTimerTotalSeconds(totalSecs);
    setWatchTimerSecondsLeft(totalSecs);
    setWatchTimerNotice('');
    setIsWatchingWithTimer(true);

    clearInterval(watchTimerIntervalRef.current);
    watchTimerIntervalRef.current = setInterval(() => {
      setWatchTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(watchTimerIntervalRef.current);
          setWatchTimerNotice('Hết giờ! Hãy dừng lại và ghi số phút thật nhé.');
          try {
            if (navigator.vibrate) navigator.vibrate(200);
          } catch (e) {}
          return 0;
        }
        if (prev === Math.round(totalSecs * 0.2)) {
          setWatchTimerNotice('Còn 20% thời gian em đặt. Chuẩn bị dừng nhé.');
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopWatchTimer = (recordIt: boolean) => {
    clearInterval(watchTimerIntervalRef.current);
    setIsWatchingWithTimer(false);
    setPauseStep('countdown');
    setPauseSecondsLeft(10);

    if (recordIt) {
      const elapsed = Math.max(
        1,
        Math.ceil((watchTimerTotalSeconds - watchTimerSecondsLeft) / 60)
      );
      setLogMinutes(String(elapsed));
      setLogStoppedOnTime(true);
      showToast(`Đã tự động điền ${elapsed} phút vào biểu mẫu ghi chép!`);
    }
  };

  // Choice: Swap 15 minutes
  const handleStartSwapTimer = (activityName?: string) => {
    const act = activityName || selectedSwapActivity;
    setActiveSwapName(act);
    setIsSwapTimerActive(true);
    setSwapTimerSecondsLeft(15 * 60);

    clearInterval(swapTimerIntervalRef.current);
    swapTimerIntervalRef.current = setInterval(() => {
      setSwapTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(swapTimerIntervalRef.current);
          showToast(`Hoàn thành 15 phút đổi: ${act}!`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFinishSwap = () => {
    clearInterval(swapTimerIntervalRef.current);
    setIsSwapTimerActive(false);

    const newSwap: VideoSwapItem = {
      id: Date.now(),
      date: todayStr(),
      activity: activeSwapName,
      durationMinutes: 15,
    };

    updateCurrentRecord((prev) => ({
      ...prev,
      swaps: [...prev.swaps, newSwap],
    }));

    // Award Happy Tree points if hook provided
    if (onRewardHappyTree) {
      onRewardHappyTree(15, `Đổi 15 phút: ${activeSwapName}`);
    }

    showToast(`Ghi nhận thành công 15 phút: ${activeSwapName}! Đã cộng dưỡng chất cho Cây Hạnh Phúc 🌱`);
  };

  const handleCancelSwap = () => {
    clearInterval(swapTimerIntervalRef.current);
    setIsSwapTimerActive(false);
  };

  // Submit Quick Log
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Number(logMinutes);
    if (!mins || mins < 1) {
      setLogError('Nhập số phút đã xem (ít nhất 1 phút).');
      return;
    }
    setLogError('');

    const newLog: VideoLogItem = {
      id: Date.now(),
      date: todayStr(),
      minutes: mins,
      platform: logPlatform,
      slot: selectedSlot,
      trigger: selectedTrigger,
      mood: selectedMood,
      note: logNote.trim(),
      stopped: logStoppedOnTime,
    };

    updateCurrentRecord((prev) => ({
      ...prev,
      logs: [...prev.logs, newLog],
    }));

    setLogMinutes('');
    setLogNote('');
    setLogStoppedOnTime(false);
    showToast(`Đã lưu nhật ký ${mins} phút. Tự chủ là sức mạnh!`);
  };

  const handleSaveJournal = () => {
    if (!journalEmotion || !journalNote) {
      showToast('Vui lòng chọn cảm xúc và ghi chú lại nhé!');
      return;
    }
    const newEntry: MindfulJournalEntry = {
      id: Date.now(),
      date: todayStr(),
      emotion: journalEmotion,
      note: journalNote.trim(),
    };
    updateCurrentRecord((prev) => ({
      ...prev,
      journalEntries: [...prev.journalEntries, newEntry],
    }));
    if (onRewardHappyTree) {
      onRewardHappyTree(10, 'Nhật ký tĩnh tâm');
    }
    setJournalEmotion('');
    setJournalNote('');
    showToast('Đã lưu nhật ký tĩnh tâm và cộng 10 điểm Cây Hạnh Phúc! 🌱');
  };

  const handleDeleteLog = (id: number) => {
    updateCurrentRecord((prev) => ({
      ...prev,
      logs: prev.logs.filter((l) => l.id !== id),
    }));
    showToast('Đã xóa lần ghi.');
  };

  // Start 7-Day Challenge
  const handleStartChallenge = () => {
    const newChallenge: VideoChallengeState = {
      kind: challengeSelect,
      start: todayStr(),
      done: {},
    };
    updateCurrentRecord((prev) => ({
      ...prev,
      challenge: newChallenge,
    }));
    showToast('Đã kích hoạt thử thách 7 ngày mới!');
  };

  const handleToggleChallengeDay = (ds: string, checked: boolean) => {
    updateCurrentRecord((prev) => {
      if (!prev.challenge) return prev;
      return {
        ...prev,
        challenge: {
          ...prev.challenge,
          done: {
            ...(prev.challenge.done || {}),
            [ds]: checked,
          },
        },
      };
    });
  };

  // Submit Evening Reflection
  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    const commit = refCommit.trim();
    if (!commit) return;

    const today = todayStr();
    const newRef: VideoReflectionItem = {
      date: today,
      trigger: refTrigger.trim(),
      worked: refWorked.trim(),
      commit,
    };

    updateCurrentRecord((prev) => ({
      ...prev,
      reflections: [...prev.reflections.filter((r) => r.date !== today), newRef],
    }));

    setRefTrigger('');
    setRefWorked('');
    setRefCommit('');
    showToast('Đã lưu nhìn lại buổi tối và cam kết ngày mai!');
  };

  // Generate Report Code
  const handleMakeReportCode = () => {
    if (currentRecord.logs.length === 0 && currentRecord.swaps.length === 0) {
      setShareStatusMessage(
        'Chưa có dữ liệu nào để tạo mã. Ghi ít nhất một lần xem hoặc một lần đổi trước đã.'
      );
      return;
    }
    const reportData = {
      v: 1,
      name: currentRecord.profile.name,
      className: currentRecord.profile.className,
      limit: currentRecord.profile.limit,
      bedtime: currentRecord.profile.bedtime,
      logs: currentRecord.logs,
      swaps: currentRecord.swaps,
      reflections: currentRecord.reflections,
      challenge: currentRecord.challenge,
    };
    const code = encodeData(reportData);
    setGeneratedReportCode(code);
    setShareStatusMessage(
      `Mã báo cáo an toàn đã tạo — gồm ${currentRecord.logs.length} lần ghi, ${currentRecord.swaps.length} lần đổi.`
    );
  };

  const handleCopyReportCode = () => {
    if (!generatedReportCode) {
      handleMakeReportCode();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedReportCode || '').then(() => {
        showToast('Đã sao chép mã báo cáo vào bộ nhớ tạm!');
      });
    }
  };

  const handleSendReportMail = () => {
    if (!generatedReportCode) handleMakeReportCode();
    const today = fmtDateVN(todayStr());
    const subject = `Báo cáo quản lý video ngắn — ${currentRecord.profile.name || 'Học sinh'} — ${today}`;
    const body = `Kính gửi Thầy/Cô (hoặc Bố/Mẹ),\n\nEm gửi báo cáo tự theo dõi thời gian và tâm lý xem video ngắn của em.\n- Giới hạn mỗi ngày: ${currentRecord.profile.limit} phút\n- Hôm nay đã ghi: ${todayMinutes} phút\n- Lần đổi 15 phút việc tích cực: ${todaySwaps} lần\n- Lần xem khuya: ${todayLate} lần\n\nMã báo cáo đầy đủ (dán vào app ở chế độ Giáo viên & Phụ huynh để xem tổng hợp):\n${generatedReportCode}\n\nEm tự ghi số liệu thật để tự chủ, app không tự đo điện thoại. Em cảm ơn Thầy/Cô và Bố/Mẹ luôn đồng hành!`;

    const mailtoUrl = `mailto:${encodeURIComponent(shareRecipientEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    showToast('Đang mở ứng dụng email trên máy của em...');
  };

  const handleDownloadJSON = () => {
    const reportData = {
      v: 1,
      name: currentRecord.profile.name,
      className: currentRecord.profile.className,
      limit: currentRecord.profile.limit,
      bedtime: currentRecord.profile.bedtime,
      logs: currentRecord.logs,
      swaps: currentRecord.swaps,
      reflections: currentRecord.reflections,
      challenge: currentRecord.challenge,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-ngan-${currentRecord.profile.name || 'hoc-sinh'}-${todayStr()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Đã tải xuống file dữ liệu .json an toàn');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result as string);
        updateCurrentRecord((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            name: obj.name || obj.profile?.name || prev.profile.name,
            className: obj.className || obj.profile?.className || prev.profile.className,
            limit: obj.limit || obj.profile?.limit || prev.profile.limit,
            bedtime: obj.bedtime || obj.profile?.bedtime || prev.profile.bedtime,
          },
          logs: obj.logs || [],
          swaps: obj.swaps || [],
          reflections: obj.reflections || [],
          challenge: obj.challenge || null,
        }));
        showToast('Đã nhập thành công dữ liệu từ file!');
      } catch (err) {
        showToast('File không đúng định dạng JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Profile Edit Save
  const handleSaveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setPfError('');

    if (hashPin(pfCurrentPin.trim()) !== currentRecord.profile.pinHash) {
      setPfError('Mã riêng hiện tại chưa đúng. Không thể lưu thay đổi.');
      return;
    }
    const name = pfName.trim();
    if (!name) {
      setPfError('Tên không được để trống.');
      return;
    }
    const np = pfNewPin.trim();
    const np2 = pfNewPin2.trim();
    if (np || np2) {
      if (!validPin(np)) {
        setPfError('Mã riêng mới phải là 4–6 chữ số. Để trống nếu muốn giữ mã cũ.');
        return;
      }
      if (np !== np2) {
        setPfError('Hai lần nhập mã mới chưa giống nhau.');
        return;
      }
    }

    updateCurrentRecord((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        name,
        className: pfClass.trim(),
        limit: Math.max(10, Math.min(240, Number(pfLimit) || 45)),
        bedtime: pfBedtime || '22:00',
        pinHash: np ? hashPin(np) : prev.profile.pinHash,
      },
    }));

    setIsProfileModalOpen(false);
    showToast('Đã cập nhật hồ sơ & giới hạn thành công!');
  };

  const handleDeleteCurrentProfile = () => {
    if (hashPin(pfDeletePin.trim()) !== currentRecord.profile.pinHash) {
      setPfDeleteError('Mã xác nhận chưa đúng — không thể xóa.');
      return;
    }
    const nextList = profiles.filter((p) => p.id !== currentRecord.id);
    setProfiles(nextList);
    setActiveId(null);
    setIsUnlocked(false);
    setIsProfileModalOpen(false);
    persistStore(nextList, null);
    showToast('Đã xóa vĩnh viễn hồ sơ này.');
  };

  // Teacher / Parent Report Code Aggregation
  const handleAggregateReports = () => {
    const raw = teacherCodesInput.trim();
    if (!raw) {
      showToast('Vui lòng dán ít nhất một mã báo cáo của học sinh.');
      return;
    }
    const lines = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const validReports: any[] = [];
    let badCount = 0;

    lines.forEach((ln) => {
      const obj = decodeData(ln);
      if (obj && Array.isArray(obj.logs)) {
        validReports.push(obj);
      } else {
        badCount++;
      }
    });

    if (validReports.length === 0) {
      showToast('Không đọc được mã nào. Hãy kiểm tra lại mã học sinh gửi.');
      return;
    }

    let totalMin = 0;
    let totalLogs = 0;
    let totalLate = 0;
    let totalSwaps = 0;
    const trigCounts: Record<string, number> = {};

    const rows = validReports.map((r) => {
      const dayMap: Record<string, number> = {};
      r.logs.forEach((l: VideoLogItem) => {
        dayMap[l.date] = (dayMap[l.date] || 0) + Number(l.minutes || 0);
        totalMin += Number(l.minutes || 0);
        totalLogs++;
        if (l.slot === 'Sau giờ đi ngủ') totalLate++;
        if (l.trigger) {
          trigCounts[l.trigger] = (trigCounts[l.trigger] || 0) + 1;
        }
      });
      (r.swaps || []).forEach(() => totalSwaps++);

      const dayVals = Object.values(dayMap);
      const avg = dayVals.length ? Math.round(dayVals.reduce((a, b) => a + b, 0) / dayVals.length) : 0;
      const overDays = dayVals.filter((v) => v > classReferenceLimit).length;
      const lastDayKey = Object.keys(dayMap).sort().pop();
      const lastDayMins = lastDayKey ? dayMap[lastDayKey] : 0;

      return {
        name: r.name || '(Không rõ tên)',
        className: r.className || '—',
        daysWithData: Object.keys(dayMap).length,
        avgMinutesPerDay: avg,
        lastDayMinutes: lastDayMins,
        overDays,
        swapsCount: (r.swaps || []).length,
        isLastWithinLimit: lastDayMins <= classReferenceLimit,
      };
    });

    let topTrigger = '—';
    let maxTriggerCount = 0;
    Object.keys(trigCounts).forEach((k) => {
      if (trigCounts[k] > maxTriggerCount) {
        maxTriggerCount = trigCounts[k];
        topTrigger = k;
      }
    });

    const withinLimitCount = rows.filter((r) => r.isLastWithinLimit).length;

    setAggregatedReports(rows);
    setAggregatedStats({
      totalStudents: validReports.length,
      badCount,
      avgMinsPerStudent: Math.round(totalMin / Math.max(1, validReports.length)),
      withinLimitCount,
      topTrigger,
      topTriggerCount: maxTriggerCount,
      totalSwaps,
      totalLate,
    });
    showToast(`Đã tổng hợp thành công dữ liệu từ ${validReports.length} học sinh!`);
  };

  const handleDownloadTeacherCSV = () => {
    if (!aggregatedReports || aggregatedReports.length === 0) {
      showToast('Vui lòng bấm "Xem tổng hợp" trước khi xuất file CSV.');
      return;
    }
    const header = 'Học sinh,Lớp,Số ngày có dữ liệu,Trung bình/ngày (phút),Ngày gần nhất (phút),Số ngày vượt ngưỡng,Lần đổi 15 phút\n';
    const rows = aggregatedReports
      .map(
        (r) =>
          `"${r.name.replace(/"/g, '""')}","${r.className}",${r.daysWithData},${r.avgMinutesPerDay},${r.lastDayMinutes},${r.overDays},${r.swapsCount}`
      )
      .join('\n');
    const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tong-hop-video-ngan-${todayStr()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Đã tải xuống file CSV tổng hợp cả lớp!');
  };

  // Format timer helper
  const formatTimerDigits = (totalSeconds: number) => {
    const mm = Math.floor(totalSeconds / 60);
    const ss = ('0' + (totalSeconds % 60)).slice(-2);
    return `${mm}:${ss}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastText && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastText}</span>
        </div>
      )}

      {/* TOP BAR / ROLE CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveRole('student')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
              activeRole === 'student'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Học sinh
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('teacher')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
              activeRole === 'teacher'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Giáo viên &amp; Phụ huynh
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('why')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
              activeRole === 'why'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vì sao app này khác?
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          {isUnlocked ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">
                Đang mở hồ sơ: <strong className="text-slate-900">{currentRecord.profile.name || 'Em'}</strong>{' '}
                {currentRecord.profile.className ? `· ${currentRecord.profile.className}` : ''}
              </span>
              <button
                type="button"
                onClick={handleLockProfile}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Khóa / Đổi hồ sơ</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsGateOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Mở hồ sơ của em</span>
            </button>
          )}
        </div>
      </div>

      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="flex items-center gap-2 text-teal-200 text-xs font-semibold mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Quản lý thói quen &amp; tâm lý học đường</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
            Xem ít hơn không phải vì bị cấm — mà vì mình chủ động chọn.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-teal-100/90 leading-relaxed max-w-2xl">
            App này không đếm hộ điện thoại của em, cũng không gửi gì về cho thầy cô khi chưa có phép.
            Nó giúp em dừng lại 10 giây trước khi xem, ghi lại vì sao mình mở video, và đổi 15 phút lướt
            vô thức lấy một việc khác đáng hơn.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                setActiveRole('student');
                document.getElementById('pause-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-teal-900 font-bold text-xs sm:text-sm hover:bg-teal-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-teal-700" />
              <span>Tôi sắp xem video → Dừng 10 giây</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('why')}
              className="px-4 py-2.5 rounded-xl bg-teal-950/40 hover:bg-teal-950/60 text-white font-semibold text-xs sm:text-sm border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-300" />
              <span>Đề xuất của chuyên gia tâm lý</span>
            </button>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('happy-tree')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm border border-emerald-400/40 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sprout className="w-4 h-4 text-emerald-200" />
                <span>Xem Cây Hạnh Phúc của em</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DEMO NOTICE BANNER IF LOADED */}
      {currentRecord.demo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 text-amber-900 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Đang xem <strong>dữ liệu mẫu</strong> để hiểu cách app hoạt động. Mã riêng hồ sơ mẫu là{' '}
              <strong>1234</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={handleLockProfile}
            className="px-3 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 font-bold text-xs shrink-0 cursor-pointer"
          >
            Quay lại chọn hồ sơ thật
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: HỌC SINH (STUDENT)                             */}
      {/* ==================================================== */}
      {activeRole === 'student' && (
        <div className="space-y-6">
          {/* TOP SPLIT: HÔM NAY CỦA EM & DỪNG 10 GIÂY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* HÔM NAY CỦA EM (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold text-slate-900">Hôm nay của em</h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {fmtDateVN(todayStr())} · Sau {currentRecord.profile.bedtime} không xem
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Tự ghi thật, tự kiểm soát — mỗi phút tự chủ là một bước trưởng thành.
                </p>

                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tabular-nums">
                      {todayMinutes}
                    </span>
                    <span className="text-sm font-bold text-slate-600 ml-2">phút đã ghi</span>
                  </div>
                  <div className="text-xs text-right">
                    <span className="text-slate-500">Giới hạn: </span>
                    <strong className="text-slate-900">{currentRecord.profile.limit} phút</strong>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="text-slate-500">Còn lại: </span>
                    <strong
                      className={
                        currentRecord.profile.limit - todayMinutes < 0
                          ? 'text-rose-600 font-bold'
                          : 'text-teal-700 font-bold'
                      }
                    >
                      {Math.max(0, currentRecord.profile.limit - todayMinutes)} phút
                    </strong>
                  </div>
                </div>

                {/* Meter Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3.5 my-3 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      todayMinutes > currentRecord.profile.limit ? 'bg-rose-600' : 'bg-teal-600'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((todayMinutes / Math.max(1, currentRecord.profile.limit)) * 100))}%`,
                    }}
                  />
                </div>

                {/* Today Status Message */}
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    todayMinutes === 0
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : todayMinutes <= currentRecord.profile.limit * 0.5
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : todayMinutes <= currentRecord.profile.limit
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {todayMinutes === 0 && 'Chưa ghi phút nào hôm nay. Tốt — hãy giữ nhịp này.'}
                  {todayMinutes > 0 &&
                    todayMinutes <= currentRecord.profile.limit * 0.5 &&
                    `Đang trong giới hạn, còn ${currentRecord.profile.limit - todayMinutes} phút. Giữ nhịp này đến tối nhé.`}
                  {todayMinutes > currentRecord.profile.limit * 0.5 &&
                    todayMinutes <= currentRecord.profile.limit &&
                    `Sắp chạm giới hạn — còn ${currentRecord.profile.limit - todayMinutes} phút. Dừng 10 giây trước lần xem tiếp theo.`}
                  {todayMinutes > currentRecord.profile.limit &&
                    `Đã vượt giới hạn ${todayMinutes - currentRecord.profile.limit} phút. Không sao — dừng lại bây giờ vẫn là một lần thắng. Ghi lý do và chọn 1 lần đổi 15 phút.`}
                </div>

                {/* 4 KPI STRIP */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Chuỗi trong hạn</span>
                    <strong className="text-base sm:text-lg font-bold text-teal-700">
                      {currentStreak} ngày
                    </strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Đổi 15 phút</span>
                    <strong className="text-base sm:text-lg font-bold text-teal-700">
                      {todaySwaps} lần
                    </strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Lần xem khuya</span>
                    <strong
                      className={`text-base sm:text-lg font-bold ${
                        todayLate > 0 ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      {todayLate} lần
                    </strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Trung bình 7 ngày</span>
                    <strong className="text-base sm:text-lg font-bold text-slate-700">
                      {sevenDayAverage}
                    </strong>
                  </div>
                </div>

                {/* Latest commitment banner */}
                {latestCommitment && (
                  <div className="mt-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700">
                    <span className="font-bold text-teal-800">Cam kết gần nhất:</span> {latestCommitment}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPfName(currentRecord.profile.name);
                    setPfClass(currentRecord.profile.className);
                    setPfLimit(currentRecord.profile.limit);
                    setPfBedtime(currentRecord.profile.bedtime);
                    setPfCurrentPin('');
                    setPfNewPin('');
                    setPfNewPin2('');
                    setPfError('');
                    setShowDeleteArea(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đổi giới hạn / hồ sơ</span>
                </button>
              </div>
            </div>

            {/* DỪNG 10 GIÂY TRƯỚC KHI XEM (5 cols) */}
            <div
              id="pause-section"
              className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">Dừng 10 giây trước khi xem</h2>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">
                  Đừng mở video ngay. Trả lời 2 câu này trước — thường chỉ cần vậy là cơn muốn lướt đã qua.
                </p>

                {pauseStep === 'countdown' && (
                  <div className="text-center py-4 px-2">
                    <div className="w-28 h-28 rounded-full border-4 border-teal-600 flex flex-col items-center justify-center mx-auto shadow-inner bg-teal-50/50">
                      <span className="text-4xl font-extrabold text-teal-900 tabular-nums">
                        {pauseSecondsLeft}
                      </span>
                      <span className="text-[11px] font-semibold text-teal-700 uppercase">giây</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-3 max-w-xs mx-auto">
                      Hít vào sâu... thở ra chậm. Đừng chạm vào ứng dụng video trong lúc này.
                    </p>

                    <button
                      type="button"
                      onClick={handleStartPause}
                      disabled={isPauseCounting}
                      className="mt-4 w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
                    >
                      {isPauseCounting ? 'Đang đếm 10 giây...' : 'Bắt đầu 10 giây tĩnh tâm'}
                    </button>
                  </div>
                )}

                {pauseStep === 'question' && !isWatchingWithTimer && (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Em mở video vì điều gì nhất lúc này?
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {TRIGGERS.map((tr) => (
                          <button
                            key={tr}
                            type="button"
                            onClick={() => setPauseTrigger(tr)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              pauseTrigger === tr
                                ? 'bg-teal-700 text-white border-teal-700'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {tr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Nhật ký tĩnh tâm</label>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {MOODS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setJournalEmotion(m)}
                            className={`px-2 py-1 rounded-md text-[10px] font-medium transition cursor-pointer ${
                              journalEmotion === m ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={journalNote}
                        onChange={(e) => setJournalNote(e.target.value)}
                        placeholder="Cảm xúc của em lúc này..."
                        className="w-full text-xs p-2 rounded-lg border border-slate-200"
                        rows={2}
                      />
                      <button
                        type="button"
                        onClick={handleSaveJournal}
                        className="w-full mt-2 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition cursor-pointer"
                      >
                        Lưu nhật ký & Nhận điểm
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Em định xem bao lâu?
                      </label>
                      <select
                        value={pauseIntendedMinutes}
                        onChange={(e) => setPauseIntendedMinutes(Number(e.target.value))}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value={10}>10 phút</option>
                        <option value={15}>15 phút</option>
                        <option value={20}>20 phút</option>
                        <option value={30}>30 phút</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-bold text-slate-700 block mb-2">
                        Sau 10 giây, em chọn:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleChooseWatchWithTimer}
                          className="py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                        >
                          Xem có hẹn giờ ({pauseIntendedMinutes}p)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPauseStep('countdown');
                            handleStartSwapTimer();
                          }}
                          className="py-2.5 px-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                        >
                          Đổi 15p làm việc khác
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* WATCH TIMER IN PROGRESS */}
                {isWatchingWithTimer && (
                  <div className="border-2 border-amber-400 bg-amber-50/50 rounded-2xl p-4 text-center space-y-3">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                      Đang đếm giờ xem có chủ đích
                    </span>
                    <div className="text-4xl font-black text-amber-900 tabular-nums font-mono">
                      {formatTimerDigits(watchTimerSecondsLeft)}
                    </div>
                    {watchTimerNotice && (
                      <p className="text-xs text-rose-700 font-bold animate-pulse">
                        {watchTimerNotice}
                      </p>
                    )}
                    <div className="flex gap-2 justify-center pt-1">
                      <button
                        type="button"
                        onClick={() => handleStopWatchTimer(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Dừng &amp; ghi nhận số phút
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStopWatchTimer(false)}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECOND SPLIT: GHI NHANH & ĐỔI 15 PHÚT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* GHI NHANH — GHI THẬT (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ghi nhanh — ghi thật, không ghi đẹp</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ghi ngay sau mỗi lần xem. Ghi “vượt giới hạn” cũng là một lần ghi dũng cảm, vì nó cho em thấy điểm cần sửa.
                </p>
              </div>

              <form onSubmit={handleAddLog} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Số phút đã xem *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={logMinutes}
                      onChange={(e) => setLogMinutes(e.target.value)}
                      placeholder="Ví dụ: 25"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-teal-600 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nền tảng</label>
                    <select
                      value={logPlatform}
                      onChange={(e) => setLogPlatform(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      <option>TikTok</option>
                      <option>YouTube Shorts</option>
                      <option>Facebook Reels</option>
                      <option>Instagram Reels</option>
                      <option>Khác</option>
                    </select>
                  </div>
                </div>

                {/* Khung giờ */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Khung giờ xem</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SLOTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          selectedSlot === s
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lý do mở video */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Lý do mở video</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TRIGGERS.map((tr) => (
                      <button
                        key={tr}
                        type="button"
                        onClick={() => setSelectedTrigger(tr)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          selectedTrigger === tr
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tâm trạng lúc đó */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Tâm trạng lúc đó</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMood(m)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          selectedMood === m
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ghi chú ngắn (không bắt buộc)
                  </label>
                  <input
                    type="text"
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="Ví dụ: xem lúc ngồi chờ xe buýt..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-teal-600"
                    maxLength={120}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="stopped-on-time"
                    checked={logStoppedOnTime}
                    onChange={(e) => setLogStoppedOnTime(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <label htmlFor="stopped-on-time" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Em đã dừng đúng lúc mình định dừng
                  </label>
                </div>

                {logError && <p className="text-xs text-rose-600 font-bold">{logError}</p>}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
                >
                  Ghi vào hôm nay
                </button>
              </form>

              {/* Danh sách hôm nay */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Nhật ký hôm nay</span>
                {currentRecord.logs.filter((l) => l.date === todayStr()).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Chưa có lần ghi nào hôm nay. Ghi ngay sau lần xem đầu tiên!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {currentRecord.logs
                      .filter((l) => l.date === todayStr())
                      .slice()
                      .reverse()
                      .map((l) => (
                        <div
                          key={l.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 font-bold text-sm">
                                {l.minutes} phút
                              </strong>
                              <span className="text-slate-400">·</span>
                              <span className="text-teal-800 font-semibold">{l.platform}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-600">{l.slot}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-1.5 items-center">
                              <span>Lý do: {l.trigger}</span>
                              <span>·</span>
                              <span>Tâm trạng: {l.mood}</span>
                              {l.stopped && (
                                <span className="text-emerald-700 font-semibold bg-emerald-100/60 px-1.5 py-0.2 rounded">
                                  ✓ Dừng đúng lúc
                                </span>
                              )}
                              {l.note && <span className="italic text-slate-600">"{l.note}"</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(l.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Xóa lần ghi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* ĐỔI 15 PHÚT — THAY THẾ, KHÔNG CHỈ CẤM (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Đổi 15 phút — thay vì cấm, hãy thay thế
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">
                  Chọn một việc, làm trong 15 phút. Mỗi lần đổi được ghi nhận vào thử thách và tích điểm nuôi Cây Hạnh Phúc.
                </p>

                {/* Swap Activities */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {SWAPS.map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => handleStartSwapTimer(sw)}
                      className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/60 text-teal-900 font-semibold text-xs text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>{sw}</span>
                      <Play className="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition" />
                    </button>
                  ))}
                </div>

                {/* SWAP COUNTDOWN TIMER ACTIVE */}
                {isSwapTimerActive && (
                  <div className="border-2 border-teal-500 bg-teal-50 rounded-2xl p-4 text-center space-y-3 animate-in zoom-in-95 duration-200">
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                      Đang đổi 15 phút: {activeSwapName}
                    </span>
                    <div className="text-4xl font-black text-teal-950 tabular-nums font-mono">
                      {formatTimerDigits(swapTimerSecondsLeft)}
                    </div>
                    <div className="flex gap-2 justify-center pt-1">
                      <button
                        type="button"
                        onClick={handleFinishSwap}
                        className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Đã đổi xong — Ghi nhận
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelSwap}
                        className="px-3 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {/* Swaps today list */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Các lần đổi hôm nay ({todaySwaps} lần)
                  </span>
                  {currentRecord.swaps.filter((s) => s.date === todayStr()).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Hôm nay chưa đổi lần nào. Bấm vào một hoạt động ở trên để bắt đầu ngay!
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {currentRecord.swaps
                        .filter((s) => s.date === todayStr())
                        .map((s) => (
                          <div
                            key={s.id}
                            className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between"
                          >
                            <span className="font-semibold">{s.activity}</span>
                            <span className="text-[11px] text-emerald-700 font-bold">+15p tích cực</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {onNavigateTab && (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('happy-tree')}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Sprout className="w-4 h-4 text-emerald-700" />
                    <span>Xem điểm đổi trên Cây Hạnh Phúc →</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* THIRD SPLIT: 7 NGÀY GẦN NHẤT & THỬ THÁCH 7 NGÀY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 7 NGÀY GẦN NHẤT (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  7 ngày gần nhất — nhìn xu hướng, đừng nhìn một ngày
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Một ngày vượt giới hạn không có nghĩa là thất bại. Xu hướng giảm dần trong 7 ngày mới là tiến bộ thực chất.
                </p>
              </div>

              {/* Bar Chart */}
              <div className="pt-2">
                <div className="flex items-end justify-between gap-2 h-40 border-b border-slate-200 pb-2">
                  {chartDays.map((col) => (
                    <div key={col.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                        {col.minutes || ''}
                      </span>
                      <div className="w-full flex justify-center">
                        <div
                          className={`w-full max-w-9 rounded-t-lg transition-all ${
                            col.isOver ? 'bg-rose-500' : 'bg-teal-600'
                          }`}
                          style={{ height: `${col.heightPercent}px` }}
                          title={`${col.minutes} phút`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 truncate w-full text-center">
                        {col.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Vạch ngưỡng: {currentRecord.profile.limit} phút/ngày</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 inline-block"></span>
                      Trong hạn
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>
                      Vượt hạn
                    </span>
                  </div>
                </div>
              </div>

              {/* Pattern Insight Box */}
              {patternInsight ? (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 sm:p-4 text-xs text-teal-950 space-y-1.5">
                  <span className="font-bold text-teal-900 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-teal-700" />
                    Mẫu hình hành vi của em
                  </span>
                  <p className="leading-relaxed">
                    Lý do hay gặp nhất: <strong>{patternInsight.topTrigger}</strong> · Khung giờ hay gặp:{' '}
                    <strong>{patternInsight.topSlot}</strong> · Nền tảng hay gặp:{' '}
                    <strong>{patternInsight.topPlatform}</strong> · Xem khuya:{' '}
                    <strong>{patternInsight.lateTotal} lần</strong> · Số ngày vượt giới hạn:{' '}
                    <strong>{patternInsight.overDays} ngày</strong>.
                  </p>
                  <p className="text-teal-800 italic">
                    💡 Lời khuyên: Hãy tập trung sửa đúng một điểm hay gặp nhất trong tuần tới (ví dụ: không mở sau {currentRecord.profile.bedtime}).
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                  Ghi nhật ký 2–3 ngày, hệ thống sẽ tự động tổng hợp mẫu hình tâm lý và gợi ý điểm can thiệp phù hợp.
                </div>
              )}
            </div>

            {/* THỬ THÁCH 7 NGÀY (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thử thách 7 ngày</h2>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">
                  Chọn một thử thách nhỏ, làm được mỗi ngày. Đừng chọn cái khó nhất — chọn cái em làm được 7 ngày liền.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Chọn thử thách</label>
                  <select
                    value={challengeSelect}
                    onChange={(e: any) => setChallengeSelect(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="less10">Giảm 10 phút mỗi ngày so với hôm qua</option>
                    <option value="nolatenight">Không xem sau giờ đi ngủ đã đặt</option>
                    <option value="oneswap">Mỗi ngày 1 lần đổi 15 phút</option>
                    <option value="pause">Dừng 10 giây trước mỗi lần xem</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleStartChallenge}
                    className="w-full py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Bắt đầu thử thách từ hôm nay
                  </button>
                </div>

                {/* Challenge Progress Checklist */}
                {challengeEvaluated && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate mr-2">
                        {challengeEvaluated.label}
                      </span>
                      <strong className="text-teal-700 shrink-0">
                        {challengeEvaluated.passedCount}/7 ngày đạt
                      </strong>
                    </div>

                    <div className="space-y-1.5">
                      {challengeEvaluated.days.map((d) => (
                        <div
                          key={d.date}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={d.checked || d.met}
                              onChange={(e) => handleToggleChallengeDay(d.date, e.target.checked)}
                              className="w-3.5 h-3.5 text-teal-600 rounded cursor-pointer"
                            />
                            <span className="font-semibold text-slate-700">{d.label}</span>
                            {d.isToday && (
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded">
                                Hôm nay
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[11px] font-bold ${
                              d.met ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {d.met ? '✓ Đạt' : 'Chưa đạt'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NHÌN LẠI BUỔI TỐI & CHIA SẺ BÁO CÁO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* NHÌN LẠI BUỔI TỐI (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Nhìn lại buổi tối — 2 phút trước khi ngủ
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đừng để đến cuối tuần mới nhớ. Viết 3 dòng tối nay, sáng mai em đã có một cam kết rõ ràng.
                </p>
              </div>

              <form onSubmit={handleSaveReflection} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hôm nay điều gì khiến em mở video nhiều nhất?
                  </label>
                  <input
                    type="text"
                    value={refTrigger}
                    onChange={(e) => setRefTrigger(e.target.value)}
                    placeholder="Ví dụ: buồn chán sau khi làm bài tập..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-teal-600"
                    maxLength={120}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Điều gì đã giúp em dừng lại hôm nay?
                  </label>
                  <input
                    type="text"
                    value={refWorked}
                    onChange={(e) => setRefWorked(e.target.value)}
                    placeholder="Ví dụ: hẹn giờ 15 phút, tắt máy để sang phòng khác..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-teal-600"
                    maxLength={120}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ngày mai, em cam kết một việc duy nhất: *
                  </label>
                  <input
                    type="text"
                    value={refCommit}
                    onChange={(e) => setRefCommit(e.target.value)}
                    placeholder="Ví dụ: không mở TikTok sau 21:30"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-teal-600 font-medium"
                    maxLength={140}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
                >
                  Lưu nhìn lại hôm nay
                </button>
              </form>

              {/* History of reflections */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Cam kết đã ghi</span>
                {currentRecord.reflections.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có nhìn lại nào.</p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {currentRecord.reflections
                      .slice()
                      .reverse()
                      .map((r, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                        >
                          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                            <span>{fmtDateVN(r.date)}</span>
                          </div>
                          <p className="font-bold text-teal-900">{r.commit}</p>
                          {(r.trigger || r.worked) && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              {r.trigger && `Lý do: ${r.trigger} `}
                              {r.worked && `· Giúp dừng: ${r.worked}`}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* GỬI BÁO CÁO & CHIA SẺ AN TOÀN (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Gửi báo cáo — chỉ khi em muốn, chỉ những gì em chọn
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Không có gì tự động gửi đi. Em tạo mã báo cáo, tự tay gửi cho thầy cô hoặc phụ huynh.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Email người nhận (để soạn thư)
                    </label>
                    <input
                      type="email"
                      value={shareRecipientEmail}
                      onChange={(e) => setShareRecipientEmail(e.target.value)}
                      placeholder="Ví dụ: thayco@truong.edu.vn"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleMakeReportCode}
                      className="py-2 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Tạo mã báo cáo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mã báo cáo an toàn của em
                  </label>
                  <textarea
                    rows={3}
                    readOnly
                    value={generatedReportCode}
                    placeholder="Bấm 'Tạo mã báo cáo' — mã sẽ xuất hiện ở đây. Em chép mã này gửi cho thầy cô hoặc phụ huynh."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-700"
                  />
                </div>

                {shareStatusMessage && (
                  <p className="text-xs text-teal-800 bg-teal-50 p-2 rounded-lg border border-teal-200">
                    {shareStatusMessage}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyReportCode}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Chép mã</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReportMail}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span>Soạn mail</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJSON}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Tải file .json</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileImportRef.current?.click()}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Nhập file .json</span>
                  </button>
                  <input
                    type="file"
                    ref={fileImportRef}
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                  >
                    Xem thử với dữ liệu mẫu (1234)
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={handleLockProfile}
                    className="text-xs text-slate-600 hover:underline font-semibold cursor-pointer"
                  >
                    Khóa hồ sơ / Đổi người dùng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: GIÁO VIÊN & PHỤ HUYNH (TEACHER & PARENTS)     */}
      {/* ==================================================== */}
      {activeRole === 'teacher' && (
        <div className="space-y-6">
          {/* BẢNG TỔNG HỢP MÃ BÁO CÁO */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Bảng tổng hợp từ mã báo cáo học sinh gửi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Thầy cô và phụ huynh không cần can thiệp trực tiếp vào điện thoại của học sinh. Mỗi em
                tự gửi mã báo cáo; dán các mã vào đây để xem bức tranh chung của lớp. Em nào chưa gửi
                thì hiện là “chưa có báo cáo”, không tính là vi phạm.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Dán mã báo cáo của học sinh (mỗi mã một dòng)
              </label>
              <textarea
                rows={5}
                value={teacherCodesInput}
                onChange={(e) => setTeacherCodesInput(e.target.value)}
                placeholder="Dán mã báo cáo học sinh gửi qua Zalo / email vào đây..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleAggregateReports}
                className="py-2.5 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Xem tổng hợp cả lớp</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTeacherCSV}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Tải bảng tổng hợp (.csv)</span>
              </button>
            </div>

            {/* RESULTS DASHBOARD */}
            {aggregatedStats && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Số em đã gửi mã</span>
                    <strong className="text-lg font-bold text-slate-900">
                      {aggregatedStats.totalStudents} em
                    </strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">TB phút/ngày</span>
                    <strong className="text-lg font-bold text-teal-700">
                      {aggregatedStats.avgMinsPerStudent} phút
                    </strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Trong giới hạn an toàn</span>
                    <strong className="text-lg font-bold text-emerald-700">
                      {aggregatedStats.withinLimitCount}/{aggregatedStats.totalStudents} em
                    </strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Lý do hay gặp nhất</span>
                    <strong className="text-xs font-bold text-slate-900 truncate block mt-1">
                      {aggregatedStats.topTrigger} ({aggregatedStats.topTriggerCount} lần)
                    </strong>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Tổng lần đổi 15 phút tích cực: <strong>{aggregatedStats.totalSwaps}</strong> · Lần xem khuya: <strong>{aggregatedStats.totalLate}</strong>.
                </div>

                {/* TABLE OF STUDENTS */}
                {aggregatedReports && aggregatedReports.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Học sinh</th>
                          <th className="py-2.5 px-3">Lớp</th>
                          <th className="py-2.5 px-3">Số ngày có dữ liệu</th>
                          <th className="py-2.5 px-3">Trung bình / ngày</th>
                          <th className="py-2.5 px-3">Ngày gần nhất</th>
                          <th className="py-2.5 px-3">Ngày vượt ngưỡng</th>
                          <th className="py-2.5 px-3">Lần đổi 15p</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {aggregatedReports.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{row.name}</td>
                            <td className="py-2.5 px-3 text-slate-600">{row.className}</td>
                            <td className="py-2.5 px-3 text-slate-700 tabular-nums">
                              {row.daysWithData}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 tabular-nums">
                              {row.avgMinutesPerDay} phút
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-bold tabular-nums ${
                                  row.isLastWithinLimit ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {row.lastDayMinutes} phút
                              </span>
                            </td>
                            <td className="py-2.5 px-3 tabular-nums text-slate-700">
                              {row.overDays}
                            </td>
                            <td className="py-2.5 px-3 tabular-nums font-semibold text-teal-800">
                              {row.swapsCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NGƯỠNG CHUNG CỦA LỚP & 5 CÂU HỎI TÂM LÝ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cài đặt ngưỡng lớp */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-base">Ngưỡng chung tham khảo của lớp</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đặt một ngưỡng để cả lớp cùng hướng tới. Ngưỡng này dùng để phân loại trên bảng tổng hợp, không khóa máy học sinh.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Giới hạn tham khảo mỗi ngày (phút)
                </label>
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={classReferenceLimit}
                  onChange={(e) => setClassReferenceLimit(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Giờ không xem sau (giờ đi ngủ khuyến cáo)
                </label>
                <input
                  type="time"
                  value={classReferenceBedtime}
                  onChange={(e) => setClassReferenceBedtime(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setClassSettingsStatus(
                    `Đã cập nhật: ${classReferenceLimit} phút/ngày, không xem sau ${classReferenceBedtime}.`
                  );
                  if (teacherCodesInput) handleAggregateReports();
                }}
                className="py-2 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer"
              >
                Áp dụng ngưỡng
              </button>

              {classSettingsStatus && (
                <p className="text-xs text-teal-800 font-semibold mt-1">{classSettingsStatus}</p>
              )}
            </div>

            {/* 5 câu hỏi tâm lý học đường */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-base">
                5 câu hỏi để nói chuyện, không phải để tra hỏi
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dùng khi một em vượt ngưỡng nhiều ngày. Mục tiêu là tìm ra “điểm gãy” và cùng em sửa một việc nhỏ.
              </p>

              <ol className="space-y-2 text-xs text-slate-700 list-decimal pl-4 leading-relaxed font-medium">
                <li>
                  <em>"Lúc nào em hay mở video nhất — buồn chán, căng thẳng sau giờ học, hay lúc chờ đợi?"</em>
                </li>
                <li>
                  <em>"Việc thay thế nào em thấy làm được dễ nhất, không thấy gượng ép?"</em>
                </li>
                <li>
                  <em>"Giờ nào trong ngày là khó dừng lại nhất với em?"</em>
                </li>
                <li>
                  <em>"Tuần này em muốn giảm bao nhiêu phút — 5 hay 10 phút là vừa sức?"</em>
                </li>
                <li>
                  <em>"Thầy cô / bố mẹ có thể giúp gì — nhắc giờ ngủ, hay cùng em để điện thoại ngoài phòng ngủ?"</em>
                </li>
              </ol>
            </div>
          </div>

          {/* HƯỚNG DẪN GỬI MÃ 2 PHÚT */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-2">
            <h3 className="font-bold text-slate-900 text-base">Hướng dẫn gửi mã cho cả lớp (2 phút)</h3>
            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-4 leading-relaxed">
              <li>
                Mỗi học sinh mở app trên điện thoại của mình, tạo đúng 1 hồ sơ bằng tên thật và{' '}
                <strong>mã riêng bắt buộc 4–6 chữ số</strong>.
              </li>
              <li>
                Học sinh tự ghi số phút thật trong ngày, dùng bộ đếm 10 giây và đổi 15 phút.
              </li>
              <li>
                Cuối ngày, em bấm <strong>Tạo mã báo cáo</strong> rồi chép mã gửi cho thầy cô hoặc nhóm lớp.
              </li>
              <li>
                Thầy cô dán các mã vào ô trên và bấm <strong>Xem tổng hợp cả lớp</strong>.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: VÌ SAO APP NÀY KHÁC? (WHY & PRINCIPLES)       */}
      {/* ==================================================== */}
      {activeRole === 'why' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Đề xuất của chuyên gia: quản lý video ngắn phải đổi hành vi, không chỉ đếm phút
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Các app chỉ ghi “hôm nay xem bao nhiêu phút” rồi xếp mức phạt thường thất bại vì học sinh không
                nhìn thấy cảnh báo đúng lúc đang muốn xem, dễ bị ghi đẹp để đối phó, và cấm mà không có việc
                thay thế thì cơn thèm lướt quay lại ngay.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-bold text-teal-700 uppercase">
                  01 · Dừng trước khi xem
                </span>
                <h3 className="font-bold text-slate-900 text-sm">10 giây tạo khoảng lặng</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cơn muốn lướt mạnh nhất trong vài giây đầu. Một lần dừng có chủ đích kèm câu hỏi “vì sao mình mở?”
                  làm giảm đáng kể phản xạ mở video vô thức.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-bold text-amber-700 uppercase">
                  02 · Nhìn thấy mẫu hình
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Ghi lý do, không chỉ ghi phút</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Biết mình xem nhiều lúc buồn chán hay lúc đêm khuya mới sửa được đúng chỗ. App tổng hợp lý do,
                  khung giờ và nền tảng hay gặp nhất của chính em.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 uppercase">
                  03 · Thay thế, không chỉ cấm
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Đổi 15 phút lấy việc khác</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mỗi lần đổi được ghi nhận như một chiến thắng nhỏ. Học sinh chọn việc mình thích — đọc sách,
                  vận động, nghe nhạc, dọn bàn học — để nhận dưỡng chất cho Cây Hạnh Phúc.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-bold text-orange-700 uppercase">
                  04 · Thắng nhỏ, đều đặn
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Thử thách 7 ngày &amp; nhìn lại buổi tối</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mục tiêu nhỏ làm được 7 ngày liền có giá trị hơn mục tiêu lớn bỏ sau 2 ngày. Nhìn lại buổi tối
                  biến một ngày vượt giới hạn thành bài học, không phải điểm trừ.
                </p>
              </div>
            </div>
          </div>

          {/* TABLE: LÀM ĐƯỢC VS KHÔNG LÀM ĐƯỢC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-base">App này làm được gì — và không làm gì</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">Làm được</th>
                      <th className="py-2 px-2.5">Không làm được</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-2.5 text-slate-700">Dừng 10 giây, hẹn giờ, ghi lý do &amp; tâm trạng</td>
                      <td className="py-2 px-2.5 text-slate-500">Tự đo thời gian ngầm trên điện thoại</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 text-slate-700">Đổi 15 phút việc lành mạnh, thử thách 7 ngày</td>
                      <td className="py-2 px-2.5 text-slate-500">Khóa cứng ứng dụng TikTok / YouTube</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 text-slate-700">Mã báo cáo do học sinh chủ động gửi</td>
                      <td className="py-2 px-2.5 text-slate-500">Tự động truyền dữ liệu khi chưa gửi mã</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 text-slate-700">Mỗi hồ sơ có mã PIN 4–6 số riêng biệt</td>
                      <td className="py-2 px-2.5 text-slate-500">Đồng bộ đám mây mà không qua xuất file</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* LỘ TRÌNH 1 TUẦN */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-base">Lộ trình 1 tuần thay đổi</h3>
              <ol className="text-xs text-slate-700 space-y-2 list-decimal pl-4 leading-relaxed font-medium">
                <li>
                  <strong>Ngày 1:</strong> Tạo hồ sơ với tên thật và mã PIN 4–6 chữ số. Đặt giới hạn khởi điểm (gợi ý: 45 phút) và giờ đi ngủ.
                </li>
                <li>
                  <strong>Ngày 1–3:</strong> Chỉ ghi thật, chưa cần cố ép giảm. Mục tiêu là thấy được mẫu hình của mình.
                </li>
                <li>
                  <strong>Ngày 4:</strong> Chọn 1 thử thách 7 ngày và 1 hoạt động thay thế yêu thích.
                </li>
                <li>
                  <strong>Cuối tuần:</strong> Gửi mã báo cáo, cùng nhìn biểu đồ 7 ngày và chọn 1 điểm sửa cho tuần sau.
                </li>
              </ol>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRole('student')}
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Bắt đầu với chế độ Học sinh →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* GATE MODAL: MỞ HỒ SƠ BẰNG MÃ PIN (4-6 CHỮ SỐ)       */}
      {/* ==================================================== */}
      {isGateOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900">Mở hồ sơ của em</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Mỗi học sinh có một hồ sơ riêng, mở bằng <strong>mã riêng bắt buộc 4–6 chữ số</strong>.
              Không nhập đúng mã thì không xem và không ghi được vào hồ sơ đó.
            </p>

            {/* Profiles list */}
            {profiles.length > 0 && !gateSelectedId && (
              <div className="space-y-2 mb-4">
                <span className="text-xs font-bold text-slate-700 block">
                  Chọn đúng tên của em:
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {profiles.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between hover:border-teal-400 transition"
                    >
                      <div>
                        <strong className="text-sm font-bold text-slate-900">
                          {p.profile.name || '(Chưa đặt tên)'}
                        </strong>
                        <div className="text-[11px] text-slate-500">
                          {p.profile.className ? `${p.profile.className} · ` : ''}
                          Hồ sơ #{idx + 1}
                          {p.demo && ' · Dữ liệu mẫu'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectGateProfile(p.id)}
                        className="py-1.5 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer"
                      >
                        Mở hồ sơ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unlock with PIN form */}
            {gateSelectedId && !isSettingInitialPin && (
              <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 space-y-3 mb-4">
                <div>
                  <span className="text-xs font-bold text-teal-900">
                    Mở hồ sơ:{' '}
                    {profiles.find((p) => p.id === gateSelectedId)?.profile.name || 'Em'}
                  </span>
                  <label className="text-xs font-semibold text-slate-700 block mt-2 mb-1">
                    Nhập mã riêng (4–6 chữ số)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={gatePinInput}
                    onChange={(e) => setGatePinInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUnlockWithPin();
                    }}
                    placeholder="Chỉ em biết mã này"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    autoFocus
                  />
                  {gateError && <p className="text-xs text-rose-600 font-bold mt-1">{gateError}</p>}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUnlockWithPin}
                    className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Mở ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGateSelectedId(null);
                      setGateError('');
                    }}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-white text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Quay lại
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleForgetProfile}
                    className="text-[11px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    Quên mã? Xóa hồ sơ này và bắt đầu lại
                  </button>
                  {pendingForgetNote && (
                    <p className="text-xs text-rose-600 font-bold mt-1">{pendingForgetNote}</p>
                  )}
                </div>
              </div>
            )}

            {/* Set initial PIN if legacy record */}
            {gateSelectedId && isSettingInitialPin && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-3 mb-4">
                <p className="text-xs text-amber-900 font-semibold">
                  Hồ sơ này chưa có mã riêng. Hãy đặt mã ngay để bảo vệ dữ liệu của em:
                </p>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mã riêng mới (4–6 chữ số) *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={gateNewPin}
                    onChange={(e) => setGateNewPin(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nhập lại mã riêng *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={gateNewPin2}
                    onChange={(e) => setGateNewPin2(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                {gateError && <p className="text-xs text-rose-600 font-bold">{gateError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSetInitialPin}
                    className="flex-1 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs"
                  >
                    Đặt mã và mở
                  </button>
                  <button
                    type="button"
                    onClick={() => setGateSelectedId(null)}
                    className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            )}

            <hr className="border-slate-200 my-4" />

            {/* TẠO HỒ SƠ MỚI */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Tạo hồ sơ mới</h3>
              <p className="text-xs text-slate-500">
                Ghi tên thật để thầy cô nhận ra khi em gửi mã báo cáo.
              </p>

              <form onSubmit={handleCreateNewProfile} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tên thật của em *
                    </label>
                    <input
                      type="text"
                      value={gcName}
                      onChange={(e) => setGcName(e.target.value)}
                      placeholder="Ví dụ: Minh Anh"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      maxLength={40}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Lớp</label>
                    <input
                      type="text"
                      value={gcClass}
                      onChange={(e) => setGcClass(e.target.value)}
                      placeholder="Ví dụ: 12A3"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Giới hạn mỗi ngày (phút)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={240}
                      value={gcLimit}
                      onChange={(e) => setGcLimit(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Giờ không xem sau
                    </label>
                    <input
                      type="time"
                      value={gcBedtime}
                      onChange={(e) => setGcBedtime(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Mã riêng (4–6 số) *
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={gcPin}
                      onChange={(e) => setGcPin(e.target.value)}
                      placeholder="Mã bí mật"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Nhập lại mã riêng *
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={gcPin2}
                      onChange={(e) => setGcPin2(e.target.value)}
                      placeholder="Nhập lại"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>

                {gcError && <p className="text-xs text-rose-600 font-bold">{gcError}</p>}
                {gcDupNotice && <p className="text-xs text-amber-700 font-medium">{gcDupNotice}</p>}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
                >
                  Tạo hồ sơ và mở ngay
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsGateOpen(false);
                    setActiveRole('teacher');
                  }}
                  className="text-xs text-slate-600 hover:text-teal-800 underline font-medium cursor-pointer"
                >
                  Tôi là giáo viên / phụ huynh (vào bảng tổng hợp)
                </button>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="text-xs text-teal-700 hover:underline font-bold cursor-pointer"
                >
                  Dữ liệu mẫu (1234)
                </button>
              </div>

              {profiles.length > 0 && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleWipeAll}
                    className="text-[11px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                  >
                    Xóa tất cả hồ sơ trên thiết bị này...
                  </button>
                  {pendingWipeNote && (
                    <p className="text-xs text-rose-600 font-bold mt-1">{pendingWipeNote}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* PROFILE SETTINGS MODAL                              */}
      {/* ==================================================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900">Hồ sơ &amp; Giới hạn của em</h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4 leading-relaxed">
              Mã riêng là bắt buộc để mở hồ sơ. Đổi mã hoặc thay đổi giới hạn phải nhập đúng mã hiện tại.
            </p>

            <form onSubmit={handleSaveProfileSettings} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên thật *</label>
                <input
                  type="text"
                  value={pfName}
                  onChange={(e) => setPfName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lớp</label>
                <input
                  type="text"
                  value={pfClass}
                  onChange={(e) => setPfClass(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Giới hạn/ngày (phút)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={pfLimit}
                    onChange={(e) => setPfLimit(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Sau giờ này không xem
                  </label>
                  <input
                    type="time"
                    value={pfBedtime}
                    onChange={(e) => setPfBedtime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mã riêng hiện tại *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pfCurrentPin}
                  onChange={(e) => setPfCurrentPin(e.target.value)}
                  placeholder="Nhập mã hiện tại để xác nhận"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mã mới (tùy chọn)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pfNewPin}
                    onChange={(e) => setPfNewPin(e.target.value)}
                    placeholder="4–6 số mới"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nhập lại mã mới
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pfNewPin2}
                    onChange={(e) => setPfNewPin2(e.target.value)}
                    placeholder="Nhập lại"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {pfError && <p className="text-xs text-rose-600 font-bold">{pfError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </form>

            <hr className="border-slate-200 my-4" />

            {/* DELETE PROFILE SECTION */}
            <div>
              {!showDeleteArea ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteArea(true)}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Xóa hồ sơ đang mở...
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <span className="text-xs font-bold text-rose-900 block">
                    Xác nhận xóa vĩnh viễn hồ sơ này
                  </span>
                  <p className="text-[11px] text-rose-800">
                    Toàn bộ nhật ký, lần đổi và nhìn lại của hồ sơ này sẽ bị xóa khỏi máy. Không thể khôi phục.
                  </p>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pfDeletePin}
                    onChange={(e) => setPfDeletePin(e.target.value)}
                    placeholder="Nhập mã riêng để xác nhận xóa"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-rose-300 bg-white"
                  />
                  {pfDeleteError && (
                    <p className="text-xs text-rose-700 font-bold">{pfDeleteError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteCurrentProfile}
                      className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Xác nhận xóa vĩnh viễn
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteArea(false)}
                      className="py-1.5 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
