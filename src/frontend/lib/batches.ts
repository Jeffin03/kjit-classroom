export type BatchSplitType = "sequential" | "oddeven" | "custom"

export interface BatchConfig {
  splitType: BatchSplitType
  batch1Label?: string
  batch2Label?: string
  customCutoff?: number
}

const DEFAULT_CONFIG: BatchConfig = {
  splitType: "sequential",
  batch1Label: "Batch 1",
  batch2Label: "Batch 2",
}

/**
 * Extracts the trailing number from a roll number string, e.g. "25mcab11" -> 11, "CS-042" -> 42.
 */
export function extractRollNumber(rollNo: string): number | null {
  if (!rollNo) return null
  const match = rollNo.trim().match(/(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Natural sort comparator for roll numbers (e.g. 25mcab2 before 25mcab10).
 */
export function compareRollNumbers(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
}

/**
 * Computes which batch (1 or 2) a student belongs to within a class cohort.
 */
export function getStudentBatch(
  rollNo: string,
  indexInSortedClass: number,
  totalInClass: number,
  config: BatchConfig = DEFAULT_CONFIG
): 1 | 2 {
  if (config.splitType === "oddeven") {
    const num = extractRollNumber(rollNo)
    if (num !== null) {
      return num % 2 !== 0 ? 1 : 2
    }
    return indexInSortedClass % 2 === 0 ? 1 : 2
  }

  if (config.splitType === "custom" && typeof config.customCutoff === "number") {
    const num = extractRollNumber(rollNo)
    if (num !== null) {
      return num <= config.customCutoff ? 1 : 2
    }
    return indexInSortedClass < config.customCutoff ? 1 : 2
  }

  // Sequential 50-50 split
  const cutoff = Math.ceil(totalInClass / 2)
  return indexInSortedClass < cutoff ? 1 : 2
}

/**
 * Loads saved batch configuration for a class/subject, or falls back to default.
 */
export function loadBatchConfig(classTeam: string, subject?: string): BatchConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG
  try {
    const key = subject
      ? `kc:batchConfig:${classTeam}:${subject}`
      : `kc:batchConfig:${classTeam}`
    const raw = localStorage.getItem(key) || localStorage.getItem(`kc:batchConfig:${classTeam}`)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return DEFAULT_CONFIG
}

/**
 * Persists batch configuration for a class/subject.
 */
export function saveBatchConfig(
  classTeam: string,
  config: BatchConfig,
  subject?: string
): void {
  if (typeof window === "undefined") return
  try {
    const key = subject
      ? `kc:batchConfig:${classTeam}:${subject}`
      : `kc:batchConfig:${classTeam}`
    localStorage.setItem(key, JSON.stringify(config))
  } catch {
    // ignore
  }
}
