---
{
    "title": "ARRAY_SIZE",
    "language": "zh-CN",
    "description": "返回数组的元素个数。"
}
---

## 功能

返回数组的元素个数。

## 语法

- `ARRAY_SIZE(arr)`

## 参数

- `arr`：`ARRAY<T>`。

## 返回值

- 返回 `arr` 有多少个元素。

## 使用说明

- 输入的 `arr` 是 `NULL` 时，返回 `NULL`。

## 示例

- 数组：
  - `ARRAY_SIZE([1, 2, 3])` -> `3`
  - `ARRAY_SIZE(['a', NULL, 'b'])` -> `3`

- 输入的 `arr` 是 `NULL` 时，返回 `NULL`
  - `ARRAY_SIZE(NULL)` -> `NULL`