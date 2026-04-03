---
{
  "title": "ARRAY | 半構造化",
  "sidebar_label": "ARRAY",
  "description": "ARRAY<T>型は、各要素が同じデータ型を持つ要素の順序付きコレクションを表現するために使用されます。例えば、",
  "language": "ja"
}
---
# ARRAY ドキュメント

## 型の説明

`ARRAY<T>`型は、各要素が同じデータ型を持つ要素の順序付きコレクションを表すために使用されます。例えば、整数の配列は`[1, 2, 3]`として表現でき、文字列の配列は`["a", "b", "c"]`として表現できます。

- `ARRAY<T>`は型Tの要素で構成される配列を表し、Tはnullableです。Tでサポートされる型には以下が含まれます：`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, CHAR, VARCHAR, STRING, IPV4, IPV6, STRUCT, MAP, VARIANT, JSONB, ARRAY<T>`。
  - 注意：上記のT型のうち、`JSONB`と`VARIANT`はDorisの計算層でのみサポートされ、**Dorisでのtable作成において`ARRAY<JSONB>`と`ARRAY<VARIANT>`の使用はサポートされていません**。

## 型の制約

- `ARRAY<T>`型でサポートされる最大ネスト深度は9です。
- `ARRAY<T>`型間の変換は、Tが変換可能かどうかに依存します。`Array<T>`型は他の型に変換することはできません。
  - 例：`ARRAY<INT>`は`ARRAY<BIGINT>`に変換できます。これは`INT`と`BIGINT`が変換可能であるためです。
  - `Variant`型は`Array<T>`型に変換できます。
  - String型は`ARRAY<T>`型に変換できます（パースによって、パースに失敗した場合はNULLを返します）。
- `AGGREGATE`tableモデルにおいて、`ARRAY<T>`型は`REPLACE`と`REPLACE_IF_NOT_NULL`のみをサポートします。**すべてのtableモデルにおいて、KEYカラム、パーティションカラム、バケットカラムとして使用することはできません**。
- `ARRAY<T>`型のカラムは**`ORDER BY`と`GROUP BY`操作をサポートします**。
  - `ORDER BY`と`GROUP BY`をサポートするT型には以下が含まれます：`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, CHAR, VARCHAR, STRING, IPV4, IPV6`。
- `ARRAY<T>`型のカラムは`JOIN KEY`として使用することをサポートせず、`DELETE`文での使用もサポートしません。

## 定数の構築

- `ARRAY()`関数を使用して`ARRAY<T>`型の値を構築します。ここでTはパラメータの共通型です。

    ```SQL
    -- [1, 2, 3] T is INT
    SELECT ARRAY(1, 2, 3);

    -- ["1", "2", "abc"] , T is STRING
    SELECT ARRAY(1, 2, 'abc');
    ```
- `[]`を使用して`ARRAY<T>`型の値を構築します。ここでTはパラメータの共通型です。

   ```SQL
    -- ["abc", "def", "efg"] T is STRING
    SELECT ["abc", "def", "efg"];

    -- ["1", "2", "abc"] , T is STRING
    SELECT [1, 2, 'abc'];
    ```
## タイプ の変更

- `ARRAY` 内の要素タイプが `VARCHAR` の場合のみ変更が許可されます。
   - `VARCHAR` のパラメータを小さい値から大きい値への変更のみ許可され、逆方向は許可されません。

    ```SQL
    CREATE TABLE `array_table` (
      `k` INT NOT NULL,
      `array_column` ARRAY<VARCHAR(10)>
    ) ENGINE=OLAP
    DUPLICATE KEY(`k`)
    DISTRIBUTED BY HASH(`k`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1"
    );

    ALTER TABLE array_table MODIFY COLUMN array_column ARRAY<VARCHAR(20)>;
    ```
- `ARRAY<T>`型のカラムのデフォルト値はNULLとしてのみ指定でき、一度指定すると変更できません。

## Element Access

- `ARRAY<T>`のk番目の要素にアクセスするには`[k]`を使用します。kは1から始まります。範囲外の場合、NULLを返します。

  ```SQL
  SELECT [1, 2, 3][1];
    +--------------+
    | [1, 2, 3][1] |
    +--------------+
    |            1 |
    +--------------+

  SELECT ARRAY(1, 2, 3)[2];
    +-------------------+
    | ARRAY(1, 2, 3)[2] |
    +-------------------+
    |                 2 |
    +-------------------+

  SELECT [[1,2,3],[2,3,4]][1][3];
    +-------------------------+
    | [[1,2,3],[2,3,4]][1][3] |
    +-------------------------+
    |                       3 |
    +-------------------------+
  ```
