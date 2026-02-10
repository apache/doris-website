---
{
    "title": "PARSE_DATA_SIZE",
    "language": "en",
    "description": "The PARSEDATASIZE function parses a string with storage units (such as \"1.5GB\") and converts it to a numeric value in bytes."
}
---

## Description

The PARSE_DATA_SIZE function parses a string with storage units (such as "1.5GB") and converts it to a numeric value in bytes.

## Syntax

```sql
PARSE_DATA_SIZE(<str>)
```

## Parameters

| Parameter | Description |
| -------- | ----------------------------------------- |
| `<str>` | Data size string with unit (e.g., "100MB", "2.5GB"). Type: VARCHAR |

## Return Value

Returns BIGINT type, representing the numeric value converted to bytes.

Special cases:
- Supported units (case-insensitive): B, kB, MB, GB, TB, PB, EB, ZB, YB
- Units use base 1024 (e.g., 1kB = 1024B)
- Supports decimals (e.g., "2.5MB")
- If parameter format is invalid, returns error
- If parameter is NULL, returns NULL

**Supported Units Table:**

| Unit | Name | Bytes |
|------|------|-------|
| B    | Bytes      | 1          |
| kB   | Kilobytes  | 1024       |
| MB   | Megabytes  | 1024²      |
| GB   | Gigabytes  | 1024³      |
| TB   | Terabytes  | 1024⁴      |
| PB   | Petabytes  | 1024⁵      |
| EB   | Exabytes   | 1024⁶      |

## Examples

1. Basic usage: Parse bytes
```sql
SELECT parse_data_size('1024B');
```
```text
+--------------------------+
| parse_data_size('1024B') |
+--------------------------+
| 1024                     |
+--------------------------+
```

2. Parse kilobytes
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

3. Parse megabytes with decimals
```sql
SELECT parse_data_size('2.5MB');
```
```text
+--------------------------+
| parse_data_size('2.5MB') |
+--------------------------+
| 2621440                  |
+--------------------------+
```

4. Parse gigabytes
```sql
SELECT parse_data_size('1GB');
```
```text
+------------------------+
| parse_data_size('1GB') |
+------------------------+
| 1073741824             |
+------------------------+
```

5. Parse terabytes
```sql
SELECT parse_data_size('1TB');
```
```text
+------------------------+
| parse_data_size('1TB') |
+------------------------+
| 1099511627776          |
+------------------------+
```

6. Unsupported unit, error
```sql
SELECT parse_data_size('1iB');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Invalid Input argument "1iB" of function parse_data_size
```

7. Input NULL
```sql
SELECT parse_data_size(NULL);
```
```text
+-----------------------+
| parse_data_size(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```

### Keywords

    PARSE_DATA_SIZE
