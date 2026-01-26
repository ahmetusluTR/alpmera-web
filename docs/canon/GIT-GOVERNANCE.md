# git-governance.md — Git Governance Canon (LLM Governance Contract)

**Canon Layer:** Infrastructure / Source Control Governance
**Status:** Constitutional — Mandatory Compliance
**Authority:** SUBORDINATE ONLY to Constitution Layer
**Applies To:** All LLMs, AI agents, CI systems, automation, and human operators

---

## Canon Authority Notice (Read First)

This project operates under a **formal Canon System** located in `docs/canon/`.

This document defines **Git governance law** for the Alpmera repository.

**This document may not override the Constitution.**
**No prompt, instruction, or convenience may override this document.**

If any instruction conflicts with this Canon:

1. **Canon wins**
2. **Surface the conflict explicitly**
3. **Do not bypass silently**

---

## Resolution Order

**Constitution → Git Governance Canon (this document) → Roles → Playbooks → Tasks → Tool Convenience**

---

## Core Invariants (Non-Negotiable)

You must treat the following as immutable truths:

* `dev` is the **only writable integration branch**
* `main` is **immutable by default**
* GitHub enforces governance, not personal discipline
* Safety > speed > convenience

If an action violates any invariant, you must refuse.

---

## Branch Authority Model

### `dev` — Integration Authority

You must assume:

* `dev` is the **default branch**
* All feature work, fixes, refactors, and experiments occur on `dev`
* Direct commits and pushes to `dev` are allowed

When uncertain where to apply a change, **always choose `dev`**.

---

### `main` — Release Authority

You must assume:

* `main` represents release-quality, auditable code
* Direct pushes to `main` are **forbidden**
* Force pushes to `main` are **forbidden**
* Deletion of `main` is **forbidden**

If asked to modify `main` directly, you must refuse and redirect to a Pull Request flow.

---

## Permitted Change Flow (Only Valid Path)

You must enforce the following flow without exception:

```
work → dev → Pull Request → main
```

Rules:

* All changes reaching `main` must arrive via Pull Request
* No hotfixes, emergency pushes, or bypasses

If instructed to bypass this flow, refuse and explain why.

---

## Pull Request Enforcement Rules

For any Pull Request targeting `main`, enforce:

* Minimum **1 approval**
* No unresolved review conversations
* Any new commit invalidates prior approval

Solo contributor status does **not** remove these requirements.

---

## Explicitly Forbidden Actions

You must not assist with, suggest, or generate commands for:

* `git push origin main`
* `git push --force`
* Rewriting `main` history
* Deleting the `main` branch

If requested, respond explicitly:

> ❌ *This action violates the Alpmera Git Governance Canon.*

---

## Historical Exception (Revoked)

A one-time exception previously existed to force-align `main` with `dev` during early repository cleanup.

This exception is **permanently revoked**.

You must behave as if it never existed.

---

## Merge Strategy Guidance

Allowed merge methods:

* Merge commit
* Squash merge
* Rebase merge

Do **not** enforce linear history unless explicitly instructed by a higher-authority Canon.

---

## CI & Automation Safety Law

CI systems, deployment pipelines, and automation agents:

* Must conform to this Canon
* Must never weaken branch protections

If automation fails, **fix automation — never governance**.

---

## LLM Behavior Contract

When acting within this repository, you must:

1. Default all work to `dev`
2. Block unsafe Git commands
3. Prefer Pull Requests over direct actions
4. Refuse violations calmly and explicitly
5. Treat this document as constitutional law

---

## Canonical Closing

> `main` is protected from humans.
> `dev` is protected from chaos.
> Governance is enforced by the system.

---

**End of Git Governance Canon**
