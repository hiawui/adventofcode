import { runWithInput } from '../common/input.js';

type Point = {
  x: number;
  y: number;
};

runWithInput(
  async (input: string) => {
    const points: Point[] = input
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const [x, y] = line.trim().split(',').map(Number);
        return { x, y };
      });

    let maxArea = 0;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const p1 = points[i];
        const p2 = points[j];
        
        const width = Math.abs(p1.x - p2.x) + 1;
        const height = Math.abs(p1.y - p2.y) + 1;
        const area = width * height;
        
        if (area > maxArea) {
          maxArea = area;
        }
      }
    }

    return maxArea;
  },
  async (input: string) => {
    const points: Point[] = input
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const [x, y] = line.trim().split(',').map(Number);
        return { x, y };
      });

    // Coordinate compression: only use unique x and y values
    const xs = [...new Set(points.map(p => p.x))].sort((a, b) => a - b);
    const ys = [...new Set(points.map(p => p.y))].sort((a, b) => a - b);
    const xIndex = new Map(xs.map((x, i) => [x, i]));
    const yIndex = new Map(ys.map((y, i) => [y, i]));

    // Build polygon edges for boundary check
    type Edge = { x1: number; y1: number; x2: number; y2: number; isVertical: boolean };
    const edges: Edge[] = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      edges.push({
        x1: Math.min(p1.x, p2.x),
        y1: Math.min(p1.y, p2.y),
        x2: Math.max(p1.x, p2.x),
        y2: Math.max(p1.y, p2.y),
        isVertical: p1.x === p2.x
      });
    }

    // Check if point is on boundary
    const isOnBoundary = (x: number, y: number): boolean => {
      for (const e of edges) {
        if (e.isVertical) {
          if (x === e.x1 && y >= e.y1 && y <= e.y2) return true;
        } else {
          if (y === e.y1 && x >= e.x1 && x <= e.x2) return true;
        }
      }
      return false;
    };

    // Check if point is inside polygon (ray casting)
    const isInsidePolygon = (x: number, y: number): boolean => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;
        const intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // Grid points validity: valid[i][j] = true if (xs[i], ys[j]) is inside or on boundary
    const valid: boolean[][] = [];
    for (let i = 0; i < xs.length; i++) {
      valid[i] = [];
      for (let j = 0; j < ys.length; j++) {
        const x = xs[i], y = ys[j];
        valid[i][j] = isOnBoundary(x, y) || isInsidePolygon(x, y);
      }
    }

    // Cell validity: cellValid[i][j] = true if the region between (xs[i], ys[j]) and (xs[i+1], ys[j+1]) is inside
    // Check by testing center point of the cell
    const cellValid: boolean[][] = [];
    for (let i = 0; i < xs.length - 1; i++) {
      cellValid[i] = [];
      for (let j = 0; j < ys.length - 1; j++) {
        const cx = (xs[i] + xs[i + 1]) / 2;
        const cy = (ys[j] + ys[j + 1]) / 2;
        cellValid[i][j] = isInsidePolygon(cx, cy);
      }
    }

    // Build prefix sum for grid points
    const validPrefix: number[][] = [];
    for (let i = 0; i <= xs.length; i++) {
      validPrefix[i] = [];
      for (let j = 0; j <= ys.length; j++) {
        if (i === 0 || j === 0) {
          validPrefix[i][j] = 0;
        } else {
          validPrefix[i][j] = (valid[i - 1][j - 1] ? 1 : 0)
            + validPrefix[i - 1][j]
            + validPrefix[i][j - 1]
            - validPrefix[i - 1][j - 1];
        }
      }
    }

    // Build prefix sum for cells
    const cellPrefix: number[][] = [];
    for (let i = 0; i <= xs.length - 1; i++) {
      cellPrefix[i] = [];
      for (let j = 0; j <= ys.length - 1; j++) {
        if (i === 0 || j === 0) {
          cellPrefix[i][j] = 0;
        } else {
          cellPrefix[i][j] = (cellValid[i - 1][j - 1] ? 1 : 0)
            + cellPrefix[i - 1][j]
            + cellPrefix[i][j - 1]
            - cellPrefix[i - 1][j - 1];
        }
      }
    }

    // Check if rectangle from compressed (xi1, yi1) to (xi2, yi2) is valid
    const isRectValid = (xi1: number, yi1: number, xi2: number, yi2: number): boolean => {
      // Check all grid points in the rectangle
      const totalPoints = (xi2 - xi1 + 1) * (yi2 - yi1 + 1);
      const validPoints = validPrefix[xi2 + 1][yi2 + 1]
        - validPrefix[xi1][yi2 + 1]
        - validPrefix[xi2 + 1][yi1]
        + validPrefix[xi1][yi1];
      if (validPoints !== totalPoints) return false;

      // Check all cells in the rectangle (if any)
      if (xi2 > xi1 && yi2 > yi1) {
        const totalCells = (xi2 - xi1) * (yi2 - yi1);
        const validCells = cellPrefix[xi2][yi2]
          - cellPrefix[xi1][yi2]
          - cellPrefix[xi2][yi1]
          + cellPrefix[xi1][yi1];
        if (validCells !== totalCells) return false;
      }

      return true;
    };

    // Find largest valid rectangle with red corners
    let maxArea = 0;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const p1 = points[i];
        const p2 = points[j];

        const xi1 = xIndex.get(Math.min(p1.x, p2.x))!;
        const xi2 = xIndex.get(Math.max(p1.x, p2.x))!;
        const yi1 = yIndex.get(Math.min(p1.y, p2.y))!;
        const yi2 = yIndex.get(Math.max(p1.y, p2.y))!;

        if (isRectValid(xi1, yi1, xi2, yi2)) {
          const area = (Math.abs(p1.x - p2.x) + 1) * (Math.abs(p1.y - p2.y) + 1);
          maxArea = Math.max(maxArea, area);
        }
      }
    }

    return maxArea;
  },
  2025,
  9
);
