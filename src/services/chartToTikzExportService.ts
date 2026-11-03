import { StudentScore, MeetingMinutesData, TeacherProfile } from '../types';

/**
 * Service to export existing charts, statistics, and workflow diagrams
 * into professional, high-fidelity TikZ (LaTeX) source code.
 */

export interface ExportableChartItem {
  id: string;
  title: string;
  category: 'score' | 'workflow' | 'meeting' | 'temis';
  description: string;
  generateTikz: () => string;
  generateSvgPreview: () => string;
}

/**
 * 1. Generate TikZ source code for Student Score Spectrum (Biểu đồ phổ điểm thi)
 * Compatible with pure TikZ and pgfplots.
 */
export function generateScoreSpectrumTikz(
  students: StudentScore[],
  title: string = 'PHỔ ĐIỂM KHẢO SÁT MÔN TOÁN KHỐI 12 (NĂM HỌC 2026--2027)'
): string {
  const bins = [0, 0, 0, 0, 0, 0];
  students.forEach((s) => {
    const sc = s.scoreFinal;
    if (sc <= 2.0) bins[0]++;
    else if (sc <= 3.5) bins[1]++;
    else if (sc <= 5.0) bins[2]++;
    else if (sc <= 6.5) bins[3]++;
    else if (sc <= 8.0) bins[4]++;
    else bins[5]++;
  });

  const maxBin = Math.max(...bins, 1);
  const yMax = Math.ceil((maxBin + 3) / 2) * 2;

  return `% ==============================================================================
% BIỂU ĐỒ PHỔ ĐIỂM KHẢO SÁT MÔN TOÁN (TIKZ / LATEX THUẦN)
% Tự động tổng hợp từ ${students.length} học sinh
% ==============================================================================
\\documentclass[tikz,border=8mm]{standalone}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usetikzlibrary{calc,patterns,arrows.meta}

\\begin{document}
\\begin{tikzpicture}[>=stealth]
  \\begin{axis}[
    ybar,
    title={\\large\\textbf{${title}}},
    xlabel={\\textbf{Khoảng điểm khảo sát (Thang điểm 10)}},
    ylabel={\\textbf{Số lượng học sinh (em)}},
    symbolic x coords={0.0--2.0 (Liệt), 2.1--3.5 (Yếu), 3.6--5.0 (Cận an toàn), 5.1--6.5 (Trung bình), 6.6--8.0 (Khá), 8.1--10.0 (Giỏi)},
    xtick=data,
    nodes near coords,
    nodes near coords style={font=\\bfseries\\small},
    nodes near coords align={vertical},
    ymin=0, ymax=${yMax},
    bar width=24pt,
    enlarge x limits=0.12,
    width=14cm, height=8.5cm,
    grid=major,
    grid style={dashed, gray!30},
    x tick label style={font=\\footnotesize, rotate=20, anchor=east},
    y tick label style={font=\\small},
    title style={font=\\bfseries, yshift=4pt}
  ]
    \\addplot[fill=red!80!black, draw=red!90!black] coordinates {(0.0--2.0 (Liệt), ${bins[0]})};
    \\addplot[fill=red!45, draw=red!70] coordinates {(2.1--3.5 (Yếu), ${bins[1]})};
    \\addplot[fill=amber!60, draw=amber!80] coordinates {(3.6--5.0 (Cận an toàn), ${bins[2]})};
    \\addplot[fill=blue!40, draw=blue!60] coordinates {(5.1--6.5 (Trung bình), ${bins[3]})};
    \\addplot[fill=blue!75, draw=blue!90] coordinates {(6.6--8.0 (Khá), ${bins[4]})};
    \\addplot[fill=teal!70!black, draw=teal!90] coordinates {(8.1--10.0 (Giỏi), ${bins[5]})};
  \\end{axis}
\\end{tikzpicture}
\\end{document}
`;
}

/**
 * 2. Generate TikZ source code for DBSCAN Clustering 2D Scatter Plot
 * (Biểu đồ phân tán gom cụm DBSCAN: Điểm kiểm tra thường xuyên vs Điểm khảo sát)
 */
