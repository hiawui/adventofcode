import { runWithInput } from '../common/input.js';

runWithInput(
  async (input: string) => {
    // Part 1
    const grid = input
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.split(/\s+/));
    
    // Determine the number of columns (problems)
    const numCols = Math.max(...grid.map(row => row.length));
    
    let grandTotal = 0;

    for (let col = 0; col < numCols; col++) {
      const columnTokens: string[] = [];
      
      // Collect tokens for this column
      for (let row = 0; row < grid.length; row++) {
        if (col < grid[row].length) {
          columnTokens.push(grid[row][col]);
        }
      }

      if (columnTokens.length === 0) continue;

      // The last token is the operator
      const op = columnTokens.pop();
      const numbers = columnTokens.map(Number);

      if (numbers.some(isNaN)) {
         continue;
      }

      let result = 0;
      if (op === '+') {
        result = numbers.reduce((acc, n) => acc + n, 0);
      } else if (op === '*') {
        result = numbers.reduce((acc, n) => acc * n, 1);
      }
      
      grandTotal += result;
    }

    return grandTotal;
  },
  async (input: string) => {
    // Part 2
    // Do not trim individual lines, preserve spaces. Only trim trailing newlines at the end of file.
    const lines = input.replace(/\s+$/, '').split('\n');
    
    // Determine dimensions
    const maxLength = Math.max(...lines.map(l => l.length));
    
    // Helper to check if a column is completely empty
    const isColEmpty = (x: number) => {
      for (const line of lines) {
        if (x < line.length && line[x] !== ' ') {
          return false;
        }
      }
      return true;
    };

    // Find ranges [start, end) for each problem
    const ranges: {start: number, end: number}[] = [];
    let start = -1;
    for (let x = 0; x < maxLength; x++) {
        if (!isColEmpty(x)) {
            if (start === -1) start = x;
        } else {
            if (start !== -1) {
                ranges.push({start, end: x});
                start = -1;
            }
        }
    }
    if (start !== -1) {
        ranges.push({start, end: maxLength});
    }

    let grandTotal = 0;

    for (const range of ranges) {
        const { start, end } = range;
        
        // Extract numbers and operator for this block
        const numbers: number[] = [];
        let op: string | null = null;
        
        // Find operator in the last line (assuming operator is always at the bottom)
        // Scan the operator line within the range to find the operator char
        const opLineIdx = lines.length - 1;
        const opLine = lines[opLineIdx];
        
        for (let x = start; x < end; x++) {
            if (x < opLine.length && opLine[x] !== ' ') {
                op = opLine[x];
                break;
            }
        }

        // Process number columns (all columns in range)
        // Numbers are vertical columns from top to bottom, excluding the last line (operator line)
        for (let x = start; x < end; x++) {
            let numStr = '';
            // Iterate all lines except the last one
            for (let y = 0; y < lines.length - 1; y++) {
                const line = lines[y];
                if (x < line.length && line[x] !== ' ') {
                    numStr += line[x];
                }
            }
            if (numStr.length > 0) {
                numbers.push(parseInt(numStr, 10));
            }
        }

        if (op && numbers.length > 0) {
            let result = 0;
            if (op === '+') {
                result = numbers.reduce((acc, n) => acc + n, 0);
            } else if (op === '*') {
                result = numbers.reduce((acc, n) => acc * n, 1);
            }
            grandTotal += result;
        }
    }

    return grandTotal;
  },
  2025,
  6
);
