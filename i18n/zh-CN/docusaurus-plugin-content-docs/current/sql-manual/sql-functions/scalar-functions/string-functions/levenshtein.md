---
title: LEVENSHTEIN
---

## 描述
`LEVENSHTEIN` 函数用于计算两个字符串之间的编辑距离。  
编辑距离是把一个字符串变成另一个字符串所需的最少单字符插入、删除或替换次数。

该函数按 UTF-8 字符计数。

## 语法
```sql
LEVENSHTEIN(<str1>, <str2>)
```

## 参数
| 参数 | 说明 |
| -- | -- |
| `<str1>` | 第一个字符串 |
| `<str2>` | 第二个字符串 |

## 返回值
返回 INT。

## 示例
```sql
SELECT levenshtein('kitten', 'sitting'); -- 3
SELECT levenshtein('数据库', '数据');    -- 1
```

## 说明
- 支持 UTF-8 字符。
- 任意参数为 NULL 时返回 NULL。