export function generateDbscanScatterTikz(students: StudentScore[]): string {
  const muinhon = students.filter((s) => s.cluster === 'muinhon');
  const antoan = students.filter((s) => s.cluster === 'antoan');
  const nguyco = students.filter((s) => s.cluster === 'nguyco');

  return `% ==============================================================================
% BIỂU ĐỒ PHÂN TÁN GOM CỤM DBSCAN (EPS=0.8, MINPTS=3)
% Trục X: Điểm thường xuyên (TX) | Trục Y: Điểm khảo sát cuối kỳ
% ==============================================================================
\\documentclass[tikz,border=8mm]{standalone}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{tikz}
\\usetikzlibrary{calc,arrows.meta,shapes.geometric}

\\begin{document}
\\begin{tikzpicture}[x=1.1cm, y=1.1cm, >=stealth]
  % Vùng cảnh báo nguy cơ điểm liệt
  \\fill[red!12, rounded corners=2pt] (0,0) rectangle (10.5,1.5);
  \\fill[amber!10, rounded corners=2pt] (0,1.5) rectangle (10.5,3.5);

  % Lưới tọa độ
  \\draw[step=1, gray!20, very thin] (0,0) grid (10.5,10.5);

  % Trục tọa độ
  \\draw[->, very thick, slate!90] (0,0) -- (11,0) node[right, font=\\bfseries\\small] {Điểm Thường Xuyên ($x$)};
  \\draw[->, very thick, slate!90] (0,0) -- (0,11) node[above, font=\\bfseries\\small] {Điểm Khảo Sát ($y$)};
  \\node[below left, font=\\small] at (0,0) {$O$};

  % Đánh số trục
  \\foreach \\x in {2,4,6,8,10} \\draw (\\x, 2pt) -- (\\x, -2pt) node[below, font=\\footnotesize] {\\x};
  \\foreach \\y in {2,4,6,8,10} \\draw (2pt, \\y) -- (-2pt, \\y) node[left, font=\\footnotesize] {\\y};

  % Đường ranh giới điểm liệt
  \\draw[dashed, red!80!black, thick] (0,1.5) -- (10.5,1.5) node[right, font=\\scriptsize\\bfseries, text=red!80!black] {Mức liệt ($\\le 1.5$)};
  \\draw[dashed, amber!90!black, thick] (0,3.5) -- (10.5,3.5) node[right, font=\\scriptsize\\bfseries, text=amber!90!black] {Nguy cơ ($\\le 3.5$)};

  % Cụm 3: Nguy cơ liệt (Red triangles)
  ${nguyco
    .map(
      (s) =>
        `\\node[regular polygon, regular polygon sides=3, inner sep=1.8pt, fill=red!80!black, draw=white, label={[font=\\tiny, text=red!90!black]above right:${s.id}}] at (${Math.min(
          s.score1,
          10
        )},${Math.min(s.scoreFinal, 10)}) {};`
    )
    .join('\n  ')}

  % Cụm 2: An toàn (Blue squares)
  ${antoan
    .slice(0, 15)
    .map(
      (s) =>
        `\\node[rectangle, inner sep=2.5pt, fill=blue!70!black, draw=white] at (${Math.min(
          s.score1,
          10
        )},${Math.min(s.scoreFinal, 10)}) {};`
    )
    .join('\n  ')}

  % Cụm 1: Mũi nhọn (Green circles)
  ${muinhon
    .map(
      (s) =>
        `\\node[circle, inner sep=2.5pt, fill=teal!70!black, draw=white, label={[font=\\tiny, text=teal!90!black]above right:${s.id}}] at (${Math.min(
          s.score1,
          10
        )},${Math.min(s.scoreFinal, 10)}) {};`
    )
    .join('\n  ')}

  % Chú giải (Legend)
  \\begin{scope}[shift={(0.5,8.2)}]
    \\draw[fill=white, draw=gray!40, rounded corners=4pt] (0,0) rectangle (4.2,2.3);
    \\node[font=\\bfseries\\scriptsize, text=slate!90] at (2.1, 1.95) {KẾT QUẢ GOM CỤM DBSCAN};
    \\node[circle, inner sep=2.5pt, fill=teal!70!black] at (0.4, 1.4) {};
    \\node[right, font=\\scriptsize] at (0.7, 1.4) {Cụm 1: Mũi nhọn (${muinhon.length} HS)};
    \\node[rectangle, inner sep=2.5pt, fill=blue!70!black] at (0.4, 0.95) {};
    \\node[right, font=\\scriptsize] at (0.7, 0.95) {Cụm 2: An toàn (${antoan.length} HS)};
    \\node[regular polygon, regular polygon sides=3, inner sep=1.8pt, fill=red!80!black] at (0.4, 0.5) {};
    \\node[right, font=\\scriptsize] at (0.7, 0.5) {Cụm 3: Nguy cơ liệt (${nguyco.length} HS)};
  \\end{scope}
\\end{tikzpicture}
\\end{document}
`;
}

