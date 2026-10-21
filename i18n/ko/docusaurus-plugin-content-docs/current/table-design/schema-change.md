---
{
    "title": "스키마 변경(Schema Change)",
    "language": "ko",
    "description": "Doris는 ALTER TABLE을 통해 테이블 스키마를 수정합니다. 이 문서에서는 경량 Schema Change와 중량 Schema Change의 차이점, 사용 예제, 지원되는 타입 변환, 작업 관리를 설명합니다.",
    "keywords": [
        "Doris Schema Change",
        "ALTER TABLE",
        "경량 Schema Change",
        "중량 Schema Change",
        "열 추가",
        "열 삭제",
        "열 타입 수정",
        "VARCHAR 길이 수정",
        "열 순서 변경",
        "데이터 타입 변환"
    ]
}
---

<!-- Knowledge type: Operation steps / Configuration parameters / Limitations -->
<!-- Applicable scenarios: Table schema change / Field adjustment / Type conversion -->

[`ALTER TABLE`](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md)을 통해 Doris 테이블의 스키마를 수정할 수 있습니다. 이 문서는 **열과 관련된** 스키마 변경을 중심으로 설명합니다. 인덱스 관련 변경은 [테이블 인덱스](./index/index-overview.md)에서 인덱스별 수정 방법을 참조하세요.

## Schema Change의 두 가지 유형 {#two-types-of-schema-change}

Doris는 **경량**과 **중량**, 두 가지 유형의 Schema Change 작업을 지원합니다. 두 유형은 실행 복잡도, 속도, 리소스 사용량에서 큰 차이가 있습니다. 아래 표를 참고하면 적합한 유형을 빠르게 선택할 수 있습니다.

| 특성                  | 경량 Schema Change                                    | 중량 Schema Change                                                            |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 실행 속도          | 초 단위(거의 실시간)                                   | 분 / 시간 / 일 단위(데이터 양에 따라 달라지며, 데이터 양이 많을수록 느려짐)   |
| 데이터 재작성 필요 여부    | 아니요, 메타데이터만 수정                                | 예, 데이터 파일 재작성 필요                                                   |
| 시스템 성능에 미치는 영향 | 영향이 적음                                                 | 시스템 성능에 영향을 줄 수 있으며, 특히 데이터 변환 중에 영향이 큼                     |
| 리소스 사용량     | 낮음                                                          | 높음. 컴퓨팅 리소스를 점유하며, 처리 중에는 테이블 데이터의 스토리지 사용량이 두 배로 증가 |
| 대표 작업       | 값 열 추가 / 삭제, 열 이름 변경, VARCHAR 길이 수정 | 열 데이터 타입 수정, NOT NULL을 NULL로 변경, 기본 키 변경, 열 순서 수정 등 |

### 경량 Schema Change {#lightweight-schema-change}

**메타데이터만 수정하며, 데이터 파일을 물리적으로 수정하지 않습니다.** 일반적으로 수초 내에 완료되며 시스템 성능에 미치는 영향이 매우 적습니다. 다음 작업이 포함됩니다.

- 값 열 추가 또는 삭제.
- 열 이름 변경.
- VARCHAR 열의 길이 수정(UNIQUE 및 DUP 테이블의 키 열 제외).

### 중량 Schema Change {#heavyweight-schema-change}

**데이터 파일을 재작성하거나 변환하며**, 실제 수정이나 재구성은 Backend(BE)가 백그라운드에서 수행합니다. 경량 범주에 속하지 않는 모든 작업은 중량 작업이며, 다음과 같은 예가 있습니다.

- 열의 데이터 타입 수정.
- 열을 NOT NULL에서 NULL로 변경.
- 열의 정렬 순서 수정.

실행 흐름:

1. 백그라운드에서 데이터 변환 작업을 시작하고, tablet 단위로 기존 데이터를 새 데이터 파일에 재작성합니다.
2. 변환 중에는 "이중 쓰기"가 발생하여 새 데이터가 새 tablet과 기존 tablet 모두에 기록됩니다.
3. 변환이 완료되면 기존 tablet이 삭제되고 새 tablet이 이를 대체합니다.

## 사용 예제 {#usage-examples}

아래 표에는 일반적인 작업 시나리오와 해당 구문이 나와 있습니다. 필요에 따라 참조하세요.

