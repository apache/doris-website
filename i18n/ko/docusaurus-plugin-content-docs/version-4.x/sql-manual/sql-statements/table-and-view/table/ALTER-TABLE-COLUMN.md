---
{
    "title": "ALTER TABLE COLUMN",
    "language": "ko",
    "description": "이 문은 기존 테이블에서 스키마 변경 작업을 수행하는 데 사용됩니다. 스키마 변경은 비동기적으로 수행됩니다."
}
---

## 설명 {#description}

이 문은 기존 테이블에서 스키마 변경 작업을 수행하는 데 사용됩니다. 스키마 변경은 비동기적으로 수행되며, 작업이 성공적으로 제출되면 명령이 반환됩니다. 이후 [SHOW ALTER TABLE COLUMN](../../../../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE) 명령으로 진행 상황을 확인할 수 있습니다.

Doris에는 테이블 생성 후 구체화된 인덱스라는 개념이 있습니다. 테이블이 성공적으로 생성되면 해당 테이블은 기본 테이블이 되고, 구체화된 인덱스는 기본 인덱스가 됩니다. 기본 테이블을 기반으로 rollup 인덱스를 생성할 수 있습니다. 기본 인덱스와 rollup 인덱스는 모두 구체화된 인덱스입니다. 스키마 변경 작업 중 rollup_index_name을 지정하지 않으면 기본적으로 기본 테이블을 대상으로 작업합니다.

:::tip
Doris 1.2.0은 소규모 구조 변경을 위한 경량 스키마 변경을 지원하며, 값 컬럼의 추가 및 삭제 작업을 더 빠르게 동기적으로 완료할 수 있습니다. 테이블을 생성할 때 "light_schema_change" = 'true'를 직접 지정할 수 있습니다. 이 매개변수는 2.0.0 이상 버전에서 기본적으로 활성화됩니다.
:::

### 구문: {#grammar}

```sql
ALTER TABLE [database.]table alter_clause;
```

스키마 변경의 alter_clause는 다음 수정 방식을 지원합니다.

**1. 지정한 인덱스의 지정한 위치에 컬럼 추가**

**구문**

```sql
ALTER TABLE [database.]table table_name ADD COLUMN column_name column_type [KEY | agg_type] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

**예제**

1. example_db.my_table의 key_1 뒤에 키 컬럼 new_col 추가(비집계 모델)
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT KEY DEFAULT "0" AFTER key_1;
  ```

2. example_db.my_table의 value_1 뒤에 값 컬럼 new_col 추가(비집계 모델)
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT DEFAULT "0" AFTER value_1;
  ```

3. example_db.my_table의 key_1 뒤에 키 컬럼 new_col 추가(집계 모델)

  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT KEY DEFAULT "0" AFTER key_1;
  ```

4. example_db.my_table의 value_1 뒤에 SUM 집계 타입의 값 컬럼 new_col 추가(집계 모델)

  ```sql
  ALTER TABLE example_db.my_table   
  ADD COLUMN new_col INT SUM DEFAULT "0" AFTER value_1; 
  ```

5. example_db.my_table 테이블의 첫 번째 컬럼 위치에 new_col 추가(비집계 모델)

  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT KEY DEFAULT "0" FIRST;
  ```

:::tip
- 집계 모델에 값 컬럼을 추가하려면 agg_type을 지정해야 합니다.
- 비집계 모델(예: DUPLICATE KEY)에 키 컬럼을 추가하려면 KEY 키워드를 지정해야 합니다.
- 기본 인덱스에 이미 존재하는 컬럼은 rollup 인덱스에 추가할 수 없습니다(필요한 경우 rollup 인덱스를 다시 생성할 수 있습니다).
:::


**2. 지정한 인덱스에 여러 컬럼 추가**

**구문**

```sql
ALTER TABLE [database.]table table_name ADD COLUMN (column_name1 column_type [KEY | agg_type] DEFAULT "default_value", ...)
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```


**예제**

1. example_db.my_table에 여러 컬럼 추가. new_col과 new_col2는 SUM 집계 타입입니다(집계 모델).
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN (new_col1 INT SUM DEFAULT "0" ,new_col2 INT SUM DEFAULT "0");
  ```

