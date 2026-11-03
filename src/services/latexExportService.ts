import { ExamPaper } from '../types';

export const generateLatexDocument = (exam: ExamPaper): string => {
  const isMath = exam.subject === 'Toán học';

  return `% ==============================================================================
% ĐỀ THI: ${exam.title.toUpperCase()}
% MÔN: ${exam.subject.toUpperCase()} - KHỐI ${exam.grade}
% MÃ ĐỀ: ${exam.examCode} | NĂM HỌC: ${exam.schoolYear}
% BIÊN SOẠN CHUẨN CẤU TRÚC MỚI 2025 BỘ GIÁO DỤC VÀ ĐÀO TẠO
% CÔNG THỨC TOÁN LATEX & HÌNH VẼ TIKZ THUẦN
% ==============================================================================

\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{geometry}
\\geometry{a4paper, left=20mm, right=15mm, top=20mm, bottom=20mm}

\\usepackage{tikz}
\\usepackage{tkz-tab}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usetikzlibrary{calc,arrows.meta,angles,quotes,intersections,patterns}
\\usepackage{multicol}
\\usepackage{enumitem}
\\usepackage{tabularx}
\\usepackage{fancyhdr}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{${exam.schoolName} - ${exam.deptName}}
\\fancyhead[R]{Môn ${exam.subject} - Mã đề ${exam.examCode}}
\\fancyfoot[C]{\\thepage}

\\begin{document}

% ------------------ TIÊU ĐỀ ĐỀ THI ------------------
\\begin{table}[h!]
\\noindent
\\begin{tabularx}{\\textwidth}{@{}X r@{}}
\\textbf{SỞ GIÁO DỤC VÀ ĐÀO TẠO} & \\textbf{${exam.title.toUpperCase()}} \\\\
\\textbf{${exam.schoolName}} & \\textbf{NĂM HỌC ${exam.schoolYear}} \\\\
\\textit{${exam.deptName}} & \\textbf{Môn: ${exam.subject.toUpperCase()} - Khối ${exam.grade}} \\\\
\\rule{4cm}{0.4pt} & \\textit{Thời gian: ${exam.durationMinutes} phút (không kể thời gian phát đề)} \\\\
& \\textbf{MÃ ĐỀ THI: ${exam.examCode}}
\\end{tabularx}
\\end{table}

\\vspace{0.3cm}
\\noindent\\fbox{%
\\parbox{\\textwidth}{%
\\textbf{Họ và tên thí sinh:} \\dotfill \\quad \\textbf{Số báo danh:} \\dotfill \\quad \\textbf{Phòng thi:} \\dots\\dots
}%
}

\\vspace{0.3cm}
\\noindent\\textit{* Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.} \\\\
\\noindent\\textit{* ${exam.structureNote}}

\\vspace{0.4cm}
% ==============================================================================
% PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN
% ==============================================================================
\\noindent\\textbf{\\large PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn} \\\\
\\noindent\\textit{(Thí sinh trả lời từ câu 1 đến câu ${exam.part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án).}

\\begin{enumerate}[label=\\textbf{Câu \\arabic*.}]
${exam.part1
  .map(
    (q) => `
\\item ${q.content}
${
  q.tikzCode
    ? `
\\begin{center}
${q.tikzCode}
\\end{center}`
    : ''
}
\\begin{multicols}{2}
\\begin{itemize}[label=]
  \\item \\textbf{A.} ${q.options.A}
  \\item \\textbf{B.} ${q.options.B}
  \\item \\textbf{C.} ${q.options.C}
  \\item \\textbf{D.} ${q.options.D}
\\end{itemize}
\\end{multicols}
`
  )
  .join('\n')}
\\end{enumerate}

${
  exam.part2 && exam.part2.length > 0
    ? `
\\vspace{0.5cm}
% ==============================================================================
% PHẦN II: TRẮC NGHIỆM ĐÚNG SAI
% ==============================================================================
\\noindent\\textbf{\\large PHẦN II. Câu trắc nghiệm đúng sai} \\\\
\\noindent\\textit{(Thí sinh trả lời từ câu 1 đến câu ${exam.part2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai).}

\\begin{enumerate}[label=\\textbf{Câu \\arabic*.}]
${exam.part2
  .map(
    (q) => `
\\item ${q.mainStem}
${
  q.tikzCode
    ? `
\\begin{center}
${q.tikzCode}
\\end{center}`
    : ''
}
\\begin{enumerate}[label=\\alph*)]
${q.subItems.map((sub) => `  \\item ${sub.statement}`).join('\n')}
\\end{enumerate}
`
  )
  .join('\n')}
\\end{enumerate}
`
    : ''
}

${
  exam.part3 && exam.part3.length > 0
    ? `
\\vspace{0.5cm}
% ==============================================================================
% PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN
% ==============================================================================
\\noindent\\textbf{\\large PHẦN III. Câu trắc nghiệm trả lời ngắn} \\\\
\\noindent\\textit{(Thí sinh trả lời từ câu 1 đến câu ${exam.part3.length}. Điền câu trả lời ngắn vào phiếu trả lời).}

\\begin{enumerate}[label=\\textbf{Câu \\arabic*.}]
${exam.part3
  .map(
    (q) => `
\\item ${q.content}
${
  q.tikzCode
    ? `
\\begin{center}
${q.tikzCode}
\\end{center}`
    : ''
}
\\textit{Trả lời:} \\dotfill
`
  )
  .join('\n')}
\\end{enumerate}
`
    : ''
}

\\vspace{0.8cm}
\\begin{center}
\\textbf{------------------------ HẾT ------------------------}
\\end{center}

\\newpage
% ==============================================================================
% BẢNG ĐÁP ÁN & HƯỚNG DẪN GIẢI CHI TIẾT
% ==============================================================================
\\begin{center}
\\textbf{\\Large ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI CHI TIẾT} \\\\
\\textbf{MÔN: ${exam.subject.toUpperCase()} - MÃ ĐỀ: ${exam.examCode}}
\\end{center}

\\vspace{0.3cm}
\\noindent\\textbf{1. Bảng đáp án Phần I:}
\\begin{center}
\\begin{tabular}{|${exam.part1.map(() => 'c|').join('')}}
\\hline
${exam.part1.map((q) => `\\textbf{${q.order}}`).join(' & ')} \\\\
\\hline
${exam.part1.map((q) => `\\textbf{${q.correctAnswer}}`).join(' & ')} \\\\
\\hline
\\end{tabular}
\\end{center}

${
  exam.part2 && exam.part2.length > 0
    ? `
\\vspace{0.3cm}
\\noindent\\textbf{2. Đáp án Phần II (Đúng/Sai):}
\\begin{center}
\\begin{tabular}{|c|c|c|c|c|}
\\hline
\\textbf{Câu} & \\textbf{Lệnh hỏi a)} & \\textbf{Lệnh hỏi b)} & \\textbf{Lệnh hỏi c)} & \\textbf{Lệnh hỏi d)} \\\\
\\hline
${exam.part2
  .map(
    (q) => `\\textbf{${q.order}} & ${q.subItems
      .map((s) => (s.isCorrect ? '\\textbf{Đúng}' : '\\textbf{Sai}'))
      .join(' & ')} \\\\ \\hline`
  )
  .join('\n')}