/**
 * 3. Generate TikZ source code for Cluster Distribution Donut / Pie Chart
 */
export function generateClusterDonutTikz(students: StudentScore[]): string {
  const total = students.length || 1;
  const muinhon = students.filter((s) => s.cluster === 'muinhon').length;
  const antoan = students.filter((s) => s.cluster === 'antoan').length;
  const nguyco = students.filter((s) => s.cluster === 'nguyco').length;

  const pct1 = Math.round((muinhon / total) * 100);
  const pct2 = Math.round((antoan / total) * 100);
  const pct3 = 100 - pct1 - pct2;

  const deg1 = Math.round((pct1 / 100) * 360);
  const deg2 = Math.round(((pct1 + pct2) / 100) * 360);

  return `% ==============================================================================
% BIỂU ĐỒ TRÒN / VÀNH KHĂN TỶ LỆ 3 CỤM HỌC SINH (TIKZ)
% ==============================================================================
\\documentclass[tikz,border=8mm]{standalone}
\\usepackage{amsmath,amsfonts}
\\usepackage{tikz}

\\begin{document}
\\begin{tikzpicture}[scale=1.4]
  \\def\\r{2.4}
  \\def\\inner{1.2}

  % Sector 1: Mũi nhọn (0 deg -> ${deg1} deg)
  \\fill[teal!70!black] (0,0) -- (0:\\r) arc (0:${deg1}:\\r) -- cycle;

  % Sector 2: An toàn (${deg1} deg -> ${deg2} deg)
  \\fill[blue!70!black] (0,0) -- (${deg1}:\\r) arc (${deg1}:${deg2}:\\r) -- cycle;

  % Sector 3: Nguy cơ liệt (${deg2} deg -> 360 deg)
  \\fill[red!80!black] (0,0) -- (${deg2}:\\r) arc (${deg2}:360:\\r) -- cycle;

  % White Center Cutout
  \\fill[white] (0,0) circle (\\inner);
  \\node[align=center, font=\\bfseries\\small] at (0,0) {Tổng số\\\\${total} HS};

  % Labels and Lines
  \\node[font=\\bfseries\\footnotesize, text=teal!90!black] at (${deg1 / 2}:${1.85}) {${pct1}\\%};
  \\node[font=\\bfseries\\footnotesize, text=blue!90!black] at (${(deg1 + deg2) / 2}:${1.85}) {${pct2}\\%};
  \\node[font=\\bfseries\\footnotesize, text=red!90!black] at (${(deg2 + 360) / 2}:${1.85}) {${pct3}\\%};

  % Legend
  \\begin{scope}[shift={(3.4, 1.0)}]
    \\node[circle, fill=teal!70!black, inner sep=3.5pt] at (0,0.6) {};
    \\node[right, font=\\small\\bfseries] at (0.3, 0.6) {Mũi nhọn: ${muinhon} HS (${pct1}\\%)};

    \\node[circle, fill=blue!70!black, inner sep=3.5pt] at (0,0) {};
    \\node[right, font=\\small\\bfseries] at (0.3, 0) {An toàn: ${antoan} HS (${pct2}\\%)};

    \\node[circle, fill=red!80!black, inner sep=3.5pt] at (0,-0.6) {};
    \\node[right, font=\\small\\bfseries] at (0.3, -0.6) {Nguy cơ liệt: ${nguyco} HS (${pct3}\\%)};
  \\end{scope}
\\end{tikzpicture}
\\end{document}
`;
}