- `ARRAY<T>`のk番目の要素にアクセスするには`ELEMENT_AT(ARRAY, k)`を使用します。ここでkは1から始まります。範囲外の場合はNULLを返します。

  ```SQL
  SELECT ELEMENT_AT(ARRAY(1, 2, 3) , 2);
  +--------------------------------+
  | ELEMENT_AT(ARRAY(1, 2, 3) , 2) |
  +--------------------------------+
  |                              2 |
  +--------------------------------+

  SELECT ELEMENT_AT([1, 2, 3] , 3);
  +---------------------------+
  | ELEMENT_AT([1, 2, 3] , 3) |
  +---------------------------+
  |                         3 |
  +---------------------------+

  SELECT ELEMENT_AT([["abc", "def"], ["def", "gef"], [3]] , 3);                      
  +-------------------------------------------------------+
  | ELEMENT_AT([["abc", "def"], ["def", "gef"], [3]] , 3) |
  +-------------------------------------------------------+
  | ["3"]                                                 |
  +-------------------------------------------------------+
  ```
## 比較関係

ARRAYは順序付きの型であり、[1, 2, 3]と[3, 2, 1]は2つの異なるARRAYです。2つのARRAYが等しいのは、それらの要素が順序通りに一つずつ等しい場合のみです：

```sql
select array(1,2,3) = array(3,2,1);
+-----------------------------+
| array(1,2,3) = array(3,2,1) |
+-----------------------------+
|                           0 |
+-----------------------------+

select array(1,2,3) = array(1,2,3);
+-----------------------------+
| array(1,2,3) = array(1,2,3) |
+-----------------------------+
|                           1 |
+-----------------------------+

select array(1,2,3) = array(1,2,3,3);
+-------------------------------+
| array(1,2,3) = array(1,2,3,3) |
+-------------------------------+
|                             0 |
+-------------------------------+
```
部分順序比較において、ARRAYは辞書順序に従います。2つの配列`A`と`B`が与えられた場合、インデックス`i = 1`から開始して、対応する位置の要素`A[i]`と`B[i]`を比較します：

- `A[i] ≠ B[i]`で等しくない場合、比較結果（<、>）が直接配列全体の比較結果を決定します
- `A[i] = B[i]`の場合、次の位置の比較を続行します
- 配列が共通の長さの範囲内ですべて完全に等しい場合、短い配列の方が小さくなります。

```sql
select array(1,2,3) > array(1,2,3,3), array(1,2,3) < array(1,2,3,3);
+-------------------------------+-------------------------------+
| array(1,2,3) > array(1,2,3,3) | array(1,2,3) < array(1,2,3,3) |
+-------------------------------+-------------------------------+
|                             0 |                             1 |
+-------------------------------+-------------------------------+

select array(1,3,2) > array(1,2,3), array(1,3,2) < array(1,2,3);
+-----------------------------+-----------------------------+
| array(1,3,2) > array(1,2,3) | array(1,3,2) < array(1,2,3) |
+-----------------------------+-----------------------------+
|                           1 |                           0 |
+-----------------------------+-----------------------------+

select array(null) < array(-1), array(null) > array(-1);
+-------------------------+-------------------------+
| array(null) < array(-1) | array(null) > array(-1) |
+-------------------------+-------------------------+
|                       1 |                       0 |
+-------------------------+-------------------------+
```
## クエリアクセラレーション

- DorisTableの`ARRAY<T>`型の列では、この列の`ARRAY`関数を使用する計算を高速化するために転置インデックスの追加をサポートしています。
  - 転置インデックスでサポートされるT型：`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DECIMAL, DATE, DATETIME, CHAR, VARCHAR, STRING, IPV4, IPV6`。
  - 高速化される`ARRAY`関数：`ARRAY_CONTAINS`、`ARRAYS_OVERLAP`。ただし、関数パラメータにNULLが含まれる場合は、通常のベクトル化計算にフォールバックします。

## 例