| 사용자 시나리오              | 작업 구문    |
| -------------------------- | ------------------- |
| 열 이름 변경            | `RENAME COLUMN`     |
| 키/값 열 추가     | `ADD COLUMN`        |
| 여러 열을 한 번에 추가 | `ADD COLUMN (...)` |
| 열 삭제              | `DROP COLUMN`       |
| 열 타입 / 위치 수정 | `MODIFY COLUMN`  |
| 열 순서 변경            | `ORDER BY`          |

### 열 이름 변경 {#rename-a-column}

```sql
ALTER TABLE [database.]table RENAME COLUMN old_column_name new_column_name;
```

자세한 구문은 [ALTER TABLE RENAME](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME.md)을 참조하세요.

### 열 추가 {#add-a-column}

참고 사항:

- 집계 모델에 값 열을 추가할 때는 `agg_type`을 지정해야 합니다.
- 비집계 모델(예: DUPLICATE KEY)에 키 열을 추가할 때는 `KEY` 키워드를 지정해야 합니다.

#### 예제 1: 비집계 테이블에 열 추가 {#example-1-adding-a-column-to-a-non-aggregate-table}

1. 테이블 생성문:

    ```sql
    CREATE TABLE IF NOT EXISTS example_db.my_table(
        col1 int,
        col2 int,
        col3 int,
        col4 int,
        col5 int
    ) DUPLICATE KEY(col1, col2, col3)
    DISTRIBUTED BY RANDOM BUCKETS 10;
    ```

2. 키 열 `key_col`을 `col1` 뒤에 추가합니다:

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN key_col INT KEY DEFAULT "0" AFTER col1;
    ```

3. 값 열 `value_col`을 `col4` 뒤에 추가합니다:

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN value_col INT DEFAULT "0" AFTER col4;
    ```

#### 예제 2: 집계 테이블에 열 추가 {#example-2-adding-a-column-to-an-aggregate-table}

1. 테이블 생성문:

    ```sql
    CREATE TABLE IF NOT EXISTS example_db.my_table(
        col1 int,
        col2 int,
        col3 int,
        col4 int SUM,
        col5 varchar(32) REPLACE DEFAULT "abc"
    ) AGGREGATE KEY(col1, col2, col3)
    DISTRIBUTED BY HASH(col1) BUCKETS 10;
    ```

2. 키 열 `key_col`을 `col1` 뒤에 추가합니다:

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN key_col INT DEFAULT "0" AFTER col1;
    ```

3. 값 열 `value_col`을 `col4` 뒤에 SUM 집계 타입으로 추가합니다:

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN value_col INT SUM DEFAULT "0" AFTER col4;
    ```

### 여러 열 추가 {#add-multiple-columns}

참고 사항:

- 집계 모델에 값 열을 추가할 때는 `agg_type`을 지정해야 합니다.
- 집계 모델에 키 열을 추가할 때는 `KEY` 키워드를 지정해야 합니다.

집계 테이블에 여러 열을 추가합니다:

1. 테이블 생성문:

    ```sql
    CREATE TABLE IF NOT EXISTS example_db.my_table(
        col1 int,
        col2 int,
        col3 int,
        col4 int SUM,
        col5 varchar(32) REPLACE DEFAULT "abc"
    ) AGGREGATE KEY(col1, col2, col3)
    DISTRIBUTED BY HASH(col1) BUCKETS 10;
    ```

2. 여러 열을 한 번에 추가합니다:

    ```sql
    ALTER TABLE example_db.my_table
    ADD COLUMN (c1 INT DEFAULT "1", c2 FLOAT SUM DEFAULT "0");
    ```

### 열 삭제 {#drop-a-column}

참고 사항:

- 파티션 열은 삭제할 수 없습니다.
- UNIQUE 테이블의 키 열은 삭제할 수 없습니다.

`example_db.my_table`에서 열을 삭제합니다:

1. 테이블 생성문:

    ```sql
    CREATE TABLE IF NOT EXISTS example_db.my_table(
        col1 int,
        col2 int,
        col3 int,
        col4 int SUM,
        col5 varchar(32) REPLACE DEFAULT "abc"
    ) AGGREGATE KEY(col1, col2, col3)
    DISTRIBUTED BY HASH(col1) BUCKETS 10;
    ```

