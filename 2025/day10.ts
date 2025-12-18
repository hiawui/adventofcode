import { runWithInput } from '../common/input.js';

type Machine = {
  target: boolean[];  // true = on (#), false = off (.)
  buttons: number[][]; // each button lists which lights it toggles
  joltages: number[]; // target joltage values for part 2
};

function parseLine(line: string): Machine {
  // Parse indicator light diagram [...]
  const diagramMatch = line.match(/\[([.#]+)\]/);
  if (!diagramMatch) throw new Error(`Invalid line: ${line}`);
  const target = diagramMatch[1].split('').map(c => c === '#');

  // Parse button wiring schematics (...)
  const buttonMatches = line.matchAll(/\(([0-9,]+)\)/g);
  const buttons: number[][] = [];
  for (const match of buttonMatches) {
    const indices = match[1].split(',').map(Number);
    buttons.push(indices);
  }

  // Parse joltage requirements {...}
  const joltageMatch = line.match(/\{([0-9,]+)\}/);
  if (!joltageMatch) throw new Error(`Invalid joltage in line: ${line}`);
  const joltages = joltageMatch[1].split(',').map(Number);

  return { target, buttons, joltages };
}

function findMinPresses(machine: Machine): number {
  const { target, buttons } = machine;
  const numLights = target.length;
  const numButtons = buttons.length;
  
  // Convert target to bitmask
  let targetMask = 0;
  for (let i = 0; i < numLights; i++) {
    if (target[i]) {
      targetMask |= (1 << i);
    }
  }

  // Convert each button to bitmask
  const buttonMasks = buttons.map(indices => {
    let mask = 0;
    for (const idx of indices) {
      mask |= (1 << idx);
    }
    return mask;
  });

  // Try all 2^n combinations of button presses
  let minPresses = Infinity;
  const totalCombinations = 1 << numButtons;
  
  for (let combo = 0; combo < totalCombinations; combo++) {
    // Calculate resulting light pattern
    let result = 0;
    let presses = 0;
    
    for (let b = 0; b < numButtons; b++) {
      if (combo & (1 << b)) {
        result ^= buttonMasks[b];
        presses++;
      }
    }
    
    if (result === targetMask) {
      minPresses = Math.min(minPresses, presses);
    }
  }

  return minPresses === Infinity ? -1 : minPresses;
}

// Part 2: Each button press adds 1 to affected counters (instead of XOR)
// Find minimum total presses to reach exact target joltage values
// 
// This is solving Ax = b where A is 0/1 matrix, minimizing sum(x) with x >= 0
// Use Gaussian elimination to reduce to free variables, then search
function findMinPressesPartTwo(machine: Machine): number {
  const { buttons, joltages } = machine;
  const numButtons = buttons.length;
  const numCounters = joltages.length;

  // Build matrix A[counter][button] and vector b
  // We'll use fractions for exact arithmetic (numerator, denominator)
  type Frac = [number, number];
  const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);
  const fracReduce = ([n, d]: Frac): Frac => {
    if (n === 0) return [0, 1];
    const g = gcd(n, d);
    const sign = d < 0 ? -1 : 1;
    return [sign * n / g, sign * d / g];
  };
  const fracAdd = (a: Frac, b: Frac): Frac => fracReduce([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
  const fracSub = (a: Frac, b: Frac): Frac => fracReduce([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]);
  const fracMul = (a: Frac, b: Frac): Frac => fracReduce([a[0] * b[0], a[1] * b[1]]);
  const fracDiv = (a: Frac, b: Frac): Frac => fracReduce([a[0] * b[1], a[1] * b[0]]);
  const fracVal = ([n, d]: Frac): number => n / d;
  const fracIsZero = ([n, _]: Frac): boolean => n === 0;
  const fracFromInt = (n: number): Frac => [n, 1];

  // Augmented matrix [A | b] with fractions
  const matrix: Frac[][] = [];
  for (let c = 0; c < numCounters; c++) {
    const row: Frac[] = [];
    for (let b = 0; b < numButtons; b++) {
      row.push(buttons[b].includes(c) ? [1, 1] : [0, 1]);
    }
    row.push([joltages[c], 1]); // augmented column
    matrix.push(row);
  }

  // Gaussian elimination with partial pivoting
  const pivotCol: number[] = []; // pivotCol[row] = column of pivot in that row, or -1
  let row = 0;
  for (let col = 0; col < numButtons && row < numCounters; col++) {
    // Find pivot
    let pivotRow = -1;
    for (let r = row; r < numCounters; r++) {
      if (!fracIsZero(matrix[r][col])) {
        pivotRow = r;
        break;
      }
    }
    if (pivotRow === -1) continue; // No pivot in this column

    // Swap rows
    [matrix[row], matrix[pivotRow]] = [matrix[pivotRow], matrix[row]];

    // Scale pivot row
    const pivotVal = matrix[row][col];
    for (let c = col; c <= numButtons; c++) {
      matrix[row][c] = fracDiv(matrix[row][c], pivotVal);
    }

    // Eliminate other rows
    for (let r = 0; r < numCounters; r++) {
      if (r !== row && !fracIsZero(matrix[r][col])) {
        const factor = matrix[r][col];
        for (let c = col; c <= numButtons; c++) {
          matrix[r][c] = fracSub(matrix[r][c], fracMul(factor, matrix[row][c]));
        }
      }
    }

    pivotCol.push(col);
    row++;
  }

  // Identify pivot variables and free variables
  const pivotVars = new Set(pivotCol);
  const freeVars: number[] = [];
  for (let b = 0; b < numButtons; b++) {
    if (!pivotVars.has(b)) freeVars.push(b);
  }

  // Check consistency: any row with all zeros except last column means no solution
  for (let r = pivotCol.length; r < numCounters; r++) {
    if (!fracIsZero(matrix[r][numButtons])) {
      return -1;
    }
  }

  // Now we have: pivot vars = (constant) - (coefficients) * (free vars)
  // We need to enumerate free variables and compute pivot vars
  // For each pivot row r with pivot in column pivotCol[r]:
  //   x[pivotCol[r]] = matrix[r][numButtons] - sum_{f in freeVars} matrix[r][f] * x[f]

  // Compute upper bounds for free variables
  // Simple bound: free variable can't exceed the minimum target of counters it affects
  const freeUpperBounds: number[] = freeVars.map(f => {
    let maxVal = Math.max(...joltages); // Conservative upper bound
    for (const c of buttons[f]) {
      maxVal = Math.min(maxVal, joltages[c]);
    }
    return maxVal;
  });

  // Search over free variables
  let minTotal = Infinity;

  function searchFree(idx: number, freeValues: number[], currentSum: number): void {
    if (currentSum >= minTotal) return;

    if (idx === freeVars.length) {
      // Compute pivot variable values
      const x = new Array(numButtons).fill(0);
      for (let i = 0; i < freeVars.length; i++) {
        x[freeVars[i]] = freeValues[i];
      }

      let total = currentSum;

      // Compute pivot vars
      for (let r = 0; r < pivotCol.length; r++) {
        const pCol = pivotCol[r];
        let val: Frac = matrix[r][numButtons];
        for (let i = 0; i < freeVars.length; i++) {
          val = fracSub(val, fracMul(matrix[r][freeVars[i]], fracFromInt(freeValues[i])));
        }
        const numVal = fracVal(val);
        // Check if integer and non-negative
        if (numVal < -1e-9 || Math.abs(numVal - Math.round(numVal)) > 1e-9) {
          return; // Not valid
        }
        x[pCol] = Math.round(numVal);
        if (x[pCol] < 0) return;
        total += x[pCol];
        if (total >= minTotal) return;
      }

      minTotal = total;
      return;
    }

    const maxVal = freeUpperBounds[idx];

    for (let v = 0; v <= maxVal; v++) {
      if (currentSum + v >= minTotal) break;
      freeValues.push(v);
      searchFree(idx + 1, freeValues, currentSum + v);
      freeValues.pop();
    }
  }

  // Debug info
  // console.log(`Free vars: ${freeVars.length}, bounds: ${freeUpperBounds.join(',')}, pivots: ${pivotCol.length}`);

  searchFree(0, [], 0);

  // If no solution found with Gaussian method, return error indicator
  return minTotal === Infinity ? -1 : minTotal;
}

runWithInput(
  async (input: string) => {
    const lines = input
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0);

    let totalPresses = 0;
    for (const line of lines) {
      const machine = parseLine(line);
      const presses = findMinPresses(machine);
      if (presses === -1) {
        throw new Error(`No solution found for: ${line}`);
      }
      totalPresses += presses;
    }

    return totalPresses;
  },
  async (input: string) => {
    const lines = input
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0);

    let totalPresses = 0;
    for (const line of lines) {
      const machine = parseLine(line);
      const presses = findMinPressesPartTwo(machine);
      if (presses === -1) {
        throw new Error(`No solution found for: ${line}`);
      }
      totalPresses += presses;
    }

    return totalPresses;
  },
  2025,
  10
);
