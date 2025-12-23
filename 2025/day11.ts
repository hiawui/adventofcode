import { runWithInput } from '../common/input.js';

// Build a directed graph from the input
function buildGraph(input: string): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const lines = input.trim().split('\n').filter(line => line.trim().length > 0);
  
  for (const line of lines) {
    const [device, outputsStr] = line.split(':').map(s => s.trim());
    const outputs = outputsStr ? outputsStr.split(/\s+/) : [];
    graph.set(device, outputs);
  }
  
  return graph;
}

// Count number of paths from start to end in a DAG using memoization
function countPaths(graph: Map<string, string[]>, start: string, end: string): number {
  const memo = new Map<string, number>();

  function dfs(current: string): number {
    if (current === end) {
      return 1;
    }
    
    if (memo.has(current)) {
      return memo.get(current)!;
    }

    let count = 0;
    const outputs = graph.get(current) || [];
    
    for (const next of outputs) {
      count += dfs(next);
    }
    
    memo.set(current, count);
    return count;
  }

  return dfs(start);
}

runWithInput(
  async (input: string) => {
    // Part 1: count paths from 'you' to 'out'
    // Assuming DAG as per problem description for Part 2 logic, 
    // but Part 1 code was working fine. We can use the new countPaths logic too
    // if it produces the same result (which it should for a DAG).
    const graph = buildGraph(input);
    return countPaths(graph, 'you', 'out');
  },
  async (input: string) => {
    const graph = buildGraph(input);
    
    // We need to find paths from 'svr' to 'out' that pass through 'dac' and 'fft'.
    // Since the graph is a DAG (data flows only one way), the order must be either:
    // svr -> ... -> dac -> ... -> fft -> ... -> out
    // OR
    // svr -> ... -> fft -> ... -> dac -> ... -> out
    
    // Case 1: svr -> dac -> fft -> out
    const svr_dac = countPaths(graph, 'svr', 'dac');
    const dac_fft = countPaths(graph, 'dac', 'fft');
    const fft_out = countPaths(graph, 'fft', 'out');
    const paths1 = svr_dac * dac_fft * fft_out;
    
    // Case 2: svr -> fft -> dac -> out
    const svr_fft = countPaths(graph, 'svr', 'fft');
    const fft_dac = countPaths(graph, 'fft', 'dac');
    const dac_out = countPaths(graph, 'dac', 'out');
    const paths2 = svr_fft * fft_dac * dac_out;
    
    return paths1 + paths2;
  },
  2025,
  11
);
