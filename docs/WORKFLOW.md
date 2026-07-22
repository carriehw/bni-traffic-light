# Workflow

## LT monthly upload

1. Select the Excel file.
2. System reads the first worksheet and detects the report month from the filename.
3. System checks required columns, duplicate member names and score consistency warnings.
4. LT reviews filename, month, member count and preview.
5. System determines the action:
   - newer month: publish as latest;
   - older month: add to history only;
   - existing month: replace that month after confirmation.
6. LT confirms publication.
7. Backend stores the original file, batch record and member records.
8. History is sorted by `period_end` descending.
9. Latest month is always the greatest `period_end`.

## Wrong file handling

Before publication:
- select another file or cancel upload;
- no official records are changed.

After publication:
- upload the correct file for the same month;
- use the replace action;
- only that month is replaced;
- all other months remain unchanged.

## Member trend review

1. Open LT Management.
2. Select a member.
3. Review latest score, previous-month change, full-period change and number of recorded months.
4. Review monthly score cards and seven category cards.
5. Open the detailed data table only when exact month-by-month values are required.

## Release workflow

1. Define the problem and acceptance criteria.
2. Review scoring and data implications.
3. Update documentation.
4. Implement on GitHub.
5. Confirm Vercel deployment.
6. Test member login, LT login, upload preview, historical upload, replacement, member detail and mobile layout.
7. Record the release in `DECISION_LOG.md`.

## Required regression checks

- Excel score remains unchanged.
- Light colour matches Excel.
- Older report does not become latest.
- Same-month replacement does not affect other months.
- Precise suggestions are shown only when raw metrics exist.
- Mobile trend view does not require horizontal scrolling for normal use.
- Detailed table remains accessible and keeps month and total columns visible while scrolling.
