import sys, json
src, out = sys.argv[1], sys.argv[2]
def fb(g, a):
    r=['B']*5; rem=list(a)
    for i in range(5):
        if g[i]==a[i]: r[i]='G'; rem[i]=None
    for i in range(5):
        if r[i]=='B' and g[i] in rem: r[i]='Y'; rem[rem.index(g[i])]=None
    return ''.join(r)
root=None; prev=''; total=0; bad=0; answers=[]
for line in open(src):
    line=line.rstrip('\n')
    ind=len(line)-len(line.lstrip(' '))
    full=prev[:ind]+line[ind:]; prev=full
    t=full.split()
    pairs=[(t[i],t[i+1][:5]) for i in range(0,len(t),2)]
    ans=pairs[-1][0]; answers.append(ans); total+=len(pairs)
    if root is None: root={'g':pairs[0][0],'c':{}}
    node=root
    for k,(g,p) in enumerate(pairs):
        assert node['g']==g
        if fb(g,ans)!=p: bad+=1
        if p=='GGGGG': node['c']['GGGGG']=0; break
        nxt=pairs[k+1][0]
        node=node['c'].setdefault(p,{'g':nxt,'c':{}})
def comp(n): return 0 if n==0 else [n['g'],{p:comp(c) for p,c in n['c'].items()}]
json.dump(comp(root),open(out,'w'),separators=(',',':'))
print('answers',len(answers),'unique',len(set(answers)),'total',total,'bad patterns',bad)
