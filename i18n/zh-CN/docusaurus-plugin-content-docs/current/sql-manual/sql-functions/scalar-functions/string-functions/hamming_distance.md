---
title: HAMMING_DISTANCE
---

## 描述
`HAMMING_DISTANCE` 函数用于计算两个**等长字符串**在对应位置上不同字符的个数。

该函数按 UTF-8 字符计数。

## 语法
```sql
HAMMING_DISTANCE(<str1>, <str2>)
```

## 参数
| 参数 | 说明 |
| -- | -- |
| `<str1>` | 第一个字符串 |
| `<str2>` | 第二个字符串 |

## 返回值
返回 BIGINT。

## 示例
```sql
SELECT hamming_distance('karolin', 'kathrin'); -- 3
SELECT hamming_distance('数据库', '数据仓');   -- 1
```

## 说明
- 两个字符串必须长度一致，否则会报错。
- 支持 UTF-8 字符。
- 任意参数为 NULL 时返回 NULL。
