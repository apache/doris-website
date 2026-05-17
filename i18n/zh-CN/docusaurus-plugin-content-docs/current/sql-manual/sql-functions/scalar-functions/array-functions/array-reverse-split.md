---
{
    "title": "ARRAY_REVERSE_SPLIT",
    "language": "zh-CN",
    "description": "按给定的布尔标记把输入的数组切分为多个子数组。"
}
---

## 功能

按给定的布尔标记把输入的数组切分为多个子数组。

- 切分规则（从前向后）：对 `arr=[a1,a2,...,an]` 与 `flags=[f1,f2,...,fn]`，在每个 `fi==true` 的位置，于 `ai` 与 `a(i+1)` 之间断开。
  - 例如 `arr=[3, 4, 5]`,`flags=[false, true, false]`, `flags` 第二个为true，在第二个元素和第三元素之间断开，分成两个子数组 `[3, 4]` 和 `[5]`。

## 语法

- `ARRAY_REVERSE_SPLIT(arr, flags)`
- `ARRAY_REVERSE_SPLIT(lamda, arr0, ...)`
- `ARRAY_REVERSE_SPLIT(lambda, arr0, ...)` 相当于  `ARRAY_REVERSE_SPLIT(arr0, ARRAY_MAP(lambda, arr0, ...))`

## 参数

- `arr`：`ARRAY<T>`。
- `flags`：`ARRAY<BOOLEAN>`，长度需与 `arr` 的长度逐行一致。`true` 表示在当前位置与下一元素之间断开。
- `arr0, ...` 一个或多个 `ARRAY<T>`。
- `lambda`: `lambda` 表达式作用于 `arr0, ...` 产生`flags`，利用产生的 `flags` 进行分割。

## 返回值

- 返回 `ARRAY<ARRAY<T>>`。内层数组元素与 `arr` 一致。
- 若`arr` 与 `flags` 的元素个数不一致，将报错。

## 使用说明

- 如果 `flags` 的某位置为 `NULL`，视为不切分（与 `false` 等价）。
- `ARRAY_REVERSE_SPLIT` 的切分规则是：在每个 `fi==true` 的位置，于 `ai` 与 `a(i+1)` 之间断开。
- `ARRAY_SPLIT` 的切分规则是：在每个 `fi==true` 的位置，于 `ai` 与 `a(i-1)` 之间断开。

## 示例

- 基本切分: 在每个 `true` 的位置，与右侧元素断开。
  - `ARRAY_REVERSE_SPLIT([1,2,3,4,5], [false,true,false,true,false])` -> `[[1,2], [3,4], [5]]`
  - `ARRAY_REVERSE_SPLIT(['a','b','c'], [false,false,false])` -> `[['a','b','c']]`

- `flags` 中包含 `NULL`， `NULL` 被认为和 `false` 一样，不切分。
  - `ARRAY_REVERSE_SPLIT([1,NULL,3], [false,null,false])` -> `[[1,[NULL,3]]`

- `lambda= x -> x-1` 作用于 `arr=[1, 2, 3]` 产生 `flags=[0,1,2]`，相当于 `flags=[false,true,true]`
  - `ARRAY_REVERSE_SPLIT(x->x-1, [1, 2, 3])` 相当于 `ARRAY_REVERSE_SPLIT([1, 2, 3], [false,true,true])` -> `[[1, 2], [3]]`

- `lambda= (x,y) -> x-y` 作用于 `arr=[1, 2, 3]` 和 `arr1=[0,1,2]`, 产生 `flags=[true,true,true]`
  - `ARRAY_REVERSE_SPLIT((x,y) -> x-y, [1, 2, 3], [0, 1, 2])` 相当于 `ARRAY_REVERSE_SPLIT([1, 2, 3], [true,true,true])` -> `[[1], [2], [3]]`