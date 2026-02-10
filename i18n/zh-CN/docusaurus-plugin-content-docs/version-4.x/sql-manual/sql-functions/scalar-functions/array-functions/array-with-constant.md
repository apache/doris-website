---
{
    "title": "ARRAY_WITH_CONSTANT",
    "language": "zh-CN",
    "description": "ARRAYWITHCONSTANT 用于生成一个指定长度的数组，其中所有元素都为给定的值。"
}
---

## 功能

`ARRAY_WITH_CONSTANT` 用于生成一个指定长度的数组，其中所有元素都为给定的值。

## 语法

```SQL
ARRAY_WITH_CONSTANT(count, element)
```

## 参数

- `count`：整数类型，指定返回数组的长度。

- `element`： `ARRAY` 类型中支持的所有存储类型。

## 返回值

- 返回一个 `ARRAY<T>` 类型的数组，其中 `T` 是 `element` 的类型。
    - 数组中包含 `count` 个相同的 `element`。

## 使用说明

- 如果 `count = 0` 或者 `NULL`，返回空数组。
- 如果 element 为 NULL，数组中所有元素均为 NULL。
- 函数功能和 `ARRAY_REPEAT` 函数相同，参数位置相反。
- 可以与其他数组函数组合使用，实现更复杂的数据构造逻辑。

## 示例

1. 简单实例

    ```SQL
    SELECT ARRAY_WITH_CONSTANT(3, 'hello');
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(3, 'hello') |
    +---------------------------------+
    | ["hello", "hello", "hello"]     |
    +---------------------------------+
    ```

2. 异常参数
   
    ```SQL
    SELECT ARRAY_WITH_CONSTANT(0, 'hello');
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(0, 'hello') |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    SELECT ARRAY_WITH_CONSTANT(NULL, 'hello');
    +------------------------------------+
    | ARRAY_WITH_CONSTANT(NULL, 'hello') |
    +------------------------------------+
    | []                                 |
    +------------------------------------+

    SELECT ARRAY_WITH_CONSTANT(2, NULL);
    +------------------------------+
    | ARRAY_WITH_CONSTANT(2, NULL) |
    +------------------------------+
    | [null, null]                 |
    +------------------------------+

    SELECT ARRAY_WITH_CONSTANT(NULL, NULL);
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(NULL, NULL) |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    -- 返回错误：INVALID_ARGUMENT
    SELECT ARRAY_WITH_CONSTANT(-1, 'hello');
    ```
