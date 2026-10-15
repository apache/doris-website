---
{
    "title": "TRIM_ARRAY 函数",
    "language": "zh-CN",
    "description": "TRIM_ARRAY 函数从数组末尾移除指定数量的元素，同时保持剩余元素的原有顺序和数组元素类型；支持空数组、NULL 元素、嵌套数组以及多种标量和复杂数据类型。"
}
---

## trim_array

<version since="dev">

</version>

## 描述

从 `<arr>` 末尾移除 `<size>` 个元素，并保持其余元素的原有顺序。

## 语法

```sql
TRIM_ARRAY(<arr>, <size>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<arr>` | 输入的 `ARRAY<T>`。`T` 可以是数值、布尔、字符串、日期时间、IP 或复杂类型。 |
| `<size>` | 非负 `BIGINT`，指定从末尾移除的元素数量，不能超过 `<arr>` 的元素个数。 |

## 返回值

返回一个 `ARRAY<T>`，包含 `<arr>` 的前 `cardinality(<arr>) - <size>` 个元素。

- `<size>` 为 `0` 时，原样返回输入数组。
- `<size>` 等于数组元素个数时，返回空数组。
- 任一参数为 `NULL` 时，返回 `NULL`。
- 数组内部的 `NULL` 元素会被保留。
- `<size>` 为负数或超过数组元素个数时，返回错误。

## 示例

从末尾移除两个元素：

```sql
SELECT trim_array([1, 2, 3, 4], 2);
```

```text
[1, 2]
```

移除数量为零时数组保持不变：

```sql
SELECT trim_array(['a', 'b', 'c'], 0);
```

```text
["a", "b", "c"]
```

移除全部元素：

```sql
SELECT trim_array([1, 2, 3], 3);
```

```text
[]
```

支持包含 `NULL` 的数组和嵌套数组：

```sql
SELECT trim_array([[1, NULL], [2, 3], [4, 5]], 1);
```

```text
[[1, null], [2, 3]]
```

参数为 `NULL` 时返回 `NULL`：

```sql
SELECT trim_array(CAST(NULL AS ARRAY<INT>), 0);
```

```text
NULL
```

移除数量超过数组元素个数时返回错误：

```sql
SELECT trim_array([1, 2, 3], 4);
```

```text
ERROR 1105 (HY000): size must not exceed array cardinality 3: 4
```

### Keywords

ARRAY, TRIM, TRIM_ARRAY
