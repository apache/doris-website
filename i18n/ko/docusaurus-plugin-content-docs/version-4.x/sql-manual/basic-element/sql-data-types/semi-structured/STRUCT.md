---
{
    "title": "STRUCT | 반정형",
    "language": "ko",
    "description": "STRUCT 타입은 여러 필드를 하나의 구조로 결합하는 데 사용되며, 각 필드는 고유한 이름과 타입을 가질 수 있습니다.",
    "sidebar_label": "STRUCT"
}
---

# STRUCT {#struct}

## 타입 설명 {#type-description}

STRUCT 타입은 여러 필드를 하나의 구조로 결합하는 데 사용됩니다. 각 필드는 고유한 이름과 타입을 가질 수 있어, 중첩되거나 복잡한 비즈니스 데이터 구조를 표현하는 데 적합합니다.

- `STRUCT<field_name:field_type [COMMENT 'comment_string'], ... >`

  - `field_name`은 필드 이름을 나타내며, **비어 있거나 중복될 수 없고 대소문자를 구분하지 않습니다**.

  - `field_type`은 필드 타입을 나타내며, NULL을 허용하고 NOT NULL로 지정할 수 없습니다. 지원되는 타입은 다음과 같습니다: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, ARRAY, MAP, STRUCT`.

  - `[COMMENT 'comment-string']`은 선택 사항인 주석을 나타냅니다.

## 타입 제약 사항 {#type-constraints}

- `STRUCT` 타입이 지원하는 최대 중첩 깊이는 9입니다.

- `STRUCT` 타입 간 변환 가능 여부는 내부 타입을 변환할 수 있는지에 따라 결정됩니다(이름은 변환에 영향을 주지 않습니다). `STRUCT` 타입은 다른 타입으로 변환할 수 없습니다.

  - 문자열 타입은 `STRUCT` 타입으로 변환할 수 있습니다(파싱을 통해 변환하며, 파싱에 실패하면 NULL을 반환합니다).

- `AGGREGATE` 테이블 모델에서 `STRUCT` 타입은 `REPLACE`와 `REPLACE_IF_NOT_NULL`만 지원합니다. **어떤 테이블 모델에서도 KEY 열이나 파티션 열, 버킷 열로 사용할 수 없습니다.**

- `STRUCT` 타입의 열은 `IN`과 `NOT IN`을 포함한 비교 연산이나 산술 연산을 지원하지 않으며, **`ORDER BY`와 `GROUP BY` 연산을 지원하지 않고, `JOIN KEY`로 사용할 수 없으며, `DELETE` 문에서도 사용할 수 없습니다.**

- `STRUCT` 타입의 열에는 어떤 인덱스도 생성할 수 없습니다.

## 타입 값 생성 {#type-construction}

- `STRUCT()`를 사용하여 `STRUCT` 타입의 값을 생성합니다. 내부 필드 이름은 col1부터 시작합니다.

  ```SQL
  SELECT STRUCT(1, 'a', "abc");

  +--------------------------------------+
  | STRUCT(1, 'a', "abc")                |
  +--------------------------------------+
  | {"col1":1, "col2":"a", "col3":"abc"} |
  +--------------------------------------+
  ```

- `NAMED_STRUCT()`를 사용하여 필드 이름을 지정한 `STRUCT` 타입의 값을 생성합니다.

  ```SQL
  SELECT NAMED_STRUCT("name", "Jack", "id", 1728923);

  +---------------------------------------------+
  | NAMED_STRUCT("name", "Jack", "id", 1728923) |
  +---------------------------------------------+
  | {"name":"Jack", "id":1728923}               |
  +---------------------------------------------+
  ```

## 타입 변경 {#modifying-type}

- `STRUCT`의 하위 열 타입이 `VARCHAR`인 경우에만 변경할 수 있습니다.

   - `VARCHAR`의 매개변수는 작은 값에서 큰 값으로만 변경할 수 있으며, 반대로는 변경할 수 없습니다.

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

- `STRUCT` 타입 내부의 하위 열은 삭제할 수 없지만, 끝에 새 하위 열을 추가할 수 있습니다.

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

## 요소 접근 {#element-access}

`STRUCT` 내부의 특정 하위 열에는 다음과 같은 동등한 방식으로 접근할 수 있습니다.

- `ELEMENT_AT(struct, k/field_name)` 함수.

- 아래첨자 연산자 `struct[k]` / `struct['field_name']`.

- 점 연산자 `struct_col.field_name`(`STRUCT` 열에만 사용 가능).

여기서 `k`는 위치(1부터 시작하는 상수)이고, `field_name`은 하위 열 이름(문자열 상수)입니다. 필드 이름은 **대소문자를 구분하지 않고** 일치 여부를 판단합니다. 존재하지 않는 필드 이름이나 범위를 벗어난 위치에 접근하면 오류가 발생합니다.

:::caution
다른 데이터베이스나 쿼리 엔진에서 이러한 함수를 제공하지 않으므로, `STRUCT_ELEMENT`는 버전 4.1.3부터 제거되었습니다. 대신 `ELEMENT_AT` 또는 아래첨자 / 점 연산자를 사용하세요.
:::

- `ELEMENT_AT` 또는 아래첨자 연산자를 사용하여 위치나 필드 이름으로 접근합니다.

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

- `STRUCT` 열에서는 점 연산자를 사용하여 이름으로 하위 열에 접근할 수 있으며, `s.a.b`와 같은 중첩 접근도 가능합니다.

  ```SQL
  -- Table with a STRUCT column: s STRUCT<a: INT, b: DOUBLE>
  SELECT s.a, s.b FROM struct_table;

  -- Nested STRUCT column: s STRUCT<s: STRUCT<s: STRUCT<s: INT>>>
  SELECT s.s.s.s FROM nested_struct_table;
  ```

## 예제 {#examples}

- 중첩된 복합 타입

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

- 타입 변경

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
