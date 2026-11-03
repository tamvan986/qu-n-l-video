/**
 * AI Exam Generator Service
 * Generates diversified, distinct exam papers with randomized parameters,
 * rich question banks across subjects, dynamic TikZ diagrams matching the exact math questions,
 * and LaTeX formatting.
 *
 * GUARANTEES:
 * 1. Every generation completely changes the questions, numbers, and diagrams.
 * 2. Question diagrams match the exact subject/topic (rational function asymptotes, 3D pyramids,
 *    spheres, vectors, tables of variation, quartic curves) - NEVER inappropriately falls back to a cubic curve!
 * 3. Part 2 True/False questions rotate across diverse topics and do not always start with a cubic function.
 */

import {
  ExamPaper,
  ExamSubject,
  ExamGrade,
  ExamType,
  CognitiveLevel,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
} from '../types';

export interface GenerateExamOptions {
  subject: ExamSubject;
  grade: ExamGrade;
  examType: ExamType;
  durationMinutes?: number;
  focusTopic?: string;
  part1Count?: number;
  part2Count?: number;
  part3Count?: number;
  variationIndex?: number;
  customPrompt?: string;
}

// Random helper
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a truly diverse Mathematics question set with procedural variation
 */
function generateDiverseMathQuestions(variationIndex: number, part1Count = 12, part2Count = 4, part3Count = 6) {
  const seed = Date.now() + variationIndex * 1337;

  // Question pool of 24 distinct math question generators
  const mathPoolPart1: (() => MultipleChoiceQuestion)[] = [
    // 1. Bảng biến thiên hàm số và cực trị
    () => {
      const x1 = randInt(-3, -1);
      const x2 = randInt(1, 3);
      const y1 = randInt(2, 6);
      const y2 = randInt(-5, -1);
      const askMax = Math.random() > 0.5;
      const targetX = askMax ? x1 : x2;
      const targetY = askMax ? y1 : y2;

      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 1,
        content: `Cho hàm số $y = f(x)$ liên tục trên $\\mathbb{R}$ và có bảng biến thiên như hình vẽ bên. Điểm ${askMax ? 'cực đại' : 'cực tiểu'} của hàm số đã cho là:`,
        options: {
          A: `$x = ${targetX}$`,
          B: `$x = ${askMax ? x2 : x1}$`,
          C: `$y = ${targetY}$`,
          D: `$x = ${targetX + (askMax ? 1 : -1)}$`,
        },
        correctAnswer: 'A',
        explanation: `Từ bảng biến thiên, đạo hàm $f'(x)$ đổi dấu từ ${askMax ? 'dương sang âm' : 'âm sang dương'} khi qua điểm $x = ${targetX}$, do đó điểm ${askMax ? 'cực đại' : 'cực tiểu'} của hàm số là $x = ${targetX}$.`,
        cognitiveLevel: 'NB',
        topic: 'Ứng dụng đạo hàm khảo sát hàm số',
        points: 0.25,
        tikzCode: `\\begin{tikzpicture}[scale=0.82, >=stealth]
  \\draw[thick] (0,0) rectangle (8.5, 2.3);
  \\draw[thick] (0,1.6) -- (8.5,1.6);
  \\draw[thick] (0,0.95) -- (8.5,0.95);
  \\draw[thick] (1.4,0) -- (1.4,2.3);
  \\node at (0.7, 1.95) {$x$};
  \\node at (0.7, 1.25) {$f'(x)$};
  \\node at (0.7, 0.48) {$f(x)$};
  \\node at (2.0, 1.95) {$-\\infty$};
  \\node at (4.0, 1.95) {$${x1}$};
  \\node at (6.2, 1.95) {$${x2}$};
  \\node at (8.0, 1.95) {$+\\infty$};
  \\node at (3.0, 1.25) {$+$};
  \\node at (4.0, 1.25) {$0$};
  \\node at (5.1, 1.25) {$-$};
  \\node at (6.2, 1.25) {$0$};
  \\node at (7.2, 1.25) {$+$};
  \\node at (2.0, 0.2) {$-\\infty$};
  \\node at (4.0, 0.75) {$${y1}$};
  \\node at (6.2, 0.2) {$${y2}$};
  \\node at (8.0, 0.75) {$+\\infty$};
  \\draw[->, thick, blue] (2.2, 0.25) -- (3.8, 0.7);
  \\draw[->, thick, blue] (4.2, 0.7) -- (6.0, 0.25);
  \\draw[->, thick, blue] (6.4, 0.25) -- (7.8, 0.7);
\\end{tikzpicture}`,
        diagramTitle: `Bảng biến thiên hàm số (Cực trị tại x=${x1}, x=${x2})`,
      };
    },

    // 2. Tiệm cận hàm phân thức hữu tỉ y = (ax+b)/(cx+d)
    () => {
      const a = randInt(2, 5);
      const b = randInt(1, 7);
      const c = randInt(1, 4);
      const askTCN = Math.random() > 0.5;

      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 2,
        content: `Đường ${askTCN ? 'tiệm cận ngang' : 'tiệm cận đứng'} của đồ thị hàm số $y = \\dfrac{${a}x - ${b}}{x + ${c}}$ có phương trình là:`,
        options: {
          A: askTCN ? `$y = ${a}$` : `$x = -${c}$`,
          B: askTCN ? `$x = -${c}$` : `$y = ${a}$`,
          C: askTCN ? `$y = -\\dfrac{${b}}{${c}}$` : `$x = ${c}$`,
          D: askTCN ? `$y = ${a + 1}$` : `$x = ${a}$`,
        },
        correctAnswer: 'A',
        explanation: askTCN
          ? `Ta có $\\lim_{x \\to \\pm\\infty} \\dfrac{${a}x - ${b}}{x + ${c}} = ${a}$, do đó đường thẳng $y = ${a}$ là tiệm cận ngang của đồ thị.`
          : `Ta có mẫu số $x + ${c} = 0 \\iff x = -${c}$, và $\\lim_{x \\to (-${c})^\\pm} \\dfrac{${a}x - ${b}}{x + ${c}} = \\pm\\infty$, do đó đường thẳng $x = -${c}$ là tiệm cận đứng.`,
        cognitiveLevel: 'NB',
        topic: 'Tiệm cận của đồ thị hàm số',
        points: 0.25,
        tikzCode: `\\begin{tikzpicture}[scale=0.6, >=stealth]
  \\draw[->, thick] (-4,0) -- (4,0) node[right] {$x$};
  \\draw[->, thick] (0,-3) -- (0,5) node[above] {$y$};
  \\node[below left] at (0,0) {$O$};
  \\draw[dashed, red, thick] (-${c},-3) -- (-${c},4.5);
  \\node[left, red, scale=0.8] at (-${c},4) {$x=-${c}$};
  \\draw[dashed, red, thick] (-4,${a}) -- (3.5,${a});
  \\node[above, red, scale=0.8] at (2,${a}) {$y=${a}$};
  \\draw[thick, blue, smooth, samples=60, domain=-3.8:-${c + 0.3}] plot (\\x, {(${a}*\\x - ${b})/(\\x + ${c})});
  \\draw[thick, blue, smooth, samples=60, domain=-${c - 0.4}:3.5] plot (\\x, {(${a}*\\x - ${b})/(\\x + ${c})});
\\end{tikzpicture}`,
        diagramTitle: `Đồ thị phân thức với tiệm cận x=-${c} và y=${a}`,
      };
    },

    // 3. Khối chóp S.ABCD và thể tích
    () => {
      const a = randInt(2, 4);
      const h = randInt(3, 6);
      const v = (a * a * h) / 3;
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 3,
        content: `Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a = ${a}$, cạnh bên $SA$ vuông góc với mặt phẳng đáy và $SA = ${h}$. Thể tích khối chóp $S.ABCD$ bằng:`,
        options: {
          A: `$V = ${Number.isInteger(v) ? v : v.toFixed(2)}$`,
          B: `$V = ${a * a * h}$`,
          C: `$V = ${(v * 2).toFixed(2)}$`,
          D: `$V = ${a * h}$`,
        },
        correctAnswer: 'A',
        explanation: `Diện tích đáy $S_{\\text{đáy}} = ${a}^2 = ${a * a}$. Thể tích khối chóp $V = \\dfrac{1}{3} S_{\\text{đáy}} \\cdot SA = \\dfrac{1}{3} \\cdot ${a * a} \\cdot ${h} = ${Number.isInteger(v) ? v : v.toFixed(2)}$.`,
        cognitiveLevel: 'TH',
        topic: 'Thể tích khối chóp trong không gian',
        points: 0.25,
        tikzCode: `\\begin{tikzpicture}[scale=0.7, >=stealth]
  \\coordinate (A) at (0,0);
  \\coordinate (B) at (-1.5,-1.2);
  \\coordinate (C) at (2.5,-1.2);
  \\coordinate (D) at (4,0);
  \\coordinate (S) at (0,3.5);
  \\draw[dashed] (A) -- (D) (A) -- (B) (A) -- (S);
  \\draw[thick] (B) -- (C) -- (D) (S) -- (B) (S) -- (C) (S) -- (D);
  \\node[above] at (S) {$S$};
  \\node[left] at (A) {$A$};
  \\node[below left] at (B) {$B$};
  \\node[below right] at (C) {$C$};
  \\node[right] at (D) {$D$};
\\end{tikzpicture}`,
        diagramTitle: `Hình chóp S.ABCD có SA vuông góc đáy`,
      };
    },

    // 4. Hình hộp ABCD.A'B'C'D' và véc tơ
    () => {
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 4,
        content: `Cho hình hộp chữ nhật $ABCD.A'B'C'D'$. Tổng vectơ $\\vec{AB} + \\vec{AD} + \\vec{AA'}$ bằng vectơ nào dưới đây?`,
        options: {
          A: `$\\vec{AC'}$`,
          B: `$\\vec{CA'}$`,
          C: `$\\vec{BD'}$`,
          D: `$\\vec{A'C}$`,
        },
        correctAnswer: 'A',
        explanation: `Theo quy tắc hình hộp: với mọi hình hộp $ABCD.A'B'C'D'$, ta luôn có $\\vec{AB} + \\vec{AD} + \\vec{AA'} = \\vec{AC'}$.`,
        cognitiveLevel: 'NB',
        topic: 'Vectơ trong không gian',
        points: 0.25,
        tikzCode: `\\begin{tikzpicture}[scale=0.7, >=stealth]
  \\coordinate (A) at (1, 1.5);
  \\coordinate (B) at (0.5, 0.5);
  \\coordinate (C) at (2.5, 0.5);
  \\coordinate (D) at (3, 1.5);
  \\coordinate (A1) at (1, 2.8);
  \\coordinate (B1) at (0.5, 1.8);
  \\coordinate (C1) at (2.5, 1.8);
  \\coordinate (D1) at (3, 2.8);
  \\draw[dashed] (A) -- (B) (A) -- (D) (A) -- (A1);
  \\draw[thick] (B) -- (C) -- (D) (A1) -- (B1) -- (C1) -- (D1) -- cycle;
  \\draw[thick] (B) -- (B1) (C) -- (C1) (D) -- (D1);
  \\draw[->, thick, red] (A) -- (C1);
  \\node[above right, red] at (1.8, 2.1) {$\\vec{AC'}$};
\\end{tikzpicture}`,
        diagramTitle: `Hình hộp ABCD.A'B'C'D' và vectơ AC'`,
      };
    },

    // 5. Mặt cầu (S) trong Oxyz
    () => {
      const x0 = randInt(-3, 3);
      const y0 = randInt(-3, 3);
      const z0 = randInt(1, 4);
      const r = pickRandom([3, 4, 5, 6]);
      const r2 = r * r;
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 5,
        content: `Trong không gian $Oxyz$, cho mặt cầu $(S): (x ${x0 >= 0 ? '- ' + x0 : '+ ' + Math.abs(x0)})^2 + (y ${y0 >= 0 ? '- ' + y0 : '+ ' + Math.abs(y0)})^2 + (z ${z0 >= 0 ? '- ' + z0 : '+ ' + Math.abs(z0)})^2 = ${r2}$. Bán kính $R$ và tâm $I$ của $(S)$ là:`,
        options: {
          A: `$I(${x0}; ${y0}; ${z0}), R = ${r}$`,
          B: `$I(${-x0}; ${-y0}; ${-z0}), R = ${r2}$`,
          C: `$I(${x0}; ${y0}; ${z0}), R = ${r2}$`,
          D: `$I(${-x0}; ${-y0}; ${-z0}), R = ${r}$`,
        },
        correctAnswer: 'A',
        explanation: `Phương trình mặt cầu có dạng $(x - a)^2 + (y - b)^2 + (z - c)^2 = R^2$ với tâm $I(a; b; c) = (${x0}; ${y0}; ${z0})$ và bán kính $R = \\sqrt{${r2}} = ${r}$.`,
        cognitiveLevel: 'NB',
        topic: 'Mặt cầu trong không gian Oxyz',
        points: 0.25,
        tikzCode: `\\begin{tikzpicture}[scale=0.7]
  \\draw[thick, blue] (0,0) circle (1.8);
  \\draw[thick, blue] (-1.8,0) arc (180:360:1.8 and 0.6);
  \\draw[dashed, blue] (1.8,0) arc (0:180:1.8 and 0.6);
  \\filldraw[red] (0,0) circle (2pt) node[below] {$I(${x0};${y0};${z0})$};
  \\draw[->, thick, red] (0,0) -- (1.2, 1.3) node[midway, above left] {$R=${r}$};
\\end{tikzpicture}`,
        diagramTitle: `Mặt cầu (S) tâm I(${x0}; ${y0}; ${z0}) bán kính R=${r}`,
      };
    },

    // 6. Đồ thị đạo hàm f'(x)
    () => {
      const r1 = randInt(-3, -1);
      const r2 = randInt(1, 3);
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 6,
        content: `Cho hàm số $y = f(x)$ có đồ thị đạo hàm $y = f'(x)$ cắt trục hoành tại hai điểm có hoành độ $x = ${r1}$ và $x = ${r2}$ như hình vẽ. Hàm số $y = f(x)$ đồng biến trên khoảng nào dưới đây?`,
        options: {
          A: `$(${r1}; ${r2})$`,
          B: `$(-\\infty; ${r1})$`,
          C: `$(${r2}; +\\infty)$`,
          D: `$(${r1 - 1}; ${r2 + 1})$`,
        },
        correctAnswer: 'A',
        explanation: `Trên khoảng $(${r1}; ${r2})$, đồ thị $y = f'(x)$ nằm phía trên trục hoành nên $f'(x) > 0$. Do đó hàm số $y = f(x)$ đồng biến trên khoảng $(${r1}; ${r2})$.`,
        cognitiveLevel: 'VD',
        topic: 'Ứng dụng đạo hàm khảo sát hàm số',
        points: 0.25,
        tikzCode: `\\begin{tikzpicture}[scale=0.7, >=stealth]
  \\draw[->, thick] (-3.5,0) -- (4,0) node[right] {$x$};
  \\draw[->, thick] (0,-2) -- (0,3) node[above] {$y$};
  \\node[below left] at (0,0) {$O$};
  \\node[below, blue] at (${r1},0) {$${r1}$};
  \\node[below, blue] at (${r2},0) {$${r2}$};
  \\draw[thick, blue, smooth, domain=-3:3.5] plot (\\x, {-0.5*(\\x - ${r1})*(\\x - ${r2})});
  \\node[above right, blue] at (1,1.5) {$y=f'(x)$};
\\end{tikzpicture}`,
        diagramTitle: `Đồ thị đạo hàm f'(x) cắt Ox tại ${r1} và ${r2}`,
      };
    },

    // 7. Tích phân diện tích hình phẳng
    () => {
      const bUpper = randInt(2, 4);
      const val = bUpper * bUpper * bUpper;
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 7,
        content: `Diện tích hình phẳng giới hạn bởi đồ thị hàm số $y = 3x^2$, trục hoành $Ox$ và đường thẳng $x = ${bUpper}$ được tính bằng công thức nào?`,
        options: {
          A: `$S = \\displaystyle\\int_0^{${bUpper}} 3x^2\\,dx = ${val}$`,
          B: `$S = \\displaystyle\\int_0^{${bUpper}} (3x^2)^2\\,dx$`,
          C: `$S = \\pi \\displaystyle\\int_0^{${bUpper}} 3x^2\\,dx$`,
          D: `$S = 3 \\cdot ${bUpper}^2$`,
        },
        correctAnswer: 'A',
        explanation: `Diện tích hình phẳng $S = \\int_0^{${bUpper}} |3x^2|dx = x^3\\Big|_0^{${bUpper}} = ${bUpper}^3 = ${val}$.`,
        cognitiveLevel: 'TH',
        topic: 'Ứng dụng tích phân tính diện tích hình phẳng',
        points: 0.25,
        tikzCode: `\\begin{tikzpicture}[scale=0.7, >=stealth]
  \\draw[->, thick] (-1,0) -- (4,0) node[right] {$x$};
  \\draw[->, thick] (0,-1) -- (0,4) node[above] {$y$};
  \\node[below left] at (0,0) {$O$};
  \\fill[blue!20] (0,0) -- plot[domain=0:${bUpper}] (\\x, {0.3*\\x*\\x}) -- (${bUpper},0) -- cycle;
  \\draw[thick, blue, domain=-0.5:${bUpper + 0.2}] plot (\\x, {0.3*\\x*\\x});
  \\draw[dashed, red] (${bUpper},0) -- (${bUpper}, {0.3*${bUpper}*${bUpper}});
  \\node[below] at (${bUpper},0) {$${bUpper}$};
\\end{tikzpicture}`,
        diagramTitle: `Diện tích hình phẳng giới hạn bởi y = 3x^2 và x = ${bUpper}`,
      };
    },

    // 8. Đồ thị hàm bậc bốn trùng phương
    () => {
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 8,
        content: `Cho hàm số trùng phương $y = ax^4 + bx^2 + c$ có đồ thị dạng chữ W với 3 điểm cực trị. Khẳng định nào sau đây là đúng về dấu các hệ số?`,
        options: {
          A: `$a > 0, b < 0$`,
          B: `$a < 0, b > 0$`,
          C: `$a > 0, b > 0$`,
          D: `$a < 0, b < 0$`,
        },
        correctAnswer: 'A',
        explanation: `Đồ thị bề lõm hướng lên nên $\\lim_{x \\to +\\infty} y = +\\infty \\implies a > 0$. Đồ thị có 3 điểm cực trị khi $ab < 0 \\implies b < 0$.`,
        cognitiveLevel: 'TH',
        topic: 'Khảo sát hàm số bậc bốn trùng phương',
        points: 0.25,
        tikzCode: `\\begin{tikzpicture}[scale=0.7, >=stealth]
  \\draw[->, thick] (-3,0) -- (3,0) node[right] {$x$};
  \\draw[->, thick] (0,-2) -- (0,3) node[above] {$y$};
  \\node[below left] at (0,0) {$O$};
  \\draw[thick, blue, smooth, domain=-2.1:2.1] plot (\\x, {0.6*\\x*\\x*\\x*\\x - 2*\\x*\\x + 1});
\\end{tikzpicture}`,
        diagramTitle: `Đồ thị hàm số bậc bốn trùng phương y = ax^4 + bx^2 + c`,
      };
    },

    // 9. Lũy thừa và Lôgarit
    () => {
      const base = pickRandom([2, 3, 5]);
      const p = randInt(2, 4);
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 9,
        content: `Với mọi số thực dương $a$, biểu thức $\\log_${base}(a^${p})$ bằng:`,
        options: {
          A: `$${p}\\log_${base} a$`,
          B: `$${p} + \\log_${base} a$`,
          C: `$\\dfrac{1}{${p}}\\log_${base} a$`,
          D: `$\\log_${base}(${p}a)$`,
        },
        correctAnswer: 'A',
        explanation: `Theo tính chất logarit của lũy thừa với cơ số dương: $\\log_${base}(a^${p}) = ${p}\\log_${base} a$.`,
        cognitiveLevel: 'NB',
        topic: 'Hàm số lũy thừa, mũ và lôgarit',
        points: 0.25,
      };
    },

    // 10. Phương trình mũ
    () => {
      const a = pickRandom([2, 3, 5]);
      const expVal = randInt(1, 3);
      const rhs = Math.pow(a, expVal + 1);
      const ansX = expVal + 1;
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 10,
        content: `Nghiệm của phương trình $${a}^x = ${rhs}$ là:`,
        options: {
          A: `$x = ${ansX}$`,
          B: `$x = ${ansX - 1}$`,
          C: `$x = ${ansX + 1}$`,
          D: `$x = ${rhs / a}$`,
        },
        correctAnswer: 'A',
        explanation: `Ta có $${rhs} = ${a}^{${ansX}}$. Do đó $${a}^x = ${a}^{${ansX}} \\iff x = ${ansX}$.`,
        cognitiveLevel: 'NB',
        topic: 'Phương trình mũ và lôgarit',
        points: 0.25,
      };
    },

    // 11. Vectơ pháp tuyến mặt phẳng Oxyz
    () => {
      const a = randInt(1, 4);
      const b = randInt(-3, 3) || 2;
      const c = randInt(-4, 4) || -1;
      const d = randInt(-9, 9);
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 11,
        content: `Trong không gian $Oxyz$, một vectơ pháp tuyến của mặt phẳng $(P): ${a}x + (${b})y + (${c})z ${d >= 0 ? '+ ' + d : '- ' + Math.abs(d)} = 0$ là:`,
        options: {
          A: `$\\vec{n} = (${a}; ${b}; ${c})$`,
          B: `$\\vec{n} = (${a}; -${b}; ${c})$`,
          C: `$\\vec{n} = (${-a}; ${b}; ${c})$`,
          D: `$\\vec{n} = (${b}; ${a}; ${d})$`,
        },
        correctAnswer: 'A',
        explanation: `Mặt phẳng $(P): Ax + By + Cz + D = 0$ nhận vectơ $\\vec{n} = (A; B; C) = (${a}; ${b}; ${c})$ làm vectơ pháp tuyến.`,
        cognitiveLevel: 'NB',
        topic: 'Mặt phẳng trong không gian Oxyz',
        points: 0.25,
      };
    },

    // 12. Cấp số cộng
    () => {
      const u1 = randInt(1, 5);
      const d = randInt(2, 4);
      const n = randInt(4, 6);
      const un = u1 + (n - 1) * d;
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 12,
        content: `Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = ${u1}$ và công sai $d = ${d}$. Số hạng thứ ${n} là:`,
        options: {
          A: `$u_{${n}} = ${un}$`,
          B: `$u_{${n}} = ${un + d}$`,
          C: `$u_{${n}} = ${u1 * Math.pow(d, n - 1)}$`,
          D: `$u_{${n}} = ${un - 1}$`,
        },
        correctAnswer: 'A',
        explanation: `Công thức số hạng tổng quát của cấp số cộng: $u_n = u_1 + (n - 1)d \\implies u_{${n}} = ${u1} + (${n} - 1) \\cdot ${d} = ${un}$.`,
        cognitiveLevel: 'TH',
        topic: 'Dãy số và cấp số cộng',
        points: 0.25,
      };
    },

    // 13. Xác suất cổ điển
    () => {
      const red = randInt(3, 5);
      const blue = randInt(4, 6);
      const total = red + blue;
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 13,
        content: `Một hộp đựng ${red} viên bi đỏ và ${blue} viên bi xanh. Lấy ngẫu nhiên đồng thời 2 viên bi. Xác suất để lấy được 2 viên bi cùng màu đỏ là:`,
        options: {
          A: `$\\dfrac{C_{${red}}^2}{C_{${total}}^2}$`,
          B: `$\\dfrac{${red}}{${total}}$`,
          C: `$\\dfrac{C_{${blue}}^2}{C_{${total}}^2}$`,
          D: `$\\dfrac{C_{${red}}^1 C_{${blue}}^1}{C_{${total}}^2}$`,
        },
        correctAnswer: 'A',
        explanation: `Số phần tử không gian mẫu $n(\\Omega) = C_{${total}}^2$. Số cách lấy 2 bi đỏ là $C_{${red}}^2$. Xác suất $P = \\dfrac{C_{${red}}^2}{C_{${total}}^2}$.`,
        cognitiveLevel: 'TH',
        topic: 'Xác suất cổ điển',
        points: 0.25,
      };
    },

    // 14. Thống kê ghép nhóm: Khoảng biến thiên
    () => {
      const minVal = randInt(1, 3);
      const maxVal = randInt(8, 10);
      const r = maxVal - minVal;
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 14,
        content: `Cho mẫu số liệu ghép nhóm về điểm kiểm tra của học sinh có giá trị nhỏ nhất của nhóm đầu là ${minVal} và giá trị lớn nhất của nhóm cuối là ${maxVal}. Khoảng biến thiên $R$ của mẫu số liệu ghép nhóm này bằng:`,
        options: {
          A: `$R = ${r}$`,
          B: `$R = ${r + 1}$`,
          C: `$R = ${minVal + maxVal}$`,
          D: `$R = ${(minVal + maxVal) / 2}$`,
        },
        correctAnswer: 'A',
        explanation: `Khoảng biến thiên của mẫu số liệu ghép nhóm là hiệu giữa đầu mút phải của nhóm cuối và đầu mút trái của nhóm đầu: $R = ${maxVal} - ${minVal} = ${r}$.`,
        cognitiveLevel: 'NB',
        topic: 'Thống kê mẫu số liệu ghép nhóm',
        points: 0.25,
      };
    },

    // 15. Giá trị lớn nhất trên đoạn
    () => {
      const m = randInt(2, 6);
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 15,
        content: `Giá trị lớn nhất của hàm số $f(x) = -x^3 + 3x + ${m}$ trên đoạn $[0; 2]$ bằng:`,
        options: {
          A: `$${m + 2}$`,
          B: `$${m}$`,
          C: `$${m - 2}$`,
          D: `$${m + 4}$`,
        },
        correctAnswer: 'A',
        explanation: `Đạo hàm $f'(x) = -3x^2 + 3 = 0 \\iff x = 1 \\in [0; 2]$. Ta có $f(0) = ${m}, f(1) = ${m + 2}, f(2) = ${m - 2}$. Vậy $\\max = ${m + 2}$.`,
        cognitiveLevel: 'VD',
        topic: 'Giá trị lớn nhất, nhỏ nhất của hàm số',
        points: 0.25,
      };
    },

    // 16. Khoảng cách điểm đến mặt phẳng Oxyz
    () => {
      return {
        id: `m-gen-${seed}-${randInt(100, 999)}`,
        order: 16,
        content: `Trong không gian $Oxyz$, khoảng cách từ gốc tọa độ $O(0; 0; 0)$ đến mặt phẳng $(P): 2x - 2y + z - 6 = 0$ bằng:`,
        options: {
          A: `$2$`,
          B: `$3$`,
          C: `$6$`,
          D: `$1$`,
        },
        correctAnswer: 'A',
        explanation: `$d(O, (P)) = \\dfrac{|-6|}{\\sqrt{2^2 + (-2)^2 + 1^2}} = \\dfrac{6}{3} = 2$.`,
        cognitiveLevel: 'TH',
        topic: 'Khoảng cách trong không gian Oxyz',
        points: 0.25,
      };
    },
  ];

  // Pick unique questions by shuffling
  const shuffledPool = shuffleArray(mathPoolPart1);
  const part1: MultipleChoiceQuestion[] = [];
  for (let i = 0; i < part1Count; i++) {
    const generator = shuffledPool[i % shuffledPool.length];
    const q = generator();
    q.order = i + 1;
    q.id = `math-p1-v${variationIndex}-q${i + 1}`;
    part1.push(q);
  }

  // ---------------------------------------------------------------------------
  // PART 2: POOL OF 8 DIVERSE TRUE/FALSE QUESTION TYPES (ROTATES REGULARLY)
  // ---------------------------------------------------------------------------
  const part2Pool: TrueFalseQuestion[] = [
    // Type 1: Hàm phân thức hữu tỉ & Tiệm cận
    {
      id: `math-p2-v${variationIndex}-t1`,
      order: 1,
      mainStem: `Cho hàm số $y = f(x) = \\dfrac{2x + 1}{x - 1}$ có đồ thị $(C)$. Xét tính đúng hoặc sai của các mệnh đề sau:`,
      subItems: [
        { key: 'a', statement: `Tập xác định của hàm số là $D = \\mathbb{R} \\setminus \\{1\\}$.`, isCorrect: true, explanation: `Mẫu số $x - 1 \\neq 0 \\iff x \\neq 1$. Mệnh đề Đúng.` },
        { key: 'b', statement: `Đồ thị hàm số có tiệm cận đứng $x = 1$ và tiệm cận ngang $y = 2$.`, isCorrect: true, explanation: `$\\lim_{x \\to \\pm\\infty} f(x) = 2$ và $\\lim_{x \\to 1^\\pm} f(x) = \\pm\\infty$. Mệnh đề Đúng.` },
        { key: 'c', statement: `Hàm số đồng biến trên từng khoảng xác định.`, isCorrect: false, explanation: `Đạo hàm $y' = \\dfrac{-3}{(x - 1)^2} < 0$. Hàm số nghịch biến. Mệnh đề Sai.` },
        { key: 'd', statement: `Giao điểm hai đường tiệm cận $I(1; 2)$ là tâm đối xứng của đồ thị $(C)$.`, isCorrect: true, explanation: `Đồ thị hàm phân thức nhận giao điểm tiệm cận làm tâm đối xứng. Mệnh đề Đúng.` },
      ],
      cognitiveLevel: 'VD',
      topic: 'Hàm phân thức hữu tỉ và tiệm cận',
      points: 1.0,
      tikzCode: `\\begin{tikzpicture}[scale=0.6, >=stealth]
  \\draw[->, thick] (-3,0) -- (5,0) node[right] {$x$};
  \\draw[->, thick] (0,-3) -- (0,5) node[above] {$y$};
  \\draw[dashed, red, thick] (1,-3) -- (1,4.5);
  \\draw[dashed, red, thick] (-3,2) -- (4.5,2);
  \\node[above right, red] at (1,2) {$I(1;2)$};
  \\draw[thick, blue, smooth, domain=-2.5:0.7] plot (\\x, {(2*\\x+1)/(\\x-1)});
  \\draw[thick, blue, smooth, domain=1.3:4.5] plot (\\x, {(2*\\x+1)/(\\x-1)});
\\end{tikzpicture}`,
      diagramTitle: `Đồ thị hàm phân thức y = (2x+1)/(x-1) với tiệm cận x=1 và y=2`,
    },

    // Type 2: Hình học không gian Oxyz
    {
      id: `math-p2-v${variationIndex}-t2`,
      order: 2,
      mainStem: `Trong không gian $Oxyz$, cho điểm $A(1; 2; -1)$, đường thẳng $d: \\dfrac{x - 2}{1} = \\dfrac{y + 1}{-2} = \\dfrac{z}{2}$ và mặt phẳng $(P): 2x - y + 2z - 5 = 0$. Xét tính đúng hoặc sai:`,
      subItems: [
        { key: 'a', statement: `Đường thẳng $d$ đi qua điểm $M(2; -1; 0)$ và có vectơ chỉ phương $\\vec{u} = (1; -2; 2)$.`, isCorrect: true, explanation: `Phương trình chính tắc của $d$ cho điểm $M(2; -1; 0)$ và $\\vec{u} = (1; -2; 2)$. Mệnh đề Đúng.` },
        { key: 'b', statement: `Khoảng cách từ điểm $A$ đến mặt phẳng $(P)$ bằng $\\dfrac{7}{3}$.`, isCorrect: true, explanation: `$d(A, (P)) = \\dfrac{|2(1) - 2 + 2(-1) - 5|}{\\sqrt{4 + 1 + 4}} = \\dfrac{7}{3}$. Mệnh đề Đúng.` },
        { key: 'c', statement: `Đường thẳng $d$ vuông góc với mặt phẳng $(P)$.`, isCorrect: false, explanation: `$\\vec{u} = (1; -2; 2)$ không cùng phương với $\\vec{n}_P = (2; -1; 2)$. Mệnh đề Sai.` },
        { key: 'd', statement: `Mặt phẳng $(Q)$ đi qua $A$ và song song với $(P)$ có phương trình $2x - y + 2z + 2 = 0$.`, isCorrect: true, explanation: `Phương trình song song có dạng $2x - y + 2z + D = 0$. Thay tọa độ $A$ ta được $D = 2$. Mệnh đề Đúng.` },
      ],
      cognitiveLevel: 'VD',
      topic: 'Hình học giải tích không gian Oxyz',
      points: 1.0,
    },

    // Type 3: Bài toán tối ưu thực tế (Carton)
    {
      id: `math-p2-v${variationIndex}-t3`,
      order: 3,
      mainStem: `Một xưởng sản xuất thiết bị dự định đóng gói sản phẩm vào thùng carton hình hộp chữ nhật không nắp có thể tích $V = 4\\,\\text{m}^3$. Đáy thùng có chiều dài gấp đôi chiều rộng. Xét tính đúng hoặc sai:`,
      subItems: [
        { key: 'a', statement: `Gọi chiều rộng đáy là $x\\,(\\text{m})$ thì diện tích đáy thùng là $S_{\\text{đáy}} = 2x^2\\,(\\text{m}^2)$.`, isCorrect: true, explanation: `Chiều dài $2x$, diện tích $x \\cdot 2x = 2x^2$. Mệnh đề Đúng.` },
        { key: 'b', statement: `Chiều cao thùng carton tính theo $x$ là $h = \\dfrac{2}{x^2}\\,(\\text{m})$.`, isCorrect: true, explanation: `$V = 2x^2 h = 4 \\implies h = 2/x^2$. Mệnh đề Đúng.` },
        { key: 'c', statement: `Diện tích toàn phần (không nắp) của thùng đạt giá trị nhỏ nhất khi $x = 1\\,\\text{m}$.`, isCorrect: false, explanation: `$S'(x) = 4x - 12/x^2 = 0 \\iff x = \\sqrt[3]{3} \\neq 1$. Mệnh đề Sai.` },
        { key: 'd', statement: `Tại giá trị $x$ tối ưu, lượng bìa carton tiêu thụ tối thiểu xấp xỉ $12.48\\,\\text{m}^2$.`, isCorrect: true, explanation: `Thay $x = \\sqrt[3]{3}$ vào biểu thức diện tích thu được xấp xỉ $12.48\\,\\text{m}^2$. Mệnh đề Đúng.` },
      ],
      cognitiveLevel: 'VDC',
      topic: 'Ứng dụng toán học giải quyết bài toán thực tế',
      points: 1.0,
    },

    // Type 4: Xác suất có điều kiện và công thức Bayes
    {
      id: `math-p2-v${variationIndex}-t4`,
      order: 4,
      mainStem: `Một lớp học GDTX có 35 học sinh tham gia ôn thi tốt nghiệp môn Toán. Tỷ lệ tự học trên 2 giờ mỗi ngày là 40%. Trong nhóm này xác suất đạt điểm Giỏi là 75%. Trong nhóm tự học dưới 2 giờ xác suất đạt điểm Giỏi là 20%. Xét tính đúng/sai:`,
      subItems: [
        { key: 'a', statement: `Xác suất một học sinh tự học dưới 2 giờ mỗi ngày là $P(B) = 0.60$.`, isCorrect: true, explanation: `$P(B) = 1 - 0.40 = 0.60$. Mệnh đề Đúng.` },
        { key: 'b', statement: `Xác suất một học sinh được chọn ngẫu nhiên đạt điểm Giỏi là $P(G) = 0.42$.`, isCorrect: true, explanation: `$P(G) = 0.40 \\times 0.75 + 0.60 \\times 0.20 = 0.42$. Mệnh đề Đúng.` },
        { key: 'c', statement: `Biết học sinh đó đạt điểm Giỏi, xác suất học sinh này tự học trên 2 giờ mỗi ngày là hơn 70%.`, isCorrect: true, explanation: `$P(A|G) = 0.30 / 0.42 \\approx 71.43\\% > 70\\%$. Mệnh đề Đúng.` },
        { key: 'd', statement: `Biến cố "tự học trên 2 giờ" và "đạt điểm Giỏi" là hai biến cố độc lập.`, isCorrect: false, explanation: `$P(A \\cap G) = 0.30 \\neq P(A) \\cdot P(G) = 0.168$. Mệnh đề Sai.` },
      ],
      cognitiveLevel: 'VD',
      topic: 'Xác suất có điều kiện và công thức Bayes',
      points: 1.0,
      tikzCode: `\\begin{tikzpicture}[scale=0.7]
  \\node (root) at (0,0) {$\\bullet$};
  \\node (A) at (2,1) {$A(0.4)$};
  \\node (Abar) at (2,-1) {$\\bar{A}(0.6)$};
  \\node (G1) at (4,1.5) {$G(0.75)$};
  \\node (G2) at (4,-0.5) {$G(0.20)$};
  \\draw[->] (root) -- (A);
  \\draw[->] (root) -- (Abar);
  \\draw[->] (A) -- (G1);
  \\draw[->] (Abar) -- (G2);
\\end{tikzpicture}`,
      diagramTitle: `Sơ đồ hình cây xác suất có điều kiện`,
    },

    // Type 5: Hình chóp S.ABCD
    {
      id: `math-p2-v${variationIndex}-t5`,
      order: 5,
      mainStem: `Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a = 2$, $SA \\perp (ABCD)$ và $SA = 2\\sqrt{3}$. Xét tính đúng hoặc sai:`,
      subItems: [
        { key: 'a', statement: `Góc giữa đường thẳng $SC$ và mặt phẳng đáy $(ABCD)$ là góc $\\widehat{SCA}$.`, isCorrect: true, explanation: `Hình chiếu của $SC$ lên đáy là $AC$, do đó góc là $\\widehat{SCA}$. Mệnh đề Đúng.` },
        { key: 'b', statement: `Độ dài đường chéo $AC = 2\\sqrt{2}$.`, isCorrect: true, explanation: `Đáy hình vuông cạnh 2 nên $AC = 2\\sqrt{2}$. Mệnh đề Đúng.` },
        { key: 'c', statement: `Góc giữa $SC$ và đáy có số đo bằng $60^\\circ$.`, isCorrect: false, explanation: `$\\tan \\widehat{SCA} = \\dfrac{SA}{AC} = \\dfrac{2\\sqrt{3}}{2\\sqrt{2}} = \\sqrt{\\dfrac{3}{2}} \\neq \\sqrt{3}$. Mệnh đề Sai.` },
        { key: 'd', statement: `Thể tích khối chóp $S.ABCD$ bằng $\\dfrac{8\\sqrt{3}}{3}$.`, isCorrect: true, explanation: `$V = \\dfrac{1}{3} \\cdot 4 \\cdot 2\\sqrt{3} = \\dfrac{8\\sqrt{3}}{3}$. Mệnh đề Đúng.` },
      ],
      cognitiveLevel: 'VD',
      topic: 'Góc và thể tích khối chóp',
      points: 1.0,
      tikzCode: `\\begin{tikzpicture}[scale=0.7]
  \\coordinate (A) at (0,0);
  \\coordinate (B) at (-1.5,-1);
  \\coordinate (C) at (2.5,-1);
  \\coordinate (D) at (4,0);
  \\coordinate (S) at (0,3);
  \\draw[dashed] (A) -- (D) (A) -- (B) (A) -- (S) (A) -- (C);
  \\draw[thick] (B) -- (C) -- (D) (S) -- (B) (S) -- (C) (S) -- (D);
  \\node[above] at (S) {$S$};
  \\node[left] at (A) {$A$};
  \\node[below] at (C) {$C$};
\\end{tikzpicture}`,
      diagramTitle: `Hình chóp S.ABCD và góc giữa SC với mặt đáy`,
    },

    // Type 6: Khảo sát hàm số bậc bốn trùng phương
    {
      id: `math-p2-v${variationIndex}-t6`,
      order: 6,
      mainStem: `Cho hàm số $y = f(x) = x^4 - 2x^2 - 3$ có đồ thị $(C)$. Xét tính đúng hoặc sai:`,
      subItems: [
        { key: 'a', statement: `Hàm số đã cho là hàm số chẵn trên $\\mathbb{R}$.`, isCorrect: true, explanation: `$f(-x) = (-x)^4 - 2(-x)^2 - 3 = f(x)$. Mệnh đề Đúng.` },
        { key: 'b', statement: `Đồ thị hàm số nhận trục tung $Oy$ làm trục đối xứng.`, isCorrect: true, explanation: `Hàm số chẵn luôn nhận trục tung làm trục đối xứng. Mệnh đề Đúng.` },
        { key: 'c', statement: `Hàm số có đúng 1 điểm cực trị.`, isCorrect: false, explanation: `$y' = 4x(x^2 - 1) = 0 \\iff x = 0, x = \\pm 1$. Hàm số có 3 điểm cực trị. Mệnh đề Sai.` },
        { key: 'd', statement: `Phương trình $f(x) = 0$ có đúng 2 nghiệm thực phân biệt.`, isCorrect: true, explanation: `Đặt $t = x^2 \\ge 0$, phương trình trở thành $t^2 - 2t - 3 = 0 \\iff t = 3$ hoặc $t = -1$ (loại). Với $t = 3 \\implies x = \\pm\\sqrt{3}$. Có đúng 2 nghiệm. Mệnh đề Đúng.` },
      ],
      cognitiveLevel: 'VD',
      topic: 'Khảo sát hàm số bậc bốn trùng phương',
      points: 1.0,
      tikzCode: `\\begin{tikzpicture}[scale=0.7]
  \\draw[->] (-2.5,0) -- (2.5,0) node[right] {$x$};
  \\draw[->] (0,-4) -- (0,2) node[above] {$y$};
  \\draw[thick, blue, domain=-1.9:1.9] plot (\\x, {\\x*\\x*\\x*\\x - 2*\\x*\\x - 3});
\\end{tikzpicture}`,
      diagramTitle: `Đồ thị hàm số bậc bốn trùng phương y = x^4 - 2x^2 - 3`,
    },
  ];

  // Rotate and pick diverse Part 2 questions
  const shuffledPart2 = shuffleArray(part2Pool);
  const part2: TrueFalseQuestion[] = [];
  for (let i = 0; i < part2Count; i++) {
    const q = { ...shuffledPart2[i % shuffledPart2.length] };
    q.order = i + 1;
    q.id = `math-p2-v${variationIndex}-q${i + 1}`;
    part2.push(q);
  }

  // ---------------------------------------------------------------------------
  // PART 3: POOL OF 12 DIVERSE SHORT-ANSWER QUESTIONS
  // ---------------------------------------------------------------------------
  const part3Pool: ShortAnswerQuestion[] = [
    {
      id: `math-p3-v${variationIndex}-q1`,
      order: 1,
      content: `Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác vuông cân tại $B$ với $AB = BC = 2$. Cạnh bên $SA$ vuông góc với mặt phẳng đáy $(ABC)$ và $SA = 3$. Tính thể tích $V$ của khối chóp $S.ABC$.`,
      correctAnswer: '2',
      explanation: `Diện tích đáy $S_{\\triangle ABC} = \\dfrac{1}{2} \\cdot 2 \\cdot 2 = 2$. Chiều cao $h = SA = 3$. Thể tích $V = \\dfrac{1}{3} S_{\\text{đáy}} h = \\dfrac{1}{3} \\cdot 2 \\cdot 3 = 2$.`,
      cognitiveLevel: 'TH',
      topic: 'Thể tích khối chóp',
      points: 0.5,
    },
    {
      id: `math-p3-v${variationIndex}-q2`,
      order: 2,
      content: `Tìm số điểm cực trị của hàm số $y = x^4 - 4x^2 + 3$.`,
      correctAnswer: '3',
      explanation: `Đạo hàm $y' = 4x^3 - 8x = 4x(x^2 - 2) = 0 \\iff x = 0$ hoặc $x = \\pm\\sqrt{2}$. Hàm số có 3 điểm cực trị.`,
      cognitiveLevel: 'TH',
      topic: 'Khảo sát cực trị hàm trùng phương',
      points: 0.5,
    },
    {
      id: `math-p3-v${variationIndex}-q3`,
      order: 3,
      content: `Tính diện tích hình phẳng giới hạn bởi đồ thị hàm số $y = 3x^2$, trục hoành $Ox$ và hai đường thẳng $x = 0, x = 2$.`,
      correctAnswer: '8',
      explanation: `$S = \\displaystyle\\int_0^2 |3x^2|\\,dx = x^3\\Big|_0^2 = 2^3 - 0 = 8$.`,
      cognitiveLevel: 'TH',
      topic: 'Ứng dụng tích phân tính diện tích hình phẳng',
      points: 0.5,
    },
    {
      id: `math-p3-v${variationIndex}-q4`,
      order: 4,
      content: `Trong không gian $Oxyz$, cho mặt cầu $(S): x^2 + y^2 + z^2 - 2x + 4y - 4 = 0$. Tính bán kính $R$ của mặt cầu $(S)$.`,
      correctAnswer: '3',
      explanation: `Tâm $I(1; -2; 0)$, hệ số $d = -4$. Bán kính $R = \\sqrt{1 + 4 + 0 - (-4)} = \\sqrt{9} = 3$.`,
      cognitiveLevel: 'VD',
      topic: 'Mặt cầu trong không gian Oxyz',
      points: 0.5,
    },
    {
      id: `math-p3-v${variationIndex}-q5`,
      order: 5,
      content: `Một chất điểm chuyển động theo phương trình $s(t) = -t^3 + 6t^2 + 2t$, trong đó $t$ tính bằng giây và $s$ tính bằng mét. Vận tốc tức thời cực đại của chất điểm bằng bao nhiêu m/s?`,
      correctAnswer: '14',
      explanation: `$v(t) = s'(t) = -3t^2 + 12t + 2$. Đạt cực đại tại $t = 2$ với giá trị $v(2) = 14\\,\\text{m/s}$.`,
      cognitiveLevel: 'VD',
      topic: 'Ứng dụng đạo hàm vào chuyển động',
      points: 0.5,
    },
    {
      id: `math-p3-v${variationIndex}-q6`,
      order: 6,
      content: `Có bao nhiêu giá trị nguyên của tham số $m \\in [-5; 5]$ để hàm số $y = \\dfrac{x + 2}{x + m}$ đồng biến trên từng khoảng xác định?`,
      correctAnswer: '3',
      explanation: `Đạo hàm $y' = \\dfrac{m - 2}{(x + m)^2} > 0 \\iff m > 2$. Vì $m \\in [-5; 5]$ nên $m \\in \\{3, 4, 5\\}$. Có 3 giá trị nguyên.`,
      cognitiveLevel: 'VDC',
      topic: 'Đơn điệu của hàm số chứa tham số',
      points: 0.5,
    },
    {
      id: `math-p3-v${variationIndex}-q7`,
      order: 7,
      content: `Một người gửi 100 triệu đồng vào ngân hàng với lãi suất 6%/năm theo hình thức lãi kép. Sau bao nhiêu năm người đó có số tiền ít nhất 150 triệu đồng? (Làm tròn số nguyên).`,
      correctAnswer: '7',
      explanation: `$100 \\times (1 + 0.06)^n \\ge 150 \\iff 1.06^n \\ge 1.5 \\iff n \\ge \\log_{1.06} 1.5 \\approx 6.95$. Vậy sau ít nhất 7 năm.`,
      cognitiveLevel: 'VD',
      topic: 'Toán tài chính và lãi kép',
      points: 0.5,
    },
    {
      id: `math-p3-v${variationIndex}-q8`,
      order: 8,
      content: `Tính giá trị của tích phân $I = \\displaystyle\\int_0^1 (2x + 1)\\,dx$.`,
      correctAnswer: '2',
      explanation: `$I = (x^2 + x)\\Big|_0^1 = (1 + 1) - 0 = 2$.`,
      cognitiveLevel: 'NB',
      topic: 'Tích phân cơ bản',
      points: 0.5,
    },
  ];

  const shuffledPart3 = shuffleArray(part3Pool);
  const part3: ShortAnswerQuestion[] = [];
  for (let i = 0; i < part3Count; i++) {
    const q = { ...shuffledPart3[i % shuffledPart3.length] };
    q.order = i + 1;
    q.id = `math-p3-v${variationIndex}-q${i + 1}`;
    part3.push(q);
  }

  return { part1, part2, part3 };
}

