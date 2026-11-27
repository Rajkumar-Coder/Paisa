import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using unpkg or dynamic import
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Extracts all plain text lines from an uploaded PDF file in the browser
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  const fullTextLines: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by their vertical position (y coordinate) to reconstruct lines accurately
    const lineMap = new Map<number, { x: number; text: string }[]>();
    
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const transform = item.transform;
        // y is transform[5], rounded to nearest 2 pixels to group roughly on same line
        const yCoord = Math.round(transform[5] / 3) * 3;
        const xCoord = Math.round(transform[4]);
        
        if (!lineMap.has(yCoord)) {
          lineMap.set(yCoord, []);
        }
        lineMap.get(yCoord)!.push({ x: xCoord, text: item.str });
      }
    }

    // Sort lines top to bottom (higher y is higher up in PDF coordinate space)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

    for (const y of sortedY) {
      const itemsInLine = lineMap.get(y)!;
      // Sort left to right
      itemsInLine.sort((a, b) => a.x - b.x);
      const lineStr = itemsInLine.map(it => it.text.trim()).filter(Boolean).join(' ');
      if (lineStr) {
        fullTextLines.push(lineStr);
      }
    }
  }

  return fullTextLines.join('\n');
}
