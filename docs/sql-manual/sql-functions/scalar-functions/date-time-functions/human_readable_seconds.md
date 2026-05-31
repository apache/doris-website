---

{
"title": "HUMAN_READABLE_SECONDS",
"language": "en"
}

---

## Description

Converts a number of seconds into a human-readable duration string using weeks, days, hours, minutes, and seconds.

Behavior matches Presto/Trino semantics:

* values are rounded to whole seconds
* negative values use their absolute value
* milliseconds are not emitted
* `NaN` and `Infinity` inputs are rejected

## Syntax

```sql
HUMAN_READABLE_SECONDS(<x>)
```

## Parameters

| Parameter | Description                                                                |
| --------- | -------------------------------------------------------------------------- |
| `<x>`     | The number of seconds to format (numeric input, internally cast to DOUBLE) |

## Return Value

Returns a `VARCHAR` string representing the formatted duration.

## Special Cases

* When `<x>` is `NULL`, returns `NULL`
* Fractional values are rounded to the nearest whole second
* Negative values are converted using absolute value
* `NaN` and `Infinity` values return an error

## Examples

```sql
select human_readable_seconds(3661);
```

```text
+------------------------------+
| human_readable_seconds(3661) |
+------------------------------+
| 1 hour, 1 minute, 1 second   |
+------------------------------+
```

```sql
select human_readable_seconds(475.33);
```

```text
+--------------------------------+
| human_readable_seconds(475.33) |
+--------------------------------+
| 7 minutes, 55 seconds          |
+--------------------------------+
```

```sql
select human_readable_seconds(0.9);
```

```text
+-----------------------------+
| human_readable_seconds(0.9) |
+-----------------------------+
| 1 second                    |
+-----------------------------+
```

```sql
select human_readable_seconds(-96);
```

```text
+------------------------------+
| human_readable_seconds(-96)  |
+------------------------------+
| 1 minute, 36 seconds         |
+------------------------------+
```

```sql
select human_readable_seconds(56363463);
```

```text
+----------------------------------+
| human_readable_seconds(56363463) |
+----------------------------------+
| 93 weeks, 1 day, 8 hours, 31 minutes, 3 seconds |
+----------------------------------+
```

```sql
select human_readable_seconds(NULL);
```

```text
+------------------------------+
| human_readable_seconds(NULL) |
+------------------------------+
| NULL                         |
+------------------------------+
```
