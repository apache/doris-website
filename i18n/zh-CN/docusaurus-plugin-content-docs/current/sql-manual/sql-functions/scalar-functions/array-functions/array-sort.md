---
{
    "title": "ARRAY_SORT",
    "language": "zh-CN"
}
---

## 功能

对数组元素按升序排序。

## 语法

- `ARRAY_SORT(arr)`

## 参数

- `arr`：`ARRAY<T>`，`T` 可为数值、布尔、字符串、日期时间、IP 等。

## 返回值

- 返回与输入同类型的 `ARRAY<T>`。
- `NULL` 元素放在返回的数组最前面。

## 使用说明

- 若输入为 `NULL`，返回 `NULL`; 若输入为空数组 `[]`，返回空数组。
- `ARRAY_SORT` 是升序排序，`ARRAY_REVERSE_SORT` 是降序排序。

## 示例

- 基本: `NULL` 元素放在返回的数组最后面
  - `ARRAY_SORT([2,1,3,null])` -> `[null, 1, 2, 3]`

- 输入为 `NULL`，返回 `NULL`; 输入为空数组 `[]`，返回空数组。
  - `ARRAY_SORT(NULL)` -> `NULL`
  - `ARRAY_SORT([])` -> `[]`