/**
 * 4. Generate TikZ source code for Lesson Study Cycle (Sơ đồ nghiên cứu bài học 4 bước)
 * Theo Công văn 5555/BGDĐT-GDTrH
 */
export function generateLessonStudyWorkflowTikz(meetingData?: MeetingMinutesData): string {
  const teacher = meetingData?.demonstrationLesson?.teacher || 'ThS. Nguyễn Bảo Ngưng';
  const topic = meetingData?.demonstrationLesson?.topic || 'Phương trình mũ và lôgarit (Toán 12)';

  return `% ==============================================================================
% SƠ ĐỒ CHU TRÌNH NGHIÊN CỨU BÀI HỌC 4 BƯỚC (CÔNG VĂN 5555/BGDĐT)
% Áp dụng cho Tổ chuyên môn GDNN-GDTX & THPT
% ==============================================================================
\\documentclass[tikz,border=10mm]{standalone}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{tikz}
\\usetikzlibrary{calc,arrows.meta,shapes.geometric}

\\begin{document}
\\begin{tikzpicture}[
  >=stealth,
  node distance=3.6cm,
  block/.style={
    rectangle,
    draw=blue!80!black,
    fill=blue!8,
    thick,
    rounded corners=10pt,
    text width=5.2cm,
    minimum height=2.2cm,
    align=center,
    font=\\small
  },
  arrow/.style={
    ->,
    draw=blue!80!black,
    line width=2pt,
    >=Latex[length=4mm]
  }
]
  % Center Info Box
  \\node[circle, draw=emerald!80!black, fill=emerald!10, very thick, text width=3.4cm, align=center, font=\\footnotesize\\bfseries] (center) at (3.5,-2.2) {
    \\textbf{NGHIÊN CỨU BÀI HỌC}\\\\[2pt]
    \\scriptsize GV: ${teacher}\\\\
    Chuyên đề: ${topic}
  };

  % 4 Steps Nodes
  \\node[block] (step1) at (0, 0) {
    \\textbf{\\color{blue!90!black} BƯỚC 1: XÂY DỰNG BÀI DẠY}\\\\[3pt]
    \\footnotesize Cùng thảo luận mục tiêu cần đạt, phân tích khó khăn và dự kiến hoạt động học.
  };

  \\node[block] (step2) at (7, 0) {
    \\textbf{\\color{emerald!90!black} BƯỚC 2: DẠY & QUAN SÁT}\\\\[3pt]
    \\footnotesize Tập trung quan sát hành vi, khả năng tiếp thu và tương tác của học sinh.
  };

  \\node[block] (step3) at (7, -4.4) {
    \\textbf{\\color{purple!90!black} BƯỚC 3: SUY NGẪM & THẢO LUẬN}\\\\[3pt]
    \\footnotesize Phân tích minh chứng việc học của học sinh, không đánh giá xếp loại giáo viên.
  };

  \\node[block] (step4) at (0, -4.4) {
    \\textbf{\\color{amber!90!black} BƯỚC 4: VẬN DỤNG THỰC TIỄN}\\\\[3pt]
    \\footnotesize Rút kinh nghiệm, cải tiến giáo án và nhân rộng trong toàn tổ chuyên môn.
  };

  % Connectors
  \\draw[arrow] (step1.east) -- (step2.west);
  \\draw[arrow] (step2.south) -- (step3.north);
  \\draw[arrow] (step3.west) -- (step4.east);
  \\draw[arrow] (step4.north) -- (step1.south);
\\end{tikzpicture}
\\end{document}
`;
}

/**
 * 5. Generate TikZ source code for AI Department 4-Step Core Workflow
 */
