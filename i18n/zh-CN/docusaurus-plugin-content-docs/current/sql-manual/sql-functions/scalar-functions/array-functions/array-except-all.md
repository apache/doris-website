---
{
    "title": "ARRAY_EXCEPT_ALL",
    "language": "zh-CN",
    "description": "返回两个数组的多重集差集，保留未匹配的重复元素及第一个数组的原始顺序。"
}
---

## array_except_all

<version since="dev">

</version>

## 描述

返回 `arr1` 和 `arr2` 的多重集差集。`arr2` 中的每个元素最多抵消 `arr1` 中一个相同的元素；未被抵消的元素（包括重复元素）按照 `arr1` 的原始顺序保留。数组元素中的 `NULL` 也按出现次数进行比较和抵消；如果任一输入数组为 `NULL`，则返回 `NULL`。

## 语法

```sql
ARRAY_EXCEPT_ALL(<arr1>, <arr2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<arr1>` | 第一个数组。元素必须为支持的标量类型，且必须与 `<arr2>` 的元素类型兼容。 |
| `<arr2>` | 第二个数组。其中每次出现的元素会抵消 `<arr1>` 中一个相同的元素；元素必须为支持的标量类型，且必须与 `<arr1>` 兼容。 |

支持的标量元素类型包括数值、布尔、字符串、日期时间以及 IPv4/IPv6 类型。不支持 `ARRAY`、`MAP`、`STRUCT`、`JSON` 和 `VARIANT` 等复杂元素类型。

## 返回值

返回 `ARRAY<T>`，包含 `<arr1>` 中剩余的元素，并保持其原始顺序。如果任一输入数组为 `NULL`，返回 `NULL`；如果没有剩余元素，返回空数组。

## 示例

基本多重集差集：

```sql
SELECT array_except_all([1, 1, 2, 3], [1, 3]);
```

```text
[1, 2]
```

元素按出现次数逐个抵消，未匹配的重复元素会保留：

```sql
SELECT array_except_all(['a', 'a', 'b'], ['a']);
```

```text
["a", "b"]
```

结果保持第一个数组的顺序：

```sql
SELECT array_except_all([3, 1, 3, 2], [3]);
```

```text
[1, 3, 2]
```

数组中的 `NULL` 参与多重集差集运算：

```sql
SELECT array_except_all(['a', NULL, 'a', NULL], [NULL]);
```

```text
["a", "a", null]
```

任一输入数组为 `NULL` 时返回 `NULL`：

```sql
SELECT array_except_all(CAST(NULL AS ARRAY<INT>), [1]);
```

```text
NULL
```

第二个数组为空时，第一个数组保持不变：

```sql
SELECT array_except_all([1, 1, 2], CAST([] AS ARRAY<INT>));
```

```text
[1, 1, 2]
```

与 `array_except` 不同，本函数会保留剩余的重复元素：

```sql
SELECT array_except([1, 1, 2], [1]), array_except_all([1, 1, 2], [1]);
```

```text
[2]    [1, 2]
```

不支持复杂元素类型：

```sql
SELECT array_except_all([[1], [2]], [[1]]);
```

```text
ERROR 1105 (HY000): array_except_all does not support types
```

### 关键词

ARRAY、EXCEPT、MULTISET、ARRAY_EXCEPT_ALL
