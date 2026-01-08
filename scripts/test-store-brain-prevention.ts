import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const FORBIDDEN_TERMS = [
  "buy",
  "order",
  "checkout",
  "cart",
  "deal",
  "discount",
  "flash",
  "limited-time offer",
  "purchase",
];

const SCAN_DIRECTORIES = ["server", "client", "shared"];

const EXCLUDED_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.min\./,
  /package-lock\.json/,
  /package\.json/,
];

const SCANNED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".css",
  ".html",
  ".sql",
  ".md",
];

interface Violation {
  file: string;
  line: number;
  term: string;
  context: string;
}

function shouldScanFile(filePath: string): boolean {
  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(filePath))) {
    return false;
  }
  const ext = extname(filePath).toLowerCase();
  return SCANNED_EXTENSIONS.includes(ext);
}

function getAllFiles(dir: string, files: string[] = []): string[] {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (!EXCLUDED_PATTERNS.some((pattern) => pattern.test(fullPath))) {
            getAllFiles(fullPath, files);
          }
        } else if (stat.isFile() && shouldScanFile(fullPath)) {
          files.push(fullPath);
        }
      } catch {
        // Skip files/dirs we can't access
      }
    }
  } catch {
    // Skip directories we can't access
  }
  return files;
}

function scanFileForViolations(filePath: string): Violation[] {
  const violations: Violation[] = [];
  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();

      for (const term of FORBIDDEN_TERMS) {
        const termLower = term.toLowerCase();
        
        // Use word boundary matching to avoid false positives
        // Match: "buy", "Buy", "BUY" but not "buyer" unless it's "buy" followed by non-word char
        const regex = new RegExp(`\\b${termLower}\\b`, "i");
        
        if (regex.test(lineLower)) {
          // Check for false positives in comments explaining the restriction
          const isFalsePositive = 
            lineLower.includes("forbidden") ||
            lineLower.includes("not allowed") ||
            lineLower.includes("prevention") ||
            lineLower.includes("store-brain") ||
            // Allow "collective buying" as it's part of the platform concept
            (termLower === "buy" && lineLower.includes("collective buying")) ||
            // Allow variable/function names that happen to contain the term
            (termLower === "order" && (
              lineLower.includes("orderby") || 
              lineLower.includes("order by") ||
              lineLower.includes("sort order") ||
              lineLower.includes("order:") ||
              lineLower.includes("in order to")
            ));

          if (!isFalsePositive) {
            violations.push({
              file: filePath,
              line: i + 1,
              term: term,
              context: line.trim().substring(0, 100),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
  return violations;
}

function main() {
  console.log("=== Store-Brain Prevention Test ===\n");
  console.log("Scanning for forbidden commerce terms...\n");
  console.log("Forbidden terms:", FORBIDDEN_TERMS.join(", "));
  console.log("Scanning directories:", SCAN_DIRECTORIES.join(", "));
  console.log("");

  const allFiles: string[] = [];
  for (const dir of SCAN_DIRECTORIES) {
    getAllFiles(dir, allFiles);
  }

  console.log(`Found ${allFiles.length} files to scan.\n`);

  const allViolations: Violation[] = [];
  
  for (const file of allFiles) {
    const violations = scanFileForViolations(file);
    allViolations.push(...violations);
  }

  if (allViolations.length === 0) {
    console.log("✓ No forbidden commerce terms found!");
    console.log("\nPhase 1 store-brain prevention: PASSED");
    process.exit(0);
  } else {
    console.log("✗ Forbidden commerce terms detected:\n");
    
    // Group by file
    const byFile = new Map<string, Violation[]>();
    for (const v of allViolations) {
      if (!byFile.has(v.file)) {
        byFile.set(v.file, []);
      }
      byFile.get(v.file)!.push(v);
    }

    for (const [file, violations] of byFile) {
      console.log(`\n${file}:`);
      for (const v of violations) {
        console.log(`  Line ${v.line}: term="${v.term}"`);
        console.log(`    Context: ${v.context}`);
      }
    }

    console.log(`\n\nTotal violations: ${allViolations.length}`);
    console.log("\nPhase 1 store-brain prevention: FAILED");
    console.log("\nThis platform is NOT a store. Please use trust-first language:");
    console.log("  - Instead of 'buy' → use 'commit', 'participate', 'join'");
    console.log("  - Instead of 'order' → use 'commitment', 'participation'");
    console.log("  - Instead of 'cart' → use 'commitment wizard', 'participation flow'");
    console.log("  - Instead of 'checkout' → use 'confirm commitment'");
    console.log("  - Instead of 'purchase' → use 'collective action', 'campaign participation'");
    
    process.exit(1);
  }
}

main();
