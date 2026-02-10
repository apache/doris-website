---
{
    "title": "ARRAY_RANGE",
    "language": "en",
    "description": "Generate an arithmetic sequence array of numbers or datetimes."
}
---

## Function

Generate an arithmetic sequence array of numbers or datetimes.
- For numeric types, the default step is 1
- For datetime types, the default step is 1 day

## Syntax

- `ARRAY_RANGE(end)`
- `ARRAY_RANGE(start, end)`
- `ARRAY_RANGE(start, end, step)`
- `ARRAY_RANGE(start_dt, end_dt)`
- `ARRAY_RANGE(start_dt, end_dt, interval step unit)`

## Parameters

- `start`, `end`: non-negative integers. `end` is the upper bound and is excluded from the result.
- `step`: must be a positive integer; the step length; default is 1.
- `start_dt`, `end_dt`: DATETIME. In the two-argument form, the default step is 1 DAY.
- `interval step unit`: datetime step. `unit` can be `YEAR|QUARTER|MONTH|WEEK|DAY|HOUR|MINUTE|SECOND`; `step` must be a positive integer.

## Return value

- Returns `ARRAY<T>`; returns `NULL` for illegal arguments; returns an empty array `[]` for an empty range.
- The element type `T` matches the input: integers produce `INT`, datetimes produce `DATETIME`.

## Usage notes

- Numeric sequence: start from `start`, increment by `step`, up to but excluding `end` (left-closed, right-open).
- Datetime sequence: start from `start_dt`, increment by `step` in the given `unit`, up to but excluding `end_dt`; the two-argument form is equivalent to `interval 1 day`.
- Illegal arguments return `NULL`:
  - Numeric: `start < 0`, `end < 0`, `step <= 0`.
  - Datetime: `start_dt` or `end_dt` invalid, or `step <= 0`.
- `ARRAY_RANGE` and `SEQUENCE` are equivalent.

## Examples

- Numeric: `start` defaults to 0, `step` defaults to 1
  - `ARRAY_RANGE(5)` -> `[0, 1, 2, 3, 4]`
  - `ARRAY_RANGE(0, 5)` -> `[0, 1, 2, 3, 4]`

- Numeric: `end` is the upper bound and is not included in the result.
  - `ARRAY_RANGE(2, 6, 2)` -> `[2, 4]`
  - `ARRAY_RANGE(3, 3)` -> `[]`

- Numeric: `end` must be greater than or equal to `start`, otherwise returns `[]`
   - `ARRAY_RANGE(3, 2)` -> `[]`

- Numeric: `start`, `end` must be non-negative integers, and `step` must be greater than 0.
  - `ARRAY_RANGE(-1, 3)` -> `NULL`
  - `ARRAY_RANGE(1, 3, 0)` -> `NULL`

- Datetime: `step` defaults to 1 day.
  - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-17 12:00:00')` -> `['2022-05-15 12:00:00', '2022-05-16 12:00:00']`
  - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-17 12:00:00', interval 1 day)` -> `['2022-05-15 12:00:00', '2022-05-16 12:00:00']`

- Datetime: `unit` can be `YEAR|QUARTER|MONTH|WEEK|DAY|HOUR|MINUTE|SECOND`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2024-05-17 12:00:00', interval 1 year)` -> `["2022-05-15 12:00:00", "2023-05-15 12:00:00"]`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2023-05-17 12:00:00', interval 1 quarter);` -> `["2022-05-15 12:00:00", "2022-08-15 12:00:00", "2022-11-15 12:00:00", "2023-02-15 12:00:00"] `
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-07-17 12:00:00', interval 1 month);` -> `["2022-05-15 12:00:00", "2022-06-15 12:00:00"]`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-17 12:00:00', interval 1 day)` -> `['2022-05-15 12:00:00', '2022-05-16 12:00:00']`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-15 14:00:00', interval 1 hour)` -> `["2022-05-15 12:00:00", "2022-05-15 13:00:00"]`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-15 12:02:00', interval 1 minute)` -> `["2022-05-15 12:00:00", "2022-05-15 12:01:00"]`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-15 12:00:02', interval 1 second)` -> `["2022-05-15 12:00:00", "2022-05-15 12:00:01"]`

