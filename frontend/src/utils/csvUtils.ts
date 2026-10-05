import type { BatchAnalyzeResponse } from '../contexts/AppContext';

const TEXT_COLUMN_NAMES = ['review', 'comment', 'text', 'noi_dung', 'nội dung'];
/** Số dòng tối đa nhìn trước khi tìm dòng CSV khớp với một item backend trả về. */
const LOOKAHEAD = 50;

/** Parser CSV tối giản theo RFC 4180 (hỗ trợ dấu ngoặc kép, "" escape, xuống dòng trong ô, BOM). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Đọc cột `timestamp` + cột review từ file CSV (client-side).
 * Trả về `null` nếu CSV không có cột timestamp (CSV loại 1).
 * Các dòng review rỗng bị loại giống backend để giữ nguyên thứ tự.
 */
export function extractTimestampRows(csvText: string): { review: string; timestamp: string }[] | null {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return null;

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const tsIdx = header.indexOf('timestamp');
  if (tsIdx === -1) return null;

  let textIdx = header.findIndex((h) => TEXT_COLUMN_NAMES.includes(h));
  if (textIdx === -1) {
    textIdx = header.findIndex((h, idx) => idx !== tsIdx && h !== 'id');
  }
  if (textIdx === -1) return null;

  const result: { review: string; timestamp: string }[] = [];
  for (let r = 1; r < rows.length; r++) {
    const review = rows[r][textIdx] ?? '';
    if (review.trim() === '') continue; // backend cũng bỏ các dòng review rỗng
    result.push({ review, timestamp: (rows[r][tsIdx] ?? '').trim() });
  }
  return result;
}

/**
 * Gắn `timestamp` vào từng item của kết quả phân tích.
 *
 * - Nếu backend đã trả về timestamp thì giữ nguyên (ưu tiên backend).
 * - Nếu không, parse CSV gốc và ghép theo thứ tự dòng, đối chiếu nội dung review
 *   để vẫn khớp đúng khi backend loại bớt một vài dòng.
 * - Bất kỳ lỗi nào cũng không làm hỏng kết quả phân tích (trả về nguyên bản).
 */
export async function enrichWithTimestamps(
  response: BatchAnalyzeResponse,
  file: File,
): Promise<BatchAnalyzeResponse> {
  if (response.items.some((item) => item.timestamp)) return response;

  try {
    const rows = extractTimestampRows(await file.text());
    if (!rows || rows.length === 0) return response;

    let cursor = 0;
    let matched = 0;
    const items = response.items.map((item) => {
      const limit = Math.min(rows.length, cursor + LOOKAHEAD);
      for (let j = cursor; j < limit; j++) {
        if (rows[j].review === item.original_text) {
          cursor = j + 1;
          matched++;
          return rows[j].timestamp ? { ...item, timestamp: rows[j].timestamp } : item;
        }
      }
      return item;
    });

    return matched > 0 ? { ...response, items } : response;
  } catch {
    return response;
  }
}
