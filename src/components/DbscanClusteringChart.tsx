import React, { useState, useMemo } from 'react';
import {
  Brain,
  Sliders,
  Sparkles,
  Info,
  Download,
  FileCode,
  AlertTriangle,
  Users,
  Target,
  Maximize2,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { StudentScore } from '../types';

export interface DbscanClusteringChartProps {
  students: StudentScore[];
  onExportTikz?: () => void;
  className?: string;
}

export interface DbscanPoint {
  student: StudentScore;
  x: number; // Điểm trục X (e.g. TX)
  y: number; // Điểm trục Y (e.g. Khảo sát)
  clusterId: number; // 0: Mũi nhọn, 1: An toàn, 2: Nguy cơ, -1: Noise
  pointType: 'core' | 'border' | 'noise';
  neighborCount: number;
}

export const DbscanClusteringChart: React.FC<DbscanClusteringChartProps> = ({
  students,
  onExportTikz,
  className = '',
}) => {
  // DBSCAN Hyperparameters
  const [epsilon, setEpsilon] = useState<number>(0.8);
  const [minPts, setMinPts] = useState<number>(3);
  const [selectedAxisPair, setSelectedAxisPair] = useState<
    'screentime_score' | 'happytree_score' | 'latenight_score' | 'tx_final' | 'gk_final' | 'tx_gk'
  >('screentime_score');

  // Visualization toggles
  const [showEpsRadius, setShowEpsRadius] = useState<boolean>(true);
  const [showDangerBands, setShowDangerBands] = useState<boolean>(true);
  const [showDiagonal, setShowDiagonal] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [filterCluster, setFilterCluster] = useState<
    'all' | 'hatmam' | 'mamxanh' | 'choinon' | 'la' | 'hoa' | 'trai'
  >('all');

  // Selected / Hovered student point
  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // 1. Run True DBSCAN Algorithm on the 2D student scores
  const { points, clusterSummary } = useMemo(() => {
    // Map students to 2D coordinates
    const pts = students.map((s) => {
      let rawX = s.screenTimeMinutes !== undefined ? s.screenTimeMinutes : 45;
      let normX = rawX / 15; // Normalize 0-150 min to 0-10 for distance
      let y = s.scoreFinal;

      if (selectedAxisPair === 'happytree_score') {
        rawX = s.happyTreePoints !== undefined ? s.happyTreePoints : 15;
        normX = (rawX / 40) * 10; // Normalize 0-40 points to 0-10
        y = s.scoreFinal;
      } else if (selectedAxisPair === 'latenight_score') {
        rawX = s.lateNightSessions !== undefined ? s.lateNightSessions : 1;
        normX = (rawX / 7) * 10;
        y = s.scoreFinal;
      } else if (selectedAxisPair === 'tx_final') {
        rawX = s.score1;
        normX = s.score1;
        y = s.scoreFinal;
      } else if (selectedAxisPair === 'gk_final') {
        rawX = s.score2;
        normX = s.score2;
        y = s.scoreFinal;
      } else if (selectedAxisPair === 'tx_gk') {
        rawX = s.score1;
        normX = s.score1;
        y = s.score2;
      }
      return { student: s, x: rawX, normX, y };
    });

    const n = pts.length;
    // Compute Euclidean distance matrix using normalized coordinates
    const distMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pts[i].normX - pts[j].normX;
        const dy = pts[i].y - pts[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        distMatrix[i][j] = dist;
        distMatrix[j][i] = dist;
      }
    }

    // Neighbors within epsilon
    const neighbors: number[][] = pts.map((_, i) => {
      const list: number[] = [];
      for (let j = 0; j < n; j++) {
        if (i !== j && distMatrix[i][j] <= epsilon) {
          list.push(j);
        }
      }
      return list;
    });

    // Identify Core Points
    const isCore: boolean[] = neighbors.map((nbrs) => nbrs.length >= minPts - 1);

    // DBSCAN Cluster Assignment
    const clusterAssigned: number[] = Array(n).fill(-2); // -2: unvisited
    let currentCluster = 0;

    for (let i = 0; i < n; i++) {
      if (clusterAssigned[i] !== -2) continue; // visited

      if (!isCore[i]) {
        // May be noise or border later
        clusterAssigned[i] = -1; // provisional noise
        continue;
      }

      // Start new cluster from this core point
      clusterAssigned[i] = currentCluster;
      const queue: number[] = [...neighbors[i]];

      while (queue.length > 0) {
        const p = queue.shift()!;
        if (clusterAssigned[p] === -1) {
          // Border point previously marked as noise
          clusterAssigned[p] = currentCluster;
        }

        if (clusterAssigned[p] !== -2) continue;

        clusterAssigned[p] = currentCluster;

        if (isCore[p]) {
          // Expand queue with its neighbors
          for (const nbr of neighbors[p]) {
            if (clusterAssigned[nbr] === -2 || clusterAssigned[nbr] === -1) {
              queue.push(nbr);
            }
          }
        }
      }

      currentCluster++;
    }

    // Pedagogical Semantic Mapping:
    const classifiedPoints: DbscanPoint[] = pts.map((p, idx) => {
      const cId = clusterAssigned[idx];
      const nbrCount = neighbors[idx].length;
      let pointType: 'core' | 'border' | 'noise' = 'noise';
      if (isCore[idx]) pointType = 'core';
      else if (cId >= 0) pointType = 'border';

      return {
        student: p.student,
        x: p.x,
        y: p.y,
        clusterId: cId,
        pointType,
        neighborCount: nbrCount,
      };
    });

    // Cluster Statistics for all 6 Happy Tree Groups
    const hatmam = classifiedPoints.filter((cp) => cp.student.cluster === 'hatmam' || cp.student.cluster === 'nguyco');
    const mamxanh = classifiedPoints.filter((cp) => cp.student.cluster === 'mamxanh');
    const choinon = classifiedPoints.filter((cp) => cp.student.cluster === 'choinon');
    const la = classifiedPoints.filter((cp) => cp.student.cluster === 'la' || cp.student.cluster === 'antoan');
    const hoa = classifiedPoints.filter((cp) => cp.student.cluster === 'hoa');
    const trai = classifiedPoints.filter((cp) => cp.student.cluster === 'trai' || cp.student.cluster === 'muinhon');
    const directFail = classifiedPoints.filter((cp) => cp.y <= 1.5);

    const calcAvg = (arr: DbscanPoint[], key: 'x' | 'y') =>
      arr.length > 0
        ? (arr.reduce((acc, curr) => acc + curr[key], 0) / arr.length).toFixed(2)
        : '0.00';

    return {
      points: classifiedPoints,
      clusterSummary: {
        total: n,
        detectedClusters: currentCluster,
        hatmam: {
          count: hatmam.length,
          pct: Math.round((hatmam.length / (n || 1)) * 100),
          avgX: calcAvg(hatmam, 'x'),
          avgY: calcAvg(hatmam, 'y'),
          coreCount: hatmam.filter((p) => p.pointType === 'core').length,
          directFailCount: directFail.length,
        },
        mamxanh: {
          count: mamxanh.length,
          pct: Math.round((mamxanh.length / (n || 1)) * 100),
          avgX: calcAvg(mamxanh, 'x'),
          avgY: calcAvg(mamxanh, 'y'),
          coreCount: mamxanh.filter((p) => p.pointType === 'core').length,
        },
        choinon: {
          count: choinon.length,
          pct: Math.round((choinon.length / (n || 1)) * 100),
          avgX: calcAvg(choinon, 'x'),
          avgY: calcAvg(choinon, 'y'),
          coreCount: choinon.filter((p) => p.pointType === 'core').length,
        },
        la: {
          count: la.length,
          pct: Math.round((la.length / (n || 1)) * 100),
          avgX: calcAvg(la, 'x'),
          avgY: calcAvg(la, 'y'),
          coreCount: la.filter((p) => p.pointType === 'core').length,
        },
        hoa: {
          count: hoa.length,
          pct: Math.round((hoa.length / (n || 1)) * 100),
          avgX: calcAvg(hoa, 'x'),
          avgY: calcAvg(hoa, 'y'),
          coreCount: hoa.filter((p) => p.pointType === 'core').length,
        },
        trai: {
          count: trai.length,
          pct: Math.round((trai.length / (n || 1)) * 100),
          avgX: calcAvg(trai, 'x'),
          avgY: calcAvg(trai, 'y'),
          coreCount: trai.filter((p) => p.pointType === 'core').length,
        },
      },
    };
  }, [students, epsilon, minPts, selectedAxisPair]);

  // SVG Chart Geometry Constants
  const viewBoxWidth = 680;
  const viewBoxHeight = 520;
  const padding = { left: 60, right: 40, top: 40, bottom: 60 };
  const plotWidth = viewBoxWidth - padding.left - padding.right; // 580
  const plotHeight = viewBoxHeight - padding.top - padding.bottom; // 420

  // Coordinate scales: dynamic maxX depending on selectedAxisPair
  const maxX =
    selectedAxisPair === 'screentime_score'
      ? 150
      : selectedAxisPair === 'latenight_score'
      ? 7
      : selectedAxisPair === 'happytree_score'
      ? 40
      : 10;
  const scaleX = (val: number) => padding.left + (Math.min(maxX, Math.max(0, val)) / maxX) * plotWidth;
  const scaleY = (val: number) => padding.top + plotHeight - (Math.min(10, Math.max(0, val)) / 10) * plotHeight;

  // Active student being inspected
  const activeStudentPoint = useMemo(() => {
    const targetId = hoveredStudentId || selectedStudentId;
    if (!targetId) return null;
    return points.find((p) => p.student.id === targetId) || null;
  }, [points, hoveredStudentId, selectedStudentId]);

  // Filtered points by group
  const displayPoints = points.filter((p) => {
    if (filterCluster === 'all') return true;
    return p.student.cluster === filterCluster;
  });

  // Axis label text
  const getAxisLabels = () => {
    switch (selectedAxisPair) {
      case 'screentime_score':
        return {
          x: 'Thời lượng lướt video ngắn (phút/ngày) · [Vùng an toàn: ≤45p]',
          y: 'Điểm Khảo sát / Thi thử môn học (Thang điểm 10)',
        };
      case 'happytree_score':
        return {
          x: 'Điểm dinh dưỡng Cây Hạnh Phúc (0 - 40 điểm CP) · [Mục tiêu: ≥25đ Cấp Hoa/Trái]',
          y: 'Điểm Khảo sát / Thi thử môn học (Thang điểm 10)',
        };
      case 'latenight_score':
        return {
          x: 'Số đêm lướt video sau giờ đi ngủ (lần/tuần) · [Mục tiêu: 0 lần]',
          y: 'Điểm Khảo sát / Thi thử môn học (Thang điểm 10)',
        };
      case 'gk_final':
        return { x: 'Điểm Giữa Kỳ (GK)', y: 'Điểm Khảo Sát / Thi Thử Tốt Nghiệp' };
      case 'tx_gk':
        return { x: 'Điểm Thường Xuyên (TX)', y: 'Điểm Giữa Kỳ (GK)' };
      default:
        return { x: 'Điểm Thường Xuyên (TX)', y: 'Điểm Khảo Sát / Thi Thử Tốt Nghiệp' };
    }
  };
  const axisLabels = getAxisLabels();

  // Helper preset setters
  const applyPreset = (preset: 'standard' | 'sensitive' | 'broad') => {
    if (preset === 'standard') {
      setEpsilon(0.8);
      setMinPts(3);
    } else if (preset === 'sensitive') {
      setEpsilon(0.6);
      setMinPts(2);
    } else if (preset === 'broad') {
      setEpsilon(1.2);
      setMinPts(4);
    }
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-indigo-900/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Brain className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold tracking-wider text-indigo-300 uppercase">
              Mô Hình Máy Học Không Giám Sát (Unsupervised Learning)
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1">
            Biểu Đồ Phân Cụm Sinh Trưởng Cây Hạnh Phúc &amp; Năng Lực Tự Chủ Số
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Dự án Nghiên cứu Khoa học Học sinh · Trường THPT Phan Thanh Giản — GV Hướng dẫn: Cô Nguyễn Thị Kiều Ân
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onExportTikz && (
            <button
              onClick={onExportTikz}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
              title="Xuất biểu đồ phân tán 2D này sang mã nguồn TikZ (LaTeX) chuyên nghiệp"
            >
              <FileCode className="w-4 h-4 text-indigo-200" />
              <span>Xuất TikZ 2D (LaTeX)</span>
            </button>
          )}

          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/15 text-xs">
            <span className="px-2 text-slate-300 font-semibold text-[11px]">Trục:</span>
            <select
              value={selectedAxisPair}
              onChange={(e) => setSelectedAxisPair(e.target.value as any)}
              className="bg-slate-800 text-white text-xs rounded-lg px-2 py-1 border border-slate-700 font-bold focus:outline-hidden"
            >
              <option value="screentime_score">Thời lượng Video ngắn (x) vs Điểm Khảo sát (y)</option>
              <option value="happytree_score">Điểm Cây Hạnh Phúc (x) vs Điểm Khảo sát (y)</option>
              <option value="latenight_score">Số lần xem khuya (x) vs Điểm Khảo sát (y)</option>
              <option value="tx_final">Kiểm tra TX (x) vs Khảo sát (y)</option>
              <option value="gk_final">Giữa kỳ (x) vs Khảo sát (y)</option>
              <option value="tx_gk">TX (x) vs Giữa kỳ (y)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hyperparameter Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Sliders for Epsilon & MinPts */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Epsilon Slider */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
              <span>Bán kính lân cận (ε):</span>
              <strong className="text-indigo-600 font-mono text-sm px-1.5 py-0.5 bg-indigo-50 rounded-md border border-indigo-200">
                {epsilon.toFixed(1)}
              </strong>
            </span>
            <input
              type="range"
              min="0.4"
              max="1.8"
              step="0.1"
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
              className="w-24 sm:w-32 accent-indigo-600 cursor-pointer"
              title="Bán kính Epsilon xác định khoảng cách mật độ giữa 2 học sinh"
            />
          </div>

          {/* MinPts Slider */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
              <span>Số điểm tối thiểu (MinPts):</span>
              <strong className="text-indigo-600 font-mono text-sm px-1.5 py-0.5 bg-indigo-50 rounded-md border border-indigo-200">
                {minPts}
              </strong>
            </span>
            <input
              type="range"
              min="2"
              max="6"
              step="1"
              value={minPts}
              onChange={(e) => setMinPts(parseInt(e.target.value, 10))}
              className="w-20 sm:w-28 accent-indigo-600 cursor-pointer"
              title="Số học sinh lân cận tối thiểu để tạo thành một Điểm Lõi (Core Point)"
            />
          </div>

          {/* Presets */}
          <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase hidden xl:inline">Bộ thông số:</span>
            <button
              onClick={() => applyPreset('standard')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                epsilon === 0.8 && minPts === 3
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Chuẩn (0.8 / 3)
            </button>
            <button
              onClick={() => applyPreset('sensitive')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                epsilon === 0.6 && minPts === 2
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Nhạy cao (0.6 / 2)
            </button>
            <button
              onClick={() => applyPreset('broad')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                epsilon === 1.2 && minPts === 4
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Rộng (1.2 / 4)
            </button>
          </div>
        </div>

        {/* View Toggles & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Group - 6 Nhóm Cây Hạnh Phúc */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterCluster('all')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                filterCluster === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Tất cả ({points.length})
            </button>
            <button
              onClick={() => setFilterCluster('hatmam')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                filterCluster === 'hatmam' ? 'bg-rose-600 text-white' : 'text-rose-700'
              }`}
            >
              🌱 Hạt mầm ({clusterSummary.hatmam.count})
            </button>
            <button
              onClick={() => setFilterCluster('mamxanh')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                filterCluster === 'mamxanh' ? 'bg-amber-600 text-white' : 'text-amber-800'
              }`}
            >
              🌿 Mầm xanh ({clusterSummary.mamxanh.count})
            </button>
            <button
              onClick={() => setFilterCluster('choinon')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                filterCluster === 'choinon' ? 'bg-blue-600 text-white' : 'text-blue-700'
              }`}
            >
              🌲 Chồi non ({clusterSummary.choinon.count})
            </button>
            <button
              onClick={() => setFilterCluster('la')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                filterCluster === 'la' ? 'bg-emerald-600 text-white' : 'text-emerald-700'
              }`}
            >
              🍃 Lá xanh ({clusterSummary.la.count})
            </button>
            <button
              onClick={() => setFilterCluster('hoa')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                filterCluster === 'hoa' ? 'bg-purple-600 text-white' : 'text-purple-700'
              }`}
            >
              🌸 Hoa thơm ({clusterSummary.hoa.count})
            </button>
            <button
              onClick={() => setFilterCluster('trai')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                filterCluster === 'trai' ? 'bg-orange-600 text-white' : 'text-orange-700'
              }`}
            >
              🍎 Trái ngọt ({clusterSummary.trai.count})
            </button>
          </div>

          {/* Toggle Switches */}
          <button
            onClick={() => setShowEpsRadius(!showEpsRadius)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1 cursor-pointer ${
              showEpsRadius
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
            title="Bật/Tắt hiển thị vòng tròn bán kính lân cận epsilon khi trỏ chuột"
          >
            {showEpsRadius ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Vòng ε</span>
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1 cursor-pointer ${
              showLabels
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
            title="Bật/Tắt tên mã số học sinh trên các điểm tọa độ"
          >
            <span>Tên HS</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Chart & Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column (2/3): SVG Scatter Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Không Gian Tọa Độ 2D • 6 Nhóm Cây Hạnh Phúc &amp; DBSCAN
              </span>
            </div>

            {/* Legend summary pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>🌱 Hạt mầm</span>
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>🌿 Mầm xanh</span>
              </span>
              <span className="flex items-center gap-1 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                <span>🌲 Chồi non</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>🍃 Lá xanh</span>
              </span>
              <span className="flex items-center gap-1 text-purple-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                <span>🌸 Hoa thơm</span>
              </span>
              <span className="flex items-center gap-1 text-orange-700">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                <span>🍎 Trái ngọt</span>
              </span>
            </div>
          </div>

          {/* SVG Canvas Area */}
          <div className="relative w-full flex items-center justify-center py-2 overflow-x-auto">
            <svg
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              className="w-full max-w-[680px] h-auto select-none"
              style={{ minWidth: '480px' }}
            >
              <defs>
                {/* Arrow markers */}
                <marker
                  id="dbscan-axis-arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#334155" />
                </marker>

                {/* Gradients */}
                <linearGradient id="danger-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="warning-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="top-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d1fae5" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ecfdf5" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* 1. Background Growth Bands */}
              {showDangerBands && (
                <>
                  {/* Hạt mầm & Mầm xanh band: y <= 3.5 */}
                  <rect
                    x={scaleX(0)}
                    y={scaleY(3.5)}
                    width={plotWidth}
                    height={scaleY(0) - scaleY(3.5)}
                    fill="url(#danger-grad)"
                    rx="3"
                  />
                  <text
                    x={scaleX(9.8)}
                    y={scaleY(1.2)}
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#c2410c"
                  >
                    VÙNG HẠT MẦM &amp; MẦM XANH (Cần bồi dưỡng dưỡng chất) • {clusterSummary.hatmam.count + clusterSummary.mamxanh.count} HS
                  </text>

                  {/* Chồi non & Lá xanh band: 3.5 < y < 7.0 */}
                  <rect
                    x={scaleX(0)}
                    y={scaleY(7.0)}
                    width={plotWidth}
                    height={scaleY(3.5) - scaleY(7.0)}
                    fill="url(#warning-grad)"
                    rx="3"
                  />
                  <text
                    x={scaleX(9.8)}
                    y={scaleY(5.2)}
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#1d4ed8"
                  >
                    VÙNG CHỒI NON &amp; LÁ XANH (Vững vàng làm chủ) • {clusterSummary.choinon.count + clusterSummary.la.count} HS
                  </text>

                  {/* Hoa thơm & Trái ngọt band: y >= 7.0 */}
                  <rect
                    x={scaleX(0)}
                    y={scaleY(10)}
                    width={plotWidth}
                    height={scaleY(7.0) - scaleY(10)}
                    fill="url(#top-grad)"
                    rx="3"
                  />
                  <text
                    x={scaleX(9.8)}
                    y={scaleY(9.2)}
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#047857"
                  >
                    VÙNG HOA THƠM &amp; TRÁI NGỌT (Tự chủ số xuất sắc) • {clusterSummary.hoa.count + clusterSummary.trai.count} HS
                  </text>
                </>
              )}

              {/* 2. Grid lines & Ticks */}
              {(() => {
                const xTicks =
                  selectedAxisPair === 'screentime_score'
                    ? [15, 30, 45, 60, 75, 90, 105, 120, 135, 150]
                    : selectedAxisPair === 'happytree_score'
                    ? [5, 10, 15, 20, 25, 30, 35, 40]
                    : selectedAxisPair === 'latenight_score'
                    ? [1, 2, 3, 4, 5, 6, 7]
                    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

                const yTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

                return (
                  <>
                    {/* Vertical grid lines & X ticks */}
                    {xTicks.map((v) => (
                      <g key={`x-grid-${v}`}>
                        <line
                          x1={scaleX(v)}
                          y1={scaleY(0)}
                          x2={scaleX(v)}
                          y2={scaleY(10)}
                          stroke={
                            selectedAxisPair === 'screentime_score' && v === 45
                              ? '#0d9488'
                              : selectedAxisPair === 'screentime_score' && v === 90
                              ? '#ef4444'
                              : '#e2e8f0'
                          }
                          strokeWidth={
                            selectedAxisPair === 'screentime_score' && (v === 45 || v === 90) ? '1.5' : '1'
                          }
                          strokeDasharray={
                            selectedAxisPair === 'screentime_score' && (v === 45 || v === 90)
                              ? '4,3'
                              : '3,3'
                          }
                        />
                        <text
                          x={scaleX(v)}
                          y={scaleY(0) + 18}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight={
                            selectedAxisPair === 'screentime_score' && (v === 45 || v === 90)
                              ? 'bold'
                              : 'normal'
                          }
                          fill={
                            selectedAxisPair === 'screentime_score' && v === 45
                              ? '#0f766e'
                              : selectedAxisPair === 'screentime_score' && v === 90
                              ? '#b91c1c'
                              : '#64748b'
                          }
                        >
                          {v}
                          {selectedAxisPair === 'screentime_score' && v === 45 ? 'p' : ''}
                        </text>
                      </g>
                    ))}

                    {/* Horizontal grid lines & Y ticks */}
                    {yTicks.map((v) => (
                      <g key={`y-grid-${v}`}>
                        <line
                          x1={scaleX(0)}
                          y1={scaleY(v)}
                          x2={scaleX(maxX)}
                          y2={scaleY(v)}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <text
                          x={scaleX(0) - 10}
                          y={scaleY(v) + 4}
                          textAnchor="end"
                          fontSize="11"
                          fill="#64748b"
                        >
                          {v}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}

              {/* Origin 0 label */}
              <text
                x={scaleX(0) - 10}
                y={scaleY(0) + 16}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
              >
                0
              </text>

              {/* 3. Diagonal y = x Line */}
              {showDiagonal && (
                <g>
                  <line
                    x1={scaleX(0)}
                    y1={scaleY(0)}
                    x2={scaleX(10)}
                    y2={scaleY(10)}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                  />
                  <text
                    x={scaleX(8.2)}
                    y={scaleY(8.4)}
                    fontSize="10"
                    fontWeight="bold"
                    fill="#64748b"
                    transform={`rotate(-40, ${scaleX(8.2)}, ${scaleY(8.4)})`}
                  >
                    Ổn định phong độ (y = x)
                  </text>
                </g>
              )}

              {/* 4. Threshold Lines */}
              <line
                x1={scaleX(0)}
                y1={scaleY(1.5)}
                x2={scaleX(10)}
                y2={scaleY(1.5)}
                stroke="#dc2626"
                strokeWidth="1.8"
                strokeDasharray="4,4"
              />
              <line
                x1={scaleX(0)}
                y1={scaleY(3.5)}
                x2={scaleX(10)}
                y2={scaleY(3.5)}
                stroke="#d97706"
                strokeWidth="1.8"
                strokeDasharray="4,4"
              />

              {/* 5. Axes Lines */}
              <line
                x1={scaleX(0)}
                y1={scaleY(0)}
                x2={scaleX(10) + 20}
                y2={scaleY(0)}
                stroke="#334155"
                strokeWidth="2"
                markerEnd="url(#dbscan-axis-arrow)"
              />
              <line
                x1={scaleX(0)}
                y1={scaleY(0)}
                x2={scaleX(0)}
                y2={scaleY(10) - 20}
                stroke="#334155"
                strokeWidth="2"
                markerEnd="url(#dbscan-axis-arrow)"
              />

              {/* Axis Titles */}
              <text
                x={scaleX(5)}
                y={scaleY(0) + 44}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#1e293b"
              >
                {axisLabels.x}
              </text>
              <text
                x={scaleX(0) - 40}
                y={scaleY(5)}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#1e293b"
                transform={`rotate(-90, ${scaleX(0) - 40}, ${scaleY(5)})`}
              >
                {axisLabels.y}
              </text>

              {/* 6. Active Student Epsilon Radius Bubble */}
              {showEpsRadius && activeStudentPoint && (
                <g>
                  {/* Radius Circle in SVG pixel units: (epsilon / 10) * plotWidth */}
                  <circle
                    cx={scaleX(activeStudentPoint.x)}
                    cy={scaleY(activeStudentPoint.y)}
                    r={(epsilon / 10) * plotWidth}
                    fill="#6366f1"
                    fillOpacity="0.12"
                    stroke="#4f46e5"
                    strokeWidth="1.8"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={scaleX(activeStudentPoint.x)}
                    y={scaleY(activeStudentPoint.y) - (epsilon / 10) * plotWidth - 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#4338ca"
                  >
                    Bán kính lân cận ε = {epsilon.toFixed(1)} ({activeStudentPoint.neighborCount} bạn láng giềng)
                  </text>
                </g>
              )}

              {/* 7. Student Data Points */}
              {displayPoints.map((pt) => {
                const cx = scaleX(pt.x);
                const cy = scaleY(pt.y);
                const isHovered = hoveredStudentId === pt.student.id;
                const isSelected = selectedStudentId === pt.student.id;
                const isActive = isHovered || isSelected;

                // Color & Shape based on 6 Happy Tree groups
                let fillColor = '#3b82f6';
                let strokeColor = '#1d4ed8';

                if (pt.student.cluster === 'hatmam' || pt.student.cluster === 'nguyco') {
                  fillColor = '#ef4444'; // Red
                  strokeColor = '#b91c1c';
                } else if (pt.student.cluster === 'mamxanh') {
                  fillColor = '#f59e0b'; // Amber
                  strokeColor = '#b45309';
                } else if (pt.student.cluster === 'choinon') {
                  fillColor = '#3b82f6'; // Blue
                  strokeColor = '#1d4ed8';
                } else if (pt.student.cluster === 'la' || pt.student.cluster === 'antoan') {
                  fillColor = '#10b981'; // Emerald
                  strokeColor = '#047857';
                } else if (pt.student.cluster === 'hoa') {
                  fillColor = '#a855f7'; // Purple
                  strokeColor = '#7e22ce';
                } else if (pt.student.cluster === 'trai' || pt.student.cluster === 'muinhon') {
                  fillColor = '#f97316'; // Orange
                  strokeColor = '#c2410c';
                }

                return (
                  <g
                    key={pt.student.id}
                    className="cursor-pointer transition-transform duration-150"
                    onMouseEnter={() => setHoveredStudentId(pt.student.id)}
                    onMouseLeave={() => setHoveredStudentId(null)}
                    onClick={() =>
                      setSelectedStudentId(
                        selectedStudentId === pt.student.id ? null : pt.student.id
                      )
                    }
                  >
                    {/* Pulsing ring for severe at-risk points */}
                    {pt.y <= 1.5 && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isActive ? 16 : 11}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        opacity="0.8"
                        className="animate-ping"
                      />
                    )}

                    {/* Point Shape: Triangle for Hạt mầm, Diamond for Mầm xanh, Square for Chồi non, Circle for Lá, Star/Circle for Hoa & Trái */}
                    {pt.student.cluster === 'hatmam' || pt.student.cluster === 'nguyco' ? (
                      <polygon
                        points={`${cx},${cy - (isActive ? 10 : 7)} ${cx + (isActive ? 9 : 6.5)},${cy + (isActive ? 8 : 5.5)} ${cx - (isActive ? 9 : 6.5)},${cy + (isActive ? 8 : 5.5)}`}
                        fill={fillColor}
                        stroke={isActive ? '#ffffff' : strokeColor}
                        strokeWidth={isActive ? 2.5 : 1.2}
                        filter={isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : undefined}
                      />
                    ) : pt.student.cluster === 'mamxanh' ? (
                      <polygon
                        points={`${cx},${cy - (isActive ? 8 : 6)} ${cx + (isActive ? 8 : 6)},${cy} ${cx},${cy + (isActive ? 8 : 6)} ${cx - (isActive ? 8 : 6)},${cy}`}
                        fill={fillColor}
                        stroke={isActive ? '#ffffff' : strokeColor}
                        strokeWidth={isActive ? 2.5 : 1.2}
                        filter={isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : undefined}
                      />
                    ) : pt.student.cluster === 'choinon' ? (
                      <rect
                        x={cx - (isActive ? 7 : 5)}
                        y={cy - (isActive ? 7 : 5)}
                        width={isActive ? 14 : 10}
                        height={isActive ? 14 : 10}
                        rx="2"
                        fill={fillColor}
                        stroke={isActive ? '#ffffff' : strokeColor}
                        strokeWidth={isActive ? 2.5 : 1.2}
                        filter={isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : undefined}
                      />
                    ) : (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isActive ? 8 : 6}
                        fill={fillColor}
                        stroke={isActive ? '#ffffff' : strokeColor}
                        strokeWidth={isActive ? 2.5 : 1.2}
                        filter={isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : undefined}
                      />
                    )}

                    {/* Core Point indicator ring */}
                    {pt.pointType === 'core' && !isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={pt.student.cluster === 'muinhon' ? 8.5 : 9.5}
                        fill="none"
                        stroke={fillColor}
                        strokeWidth="0.8"
                        strokeDasharray="2,2"
                      />
                    )}

                    {/* Student Label */}
                    {(showLabels || isActive) && (
                      <text
                        x={cx}
                        y={cy - 12}
                        textAnchor="middle"
                        fontSize={isActive ? '11' : '9.5'}
                        fontWeight="bold"
                        fill={isActive ? '#0f172a' : '#475569'}
                        className="pointer-events-none select-none"
                      >
                        {pt.student.id} ({pt.y.toFixed(1)}đ)
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Footnote & Metric Pill */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-700">DBSCAN Status:</span>
              <span>
                Phát hiện <strong>{clusterSummary.detectedClusters}</strong> cụm mật độ tự nhiên •{' '}
                <strong className="text-red-600">{clusterSummary.hatmam.directFailCount}</strong> em trong vùng liệt (≤1.5đ)
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
              <span>Độ đo: Euclidean Distance</span>
              <span>•</span>
              <span>MinPts: {minPts}</span>
              <span>•</span>
              <span>ε: {epsilon}</span>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Detailed Inspection Card & Cluster Analytics */}
        <div className="space-y-4">
          {/* Inspected Student Profile Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Chi Tiết Điểm Học Viên</span>
              </span>
              {activeStudentPoint && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activeStudentPoint.student.cluster === 'trai' || activeStudentPoint.student.cluster === 'muinhon'
                      ? 'bg-orange-100 text-orange-800'
                      : activeStudentPoint.student.cluster === 'hoa'
                      ? 'bg-purple-100 text-purple-800'
                      : activeStudentPoint.student.cluster === 'la' || activeStudentPoint.student.cluster === 'antoan'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeStudentPoint.student.cluster === 'choinon'
                      ? 'bg-blue-100 text-blue-800'
                      : activeStudentPoint.student.cluster === 'mamxanh'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {activeStudentPoint.student.cluster === 'trai' || activeStudentPoint.student.cluster === 'muinhon'
                    ? '🍎 Trái ngọt'
                    : activeStudentPoint.student.cluster === 'hoa'
                    ? '🌸 Hoa thơm bản lĩnh'
                    : activeStudentPoint.student.cluster === 'la' || activeStudentPoint.student.cluster === 'antoan'
                    ? '🍃 Lá xanh vững vàng'
                    : activeStudentPoint.student.cluster === 'choinon'
                    ? '🌲 Chồi non cân bằng'
                    : activeStudentPoint.student.cluster === 'mamxanh'
                    ? '🌿 Mầm xanh tĩnh tâm'
                    : '🌱 Hạt mầm tự chủ'}
                </span>
              )}
            </div>

            {activeStudentPoint ? (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">
                      {activeStudentPoint.student.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Mã: <strong>{activeStudentPoint.student.id}</strong> • Lớp: {activeStudentPoint.student.className}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {activeStudentPoint.student.scoreFinal}
                    </span>
                    <span className="text-xs text-slate-500 block">Điểm Khảo Sát</span>
                  </div>
                </div>

                {/* Score Matrix Cards */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Thường Xuyên</span>
                    <strong className="text-sm font-bold text-slate-800">
                      {activeStudentPoint.student.score1}
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Giữa Kỳ</span>
                    <strong className="text-sm font-bold text-slate-800">
                      {activeStudentPoint.student.score2}
                    </strong>
                  </div>
                  <div
                    className={`p-2 rounded-xl border ${
                      activeStudentPoint.student.scoreFinal <= 1.5
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : activeStudentPoint.student.scoreFinal <= 3.5
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    <span className="text-[10px] block">Khảo Sát</span>
                    <strong className="text-sm font-black">
                      {activeStudentPoint.student.scoreFinal}
                    </strong>
                  </div>
                </div>

                {/* Short Video Habits & Happy Tree Metrics */}
                <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-teal-900">
                    <span>Thói quen Video ngắn &amp; Tinh thần</span>
                    <span className="text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded">
                      Cây: {activeStudentPoint.student.happyTreeStage || 'Chồi non'} ({activeStudentPoint.student.happyTreePoints || 15}đ)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-1.5 rounded-lg border border-teal-100">
                      <span className="text-slate-500 block">Thời lượng lướt:</span>
                      <strong
                        className={`text-xs ${
                          (activeStudentPoint.student.screenTimeMinutes || 45) > 80
                            ? 'text-rose-600 font-bold'
                            : 'text-teal-800 font-bold'
                        }`}
                      >
                        {activeStudentPoint.student.screenTimeMinutes || 45} phút/ngày
                      </strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-teal-100">
                      <span className="text-slate-500 block">Xem sau giờ ngủ:</span>
                      <strong
                        className={`text-xs ${
                          (activeStudentPoint.student.lateNightSessions || 0) >= 3
                            ? 'text-rose-600 font-bold'
                            : 'text-slate-800 font-bold'
                        }`}
                      >
                        {activeStudentPoint.student.lateNightSessions || 0} lần/tuần
                      </strong>
                    </div>
                  </div>
                </div>

                {/* DBSCAN Technical Node Role */}
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-950">Vai trò trong thuật toán DBSCAN:</span>
                    <span className="font-mono font-bold text-indigo-700 uppercase text-[11px]">
                      {activeStudentPoint.pointType === 'core'
                        ? 'Điểm Lõi (Core)'
                        : activeStudentPoint.pointType === 'border'
                        ? 'Điểm Biên (Border)'
                        : 'Điểm Dị Biệt (Noise)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    Có <strong>{activeStudentPoint.neighborCount}</strong> học sinh trong bán kính ε = {epsilon}.
                    {activeStudentPoint.pointType === 'core'
                      ? ' Điểm hạt nhân đại diện cho nhóm năng lực ổn định.'
                      : activeStudentPoint.pointType === 'border'
                      ? ' Điểm nằm ở rìa nhóm, có biến động điểm số giữa TX và KS.'
                      : ' Điểm độc lập dị biệt, học sinh có khoảng cách điểm bất thường cần theo dõi đặc biệt.'}
                  </p>
                </div>

                {/* Tutor Partner Recommendation */}
                {activeStudentPoint.student.assignedTutor && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        ĐÔI BẠN CÙNG TIẾN GHÉP ĐÔI:
                      </span>
                      <span className="font-extrabold text-emerald-950">
                        {activeStudentPoint.student.assignedTutor}
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center space-y-2 text-slate-400">
                <Target className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">
                  Rê chuột hoặc nhấp vào bất kỳ điểm học sinh nào trên biểu đồ tọa độ để xem phân tích DBSCAN chi tiết.
                </p>
              </div>
            )}
          </div>

          {/* Summary Cluster Breakdown Cards: 6 Nhóm Cây Hạnh Phúc */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Chỉ Số Thống Kê 6 Nhóm Cây Hạnh Phúc</span>
            </h4>

            {/* 1. Hạt mầm tự chủ */}
            <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="font-extrabold text-xs text-rose-950">🌱 Hạt Mầm Tự Chủ</span>
                </div>
                <p className="text-[10px] text-rose-800">
                  ĐTB TX: <strong>{clusterSummary.hatmam.avgX}</strong> • ĐTB KS:{' '}
                  <strong>{clusterSummary.hatmam.avgY}</strong>
                </p>
                {clusterSummary.hatmam.directFailCount > 0 && (
                  <span className="inline-block text-[9px] font-black text-rose-600 bg-rose-100 px-1 py-0.2 rounded">
                    Cảnh báo: {clusterSummary.hatmam.directFailCount} em điểm liệt (≤1.5đ)
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-rose-800">
                  {clusterSummary.hatmam.count} HS
                </span>
                <span className="text-[10px] font-bold text-rose-600 block">
                  ({clusterSummary.hatmam.pct}%)
                </span>
              </div>
            </div>

            {/* 2. Mầm xanh tĩnh tâm */}
            <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-extrabold text-xs text-amber-950">🌿 Mầm Xanh Tĩnh Tâm</span>
                </div>
                <p className="text-[10px] text-amber-800">
                  ĐTB TX: <strong>{clusterSummary.mamxanh.avgX}</strong> • ĐTB KS:{' '}
                  <strong>{clusterSummary.mamxanh.avgY}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-amber-800">
                  {clusterSummary.mamxanh.count} HS
                </span>
                <span className="text-[10px] font-bold text-amber-600 block">
                  ({clusterSummary.mamxanh.pct}%)
                </span>
              </div>
            </div>

            {/* 3. Chồi non cân bằng */}
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="font-extrabold text-xs text-blue-950">🌲 Chồi Non Cân Bằng</span>
                </div>
                <p className="text-[10px] text-blue-800">
                  ĐTB TX: <strong>{clusterSummary.choinon.avgX}</strong> • ĐTB KS:{' '}
                  <strong>{clusterSummary.choinon.avgY}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-blue-800">
                  {clusterSummary.choinon.count} HS
                </span>
                <span className="text-[10px] font-bold text-blue-600 block">
                  ({clusterSummary.choinon.pct}%)
                </span>
              </div>
            </div>

            {/* 4. Lá xanh vững vàng */}
            <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-extrabold text-xs text-emerald-950">🍃 Lá Xanh Vững Vàng</span>
                </div>
                <p className="text-[10px] text-emerald-800">
                  ĐTB TX: <strong>{clusterSummary.la.avgX}</strong> • ĐTB KS:{' '}
                  <strong>{clusterSummary.la.avgY}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-800">
                  {clusterSummary.la.count} HS
                </span>
                <span className="text-[10px] font-bold text-emerald-600 block">
                  ({clusterSummary.la.pct}%)
                </span>
              </div>
            </div>

            {/* 5. Hoa thơm bản lĩnh */}
            <div className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span className="font-extrabold text-xs text-purple-950">🌸 Hoa Thơm Bản Lĩnh</span>
                </div>
                <p className="text-[10px] text-purple-800">
                  ĐTB TX: <strong>{clusterSummary.hoa.avgX}</strong> • ĐTB KS:{' '}
                  <strong>{clusterSummary.hoa.avgY}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-purple-800">
                  {clusterSummary.hoa.count} HS
                </span>
                <span className="text-[10px] font-bold text-purple-600 block">
                  ({clusterSummary.hoa.pct}%)
                </span>
              </div>
            </div>

            {/* 6. Trái ngọt */}
            <div className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/50 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span className="font-extrabold text-xs text-orange-950">🍎 Trái Ngọt</span>
                </div>
                <p className="text-[10px] text-orange-800">
                  ĐTB TX: <strong>{clusterSummary.trai.avgX}</strong> • ĐTB KS:{' '}
                  <strong>{clusterSummary.trai.avgY}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-orange-800">
                  {clusterSummary.trai.count} HS
                </span>
                <span className="text-[10px] font-bold text-orange-600 block">
                  ({clusterSummary.trai.pct}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
