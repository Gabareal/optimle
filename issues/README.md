# Local issue tracker

Each issue is one markdown file `NNNN-slug.md` with YAML front matter:

- `title`, `labels` (e.g. `wayfinder:map`, `wayfinder:research`)
- `status`: `open` | `closed`
- `parent`: id of the map (child tickets only)
- `blocked_by`: list of ids; a ticket is unblocked when all are closed
- `assignee`: the claim; empty = unclaimed

Frontier = open, unblocked, unassigned children of the map. Resolution goes in a `## Resolution` section appended to the body (the "comment"), then `status: closed`.
