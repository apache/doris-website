---
{
    "title": "ARRAY_REPEAT",
    "language": "zh-CN",
    "description": "ARRAYREPEAT 用于生成一个指定长度的数组，其中所有元素都为给定的值。"
}
---

## 功能

`ARRAY_REPEAT` 用于生成一个指定长度的数组，其中所有元素都为给定的值。

## 语法

```SQL
ARRAY_REPEAT(element, count)
```

## 参数

- `element`： `ARRAY` 类型中支持的所有存储类型。

- `count`：整数类型，指定返回数组的长度。

## 返回值

- 返回一个 `ARRAY<T>` 类型的数组，其中 `T` 是 `element` 的类型。
    - 数组中包含 `count` 个相同的 `element`。

## 使用说明

- 如果 `count = 0` 或者 `NULL`，返回空数组。
- 如果 element 为 NULL，数组中所有元素均为 NULL。
- 函数功能和 `ARRAY_WITH_CONSTANT` 函数相同，参数位置相反。

## 示例

1. 简单实例

    ```SQL
    SELECT ARRAY_REPEAT('hello', 3);
    +---------------------------------+
    | ARRAY_REPEAT('hello', 3) |
    +---------------------------------+
    | ["hello", "hello", "hello"]     |
    +---------------------------------+
    ```

2. 异常参数
   
    ```SQL
    SELECT ARRAY_REPEAT('hello', 0);
    +---------------------------------+
    | ARRAY_REPEAT('hello', 0) |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    SELECT ARRAY_REPEAT('hello', NULL);
    +------------------------------------+
    | ARRAY_REPEAT('hello', NULL) |
    +------------------------------------+
    | []                                 |
    +------------------------------------+

    SELECT ARRAY_REPEAT(NULL, 2);
    +------------------------------+
    | ARRAY_REPEAT(NULL, 2) |
    +------------------------------+
    | [null, null]                 |
    +------------------------------+

    SELECT ARRAY_REPEAT(NULL, NULL);
    +---------------------------------+
    | ARRAY_REPEAT(NULL, NULL) |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    -- 返回错误：INVALID_ARGUMENT
    SELECT ARRAY_REPEAT('hello', -1);
    ```
