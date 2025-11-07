---
{
    "title": "AUTO_PARTITION_NAME",
    "language": "en"
}
---

## Description

The AUTO_PARTITION_NAME function is used to generate partition names for auto partitions. It supports two modes: RANGE mode generates partition names based on time units, and LIST mode generates partition names based on string values.

Supported since Apache Doris 2.1.6.

## Syntax

```sql
AUTO_PARTITION_NAME('RANGE', <unit>, <datetime>)
AUTO_PARTITION_NAME('LIST', <value>[, <value> ...])
```

## Parameters

| Parameter | Description |
| ----------- | ----------------------------------------- |
| `'RANGE'` | RANGE partition mode, generates partition names based on time |
| `'LIST'` | LIST partition mode, generates partition names based on string values |
| `<unit>` | Time unit for RANGE mode: `year`, `month`, `day`, `hour`, `minute`, `second`. Type: VARCHAR |
| `<datetime>` | Datetime value for RANGE mode. Type: DATETIME |
| `<value>` | Partition value(s) for LIST mode (can be multiple). Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the generated partition name.

Special cases:
- RANGE mode: Partition name format is `pYYYYMMDDHHMMSS`, truncated to the corresponding precision based on unit
- LIST mode: Partition name format is `p<value><length>`, multiple values separated by length
- If parameters are invalid, returns an error

## Examples

1. Basic usage: RANGE by day
```sql
SELECT auto_partition_name('range', 'day', '2022-12-12 19:20:30');
```
```text
+------------------------------------------------------------+
| auto_partition_name('range', 'day', '2022-12-12 19:20:30') |
+------------------------------------------------------------+
| p20221212000000                                            |
+------------------------------------------------------------+
```

2. RANGE by month
```sql
SELECT auto_partition_name('range', 'month', '2022-12-12 19:20:30');
```
```text
+--------------------------------------------------------------+
| auto_partition_name('range', 'month', '2022-12-12 19:20:30') |
+--------------------------------------------------------------+
| p20221201000000                                              |
+--------------------------------------------------------------+
```

3. LIST single value
```sql
SELECT auto_partition_name('list', 'helloworld');
```
```text
+-------------------------------------------+
| auto_partition_name('list', 'helloworld') |
+-------------------------------------------+
| phelloworld10                             |
+-------------------------------------------+
```

4. LIST multiple values
```sql
SELECT auto_partition_name('list', 'hello', 'world');
```
```text
+-----------------------------------------------+
| auto_partition_name('list', 'hello', 'world') |
+-----------------------------------------------+
| phello5world5                                 |
+-----------------------------------------------+
```

5. UTF-8 special character support: LIST mode
```sql
SELECT auto_partition_name('list', 'ṭṛì', 'ḍḍumai');
```
```text
+------------------------------------------------+
| auto_partition_name('list', 'ṭṛì', 'ḍḍumai')  |
+------------------------------------------------+
| pṭṛì9ḍḍumai12                                  |
+------------------------------------------------+
```

6. Invalid unit parameter
```sql
SELECT auto_partition_name('range', 'years', '2022-12-12');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = range auto_partition_name must accept year|month|day|hour|minute|second for 2nd argument
```

### Keywords

    AUTO_PARTITION_NAME,AUTO,PARTITION,NAME
