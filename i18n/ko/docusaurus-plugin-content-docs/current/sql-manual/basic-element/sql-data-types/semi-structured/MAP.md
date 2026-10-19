---
{
    "title": "MAP | 반정형",
    "language": "ko",
    "description": "```SQL SELECT MAP('Alice', 21, 'Bob', 23);",
    "sidebar_label": "MAP"
}
---

# MAP {#map}

## 타입 설명 {#type-description}

- `MAP<key_type, value_type>` 타입은 키-값 쌍으로 구성된 복합 타입을 나타내며, 각 키는 하나의 값에 대응합니다.
  - `key_type`은 키의 타입을 나타내며, `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID` 등의 타입을 지원합니다. 키는 NULL을 허용하며 NOT NULL로 지정할 수 없습니다.
  - `value_type`은 값의 타입을 나타내며, `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID, ARRAY, MAP, STRUCT`를 지원합니다. 값은 NULL을 허용하며 NOT NULL로 지정할 수 없습니다.

## 타입 제약 조건 {#type-constraints}

- `MAP<key_type, value_type>` 타입은 최대 9단계까지 중첩할 수 있습니다.
- `MAP<key_type, value_type>`에서 키는 NULL일 수 있으며, 동일한 키도 허용됩니다(NULL과 NULL은 동일한 키로 간주됩니다).
- `MAP<key_type, value_type>` 타입 간 변환은 `key_type`과 `value_type`의 변환 가능 여부에 따라 달라집니다. `MAP<key_type, value_type>`는 다른 타입으로 변환할 수 없습니다.
  - 예를 들어, `MAP<INT, INT>`는 `MAP<BIGINT, BIGINT>`로 변환할 수 있습니다. `INT`와 `BIGINT` 간에 변환이 가능하기 때문입니다.
  - 문자열 타입은 `MAP<key_type, value_type>`로 변환할 수 있습니다(파싱을 통해 변환하며, 파싱에 실패하면 NULL을 반환합니다).
- `AGGREGATE` 테이블 모델에서 `MAP<key_type, value_type>`는 `REPLACE`와 `REPLACE_IF_NOT_NULL`만 지원합니다. **어떤 테이블 모델에서도 KEY 열, 파티션 열 또는 버킷 열로 사용할 수 없습니다**.
- `MAP<key_type, value_type>` 타입의 열은 `IN`과 `NOT IN`을 포함한 비교 연산 및 산술 연산을 지원하지 않으며, **`ORDER BY`와 `GROUP BY` 연산을 지원하지 않고, `JOIN KEY`로 사용할 수 없으며, `DELETE` 문에서도 사용할 수 없습니다**.
- `MAP<key_type, value_type>` 타입의 열에는 어떤 인덱스도 생성할 수 없습니다.

## 타입 생성 {#type-construction}

- `MAP()` 함수는 `MAP` 타입의 값을 반환할 수 있습니다.

  ```SQL
  SELECT MAP('Alice', 21, 'Bob', 23);

  +-----------------------------+
  | map('Alice', 21, 'Bob', 23) |
  +-----------------------------+
  | {"Alice":21, "Bob":23}      |
  +-----------------------------+
  ```

- `{}`를 사용하여 `MAP` 타입의 값을 생성할 수 있습니다.

  ```SQL
  SELECT {'Alice': 20};

  +---------------+
  | {'Alice': 20} |
  +---------------+
  | {"Alice":20}  |
  +---------------+
  ```

## 타입 변경 {#modifying-type}

- `key_type` 또는 `value_type`이 `MAP<key_type, value_type>`에서 `VARCHAR`로 정의된 경우에만 변경할 수 있습니다.
  - `VARCHAR`의 매개변수는 작은 값에서 큰 값으로만 변경할 수 있으며, 반대로는 변경할 수 없습니다.

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

- `MAP<key_type, value_type>` 타입 열의 기본값은 NULL로만 지정할 수 있으며, 한 번 지정하면 변경할 수 없습니다.

## 요소 접근 {#element-access}

- `[key]`를 사용하여 `MAP`에서 해당 키에 대응하는 값에 접근합니다.

  ```SQL
  SELECT {'Alice': 20}['Alice'];

  +------------------------+
  | {'Alice': 20}['Alice'] |
  +------------------------+
  |                     20 |
  +------------------------+
  ```

- `ELEMENT_AT(MAP, Key)`를 사용하여 `MAP`에서 해당 키에 대응하는 값에 접근합니다.

  ```SQL
  SELECT ELEMENT_AT({'Alice': 20}, 'Alice');

  +------------------------------------+
  | ELEMENT_AT({'Alice': 20}, 'Alice') |
  +------------------------------------+
  |                                 20 |
  +------------------------------------+
  ```

## 예제 {#examples}

- 중첩된 MAP

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

- 중첩된 복합 타입

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

- 타입 변경

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
