---
name: tech-gate-delivery
description: >-
  End-to-end delivery from a tech gate doc: create GitHub Project + issues,
  then for each issue plan (tests + N+1), security review, implement via Cursor
  in a PR, review/fix PR, merge to main. Use when the human pastes or attaches
  a tech gate and says to work the project / deliver the gate / "trabaja en este
  proyecto".
---

# Tech gate → Project → Issues → Plan → PR → Merge

When the human provides a **tech gate** (doc, paste, file, or link) and asks to
work the project / deliver it / “trabaja en este proyecto” (or similar), run
this skill **end-to-end** without waiting for per-step confirmation unless a
hard blocker appears (missing repo access, failing required checks you cannot
fix, ambiguous product choice that changes scope).

**Orchestration:** OpenClaw (Chuck) drives the loop and Slack updates.  
**Heavy work:** Cursor via `/home/chucky/.local/bin/oc-agent` on **chucky**
(`exec host=gateway`).  
**GitHub:** `/usr/bin/gh` on chucky. Prefer `oc-agent` for issue body quality,
plans, code, and PR review text; use `gh` for project/issue/PR mutations.

**Default tech-gate target:** **`#dhaliora` / `jacr1102/digital-message-platform`**.  
Default base branch: **`master`** for Dhaliora (use `main` only if that is the repo default).

**Do NOT run tech-gate delivery against `jacr1102/mcsai`** unless the human **explicitly** names mcsai / `#mc-sai` for that run.  
Normal bug/PR work still follows the channel map (`#mc-sai` → mcsai, `#dhaliora` → digital-message-platform).

---

## Trigger phrases (examples)

- “Trabaja en este proyecto” + tech gate
- “Ejecuta este tech gate”
- “Crea el project, las issues y ve implementando”
- “Deliver this tech gate”

If a tech gate is attached/pasted **without** an explicit short phrase but the
intent is clearly full delivery, still run this skill.

---

## Global rules

1. **One issue at a time** after the project/issues bootstrap. Do not open
   parallel implementation PRs unless the human asks.
2. **Never invent** issue lists — derive every issue from the tech gate.
3. Every implementation must include **tests** and explicitly avoid **N+1**
   (queries, API calls, or chatty loops). Call this out in the plan and PR.
4. **Security review** before coding and again on the PR (authz, injection,
   secrets, IDOR, unsafe defaults, etc.).
5. Prefer small vertical slices: one issue → one branch → one PR → merge → next.
6. Keep Slack updates short: phase + issue number + link. No walls of text.
7. Track progress in `memory/tech-gate-<slug>.md` (create if needed).
8. Ask first only for: deleting the GitHub Project, force-push, skipping tests,
   merging with failing required checks, or changing the target repo/org.
9. When this skill is active, **creating issues, PRs, and merging to main after
   green review are authorized** — do not re-ask for merge permission per PR
   unless checks fail or review finds a blocker.

---

## Phase 0 — Intake

1. Save/normalize the tech gate into the workspace, e.g.
   `memory/tech-gates/<slug>.md` (or keep the human’s file path).
2. Confirm target **`owner/repo`** (default **`jacr1102/digital-message-platform`** / `#dhaliora`).  
   Only use `jacr1102/mcsai` if the human explicitly requested mcsai for this tech gate.
3. Confirm project title (from tech gate title / product name).
4. Post a 3–5 line Slack kickoff: repo, project name, issue count estimate,
   that you will bootstrap Project+issues then implement sequentially.

---

## Phase 1 — GitHub Project (create if missing)

Use `gh` on gateway:

1. List projects for the owner/repo (user or org projects linked to the repo).
2. If a project with the intended title **already exists**, reuse it.
3. If missing, create it (Projects v2), e.g.:

```bash
gh project create --owner OWNER --title "PROJECT_TITLE" --format json
```

4. Link/add the repo to the project if required by `gh` version.
5. Record `project_id` / number / URL in the progress file.

If `gh project` needs an extra scope, tell the human the exact
`gh auth refresh -s …` command once — then continue when fixed.

---

## Phase 2 — Issues from the tech gate

1. With **`oc-agent`**, break the tech gate into a complete issue backlog:
   - title
   - body (acceptance criteria, scope, out-of-scope, test notes, N+1 risks)
   - labels if obvious (`enhancement`, `bug`, `security`, etc.)
