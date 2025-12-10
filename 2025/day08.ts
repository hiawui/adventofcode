import { runWithInput } from '../common/input.js';

type Point = {
  x: number;
  y: number;
  z: number;
  id: number;
};

type Pair = {
  u: number;
  v: number;
  distSq: number;
};

// Disjoint Set Union (DSU) for managing connected components
class DSU {
  parent: number[];
  size: number[];

  constructor(n: number) {
    // Initialize: each node is its own parent, size is 1
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
  }

  // Find root of the set, with path compression
  find(i: number): number {
    if (this.parent[i] === i) {
      return i;
    }
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  // Union two sets
  union(i: number, j: number): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI !== rootJ) {
      // Union by size: attach smaller tree to larger tree
      if (this.size[rootI] < this.size[rootJ]) {
        this.parent[rootI] = rootJ;
        this.size[rootJ] += this.size[rootI];
      } else {
        this.parent[rootJ] = rootI;
        this.size[rootI] += this.size[rootJ];
      }
      return true;
    }
    return false;
  }

  // Get sizes of all connected components
  getComponentSizes(): number[] {
    const sizes = new Map<number, number>();
    for (let i = 0; i < this.parent.length; i++) {
      const root = this.find(i);
      // Use the size stored at the root
      sizes.set(root, this.size[root]);
    }
    return Array.from(sizes.values());
  }
}

runWithInput(
  async (input: string) => {
    // Parse input: each line is a 3D coordinate
    const points: Point[] = input
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line, idx) => {
        const [x, y, z] = line.trim().split(',').map(Number);
        return { x, y, z, id: idx };
      });

    // Generate all pairs and calculate squared Euclidean distance
    const pairs: Pair[] = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const p1 = points[i];
        const p2 = points[j];
        const distSq =
          (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2;
        pairs.push({ u: i, v: j, distSq });
      }
    }

    // Sort pairs by distance (ascending)
    pairs.sort((a, b) => a.distSq - b.distSq);

    const dsu = new DSU(points.length);
    // Connect the 1000 closest pairs (or all if less than 1000)
    const limit = Math.min(1000, pairs.length);

    for (let i = 0; i < limit; i++) {
      dsu.union(pairs[i].u, pairs[i].v);
    }

    // Get sizes of all circuits (connected components)
    const sizes = dsu.getComponentSizes();
    // Sort sizes descending
    sizes.sort((a, b) => b - a);

    // Multiply the sizes of the three largest circuits
    const top3 = sizes.slice(0, 3);
    const result = top3.reduce((acc, val) => acc * val, 1);

    return result;
  },
  async (input: string) => {
    // Parse input: each line is a 3D coordinate
    const points: Point[] = input
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line, idx) => {
        const [x, y, z] = line.trim().split(',').map(Number);
        return { x, y, z, id: idx };
      });

    // Generate all pairs and calculate squared Euclidean distance
    const pairs: Pair[] = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const p1 = points[i];
        const p2 = points[j];
        const distSq =
          (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2;
        pairs.push({ u: i, v: j, distSq });
      }
    }

    // Sort pairs by distance (ascending)
    pairs.sort((a, b) => a.distSq - b.distSq);

    const dsu = new DSU(points.length);
    let numComponents = points.length;

    // Iterate through all pairs until only one component remains
    for (const pair of pairs) {
      if (dsu.union(pair.u, pair.v)) {
        numComponents--;
        if (numComponents === 1) {
          // This is the last connection that merges everything into one circuit
          return points[pair.u].x * points[pair.v].x;
        }
      }
    }

    return 0;
  },
  2025,
  8
);
