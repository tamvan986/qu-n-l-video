export interface AiGenerateOptions {
  type: 'lesson-plan' | 'meeting' | 'score-analysis' | 'temis' | 'general' | 'exam-creator' | 'online-exam' | 'classrooms';
  prompt: string;
  context?: {
    schoolName?: string;
    deptName?: string;
    subject?: string;
    grade?: string;
    timeframe?: string;
    studentCount?: number;
    customNotes?: string;
    month?: number;
    year?: number;
    mainTopic?: string;
  };
}

export async function callAiAssistant(options: AiGenerateOptions): Promise<{
  text: string;
  isSimulated: boolean;
}> {
  const { type, prompt, context } = options;

  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `[NGHIỆP VỤ: ${type.toUpperCase()}]
Thông tin đơn vị:
- Đơn vị: ${context?.schoolName || 'Trung tâm GDNN-GDTX'}
- Tổ chuyên môn: ${context?.deptName || 'Tổ Tự nhiên'}
- Môn học: ${context?.subject || 'Toán học'} - Khối lớp: ${context?.grade || 'Khối 12 (Ôn thi TN)'}
- Thời gian: ${context?.timeframe || 'Học kỳ I'}
Yêu cầu chi tiết:
${prompt}

LƯU Ý: Soạn thảo chuẩn thể thức văn bản hành chính Việt Nam (Nghị định 30/2020/NĐ-CP, Công văn 5512/BGDĐT hoặc Thông tư 20/2018/TT-BGDĐT), văn phong sư phạm chuẩn mực, số liệu cụ thể.`,
        systemInstruction: `Bạn là trợ lý AI chuyên gia quản lý tổ chuyên môn giáo dục bậc GDNN-GDTX và THPT tại Việt Nam. Bạn am hiểu sâu sắc Công văn 5512/BGDĐT-GDTrH, Thông tư 20/2018/TT-BGDĐT (chuẩn nghề nghiệp giáo viên - TEMIS), Nghị định 30/2020/NĐ-CP về thể thức văn bản, và quy trình Sinh hoạt chuyên môn theo nghiên cứu bài học (CV 5555/BGDĐT). Bạn có khả năng phân tích phổ điểm, gom cụm năng lực DBSCAN và đề xuất giải pháp chống điểm liệt thực tế, hiệu quả.`,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.text) {
        return { text: data.text, isSimulated: false };
      }
    }
  } catch (err) {
    console.warn('Backend AI endpoint unavailable, using smart local generator:', err);
  }

  // Smart local generator with rich contextual content
  return {
    text: generateSmartFallback(type, context),
    isSimulated: true,
  };
}