2. Deduplicate against existing open issues (`gh issue list`).
3. Create each missing issue with `gh issue create`.
4. Add every issue to the GitHub Project (`gh project item-add …`).
5. Order the backlog for delivery (dependencies first). Write the ordered list
   into `memory/tech-gate-<slug>.md`.
6. Slack: “Created N issues in Project X” + link to project.

Do **not** start coding until Phase 2 is complete.

---

## Phase 3 — Per-issue loop (repeat until backlog done)

For **each** issue in order:

### 3A — Implementation plan (Cursor)

Run `oc-agent` against a clone/workdir of the repo (clone under
`/home/chucky/.openclaw/workspace/repos/<repo>` if needed):

Produce a plan that includes:

- Approach and files likely touched
- **Tests** to add/update (unit / integration as fits the repo)
- **N+1** risks and how they will be avoided
- Rollout / migration notes if any
- Explicit **non-goals**

Save plan to `memory/tech-gate-<slug>/issue-<n>-plan.md`.

### 3B — Plan review (security + quality)

Second `oc-agent` pass (or structured self-review) on the plan:

- Security: authn/authz, injection, SSRF, secrets, mass assignment, IDOR, PII
- Correctness / edge cases
- Test gaps
- N+1 / performance

Revise the plan until no **blocker** remains. Note residual risks in the plan
file. Slack: “Plan ready for #N” (one short message).

### 3C — Implement in a PR (Cursor)

1. Branch from latest main: `tech-gate/<issue-n>-short-slug` (or repo convention).
2. Implement with `oc-agent` following the plan.
3. Run the repo’s test commands (`dotnet test`, `npm test`, etc. — detect from repo).
4. Commit with a clear message; push; open PR with `gh pr create`:
   - body links the issue (`Fixes #N` / `Closes #N` when appropriate)
   - summarizes plan, tests, N+1 mitigations, security notes
5. Slack: PR URL.

### 3D — Review the PR and fix

1. `gh pr checks` / `gh pr view` / diff via `gh` + `oc-agent` review.
2. Review for: bugs, missing tests, N+1, security, style mismatches with repo.
3. If problems: push fixes on the same branch; re-check.
4. Repeat until review is clean **and** required checks are green (or only
   known flaky checks the human already accepts — otherwise stop and ask).

### 3E — Merge to main

```bash
gh pr merge <N> --merge   # or --squash if that is the repo default
```

Prefer the repo’s default merge method (`gh repo view` / existing PRs).  
Delete branch if that is normal for the repo.  
Update project item status to Done if the project has status fields.  
Slack: “Merged #N / PR … — next issue …”

Then continue with the **next** issue (back to 3A).

---

## Phase 4 — Completion

When all issues are merged (or explicitly deferred with reason):

1. Post a final Slack summary: project URL, issue count, PRs merged, leftovers.
2. Update `memory/tech-gate-<slug>.md` with status `done` and date.
3. Stop. Do not invent extra scope beyond the tech gate.

---

## Tool cheat-sheet (chucky)

```bash
# GitHub
/usr/bin/gh issue list --repo OWNER/REPO
/usr/bin/gh issue create --repo OWNER/REPO --title "…" --body "…"
/usr/bin/gh project create --owner OWNER --title "…"
/usr/bin/gh project item-add <number> --owner OWNER --url <issue-url>
/usr/bin/gh pr create …
/usr/bin/gh pr merge …

# Cursor (coding / plans / reviews)
/home/chucky/.local/bin/oc-agent -p --approve-mcps --trust --force "…"
```

Always `exec host=gateway`, absolute paths, workdir
`/home/chucky/.openclaw/workspace` (or the repo clone path for coding).

---

## Failure handling

| Problem | Action |
|---------|--------|
| `gh` auth/scope missing | One Slack message with exact fix command; pause skill |
| Tests fail | Fix in PR; do not merge red |
| Security blocker | Fix before merge; escalate only if product decision needed |
| Issue unclear in tech gate | Make a reasonable assumption, document in issue body; only ask if scope forks |
| Mid-loop crash | Resume from `memory/tech-gate-<slug>.md` (next incomplete issue) |

---

## Anti-patterns

- Skipping Project creation when the human asked for a project
- Creating issues without linking them to the Project
- Implementing multiple issues in one PR
- Merging without tests when the repo has a test suite
- Ignoring N+1 in data-heavy endpoints
- Using OpenAI alone to write large code changes instead of `oc-agent`
- Using disconnected `host=node` / `~` paths
