---
{
    "title": "CONCAT_WS",
    "language": "en"
}
---

## Description

Use the first parameter sep as the connector to concatenate the second parameter and all subsequent parameters (or all strings in one ARRAY or multi ARRAY ) into a string. Special cases:

- If the separator is NULL, NULL is returned.

- The `CONCAT_WS` function does not skip empty strings, but skips NULL values.
- The `CONCAT_WS` function does not skip empty strings in any `ARRAY` parameters, but skips NULL values in `ARRAY` or - - parameters.
- The first parameters must be a `string` type, and the others must be the same type ,belong to the `string` or `ARRAY` type 
## Syntax

```sql
CONCAT_WS ( <sep> , <str> [ , <str> ] )
CONCAT_WS ( <sep> , <array> [ , <array> ])
```

## Parameters

| Parameter | Description |
|-------|-----------------|
| `<sep>` | Connector for concatenating strings, it is `string` type or `varchar` type |
| `<str>` | String to be concatenated , it is `string` or `varchar` type|
| `<array>` | Array to be concatenated ,it is `ARRAY` type, and every element is `string` or `varchar` type|

## Return value

Parameter `<sep>` or `<array>` The string concatenated with `<str>`. Special cases:

- If delimiter is NULL, returns NULL.
- If parameters with mutlti arrays and it contains a null,function will return empty string.

## Example

Concatenate strings together using or

```sql
SELECT CONCAT_WS("or", "d", "is"),CONCAT_WS(NULL, "d", "is"),CONCAT_WS('or', 'd', NULL, 'is')
```

```text
+----------------------------+----------------------------+------------------------------------------+
| concat_ws('or', 'd', 'is') | concat_ws(NULL, 'd', 'is') | concat_ws('or', 'd', NULL, 'is') |
+----------------------------+----------------------------+------------------------------------------+
| doris                      | NULL                       | doris                              |
+----------------------------+----------------------------+------------------------------------------+
```

Concatenate array arrays together using or

```sql
SELECT CONCAT_WS("or", ["d", "is"]),CONCAT_WS(NULL, ["d", "is"]),CONCAT_WS("or", ["d", NULL,"is"])
```

```text
+------------------------------+------------------------------+------------------------------------+
| concat_ws('or', ['d', 'is']) | concat_ws(NULL, ['d', 'is']) | concat_ws('or', ['d', NULL, 'is']) |
+------------------------------+------------------------------+------------------------------------+
| doris                        | NULL                         | doris                              |
+------------------------------+------------------------------+------------------------------------+
```

Concatenating multiple arrays

```sql
mysql> SELECT CONCAT_WS("-", ["a", "b"], ["c", NULL], ["d"]);

+------------------------------------------------+
| CONCAT_WS("-", ["a", "b"], ["c", NULL], ["d"]) |
+------------------------------------------------+
| a-b-c-d                                        |
+------------------------------------------------+
```

Handling NULL in string parameters

```sql
mysql> SELECT CONCAT_WS("|", "hello", "", "world", NULL);

+--------------------------------------------+
| CONCAT_WS("|", "hello", "", "world", NULL) |
+--------------------------------------------+
| hello||world                               |
+--------------------------------------------+
```

Return empty if NULL in multi arrays;

```sql
mysql>  SELECT CONCAT_WS("-", ["a", "b"], null,["c", NULL], ["d"]);
+-----------------------------------------------------+
| CONCAT_WS("-", ["a", "b"], null,["c", NULL], ["d"]) |
+-----------------------------------------------------+
|                                                     |
+-----------------------------------------------------+
```

Mixing strings and arrays (invalid)

```sql
mysql> SELECT CONCAT_WS(",", "a", ["b", "c"]);

ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<VARCHAR(1)> to target type=VARCHAR(65533)

```

 All NULL inputs

 ```sql
 mysql> SELECT CONCAT_WS("x", NULL, NULL);

+----------------------------+
| CONCAT_WS("x", NULL, NULL) |
+----------------------------+
|                            |
+----------------------------+
 ```

Chiese Charactors concat 

```sql
mysql> SELECT CONCAT_WS("x", '中文', '中文');

+------------------------------------+
| CONCAT_WS("x", '中文', '中文')     |
+------------------------------------+
| 中文x中文                          |
+------------------------------------+
```

Chinese charactors in multi arrays

```sql
mysql> SELECT CONCAT_WS("x", ['中文'], ['中文']);
+----------------------------------------+
| CONCAT_WS("x", ['中文'], ['中文'])     |
+----------------------------------------+
| 中文x中文                              |
+----------------------------------------+
```

Insert and concat them

```sql
DROP TABLE IF EXISTS test_concat_ws_1;

CREATE TABLE test_concat_ws_1 (id INT, a ARRAY<VARCHAR>, b ARRAY<VARCHAR>) ENGINE=OLAP DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES ('replication_num' = '1')

INSERT INTO test_concat_ws_1 VALUES (1, ['a','b'], ['css',null,'d']), (2, ['x',null], ['y','z']),(3,['你好','世界'],['Doris',null,'Nereids'])

SELECT concat_ws('-', a, b) FROM test_concat_ws_1 ORDER BY id

```

```text

+-----------------------------+
| concat_ws('-', a, b)        |
+-----------------------------+
| a-b-css-d                   |
| x-y-z                       |
| 你好-世界-Doris-Nereids     |
+-----------------------------+
```