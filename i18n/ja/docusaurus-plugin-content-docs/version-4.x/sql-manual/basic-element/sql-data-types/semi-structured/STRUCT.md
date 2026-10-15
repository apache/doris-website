---
{
    "title": "STRUCT | 半構造化データ",
    "language": "ja",
    "description": "STRUCT 型は複数のフィールドを単一の構造体にまとめるために使用します。各フィールドにはそれぞれ名前と型を指定できます。",
    "sidebar_label": "STRUCT"
}
---

# STRUCT

## 型の説明

STRUCT 型は複数のフィールドを単一の構造体にまとめるために使用します。各フィールドにはそれぞれ名前と型を指定でき、入れ子になったデータや複雑な業務データ構造の表現に適しています。

- `STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >`

  - `field_name` はフィールド名を表します。**空にできず、重複もできません。大文字と小文字は区別されません。**

  - `field_type` はフィールドの型を表します。NULL を許容し、NOT NULL は指定できません。サポートされる型は `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, ARRAY, MAP, STRUCT` です。

  - `[COMMENT 'comment-string']` は省略可能なコメントを表します。

## 型の制約

- `STRUCT` 型でサポートされる入れ子の最大深さは 9 です。

- `STRUCT` 型同士の変換可否は、内部の型を変換できるかどうかによって決まります（フィールド名は変換に影響しません）。`STRUCT` 型から他の型への変換はできません。

  - 文字列型から `STRUCT` 型への変換は可能です（文字列を解析し、解析に失敗した場合は NULL を返します）。

- `AGGREGATE` テーブルモデルでは、`STRUCT` 型でサポートされる集約方法は `REPLACE` と `REPLACE_IF_NOT_NULL` のみです。**どのテーブルモデルでも、KEY 列、パーティション列、バケット列には使用できません。**

- `STRUCT` 型の列では比較演算や算術演算を使用できません。**`ORDER BY` や `GROUP BY` の対象にできず、`JOIN KEY` としても、`DELETE` 文でも使用できません。**

- `STRUCT` 型の列にはインデックスを作成できません。

## 型の構築

- `STRUCT()` を使用して `STRUCT` 型の値を構築します。内部のフィールド名は col1 から始まります。

  ```SQL
  SELECT STRUCT(1, 'a', "abc");

  +--------------------------------------+
  | STRUCT(1, 'a', "abc")                |
  +--------------------------------------+
  | {"col1":1, "col2":"a", "col3":"abc"} |
  +--------------------------------------+
  ```

- `NAMED_STRUCT()` を使用して、指定した `STRUCT` 型の値を構築します。

  ```SQL
  SELECT NAMED_STRUCT("name", "Jack", "id", 1728923);

  +---------------------------------------------+
  | NAMED_STRUCT("name", "Jack", "id", 1728923) |
  +---------------------------------------------+
  | {"name":"Jack", "id":1728923}               |
  +---------------------------------------------+
  ```

## 型の変更

- `STRUCT` のサブ列の型が `VARCHAR` の場合に限り、変更できます。

   - `VARCHAR` の長さは小さい値から大きい値への変更のみ可能で、その逆はできません。

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

- `STRUCT` 型のサブ列は削除できませんが、末尾に新しいサブ列を追加できます。

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

## 要素へのアクセス

`STRUCT` 内の特定のサブ列には、次の同等の方法でアクセスできます。

- `ELEMENT_AT(struct, k/field_name)` 関数。

- 添字演算子 `struct[k]` / `struct['field_name']`。

- ドット演算子 `struct_col.field_name`（`STRUCT` 列にのみ使用可能）。

`k` は位置（1 から始まる定数）、`field_name` はサブ列名（文字列定数）です。フィールド名の照合では**大文字と小文字は区別されません**。存在しないフィールド名や範囲外の位置を指定すると、エラーが報告されます。

:::caution
他のデータベースやクエリエンジンにはこのような関数がないため、`STRUCT_ELEMENT` はバージョン 4.1.3 以降で削除されました。代わりに `ELEMENT_AT`、添字演算子、またはドット演算子を使用してください。
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

- `STRUCT` 列では、ドット演算子を使用して名前でサブ列にアクセスします。`s.a.b` のような入れ子のフィールドにもアクセスできます。

  ```SQL
  -- Table with a STRUCT column: s STRUCT<a: INT, b: DOUBLE>
  SELECT s.a, s.b FROM struct_table;

  -- Nested STRUCT column: s STRUCT<s: STRUCT<s: STRUCT<s: INT>>>
  SELECT s.s.s.s FROM nested_struct_table;
  ```

## 例

- 入れ子になった複合型

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
