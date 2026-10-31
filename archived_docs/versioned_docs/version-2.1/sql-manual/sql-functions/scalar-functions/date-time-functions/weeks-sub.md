---
{
    "title": "WEEKS_SUB",
    "language": "en",
    "description": "Subtracts a specified number of weeks from a specified date or time value (i.e., subtracts weeks 7 days)."
}
---

## Description
Subtracts a specified number of weeks from a specified date or time value (i.e., subtracts weeks * 7 days).

## Syntax
```sql
WEEKS_SUB(<date_value>, <week_period>)
```

## Required parameters
| Parameter       | Description                                                                                         |
|-----------------|-----------------------------------------------------------------------------------------------------|
| `date_value`    | `DATE` or `DATETIME` type input value.                                                              |
| `week_period`   | Integer, representing the number of weeks to subtract (positive to decrease, negative to increase). |


## Example

1. Subtract one week from the datetime `2020-02-02 02:02:02`
    ```sql
    select weeks_sub("2020-02-02 02:02:02", 1);
    ```
    ```text
    +-------------------------------------+
    | weeks_sub('2020-02-02 02:02:02', 1) |
    +-------------------------------------+
    | 2020-01-26 02:02:02                 |
    +-------------------------------------+
    ```

2. Subtract one week from the date `2020-02-02`
    ```sql
    select weeks_sub("2020-02-02", 1);
    ```
    ```text
    +--------------------------------------------+
    | weeks_sub(cast('2020-02-02' as DATEV2), 1) |
    +--------------------------------------------+
    | 2020-01-26                                 |
    +--------------------------------------------+
    ```