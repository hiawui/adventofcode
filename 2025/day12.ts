import { runWithInput } from '../common/input.js';

type Shape = boolean[][]; // true = # (filled), false = . (empty)
type Region = {
  width: number;
  height: number;
  presents: number[]; // presents[i] = quantity of shape i needed
};

// Optimized Shape Representation for Solver
type ShapeMask = {
  rows: bigint[]; // bitmask per row
  width: number;
  height: number;
};

// Parse a shape from its string representation
function parseShape(lines: string[]): Shape {
  return lines.map(line => line.split('').map(c => c === '#'));
}

// Rotate a shape 90 degrees clockwise
function rotate(shape: Shape): Shape {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: Shape = [];
  
  for (let c = 0; c < cols; c++) {
    const row: boolean[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      row.push(shape[r][c]);
    }
    rotated.push(row);
  }
  
  return rotated;
}

// Flip a shape horizontally
function flipHorizontal(shape: Shape): Shape {
  return shape.map(row => [...row].reverse());
}

// Convert boolean[][] to BigInt[] masks
function toMask(shape: Shape): ShapeMask {
  const height = shape.length;
  const width = shape[0].length;
  const rows: bigint[] = [];
  
  for (let r = 0; r < height; r++) {
    let rowMask = 0n;
    for (let c = 0; c < width; c++) {
      if (shape[r][c]) {
        rowMask |= (1n << BigInt(c));
      }
    }
    rows.push(rowMask);
  }
  
  return { rows, width, height };
}

// Generate all unique orientations of a shape (rotations + flips)
function generateOrientations(shape: Shape): ShapeMask[] {
  const orientations = new Set<string>();
  const result: ShapeMask[] = [];
  
  let current = shape;
  
  // Try all 4 rotations
  for (let rot = 0; rot < 4; rot++) {
    // Try original and flipped
    const variants = [current, flipHorizontal(current)];
    
    for (const variant of variants) {
      // Use string representation for uniqueness check
      const key = variant.map(row => row.map(b => b ? '#' : '.').join('')).join('\n');
      if (!orientations.has(key)) {
        orientations.add(key);
        result.push(toMask(variant));
      }
    }
    
    current = rotate(current);
  }
  
  return result;
}

