---
{
    "title": "SOUNDEX",
    "language": "zh-CN",
    "description": "SOUNDEX 函数用于计算字符串的 Soundex 编码。Soundex 是一种语音算法，用于将英文单词编码为表示其发音的代码，相似发音的单词会有相同的编码。"
}
---

## 描述

SOUNDEX 函数用于计算字符串的 [Soundex 编码](https://zh.wikipedia.org/zh-cn/Soundex)。Soundex 是一种语音算法，用于将英文单词编码为表示其发音的代码，相似发音的单词会有相同的编码。

编码规则：返回由一个大写字母和三位数字组成的4字符代码（如 S530）。

## 语法

```sql
SOUNDEX(<expr>)
```

## 参数

| 参数 | 说明 |
| -------- | ----------------------------------------- |
| `<expr>` | 需要计算 Soundex 编码的字符串（仅支持 ASCII 字符）。类型：VARCHAR |

## 返回值

返回 VARCHAR(4) 类型，为字符串的 Soundex 编码。

特殊情况：
- 如果参数为 NULL，返回 NULL
- 如果字符串为空或不含字母，返回空字符串
- 仅处理 ASCII 字母，忽略其他字符
- 非 ASCII 字符会导致函数报错

## 示例

1. 基本用法：单词编码
```sql
SELECT soundex('Doris');
```
```text
+------------------+
| soundex('Doris') |
+------------------+
| D620             |
+------------------+
```

2. 相似发音的单词有相同编码
```sql
SELECT soundex('Smith'), soundex('Smyth');
```
```text
+------------------+------------------+
| soundex('Smith') | soundex('Smyth') |
+------------------+------------------+
| S530             | S530             |
+------------------+------------------+
```

3. 空字符串处理
```sql
SELECT soundex('');
```
```text
+-------------+
| soundex('') |
+-------------+
|             |
+-------------+
```

4. 处理 NULL 值

```sql
SELECT soundex(NULL);
```

```text
+---------------+
| soundex(NULL) |
+---------------+
| NULL          |
+---------------+
```

5. 空字符串返回空字符串

```sql
SELECT soundex('');
```

```text
+-------------+
| soundex('') |
+-------------+
|             |
+-------------+
```

6. 仅包含非字母字符返回空字符串

```sql
SELECT soundex('123@*%');
```

```text
+-------------------+
| soundex('123@*%') |
+-------------------+
|                   |
+-------------------+
```

7. 忽略非字母字符

```sql
SELECT soundex('R@b-e123rt'), soundex('Robert');
```

```text
+-----------------------+-------------------+
| soundex('R@b-e123rt') | soundex('Robert') |
+-----------------------+-------------------+
| R163                  | R163              |
+-----------------------+-------------------+
```
9. 仅包含非 ASCII 字符报错示例

```sql
SELECT soundex('你好');  
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Not Supported: Not Supported: soundex only supports ASCII, but got: 你
```

```sql
SELECT soundex('Apache Doris 你好');
```

```text
+--------------------------------+
| soundex('Apache Doris 你好')   |
+--------------------------------+
| A123                           |
+--------------------------------+
```