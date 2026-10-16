---
{
    "title": "ARRAYS_OVERLAP",
    "language": "ja",
    "description": "ARRAYSOVERLAP は二つの配列に共通要素があるかを判定します。あれば true、なければ false を返します。"
}
---

## 機能

`ARRAYS_OVERLAP` は二つの配列に共通要素が一つ以上あるかを判定します。あれば `true`、なければ `false` を返します。

## 構文

```SQL
ARRAYS_OVERLAP(arr1, arr2)
```

## パラメータ

- `arr1`: 最初の配列。型は `ARRAY<T>` です。

- `arr2`: 次の配列。型は `ARRAY<T>` です。

    - 両方の配列の要素型 `T` は同じか、相互に暗黙的に変換できる必要があります。
    - 要素型 `T` には数値、文字列、日付時刻、IP、UUID 型を指定できます。

## 戻り値

- `BOOLEAN` 型を返します:

    - 両方の配列に共通要素がある場合は `true` を返します。
    - 共通要素がない場合は `false` を返します。

## 使用上の注意

1. **比較には要素の等値判定 (`=` 演算子) を使用します**。
2. **この関数では `NULL` と `NULL` を等しいとみなします** (使用例を参照)。
3. **テーブル作成文で転置インデックスを指定して実行を高速化**できます (使用例を参照)。
   - 関数を述語条件として使用すると、転置インデックスによって実行が高速化されます。
   - 関数をクエリ結果に使用する場合、転置インデックスによる高速化はありません。
4. データクレンジング、タグの照合、ユーザー行動の共通部分の分析などによく使用します。

## 使用例

1. 基本例

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

2. 無効な引数の型: サポートされない型を渡すと `INVALID_ARGUMENT` を返す

    ```SQL
    -- [INVALID_ARGUMENT] execute failed, unsupported types for function arrays_overlap
    SELECT ARRAYS_OVERLAP(ARRAY(ARRAY('hello', 'aloha'), ARRAY('hi', 'hey')), ARRAY(ARRAY('hello', 'hi', 'hey'), ARRAY('aloha', 'hi')));
    ```

3. 入力 `ARRAY` が `NULL` の場合、戻り値は `NULL`

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

4. 入力 `ARRAY` に `NULL` が含まれる場合、`NULL` と `NULL` を等しいとみなす
   
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

5. 転置インデックスを使用してクエリを高速化する
   
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

 - 関数を述語条件として使用すると、転置インデックスによって実行が高速化されます
  
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


