---
{
    "title": "FROM_UNIXTIME",
    "language": "en"
}
---

## Description

Converts a Unix timestamp to the corresponding TIME format.

Special cases:

- Supported input range for `unix_timestamp` is `[0, 253402271999.999999]`. Values outside this range return `NULL`.

## Syntax

```sql
FROM_UNIXTIME(<unix_timestamp>[, <string_format>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<unix_timestamp>` | unix timestamp |
| `<string_format>` | The format format, with the default being %Y-%m-%d %H:%i:%s.|

## Return Value

Returns the date in the specified format.

## Examples

```
mysql> select from_unixtime(1196440219);
+---------------------------+
| from_unixtime(1196440219) |
+---------------------------+
| 2007-12-01 00:30:19       |
+---------------------------+

mysql> select from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss');
+--------------------------------------------------+
| from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+

-- Maximum supported time
mysql> select from_unixtime(253402271999.999999);
+------------------------------------+
| from_unixtime(253402271999.999999) |
+------------------------------------+
| 9999-12-31 23:59:59.999999         |
+------------------------------------+

mysql> select from_unixtime(1196440219, '%Y-%m-%d');
+-----------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d') |
+-----------------------------------------+
| 2007-12-01                              |
+-----------------------------------------+

mysql> select from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s');
+--------------------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+
```