// Try to fit all presents in a region using backtracking with bitmasks
function canFitPresents(shapes: ShapeMask[][], region: Region): boolean {
  const { width, height, presents } = region;
  
  // Create list of pieces to place
  // Store as { shapeIndex, area } to sort
  type Piece = { 
    shapeIndex: number; 
    area: number; 
  };
  const piecesToPlace: Piece[] = [];
  let minPieceArea = Infinity;
  
  for (let i = 0; i < presents.length; i++) {
    if (presents[i] > 0) {
      // Calculate area (number of set bits)
      const mask = shapes[i][0];
      let area = 0;
      for (const row of mask.rows) {
        let r = row;
        while (r > 0n) {
          if (r & 1n) area++;
          r >>= 1n;
        }
      }
      
      minPieceArea = Math.min(minPieceArea, area);
      for (let count = 0; count < presents[i]; count++) {
        piecesToPlace.push({ shapeIndex: i, area });
      }
    }
  }
  
  if (piecesToPlace.length === 0) {
    return true; // No pieces to place
  }
  
  // Sort pieces by area descending (largest first)
  piecesToPlace.sort((a, b) => b.area - a.area);
  
  // Precompute min remaining area for pruning
  const suffixMinArea: number[] = new Array(piecesToPlace.length);
  let currentMin = Infinity;
  for (let i = piecesToPlace.length - 1; i >= 0; i--) {
    currentMin = Math.min(currentMin, piecesToPlace[i].area);
    suffixMinArea[i] = currentMin;
  }

  const remainingAreaTotal: number[] = new Array(piecesToPlace.length + 1).fill(0);
  for(let i = piecesToPlace.length - 1; i >= 0; i--) {
    remainingAreaTotal[i] = remainingAreaTotal[i+1] + piecesToPlace[i].area;
  }
  
  // Grid represented as array of BigInts (one per row)
  const grid: bigint[] = new Array(height).fill(0n);
  
  // Track placements to enforce ordering for identical pieces
  // Stores (row * width + col) of previous identical piece
  const lastPlacementPos: number[] = new Array(piecesToPlace.length).fill(-1);

  // Pruning: check if total area fits
  if (remainingAreaTotal[0] > width * height) return false;

  // Backtracking function
  function backtrack(pieceIndex: number): boolean {
    if (pieceIndex >= piecesToPlace.length) {
      return true; // All pieces placed
    }
    
    const shapeIndex = piecesToPlace[pieceIndex].shapeIndex;
    if (!shapes[shapeIndex]) {
      throw new Error(`Shape ${shapeIndex} not found`);
    }
    const orientations = shapes[shapeIndex];
    
    // Symmetry breaking for identical pieces
    let startRow = 0;
    let startCol = 0;
    
    if (pieceIndex > 0 && piecesToPlace[pieceIndex].shapeIndex === piecesToPlace[pieceIndex - 1].shapeIndex) {
      const lastPos = lastPlacementPos[pieceIndex - 1];
      if (lastPos !== -1) {
        startRow = Math.floor(lastPos / width);
        startCol = lastPos % width;
      }
    }

    // Try each orientation
    for (const orient of orientations) {
      const { rows: shapeRows, width: shapeW, height: shapeH } = orient;
      
      const maxRow = height - shapeH;
      const maxCol = width - shapeW;
      
      // Calculate effective start for this orientation
      const effStartRow = startRow;
      const effStartCol = startCol;
      
      for (let r = Math.max(0, effStartRow); r <= maxRow; r++) {
        const cStart = (r === effStartRow) ? effStartCol : 0;
        
        for (let c = cStart; c <= maxCol; c++) {
          
          // Check collision
          let collision = false;
          const shift = BigInt(c);
          
          // Quick check with first row
          if ((grid[r] & (shapeRows[0] << shift)) !== 0n) {
             collision = true;
          } else {
              for (let i = 1; i < shapeH; i++) {
                if ((grid[r + i] & (shapeRows[i] << shift)) !== 0n) {
                  collision = true;
                  break;
                }
              }
          }
          
          if (!collision) {
            // Place shape
            for (let i = 0; i < shapeH; i++) {
              grid[r + i] |= (shapeRows[i] << shift);
            }
            
            lastPlacementPos[pieceIndex] = r * width + c;
            
            if (backtrack(pieceIndex + 1)) {
              return true;
            }
            
            // Remove shape (backtrack)
            for (let i = 0; i < shapeH; i++) {
              grid[r + i] &= ~(shapeRows[i] << shift);
            }
          }
        }
      }
    }
    
    return false;
  }
  
  return backtrack(0);
}

// Parse input
function parseInput(input: string): { shapes: ShapeMask[][]; regions: Region[] } {
  const lines = input.trim().split('\n').filter(line => line.trim().length > 0);
  
  const shapes: ShapeMask[][] = [];
  const regions: Region[] = [];
  
  let i = 0;
  
  // Parse shapes
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Check if this is a region (has 'x' in format like "12x5")
    if (line.match(/^\d+x\d+/)) {
      break; // Start parsing regions
    }
    
    // Check if this is a shape index line (format: "0:")
    if (line.includes(':')) {
      const shapeIndex = parseInt(line.split(':')[0]);
      i++; // Skip index line
      
      const shapeLines: string[] = [];
      // Read shape lines until we hit a blank line, next shape, or a region
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (!nextLine) {
          i++; // Skip blank line
          break;
        }
        // Check for start of next shape or region
        if (nextLine.match(/^\d+:/) || nextLine.match(/^\d+x\d+/)) {
          break; 
        }
        shapeLines.push(lines[i]);
        i++;
      }
      
      if (shapeLines.length > 0) {
        const shape = parseShape(shapeLines);
        const orientations = generateOrientations(shape);
        shapes[shapeIndex] = orientations;
      }
    } else {
      i++; // Skip blank or unrecognized lines
    }
  }
  
  // Parse regions
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    
    // Format: "12x5: 1 0 1 0 2 2"
    const match = line.match(/(\d+)x(\d+):\s*(.+)/);
    if (match) {
      const width = parseInt(match[1]);
      const height = parseInt(match[2]);
      const presents = match[3].trim().split(/\s+/).map(Number);
      
      regions.push({ width, height, presents });
    }
    
    i++;
  }
  
  return { shapes, regions };
}

runWithInput(
  async (input: string) => {
    const { shapes, regions } = parseInput(input);
    
    let count = 0;
    for (const region of regions) {
      if (canFitPresents(shapes, region)) {
        count++;
      }
    }
    
    return count;
  },
  async (input: string) => {
    // Part 2 not implemented yet
    return 0;
  },
  2025,
  12
);
