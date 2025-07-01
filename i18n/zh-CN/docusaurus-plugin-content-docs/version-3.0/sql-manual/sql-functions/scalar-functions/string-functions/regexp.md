---
{
    "title": "REGEXP",
    "language": "zh-CN"
}
---

## 描述

对字符串 str 进行正则匹配，匹配上的则返回 true，没匹配上则返回 false。pattern 为正则表达式。

字符集匹配需要使用 Unicode 标准字符类型。例如，匹配中文请使用 `\p{Han}`。

## 语法

```sql
REGEXP(<str>, <pattern>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<str>` | 需要进行正则匹配的列。|
| `<pattern>` | 目标模式。|

## 返回值

一个 `BOOLEAN` 值，指示匹配是否成功

## 示例
让我们准备一些数据。
```sql
CREATE TABLE test ( k1 VARCHAR(255) ) properties("replication_num"="1")

INSERT INTO test (k1) VALUES ('billie eillish'), ('It\'s ok'), ('billie jean'), ('hello world');
```

现在进行 `REGEXP`

```sql
--- 查找 k1 字段中以 'billie' 为开头的所有数据
SELECT k1 FROM test WHERE k1 REGEXP '^billie'
--------------

+----------------+
| k1             |
+----------------+
| billie eillish |
| billie jean    |
+----------------+
2 rows in set (0.02 sec)

--- 查找 k1 字段中以 'ok' 为结尾的所有数据：
SELECT k1 FROM test WHERE k1 REGEXP 'ok$'
--------------

+---------+
| k1      |
+---------+
| It's ok |
+---------+
1 row in set (0.03 sec)
```
中文字符示例

```sql
mysql> select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
+-----------------------------------------------------------------------------+
| ('这是一段中文 This is a passage in English 1234567' regexp '\p{Han}')         |
+-----------------------------------------------------------------------------+
|                                                                           1 |
+-----------------------------------------------------------------------------+
```

### 关键词
    REGEXP
