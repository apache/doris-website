---
{
    "title": "ARRAY_SHUFFLE",
    "language": "zh-CN",
    "description": "ARRAYSHUFFLE 用来随机打乱数组内元素的顺序。"
}
---

## 功能

`ARRAY_SHUFFLE` 用来随机打乱数组内元素的顺序。

## 语法

- `ARRAY_SHUFFLE(arr)`
- `ARRAY_SHUFFLE(arr, seed)`

## 参数

- `arr`：`ARRAY<T>`。
- `seed`：可选，表示随机数种子。

## 返回值

- 返回与输入同类型的数组，元素被随机重排，元素数量与类型均保持不变。

## 使用说明

- 输入的 `arr` 是 `NULL` 时，返回 `NULL`。
- 指定 `seed` 可获得可复现结果；不指定则每次执行结果可能不同。
- `ARRAY_SHUFFLE`的函数别名是 `SHUFFLE`，两个函数功能一致。
- 

## 示例

- 基本用法：
  - `ARRAY_SHUFFLE([1, 2, 3, 4])` -> 例如 `[3, 1, 4, 2]`（顺序随机）
  - `ARRAY_SHUFFLE(['a', null, 'b'])` -> 例如 `['b', 'a', null]`

- 指定种子（结果可复现）：
  - `ARRAY_SHUFFLE([1, 2, 3, 4], 0)` -> 每次执行均得到相同顺序（如 `[1, 3, 2, 4]`）