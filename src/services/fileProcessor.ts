import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure PDF.js worker - use local worker file to avoid CORS issues
if (typeof window !== "undefined") {
  // Use worker file from public directory (served at root by Vite)
  // In development: /pdf.worker.min.mjs
  // In production: Vite will copy it to dist and serve it correctly
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export interface FileProcessResult {
  content: string;
  characterCount: number;
  pageCount?: number;
  error?: string;
  warning?: string;
}

export interface ProcessingProgress {
  current: number;
  total: number;
  status: string;
}

export type FileType = "pdf" | "docx" | "doc" | "txt" | "md" | "unknown";

export class FileProcessor {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MAX_CHARACTERS = 1000000; // 1M characters

  /**
   * Detect file type from file extension
   */
  static detectFileType(file: File): FileType {
    const extension = file.name.split(".").pop()?.toLowerCase();
    
    switch (extension) {
      case "pdf":
        return "pdf";
      case "docx":
        return "docx";
      case "doc":
        return "doc";
      case "txt":
        return "txt";
      case "md":
        return "md";
      default:
        return "unknown";
    }
  }

  /**
   * Validate file before processing
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File is too large. Maximum size is ${(this.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB.`,
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: "This file appears to be empty.",
      };
    }

    // Check file type
    const fileType = this.detectFileType(file);
    if (fileType === "unknown") {
      return {
        valid: false,
        error: "Unsupported file format. Please use PDF, DOCX, DOC, TXT, or MD files.",
      };
    }

    return { valid: true };
  }

  /**
   * Process file and extract text content
   */
  static async processFile(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<FileProcessResult> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return {
        content: "",
        characterCount: 0,
        error: validation.error,
      };
    }

    const fileType = this.detectFileType(file);

    try {
      switch (fileType) {
        case "pdf":
          return await this.processPDF(file, onProgress);
        case "docx":
          return await this.processDOCX(file, onProgress);
        case "doc":
          return await this.processDOC(file, onProgress);
        case "txt":
        case "md":
          return await this.processText(file, onProgress);
        default:
          return {
            content: "",
            characterCount: 0,
            error: "Unsupported file format.",
          };
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes("password")) {
          return {
            content: "",
            characterCount: 0,
            error: "This PDF is password-protected. Please remove the password and try again.",
          };
        }
        
        if (error.message.includes("corrupted") || error.message.includes("Invalid PDF")) {
          return {
            content: "",
            characterCount: 0,
            error: "Could not read file - it may be corrupted.",
          };
        }
      }

      return {
        content: "",
        characterCount: 0,
        error: `Could not read file: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Process PDF file using pdf.js
   */
  private static async processPDF(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<FileProcessResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const pageCount = pdf.numPages;
      let fullText = "";
      let textFound = false;

      onProgress?.({ current: 0, total: pageCount, status: "Processing PDF..." });

      // Process each page
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        onProgress?.({
          current: pageNum,
          total: pageCount,
          status: `Processing page ${pageNum} of ${pageCount}...`,
        });

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();

        if (pageText) {
          textFound = true;
          fullText += pageText + "\n\n";
        }

        // Check character limit
        if (fullText.length > this.MAX_CHARACTERS) {
          fullText = fullText.substring(0, this.MAX_CHARACTERS);
          return {
            content: fullText,
            characterCount: fullText.length,
            pageCount,
            warning: "File content was truncated due to size limit.",
          };
        }
      }

      // Check if no text was found (likely scanned image PDF)
      if (!textFound || fullText.trim().length === 0) {
        return {
          content: "",
          characterCount: 0,
          pageCount,
          error: "Could not extract text from this PDF. It may be a scanned document without text. Please use OCR software or convert to text format.",
          warning: "This appears to be a scanned document. OCR is not supported in this version.",
        };
      }

      onProgress?.({
        current: pageCount,
        total: pageCount,
        status: "Processing complete",
      });

      return {
        content: fullText.trim(),
        characterCount: fullText.trim().length,
        pageCount,
      };
    } catch (error) {
      console.error("PDF processing error:", error);
      throw error;
    }
  }

  /**
   * Process DOCX file using mammoth
   */
  private static async processDOCX(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<FileProcessResult> {
    try {
      onProgress?.({ current: 0, total: 1, status: "Processing DOCX file..." });

      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (result.messages.length > 0) {
        console.warn("DOCX processing warnings:", result.messages);
      }

      const content = result.value.trim();

      if (!content || content.length === 0) {
        return {
          content: "",
          characterCount: 0,
          error: "Could not extract text from this DOCX file. It may be empty or corrupted.",
        };
      }

      // Check character limit
      if (content.length > this.MAX_CHARACTERS) {
        const truncated = content.substring(0, this.MAX_CHARACTERS);
        return {
          content: truncated,
          characterCount: truncated.length,
          warning: "File content was truncated due to size limit.",
        };
      }

      onProgress?.({ current: 1, total: 1, status: "Processing complete" });

      return {
        content,
        characterCount: content.length,
      };
    } catch (error) {
      console.error("DOCX processing error:", error);
      throw new Error(`Could not read DOCX file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Process DOC file (treat as DOCX or show error)
   */
  private static async processDOC(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<FileProcessResult> {
    // Try to process as DOCX (mammoth might work)
    try {
      return await this.processDOCX(file, onProgress);
    } catch (error) {
      return {
        content: "",
        characterCount: 0,
        error: "Could not read DOC file. Please convert to DOCX format or use PDF/TXT format instead.",
        warning: "DOC format support is limited. Please use DOCX, PDF, or TXT format.",
      };
    }
  }

  /**
   * Process text file
   */
  private static async processText(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<FileProcessResult> {
    try {
      onProgress?.({ current: 0, total: 1, status: "Reading text file..." });

      const content = await file.text();

      if (!content || content.trim().length === 0) {
        return {
          content: "",
          characterCount: 0,
          error: "This file appears to be empty.",
        };
      }

      // Normalize line endings (handle CRLF, LF, CR)
      const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      // Check character limit
      if (normalizedContent.length > this.MAX_CHARACTERS) {
        const truncated = normalizedContent.substring(0, this.MAX_CHARACTERS);
        return {
          content: truncated,
          characterCount: truncated.length,
          warning: "File content was truncated due to size limit.",
        };
      }

      onProgress?.({ current: 1, total: 1, status: "Processing complete" });

      return {
        content: normalizedContent,
        characterCount: normalizedContent.length,
      };
    } catch (error) {
      console.error("Text file processing error:", error);
      throw new Error(`Could not read text file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }
  }

  /**
   * Format character count for display
   */
  static formatCharacterCount(count: number): string {
    if (count < 1000) {
      return `${count} characters`;
    } else if (count < 1000000) {
      return `${(count / 1000).toFixed(1)}k characters`;
    } else {
      return `${(count / 1000000).toFixed(2)}M characters`;
    }
  }

  /**
   * Get file type icon name
   */
  static getFileTypeIcon(fileType: FileType): string {
    switch (fileType) {
      case "pdf":
        return "FileText";
      case "docx":
      case "doc":
        return "FileText";
      case "txt":
      case "md":
        return "FileText";
      default:
        return "File";
    }
  }

  /**
   * Get file type color
   */
  static getFileTypeColor(fileType: FileType): string {
    switch (fileType) {
      case "pdf":
        return "text-red-600";
      case "docx":
      case "doc":
        return "text-blue-600";
      case "txt":
      case "md":
        return "text-gray-600";
      default:
        return "text-gray-500";
    }
  }
}

// Export singleton instance
export const fileProcessor = FileProcessor;

