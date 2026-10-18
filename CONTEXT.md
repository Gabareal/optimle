# Wordle Optimal Strategy Visualiser

A public website that shows the optimal Wordle strategy as an explorable decision tree, plus interactive stats.

## Language

**Answer**:
The secret word for a game, drawn from the 2,315-word original answer list.
_Avoid_: target, solution, secret

**Guess**:
A word played in a turn, drawn from the 12,972-word allowed-guess list (which includes all Answers).
_Avoid_: move, try

**Feedback pattern**:
The green/yellow/grey colouring returned for a Guess against an Answer; one of 3^5 = 243 possibilities.
_Avoid_: clue, result, score

**Candidate set**:
The Answers still consistent with every Feedback pattern seen so far.
_Avoid_: remaining words, pool

**Game state**:
A point in a game, identified by the sequence of (Guess, Feedback pattern) pairs so far; determines a Candidate set.
_Avoid_: position, node (when talking about the game rather than the tree)

**Decision tree**:
The strategy as a tree: each node is a Game state with the chosen Guess; each edge is a Feedback pattern leading to the next Game state.

**Optimal strategy**:
The Decision tree that minimises the average number of Guesses over all Answers (normal mode). No worst-case cap is imposed.

**Path**:
The sequence of Game states the Decision tree walks through for one specific Answer.

**Expected guesses**:
The average number of further Guesses needed from a Game state under a given strategy, over its Candidate set.

**Opener**:
The first Guess of a Decision tree. Each Opener has its own optimal tree.
_Avoid_: starter, starting word

**Strategy**:
A rule that picks a Guess for every Game state, so it defines a Decision tree. The site compares three: the **Optimal strategy**, **Greedy-entropy** (always the Guess with the highest entropy over the Candidate set), and **Answers-only optimal** (the best tree when only Candidates may be guessed).

**What-if Guess**:
A Guess the visitor proposes at a Game state to compare with the tree's choice. It never changes the tree. A link can carry one, for example from a Round card to the player's own Guess.

**Also optimal**:
A Guess at a Game state whose Expected guesses equal the chosen Guess's.

**Ranked trainer**:
The part of the site where a player is shown Game states from the Optimal strategy's Decision tree and scored on how close their Guess is to optimal. The other part is the **Visualiser**.
_Avoid_: game mode, quiz

**Visualiser**:
The part of the site for exploring Decision trees, comparing Strategies and Openers, and trying What-if Guesses. It is the site's home page. The Visualiser and the Ranked trainer are the site's two **sub-sites**, and together they make up **Optimal Wordle**.
_Avoid_: explorer, viewer

**Run**:
One play of the Ranked trainer: 5 Rounds, ending in a Score.
_Avoid_: game, session, match

**Round**:
One Game state put to the player, who answers with a single Guess.
_Avoid_: question, turn (a turn is one Guess within a Wordle game)

**Eligible Game state**:
A Game state that can be drawn for a Round: not the root, and with at least 3 Candidates.

**Path frequency**:
How often a Game state occurs: the share of Answers whose Path passes through it, i.e. its Candidate-set size ÷ the number of Answers.
_Avoid_: popularity, probability (the draw probability may differ from Path frequency)

**First row**:
The opener and the Feedback pattern it got: the first row of the board at a Game state. Two Rounds in a Run share one only when no other First row is left.

## Relationships

- A **Game state** has exactly one **Candidate set**; the **Decision tree** assigns it exactly one **Guess**.
- A **Guess** splits a **Candidate set** into groups, one per **Feedback pattern**.
- Every **Answer** has exactly one **Path** through the **Decision tree**.
- A **Run** has 5 **Rounds**; each **Round** draws one **Eligible Game state**, and no state repeats within a Run.

## Example dialogue

> **Dev:** "If someone types CRANE, do we show the Path for it?"
> **Domain expert:** "Yes, CRANE is an Answer, so it has one Path. If they type a word that's only a valid Guess, it's not an Answer, so there's no Path."