- 多次元配列

  ```SQL
  -- Create table
  CREATE TABLE IF NOT EXISTS array_table (
      id INT,
      two_dim_array ARRAY<ARRAY<INT>>,
      three_dim_array ARRAY<ARRAY<ARRAY<STRING>>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Insert
  INSERT INTO array_table VALUES (1, [[1, 2, 3], [4, 5, 6]], [[['ab', 'cd', 'ef'], ['gh', 'ij', 'kl']], [['mn', 'op', 'qr'], ['st', 'uv', 'wx']]]);

  INSERT INTO array_table VALUES (2, ARRAY(ARRAY(1, 2, 3), ARRAY(4, 5, 6)), ARRAY(ARRAY(ARRAY('ab', 'cd', 'ef'), ARRAY('gh', 'ij', 'kl')), ARRAY(ARRAY('mn', 'op', 'qr'), ARRAY('st', 'uv', 'wx'))));

  -- Query
  SELECT two_dim_array[1][2], three_dim_array[1][1][2] FROM array_table ORDER BY id;
  +---------------------+--------------------------+
  | two_dim_array[1][2] | three_dim_array[1][1][2] |
  +---------------------+--------------------------+
  |                   2 | cd                       |
  |                   2 | cd                       |
  +---------------------+--------------------------+
  ```
- ネストした複合型

  ```SQL
  -- Create table
  CREATE TABLE IF NOT EXISTS array_map_table (
      id INT,
      array_map ARRAY<MAP<STRING, INT>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Insert
  INSERT INTO array_map_table VALUES (1, ARRAY(MAP('key1', 1), MAP('key2', 2)));
  INSERT INTO array_map_table VALUES (2, ARRAY(MAP('key1', 1), MAP('key2', 2)));

  -- Query
  SELECT array_map[1], array_map[2] FROM array_map_table ORDER BY id;
  +--------------+--------------+
  | array_map[1] | array_map[2] |
  +--------------+--------------+
  | {"key1":1}   | {"key2":2}   |
  | {"key1":1}   | {"key2":2}   |
  +--------------+--------------+

  -- Create table
  CREATE TABLE IF NOT EXISTS array_table (
      id INT,
      array_struct ARRAY<STRUCT<id: INT, name: STRING>>,
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  INSERT INTO array_table VALUES (1, ARRAY(STRUCT(1, 'John'), STRUCT(2, 'Jane')));
  INSERT INTO array_table VALUES (2, ARRAY(STRUCT(1, 'John'), STRUCT(2, 'Jane')));

  SELECT array_struct[1], array_struct[2] FROM array_table ORDER BY id;
  +-------------------------+-------------------------+
  | array_struct[1]         | array_struct[2]         |
  +-------------------------+-------------------------+
  | {"id":1, "name":"John"} | {"id":2, "name":"Jane"} |
  | {"id":1, "name":"John"} | {"id":2, "name":"Jane"} |
  +-------------------------+-------------------------+
  ```
- タイプ の変更

  ```SQL
  -- Create table
  CREATE TABLE array_table (
      id INT,
      array_varchar ARRAY<VARCHAR(10)>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- Modify ARRAY type
  ALTER TABLE array_table MODIFY COLUMN array_varchar ARRAY<VARCHAR(20)>;

  -- Check column type
  DESC array_table;
  +---------------+--------------------+------+-------+---------+-------+
  | Field         | タイプ               | Null | Key   | Default | Extra |
  +---------------+--------------------+------+-------+---------+-------+
  | id            | int                | Yes  | true  | NULL    |       |
  | array_varchar | array<varchar(20)> | Yes  | false | NULL    | NONE  |
  +---------------+--------------------+------+-------+---------+-------+
  ```
- 転置インデックス

  ```SQL
  -- Create table statement
  CREATE TABLE `array_table` (
    `k` int NOT NULL,
    `array_column` ARRAY<INT>,
    INDEX idx_array_column (array_column) USING INVERTED
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Insert
  INSERT INTO array_table VALUES (1, [1, 2, 3]), (2, [4, 5, 6]), (3, [7, 8, 9]);

  -- The inverted index accelerates the execution of the ARRAY_CONTAINS function
  SELECT * FROM array_table WHERE ARRAY_CONTAINS(array_column, 5);
  +------+--------------+
  | k    | array_column |
  +------+--------------+
  |    2 | [4, 5, 6]    |
  +------+--------------+

  -- The inverted index accelerates the execution of the ARRAYS_OVERLAP function
  SELECT * FROM array_table WHERE ARRAYS_OVERLAP(array_column, [6, 9]);
  +------+--------------+
  | k    | array_column |
  +------+--------------+
  |    2 | [4, 5, 6]    |
  |    3 | [7, 8, 9]    |
  +------+--------------+
  ```
