---
{
    "title": "STRUCT | 半構造化",
    "language": "ja",
    "description": "STRUCT 型は複数のフィールドを 1 つの構造体にまとめるために使用します。各フィールドには固有の名前と型を指定できます。",
    "sidebar_label": "STRUCT"
}
---

# STRUCT

## 型の説明 {#type-description}

STRUCT 型は複数のフィールドを一つの構造体にまとめるために使用します。各フィールドには固有の名前と型を指定でき、ネストしたデータや複雑な業務データ構造の表現に適しています。

- `STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >`

  - `field_name` は名前を表し、**空にはできず、重複もできません。大文字と小文字は区別されません**。

  - `field_type` は型を表します。フィールドには NULL を格納でき、NOT NULL は指定できません。使用できる型は `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID, ARRAY, MAP, STRUCT` です。

  - `[COMMENT 'comment-string']` は省略可能なコメントを表します。

## 型の制約 {#type-constraints}

- `STRUCT` 型でサポートされるネストの最大深度は 9 です。

- `STRUCT` 型同士を変換できるかどうかは、内部の型を変換できるかどうかによって決まります（名前は変換に影響しません）。`STRUCT` 型をほかの型に変換することはできません。

  - 文字列型から `STRUCT` 型へは変換できます（文字列を解析し、解析に失敗した場合は NULL を返します）。

- `AGGREGATE` テーブルモデルでは、`STRUCT` 型でサポートされる集約方法は `REPLACE` と `REPLACE_IF_NOT_NULL` のみです。**どのテーブルモデルでも、KEY 列、パーティション列、バケット列には使用できません。**

- `STRUCT` 型の列では、比較演算や算術演算はサポートされません。**`ORDER BY` と `GROUP BY` の操作もサポートされず、`JOIN KEY` として使用したり、`DELETE` 文で使用したりすることもできません。**

- `STRUCT` 型の列には、いかなるインデックスも作成できません。

## 値の構築 {#type-construction}

- `STRUCT()` を使用して `STRUCT` 型の値を構築します。内部のフィールド名は col1 から始まります。

  ```SQL
  SELECT STRUCT(1, 'a', "abc");

  +--------------------------------------+
  | STRUCT(1, 'a', "abc")                |
  +--------------------------------------+
  | {"col1":1, "col2":"a", "col3":"abc"} |
  +--------------------------------------+
  ```

- `NAMED_STRUCT()` を使用して、特定の `STRUCT` 型の値を構築します。

  ```SQL
  SELECT NAMED_STRUCT("name", "Jack", "id", 1728923);

  +---------------------------------------------+
  | NAMED_STRUCT("name", "Jack", "id", 1728923) |
  +---------------------------------------------+
  | {"name":"Jack", "id":1728923}               |
  +---------------------------------------------+
  ```

## 型の変更 {#modifying-type}

- `STRUCT` のサブカラムの型が `VARCHAR` の場合にのみ、型を変更できます。

   - `VARCHAR` の長さは小さい値から大きい値にのみ変更でき、その逆はできません。

  ```SQL
  CREATE TABLE struct_table (
      `k` INT NOT NULL,
      `struct_varchar` STRUCT<name: VARCHAR(10), age: INT>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(20), age: INT>;
  ``` 

- `STRUCT` 型内のサブカラムは削除できませんが、末尾に新しいサブカラムを追加できます。

```SQL
  CREATE TABLE struct_table (
      `k` INT NOT NULL,
      `struct_varchar` STRUCT<name: VARCHAR(10), age: INT>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Add a subcolumn at the end
  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(10), age: INT, id: INT>;
```

## 要素へのアクセス {#element-access}

`STRUCT` 内の特定のサブカラムには、以下の同等の方法でアクセスできます。

- `ELEMENT_AT(struct, k/field_name)` 関数。

- 添字演算子 `struct[k]` / `struct['field_name']`。

- ドット演算子 `struct_col.field_name`（`STRUCT` 列でのみ使用可能）。

ここで、`k` は位置（1 から始まる定数）、`field_name` はサブカラム名（文字列定数）です。フィールド名の照合では**大文字と小文字が区別されません**。存在しないフィールド名や範囲外の位置を指定すると、エラーになります。

:::caution
ほかのデータベースやクエリエンジンには同様の関数がないため、`STRUCT_ELEMENT` はバージョン 4.1.3 以降で削除されました。代わりに `ELEMENT_AT`、添字演算子、またはドット演算子を使用してください。
:::

