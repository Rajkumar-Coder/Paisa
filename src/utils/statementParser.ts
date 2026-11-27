import { 
  Transaction, 
  ParsedRecordPreview, 
  StatementImportResult, 
  PaymentMode, 
  TransactionType,
  MonthImportSummary 
} from '../types/finance';
import { getCreditCardCycleMonth } from '../data/initialData';

/**
 * Computes a deterministic fingerprint for any transaction to detect duplicates
 */
export function generateFingerprint(
  date: string,
  description: string,
  amount: number,
  paymentMode: string
): string {
  const normDate = (date || '').trim().slice(0, 10);
  const normDesc = (description || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 32);
  const normAmount = Math.round(Number(amount || 0) * 100);
  const normMode = (paymentMode || 'card').toLowerCase().slice(0, 6);
  return `${normDate}_${normDesc}_${normAmount}_${normMode}`;
}

const MONTH_NAMES: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04',
  june: '06', july: '07', august: '08', september: '09',
  october: '10', november: '11', december: '12'
};

/**
 * Normalizes any date string (DD/MM/YYYY, DD/MM/YY, DD-MM-YYYY, YYYY-MM-DD, 14-Aug-2026, 13/08/2026| 00:00) into YYYY-MM-DD
 */
export function normalizeDate(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().slice(0, 10);
  
  // Clean off timestamps, pipe characters, trailing time like "| 00:00" or " 14:32:00"
  let clean = rawDate.trim();
  clean = clean.split('|')[0].trim();
  clean = clean.split(/\s+\d{1,2}:\d{2}/)[0].trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // DD Mon YYYY or DD-Mon-YYYY (e.g. "14 Aug 2026", "14-Aug-2026", "14-Aug-26")
  const wordMonthMatch = clean.match(/^(\d{1,2})[/\s-]([a-zA-Z]{3,9})[/\s-](\d{2,4})$/);
  if (wordMonthMatch) {
    const day = wordMonthMatch[1].padStart(2, '0');
    const mStr = wordMonthMatch[2].toLowerCase();
    const month = MONTH_NAMES[mStr] || '01';
    let year = wordMonthMatch[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY or DD-MM-YY (Standard Indian Bank & CC format)
  const dmyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // Fallback try standard Date
  try {
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  } catch {
    // pass
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Guesses suitable category, transaction type, and unplanned tags based on merchant or description
 */
export function autoCategorize(description: string): { 
  category: string; 
  type: TransactionType;
  tags?: string[];
} {
  const desc = description.toLowerCase();
  const tags: string[] = [];

  // Check specific unplanned tags first
  if (desc.includes('car service') || desc.includes('service') || desc.includes('tyre') || desc.includes('mechanic') || desc.includes('spare')) {
    tags.push('car service');
  }
  if (desc.includes('function') || desc.includes('marriage') || desc.includes('temple') || desc.includes('pooja') || desc.includes('kalyanam')) {
    tags.push('function');
  }
  if (desc.includes('hospital') || desc.includes('medical') || desc.includes('pharmacy') || desc.includes('doctor') || desc.includes('clinic')) {
    tags.push('medical');
  }
  if (desc.includes('gift') || desc.includes('diwali') || desc.includes('pongal') || desc.includes('birthday') || desc.includes('celebration')) {
    tags.push('celebration');
  }

  // Categorization
  if (desc.includes('rd') || desc.includes('recurring') || desc.includes('mutual fund') || desc.includes('groww') || desc.includes('gold') || desc.includes('sip') || desc.includes('stock') || desc.includes('zerodha')) {
    return { category: 'Investment', type: 'investment', tags: tags.length ? tags : undefined };
  }
  if (desc.includes('emi') || desc.includes('loan') || desc.includes('scooty') || desc.includes('mac mini') || desc.includes('nothing 2a') || desc.includes('tcl tv') || desc.includes('bajaj') || desc.includes('offus emi')) {
    return { category: 'Loan & EMI', type: 'emi', tags: tags.length ? tags : undefined };
  }
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('youtube') || desc.includes('movie') || desc.includes('entertainment') || desc.includes('outing') || desc.includes('bookmyshow')) {
    return { category: 'Entertainment', type: 'expense', tags: tags.length ? tags : undefined };
  }
  if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('restaurant') || desc.includes('mutton') || desc.includes('chicken') || desc.includes('briyani') || desc.includes('cook') || desc.includes('veg') || desc.includes('hotel') || desc.includes('food') || desc.includes('dining')) {
    return { category: 'Food & Dining', type: 'expense', tags: tags.length ? tags : undefined };
  }
  if (desc.includes('petrol') || desc.includes('fuel') || desc.includes('lpg') || desc.includes('travel') || desc.includes('auto') || desc.includes('irctc') || desc.includes('train') || desc.includes('ticket') || desc.includes('electra') || desc.includes('anish petro') || desc.includes('chandru fuels')) {
    return { category: 'Travel & Fuel', type: 'expense', tags: tags.length ? tags : undefined };
  }
  if (desc.includes('electricity') || desc.includes('bsnl') || desc.includes('wifi') || desc.includes('jio') || desc.includes('airtel') || desc.includes('recharge') || desc.includes('maintenance') || desc.includes('home') || desc.includes('groceries') || desc.includes('balan super')) {
    return { category: 'Basic & Bills', type: 'expense', tags: tags.length ? tags : undefined };
  }
  if (desc.includes('flipkart') || desc.includes('amazon') || desc.includes('asspl') || desc.includes('myntra') || desc.includes('shopping')) {
    return { category: 'Shopping', type: 'expense', tags: tags.length ? tags : undefined };
  }

  // If special tags exist, mark as Additional
  if (tags.length > 0) {
    return { category: 'Additional', type: 'expense', tags };
  }

  return { category: 'Additional', type: 'expense', tags: undefined };
}

/**
 * Checks a candidate record against existing transactions to find duplicates
 */
export function detectDuplicate(
  candidate: { date: string; description: string; amount: number; paymentMode: PaymentMode },
  existingTransactions: Transaction[]
): { isDuplicate: boolean; duplicateReason?: string; matchedId?: string } {
  const candidateFp = generateFingerprint(candidate.date, candidate.description, candidate.amount, candidate.paymentMode);

  // Exact fingerprint check
  const exactMatch = existingTransactions.find(t => t.fingerprint === candidateFp);
  if (exactMatch) {
    return {
      isDuplicate: true,
      duplicateReason: `Exact match: "${exactMatch.description}" on ${exactMatch.date} (₹${exactMatch.amount.toLocaleString('en-IN')})`,
      matchedId: exactMatch.id,
    };
  }

  // Fuzzy check: same date and exact amount, very similar description
  const candDescClean = candidate.description.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fuzzyMatch = existingTransactions.find(t => {
    if (t.date !== candidate.date) return false;
    if (Math.abs(t.amount - candidate.amount) > 0.05) return false;
    const tDescClean = t.description.toLowerCase().replace(/[^a-z0-9]/g, '');
    return tDescClean.includes(candDescClean) || candDescClean.includes(tDescClean);
  });

  if (fuzzyMatch) {
    return {
      isDuplicate: true,
      duplicateReason: `Duplicate: ₹${fuzzyMatch.amount.toLocaleString('en-IN')} on ${fuzzyMatch.date} to "${fuzzyMatch.description}"`,
      matchedId: fuzzyMatch.id,
    };
  }

  return { isDuplicate: false };
}

/**
 * Parses raw text, CSV or PDF statement lines (Multi-Month / 1-Year or Single-Month)
 * Orders all records chronologically by date.
 */
export function parseStatementContent(
  rawContent: string,
  fileName: string,
  defaultPaymentMode: PaymentMode,
  existingTransactions: Transaction[]
): StatementImportResult {
  const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsedItems: ParsedRecordPreview[] = [];
  const seenInBatch = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip CSV header lines & decorative lines
    if (/^(date|txn|transaction|sr|sr\.no|sl|description|details|merchant|statement summary|account statement)/i.test(line)) {
      continue;
    }

    let date = '';
    let description = '';
    let amount = 0;
    let paymentMode: PaymentMode = defaultPaymentMode;
    let isCreditOrPayment = false;

    // Check if line indicates CC payment or credit card bill settlement (not an expense)
    if (/cc payment|billpay|autopay|payment received|surcharge waiver/i.test(line)) {
      isCreditOrPayment = true;
    }

    // Case 1: CSV line with delimiter (comma, semicolon, tab)
    if (line.includes(',') || line.includes(';') || line.includes('\t')) {
      const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
      const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length >= 3) {
        date = normalizeDate(parts[0]);
        description = parts[1];

        // Format A: Date, Narration, Withdrawal, Deposit, Mode (e.g. Bank Debit Statement)
        if (parts.length >= 4 && (parts[2] || parts[3])) {
          const withdrawalStr = parts[2].replace(/[₹,\s]/g, '');
          const depositStr = parts[3].replace(/[₹,\s]/g, '');
          const wAmt = parseFloat(withdrawalStr);
          const dAmt = parseFloat(depositStr);

          if (!isNaN(wAmt) && wAmt > 0) {
            amount = wAmt;
            paymentMode = 'debit_card';
          } else if (!isNaN(dAmt) && dAmt > 0) {
            // This is an incoming credit / deposit
            amount = dAmt;
            isCreditOrPayment = true;
          }
        }

        // Format B: Date, Description, Amount, Type, Mode (e.g. Credit Card Bill)
        if (amount === 0) {
          const p2 = parseFloat(parts[2].replace(/[₹,\s]/g, ''));
          const p3 = parts[3] ? parseFloat(parts[3].replace(/[₹,\s]/g, '')) : NaN;

          if (!isNaN(p2) && p2 > 0) {
            amount = p2;
          } else if (!isNaN(p3) && p3 > 0) {
            amount = p3;
          }
        }

        // Check explicit payment mode column
        for (let pIdx = 3; pIdx < parts.length; pIdx++) {
          const pText = parts[pIdx].toLowerCase();
          if (pText.includes('credit card') || pText.includes('credit_card')) {
            paymentMode = 'credit_card';
          } else if (pText.includes('debit') || pText.includes('bank')) {
            paymentMode = 'debit_card';
          }
          if (pText === 'credit' || pText.includes('waiver')) {
            isCreditOrPayment = true;
          }
        }
      }
    } else {
      // Case 2: Plain text line from PDF or unformatted statement
      // Examples:
      // "13/08/2026 BOOKMYSHOW COMGURGAON 427.20 Debit"
      // "01/08/26 UPI-JONES WESSLEY 5000.00"
      // "2026-05-10 TVS Scooty Monthly EMI 12500.00"
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/\s-][a-zA-Z]{3,9}[/\s-]\d{2,4})/);
      const amountMatch = line.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+\.?[0-9]*)\s*(?:dr|cr|debit|credit)?$/i);

      if (dateMatch && amountMatch) {
        date = normalizeDate(dateMatch[1]);
        const amtStr = amountMatch[1].replace(/,/g, '');
        amount = parseFloat(amtStr);

        const dateIdx = line.indexOf(dateMatch[0]);
        const amtIdx = line.lastIndexOf(amountMatch[0]);
        if (dateIdx !== -1 && amtIdx > dateIdx) {
          description = line.slice(dateIdx + dateMatch[0].length, amtIdx).trim();
        } else {
          description = line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
        }

        if (/credit|cr$/i.test(line) && !/debit|dr$/i.test(line)) {
          isCreditOrPayment = true;
        }
      }
    }

    // Clean up description
    description = description.replace(/^[-–—:,|.\s]+|[-–—:,|.\s]+$/g, '').trim();

    // Skip card bill payments/waivers from debit expenses unless user wants them
    if (isCreditOrPayment && /payment|waiver|billpay/i.test(description)) {
      continue;
    }

    if (!description && line.length > 5) {
      description = line.slice(0, 30);
    }

    if (amount > 0 && description && date) {
      const { category, type, tags } = autoCategorize(description);
      const fingerprint = generateFingerprint(date, description, amount, paymentMode);

      // Credit card billing cycle (13th cutoff)
      let creditCycleMonth: string | undefined;
      if (paymentMode === 'credit_card') {
        creditCycleMonth = getCreditCardCycleMonth(date);
      }

      // Check if duplicate within existing database
      const existingCheck = detectDuplicate({ date, description, amount, paymentMode }, existingTransactions);

      // Check if duplicate within current batch
      let isDuplicate = existingCheck.isDuplicate;
      let duplicateReason = existingCheck.duplicateReason;

      if (!isDuplicate && seenInBatch.has(fingerprint)) {
        isDuplicate = true;
        duplicateReason = 'Repeated entry in the same statement file';
      }
      seenInBatch.add(fingerprint);

      parsedItems.push({
        id: `parsed_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        date,
        description,
        amount,
        type,
        category,
        paymentMode,
        fingerprint,
        tags,
        creditCycleMonth,
        isDuplicate,
        duplicateReason,
        matchedTransactionId: existingCheck.matchedId,
        selected: !isDuplicate, // Default to selecting only new non-duplicate records
      });
    }
  }

  // CRITICAL REQUIREMENT: "Make sure the imports are done by date as i can export one year pdf"
  // Sort parsed records chronologically by date
  parsedItems.sort((a, b) => {
    const comp = a.date.localeCompare(b.date);
    if (comp !== 0) return comp;
    return a.description.localeCompare(b.description);
  });

  const newCount = parsedItems.filter(i => !i.isDuplicate).length;
  const duplicateCount = parsedItems.filter(i => i.isDuplicate).length;

  // Compute multi-month summary
  let dateRange: StatementImportResult['dateRange'] = undefined;
  const monthsMap = new Map<string, { count: number; totalDebit: number; newCount: number }>();

  if (parsedItems.length > 0) {
    const startDate = parsedItems[0].date;
    const endDate = parsedItems[parsedItems.length - 1].date;

    parsedItems.forEach(item => {
      const mKey = item.date.slice(0, 7);
      const cur = monthsMap.get(mKey) || { count: 0, totalDebit: 0, newCount: 0 };
      cur.count += 1;
      cur.totalDebit += item.amount;
      if (!item.isDuplicate) {
        cur.newCount += 1;
      }
      monthsMap.set(mKey, cur);
    });

    const monthsList = Array.from(monthsMap.keys()).sort();
    dateRange = {
      startDate,
      endDate,
      totalMonths: monthsList.length,
      monthsList,
    };
  }

  const monthsSummary: MonthImportSummary[] = Array.from(monthsMap.entries())
    .map(([month, stats]) => ({
      month,
      count: stats.count,
      totalDebit: Math.round(stats.totalDebit),
      newCount: stats.newCount,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    fileName: fileName || 'statement.pdf',
    totalParsed: parsedItems.length,
    newCount,
    duplicateCount,
    items: parsedItems,
    dateRange,
    monthsSummary,
  };
}
