# Scoring and Recommendation Engine

## Authority

The uploaded Excel is the sole authority for official category scores, total score and traffic-light colour. The website displays those values and does not recalculate them.

## Traffic-light ranges

- Green: 70–100
- Yellow: 50–69
- Red: 30–49
- Black: 0–29

75 points is a recommended safety target, not the official green-light threshold.

## Raw metrics

Where available:

`Week = P + A + L + M + S`

- G: referrals
- V: visitors
- 1-2-1: one-to-one meetings
- T: training
- Biz Give: business given

## Precise next-level calculations

### Referrals

Thresholds by `G / Week`:

- below 0.75: 0
- 0.75 to below 1.0: 5
- 1.0 to below 1.2: 10
- 1.2 to below 1.5: 15
- 1.5 or above: 20

Required cumulative referrals for the next level:

`ceil(next rate × Week)`

Required additional referrals:

`target cumulative referrals − current G`

### Visitors

Thresholds by `V / Week`:

- below 0.1: 0
- 0.1 to below 0.25: 5
- 0.25 to below 0.5: 10
- 0.5 to below 0.75: 15
- 0.75 or above: 20

Required cumulative visitors for the next level:

`ceil(next rate × Week)`

A five-point gap never means five visitors. The additional visitor count depends on current V and Week.

### 1-2-1

- 0.5 or below per Week: 0
- above 0.5 and below 1.0: 5
- 1.0 or above: 10

Five-point minimum:

`floor(0.5 × Week) + 1`

Ten-point minimum:

`ceil(1.0 × Week)`

### Training

- 0 sessions: 0
- 1 session: 5
- 2 or more sessions: 10

### Biz Give

- below HK$100,000: 0
- HK$100,000 to below HK$200,000: 5
- HK$200,000 to below HK$500,000: 10
- HK$500,000 or above: 15

Required increase:

`next monetary threshold − current Biz Give`

### Attendance and punctuality

These depend on six-month rolling absence and lateness records. The platform must not promise that one additional attendance or punctual arrival immediately adds points. Without event dates, recommendations should describe maintaining attendance or punctuality until older adverse records leave the rolling period.

## Recommendation output

Each precise recommendation should state:

- current raw value;
- current official score;
- additional action required;
- target raw value;
- target category score;
- score gain;
- projected total score.

If required raw fields are missing, show an explicit insufficient-data message and do not estimate.