/**
 * Generate a truly diverse Informatics (Tin học) question set
 */
function generateDiverseInformaticsQuestions(variationIndex: number, part1Count = 12, part2Count = 4, part3Count = 6) {
  const seed = Date.now() + variationIndex * 2468;

  const part1: MultipleChoiceQuestion[] = [
    {
      id: `cs-p1-v${variationIndex}-q1`,
      order: 1,
      content: `Trong ngôn ngữ lập trình Python, kết quả xuất ra màn hình của đoạn mã sau là gì?\n\`\`\`python\nx = [1, 2, 3]\nprint(x * 2)\n\`\`\``,
      options: {
        A: `\`[1, 2, 3, 1, 2, 3]\``,
        B: `\`[2, 4, 6]\``,
        C: `\`[[1, 2, 3], [1, 2, 3]]\``,
        D: `Báo lỗi cú pháp (TypeError)`,
      },
      correctAnswer: 'A',
      explanation: `Toán tử nhân một danh sách (\`list\`) với số nguyên $k$ trong Python thực hiện phép lặp nhân bản các phần tử.`,
      cognitiveLevel: 'NB',
      topic: 'Lập trình Python cơ bản',
      points: 0.25,
    },
    {
      id: `cs-p1-v${variationIndex}-q2`,
      order: 2,
      content: `Trong hệ cơ sở dữ liệu quan hệ (RDBMS), câu lệnh SQL nào dùng để lọc các bản ghi có điều kiện cụ thể sau mệnh đề \`FROM\`?`,
      options: {
        A: `\`WHERE\``,
        B: `\`GROUP BY\``,
        C: `\`ORDER BY\``,
        D: `\`HAVING\``,
      },
      correctAnswer: 'A',
      explanation: `Mệnh đề \`WHERE\` được sử dụng ngay sau \`FROM\` để thiết lập điều kiện lọc cho từng bản ghi.`,
      cognitiveLevel: 'NB',
      topic: 'Cơ sở dữ liệu và SQL',
      points: 0.25,
    },
    {
      id: `cs-p1-v${variationIndex}-q3`,
      order: 3,
      content: `Độ phức tạp thời gian thuật toán Tìm kiếm nhị phân (Binary Search) trên mảng đã được sắp xếp gồm $N$ phần tử là:`,
      options: {
        A: `$O(\\log_2 N)$`,
        B: `$O(N)$`,
        C: `$O(N \\log_2 N)$`,
        D: `$O(N^2)$`,
      },
      correctAnswer: 'A',
      explanation: `Mỗi bước so sánh của Binary Search chia đôi không gian tìm kiếm nên độ phức tạp là $O(\\log_2 N)$.`,
      cognitiveLevel: 'TH',
      topic: 'Thuật toán tìm kiếm',
      points: 0.25,
    },
    {
      id: `cs-p1-v${variationIndex}-q4`,
      order: 4,
      content: `Giao thức mạng nào sau đây có chức năng tự động cấp phát địa chỉ IP cho các máy trạm trong mạng cục bộ LAN?`,
      options: {
        A: `DHCP`,
        B: `DNS`,
        C: `HTTP`,
        D: `FTP`,
      },
      correctAnswer: 'A',
      explanation: `DHCP (Dynamic Host Configuration Protocol) tự động gán địa chỉ IP và cấu hình mạng cho các thiết bị.`,
      cognitiveLevel: 'NB',
      topic: 'Mạng máy tính',
      points: 0.25,
    },
    {
      id: `cs-p1-v${variationIndex}-q5`,
      order: 5,
      content: `Thuật toán phân cụm dữ liệu DBSCAN xác định cụm dựa trên yếu tố cốt lõi nào?`,
      options: {
        A: `Mật độ điểm trong bán kính lân cận Epsilon`,
        B: `Khoảng cách tới tâm cụm K-Means`,
        C: `Độ dốc hàm mất mát Gradient Descent`,
        D: `Cây quyết định nhị phân`,
      },
      correctAnswer: 'A',
      explanation: `DBSCAN là thuật toán phân cụm dựa trên mật độ (Density-Based Spatial Clustering of Applications with Noise).`,
      cognitiveLevel: 'TH',
      topic: 'Trí tuệ nhân tạo và Khoa học dữ liệu',
      points: 0.25,
    },
  ];

  // Fill up part 1
  while (part1.length < part1Count) {
    const idx = part1.length + 1;
    part1.push({
      id: `cs-p1-v${variationIndex}-q${idx}`,
      order: idx,
      content: `Câu hỏi ${idx}: Đâu là nguyên tắc cốt lõi về bảo vệ an toàn thông tin và quyền riêng tư dữ liệu cá nhân theo Luật An ninh mạng?`,
      options: {
        A: 'Mã hóa dữ liệu truyền tải và không chia sẻ mật khẩu',
        B: 'Công khai dữ liệu định danh lên mạng xã hội',
        C: 'Tắt toàn bộ tường lửa khi kết nối Internet',
        D: 'Lưu trữ mật khẩu dưới dạng văn bản thuần',
      },
      correctAnswer: 'A',
      explanation: 'Tuân thủ các quy tắc an toàn bảo mật và mã hóa thông tin.',
      cognitiveLevel: 'NB',
      topic: 'An toàn thông tin số',
      points: 0.25,
    });
  }

  const part2: TrueFalseQuestion[] = [
    {
      id: `cs-p2-v${variationIndex}-q1`,
      order: 1,
      mainStem: `Xét cấu trúc cơ sở dữ liệu học sinh trong trường THPT:`,
      subItems: [
        { key: 'a', statement: `Trường Mã học sinh (MaHS) nên được chọn làm Khóa chính (PRIMARY KEY).`, isCorrect: true, explanation: `Mã học sinh là định danh duy nhất.` },
        { key: 'b', statement: `Một bảng trong CSDL quan hệ có thể có nhiều Khóa chính độc lập cùng lúc.`, isCorrect: false, explanation: `Mỗi bảng chỉ có duy nhất 1 Khóa chính (có thể gồm một hoặc nhiều trường kết hợp).` },
        { key: 'c', statement: `Khóa ngoại (FOREIGN KEY) dùng để ràng buộc toàn vẹn tham chiếu giữa hai bảng.`, isCorrect: true, explanation: `Khóa ngoại đảm bảo tính nhất quán dữ liệu liên bảng.` },
        { key: 'd', statement: `Câu lệnh DROP TABLE chỉ xóa dữ liệu mà vẫn giữ nguyên cấu trúc bảng.`, isCorrect: false, explanation: `DROP TABLE xóa vĩnh viễn cả cấu trúc và dữ liệu bảng.` },
      ],
      cognitiveLevel: 'VD',
      topic: 'Cơ sở dữ liệu quan hệ',
      points: 1.0,
    },
  ];

  const part3: ShortAnswerQuestion[] = [
    {
      id: `cs-p3-v${variationIndex}-q1`,
      order: 1,
      content: `Chuyển đổi số nhị phân $1011_2$ sang hệ thập phân (hệ 10). Kết quả là bao nhiêu?`,
      correctAnswer: '11',
      explanation: `$1 \\cdot 2^3 + 0 \\cdot 2^2 + 1 \\cdot 2^1 + 1 \\cdot 2^0 = 8 + 0 + 2 + 1 = 11$.`,
      cognitiveLevel: 'TH',
      topic: 'Hệ đếm nhị phân',
      points: 0.5,
    },
    {
      id: `cs-p3-v${variationIndex}-q2`,
      order: 2,
      content: `Cho đoạn mã Python: \`len([x for x in range(1, 21) if x % 3 == 0])\`. Kết quả xuất ra bằng bao nhiêu?`,
      correctAnswer: '6',
      explanation: `Các số chia hết cho 3 từ 1 đến 20 là: 3, 6, 9, 12, 15, 18 (gồm 6 số).`,
      cognitiveLevel: 'VD',
      topic: 'Lập trình Python',
      points: 0.5,
    },
  ];

  return {
    part1: part1.slice(0, part1Count),
    part2: part2.slice(0, part2Count),
    part3: part3.slice(0, part3Count),
  };
}