export function generateAiWorkflowTikz(): string {
  return `% ==============================================================================
% SƠ ĐỒ QUY TRÌNH QUẢN LÝ CHUYÊN MÔN AI 4 BƯỚC KHÉP KÍN (TIKZ)
% ==============================================================================
\\documentclass[tikz,border=8mm]{standalone}
\\usepackage{amsmath,amsfonts}
\\usepackage{tikz}
\\usetikzlibrary{calc,arrows.meta}

\\begin{document}
\\begin{tikzpicture}[
  >=stealth,
  stepbox/.style={
    rectangle,
    draw=#1!80!black,
    fill=#1!10,
    very thick,
    rounded corners=8pt,
    text width=8.5cm,
    minimum height=1.6cm,
    align=left,
    font=\\small
  },
  arrowlink/.style={
    ->,
    draw=slate!80,
    line width=2.2pt,
    >=Latex[length=4.5mm]
  }
]
  \\node[stepbox=blue] (s1) at (0, 6.0) {
    \\textbf{\\color{blue!90!black} BƯỚC 1: KHỞI TẠO HỒ SƠ CHUYÊN MÔN THEO NĐ 30 \& CV 5512}\\\\
    \\footnotesize Thiết lập môn học, thời khóa biểu và cấu trúc phân phối chương trình giáo dục.
  };

  \\node[stepbox=teal] (s2) at (0, 4.0) {
    \\textbf{\\color{teal!90!black} BƯỚC 2: NẠP DỮ LIỆU ĐIỂM SỐ KHẢO SÁT \& THI THỬ EXCEL}\\\\
    \\footnotesize Tự động trích xuất điểm thường xuyên, giữa kỳ và kỳ thi khảo sát 40 học sinh.
  };

  \\node[stepbox=purple] (s3) at (0, 2.0) {
    \\textbf{\\color{purple!90!black} BƯỚC 3: AI PHÂN CỤM DBSCAN \& ĐỊNH DANH NGUY CƠ ĐIỂM LIỆT}\\\\
    \\footnotesize Gom 3 nhóm năng lực (Mũi nhọn, An toàn, Nguy cơ liệt) và ghép đôi bạn cùng tiến.
  };

  \\node[stepbox=emerald] (s4) at (0, 0.0) {
    \\textbf{\\color{emerald!90!black} BƯỚC 4: XUẤT BIÊN BẢN, ĐỀ THI 2025 \& MINH CHỨNG TEMIS}\\\\
    \\footnotesize Hoàn chỉnh văn bản Word, đề thi LaTeX/TikZ thuần và minh chứng 15 tiêu chí TT 20.
  };

  \\draw[arrowlink] (s1) -- (s2);
  \\draw[arrowlink] (s2) -- (s3);
  \\draw[arrowlink] (s3) -- (s4);
\\end{tikzpicture}
\\end{document}
`;
}

/**
 * 6. Generate TikZ source code for Teacher TEMIS Competency Radar / Spider Chart
 */
export function generateTemisRadarTikz(teacher?: TeacherProfile): string {
  const name = teacher?.name || 'Nguyễn Văn Tâm';
  const role = teacher?.duty || 'Tổ trưởng';

  return `% ==============================================================================
% BIỂU ĐỒ RADAR 5 TIÊU CHUẨN NGHỀ NGHIỆP GIÁO VIÊN (TEMIS - THÔNG TƯ 20/2018)
% Giáo viên: ${name} (${role})
% ==============================================================================
\\documentclass[tikz,border=10mm]{standalone}
\\usepackage{amsmath,amsfonts}
\\usepackage{tikz}

\\begin{document}
\\begin{tikzpicture}[scale=1.5]
  \\def\\r{3.0}

  % Grid Rings
  \\foreach \\lvl in {1, 2, 3, 4} {
    \\draw[gray!30, thin] (0,0) circle (\\lvl * 0.7);
  }

  % 5 Axes for 5 Standards
  \\foreach \\i/\\label in {
    0/{Tiêu chuẩn 1: Phẩm chất},
    1/{Tiêu chuẩn 2: Chuyên môn},
    2/{Tiêu chuẩn 3: Xây dựng MT},
    3/{Tiêu chuẩn 4: Phát triển CS},
    4/{Tiêu chuẩn 5: Ngoại ngữ/CNTT}
  } {
    \\draw[gray!50, dashed] (0,0) -- (90 + \\i*72:\\r);
    \\node[align=center, font=\\bfseries\\footnotesize, text=slate!90] at (90 + \\i*72: \\r + 0.5) {\\label};
  }

  % Score polygon: 5 standards mapped to level 4 (Tốt) and 3 (Khá)
  \\fill[emerald!30, opacity=0.6]
    (90 + 0*72: 2.8) --
    (90 + 1*72: 2.8) --
    (90 + 2*72: 2.4) --
    (90 + 3*72: 2.6) --
    (90 + 4*72: 2.2) -- cycle;

  \\draw[emerald!80!black, line width=2pt]
    (90 + 0*72: 2.8) --
    (90 + 1*72: 2.8) --
    (90 + 2*72: 2.4) --
    (90 + 3*72: 2.6) --
    (90 + 4*72: 2.2) -- cycle;

  % Vertex dots
  \\foreach \\angle/\\dist in {0/2.8, 1/2.8, 2/2.4, 3/2.6, 4/2.2} {
    \\fill[emerald!90!black] (90 + \\angle*72: \\dist) circle (3pt);
  }

  % Center Label
  \\node[align=center, font=\\bfseries\\small, text=slate!80] at (0, -3.8) {
    \\textbf{ĐÁNH GIÁ NĂNG LỰC NGHỀ NGHIỆP: ${name.toUpperCase()}}\\\\
    \\footnotesize Xếp loại chuẩn nghề nghiệp: \\textbf{\\color{emerald!80!black} XUẤT SẮC / TỐT}
  };
\\end{tikzpicture}
\\end{document}
`;
}

