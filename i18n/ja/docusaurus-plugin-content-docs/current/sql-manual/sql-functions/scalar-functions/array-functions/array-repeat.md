---
{
  "title": "ARRAY_REPEAT",
  "language": "ja",
  "description": "ARRAYREPEATは、指定された長さの配列を生成するために使用され、すべての要素が与えられた値を持ちます。"
}
---
## 関数

`ARRAY_REPEAT`は、すべての要素が指定された値を持つ、指定された長さの配列を生成するために使用されます。

## 構文

```SQL
ARRAY_REPEAT(element, count)
```
## パラメータ

- `element`: `ARRAY`でサポートされている任意のストレージタイプ。

- `count`: Integer型、返される配列の長さを指定します。


## 戻り値

- `ARRAY<T>`型の配列を返します。ここで`T`は`element`の型です。
    - 配列には同じ`element`の`count`個のコピーが含まれます。

## 使用上の注意

- `count = 0`または`NULL`の場合、空の配列を返します。
- `element`が`NULL`の場合、配列内のすべての要素が`NULL`になります。
- この関数は`ARRAY_WITH_CONSTANT`と同じ機能を持ちますが、パラメータの順序が逆になっています。

## 例

1. 簡単な例

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