function generateSmartFallback(type: string, context?: any): string {
  const school = context?.schoolName || 'TRUNG TÂM GDNN - GDTX BA TRI';
  const dept = context?.deptName || 'TỔ TOÁN - TIN - CÔNG NGHỆ';
  const subject = context?.subject || 'Toán học';
  const grade = context?.grade || 'Khối 12';

  if (type === 'score-analysis') {
    return `### BÁO CÁO PHÂN TÍCH PHỔ ĐIỂM & GOM CỤM DBSCAN CHỐNG ĐIỂM LIỆT
**Đơn vị:** ${school} | **Tổ:** ${dept} | **Môn:** ${subject} ${grade}

#### 1. Đánh giá tổng quan phổ điểm
- **Tổng số học sinh dự thi:** 40 học sinh (Lớp 12A1 & 12A2 GDTX).
- **Điểm trung bình môn:** 5.48 / 10 điểm (Độ lệch chuẩn: 1.82).
- **Điểm cao nhất:** 8.8 điểm | **Điểm thấp nhất:** 1.2 điểm.
- **Tỷ lệ điểm trên trung bình (>= 5.0):** 70.0% (28/40 học sinh).
- **Tỷ lệ điểm nguy cơ liệt (<= 3.5):** 17.5% (07 học sinh).
- **Tỷ lệ có nguy cơ liệt trực tiếp (<= 1.0):** 2.5% (01 học sinh cần can thiệp khẩn cấp).

#### 2. Kết quả gom cụm thuật toán DBSCAN (Eps=0.8, MinPts=3)
- **Cụm 1 - Nhóm Mũi nhọn (15%):** Nắm vững kiến thức vận dụng và vận dụng cao. Điểm số từ 7.5 - 8.8.
- **Cụm 2 - Nhóm An toàn (65%):** Nắm vững kiến thức thông hiểu, giải quyết tốt 28 - 32 câu đầu tiên trong đề thi tốt nghiệp. Điểm số từ 4.5 - 7.0.
- **Cụm 3 - Nhóm Nguy cơ liệt (20%):** Hổng kiến thức nền tảng từ lớp 10, 11; tốc độ làm bài chậm, hay khoanh bừa các câu nhận biết sơ đẳng.

#### 3. Danh mục các dạng bài mất điểm nhiều nhất
1. Biến đổi công thức Logarit và điều kiện xác định cơ bản (Tỷ lệ sai 72%).
2. Đọc bảng biến thiên tìm điểm cực trị của hàm số bậc ba (Tỷ lệ sai 58%).
3. Xác định tọa độ vectơ và tâm mặt cầu trong không gian Oxyz (Tỷ lệ sai 65%).

#### 4. Kế hoạch hành động chống liệt cấp bách
- **Phân công "Đôi bạn cùng tiến":** Ghép cặp 1 học sinh nhóm Mũi nhọn kèm 1 học sinh nhóm Nguy cơ liệt.
- **Biên soạn tập tài liệu 500 câu hỏi nhận biết - thông hiểu:** Đảm bảo học sinh luyện thành thạo để đạt tối thiểu 4.5 điểm trong phòng thi.
- **Tổ chức phụ đạo miễn phí:** 2 buổi/tuần vào chiều thứ Ba và thứ Năm, giáo viên chủ nhiệm phối hợp điểm danh nghiêm ngặt.`;
  }

  if (type === 'lesson-plan') {
    return `### KẾ HOẠCH GIÁO DỤC TỔ CHUYÊN MÔN (THEO CÔNG VĂN 5512/BGDĐT)
**Năm học:** 2026 - 2027 | **Môn:** ${subject} | **Khối:** ${grade}
**Đơn vị:** ${school} - ${dept}

#### I. Đặc điểm tình hình
1. **Số lớp:** 03 lớp | **Số học sinh:** 115 học sinh (khối GDTX kết hợp học nghề).
2. **Đội ngũ giáo viên:** 05 giáo viên (100% đạt chuẩn trình độ, 02 Thạc sĩ).
3. **Thuận lợi:** Ban Giám đốc quan tâm sát sao, trang bị máy chiếu tại các phòng học.
4. **Khó khăn:** Đa số học sinh vừa học văn hóa vừa học nghề, thời gian tự học tại nhà còn hạn chế.

#### II. Khung phân phối chương trình môn học (35 tuần / 105 tiết)
- **Học kỳ I:** 18 tuần x 3 tiết/tuần = 54 tiết.
- **Học kỳ II:** 17 tuần x 3 tiết/tuần = 51 tiết.

#### III. Kế hoạch kiểm tra, đánh giá định kỳ
- **Kiểm tra giữa kỳ I:** Tuần 9 (Thời lượng: 60 phút, hình thức: Trắc nghiệm 70% + Tự luận 30%).
- **Kiểm tra cuối kỳ I:** Tuần 18 (Thời lượng: 90 phút theo ma trận đề chuẩn Bộ GD&ĐT).
- **Kiểm tra giữa kỳ II:** Tuần 26.
- **Kiểm tra cuối kỳ II & Ôn thi TN:** Tuần 35 (Tập trung chuyên đề rà soát chống liệt).`;
  }

  if (type === 'temis') {
    return `### BÁO CÁO TỔNG HỢP ĐÁNH GIÁ CHUẨN NGHỀ NGHIỆP GIÁO VIÊN (TEMIS)
**Căn cứ:** Thông tư số 20/2018/TT-BGDĐT | **Tổ chuyên môn:** ${dept} | **Năm học:** 2026 - 2027

#### I. Kết quả tự đánh giá và đánh giá của Tổ chuyên môn:
- **Tổng số giáo viên được đánh giá:** 14 giáo viên.
- **Xếp loại Chung:**
  + Mức Tốt: 14/14 giáo viên (Tỷ lệ 100%).
  + Mức Khá: 00 giáo viên.
  + Mức Đạt: 00 giáo viên.
  + Mức Chưa đạt: 00 giáo viên.

#### II. Đánh giá theo 5 Tiêu chuẩn cốt lõi:
1. **Tiêu chuẩn 1 (Phẩm chất nhà giáo):** 100% giáo viên đạt loại Tốt (Tiêu chí 1 & 2 đầy đủ minh chứng).
2. **Tiêu chuẩn 2 (Phát triển chuyên môn, nghiệp vụ):** 100% giáo viên đạt loại Tốt, thực hiện nghiêm túc CV 5512, tích cực sinh hoạt chuyên môn theo nghiên cứu bài học.
3. **Tiêu chuẩn 3 (Xây dựng môi trường giáo dục):** 100% giáo viên đạt loại Tốt, văn hóa công sở thân thiện, phối hợp tốt phòng chống bạo lực học đường (Tiêu chí 8, 9, 10).
4. **Tiêu chuẩn 4 (Phát triển mối quan hệ nhà trường - gia đình - xã hội):** 100% giáo viên đạt loại Tốt, liên lạc chặt chẽ qua sổ điện tử và nhóm Zalo phụ huynh.
5. **Tiêu chuẩn 5 (Sử dụng ngoại ngữ và ứng dụng CNTT):** 100% giáo viên đạt loại Tốt, đột phá ứng dụng công nghệ AI trong soạn giảng, kiểm tra đánh giá và phân tích phổ điểm thi tốt nghiệp.`;
  }

  if (type === 'exam-creator') {
    return `### MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ THI ĐỔI MỚI (CẤU TRÚC BỘ GD&ĐT 2025)
**Đơn vị:** ${school} | **Tổ:** ${dept} | **Môn:** ${subject} ${grade}
**Quy chuẩn Toán học:** Công thức chuẩn LaTeX ($...$) & Hình vẽ minh họa TikZ thuần (PGF/TikZ).

#### I. Cấu trúc đề thi định dạng mới:
- **Phần I (Trắc nghiệm 4 lựa chọn):** 12 câu (3.0 điểm) - Khảo sát các năng lực nhận biết và thông hiểu cơ bản, công thức toán đánh bằng LaTeX $y = f(x)$, $\\log_a b$, $\\int f(x)dx$.
- **Phần II (Trắc nghiệm Đúng/Sai):** 04 câu (4.0 điểm) - Mỗi câu 4 ý a, b, c, d; kiểm tra toàn diện tư duy logic, tiệm cận đồ thị, hình không gian với mã TikZ thuần.
- **Phần III (Trắc nghiệm Trả lời ngắn):** 06 câu (3.0 điểm) - Yêu cầu giải toán thực tế, tối ưu hóa parabol, thể tích khối chóp và điền đáp số.

#### II. Tỷ lệ phân bố cấp độ tư duy:
- Nhận biết (NB): 40% (4.0 điểm) -> Đảm bảo 100% học sinh chống điểm liệt tốt nghiệp.
- Thông hiểu (TH): 30% (3.0 điểm) -> Giúp học sinh đạt ngưỡng điểm 6.0 - 7.0.
- Vận dụng (VD): 20% (2.0 điểm) & Vận dụng cao (VDC): 10% (1.0 điểm) -> Phân hóa tuyển sinh ĐH.
- Hỗ trợ xuất file: Xuất Word (.doc) in ấn và file mã nguồn LaTeX (.tex) sẵn sàng biên dịch.`;
  }

  // Default: Meeting minutes
  return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-------------------------
${school}
${dept}
Số: 04/BB-TTCN

BIÊN BẢN SINH HOẠT CHUYÊN MÔN
(THEO NGHIÊN CỨU BÀI HỌC VÀ CHỐNG LIỆT KỲ THI TỐT NGHIỆP THPT)

I. THỜI GIAN VÀ ĐỊA ĐIỂM
- Thời gian: 14h00 ngày 24 tháng 10 năm 2026
- Địa điểm: Phòng Thư viện

II. THÀNH PHẦN THAM DỰ
- Chủ trì: Nguyễn Thị Kiều Ân - Giáo viên hướng dẫn
- Thư ký: CN. Trần Thị Bích Ngọc
- Số lượng: 05/05 giáo viên có mặt đầy đủ.

III. NỘI DUNG SINH HOẠT CHUYÊN MÔN
1. Dạy học minh họa và Nghiên cứu bài học:
- Bài dạy: Phương trình mũ và logarit cơ bản (Toán 12).
- Giáo viên thực hiện: ThS. Nguyễn Bảo Ngưng.
- Đánh giá của tổ: Tiết học diễn ra sôi nổi, học sinh tiếp thu tốt kiến thức cốt lõi.

2. Phân tích học sinh và giải pháp chống liệt:
- Hệ thống AI đã phân cụm nhận diện 03 học sinh có nguy cơ trượt tốt nghiệp do điểm Toán dưới 3.0.
- Giải pháp thống nhất: Giao bộ phiếu ôn tập nhận biết cho các em làm tại nhà và chấm trực tiếp tại lớp; triển khai đôi bạn cùng tiến.

IV. KẾT LUẬN VÀ BIỂU QUYẾT
- 100% giáo viên nhất trí thông qua kế hoạch điều chỉnh và cam kết đồng hành cùng học sinh.

Thư ký ghi biên bản                          Giáo viên hướng dẫn
(Ký, ghi rõ họ tên)                           (Ký, ghi rõ họ tên)`;
}

export function exportToWordDocument(title: string, contentHtml: string): void {
  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset='utf-8'>
    <title>${title}</title>
    <style>
      body {
        font-family: 'Times New Roman', serif;
        font-size: 14pt;
        line-height: 1.5;
        margin: 2cm 2cm 2cm 2.5cm;
      }
      h1, h2, h3, h4 { font-family: 'Times New Roman', serif; }
      table { border-collapse: collapse; width: 100%; margin: 15px 0; }
      th, td { border: 1px solid #000; padding: 6px 10px; font-size: 13pt; }
      th { background-color: #f2f2f2; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .bold { font-weight: bold; }
      .italic { font-style: italic; }
      .uppercase { text-transform: uppercase; }
    </style>
  </head>
  <body>`;
  const footer = `</body></html>`;

  const sourceHTML = header + contentHtml + footer;
  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
  const fileDownload = document.createElement('a');
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = `${title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')}.doc`;
  fileDownload.click();
  document.body.removeChild(fileDownload);
}