/**
 * 7. Generate TikZ source code for Online Exam Score Spectrum
 */
export function generateOnlineExamSpectrumTikz(
  scores: number[],
  examTitle: string = 'ĐỀ KHẢO SÁT ÔN THI TỐT NGHIỆP THPT 2025'
): string {
  const bins = [0, 0, 0, 0, 0, 0];
  scores.forEach((sc) => {
    if (sc <= 2.0) bins[0]++;
    else if (sc <= 3.5) bins[1]++;
    else if (sc <= 5.0) bins[2]++;
    else if (sc <= 6.5) bins[3]++;
    else if (sc <= 8.0) bins[4]++;
    else bins[5]++;
  });

  const maxBin = Math.max(...bins, 1);
  const yMax = Math.ceil((maxBin + 3) / 2) * 2;

  return `% ==============================================================================
% BIỂU ĐỒ PHỔ ĐIỂM THI TRỰC TUYẾN CHẤM TỰ ĐỘNG BỘ GD 2025 (TIKZ / LATEX)
% Tự động tổng hợp từ ${scores.length} lượt nộp bài
% ==============================================================================
\\documentclass[tikz,border=8mm]{standalone}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usetikzlibrary{calc,patterns,arrows.meta}

\\begin{document}
\\begin{tikzpicture}[>=stealth]
  \\begin{axis}[
    ybar,
    title={\\large\\textbf{${examTitle.toUpperCase()}}},
    xlabel={\\textbf{Dải điểm (Thang điểm 10)}},
    ylabel={\\textbf{Số lượng thí sinh}},
    symbolic x coords={0--2đ, 2.1--3.5đ, 3.6--5.0đ, 5.1--6.5đ, 6.6--8.0đ, 8.1--10đ},
    xtick=data,
    nodes near coords,
    nodes near coords style={font=\\bfseries\\small},
    nodes near coords align={vertical},
    ymin=0, ymax=${yMax},
    bar width=24pt,
    enlarge x limits=0.12,
    width=14cm, height=8.5cm,
    grid=major,
    grid style={dashed, gray!30},
    x tick label style={font=\\footnotesize},
    y tick label style={font=\\small},
    title style={font=\\bfseries, yshift=4pt}
  ]
    \\addplot[fill=red!80!black, draw=red!90!black] coordinates {(0--2đ, ${bins[0]})};
    \\addplot[fill=red!45, draw=red!70] coordinates {(2.1--3.5đ, ${bins[1]})};
    \\addplot[fill=amber!60, draw=amber!80] coordinates {(3.6--5.0đ, ${bins[2]})};
    \\addplot[fill=blue!40, draw=blue!60] coordinates {(5.1--6.5đ, ${bins[3]})};
    \\addplot[fill=blue!75, draw=blue!90] coordinates {(6.6--8.0đ, ${bins[4]})};
    \\addplot[fill=teal!70!black, draw=teal!90] coordinates {(8.1--10đ, ${bins[5]})};
  \\end{axis}
\\end{tikzpicture}
\\end{document}
`;
}

/**
 * 8. Generate All-in-One Multi-page LaTeX Document with all 6 charts & diagrams
 */
