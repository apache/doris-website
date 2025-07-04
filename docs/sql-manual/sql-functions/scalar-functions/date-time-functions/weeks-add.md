---
{
    "title": "WEEKS_ADD",
    "language": "en"
}
---

## Description
This function is used to add (or subtract) a certain number of weeks from a specified date or time value.

## Syntax

```sql
WEEKS_ADD(<datetime_or_date_value>, <weeks_value>)
```

## Required parameters
| Parameter                  | Description                                                                                                                              |
|----------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `<datetime_or_date_value>` | `DATETIME` or `DATE` type date input value                                                                                               |
| `<weeks_value>`            | Integer, indicating the number of weeks to increase or decrease (positive number indicates increase, negative number indicates decrease) |
  

## example


1. Add one week to the time `2020-02-02 02:02:02`
    ```sql
    select weeks_add("2020-02-02 02:02:02", 1);
    ```
    ```text
      +-------------------------------------+
      | weeks_add('2020-02-02 02:02:02', 1) |
      +-------------------------------------+
      | 2020-02-09 02:02:02                 |
      +-------------------------------------+
    ```

2. Subtract one week from the time `2020-02-02 02:02:02`
    ```sql
    select weeks_add("2020-02-02 02:02:02", -1);
    ```
    ```text
    +-------------------------------------------------------------+
    | weeks_add(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), -1) |
    +-------------------------------------------------------------+
    | 2020-01-26 02:02:02                                         |
    +-------------------------------------------------------------+
    ```

3. Add one week to the date `2020-02-02`
    ```sql
    select weeks_add("2020-02-02", 1);
    ```
    ```text
    +--------------------------------------------+
    | weeks_add(cast('2020-02-02' as DATEV2), 1) |
    +--------------------------------------------+
    | 2020-02-09                                 |
    +--------------------------------------------+
    ```


