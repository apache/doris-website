---
{
    "title": "ARRAY_WITH_CONSTANT",
    "language": "ja",
    "description": "ARRAYWITHCONSTANT は、すべての要素が指定した値である、指定した長さの配列を生成します。"
}
---

## 機能

`ARRAY_WITH_CONSTANT` は、すべての要素が指定した値である、指定した長さの配列を生成します。

## 構文

```SQL
ARRAY_WITH_CONSTANT(count, element)
```

## パラメータ

- `count`: 整数型。返す配列の長さを指定します。

- `element`: `ARRAY` でサポートされる任意の格納型。

## 戻り値

- `ARRAY<T>` 型の配列を返します。`T` は `element` の型です。
    - 配列には `count` 個の同じ `element` が含まれます。

## 使用上の注意

- `count = 0` または `NULL` の場合は空の配列を返します。
- `element` が `NULL` の場合、配列のすべての要素が `NULL` になります。
- この関数の機能は `ARRAY_REPEAT` と同じですが、引数の順序が逆です。
- 他の配列関数と組み合わせて、より複雑なデータを構築できます。

## 使用例

1. 基本例

    ```SQL
    SELECT ARRAY_WITH_CONSTANT(3, 'hello');
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(3, 'hello') |
    +---------------------------------+
    | ["hello", "hello", "hello"]     |
    +---------------------------------+
    ```

2. 特殊なケース
   
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

    -- Returns error: INVALID_ARGUMENT
    SELECT ARRAY_WITH_CONSTANT(-1, 'hello');
    ```
