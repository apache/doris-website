---
{
    "title": "ARRAY_POPBACK",
    "language": "zh-CN"
}
---

## array_popback

array_popback

## 描述

## 语法

`ARRAY<T> array_popback(ARRAY<T> arr)`

返回移除最后一个元素后的数组，如果输入参数为NULL，则返回NULL

## 举例

```
mysql> select array_popback(['test', NULL, 'value']);
+-----------------------------------------------------+
| array_popback(ARRAY('test', NULL, 'value'))         |
+-----------------------------------------------------+
| [test, NULL]                                        |
+-----------------------------------------------------+
```

### keywords

ARRAY,POPBACK,ARRAY_POPBACK
