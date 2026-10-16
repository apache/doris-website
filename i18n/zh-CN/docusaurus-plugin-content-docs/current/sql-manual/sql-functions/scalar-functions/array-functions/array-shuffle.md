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
- `seed`：可选，表示随机数种子，必须是 `BIGINT` 类型的常量。

## 返回值

- 返回与输入同类型的数组，元素被随机重排，元素数量与类型均保持不变。

## 使用说明

- 输入的 `arr` 是 `NULL` 时，返回 `NULL`；`seed` 是 `NULL` 时，也返回 `NULL`。
- 每一行都会单独打乱，`arr` 是常量时也一样，所以相同的数组在不同行可能得到不同的顺序。
- `seed` 必须是常量，例如 `0` 或 `1 + 1`。传入列或其他非常量表达式会报错。
- `seed` 可以是任意 `BIGINT` 值，包括负数。64 位全部参与计算，所以 `-1` 和 `4294967295` 的结果不同。
- 数据按批处理。每一批都从 `seed` 开始生成一个随机数序列，批内的行依次使用这个序列。因此像 `ARRAY_SHUFFLE([1, 2, 3, 4], 0)` 这样的单次调用每次结果都相同；但在多行数据上，某一行的结果可能随数据的分批方式而变化。
- 不指定 `seed` 时，每一批都使用新的随机种子，每次执行结果可能不同。
- `ARRAY_SHUFFLE`的函数别名是 `SHUFFLE`，两个函数功能一致。

## 示例

- 基本用法：
  - `ARRAY_SHUFFLE([1, 2, 3, 4])` -> 例如 `[3, 1, 4, 2]`（顺序随机）
  - `ARRAY_SHUFFLE(['a', null, 'b'])` -> 例如 `['b', 'a', null]`

- 指定种子（结果可复现）：
  - `ARRAY_SHUFFLE([1, 2, 3, 4], 0)` -> 每次执行都得到 `[2, 1, 3, 4]`

- 常量数组也会逐行打乱：
  - `SELECT number, ARRAY_SHUFFLE([1, 2, 3, 4, 5], 0) FROM numbers("number" = "3") ORDER BY number` -> 三行依次为 `[3, 1, 2, 4, 5]`、`[3, 5, 4, 2, 1]`、`[4, 5, 1, 3, 2]`

- 负数种子也可以使用，并且 64 位全部参与计算：
  - `ARRAY_SHUFFLE([1, 2, 3, 4], -1)` -> `[4, 1, 3, 2]`，而 `ARRAY_SHUFFLE([1, 2, 3, 4], 4294967295)` -> `[2, 4, 3, 1]`

- 非常量的种子会报错：
  - `SELECT ARRAY_SHUFFLE(arr, id) FROM t` -> 报错 `The seed of array_shuffle must be a constant`
