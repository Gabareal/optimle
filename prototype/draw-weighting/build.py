# PROTOTYPE: embeds the SALET Eligible Game states into the draw-weighting demo.
# Usage: python3 prototype/draw-weighting/build.py   (from the repo root)
import json, os
here = os.path.dirname(os.path.abspath(__file__))
data = os.path.join(here, '..', '..', 'packages', 'site', 'public', 'data')
tree = json.load(open(os.path.join(data, 'tree.salet.json')))['tree']
answers = json.load(open(os.path.join(data, 'answers.json')))['words']

def fb(g, a):
    r = ['B'] * 5; rem = list(a)
    for i in range(5):
        if g[i] == a[i]: r[i] = 'G'; rem[i] = None
    for i in range(5):
        if r[i] == 'B' and g[i] in rem: r[i] = 'Y'; rem[rem.index(g[i])] = None
    return ''.join(r)

states = []
def walk(node, cands, rows, top):
    guess, children = node
    turn = len(rows) + 1  # the turn about to be played
    if rows and len(cands) >= 3:
        states.append({'key': '.'.join(p for _, p in rows), 'turn': turn, 'rows': rows,
                       'guess': guess, 'cands': cands, 'top': top})
    groups = {}
    for a in cands: groups.setdefault(fb(guess, a), []).append(a)
    for p, child in children.items():
        if child == 0: continue
        walk(child, groups[p], rows + [[guess, p]], top or p)

walk(tree, answers, [], None)
html = open(os.path.join(here, 'template.html')).read()
out = html.replace('/*DATA*/null', json.dumps(states, separators=(',', ':')))
open(os.path.join(here, 'PROTOTYPE-draw-weighting.html'), 'w').write(out)
print(len(states), 'Eligible Game states;', {t: sum(1 for s in states if s['turn'] == t) for t in (2, 3, 4)})
