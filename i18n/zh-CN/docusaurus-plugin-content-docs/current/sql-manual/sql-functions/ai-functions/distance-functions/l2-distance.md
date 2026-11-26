---
{
    "title": "L2_DISTANCE",
    "language": "zh-CN",
    "description": "计算欧几里得空间中两点（向量值为坐标）之间的距离"
}
---

## 描述

计算欧几里得空间中两点（向量值为坐标）之间的距离

dev 版本的数组输入支持缺失向量：整个数组为 `NULL` 或空数组 `[]` 时返回 `NULL`；非法输入的处理见返回值说明。

## 语法

```sql
L2_DISTANCE(<array1>, <array2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<array1>` | 第1个向量，类型为 `ARRAY<FLOAT>`，其他数值数组可转换为此类型。允许整个数组为 `NULL` 或空数组 `[]`；非空数组不能包含 `NULL` 元素。 |
| `<array2>` | 第2个向量，类型为 `ARRAY<FLOAT>`，其他数值数组可转换为此类型。允许整个数组为 `NULL` 或空数组 `[]`；非空数组不能包含 `NULL` 元素。 |

两个数组都非空时，元素个数必须一致。

## 返回值

返回两个向量的欧几里得距离，类型为可空的 `FLOAT`。dev 版本的数组输入遵循以下规则：

- 任一数组整体为 `NULL` 或空数组 `[]` 时，返回 `NULL`，包括 `NULL` 与 `NULL`、`[]` 与 `[]` 的组合。
- 非空数组包含 `NULL` 元素时，报错；另一参数为 `NULL` 或 `[]` 不会使这个非法数组变为有效输入。
- 两个数组都非空但元素个数不一致时，报错。

这些标量计算规则不依赖 `enable_ann_index_empty_array` 配置；该配置仅控制 ANN 索引列是否接受空数组写入。

## 举例

```sql
SELECT L2_DISTANCE([4, 5], [6, 8]),L2_DISTANCE([3, 6], [4, 5]);
```

```text
+-----------------------------+-----------------------------+
| l2_distance([4, 5], [6, 8]) | l2_distance([3, 6], [4, 5]) |
+-----------------------------+-----------------------------+
|                    3.605551 |                    1.414214 |
+-----------------------------+-----------------------------+
```


如果输入数组包含 `NULL` 元素，函数会报错：

```sql
SELECT L2_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l2_distance cannot have null
```

以下示例无需创建表，展示 dev 版本的空数组与 NULL 输入行为：

```sql
SELECT L2_DISTANCE(CAST([] AS ARRAY<FLOAT>), [1, 2]) AS empty_result,
       L2_DISTANCE(CAST(NULL AS ARRAY<FLOAT>), [1, 2]) AS null_result;
```

```text
+--------------+-------------+
| empty_result | null_result |
+--------------+-------------+
|         NULL |        NULL |
+--------------+-------------+
```