2. example_db.my_table에 여러 컬럼 추가(비집계 모델). new_col1은 KEY 컬럼이고 new_col2는 값 컬럼입니다.
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN (new_col1 INT key DEFAULT "0" , new_col2 INT DEFAULT "0");
  ```

:::tip
  - 집계 모델에 값 컬럼을 추가하려면 agg_type을 지정해야 합니다.
  - 집계 모델에 키 컬럼을 추가하려면 KEY 키워드를 지정해야 합니다.
  - 기본 인덱스에 이미 존재하는 컬럼은 rollup 인덱스에 추가할 수 없습니다(필요한 경우 rollup 인덱스를 다시 생성할 수 있습니다). 
:::

**3. 지정한 인덱스에서 컬럼 삭제**

**구문***

  ```sql
  ALTER TABLE [database.]table table_name DROP COLUMN column_name
  [FROM rollup_index_name]
  ```

**예제**

1. example_db.my_table에서 col1 컬럼 삭제
  
  ```sql
  ALTER TABLE example_db.my_table DROP COLUMN col1;
  ```

:::tip
  - 파티션 컬럼은 삭제할 수 없습니다.
  - 집계 모델에서는 KEY 컬럼을 삭제할 수 없습니다.
  - 기본 인덱스에서 컬럼을 삭제하면 해당 컬럼이 포함된 rollup 인덱스에서도 삭제됩니다. 
:::

**4. 지정한 인덱스의 컬럼 타입 및 컬럼 위치 수정**

**구문**

```sql
ALTER TABLE [database.]table table_name MODIFY COLUMN column_name column_type [KEY | agg_type] [NULL | NOT NULL] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[FROM rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

**예제**

1. 기본 인덱스의 키 컬럼 col1 타입을 BIGINT로 수정하고 col2 컬럼 뒤로 이동

  ```sql
  ALTER TABLE example_db.my_table 
  MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
  ```

  :::tip
  키 컬럼과 값 컬럼 중 어느 것을 수정하든 컬럼 정보를 모두 선언해야 합니다.
  :::

2. 기본 인덱스의 val1 컬럼 최대 길이 수정. 기존 val1은 (val1 VARCHAR(32) REPLACE DEFAULT "abc")입니다.

  ```sql
  ALTER TABLE example_db.my_table 
  MODIFY COLUMN val1 VARCHAR(64) REPLACE DEFAULT "abc";
  ```

  :::tip
  컬럼의 데이터 타입만 수정할 수 있으며, 컬럼의 다른 속성은 변경하지 않아야 합니다.
  :::

3. Duplicate key 테이블의 Key 컬럼에 있는 필드 길이 수정

  ```sql
  ALTER TABLE example_db.my_table 
  MODIFY COLUMN k3 VARCHAR(50) KEY NULL COMMENT 'to 50';
  ```

:::tip
  - 집계 모델에서 값 컬럼을 수정하려면 agg_type을 지정해야 합니다.
  - 비집계 타입에서 키 컬럼을 수정하려면 KEY 키워드를 지정해야 합니다.
  - 컬럼의 타입만 수정할 수 있으며, 컬럼의 다른 속성은 그대로 유지해야 합니다(즉, 다른 속성은 기존 속성에 따라 명령문에 명시적으로 작성해야 합니다. 위의 예제 2를 참조하세요).
  - 파티션 컬럼과 버킷 컬럼은 어떤 방식으로도 수정할 수 없습니다.
  - 현재 다음 타입 변환을 지원합니다(정밀도 손실에 대한 책임은 사용자에게 있습니다).
    - TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE 타입을 더 큰 숫자 타입으로 변환
    - TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL을 VARCHAR로 변환
    - VARCHAR의 최대 길이 수정 지원
    - VARCHAR/CHAR를 TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE로 변환
    - VARCHAR/CHAR를 DATE로 변환(현재 "%Y-%m-%d", "%y-%m-%d", "%Y%m%d", "%y%m%d", "%Y/%m/%d, "%y/%m/%d"의 여섯 가지 형식 지원)
    - DATETIME을 DATE로 변환(연월일 정보만 유지. 예: `2019-12-09 21:47:05` <--> `2019-12-09`)
    - DATE를 DATETIME으로 변환(시, 분, 초는 자동으로 영으로 채워짐. 예: `2019-12-09` <--> `2019-12-09 00:00:00`)
    - FLOAT를 DOUBLE로 변환
    - INT를 DATE로 변환(INT 타입 데이터가 유효하지 않으면 변환에 실패하며 원래 데이터는 변경되지 않음)
    - DATE와 DATETIME을 제외한 모든 타입은 STRING으로 변환할 수 있지만, STRING은 다른 타입으로 변환할 수 없음 
:::

**5. 지정한 인덱스의 컬럼 순서 변경**

**구문**

  ```sql
  ALTER TABLE [database.]table table_name ORDER BY (column_name1, column_name2, ...)
  [FROM rollup_index_name]
  [PROPERTIES ("key"="value", ...)]
  ```

**예제**

1. example_db.my_table의 키 컬럼과 값 컬럼 순서 조정(비집계 모델)
  
  ```sql
  CREATE TABLE `my_table`(
  `k_1` INT NULL,
  `k_2` INT NULL,
  `v_1` INT NULL,
  `v_2` varchar NULL,
  `v_3` varchar NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k_1`, `k_2`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`k_1`) BUCKETS 5
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
  );

  ALTER TABLE example_db.my_table ORDER BY (k_2,k_1,v_3,v_2,v_1);

  mysql> desc my_table;
  +-------+------------+------+-------+---------+-------+
  | Field | Type       | Null | Key   | Default | Extra |
  +-------+------------+------+-------+---------+-------+
  | k_2   | INT        | Yes  | true  | NULL    |       |
  | k_1   | INT        | Yes  | true  | NULL    |       |
  | v_3   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_2   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_1   | INT        | Yes  | false | NULL    | NONE  |
  +-------+------------+------+-------+---------+-------+
  ```

2. 두 작업을 동시에 수행
  
  ```sql
  CREATE TABLE `my_table` (
  `k_1` INT NULL,
  `k_2` INT NULL,
  `v_1` INT NULL,
  `v_2` varchar NULL,
  `v_3` varchar NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k_1`, `k_2`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`k_1`) BUCKETS 5
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
  );

  ALTER TABLE example_db.my_table
  ADD COLUMN col INT DEFAULT "0" AFTER v_1,
  ORDER BY (k_2,k_1,v_3,v_2,v_1,col);

  mysql> desc my_table;
  +-------+------------+------+-------+---------+-------+
  | Field | Type       | Null | Key   | Default | Extra |
  +-------+------------+------+-------+---------+-------+
  | k_2   | INT        | Yes  | true  | NULL    |       |
  | k_1   | INT        | Yes  | true  | NULL    |       |
  | v_3   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_2   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_1   | INT        | Yes  | false | NULL    | NONE  |
  | col   | INT        | Yes  | false | 0       | NONE  |
  +-------+------------+------+-------+---------+-------+
  ```

:::tip
  - 인덱스의 모든 컬럼을 명시해야 합니다.
  - 값 컬럼은 키 컬럼 뒤에 와야 합니다.
  - 키 컬럼은 키 컬럼 범위 안에서만 순서를 조정할 수 있습니다. 값 컬럼에도 같은 규칙이 적용됩니다.
:::
  
## 키워드 {#keywords}

```text
ALTER, TABLE, COLUMN, ALTER TABLE
```

## 모범 사례 {#best-practice}
