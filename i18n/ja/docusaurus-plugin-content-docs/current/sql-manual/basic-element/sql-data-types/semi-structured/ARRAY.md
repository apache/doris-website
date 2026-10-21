---
{
    "title": "ARRAY | 半構造化データ",
    "language": "ja",
    "description": "ARRAY<T> 型は、各要素が同じデータ型を持つ順序付きの要素の集合を表します。たとえば、",
    "sidebar_label": "ARRAY"
}
---

# ARRAY ドキュメント {#array-documentation}

## 型の説明 {#type-description}

`ARRAY<T>` 型は、各要素が同じデータ型を持つ順序付きの要素の集合を表します。たとえば、整数の配列は `[1, 2, 3]`、文字列の配列は `["a", "b", "c"]` と表せます。

- `ARRAY<T>` は型 T の要素で構成される配列を表します。T は NULL を許容します。T としてサポートされる型は次のとおりです: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID, STRUCT, MAP, VARIANT, JSONB, ARRAY<T>`。
  - 注: 上記の T の型のうち、`JSONB` と `VARIANT` は Doris の計算レイヤーでのみサポートされます。**Doris でテーブルを作成する際に `ARRAY<JSONB>` と `ARRAY<VARIANT>` を使用することはできません**。

## 型の制約 {#type-constraints}

- `ARRAY<T>` 型でサポートされるネストの最大深度は 9 です。
- `ARRAY<T>` 型同士の変換が可能かどうかは、T を変換できるかどうかによって決まります。`Array<T>` 型を他の型に変換することはできません。
  - たとえば、`INT` と `BIGINT` は相互に変換できるため、`ARRAY<INT>` を `ARRAY<BIGINT>` に変換できます。
  - `Variant` 型は `Array<T>` 型に変換できます。
  - 文字列型は `ARRAY<T>` 型に変換できます（解析に失敗した場合は NULL を返します）。
- `AGGREGATE` テーブルモデルでは、`ARRAY<T>` 型は `REPLACE` と `REPLACE_IF_NOT_NULL` のみをサポートします。**どのテーブルモデルでも、KEY 列、パーティション列、バケット列には使用できません**。
- `ARRAY<T>` 型の列は **`ORDER BY` と `GROUP BY` の操作をサポートします**。
  - `ORDER BY` と `GROUP BY` をサポートする T の型は次のとおりです: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID`。
- `ARRAY<T>` 型の列は `IN` と `NOT IN` の操作をサポートしません。
- `ARRAY<T>` 型の列は `JOIN KEY` として使用できず、`DELETE` 文でも使用できません。

## 定数の作成 {#constant-construction}

- `ARRAY()` 関数を使用して `ARRAY<T>` 型の値を作成します。T は引数に共通する型です。

    ```SQL
    -- [1, 2, 3] T is INT
    SELECT ARRAY(1, 2, 3);

    -- ["1", "2", "abc"] , T is STRING
    SELECT ARRAY(1, 2, 'abc');
    ```
- `[]` を使用して `ARRAY<T>` 型の値を作成します。T は引数に共通する型です。

   ```SQL
    -- ["abc", "def", "efg"] T is STRING
    SELECT ["abc", "def", "efg"];

    -- ["1", "2", "abc"] , T is STRING
    SELECT [1, 2, 'abc'];
    ```

## 型の変更 {#modifying-type}

- 変更できるのは、`ARRAY` 内の要素の型が `VARCHAR` の場合のみです。
   - `VARCHAR` のパラメータは小さい値から大きい値にのみ変更でき、逆方向には変更できません。

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
- `ARRAY<T>` 型の列のデフォルト値として指定できるのは NULL のみです。一度指定すると変更できません。

## 要素へのアクセス {#element-access}

- `[k]` を使用して `ARRAY<T>` の k 番目の要素にアクセスします。k は 1 から始まります。範囲外の場合は NULL を返します。

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

- `ELEMENT_AT(ARRAY, k)` を使用して `ARRAY<T>` の k 番目の要素にアクセスします。k は 1 から始まります。範囲外の場合は NULL を返します。

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

## 比較関係 {#comparison-relationship}

ARRAY は順序を持つ型であり、[1, 2, 3] と [3, 2, 1] は異なる ARRAY です。2 つの ARRAY が等しいのは、対応する要素が順番にすべて等しい場合に限ります。

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

大小比較では、ARRAY は辞書順に従います。2 つの配列 `A` と `B` について、添字 `i = 1` から始め、対応する位置の要素 `A[i]` と `B[i]` を比較します。

- `A[i] ≠ B[i]` の場合、その比較結果（< または >）が配列全体の比較結果になります。
- `A[i] = B[i]` の場合、次の位置の比較を続けます。
- 共通する長さの範囲ですべての要素が等しい場合は、短い配列のほうが小さくなります。

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

## クエリの高速化 {#query-acceleration}

- Doris のテーブルにある `ARRAY<T>` 型の列には転置インデックスを追加でき、この列に対する `ARRAY` 関数の計算を高速化できます。
  - 転置インデックスでサポートされる T の型: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID`。
  - 高速化される `ARRAY` 関数: `ARRAY_CONTAINS`、`ARRAYS_OVERLAP`。ただし、関数の引数に NULL が含まれる場合は、通常のベクトル化計算に切り替わります。

## 例 {#examples}

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
      array_struct ARRAY<STRUCT<id: INT, name: STRING>>
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

- 型の変更

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
  | Field         | Type               | Null | Key   | Default | Extra |
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