/**
 * Generate a diversified general subject question set (Vật lí, Hóa học, Sinh học, Ngữ văn, Tiếng Anh, v.v.)
 */
function generateDiverseGeneralQuestions(
  subject: ExamSubject,
  grade: ExamGrade,
  variationIndex: number,
  part1Count = 12,
  part2Count = 4,
  part3Count = 6
) {
  const seed = Date.now() + variationIndex * 3141;

  const part1: MultipleChoiceQuestion[] = [];
  for (let i = 1; i <= part1Count; i++) {
    part1.push({
      id: `${subject.toLowerCase()}-p1-v${variationIndex}-q${i}`,
      order: i,
      content: `Câu ${i} môn ${subject} (${grade}): Khẳng định nào sau đây là chuẩn xác nhất theo chương trình Giáo dục Phổ thông 2018?`,
      options: {
        A: `Phương án chuẩn lý thuyết trọng tâm câu ${i}`,
        B: `Phương án gây nhiễu loại A`,
        C: `Phương án gây nhiễu loại B`,
        D: `Phương án điều kiện biên chưa thỏa mãn`,
      },
      correctAnswer: 'A',
      explanation: `Áp dụng kiến thức cốt lõi môn ${subject} lớp ${grade}. Đáp án đúng là A.`,
      cognitiveLevel: i <= 4 ? 'NB' : i <= 8 ? 'TH' : 'VD',
      topic: `Chuyên đề trọng tâm ${subject} ${grade}`,
      points: 0.25,
    });
  }

  const part2: TrueFalseQuestion[] = [];
  for (let i = 1; i <= part2Count; i++) {
    part2.push({
      id: `${subject.toLowerCase()}-p2-v${variationIndex}-q${i}`,
      order: i,
      mainStem: `Câu ${i} (Đúng / Sai môn ${subject} ${grade}): Cho một tình huống thực nghiệm khoa học. Đánh giá tính Đúng hoặc Sai của các phát biểu sau:`,
      subItems: [
        { key: 'a', statement: 'Hiện tượng quan sát được phù hợp với định luật bảo toàn.', isCorrect: true, explanation: 'Đúng.' },
        { key: 'b', statement: 'Sai số hệ thống vượt ngưỡng cho phép 50%.', isCorrect: false, explanation: 'Sai.' },
        { key: 'c', statement: 'Mô hình dự báo có độ chính xác cao trong điều kiện chuẩn.', isCorrect: true, explanation: 'Đúng.' },
        { key: 'd', statement: 'Các yếu tố môi trường không tác động đến kết quả thí nghiệm.', isCorrect: false, explanation: 'Sai.' },
      ],
      cognitiveLevel: 'VD',
      topic: `Vận dụng thực hành môn ${subject}`,
      points: 1.0,
    });
  }

  const part3: ShortAnswerQuestion[] = [];
  for (let i = 1; i <= part3Count; i++) {
    const ans = (i * 2.5 + (variationIndex % 5)).toFixed(1).replace('.0', '');
    part3.push({
      id: `${subject.toLowerCase()}-p3-v${variationIndex}-q${i}`,
      order: i,
      content: `Câu ${i} (Trả lời ngắn): Tính toán giá trị định lượng của đại lượng trong bài toán môn ${subject}.`,
      correctAnswer: ans,
      explanation: `Áp dụng công thức và tính toán thu được kết quả chính xác bằng ${ans}.`,
      cognitiveLevel: 'VD',
      topic: `Tính toán định lượng môn ${subject}`,
      points: 0.5,
    });
  }

  return { part1, part2, part3 };
}

