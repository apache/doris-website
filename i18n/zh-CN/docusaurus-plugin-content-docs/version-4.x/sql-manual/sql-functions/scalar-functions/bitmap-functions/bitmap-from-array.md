---
{
    "title": "BITMAP_FROM_ARRAY",
    "language": "zh-CN",
    "description": "将一个 TINYINT/SMALLINT/INT/BIGINT 类型的数组转化为一个 BITMAP，当输入字段不合法时，结果返回 NULL"
}
---

## 描述

将一个 TINYINT/SMALLINT/INT/BIGINT 类型的数组转化为一个 BITMAP，当输入字段不合法时，结果返回 NULL

## 语法

```sql
BITMAP_FROM_ARRAY(<arr>)
```

## 参数

| 参数      | 说明   |
|---------|------|
| `<arr>` | 整形数组 |

## 返回值

返回一个 BITMAP
- 当输入字段不合法时，结果返回 NULL

## 举例

```sql
SELECT bitmap_to_string(bitmap_from_array(array(1, 0, 1, 1, 0, 1, 0))) AS bs;
```

```text
+------+
| bs   |
+------+
| 0,1  |
+------+
```

```sql
SELECT bitmap_to_string(bitmap_from_array(NULL)) AS bs;
```

```text
+------+
| bs   |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_array([1,2,3,-1]));
```

```text
+-------------------------------------------------+
| bitmap_to_string(bitmap_from_array([1,2,3,-1])) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```
