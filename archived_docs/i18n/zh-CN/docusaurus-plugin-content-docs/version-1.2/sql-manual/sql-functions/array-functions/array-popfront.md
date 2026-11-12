---
{
    "title": "ARRAY_POPFRONT",
    "language": "zh-CN"
}
---

## array_popfront

<version since="1.2.3">

array_popfront
</version>

## 描述

## 语法

`ARRAY<T> array_popfront(ARRAY<T> arr)`

返回移除第一个元素后的数组，如果输入参数为NULL，则返回NULL

## 注意事项

`仅支持向量化引擎中使用`

## 举例

```
mysql> select array_popfront(['test', NULL, 'value']);
+-----------------------------------------------------+
| array_popfront(ARRAY('test', NULL, 'value'))        |
+-----------------------------------------------------+
| [NULL, value]                                       |
+-----------------------------------------------------+
```

### keywords

ARRAY,POPFRONT,ARRAY_POPFRONT
