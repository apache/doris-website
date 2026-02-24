---
{
    "title": "ARRAYS_RANGE",
    "language": "zh-CN",
    "description": "生成数值或日期时间的等差序列数组。"
}
---

## 功能

生成数值或日期时间的等差序列数组。
- 对于数值类型，默认差值为 1
- 对于日期时间类型，默认差值为 1 天

## 语法

- `ARRAY_RANGE(end)`
- `ARRAY_RANGE(start, end)`
- `ARRAY_RANGE(start, end, step)`
- `ARRAY_RANGE(start_dt, end_dt)`
- `ARRAY_RANGE(start_dt, end_dt, interval step unit)`

## 参数

- `start`、`end`：非负整数。`end` 为上界，结果不包含 `end` 本身。
- `step`：必须是正整数，步长，默认 1。
- `start_dt`、`end_dt`：DATETIME。两参形式默认步长为 1 DAY。
- `interval step unit`：日期时间步长，`unit` 取 `YEAR|QUARTER|MONTH|WEEK|DAY|HOUR|MINUTE|SECOND`，`step` 必须为正整数。

## 返回值

- 返回 `ARRAY<T>`；当参数非法时返回 `NULL`；当范围为空时返回空数组 `[]`。
- 数组元素类型 `T` 与输入一致：整型返回 `INT`，日期时间返回 `DATETIME`。

## 使用说明

- 数值序列：从 `start` 开始，按 `step` 递增，直到但不包含 `end`（即左闭右开）。
- 日期时间序列：从 `start_dt` 开始，按给定 `unit` 的 `step` 递增，直到但不包含 `end_dt`；两参形式等价于 `interval 1 day`。
- 非法参数返回 `NULL`：
  - 数值：`start < 0`、`end < 0`、`step <= 0`。
  - 日期时间：`start_dt` 或 `end_dt` 非法，或 `step <= 0`。
- `ARRAY_RANGE` 和 `SEQUENCE` 函数功能一致。

## 示例

- 数值: `start` 默认从0 开始，`step`默认为 1
  - `ARRAY_RANGE(5)` -> `[0, 1, 2, 3, 4]`
  - `ARRAY_RANGE(0, 5)` -> `[0, 1, 2, 3, 4]`

- 数值：`end` 为上界，不在结果之内。
  - `ARRAY_RANGE(2, 6, 2)` -> `[2, 4]`
  - `ARRAY_RANGE(3, 3)` -> `[]`

- 数值：`end` 必须大于等于 `start`，否则返回 `[]`
   - `ARRAY_RANGE(3, 2)` -> `[]`

- 数值：`start`、`end` 参数必须为非负正数，`step`必须大于 0。
  - `ARRAY_RANGE(-1, 3)` -> `NULL`
  - `ARRAY_RANGE(1, 3, 0)` -> `NULL`

- 日期时间: `step` 默认是 1 day。
  - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-17 12:00:00')` -> `['2022-05-15 12:00:00', '2022-05-16 12:00:00']`
  - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-17 12:00:00', interval 1 day)` -> `['2022-05-15 12:00:00', '2022-05-16 12:00:00']`

- 日期时间:`unit` 取 `YEAR|QUARTER|MONTH|WEEK|DAY|HOUR|MINUTE|SECOND`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2024-05-17 12:00:00', interval 1 year)` -> `["2022-05-15 12:00:00", "2023-05-15 12:00:00"]`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2023-05-17 12:00:00', interval 1 quarter);` -> `["2022-05-15 12:00:00", "2022-08-15 12:00:00", "2022-11-15 12:00:00", "2023-02-15 12:00:00"] `
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-07-17 12:00:00', interval 1 month);` -> `["2022-05-15 12:00:00", "2022-06-15 12:00:00"]`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-17 12:00:00', interval 1 day)` -> `['2022-05-15 12:00:00', '2022-05-16 12:00:00']`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-15 14:00:00', interval 1 hour)` -> `["2022-05-15 12:00:00", "2022-05-15 13:00:00"]`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-15 12:02:00', interval 1 minute)` -> `["2022-05-15 12:00:00", "2022-05-15 12:01:00"]`
   - `ARRAY_RANGE('2022-05-15 12:00:00', '2022-05-15 12:00:02', interval 1 second)` -> `["2022-05-15 12:00:00", "2022-05-15 12:00:01"]`
