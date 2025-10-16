---
{
    "title": "SOUNDEX",
    "language": "zh-CN"
}
---

## 描述

SOUNDEX 函数用于计算[美国 Soundex](https://zh.wikipedia.org/zh-cn/Soundex) 值，其中包括第一个字母，后跟一个 3 位数字的声音编码
该编码表示用户指定的字符串的英语发音。

该函数会忽略所有字符串中的非字母字符。

## 语法

```sql
SOUNDEX ( <expr> )
```

## 参数

| 参数      | 说明        |
|---------|-----------|
| `<expr>` | 需要计算的字符串，仅接受 ASCII 字符。 |

## 返回值

返回一个 VARCHAR(4) 字符串，其中包括一个大写字母，后跟代表英语发音的三位数字声音编码。

如果字符串为空，或字符串中不含任何字母字符，则返回空字符串。

如果待处理的字符串包含非 ASCII 字符，函数将在计算过程中抛出异常。

输入为 NULL 时返回 NULL。

## 举例

下格模拟了一个名字列表。
```sql
CREATE TABLE IF NOT EXISTS soundex_test (
     name VARCHAR(20)
) DISTRIBUTED BY HASH(name) BUCKETS 1
PROPERTIES ("replication_num" = "1"); 

INSERT INTO soundex_test (name) VALUES
('Doris'),
('Smith'), ('Smyth'),
('H'), ('P'), ('Lee'), 
('Robert'), ('R@b-e123rt'),
('123@*%'), (''),
('Ashcraft'), ('Honeyman'), ('Pfister'), (NULL);
```

```sql
SELECT name, soundex(name) AS IDX FROM soundex_test;
```
```text
+------------+------+
| NULL       | NULL |
|            |      |
| 123@*%     |      |
| Ashcraft   | A261 |
| Doris      | D620 |
| H          | H000 |
| Honeyman   | H555 |
| Lee        | L000 |
| P          | P000 |
| Pfister    | P236 |
| R@b-e123rt | R163 |
| Robert     | R163 |
| Smith      | S530 |
| Smyth      | S530 |
+------------+------+
```

对非 ASCII 码的行为：

- Doris 在逐字符处理输入字符串时，如果在完成计算之前遇到非 ASCII 字符，会立即抛出错误，示例如下：

```sql
SELECT SOUNDEX('你好');
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]soundex only supports ASCII
```
```sql
-- 在处理完 `Doris` 后得到 D62（还缺一位数字，未构成完整的 4 字符编码）
-- 读到非 ASCII 字符 `你` 后，函数报错
SELECT SOUNDEX('Doris 你好');
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]soundex only supports ASCII
```
```sql
SELECT SOUNDEX('Apache Doris 你好');
```
```text
+--------------------------------+
| SOUNDEX('Apache Doris 你好')   |
+--------------------------------+
| A123                           |
+--------------------------------+
```