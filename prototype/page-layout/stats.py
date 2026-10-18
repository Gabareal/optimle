# PROTOTYPE placeholder stats: greedy-entropy restricted to Answers (stand-in for the real comparison
# Strategies) and root entropy for every Answer as opener (stand-in for the openers table).
import sys, json, math
from collections import Counter
tree = json.load(open(sys.argv[1]))
ans = []
def walk(n):
    for p, c in n[1].items():
        if c == 0: ans.append(n[0])
        else: walk(c)
walk(tree); ans.sort(); N = len(ans); idx = {w: i for i, w in enumerate(ans)}
def fb(g, a):
    r = [0]*5; rem = list(a)
    for i in range(5):
        if g[i] == a[i]: r[i] = 2; rem[i] = None
    for i in range(5):
        if r[i] == 0 and g[i] in rem: r[i] = 1; rem[rem.index(g[i])] = None
    return r[0]+3*r[1]+9*r[2]+27*r[3]+81*r[4]
M = [bytes(fb(g, a) for a in ans) for g in ans]
def H(gi, cand):
    c = Counter(M[gi][a] for a in cand); n = len(cand)
    return -sum(v/n*math.log2(v/n) for v in c.values())
root = list(range(N))
ent = sorted(((H(g, root), ans[g]) for g in range(N)), reverse=True)
counts = {}
def greedy(cand, depth):
    if len(cand) == 1: counts[ans[cand[0]]] = depth; return
    best = max(cand, key=lambda g: (H(g, cand), -g))
    groups = {}
    for a in cand: groups.setdefault(M[best][a], []).append(a)
    for p, g in groups.items():
        if p == 242: counts[ans[best]] = depth
        else: greedy(g, depth + 1)
greedy(root, 1)
json.dump({'greedy': counts, 'openers': [[w, round(h, 3)] for h, w in ent[:105]]}, open(sys.argv[2], 'w'), separators=(',', ':'))
print('greedy total', sum(counts.values()), 'avg', sum(counts.values())/N, 'top', ent[:5])
