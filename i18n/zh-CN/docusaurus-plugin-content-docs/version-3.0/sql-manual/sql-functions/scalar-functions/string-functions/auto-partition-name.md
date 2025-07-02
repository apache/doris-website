---
{
    "title": "AUTO_PARTITION_NAME",
    "language": "en"
}
---

:::tip tip
Supported since Apache Doris 2.1.6
:::

### Description
#### Syntax

`VARCHAR AUTO_PARTITION_NAME('RANGE', 'VARCHAR unit', DATETIME datetime)`

`VARCHAR AUTO_PARTITION_NAME('LIST', VARCHAR,...)`

Generate datetime partition names by unit following RANGE's partition name rules

Convert strings to partition names following LIST's partition name rules

The datetime parameter is a legal date expression.

The unit parameter is the time interval you want, the available values are: [`second`, `minute`, `hour`, `day`, `month`, `year`].
If unit does not match one of these options, a syntax error will be returned. 

**Supported since Doris 2.1.6**

### Example

```sql
mysql> select auto_partition_name('range', 'years', '123');
ERROR 1105 (HY000): errCode = 2, detailMessage = range auto_partition_name must accept year|month|day|hour|minute|second for 2nd argument

mysql> select auto_partition_name('range', 'year', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'year', '2022-12-12 19:20:30')   |
+---------------------------------------------------------------+
| p20220101000000                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('range', 'month', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'month', '2022-12-12 19:20:30')  |
+---------------------------------------------------------------+
| p20221201000000                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('range', 'day', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'day', '2022-12-12 19:20:30')    |
+---------------------------------------------------------------+
| p20221212000000                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('range', 'hour', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'hour', '2022-12-12 19:20:30')   |
+---------------------------------------------------------------+
| p20221212190000                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('range', 'minute', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'minute', '2022-12-12 19:20:30') |
+---------------------------------------------------------------+
| p20221212192000                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('range', 'second', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'second', '2022-12-12 19:20:30') |
+---------------------------------------------------------------+
| p20221212192030                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('list', 'helloworld');
+-------------------------------------------+
| auto_partition_name('list', 'helloworld') |
+-------------------------------------------+
| phelloworld10                             |
+-------------------------------------------+

mysql> select auto_partition_name('list', 'hello', 'world');
+-----------------------------------------------+
| auto_partition_name('list', 'hello', 'world') |
+-----------------------------------------------+
| phello5world5                                 |
+-----------------------------------------------+

mysql> select auto_partition_name('list', "你好");
+------------------------------------+
| auto_partition_name('list', "你好") |
+------------------------------------+
| p4f60597d2                         |
+------------------------------------+
```

### Keywords

    AUTO_PARTITION_NAME,AUTO,PARTITION,NAME