export function generateAllChartsBundleTikz(
  students: StudentScore[],
  meetingData?: MeetingMinutesData,
  teacher?: TeacherProfile
): string {
  const spectrumCode = generateScoreSpectrumTikz(students);
  const dbscanCode = generateDbscanScatterTikz(students);
  const donutCode = generateClusterDonutTikz(students);
  const lessonCode = generateLessonStudyWorkflowTikz(meetingData);
  const workflowCode = generateAiWorkflowTikz();
  const temisCode = generateTemisRadarTikz(teacher);

  const extractBody = (src: string) => {
    const beginIdx = src.indexOf('\\begin{tikzpicture}');
    const endIdx = src.indexOf('\\end{tikzpicture}');
    if (beginIdx !== -1 && endIdx !== -1) {
      return src.substring(beginIdx, endIdx + 17);
    }
    return src;
  };

  return `% ==============================================================================
% TỔNG HỢP TOÀN BỘ BIỂU ĐỒ & SƠ ĐỒ CHUYÊN MÔN (LATEX / TIKZ THUẦN)
% Hệ thống Quản trị Tổ Chuyên môn GDNN-GDTX & THPT
% Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}
% ==============================================================================
\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{geometry}
\\geometry{a4paper, margin=2cm}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usetikzlibrary{calc,arrows.meta,shapes.geometric,patterns}
\\usepackage{caption}
\\usepackage{subcaption}

\\title{\\textbf{HỒ SƠ BẢN VẼ TIKZ CHUYÊN MÔN NĂM HỌC 2026--2027}\\\\
\\large TỔ TOÁN -- TIN -- CÔNG NGHỆ}
\\author{Hệ thống AI Quản Trị Tổ Chuyên Môn}
\\date{\\today}

\\begin{document}
\\maketitle
\\tableofcontents
\\newpage

\\section{Biểu đồ Phổ điểm Khảo sát Môn Toán (pgfplots)}
\\begin{figure}[htbp]
\\centering
${extractBody(spectrumCode)}
\\caption{Phổ điểm khảo sát ôn thi tốt nghiệp THPT khối 12 (${students.length} học sinh)}
\\end{figure}

\\newpage
\\section{Biểu đồ Phân tán Gom cụm DBSCAN 2D}
\\begin{figure}[htbp]
\\centering
${extractBody(dbscanCode)}
\\caption{Phân cụm năng lực DBSCAN: Điểm thường xuyên vs Điểm thi khảo sát}
\\end{figure}

\\newpage
\\section{Biểu đồ Tròn Tỷ lệ 3 Cụm Năng lực}
\\begin{figure}[htbp]
\\centering
${extractBody(donutCode)}
\\caption{Tỷ lệ phần trăm 3 cụm học sinh (Mũi nhọn, An toàn, Nguy cơ liệt)}
\\end{figure}

\\newpage
\\section{Sơ đồ Chu trình Nghiên cứu Bài học 4 Bước (CV 5555)}
\\begin{figure}[htbp]
\\centering
${extractBody(lessonCode)}
\\caption{Quy trình sinh hoạt tổ chuyên môn theo nghiên cứu bài học (Công văn 5555/BGDĐT)}
\\end{figure}

\\newpage
\\section{Sơ đồ Quy trình Quản trị Chuyên môn AI 4 Bước}
\\begin{figure}[htbp]
\\centering
${extractBody(workflowCode)}
\\caption{Quy trình quản trị chuyên môn số hóa khép kín theo Nghị định 30 \\& TT 20}
\\end{figure}

\\newpage
\\section{Biểu đồ Radar Năng lực Nghề nghiệp Giáo viên TEMIS (TT 20)}
\\begin{figure}[htbp]
\\centering
${extractBody(temisCode)}
\\caption{Đánh giá 5 tiêu chuẩn chuẩn nghề nghiệp giáo viên cơ sở giáo dục phổ thông}
\\end{figure}

\\end{document}
`;
}

/**
 * Download arbitrary LaTeX/TikZ content as a .tex file
 */
export function downloadTexFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.tex') ? fileName : `${fileName}.tex`;
  link.click();
  URL.revokeObjectURL(url);
}

