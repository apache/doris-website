---
{
    "title": "SUB_BITMAP",
    "language": "zh-CN",
    "description": "从指定位置 position 开始，截取指定个数 cardinalitylimit 的 Bitmap 元素，返回一个 Bitmap 子集。"
}
---

## 描述

从指定位置 position 开始，截取指定个数 cardinality_limit 的 Bitmap 元素，返回一个 Bitmap 子集。

## 语法

```sql
sub_bitmap(<bitmap>, <position>, <cardinality_limit>)
```

## 参数

| 参数        | 描述          |
|-----------|-------------|
| `<bitmap>` | Bitmap 值    |
| `<position>` | 范围开始的位置（包含），若为负数时，则最后一个元素为-1 |
| `<cardinality_limit>` | 基数上限        |

## 返回值

指定范围的子集 Bitmap。
- 当参数存在NULL值时，返回 NULL

## 示例

获取从位置 0 开始，基数限制为 3 的 Bitmap 子集：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 0, 3)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| 0,1,2 |
+-------+
```

获取从位置 -3 开始，基数限制为 2 的 Bitmap 子集：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), -3, 2)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| 2,3   |
+-------+
```

获取从位置 2 开始，基数限制为 100 的 Bitmap 子集：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, 100)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| 2,3,5 |
+-------+
```

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, NULL)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
