---
{
    "title": "STR_TO_DATE",
    "language": "en",
    "description": "The function converts the input datetime string into a DATETIME value based on the specified format."
}
---

## Description

The function converts the input datetime string into a DATETIME value based on the specified format.

## Syntax

```sql
STR_TO_DATE(<datetime_str>, <format>)
```
## Parameters

| Parameter        | Description                                                                                                      |
|------------------|------------------------------------------------------------------------------------------------------------------|
| `<datetime_str>` | Required. The input datetime string to be converted.                                                             |
| `<format>`       | Required. The specified datetime format string, such as `%Y-%m-%d %H:%i:%s`, etc. for specific format parameters, see the [DATE_FORMAT](./date-format#parameters) documentation. |

In addition, the `<format>` supports the following several alternative formats and interprets them to the regular format:

|Alternative Input|Interpret as|
|-|-|
|`yyyyMMdd`|`%Y%m%d`|
|`yyyy-MM-dd`|`%Y-%m-%d`|
|`yyyy-MM-dd HH:mm:ss`|`%Y-%m-%d %H:%i:%s`|

## Return Value

- Returns a DATETIME value representing the converted datetime.
- If the input `<datetime_str>` or `<format>` is invalid, the function returns NULL.

## Example

Convert common datetime strings to DATETIME

```sql
SELECT STR_TO_DATE('2025-01-23 12:34:56', '%Y-%m-%d %H:%i:%s'),STR_TO_DATE('2025-01-23 12:34:56', 'yyyy-MM-dd HH:mm:ss');
```

```text
+---------------------------------------------------------+-----------------------------------------------------------+
| str_to_date('2025-01-23 12:34:56', '%Y-%m-%d %H:%i:%s') | str_to_date('2025-01-23 12:34:56', 'yyyy-MM-dd HH:mm:ss') |
+---------------------------------------------------------+-----------------------------------------------------------+
| 2025-01-23 12:34:56.000000                              | 2025-01-23 12:34:56.000000                                |
+---------------------------------------------------------+-----------------------------------------------------------+
```

Others

```sql
select STR_TO_DATE('200442 Monday', '%X%V %W'),STR_TO_DATE('2023','%Y');
```

```text
+-----------------------------------------+---------------------------+
| str_to_date('200442 Monday', '%X%V %W') | str_to_date('2023', '%Y') |
+-----------------------------------------+---------------------------+
| 2004-10-18                              | 2023-01-01                |
+-----------------------------------------+---------------------------+
```