2. `col4` 열을 `example_db.my_table`에서 삭제합니다:

    ```sql
    ALTER TABLE example_db.my_table DROP COLUMN col4;
    ```

### 열 타입 및 위치 수정 {#modify-column-type-and-position}

참고 사항:

- 집계 모델의 값 열을 수정할 때는 `agg_type`을 지정해야 합니다.
- 비집계 모델의 키 열을 수정할 때는 `KEY` 키워드를 지정해야 합니다.
- 열 **타입**을 수정할 때는 집계 방식과 기본값을 기존 열과 동일하게 유지해야 합니다.
- 열을 **NOT NULL에서 NULL로** 변경할 수 있으며, 중량 Schema Change로 실행됩니다. **NULL에서 NOT NULL로** 변경하는 것은 지원되지 않습니다.
- **파티션 열과 버킷팅 열은 어떤 방식으로도 수정할 수 없습니다.**
- 열을 수정할 때는 정밀도 손실에 주의하세요. 지원되는 타입 변환은 아래의 [지원되는 타입 변환](#supported-type-conversions)을 참조하세요.

예제:

1. 테이블 생성문:

    ```sql
    CREATE TABLE IF NOT EXISTS example_db.my_table(
        col0 int,
        col1 int DEFAULT "1",
        col2 int,
        col3 varchar(32),
        col4 int SUM,
        col5 varchar(32) REPLACE DEFAULT "abc"
    ) AGGREGATE KEY(col0, col1, col2, col3)
    DISTRIBUTED BY HASH(col0) BUCKETS 10;
    ```

2. 키 열 `col1`의 타입을 `BIGINT`로 변경하고 `col2` 뒤로 이동합니다(키 열이든 값 열이든 전체 열 정보를 선언해야 합니다):

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
    ```

3. 기본 테이블에 있는 `col5` 열의 최대 길이를 수정합니다. 기존 `col5`는 `VARCHAR(32) REPLACE DEFAULT "abc"`입니다(VARCHAR 길이만 변경되며, 집계 방식과 기본값은 그대로 유지해야 합니다):

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col5 VARCHAR(64) REPLACE DEFAULT "abc";
    ```

4. 키 열의 필드 길이를 수정합니다:

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col3 varchar(50) KEY NULL COMMENT 'to 50';
    ```

5. 열을 NOT NULL에서 NULL로 변경합니다(중량 Schema Change):

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col2 INT NULL;
    ```

#### 지원되는 타입 변환 {#supported-type-conversions}

열 타입을 수정할 때는 정밀도 손실에 주의하세요. 현재 다음과 같은 변환을 지원합니다.

| 원본 타입                                              | 대상 타입                                       | 설명                                                                                |
| -------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE        | 더 넓은 범위의 숫자 타입                | -                                                                                          |
| TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL | VARCHAR                                           | -                                                                                          |
| VARCHAR                                                  | VARCHAR                                           | 최대 길이 수정만 지원                                             |
| VARCHAR/CHAR                                             | TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE | -                                                                                          |
| VARCHAR/CHAR                                             | DATE                                              | 여섯 가지 형식을 지원: `%Y-%m-%d`, `%y-%m-%d`, `%Y%m%d`, `%y%m%d`, `%Y/%m/%d`, `%y/%m/%d` |
| DATETIME                                                 | DATE                                              | 연월일만 유지됩니다. 예를 들어 `2019-12-09 21:47:05`는 `2019-12-09`로 변환됩니다   |
| DATE                                                     | DATETIME                                          | 시, 분, 초가 자동으로 영으로 채워집니다. 예를 들어 `2019-12-09`는 `2019-12-09 00:00:00`로 변환됩니다 |
| FLOAT                                                    | DOUBLE                                            | -                                                                                          |
| INT                                                      | DATE                                              | INT 데이터가 유효하지 않으면 변환에 실패하고 원본 데이터가 그대로 유지됩니다  |
| DATE 및 DATETIME 이외의 타입                       | STRING                                            | STRING은 다른 어떤 타입으로도 변환할 수 없습니다                                               |

### 열 순서 변경 {#reorder-columns}

참고 사항:

- 테이블의 모든 열을 나열해야 합니다.
- 값 열은 키 열 뒤에 배치해야 합니다.

예제:

1. 테이블 생성문:

    ```sql
    CREATE TABLE IF NOT EXISTS example_db.my_table(
        k1 int DEFAULT "1",
        k2 int,
        k3 varchar(32),
        k4 date,
        v1 int SUM,
        v2 int MAX,
    ) AGGREGATE KEY(k1, k2, k3, k4)
    DISTRIBUTED BY HASH(k1) BUCKETS 10;
    ```

2. `example_db.my_table`의 열 순서를 변경합니다:

    ```sql
    ALTER TABLE example_db.my_table
    ORDER BY (k3, k1, k2, k4, v2, v1);
    ```

## 작업 관리 {#job-management}

### 작업 조회 {#view-jobs}

[`SHOW ALTER TABLE COLUMN`](../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE.md) 명령으로 Schema Change 작업의 진행 상황을 확인할 수 있습니다. 현재 실행 중인 작업이나 완료된 작업이 표시됩니다. 작업에 구체화된 뷰가 포함되어 있으면 이 명령은 구체화된 뷰마다 한 행씩, 여러 행을 표시합니다. 예제:

```sql
mysql > SHOW ALTER TABLE COLUMN\G;
*************************** 1. row ***************************
        JobId: 20021
    TableName: tbl1
   CreateTime: 2019-08-05 23:03:13
   FinishTime: 2019-08-05 23:03:42
    IndexName: tbl1
      IndexId: 20022
OriginIndexId: 20017
SchemaVersion: 2:792557838
TransactionId: 10023
        State: FINISHED
          Msg:
     Progress: NULL
      Timeout: 86400
1 row in set (0.00 sec)
```

### 작업 취소 {#cancel-jobs}

작업 상태가 `FINISHED` 또는 `CANCELLED`가 아니면 다음 명령으로 Schema Change 작업을 취소할 수 있습니다:

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

## 제한 사항 {#limitations}

| 범주               | 제한 사항                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **동시 실행**        | 단일 테이블에서는 한 번에 하나의 Schema Change 작업만 실행할 수 있습니다                                                             |
| **수정할 수 없는 열**  | 파티션 열과 버킷팅 열은 수정할 수 없습니다                                                                       |
| **키 열 삭제** | 집계 테이블에 REPLACE로 집계되는 값 열이 있으면 키 열을 삭제할 수 없습니다. Unique 테이블의 키 열도 삭제할 수 없습니다 |
| **집계 기본값** | SUM 또는 REPLACE 타입의 값 열을 추가할 때 기존 데이터는 상세 정보가 이미 손실된 상태이므로, 기본값이 실제 집계 후의 값을 반영할 수 없어 기존 데이터에 대해서는 의미가 없습니다 |
| **타입 수정**  | 열 타입을 수정할 때 집계 방식과 기본값은 기존 열 정보와 일치해야 합니다 |
| **NULL 허용 여부 수정** | NOT NULL에서 NULL로 변경하는 것은 지원됩니다(중량 Schema Change). NULL에서 NOT NULL로 변경하는 것은 지원되지 않습니다 |
| **지원되지 않는 수정** | 집계 타입이나 기본값 수정은 지원되지 않습니다 |

## 관련 설정 {#related-configuration}

### FE 설정 {#fe-configuration}

| 설정 항목           | 기본값 | 설명                |
| ---------------------------- | ------------- | -------------------------- |
| `alter_table_timeout_second` | 86400(초) | 작업의 기본 제한 시간 |

### BE 설정 {#be-configuration}

| 설정 항목          | 기본값 | 설명                                                                                                          |
| --------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `alter_tablet_worker_count` | 3             | 기존 데이터를 변환하는 데 사용하는 BE 측 스레드 수입니다. 이 값을 적절히 늘리면 Schema Change 작업 속도를 높일 수 있지만, 스레드가 너무 많으면 IO 부하가 증가하여 다른 작업에 영향을 줄 수 있습니다 |
| `alter_index_worker_count`  | 3             | 기존 데이터에 인덱스를 구축하는 데 사용하는 BE 측 스레드 수입니다(현재는 역색인만 지원). 조정 시 권장 사항은 위와 동일합니다 |

> BE 설정을 조정한 후에는 변경 사항이 적용되도록 BE를 재시작해야 합니다.
