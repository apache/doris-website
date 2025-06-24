---
{
    "title": "ARRAY_POPFRONT",
    "language": "zh-CN"
}
---

## 描述

返回移除第一个元素后的数组，如果输入参数为 NULL，则返回 NULL

## 语法

```sql
ARRAY_POPFRONT(<arr>)
```

## 参数

| 参数 | 说明 | 
| --- | --- |
| `<arr>` | ARRAY 数组 |

## 返回值

返回移除第一个元素后的数组。特殊情况：
- 如果输入参数为 NULL，则返回 NULL


## 举例

```sql
select array_popfront(['test', NULL, 'value']);
```

```text
+-----------------------------------------------------+
| array_popfront(ARRAY('test', NULL, 'value'))        |
+-----------------------------------------------------+
| [NULL, "value"]                                       |
+-----------------------------------------------------+
```