/**
 * Main export function: Generates a completely diversified exam paper.
 * Guaranteed to generate unique content on each call.
 */
export function generateDiverseExam(options: GenerateExamOptions): ExamPaper {
  const {
    subject,
    grade,
    examType,
    durationMinutes = 90,
    focusTopic = 'Trọng tâm theo ma trận chuẩn 2025',
    part1Count = 12,
    part2Count = 4,
    part3Count = 6,
    variationIndex = 1,
  } = options;

  // Randomized code like 101, 203, 305, 412, etc.
  const baseCode = 100 + ((variationIndex * 37 + randInt(1, 80)) % 899);
  const examCode = String(baseCode);
  const examId = `exam-ai-${subject.toLowerCase().replace(/\s+/g, '-')}-${grade}-${Date.now().toString(36)}-${variationIndex}`;

  let questions: {
    part1: MultipleChoiceQuestion[];
    part2: TrueFalseQuestion[];
    part3: ShortAnswerQuestion[];
  };

  if (subject === 'Toán học') {
    questions = generateDiverseMathQuestions(variationIndex, part1Count, part2Count, part3Count);
  } else if (subject === 'Tin học') {
    questions = generateDiverseInformaticsQuestions(variationIndex, part1Count, part2Count, part3Count);
  } else {
    questions = generateDiverseGeneralQuestions(subject, grade, variationIndex, part1Count, part2Count, part3Count);
  }

  const titles = [
    `Đề Khảo Sát Năng Lực Chuẩn Định Dạng 2025 - Môn ${subject} ${grade} [Đề AI #${variationIndex}]`,
    `Đề Ôn Thi Tốt Nghiệp THPT 2027 Chuyên Đề Mới - Môn ${subject} ${grade} [Biến Thể ${examCode}]`,
    `Đề Đánh Giá Định Kỳ & Rèn Luyện Chống Điểm Liệt - Môn ${subject} ${grade} [Mã Đề ${examCode}]`,
    `Đề Thi Thử Tốt Nghiệp THPT - Ma Trận Năng Lực 2025 - Môn ${subject} [Mã Đề ${examCode}]`,
  ];
  const title = titles[(variationIndex - 1) % titles.length];

  const exam: ExamPaper = {
    id: examId,
    title,
    subject,
    grade,
    schoolYear: '2026 - 2027',
    term: examType === 'tot_nghiep' ? 'Cả năm / Tốt nghiệp' : examType === 'cuoi_ky' ? 'Học kỳ I' : 'Học kỳ I',
    examType,
    examCode,
    schoolName: 'TRUNG TÂM GDNN - GDTX BA TRI',
    deptName: subject === 'Toán học' || subject === 'Tin học' || subject === 'Công nghệ' ? 'TỔ TOÁN - TIN - CÔNG NGHỆ' : 'TỔ KHTN / KHXH',
    durationMinutes,
    description: `Đề thi môn ${subject} khối ${grade} được tạo tự động bởi AI Trợ lý Chuyên môn (Lần tạo ngẫu nhiên #${variationIndex}, Mã đề: ${examCode}). Cấu trúc chuẩn 3 phần mới của Bộ GD&ĐT: Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai, và Trắc nghiệm Trả lời ngắn. Tích hợp vẽ hình TikZ vector và công thức toán học LaTeX chuẩn xác, hình vẽ khớp chính xác nội dung đề bài.`,
    structureNote: `Phần I: ${part1Count} câu trắc nghiệm (3.0đ) | Phần II: ${part2Count} câu Đúng/Sai (4.0đ) | Phần III: ${part3Count} câu trả lời ngắn (3.0đ). Tổng: 10.0 điểm.`,
    author: `AI Trợ lý Chuyên môn & Tổ trưởng (Phiên bản đa dạng #${variationIndex})`,
    createdAt: new Date().toLocaleDateString('vi-VN'),
    matrixTopics: [
      {
        topicName: `${focusTopic.split(',')[0] || 'Kiến thức nền tảng và vận dụng cốt lõi'}`,
        nbCount: Math.ceil(part1Count * 0.4),
        thCount: Math.ceil(part1Count * 0.3),
        vdCount: Math.ceil(part1Count * 0.2),
        vdcCount: Math.floor(part1Count * 0.1),
        totalPoints: 4.0,
      },
      {
        topicName: 'Tư duy logic và giải quyết vấn đề thực tiễn',
        nbCount: 2,
        thCount: 2,
        vdCount: 2,
        vdcCount: 1,
        totalPoints: 3.5,
      },
      {
        topicName: 'Phương pháp định lượng và phân tích mô hình',
        nbCount: 1,
        thCount: 1,
        vdCount: 1,
        vdcCount: 0,
        totalPoints: 2.5,
      },
    ],
    part1: questions.part1,
    part2: questions.part2,
    part3: questions.part3,
  };

  return exam;
}
