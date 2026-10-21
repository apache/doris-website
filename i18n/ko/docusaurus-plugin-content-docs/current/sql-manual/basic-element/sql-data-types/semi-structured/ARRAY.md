---
{
    "title": "ARRAY | 반정형",
    "language": "ko",
    "description": "ARRAY<T> 타입은 모든 요소가 동일한 데이터 타입을 갖는 순서 있는 요소 모음을 나타내는 데 사용됩니다. 예를 들어,",
    "sidebar_label": "ARRAY"
}
---

# ARRAY 문서 {#array-documentation}

## 타입 설명 {#type-description}

`ARRAY<T>` 타입은 모든 요소가 동일한 데이터 타입을 갖는 순서 있는 요소 모음을 나타내는 데 사용됩니다. 예를 들어, 정수 배열은 `[1, 2, 3]`으로, 문자열 배열은 `["a", "b", "c"]`로 나타낼 수 있습니다.

- `ARRAY<T>`는 T 타입의 요소로 구성된 배열을 나타내며, T는 NULL을 허용합니다. T에 지원되는 타입은 다음과 같습니다: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID, STRUCT, MAP, VARIANT, JSONB, ARRAY<T>`.
  - 참고: 위의 T 타입 중 `JSONB`와 `VARIANT`는 Doris의 연산 계층에서만 지원되며, **Doris에서 테이블을 생성할 때 `ARRAY<JSONB>`와 `ARRAY<VARIANT>`를 사용하는 것은 지원하지 않습니다**.

## 타입 제약 사항 {#type-constraints}

- `ARRAY<T>` 타입이 지원하는 최대 중첩 깊이는 9입니다.
- `ARRAY<T>` 타입 간 변환 가능 여부는 T의 변환 가능 여부에 따라 달라집니다. `Array<T>` 타입은 다른 타입으로 변환할 수 없습니다.
  - 예를 들어, `ARRAY<INT>`는 `ARRAY<BIGINT>`로 변환할 수 있습니다. `INT`와 `BIGINT` 간에 변환이 가능하기 때문입니다.
  - `Variant` 타입은 `Array<T>` 타입으로 변환할 수 있습니다.
  - 문자열 타입은 `ARRAY<T>` 타입으로 변환할 수 있습니다(파싱을 통해 변환하며, 파싱에 실패하면 NULL을 반환합니다).
- `AGGREGATE` 테이블 모델에서 `ARRAY<T>` 타입은 `REPLACE`와 `REPLACE_IF_NOT_NULL`만 지원합니다. **어떤 테이블 모델에서도 KEY 컬럼, 파티션 컬럼 또는 버킷 컬럼으로 사용할 수 없습니다**.
- `ARRAY<T>` 타입의 컬럼은 **`ORDER BY` 및 `GROUP BY` 연산을 지원합니다**.
  - `ORDER BY` 및 `GROUP BY`를 지원하는 T 타입은 다음과 같습니다: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID`.
- `ARRAY<T>` 타입의 컬럼은 `IN` 또는 `NOT IN` 연산을 지원하지 않습니다.
- `ARRAY<T>` 타입의 컬럼은 `JOIN KEY`로 사용할 수 없으며, `DELETE` 문에서도 사용할 수 없습니다.

## 상수 생성 {#constant-construction}

- `ARRAY()` 함수를 사용하여 `ARRAY<T>` 타입의 값을 생성합니다. T는 인수의 공통 타입입니다.
    
    ```SQL
    -- [1, 2, 3] T is INT
    SELECT ARRAY(1, 2, 3);

    -- ["1", "2", "abc"] , T is STRING
    SELECT ARRAY(1, 2, 'abc');
    ```
- `[]`를 사용하여 `ARRAY<T>` 타입의 값을 생성합니다. T는 인수의 공통 타입입니다.
  
   ```SQL
    -- ["abc", "def", "efg"] T is STRING
    SELECT ["abc", "def", "efg"];

    -- ["1", "2", "abc"] , T is STRING
    SELECT [1, 2, 'abc'];
    ```

## 타입 변경 {#modifying-type}

- 타입 변경은 `ARRAY` 내부 요소의 타입이 `VARCHAR`인 경우에만 허용됩니다.
   - `VARCHAR`의 매개변수는 작은 값에서 큰 값으로만 변경할 수 있으며, 반대로는 변경할 수 없습니다.

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
- `ARRAY<T>` 타입 컬럼의 기본값은 NULL로만 지정할 수 있으며, 한 번 지정하면 변경할 수 없습니다.

## 요소 접근 {#element-access}

- `[k]`를 사용하여 `ARRAY<T>`의 k번째 요소에 접근합니다. k는 1부터 시작합니다. 범위를 벗어나면 NULL을 반환합니다.

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

- `ELEMENT_AT(ARRAY, k)`를 사용하여 `ARRAY<T>`의 k번째 요소에 접근합니다. k는 1부터 시작합니다. 범위를 벗어나면 NULL을 반환합니다.
  
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

## 비교 관계 {#comparison-relationship}

ARRAY는 순서가 있는 타입이므로 [1, 2, 3]과 [3, 2, 1]은 서로 다른 ARRAY입니다. 두 ARRAY는 각 위치의 요소가 순서대로 모두 같을 때만 같습니다:

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

부분 순서 비교에서 ARRAY는 사전식 순서를 따릅니다. 두 배열 `A`와 `B`가 주어지면 인덱스 `i = 1`부터 시작하여 같은 위치의 요소인 `A[i]`와 `B[i]`를 비교합니다:

- `A[i] ≠ B[i]`이면 비교 결과(<, >)가 배열 전체의 비교 결과를 바로 결정합니다
- `A[i] = B[i]`이면 다음 위치의 요소를 계속 비교합니다
- 두 배열의 공통 길이 범위에서 모든 요소가 같으면 더 짧은 배열이 더 작습니다.

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

## 쿼리 가속 {#query-acceleration}

- Doris 테이블의 `ARRAY<T>` 타입 컬럼에는 역색인을 추가하여 해당 컬럼에 대한 `ARRAY` 함수 연산을 가속할 수 있습니다.
  - 역색인이 지원하는 T 타입: `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DECIMAL, DATE, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ, CHAR, VARCHAR, STRING, IPV4, IPV6, UUID`.
  - 가속되는 `ARRAY` 함수: `ARRAY_CONTAINS`, `ARRAYS_OVERLAP`. 단, 함수 인수에 NULL이 포함되면 일반 벡터화 연산으로 전환됩니다.

## 예제 {#examples}

- 다차원 배열

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

- 중첩된 복합 타입
  
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

- 타입 변경

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

- 역색인

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
