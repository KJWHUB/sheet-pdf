import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PdfOptions {
  filename?: string;
  quality?: number;
  scale?: number;
  backgroundColor?: string;
  removeBackground?: boolean;
}

const DEFAULT_OPTIONS: Required<PdfOptions> = {
  filename: 'question-paper',
  quality: 0.95,
  scale: 2,
  backgroundColor: '#ffffff',
  removeBackground: false,
};

/**
 * PDF 스타일을 동적으로 추가/제거하는 헬퍼
 */
function addPdfStyles(): void {
  const style = document.createElement('style');
  style.id = 'pdf-generation-styles';
  style.textContent = `
    .print-mode .page-container {
      width: 210mm !important;
      height: 297mm !important;
      padding: 20mm !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      page-break-after: always !important;
    }
    .print-mode .question-container, 
    .print-mode .passage-container, 
    .print-mode .questions-section > div {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .print-mode .two-column-layout {
      column-count: 2 !important;
      column-gap: 20mm !important;
      column-rule: 1px solid #e5e7eb !important;
      column-fill: auto !important;
    }
    .print-mode .print\\:hidden {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function removePdfStyles(): void {
  document.body.classList.remove('print-mode');
  const pdfStyle = document.getElementById('pdf-generation-styles');
  if (pdfStyle) {
    document.head.removeChild(pdfStyle);
  }
}

/**
 * 페이지 컨테이너들을 PDF로 변환
 */
export async function generatePDF(options: PdfOptions = {}): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // 모든 페이지 컨테이너 요소 찾기
    const pageContainers = document.querySelectorAll('.page-container');
    
    if (pageContainers.length === 0) {
      throw new Error('페이지 컨테이너를 찾을 수 없습니다.');
    }

    // A4 크기 설정 (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // print 모드 활성화 및 스타일 적용
    document.body.classList.add('print-mode');
    addPdfStyles();

    for (let i = 0; i < pageContainers.length; i++) {
      const pageContainer = pageContainers[i] as HTMLElement;
      
      // 첫 번째 페이지가 아니라면 새 페이지 추가
      if (i > 0) {
        pdf.addPage();
      }

      // html2canvas로 페이지를 이미지로 변환
      const canvas = await html2canvas(pageContainer, {
        scale: opts.scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: opts.removeBackground ? null : opts.backgroundColor,
        removeContainer: false,
        imageTimeout: 0,
        height: pageContainer.scrollHeight,
        width: pageContainer.scrollWidth,
      });

      // 캔버스를 이미지 데이터로 변환
      const imgData = canvas.toDataURL('image/jpeg', opts.quality);

      // A4 크기에 맞춰 이미지 크기 계산
      const imgWidth = 210; // A4 너비 (mm)
      const pageHeight = 295; // A4 높이 (mm) - 여백 고려
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // 이미지가 한 페이지보다 길 경우 분할하여 추가
      if (imgHeight > pageHeight) {
        // 첫 번째 부분 추가
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // 나머지 부분들을 새 페이지에 추가
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      } else {
        // 한 페이지에 들어가는 경우
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }
    }

    // 정리
    removePdfStyles();

    // PDF 다운로드
    pdf.save(`${opts.filename}.pdf`);
    
  } catch (error) {
    // 에러 발생 시에도 정리
    removePdfStyles();
    console.error('PDF 생성 중 오류가 발생했습니다:', error);
    throw error;
  }
}

/**
 * 특정 요소만 PDF로 변환
 */
export async function generatePDFFromElement(
  element: HTMLElement, 
  options: PdfOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // print 모드 활성화
    document.body.classList.add('print-mode');
    addPdfStyles();

    // html2canvas로 요소를 이미지로 변환
    const canvas = await html2canvas(element, {
      scale: opts.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: opts.removeBackground ? null : opts.backgroundColor,
      removeContainer: false,
      imageTimeout: 0,
    });

    // PDF 생성
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 캔버스를 이미지 데이터로 변환
    const imgData = canvas.toDataURL('image/jpeg', opts.quality);

    // A4 크기에 맞춰 이미지 크기 계산
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 이미지 추가
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    // 정리
    removePdfStyles();

    // PDF 다운로드
    pdf.save(`${opts.filename}.pdf`);
    
  } catch (error) {
    // 에러 발생 시에도 정리
    removePdfStyles();
    console.error('PDF 생성 중 오류가 발생했습니다:', error);
    throw error;
  }
}

/**
 * PDF 생성 상태를 추적하는 Hook을 위한 헬퍼
 */
export function usePDFGenerator() {
  const generateQuestionPaperPDF = async (filename?: string) => {
    await generatePDF({ 
      filename: filename || `문제지_${new Date().toISOString().split('T')[0]}`,
      quality: 0.95,
      scale: 2,
    });
  };

  return {
    generateQuestionPaperPDF,
    generatePDF,
    generatePDFFromElement,
  };
}