\\end{tabular}
\\end{center}
`
    : ''
}

${
  exam.part3 && exam.part3.length > 0
    ? `
\\vspace{0.3cm}
\\noindent\\textbf{3. Đáp án Phần III (Trả lời ngắn):}
\\begin{center}
\\begin{tabular}{|c|c|}
\\hline
\\textbf{Câu} & \\textbf{Đáp số} \\\\
\\hline
${exam.part3.map((q) => `\\textbf{${q.order}} & \\textbf{${q.correctAnswer}} \\\\ \\hline`).join('\n')}
\\end{tabular}
\\end{center}
`
    : ''
}

\\vspace{0.5cm}
\\noindent\\textbf{\\large HƯỚNG DẪN GIẢI CHI TIẾT:}

\\subsection*{Phần I. Trắc nghiệm 4 lựa chọn}
${exam.part1
  .map(
    (q) => `
\\noindent\\textbf{Câu ${q.order}:} (Chọn \\textbf{${q.correctAnswer}}) \\\\
${q.explanation}
\\vspace{0.2cm}
`
  )
  .join('\n')}

${
  exam.part2 && exam.part2.length > 0
    ? `
\\subsection*{Phần II. Đúng / Sai}
${exam.part2
  .map(
    (q) => `
\\noindent\\textbf{Câu ${q.order}:}
\\begin{itemize}
${q.subItems.map((s) => `  \\item \\textbf{${s.key})}: ${s.isCorrect ? 'Đúng' : 'Sai'}. ${s.explanation}`).join('\n')}
\\end{itemize}
\\vspace{0.2cm}
`
  )
  .join('\n')}
`
    : ''
}

${
  exam.part3 && exam.part3.length > 0
    ? `
\\subsection*{Phần III. Trả lời ngắn}
${exam.part3
  .map(
    (q) => `
\\noindent\\textbf{Câu ${q.order}:} Đáp số: \\textbf{${q.correctAnswer}} \\\\
${q.explanation}
\\vspace{0.2cm}
`
  )
  .join('\n')}
`
    : ''
}

\\end{document}
`;
};

export const downloadLatexExam = (exam: ExamPaper): void => {
  const texContent = generateLatexDocument(exam);
  const blob = new Blob([texContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `De_Thi_${exam.subject.replace(/\s+/g, '_')}_MaDe_${exam.examCode}.tex`;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
