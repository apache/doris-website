---
{
  "title": "ARRAY_WITH_CONSTANT",
  "language": "ja",
  "description": "ARRAYWITHCONSTANTは、すべての要素が指定された値を持つ、指定された長さの配列を生成するために使用されます。"
}
---
## 関数

`ARRAY_WITH_CONSTANT`は、指定された長さの配列を生成するために使用され、すべての要素が与えられた値を持ちます。

## 構文

```SQL
ARRAY_WITH_CONSTANT(count, element)
```
## パラメータ

- `count`: Integer型、戻り配列の長さを指定します。

- `element`: `ARRAY`でサポートされている任意のストレージ型。

## 戻り値

- `ARRAY<T>`型の配列を返します。ここで`T`は`element`の型です。
    - 配列には同じ`element`の`count`個のコピーが含まれます。

## 使用上の注意

- `count = 0`または`NULL`の場合、空の配列を返します。
- `element`が`NULL`の場合、配列内のすべての要素が`NULL`になります。
- この関数は`ARRAY_REPEAT`と同じ機能を持ちますが、パラメータの順序が逆になっています。
- 他の配列関数と組み合わせて、より複雑なデータを構築することができます。

## 例

1. 簡単な例

    ```SQL
    SELECT ARRAY_WITH_CONSTANT(3, 'hello');
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(3, 'hello') |
    +---------------------------------+
    | ["hello", "hello", "hello"]     |
    +---------------------------------+
    ```
2. 特殊ケース

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
