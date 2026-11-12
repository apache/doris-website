---
{
    "title": "ARRAYS_OVERLAP",
    "language": "zh-CN",
    "description": "判断 left 和 right 数组中是否包含公共元素"
}
---

## 描述

判断 left 和 right 数组中是否包含公共元素

## 语法

```sql
ARRAYS_OVERLAP(<left>, <right>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<left>` | 待判断的数组 |
| `<right>` | 待判断的数组 |

## 返回值

返回判断结果：1：left 和 right 数组存在公共元素；0：left 和 right 数组不存在公共元素；NULL：left 或者 right 数组为 NULL；或者 left 和 right 数组中，任意元素为 NULL

## 举例

```sql
SELECT ARRAYS_OVERLAP(['a', 'b', 'c'], [1, 2, 'b']);
```

```text
+--------------------------------------------------+
| arrays_overlap(['a', 'b', 'c'], ['1', '2', 'b']) |
+--------------------------------------------------+
|                                                1 |
+--------------------------------------------------+
```
