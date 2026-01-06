---
{
    "title": "ARRAY_REVERSE_SORT",
    "language": "zh-CN",
    "description": "对数组元素按降序排序。"
}
---

## 功能

对数组元素按降序排序。

## 语法

- `ARRAY_REVERSE_SORT(arr)`

## 参数

- `arr`：`ARRAY<T>`，`T` 可为数值、布尔、字符串、日期时间、IP 等。

## 返回值

- 返回与输入同类型的 `ARRAY<T>`。
- `NULL` 元素放在返回的数组最后面。

## 使用说明

- 若输入为 `NULL`，返回 `NULL`; 若输入为空数组 `[]`，返回空数组。
- `ARRAY_REVERSE_SORT` 是降序排序, `ARRAY_SORT` 是升序排序。

## 示例

- 基本: `NULL` 元素放在返回的数组最后面
  - `ARRAY_REVERSE_SORT([1,2,3,null])` -> `[3,2,1,null]`

- 输入为 `NULL`，返回 `NULL`; 输入为空数组 `[]`，返回空数组。
  - `ARRAY_REVERSE_SORT(NULL)` -> `NULL`
  - `ARRAY_REVERSE_SORT([])` -> `[]`


