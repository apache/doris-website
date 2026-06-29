---
{
    "title": "IS_VALID_UTF8",
    "language": "zh-CN",
    "description": "IS_VALID_UTF8 函数用于检查字符串是否为合法的 UTF-8 编码数据。如果字符串是合法 UTF-8 则返回 true，否则返回 false。"
}
---

## 描述

IS_VALID_UTF8 函数用于检查字符串是否为合法的 UTF-8 编码数据。它会验证输入中的每个字节序列，如果所有序列都符合 UTF-8 编码标准则返回 `true`，如果发现任何非法字节序列则返回 `false`。

该函数在处理从外部数据源（文件、网络流等）导入的数据时非常有用，这些数据可能包含二进制或编码错误的内容，您可以在执行字符串操作之前验证数据的完整性。

## 别名

- `ISVALIDUTF8()`

## 语法

```sql
IS_VALID_UTF8(<str>)
```

## 参数

| 参数 | 说明 |
|------|------|
| `<str>` | 需要验证的字符串。类型：VARCHAR 或 STRING |

## 返回值

返回 BOOLEAN 类型。

- 如果字符串是合法的 UTF-8 编码数据，返回 `true`。
- 如果字符串包含任何非法的 UTF-8 字节序列，返回 `false`。

特殊情况：
- 如果参数为 NULL，返回 NULL。
- 空字符串被视为合法的 UTF-8，返回 `true`。

## 示例

1. 合法的 ASCII 字符串

```sql
SELECT IS_VALID_UTF8('hello');
```

```text
+------------------------+
| is_valid_utf8('hello') |
+------------------------+
|                      1 |
+------------------------+
```

2. 合法的多字节 UTF-8 字符（中文）

```sql
SELECT IS_VALID_UTF8('Hello, 世界');
```

```text
+-----------------------------+
| is_valid_utf8('Hello, 世界') |
+-----------------------------+
|                           1 |
+-----------------------------+
```

3. 空字符串

```sql
SELECT IS_VALID_UTF8('');
```

```text
+--------------------+
| is_valid_utf8('')  |
+--------------------+
|                  1 |
+--------------------+
```

4. 非法的 UTF-8 字节（通过 UNHEX 构造）

```sql
SELECT IS_VALID_UTF8(UNHEX('C0AF'));
```

```text
+------------------------------+
| is_valid_utf8(unhex('C0AF')) |
+------------------------------+
|                            0 |
+------------------------------+
```

5. NULL 值处理

```sql
SELECT IS_VALID_UTF8(NULL);
```

```text
+---------------------+
| is_valid_utf8(NULL) |
+---------------------+
|                NULL |
+---------------------+
```

6. 配合表数据使用

```sql
CREATE TABLE test_utf8 (
    id INT,
    val VARCHAR(200)
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_utf8 VALUES
(1, 'hello'),
(2, ''),
(3, 'Hello, 世界'),
(4, NULL);

INSERT INTO test_utf8 VALUES (5, UNHEX('C0AF'));
INSERT INTO test_utf8 VALUES (6, UNHEX('FF'));

SELECT id, IS_VALID_UTF8(val) FROM test_utf8 ORDER BY id;
```

```text
+------+--------------------+
| id   | is_valid_utf8(val) |
+------+--------------------+
|    1 |                  1 |
|    2 |                  1 |
|    3 |                  1 |
|    4 |               NULL |
|    5 |                  0 |
|    6 |                  0 |
+------+--------------------+
```
