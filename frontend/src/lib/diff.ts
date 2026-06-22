export interface DiffToken {
  type: "added" | "removed" | "unchanged";
  value: string;
}

/**
 * Computes a line-by-line diff between two text strings using the Longest Common Subsequence (LCS) algorithm.
 */
export function diffLines(oldText: string, newText: string): DiffToken[] {
  const oldLines = oldText
    .split("\n")
    .map((line) => line.trimEnd());
  const newLines = newText
    .split("\n")
    .map((line) => line.trimEnd());

  const n = oldLines.length;
  const m = newLines.length;

  // Initialize DP table
  const dp: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffToken[] = [];
  let i = n;
  let j = m;

  // Backtrack to build the diff list
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: "unchanged", value: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", value: newLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", value: oldLines[i - 1] });
      i--;
    }
  }

  return result;
}
