import { buildSolver, solverCommit } from '../solver.js';

const bin = buildSolver(process.argv.includes('--force'));
console.log(`Solver at ${bin} (alex1770/wordle @ ${solverCommit().slice(0, 12)})`);
