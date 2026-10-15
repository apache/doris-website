# Doris {{VERSION}} user-doc audit report ({{SOURCE_LABEL}})

Range: `apache/doris` `{{FROM_REF}}..{{TO_REF}}`, **N** commits (M touching production code, K
test/CI only). Scope of this round: {{Chinese 4.x only | Chinese 4.x + English 4.x + dev}}. Master SHA
used for the dev comparison: `{{MASTER_SHA}}`.

Method: `surface-diff.sh` for the hard user-facing surface -> `split-commits.sh` into batches -> N
subagents classifying every commit -> `check-version-claims.py` / `compare-refs.py` for facts -> doc
edits -> `validate-docs.py`.

---

## 1. Documentation changes made

### 1.1 Syntax and interfaces added or removed
| Change | commit | Doc change |
| --- | --- | --- |

### 1.2 Lakehouse
### 1.3 Load / streaming jobs
### 1.4 Configs and session variables
### 1.5 Other
### 1.6 Deliberately not written (reason: unreleased / no open-source implementation / user decision)

---

## 2. Needs your decision

### A. Chinese pages written, awaiting sidebar entry + English
### B. Changes with no obvious home (suggested location / whether to create a page)
### C. Product decisions (publish or not)
### D. Errors found in existing docs unrelated to this release

---

## 3. Deliberately skipped
- Internal refactors / logging / optimizations (about N commits)
- Correctness fixes better suited to the release notes than to user docs
