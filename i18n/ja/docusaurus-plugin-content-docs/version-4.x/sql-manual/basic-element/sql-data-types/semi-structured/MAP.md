---
{
    "title": "MAP | 半構造化",
    "language": "ja",
    "description": "```SQL SELECT MAP('Alice', 21, 'Bob', 23);",
    "sidebar_label": "MAP"
}
---

# MAP {#map}

## 型の説明 {#type-description}

- `MAP<key_type, value_type>` 型は、キーと値のペアの複合型を表し、各キーが 1 つの値に一意に対応します。
  - `key_type` はキーの型を表し、`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6` などの型をサポートします。キーは NULL を許容し、NOT NULL は指定できません。
  - `value_type` は値の型を表し、`BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, ARRAY, MAP, STRUCT` をサポートします。値は NULL を許容し、NOT NULL は指定できません。

## 型の制約 {#type-constraints}

- `MAP<key_type, value_type>` 型で許可される最大ネスト深度は 9 です。
- `MAP<key_type, value_type>` ではキーに NULL を指定でき、同一のキーも許可されます（NULL と NULL は同じキーと見なされます）。
- `MAP<key_type, value_type>` 型間の変換は、`key_type` と `value_type` をそれぞれ変換できるかどうかによって決まります。`MAP<key_type, value_type>` は他の型に変換できません。
  - 例: `MAP<INT, INT>` は `MAP<BIGINT, BIGINT>` に変換できます。`INT` と `BIGINT` は変換可能なためです。
  - 文字列型は `MAP<key_type, value_type>` に変換できます（解析によって行われ、解析に失敗した場合は NULL が返されます）。
- `AGGREGATE` テーブルモデルでは、`MAP<key_type, value_type>` は `REPLACE` と `REPLACE_IF_NOT_NULL` のみをサポートします。**どのテーブルモデルでも KEY 列、パーティション列、バケット列として使用できません**。
- `MAP<key_type, value_type>` 型の列は、`IN` や `NOT IN` を含む比較演算や算術演算をサポートしません。**`ORDER BY` と `GROUP BY` 操作をサポートせず、`JOIN KEY` として使用できず、`DELETE` ステートメントでも使用できません**。
- `MAP<key_type, value_type>` 型の列では、インデックスを作成できません。

## 型の構築 {#type-construction}

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

## 型の変更 {#modifying-type}

- `MAP<key_type, value_type>` の `key_type` または `value_type` が `VARCHAR` の場合にのみ変更できます。
  - `VARCHAR` のパラメーターを小さい値から大きい値へ変更する場合のみ許可され、逆方向は許可されません。

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

- `MAP<key_type, value_type>` 型の列のデフォルト値には NULL のみ指定でき、指定後は変更できません。

## 要素へのアクセス {#element-access}

- `[key]` を使用して、`MAP` 内のキーに対応する値にアクセスします。

  ```SQL
  SELECT {'Alice': 20}['Alice'];

  +------------------------+
  | {'Alice': 20}['Alice'] |
  +------------------------+
  |                     20 |
  +------------------------+
  ```

- `ELEMENT_AT(MAP, Key)` を使用して、`MAP` 内のキーに対応する値にアクセスします。

  ```SQL
  SELECT ELEMENT_AT({'Alice': 20}, 'Alice');

  +------------------------------------+
  | ELEMENT_AT({'Alice': 20}, 'Alice') |
  +------------------------------------+
  |                                 20 |
  +------------------------------------+
  ```

## 例 {#examples}

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
