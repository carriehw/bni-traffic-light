# Skill: Data-driven Performance Platform Delivery

## Purpose

Use this skill when building or maintaining a member／staff performance platform that:

- imports official Excel／CSV reports
- displays official scores
- calculates improvement recommendations
- supports admin upload／publish workflows
- generates individual PNG／PDF cards or batch downloads

This skill was created from the BNI BINGO Traffic Light Platform project and is designed to be reused for similar data-driven internal platforms.

## Mandatory Read Order

Before changing the BNI project, read:

1. `README.md`
2. `SCORING.md`
3. `WORKFLOW.md`
4. `PROJECT_HANDOFF.md`
5. `DECISION_LOG.md`
6. `QA_CHECKLIST.md`
7. Relevant production source files

Do not rely on previous chat memory when repository documentation is available.

## Non-negotiable Rules

1. Identify the official source of truth before coding.
2. Never overwrite official imported results with simulated or recalculated values unless explicitly approved.
3. Separate official scores, raw metrics, recommendations and projections.
4. Use one shared recommendation object for web view, individual card and batch export.
5. A projected total must equal the sum of every action visibly included in the plan.
6. Do not recommend categories already at maximum score.
7. Do not promise fixed gains for rolling or time-window metrics unless the official rule supports it.
8. Validate data before publish; do not defer known validation failures to backend errors.
9. Treat mobile admin workflow as a first-class use case.
10. Never claim end-to-end testing for actions that were only code-reviewed.

## Delivery Workflow

### Step 1: Write a Change Brief

Record:

- user role
- current problem
- expected behavior
- affected screens／data
- acceptance criteria
- regression risks

### Step 2: Inspect Production and Repository

- fetch current production entry
- confirm deployed version
- inspect existing modules and docs
- inspect backend contract if data or auth is affected
- identify legacy data aliases

### Step 3: Classify Risk

- P0 Data／Auth／Publish
- P0 Core download／member details
- P1 UI／responsive
- P2 enhancement

Use full regression for P0.

### Step 4: Define Data Contract

For every imported field define:

- canonical name
- official or raw
- required or optional
- aliases
- type
- validation rule
- fallback behavior

Create fixtures for normal and failure cases.

### Step 5: Implement One Source of Logic

Keep separate modules for:

- import／mapping
- validation
- official score display
- recommendation engine
- card renderer
- batch export

All outputs should consume the same normalized member object and recommendation plan.

### Step 6: Test Boundary Cases

Always test:

- maximum score
- one threshold below maximum
- near target
- far below target
- missing raw metrics
- legacy aliases
- long names／long recommendation text
- zero matching batch-export members
- invalid imported totals

### Step 7: Release

- update code
- update cache-bust version
- deploy preview or production
- fetch production entry and changed assets
- run QA checklist
- update documentation and decision log

### Step 8: Handover

Provide:

- production URL
- user instructions
- admin SOP
- known limitations
- owner／support route
- exact untested items, if any

## Recommendation Engine Pattern

A goal-oriented recommendation engine should:

1. calculate target gap
2. exclude completed／maximum categories
3. generate all reachable options per category
4. find combinations that meet the target
5. rank by overshoot, number of categories, effort and opportunity
6. display every selected action
7. separate alternatives from selected actions
8. show strengths and rolling-metric watchouts separately

## Upload Workflow Pattern

A safe upload journey should be:

1. select file
2. choose correct sheet
3. map official and raw fields separately
4. validate required fields
5. validate duplicate identities
6. validate component totals
7. confirm reporting period
8. preview records
9. identify latest／history／replace mode
10. publish
11. reload from backend
12. verify sample records and exports

## Failure Patterns to Avoid

- fuzzy matching that confuses raw and official fields
- UI steps that do not correspond to working functions
- hidden actions included in projected totals
- external dependencies referenced but not deployed
- repeated logic across page, PNG and ZIP
- production claims based only on successful commits
- desktop-first layouts with fixed minimum widths
- patching multiple overlay files without regression checks

## Definition of Done

A change is complete only when:

- acceptance criteria pass
- production assets contain the change
- official score integrity remains intact
- affected user journeys are tested
- responsive layout is checked
- downloads open correctly
- documentation is updated
- known limitations are stated honestly
