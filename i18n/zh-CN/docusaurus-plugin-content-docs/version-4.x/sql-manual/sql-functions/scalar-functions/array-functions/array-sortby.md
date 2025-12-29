---
{
    "title": "ARRAY_SORTBY",
    "language": "zh-CN",
    "description": "依据 key数组的顺序对 value数组进行排序。"
}
---

## 功能

依据 `key数组`的顺序对 `value数组`进行排序。
- 例如 `key数组` 是 `[3, 0, 2]`， `value数组` 是 `[5, 7, 8]`，排序后的 `key数组` 是 `[0, 2, 3]`，对应的 `value数组` 是 `[7, 8, 5]`。

## 语法

- `ARRAY_SORTBY(values, keys)`
- `ARRAY_SORTBY(lambda, values)`
- `ARRAY_SORTBY(lambda, values)` 相当于 `ARRAY_SORTBY(values, ARRAY_MAP(lambda, values))`

## 参数

- `values`：`ARRAY<T>`，要排序的 value 数组，`T`只支持：数值，布尔，字符串，时间日期，IP 等类型。
- `keys`：`ARRAY<T>`，与 `arr` 等长的 key 数组，`T`只支持：数值，布尔，字符串，时间日期，IP 等类型。
- `lambda`: `lambda` 表达式作用于 `values`, 产生 `key 数组`，利用产生的 `key 数组` 进行排序。

## 返回值

- 返回与 `values` 同类型的 `ARRAY<T>`。
- 当某行 `arr` 与 `keys` 的元素个数不等时报错。

## 使用说明

- 排序稳定性：以`keys`的升序重排 `values`，`keys`中相等键的相对次序未定义。
- 高阶调用会先用 `ARRAY_MAP` 计算`keys`，再按`keys`对 `values` 排序。

## 示例

- 基本用法: 先对 `keys` 进行升序排序，再对 `values` 按照对应的 `keys` 排序。
  - `ARRAY_SORTBY([10,20,30], [3,1,2])` -> `[20,30,10]`
  - `ARRAY_SORTBY(['a','b','c'], [2,2,1])` -> `['c','a','b]`

- 高阶用法：先执行 `lambda` 表达式产生 `keys`，然后再排序。
  - `ARRAY_SORTBY(x -> x + 1, [3,1,2])` -> `[1,2,3]` （ `key`为 `[4,2,3]`）
  - `ARRAY_SORTBY(x -> x*2 <= 2, [1,2,3])` -> `[1,2,3]`（ `key`为 `[true,false,false]`）

- 当 `keys` 或者 `values` 为 `NULL` 时，返回 `values` 保持不变。
  - `array_sortby([10,20,30], NULL)` -> `[10, 20, 30]`
  - `array_sortby(NULL, [2,3])` -> `NULL`

