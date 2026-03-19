---
{
  "title": "STRUCT | 半構造化",
  "language": "ja",
  "description": "STRUCT型は複数のフィールドを単一の構造体に結合するために使用され、各フィールドは独自の名前と型を持つことができます。",
  "sidebar_label": "STRUCT"
}
---
# STRUCT

## 型の説明

STRUCT型は、複数のフィールドを単一の構造体に結合するために使用され、各フィールドは独自の名前と型を持つことができ、ネストされた複雑なビジネスデータ構造を表現するのに適しています。

- `STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >`

  - `field_name`は名前を表し、**空にできず、重複できず、大文字小文字を区別しません**。

  - `field_type`は型を表し、nullableでありNOT NULLとして指定できません。サポートされている型には次のものがあります：`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, ARRAY, MAP, STRUCT`。

  - `[COMMENT 'comment-string']`はオプションのコメントを表します。

## 型の制約

- `STRUCT`型でサポートされる最大ネスト深度は9です。

- `STRUCT`型間の変換は、内部型が変換可能かどうかに依存します（名前は変換に影響しません）。`STRUCT`型は他の型に変換できません。

  - 文字列型は`STRUCT`型に変換できます（解析を通じて、解析に失敗した場合はNULLを返します）。

- `AGGREGATE`テーブルモデルでは、`STRUCT`型は`REPLACE`と`REPLACE_IF_NOT_NULL`のみをサポートします。**いかなるテーブルモデルにおいても、KEYカラム、パーティションまたはバケットカラムとして使用できません。**

- `STRUCT`型のカラムは比較や算術演算をサポートせず、**`ORDER BY`と`GROUP BY`操作をサポートせず、`JOIN KEY`として使用できず、`DELETE`文で使用できません。**

- `STRUCT`型のカラムは、いかなるインデックスの作成もサポートしません。

## 型の構築

- `STRUCT()`を使用して`STRUCT`型の値を構築します。内部の名前はcol1から始まります。

  ```SQL
  SELECT STRUCT(1, 'a', "abc");

  +--------------------------------------+
  | STRUCT(1, 'a', "abc")                |
  +--------------------------------------+
  | {"col1":1, "col2":"a", "col3":"abc"} |
  +--------------------------------------+
  ```
- 特定の`STRUCT`型の値を構築するには`NAMED_STRUCT()`を使用してください。

  ```SQL
  SELECT NAMED_STRUCT("name", "Jack", "id", 1728923);

  +---------------------------------------------+
  | NAMED_STRUCT("name", "Jack", "id", 1728923) |
  +---------------------------------------------+
  | {"name":"Jack", "id":1728923}               |
  +---------------------------------------------+
  ```
## 型の変更

- 変更は`STRUCT`のサブカラム型が`VARCHAR`の場合のみ許可されます。

   - `VARCHAR`のパラメータを小さいものから大きいものへの変更のみ許可され、逆方向は許可されません。

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
- `STRUCT`型内のサブカラムは削除をサポートしていませんが、新しいサブカラムを末尾に追加することができます。

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
## 要素アクセス

- `STRUCT`内の特定のサブカラムにアクセスするには、`STRUCT_ELEMENT(struct, k/field_name)`を使用してください。

  - kは1から始まる位置を表します。

  - `field_name`は`STRUCT`内のサブカラムの名前です。

  ```SQL
  SELECT STRUCT_ELEMENT(NAMED_STRUCT("name", "Jack", "id", 1728923), 1);

  +----------------------------------------------------------------+
  | STRUCT_ELEMENT(NAMED_STRUCT("name", "Jack", "id", 1728923), 1) |
  +----------------------------------------------------------------+
  | Jack                                                           |
  +----------------------------------------------------------------+

  SELECT STRUCT_ELEMENT(NAMED_STRUCT("name", "Jack", "id", 1728923), "id");

  +-------------------------------------------------------------------+
  | STRUCT_ELEMENT(NAMED_STRUCT("name", "Jack", "id", 1728923), "id") |
  +-------------------------------------------------------------------+
  |                                                           1728923 |
  +-------------------------------------------------------------------+
  ```
## 例

- ネストされた複合型

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
  DISTRIBUTED BY HASH(id) BUCKETS 1
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

  -- Query
  SELECT STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'basic_info'), 'name')  FROM struct_table ORDER BY id;

  +----------------------------------------------------------------------+
  | STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'basic_info'), 'name') |
  +----------------------------------------------------------------------+
  | John                                                                 |
  +----------------------------------------------------------------------+

  SELECT STRUCT_ELEMENT(STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'metadata'), 'stats'), 'views') FROM struct_table ORDER BY id;

  +----------------------------------------------------------------------------------------------+
  | STRUCT_ELEMENT(STRUCT_ELEMENT(STRUCT_ELEMENT(struct_complex, 'metadata'), 'stats'), 'views') |
  +----------------------------------------------------------------------------------------------+
  |                                                                                          100 |
  +----------------------------------------------------------------------------------------------+
  ```
- タイプの変更

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
