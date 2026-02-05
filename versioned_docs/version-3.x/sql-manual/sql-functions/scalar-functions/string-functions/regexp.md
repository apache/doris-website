---
{
    "title": "REGEXP",
    "language": "en",
    "description": "Performs a regular expression match on the string str, returning true if the match succeeds, otherwise false."
}
---

## Description

Performs a regular expression match on the string str, returning true if the match succeeds, otherwise false. pattern is the regular expression pattern.
It should be noted that when handling character set matching, Utf-8 standard character classes should be used. This ensures that functions can correctly identify and process various characters from different languages.

If the `pattern` is not allowed regexp regular,throw error;

Support character match classes : https://github.com/google/re2/wiki/Syntax

## Syntax

```sql
REGEXP(<str>, <pattern>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | String type. Represents the string to be matched against the regular expression, which can be a column in a table or a literal string.|
| `<pattern>` | String type. The regular expression pattern used to match against the string <str>. Regular expressions provide a powerful way to define complex search patterns, including character classes, quantifiers, and anchors.|

## Return Value

The REGEXP function returns a BOOLEAN value. If the string <str> matches the regular expression pattern <pattern>, the function returns true (represented as 1 in SQL); if not, it returns false (represented as 0 in SQL).

## Examples

```sql
CREATE TABLE test ( k1 VARCHAR(255) ) properties("replication_num"="1")

INSERT INTO test (k1) VALUES ('billie eillish'), ('It\'s ok'), ('billie jean'), ('hello world');
```


```sql
--- Find all data in the k1 column starting with 'billie'
SELECT k1 FROM test WHERE k1 REGEXP '^billie'
--------------

+----------------+
| k1             |
+----------------+
| billie eillish |
| billie jean    |
+----------------+
2 rows in set (0.02 sec)

--- Find data in the k1 column ending with 'ok':
SELECT k1 FROM test WHERE k1 REGEXP 'ok$'
--------------

+---------+
| k1      |
+---------+
| It's ok |
+---------+
1 row in set (0.03 sec)
```
Chinese Character Example

```sql
mysql> select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
+-----------------------------------------------------------------------------+
| ('这是一段中文 This is a passage in English 1234567' regexp '\p{Han}')         |
+-----------------------------------------------------------------------------+
|                                                                           1 |
+-----------------------------------------------------------------------------+
```

Insertion and Testing for Simple String Matching

```sql
CREATE TABLE test_regexp (
    id INT,
    name VARCHAR(255)
) PROPERTIES("replication_num"="1");

INSERT INTO test_regexp (id, name) VALUES
    (1, 'Alice'),
    (2, 'Bob'),
    (3, 'Charlie'),
    (4, 'David');

-- Find all names starting with 'A'
SELECT id, name FROM test_regexp WHERE name REGEXP '^A';
```

```text
+------+-------+
| id   | name  |
+------+-------+
|    1 | Alice |
+------+-------+
```

Special Character Matching Test

```sql
-- Insert names with special characters
INSERT INTO test_regexp (id, name) VALUES
    (5, 'Anna-Maria'),
    (6, 'John_Doe');

-- Find names containing the '-' character
SELECT id, name FROM test_regexp WHERE name REGEXP '-';
```
```text
+------+------------+
| id   | name       |
+------+------------+
|    5 | Anna-Maria |
+------+------------+
```

Test for Ending String Matching
```sql
-- Find names ending with 'e'
SELECT id, name FROM test_regexp WHERE name REGEXP 'e$';
```

```text
+------+---------+
| id   | name    |
+------+---------+
|    1 | Alice   |
|    3 | Charlie |
+------+---------+
```

Emoji test

```sql
SELECT 'Hello' REGEXP '😀'; 
```

```text
+-----------------------+
| 'Hello' REGEXP '😀'     |
+-----------------------+
|                     0 |
+-----------------------+
```


'str' is NULL,return NULL

```sql
mysql> SELECT REGEXP(NULL, '^billie');
+-------------------------+
| REGEXP(NULL, '^billie') |
+-------------------------+
|                    NULL |
+-------------------------+
```

'pattern' is NULL, return NULL

```sql
mysql> SELECT REGEXP('billie eillish', NULL);
+--------------------------------+
| REGEXP('billie eillish', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```

All parameters are NULL,return NULL

```sql
mysql> SELECT REGEXP(NULL, NULL);
+--------------------+
| REGEXP(NULL, NULL) |
+--------------------+
|               NULL |
+--------------------+
```

If the `pattern` is not allowed regexp regular,throw error;

```sql
SELECT REGEXP('Hello, World!', '([a-z');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INTERNAL_ERROR]Invalid regex expression: ([a-z
```