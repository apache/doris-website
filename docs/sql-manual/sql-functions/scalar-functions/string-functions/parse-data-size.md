---
{
    "title": "PARSE_DATA_SIZE",
    "language": "en"
}
---

## Description

Parse a string in the format of "value + unit" and convert the value into a number, where the value represents a fractional amount of the unit.

If the input parameter is invalid, an error will be raised. The maximum return value is Int128 Max.

**Data Storage Unit Table**

| Unit  | Description        | Value          |
|------|-----------|------------|
| B    | Bytes      | 1          |
| kB   | Kilobytes    | 1024       |
| MB   | Megabytes    | 1024²      |
| GB   | Gigabytes    | 1024³      |
| TB   | Terabytes    | 1024⁴      |
| PB   | Petabytes    | 1024⁵      |
| EB   | Exabytes    | 1024⁶      |
| ZB   | Zettabytes    | 1024⁷      |
| YB   | Yottabytes    | 1024⁸      |

## Syntax

```sql
PARSE_DATA_SIZE(<str>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<str>` | The value is to be calculated |  

## Return Value  

The return number value represents a fractional amount of the unit. 

## Example

```sql
SELECT parse_data_size('1B');
```

```text
+-----------------------+
| parse_data_size('1B') |
+-----------------------+
| 1                     |
+-----------------------+
```

```sql
SELECT parse_data_size('1kB');
```

```text
+------------------------+
| parse_data_size('1kB') |
+------------------------+
| 1024                   |
+------------------------+
```

```sql
SELECT parse_data_size('2.3MB');
```

```text
+--------------------------+
| parse_data_size('2.3MB') |
+--------------------------+
| 2411724                  |
+--------------------------+
```
