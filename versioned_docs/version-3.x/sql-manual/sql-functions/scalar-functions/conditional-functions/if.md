---
{
    "title": "IF",
    "language": "en",
    "description": "Returns valueTrue when the condition is true, and returns valueFalseOrNull otherwise."
}
---

## Description

Returns `valueTrue` when the condition is true, and returns `valueFalseOrNull` otherwise. The return type is determined by the result of the `valueTrue`/`valueFalseOrNull` expression.

## Syntax

```sql
IF(<condition>, <value_true>, <value_false_or_null>)
```

## Parameters

| Parameter               | Description                                                  |
|-------------------------|--------------------------------------------------------------|
| `<condition>`           | The boolean condition to evaluate.                           |
| `<value_true>`          | The value to return if `<condition>` evaluates to true.      |
| `<value_false_or_null>` | The value to return if `<condition>` evaluates to false.     |

## Return Value

The result of the IF expression:
- Returns `valueTrue` when the condition is true.
- Returns `valueFalseOrNull` when the condition is false.

## Examples

```sql
SELECT user_id, IF(user_id = 1, 'true', 'false') AS test_if FROM test;
```

```text
+---------+---------+
| user_id | test_if |
+---------+---------+
| 1       | true    |
| 2       | false   |
+---------+---------+
```