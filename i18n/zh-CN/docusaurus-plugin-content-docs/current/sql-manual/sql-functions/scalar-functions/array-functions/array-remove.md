---
{
    "title": "ARRAY_REMOVE",
    "language": "zh-CN",
    "description": "从数组中移除与给定值相等的所有元素，保留其余元素的相对顺序。"
}
---

## 功能

从数组中移除与给定值相等的所有元素，保留其余元素的相对顺序。

## 语法

- `ARRAY_REMOVE(arr, target)`

## 参数

- `arr`：`ARRAY<T>`，支持数值、布尔、字符串、日期时间、IP 等。
- `target`：与数组元素类型一致的值，用于匹配需要移除的元素。

## 返回值

- 返回与输入同类型的 `ARRAY<T>`。
- 如果 `arr` 输入 `NULL`, 返回 `NULL`.

## 使用说明

- 匹配规则：移除与 `target` 值相等的元素；`NULL` 元素与 `NULL` 值相等。

## 示例

- 基本: 移除后的数组，保留了之前的相对顺序。
  - `ARRAY_REMOVE([1,2,3], 1)` -> `[2,3]`
  - `ARRAY_REMOVE([1,2,3,null], 1)` -> `[2,3,null]`

- `target` 为 `NULL`，移除 `arr` 中 `NULL` 
  - `ARRAY_REMOVE(['a','b','c',NULL], NULL)` -> `['a', 'b', 'c']`

- `arr` 为 `NULL`， 返回  `NULL`
  - `ARRAY_REMOVE(NULL, 2)` -> `NULL`

- 无匹配情况
  - `ARRAY_REMOVE([1,2,3], 258)` -> `[1,2,3]`


