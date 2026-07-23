# Decision Log

## 2026-07-23 — Excel remains the scoring authority

**Decision:** The website displays the scores and light colour stored in Excel and must not replace them with website calculations.

**Reason:** Avoid disagreement between the official Traffic Light report and the platform.

## 2026-07-23 — Recommendations use raw metrics

**Decision:** Precise recommendations calculate the next threshold from Week and raw metrics. A score gap is never treated as an equivalent number of activities.

**Reason:** For example, five more score points in Visitors does not mean five more visitors.

## 2026-07-23 — Report order follows period date

**Decision:** The latest report is the report with the greatest `period_end`, regardless of upload order.

**Reason:** Backfilled historical reports must not become the current month.

## 2026-07-23 — Same-month reports are replaced, not duplicated

**Decision:** LT can replace an existing month after explicit confirmation. Other months remain unchanged.

**Reason:** Correct accidental or revised Excel uploads safely.

## 2026-07-23 — LT trends use cards before tables

**Decision:** The default LT member-trend view uses summary cards, monthly cards and category cards. The full table is collapsed as a secondary detail view.

**Reason:** The original ten-column table was difficult to read, particularly on mobile and narrower desktop screens.

## 2026-07-23 — Documentation-first maintenance

**Decision:** Scoring rules, workflow and interface decisions are stored under `/docs` and updated with meaningful releases.

**Reason:** Allow future LT teams and developers to understand and maintain the platform without relying on chat history.

## 2026-07-23 — Data accuracy and presentation clarity take priority

**Decision:** Every interface change must protect the original Excel values and make it visually obvious whether a number is official historical data or an advisory projection.

**Rules:**
- Official totals, category scores, light colours, period dates and member names come from the published Excel record.
- Charts and cards may reorganise official data, but may not recalculate or smooth it.
- Improvement recommendations and projected totals must be labelled as advisory and must never appear inside the official trend table.
- The complete official table remains available for audit and cross-checking.
- No aesthetic simplification may hide a discrepancy, missing field or warning.

**Reason:** The platform is used for member performance review. A visually attractive but ambiguous number would be more harmful than a plain but traceable presentation.
