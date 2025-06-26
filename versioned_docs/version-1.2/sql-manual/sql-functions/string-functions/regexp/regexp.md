---
{
    "title": "REGEXP",
    "language": "en"
}
---

## Description

Perform regular matching on the string str, return true if it matches, return false or not. Pattern is a regular expression.

- Character set matching requires the use of Unicode standard character classes. For example, to match Chinese, use `\p{Han}`.

## Syntax

```sql
REGEXP(<str>, <pattern>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The column need to do regular matching.|
| `<pattern>` | Target pattern.|

## Return Value

A `BOOLEAN` value indicating whether the match was successful

## Example
Lets prepare some data.
```sql
CREATE TABLE test ( k1 VARCHAR(255) ) properties("replication_num"="1")

INSERT INTO test (k1) VALUES ('billie eillish'), ('It\'s ok'), ('billie jean'), ('hello world');
```

Do `REGEXP` now

```sql
--- Find all data starting with 'billie' in the k1 field
SELECT k1 FROM test WHERE k1 REGEXP '^billie'
--------------

+----------------+
| k1             |
+----------------+
| billie eillish |
| billie jean    |
+----------------+
2 rows in set (0.02 sec)

--- Find all data ending with 'ok' in the k1 field:
SELECT k1 FROM test WHERE k1 REGEXP 'ok$'
--------------

+---------+
| k1      |
+---------+
| It's ok |
+---------+
1 row in set (0.03 sec)
```
Example for Chinese character

```sql
mysql> select regexp('这是一段中文This is a passage in English 1234567', '\\p{Han}');
+-----------------------------------------------------------------------------+
| ('这是一段中文This is a passage in English 1234567' regexp '\p{Han}')         |
+-----------------------------------------------------------------------------+
|                                                                           1 |
+-----------------------------------------------------------------------------+
```
