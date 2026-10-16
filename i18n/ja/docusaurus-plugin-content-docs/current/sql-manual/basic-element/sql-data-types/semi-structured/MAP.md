---
{
    "title": "MAP | 半構造化型",
    "language": "ja",
    "description": "```SQL SELECT MAP('Alice', 21, 'Bob', 23);",
    "sidebar_label": "MAP"
}
---

# MAP

## 型の説明

- `MAP<key_type, value_type>` 型はキーと値のペアからなる複合型を表し、各キーには一つの値が対応します。
  - `key_type` はキーの型を表します。`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID` などの型をサポートします。キーには NULL を格納できますが、NOT NULL は指定できません。
  - `value_type` は値の型を表します。`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID, ARRAY, MAP, STRUCT` をサポートします。値には NULL を格納できますが、NOT NULL は指定できません。

## 型の制約

- `MAP<key_type, value_type>` 型のネストの深さは最大 9 です。
- `MAP<key_type, value_type>` では、キーに NULL を使用でき、同じキーを重複して使用できます（NULL と NULL は同じキーとみなされます）。
- `MAP<key_type, value_type>` 型間の変換は、`key_type` と `value_type` を変換できるかどうかによって決まります。`MAP<key_type, value_type>` をほかの型に変換することはできません。
  - 例：`MAP<INT, INT>` は `MAP<BIGINT, BIGINT>` に変換できます。これは `INT` と `BIGINT` を変換できるためです。
  - 文字列型は、解析によって `MAP<key_type, value_type>` に変換できます。解析に失敗した場合は NULL を返します。
- `AGGREGATE` テーブルモデルでは、`MAP<key_type, value_type>` は `REPLACE` と `REPLACE_IF_NOT_NULL` のみをサポートします。**どのテーブルモデルでも、KEY 列、パーティション列、バケット列には使用できません**。
- `MAP<key_type, value_type>` 型の列は比較演算や算術演算をサポートしません。**`ORDER BY` と `GROUP BY` に使用できず、`JOIN KEY` にも、`DELETE` 文にも使用できません**。
- `MAP<key_type, value_type>` 型の列にはインデックスを作成できません。

## 型の構築

- `MAP()` 関数は `MAP` 型の値を返します。

  ```SQL
  SELECT MAP('Alice', 21, 'Bob', 23);

  +-----------------------------+
  | map('Alice', 21, 'Bob', 23) |
  +-----------------------------+
  | {"Alice":21, "Bob":23}      |
  +-----------------------------+
  ```

- `{}` を使用して `MAP` 型の値を構築できます。

  ```SQL
  SELECT {'Alice': 20};

  +---------------+
  | {'Alice': 20} |
  +---------------+
  | {"Alice":20}  |
  +---------------+
  ```

## 型の変更

- `key_type` または `value_type` が `MAP<key_type, value_type>` の構成要素として `VARCHAR` 型である場合にのみ、その型を変更できます。
  - `VARCHAR` のパラメータは小さい値から大きい値への変更のみ可能で、逆方向には変更できません。

    ```SQL
    CREATE TABLE `map_table` (
      `k` INT NOT NULL,
      `map_varchar_int` MAP<VARCHAR(10), INT>,
      `map_int_varchar` MAP<INT, VARCHAR(10)>,
      `map_varchar_varchar` MAP<VARCHAR(10), VARCHAR(10)>
    ) ENGINE=OLAP
    DUPLICATE KEY(`k`)
    DISTRIBUTED BY HASH(`k`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1"
    );

    ALTER TABLE map_table MODIFY COLUMN map_varchar_int MAP<VARCHAR(20), INT>;

    ALTER TABLE map_table MODIFY COLUMN map_int_varchar MAP<INT, VARCHAR(20)>;

    ALTER TABLE map_table MODIFY COLUMN map_varchar_varchar MAP<VARCHAR(20), VARCHAR(20)>;
    ```

- `MAP<key_type, value_type>` 型の列に指定できるデフォルト値は NULL のみで、指定後は変更できません。

## 要素へのアクセス

- `[key]` を使用すると、`MAP` 内のキーに対応する値にアクセスできます。

  ```SQL
  SELECT {'Alice': 20}['Alice'];

  +------------------------+
  | {'Alice': 20}['Alice'] |
  +------------------------+
  |                     20 |
  +------------------------+
  ```

