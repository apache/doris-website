---
{
    "title": "ARRAY_REPEAT",
    "language": "ja",
    "description": "ARRAYREPEAT は、すべての要素が指定した値である、指定した長さの配列を生成します。"
}
---

## 機能

`ARRAY_REPEAT` は、すべての要素が指定した値である、指定した長さの配列を生成します。

## 構文

```SQL
ARRAY_REPEAT(element, count)
```

## パラメータ

- `element`: `ARRAY` でサポートされる任意の格納型。

- `count`: 整数型。返す配列の長さを指定します。


## 戻り値

- `ARRAY<T>` 型の配列を返します。`T` は `element` の型です。
    - 配列には `count` 個の同じ `element` が含まれます。

## 使用上の注意

- `count = 0` または `NULL` の場合は空の配列を返します。
- `element` が `NULL` の場合、配列のすべての要素が `NULL` になります。
- この関数の機能は `ARRAY_WITH_CONSTANT` と同じですが、引数の順序が逆です。

## 使用例

1. 基本例

    ```SQL
    SELECT ARRAY_REPEAT('hello', 3);
    +---------------------------------+
    | ARRAY_REPEAT('hello', 3) |
    +---------------------------------+
    | ["hello", "hello", "hello"]     |
    +---------------------------------+
    ```

2. 特殊なケース
   
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

    -- Returns error: INVALID_ARGUMENT
    SELECT ARRAY_REPEAT('hello', -1);
    ```
