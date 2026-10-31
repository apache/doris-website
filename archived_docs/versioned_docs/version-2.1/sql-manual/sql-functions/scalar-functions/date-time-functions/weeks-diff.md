---
{
    "title": "WEEKS_DIFF",
    "language": "en",
    "description": "Calculates the number of complete weeks (in 7-day units) between two date or time values."
}
---

## Description
Calculates the number of complete weeks (in 7-day units) between two date or time values.

## Syntax

```sql
WEEKS_DIFF(<end_date>, <start_date>)
```

## Required parameters
| Parameter Name | Data Type            | Description                 |
|---------------|----------------------|-----------------------------|
| `end_date`    | `DATE`, `DATETIME`   | Later date or date-time     |
| `start_date`  | `DATE`, `DATETIME`   | Earlier date or date-time   |


## Example

1. How many weeks are there between `2020-12-25` and `2020-10-25`
    ```sql
    select weeks_diff('2020-12-25','2020-10-25');
    ```
    ```text
    +----------------------------------------------------------+
    | weeks_diff('2020-12-25 00:00:00', '2020-10-25 00:00:00') |
    +----------------------------------------------------------+
    |                                                        8 |
    +----------------------------------------------------------+
    ```

2. How many weeks are there between `2020-12-25 10:10:02` and `2020-10-25 12:10:02`
    ```sql
    select weeks_diff('2020-12-25 10:10:02','2020-10-25 12:10:02');
    ```
    ```text
    +--------------------------------------------------------------------------------------------------------+
    | weeks_diff(cast('2020-12-25 10:10:02' as DATETIMEV2(0)), cast('2020-10-25 12:10:02' as DATETIMEV2(0))) |
    +--------------------------------------------------------------------------------------------------------+
    |                                                                                                      8 |
    +--------------------------------------------------------------------------------------------------------+
    ```

3. How many weeks are there between `2020-12-25 10:10:02` and `2020-10-25`
    ```sql
    select weeks_diff('2020-12-25 10:10:02','2020-10-25');
    ```
    ```text
    +----------------------------------------------------------------------------------------+
    | weeks_diff(cast('2020-12-25 10:10:02' as DATETIMEV2(0)), cast('2020-10-25' as DATEV2)) |
    +----------------------------------------------------------------------------------------+
    |                                                                                      8 |
    +----------------------------------------------------------------------------------------+
    ```