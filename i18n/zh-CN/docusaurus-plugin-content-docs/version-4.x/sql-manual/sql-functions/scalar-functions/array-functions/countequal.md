---
{
    "title": "COUNTEQUAL",
    "language": "zh-CN",
    "description": "统计数组中与指定目标值相等的元素个数。"
}
---

## 功能

统计数组中与指定目标值相等的元素个数。

## 语法

- `COUNTEQUAL(arr, target)`

## 参数

- `arr`：`ARRAY<T>`，支持的元素类型包括：数值、布尔、字符串、日期时间、IP。
- `target`：与 `arr` 元素类型一致。

## 返回值

- 返回 `BIGINT`，表示相等的元素个数。

## 使用说明

- 两端都是 `NULL` 视为相等，会被计数。

## 示例

- 基本
  - `COUNTEQUAL([1,2,3,2], 2)` -> `2`
  - `COUNTEQUAL(['a','b','a'], 'a')` -> `2`
  - `COUNTEQUAL([true,false,false], false)` -> `2`

- `NULL` 视为相等，会被计数
  - `COUNTEQUAL([1,NULL,2,NULL], NULL)` -> `2`
  - `COUNTEQUAL([1,NULL,1], 1)` -> `2`
  - `COUNTEQUAL([1, 2], NULL)` -> `0`

- 数组是 `NULL`，返回 `NULL`
  - `COUNTEQUAL(NULL, 1)` -> `NULL`


