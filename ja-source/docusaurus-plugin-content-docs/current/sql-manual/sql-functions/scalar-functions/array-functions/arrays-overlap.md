---
{
  "title": "ARRAYS_OVERLAP",
  "language": "ja",
  "description": "ARRAYSOVERLAPは、2つの配列が少なくとも1つの共通要素を持つかどうかを◊するために使用されます。共通要素がある場合はtrueを返し、そうでなければfalseを返します。"
}
---
## Function

`ARRAYS_OVERLAP`は、2つの配列が少なくとも1つの共通要素を持つかどうかを◊するために使用されます。共通要素がある場合は`true`を返し、そうでなければ`false`を返します。

## Syntax

```SQL
ARRAYS_OVERLAP(arr1, arr2)
```
## パラメータ

- `arr1`: 最初の配列、型 `ARRAY<T>`。

- `arr2`: 2番目の配列、型 `ARRAY<T>`。

    - 両方の配列の要素型 `T` は同じか、互いに暗黙的に変換可能である必要があります。
    - 要素型 `T` は数値、文字列、日付/時刻、またはIP型が使用できます。

## 戻り値

- `BOOLEAN` 型を返します：

    - 2つの配列に共通部分がある場合、`true` を返します；
    - 共通部分がない場合、`false` を返します。

## 使用上の注意

1. **比較は要素の等価性（`=` 演算子）を使用して行われます**。
2. **この関数では `NULL` と `NULL` は等しいものとして扱われます**（例を参照）。
3. **実行を高速化するために、テーブル作成文で転置インデックスを指定できます**（例を参照）。
   - 関数が述語条件として使用される場合、転置インデックスが実行を高速化します。
   - 関数がクエリ結果で使用される場合、転置インデックスは実行を高速化しません。
4. データクレンジング、タグマッチング、ユーザー行動の共通部分抽出シナリオでよく使用されます。

## 例

1. 簡単な例

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('hello', 'aloha'), ARRAY('hello', 'hi', 'hey'));
    +----------------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('hello', 'aloha'), ARRAY('hello', 'hi', 'hey')) |
    +----------------------------------------------------------------------+
    |                                                                    1 |
    +----------------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY('Pinnacle', 'aloha'), ARRAY('hi', 'hey'));
    +----------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('Pinnacle', 'aloha'), ARRAY('hi', 'hey')) |
    +----------------------------------------------------------------+
    |                                                              0 |
    +----------------------------------------------------------------+
    ```
2. 無効なパラメータ型: サポートされていない型が渡された場合、`INVALID_ARGUMENT`を返す

    ```SQL
    -- [INVALID_ARGUMENT] execute failed, unsupported types for function arrays_overlap
    SELECT ARRAYS_OVERLAP(ARRAY(ARRAY('hello', 'aloha'), ARRAY('hi', 'hey')), ARRAY(ARRAY('hello', 'hi', 'hey'), ARRAY('aloha', 'hi')));
    ```
3. 入力`ARRAY`が`NULL`の場合、戻り値は`NULL`です

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), NULL);
    +-----------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), NULL) |
    +-----------------------------------------------+
    |                                          NULL |
    +-----------------------------------------------+

    SELECT ARRAYS_OVERLAP(NULL, NULL);
    +----------------------------+
    | ARRAYS_OVERLAP(NULL, NULL) |
    +----------------------------+
    |                        NULL |
    +----------------------------+
    ```
4. 入力`ARRAY`が`NULL`を含む場合、`NULL`と`NULL`は等しいとみなされます

   ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), ARRAY('HELLO', NULL));
    +---------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), ARRAY('HELLO', NULL)) |
    +---------------------------------------------------------------+
    |                                                             1 |
    +---------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY('PICKLE', 'ALOHA'), ARRAY('HELLO', NULL));
    +----------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('PICKLE', 'ALOHA'), ARRAY('HELLO', NULL)) |
    +----------------------------------------------------------------+
    |                                                             0  |
    +----------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY(NULL), ARRAY('HELLO', NULL));
    +---------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY(NULL), ARRAY('HELLO', NULL)) |
    +---------------------------------------------------+
    |                                                 1 |
    +---------------------------------------------------+
    ```
5. 転置インデックスを使用したクエリの高速化

    ```SQL
    -- Create table with inverted index
    CREATE TABLE IF NOT EXISTS arrays_overlap_table (
        id INT,
        array_column ARRAY<STRING>,
        INDEX idx_array_column (array_column) USING INVERTED -- only non-tokenized inverted indexes are allowed
    ) ENGINE=OLAP
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
    "replication_num" = "1"
    );

    -- Insert two rows
    INSERT INTO arrays_overlap_table (id, array_column) VALUES (1, ARRAY('HELLO', 'ALOHA')), (2, ARRAY('NO', 'WORLD'));
    ```
- 関数が述語条件として使用される場合、転置インデックスが実行を高速化します

    ```SQL
    SELECT * from arrays_overlap_table WHERE ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')); 
    +------+--------------------+
    | id   | array_column       |
    +------+--------------------+
    |    1 | ["HELLO", "ALOHA"] |
    +------+--------------------+

- When the function is used in the query result, the inverted index will not accelerate execution
  
    ```SQL
SELECT ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) FROM arrays_overlap_table;
    +--------------------------------------------------------+
    | ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) |
    +--------------------------------------------------------+
    |                                                      1 |
    |                                                      0 |
    +--------------------------------------------------------+

    ```
