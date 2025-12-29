---
{
    "title": "CONCAT_WS",
    "language": "zh-CN",
    "description": "使用第一个参数sep作为连接符，将第二个参数及后续所有参数（或一个数组、多个数组中的所有字符串）拼接成一个字符串。特殊情况："
}
---

## 描述

使用第一个参数sep作为连接符，将第二个参数及后续所有参数（或一个数组、多个数组中的所有字符串）拼接成一个字符串。特殊情况：

- 若分隔符为 NULL，则返回 NULL。​
- CONCAT_WS函数不跳过空字符串（""），但会跳过 NULL 值。​
- CONCAT_WS函数不跳过任何数组参数中的空字符串，但会跳过数组中的 NULL 值。
- ​CONCAT_WS函数不会跳过NULL如果输入多个数组参数，会返回空字符串。
- 第一个参数必须为字符串类型（string 或 varchar），其他参数必须为相同类型，即均为字符串类型（string 或 varchar）或均为数组类型（ARRAY）。
## 语法

```sql
CONCAT_WS ( <sep> , <str> [ , <str> ] )
CONCAT_WS ( <sep> , <array> [ , <array> ])
```

## 参数

| 参数    | 说明              |
|-------|-----------------|
| `<sep>` | 用于拼接字符串的连接符，类型为 string 或 varchar       |
| `<str>` | 待拼接的字符串，类型为 string 或 varchar       |
| `<array>` | 待拼接的数组，类型为 ARRAY，且数组元素为 string 或 varchar |


## 返回值

参数 `<sep>` 或者 `<array>` 数组使用 `<str>` 拼接后字符串。特殊情况：

- 如果分隔符是 NULL，返回 NULL。
- 如果多个数组参数中含有NULL参数，则返回空字符串
## 举例

将字符串通过 or 拼接到一起

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

将 array 数组通过 or 拼接到一起

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
拼接多个数组

```sql
mysql> SELECT CONCAT_WS("-", ["a", "b"], ["c", NULL], ["d"]);

+------------------------------------------------+
| CONCAT_WS("-", ["a", "b"], ["c", NULL], ["d"]) |
+------------------------------------------------+
| a-b-c-d                                        |
+------------------------------------------------+
```

如果在多个数组参数中包含NULL参数，则返回空字符串;

```sql
mysql>  SELECT CONCAT_WS("-", ["a", "b"], null,["c", NULL], ["d"]);
+-----------------------------------------------------+
| CONCAT_WS("-", ["a", "b"], null,["c", NULL], ["d"]) |
+-----------------------------------------------------+
|                                                     |
+-----------------------------------------------------+
```

处理空字符串

```sql
mysql> SELECT CONCAT_WS("|", "hello", "", "world", NULL);

+--------------------------------------------+
| CONCAT_WS("|", "hello", "", "world", NULL) |
+--------------------------------------------+
| hello||world                               |
+--------------------------------------------+
```

混合字符串和数组（无效）

```sql
mysql> SELECT CONCAT_WS(",", "a", ["b", "c"]);

ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<VARCHAR(1)> to target type=VARCHAR(65533)

```

全为 NULL 的输入

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

中文字符拼接

```sql
mysql> SELECT CONCAT_WS("x", ['中文'], ['中文']);
+----------------------------------------+
| CONCAT_WS("x", ['中文'], ['中文'])     |
+----------------------------------------+
| 中文x中文                              |
+----------------------------------------+
```

插入数据并拼接

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