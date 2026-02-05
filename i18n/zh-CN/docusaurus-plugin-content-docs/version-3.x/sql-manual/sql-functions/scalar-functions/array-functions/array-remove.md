---
{
    "title": "ARRAY_REMOVE",
    "language": "zh-CN",
    "description": "移除数组中所有的指定元素"
}
---

## 描述

移除数组中所有的指定元素

## 语法

```sql
ARRAY_REMOVE(<arr>, <val>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<arr>` | 对应数组 |
| `<val>` | 指定元素 |

## 返回值

返回移除所有的指定元素后的数组，如果输入参数为 NULL，则返回 NULL

## 举例

```sql
SELECT ARRAY_REMOVE(['test', NULL, 'value'], 'value');
```

```text
+------------------------------------------------+
| array_remove(['test', NULL, 'value'], 'value') |
+------------------------------------------------+
| ["test", null]                                 |
+------------------------------------------------+
```
