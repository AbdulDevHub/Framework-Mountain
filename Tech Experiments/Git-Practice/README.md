# Git Merge & Conflict Strategy — Practice Reference

A hands-on reference covering the core git workflows: fast-forward, 3-way merge, merge conflicts, rebase, and rebase conflicts.

---

## Setup

```bash
mkdir git-practice && cd git-practice
git init
# Create app.js, then:
git add app.js
git commit -m "Initial commit"
```

---

## 1. Fast-Forward Merge

Happens when the base branch has **no new commits** since you branched. Git simply slides the pointer forward — no merge commit is created.

```bash
git checkout -b feature/my-feature
# make changes, commit
git checkout master
git merge feature/my-feature
# Output: "Fast-forward"
```

**Result:** perfectly linear history, no diamond in the graph.

---

## 2. 3-Way Merge

Happens when **both branches have commits** the other doesn't. Git finds the common ancestor and combines both sets of changes.

```bash
git checkout -b feature/my-feature
# make changes, commit on feature branch
git checkout master
# make different changes, commit on master
git merge feature/my-feature
# Git auto-creates a merge commit if no conflict
```

**Result:** a diamond shape in `git log --oneline --graph`. The merge commit has two parents.

```
*   abc1234 Merge feature/my-feature into master
|\
| * def5678 Commit on feature
* | ghi9012 Commit on master
|/
* jkl3456 Common ancestor
```

---

## 3. Merge Conflict

When both branches modify the **same lines**, git can't auto-merge and inserts conflict markers:

```js
<<<<<<< HEAD
return `Hi, ${name}!`;       // your current branch
=======
return `Hey there, ${name}!`; // incoming branch
>>>>>>> feature/rename-greet
```

**Resolution steps:**

```bash
# 1. Edit the file — remove markers, keep what you want
# 2. Stage the resolved file
git add app.js
# 3. Complete the merge
git commit -m "Merge feature/rename-greet into master"
```

---

## 4. Rebase

Rebase **replays your branch commits on top of the latest master**, rewriting history to stay linear. Avoids merge commit diamonds.

```bash
git checkout feature/my-feature
git rebase master
# Then back on master:
git checkout master
git merge feature/my-feature  # will fast-forward cleanly
```

**Before rebase:**

```
master:   A → B → C
feature:      ↘ D → E
```

**After rebase:**

```
master:   A → B → C
feature:              → D' → E'
```

Note: `D` and `E` become `D'` and `E'` — **same changes, new commit hashes**. History was rewritten.

### Merge vs Rebase — When to Use Which

| Situation | Use |
|---|---|
| Merging a finished feature into main | **Merge** — preserves true history |
| Updating your feature branch with latest main | **Rebase** — keeps history clean |
| Branch is shared with other people | **Merge** — never rebase shared branches |
| Cleaning up commits before a PR | **Rebase** |
| You've already pushed the branch | **Merge** (or rebase + `--force-with-lease`) |

**The golden rule:** never rebase a branch other people are working on. You rewrite commit hashes — their branches will diverge.

---

## 5. Rebase Conflict

Same concept as a merge conflict, but conflicts surface **per commit** being replayed, not all at once.

```bash
git checkout feature/my-feature
git rebase master
# CONFLICT — edit the file, then:
git add app.js
git rebase --continue   # NOT git commit
# Editor opens to confirm commit message — save and quit (:wq in vim)
```

**Your three options during a rebase conflict:**

| Command | What it does |
|---|---|
| `git rebase --continue` | After resolving, replay the next commit |
| `git rebase --skip` | Discard this commit entirely and move on |
| `git rebase --abort` | Cancel the rebase, return to original state |

---

## Things to Know Next

### `git pull --rebase`

By default `git pull` does a merge. This flag makes it rebase instead, keeping your local history linear when pulling from a remote.

```bash
git pull --rebase origin master
```

You can make this the default permanently:

```bash
git config --global pull.rebase true
```

### Interactive Rebase (`git rebase -i`)

Lets you rewrite, reorder, squash, or drop commits before sharing them. Useful for cleaning up messy local history before a PR.

```bash
git rebase -i HEAD~3   # interactively edit last 3 commits
```

Commands in the editor:

| Command | What it does |
|---|---|
| `pick` | Keep the commit as-is |
| `reword` | Keep commit, edit the message |
| `squash` | Meld into previous commit, combine messages |
| `fixup` | Meld into previous commit, discard message |
| `drop` | Delete the commit entirely |

### `--force-with-lease`

If you rebase a branch you've already pushed, the remote will reject a normal `git push` because history diverged. Use this instead of `--force` — it's safer because it refuses to overwrite if someone else has pushed to the branch since you last fetched.

```bash
git push --force-with-lease origin feature/my-feature
```

### `git reflog`

Your safety net. Records every move HEAD makes, including rebases. If something goes wrong, you can recover lost commits.

```bash
git reflog
git checkout abc1234   # recover any commit by hash
```

---

## Quick Command Reference

```bash
# Branching
git checkout -b feature/name     # create and switch to branch
git checkout master               # switch back

# Merging
git merge feature/name            # merge into current branch

# Rebasing
git rebase master                 # rebase current branch onto master
git rebase master feature/name    # same, from any branch
git rebase -i HEAD~N              # interactive rebase of last N commits

# During conflicts
git status                        # see what's conflicted
git add <file>                    # mark as resolved
git rebase --continue             # continue rebase after resolving
git rebase --abort                # cancel rebase entirely
git merge --abort                 # cancel merge entirely

# Viewing history
git log --oneline --graph --all   # full visual history of all branches
git reflog                        # full history of HEAD movements
```