- `ELEMENT_AT(MAP, Key)` を使用すると、`MAP` 内のキーに対応する値にアクセスできます。

  ```SQL
  SELECT ELEMENT_AT({'Alice': 20}, 'Alice');

  +------------------------------------+
  | ELEMENT_AT({'Alice': 20}, 'Alice') |
  +------------------------------------+
  |                                 20 |
  +------------------------------------+
  ```

## 例

- ネストした MAP

  ```SQL
  -- Create table
  CREATE TABLE IF NOT EXISTS map_table (
      id INT,
      map_nested MAP<STRING, MAP<STRING, INT>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- Insert
  INSERT INTO map_table VALUES (1, MAP('key1', MAP('key2', 1, 'key3', 2)));
  INSERT INTO map_table VALUES (2, MAP('key1', MAP('key2', 3, 'key3', 4)));

  -- Query
  SELECT map_nested['key1']['key2'] FROM map_table ORDER BY id;
  +----------------------------+
  | map_nested['key1']['key2'] |
  +----------------------------+
  |                          1 |
  |                          3 |
  +----------------------------+
  ```

- ネストした複合型

  ```SQL
  -- Create table
  CREATE TABLE IF NOT EXISTS map_table (
      id INT,
      map_array MAP<STRING, ARRAY<INT>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- Insert
  INSERT INTO map_table VALUES (1, MAP('key1', [1, 2, 3])), (2, MAP('key1', [4, 5, 6]));

  -- Query
  SELECT map_array['key1'][1] FROM map_table ORDER BY id;
  +----------------------+
  | map_array['key1'][1] |
  +----------------------+
  |                    1 |
  |                    4 |
  +----------------------+

  -- Create table
  CREATE TABLE IF NOT EXISTS map_table (
      id INT,
      map_struct MAP<STRING, STRUCT<id: INT, name: STRING>>
  ) ENGINE=OLAP
  DUPLICATE KEY(id)
  DISTRIBUTED BY HASH(id) BUCKETS 1
  PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
  );

  -- Insert
  INSERT INTO map_table VALUES (1, MAP('key1', STRUCT(1, 'John'), 'key2', STRUCT(3, 'Jane')));

  -- Query
  SELECT STRUCT_ELEMENT(map_struct['key1'], 1), STRUCT_ELEMENT(map_struct['key1'], 'name') FROM map_table ORDER BY id;
  +---------------------------------------+--------------------------------------------+
  | STRUCT_ELEMENT(map_struct['key1'], 1) | STRUCT_ELEMENT(map_struct['key1'], 'name') |
  +---------------------------------------+--------------------------------------------+
  |                                     1 | John                                       |
  +---------------------------------------+--------------------------------------------+
  ```

- 型の変更

  ```SQL
  -- Create table
  CREATE TABLE `map_table` (
    `k` INT NOT NULL,
    `map_varchar_int` MAP<VARCHAR(10), INT>,
    `map_int_varchar` MAP<INT, VARCHAR(10)>,
    `map_varchar_varchar` MAP<VARCHAR(10), VARCHAR(10)>
  ) ENGINE=OLAP
  DUPLICATE KEY(`k`)
  DISTRIBUTED BY HASH(`k`) BUCKETS 1
  PROPERTIES (
      "replication_num" = "1"
  );

  -- Modify KEY
  ALTER TABLE map_table MODIFY COLUMN map_varchar_int MAP<VARCHAR(20), INT>;

  -- Modify VALUE
  ALTER TABLE map_table MODIFY COLUMN map_int_varchar MAP<INT, VARCHAR(20)>;

  -- Modify KEY and VALUE
  ALTER TABLE map_table MODIFY COLUMN map_varchar_varchar MAP<VARCHAR(20), VARCHAR(20)>;

  -- Check column types
  DESC map_table;
  +---------------------+------------------------------+------+-------+---------+-------+
  | Field               | Type                         | Null | Key   | Default | Extra |
  +---------------------+------------------------------+------+-------+---------+-------+
  | k                   | int                          | No   | true  | NULL    |       |
  | map_varchar_int     | map<varchar(20),int>         | Yes  | false | NULL    | NONE  |
  | map_int_varchar     | map<int,varchar(20)>         | Yes  | false | NULL    | NONE  |
  | map_varchar_varchar | map<varchar(20),varchar(20)> | Yes  | false | NULL    | NONE  |
  +---------------------+------------------------------+------+-------+---------+-------+
  ```