- `ELEMENT_AT` または添字演算子を使用して、位置またはフィールド名でアクセスします。

  ```SQL
  SELECT ELEMENT_AT(NAMED_STRUCT("name", "Jack", "id", 1728923), 1);

  +------------------------------------------------------------+
  | ELEMENT_AT(NAMED_STRUCT('name', 'Jack', 'id', 1728923), 1) |
  +------------------------------------------------------------+
  | Jack                                                       |
  +------------------------------------------------------------+

  SELECT NAMED_STRUCT("name", "Jack", "id", 1728923)['id'];

  +--------------------------------------------------+
  | NAMED_STRUCT('name', 'Jack', 'id', 1728923)['id'] |
  +--------------------------------------------------+
  |                                          1728923 |
  +--------------------------------------------------+
  ```

- `STRUCT` 列では、ドット演算子を使用して名前でサブカラムにアクセスできます。`s.a.b` のように、ネストしたサブカラムにもアクセスできます。

  ```SQL
  -- Table with a STRUCT column: s STRUCT<a: INT, b: DOUBLE>
  SELECT s.a, s.b FROM struct_table;

  -- Nested STRUCT column: s STRUCT<s: STRUCT<s: STRUCT<s: INT>>>
  SELECT s.s.s.s FROM nested_struct_table;
  ```

## 使用例 {#examples}

- ネストした複合型

  ```SQL
  -- Create table
  CREATE TABLE IF NOT EXISTS struct_table (
      id INT,
      struct_complex STRUCT<
          basic_info: STRUCT<name: STRING, age: INT>,
          contact: STRUCT<email: STRING, phone: STRING>,
          preferences: STRUCT<tags: ARRAY<STRING>, settings: MAP<STRING, INT>>,
          metadata: STRUCT<
              created_at: DATETIME,
              updated_at: DATETIME,
              stats: STRUCT<views: INT, clicks: INT>
          >
      >
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- Insert
  INSERT INTO struct_table VALUES (1, STRUCT(
    STRUCT('John', 25),
    STRUCT('john@example.com', '1234567890'),
    STRUCT(['tag1', 'tag2'], MAP('setting1', 1, 'setting2', 2)),
    STRUCT('2021-01-01 00:00:00', '2021-01-02 00:00:00', STRUCT(100, 50))
  ));

  -- Query (use the dot operator for nested struct field access)
  SELECT struct_complex.basic_info.name FROM struct_table ORDER BY id;

  +--------------------------------+
  | struct_complex.basic_info.name |
  +--------------------------------+
  | John                           |
  +--------------------------------+

  SELECT struct_complex.metadata.stats.views FROM struct_table ORDER BY id;

  +-------------------------------------+
  | struct_complex.metadata.stats.views |
  +-------------------------------------+
  |                                 100 |
  +-------------------------------------+
  ```

- 型の変更

```SQL
-- Create table
CREATE TABLE struct_table (
      `k` INT NOT NULL,
      `struct_varchar` STRUCT<name: VARCHAR(10), age: INT>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Modify the type of the 'name' subcolumn
  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(20), age: INT>;

  -- Check column types
  DESC struct_table;

  +----------------+----------------------------------+------+-------+---------+-------+
  | Field          | Type                             | Null | Key   | Default | Extra |
  +----------------+----------------------------------+------+-------+---------+-------+
  | k              | int                              | No   | true  | NULL    |       |
  | struct_varchar | struct<name:varchar(20),age:int> | Yes  | false | NULL    | NONE  |
  +----------------+----------------------------------+------+-------+---------+-------+

  -- Create table
  CREATE TABLE struct_table (
      `k` INT NOT NULL,
      `struct_varchar` STRUCT<name: VARCHAR(10), age: INT>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Add a subcolumn at the end
  ALTER TABLE struct_table MODIFY COLUMN struct_varchar STRUCT<name: VARCHAR(10), age: INT, id: INT>;

  -- Check column types
  DESC struct_table;

  +----------------+-----------------------------------------+------+-------+---------+-------+
  | Field          | Type                                    | Null | Key   | Default | Extra |
  +----------------+-----------------------------------------+------+-------+---------+-------+
  | k              | int                                     | No   | true  | NULL    |       |
  | struct_varchar | struct<name:varchar(10),age:int,id:int> | Yes  | false | NULL    | NONE  |
  +----------------+-----------------------------------------+------+-------+---------+-------+
```
