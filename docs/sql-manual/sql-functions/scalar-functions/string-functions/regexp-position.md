---
{
    "title": "REGEXP_POSITION",
    "language": "en"
}
---

## Description

Returns the index of the first occurrence of pattern in string, starting from start (include start). Returns -1 if not found.

## Syntax

```sql
REGEXP_POSITION ( <str>, <pattern> [, <position>] )
```

## Parameters

| Parameter      | Description                           |
|---------|------------------------------|
| `<str>` | This parameter is of Varchar type. It represents the string on which the regular expression matching will be performed. It can be a literal string or a column from a table containing string values.                     |
| `<pattern>` | This parameter is of Varchar type. It is the regular expression pattern used to match the string. The pattern can include various regular expression metacharacters and constructs to define complex matching rules.   |
| `<position>` | Optional parameter. The parameter used to specify the position in the string from which to start searching for the regular expression match. It is an integer value representing the character position in the string (starting from 1). The default is 1 |

## Return Value

Returns the index of the first occurrence of pattern in string, starting from start (include start). Special cases:

- If any of the parameters is NULL, NULL is returned.
- If position is less than 1, -1 is returned

## Examples

common cases
```sql
SELECT regexp_position('I have 23 apples, 5 pears and 13 oranges', ' ', 0);
```
```text
+---------------------------------------------------------------------+
| regexp_position('I have 23 apples, 5 pears and 13 oranges', ' ', 0) |
+---------------------------------------------------------------------+
|                                                                  -1 |
+---------------------------------------------------------------------+
```

```sql
SELECT regexp_position('I have 23 apples, 5 pears and 13 oranges', ' ', 1);
```
```text
+---------------------------------------------------------------------+
| regexp_position('I have 23 apples, 5 pears and 13 oranges', ' ', 1) |
+---------------------------------------------------------------------+
|                                                                  2 |
+---------------------------------------------------------------------+
```

```sql
SELECT regexp_position('I have 23 apples, 5 pears and 13 oranges', ' ', 4);
```
```text
+---------------------------------------------------------------------+
| regexp_position('I have 23 apples, 5 pears and 13 oranges', ' ', 4) |
+---------------------------------------------------------------------+
|                                                                  7 |
+---------------------------------------------------------------------+
```

regex cases
```sql
SELECT regexp_position('I have 23 apples, 5 pears and 13 oranges', '\\d', 0);
```
```text
+-----------------------------------------------------------------------+
| regexp_position('I have 23 apples, 5 pears and 13 oranges', '\\d', 0) |
+-----------------------------------------------------------------------+
|                                                                    -1 |
+-----------------------------------------------------------------------+
```

```sql
SELECT regexp_position('I have 23 apples, 5 pears and 13 oranges', '\\d', 9);
```
```text
+-----------------------------------------------------------------------+
| regexp_position('I have 23 apples, 5 pears and 13 oranges', '\\d', 9) |
+-----------------------------------------------------------------------+
|                                                                     9 |
+-----------------------------------------------------------------------+
```

Chinese case
```sql
SELECT regexp_position('我爱北京天安门', '爱', 1);
```
```text
+----------------------------------------------------+
| regexp_position('我爱北京天安门', '爱', 1)         |
+----------------------------------------------------+
|                                                 4 |
+----------------------------------------------------+
```

Null cases
```sql
SELECT regexp_position(null, ' ', 0);
```
```text
+-------------------------------+
| regexp_position(null, ' ', 0) |
+-------------------------------+
|                          NULL |
+-------------------------------+
```

```sql
SELECT regexp_position('abc', null, 0);
```
```text
+---------------------------------+
| regexp_position('abc', null, 0) |
+---------------------------------+
|                            NULL |
+---------------------------------+
```

```sql
SELECT regexp_position(null, null, 0);
```
```text
+--------------------------------+
| regexp_position(null, null, 0) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```

```sql
SELECT regexp_position('abc', 'b', null);
```
```text
+-----------------------------------+
| regexp_position('abc', 'b', null) |
+-----------------------------------+
|                              NULL |
+-----------------------------------+
```

emoji cases
```sql
SELECT regexp_position('😀😊😎', '😀|😊|😎', 0);
```
```text
+------------------------------------------------------+
| regexp_position('😀😊😎', '😀|😊|😎', 0)                         |
+------------------------------------------------------+
|                                                   -1 |
+------------------------------------------------------+
```
```sql
SELECT regexp_position('😀😊😎', '😀|😊|😎', 1);
```
```text
+------------------------------------------------------+
| regexp_position('😀😊😎', '😀|😊|😎', 1)                         |
+------------------------------------------------------+
|                                                   1 |
+------------------------------------------------------+
```
```sql
SELECT regexp_position('😀😊😎', '😀|😊|😎', 2);
```
```text
+------------------------------------------------------+
| regexp_position('😀😊😎', '😀|😊|😎', 2)                         |
+------------------------------------------------------+
|                                                   5 |
+------------------------------------------------------+
```

table cases
```sql
CREATE TABLE test_regexp_position (
            str varchar(100),                      
            pattern varchar(100),             
            position int,
            num int  -- this colum used to order
        )
        DISTRIBUTED BY HASH(str)
        PROPERTIES (
            "replication_num" = "1"
        );
        
 INSERT INTO test_regexp_position VALUES 
 ('I have 23 apples, 5 pears and 13 oranges', '\\d', 15, 1),
 ('I have 23 apples, 5 pears and 13 oranges', ' ', 3, 2),
 ('I have 23 apples, 5 pears and 13 oranges', '\\b\\d+\\b', 10, 3),
 ('I have 23 apples, 5 pears and 13 oranges', '5', 0, 4),
 ('I have 23 apples, 5 pears and 13 oranges', '5', 25, 5),
 ('我爱北京天安门', '爱', 3, 6),
 ('123AbCdExCx', '([[:lower:]]+)C([[:lower:]]+)', 5, 7),
 (null, null, null, 8),
 ('😀😊😎', '😀|😊|😎', 2, 9);
 
 select regexp_position(str, pattern, position) from test_regexp_position order by num;
```
```text
+------------------------------------------+-------------------------------+----------+-----------------------------------------+
| str                                      | pattern                       | position | regexp_position(str, pattern, position) |
+------------------------------------------+-------------------------------+----------+-----------------------------------------+
| I have 23 apples, 5 pears and 13 oranges | \d                            |       15 |                                      19 |
| I have 23 apples, 5 pears and 13 oranges |                               |        3 |                                       7 |
| I have 23 apples, 5 pears and 13 oranges | \b\d+\b                       |       10 |                                      19 |
| I have 23 apples, 5 pears and 13 oranges | 5                             |        0 |                                      -1 |
| I have 23 apples, 5 pears and 13 oranges | 5                             |       25 |                                      -1 |
| 我爱北京天安门                           | 爱                            |        3 |                                       4 |
| 123AbCdExCx                              | ([[:lower:]]+)C([[:lower:]]+) |        5 |                                       5 |
| NULL                                     | NULL                          |     NULL |                                    NULL |
| 😀😊😎                                         | 😀|😊|😎                            |        2 |                                       5 |
+------------------------------------------+-------------------------------+----------+-----------------------------------------+
```

