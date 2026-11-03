---
{
    "title": "OceanBase CDC 자동 테이블 생성",
    "language": "ko",
    "sidebar_label": "자동 테이블 생성 동기화",
    "description": "Streaming Job을 통해 OceanBase MySQL 호환 모드의 기본 키 테이블에서 Doris로 전체 및 증분 데이터를 지속적으로 동기화하는 방법을 알아봅니다.",
    "keywords": [
        "OceanBase 자동 테이블 생성 동기화",
        "OceanBase CDC",
        "OBBinlog",
        "Doris Streaming Job",
        "지속적 데이터 적재",
        "전체 및 증분 동기화",
        "자동 테이블 생성"
    ]
}
---

:::caution 실험적 기능

Doris 지속적 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror an OceanBase database in MySQL compatibility mode to Doris -->

OceanBase CDC 자동 테이블 생성 동기화는 `FROM OCEANBASE (...) TO DATABASE (...)`를 사용합니다. Doris는 OBBinlog 서비스를 통해 전체 및 증분 데이터를 읽고 업스트림 스키마에서 Doris Unique Key 테이블을 자동으로 생성합니다. `include_tables`를 사용하여 데이터베이스의 단일 테이블, 여러 테이블 또는 모든 테이블을 동기화할 수 있습니다.

OceanBase CDC 지속적 데이터 적재는 현재 OceanBase MySQL 호환 모드와 자동 테이블 생성 동기화만 지원합니다. Oracle 호환 모드와 SQL 매핑 동기화는 지원되지 않습니다.

### 적용 시나리오 {#applicable-scenarios}

- OceanBase 테이블 그룹 또는 전체 데이터베이스를 Doris에 미러링합니다.
- Doris가 업스트림 스키마에서 대상 테이블과 기본 키를 생성하도록 합니다.
- 초기 전체 적재를 수행한 다음 증분 변경 사항을 지속적으로 동기화합니다.
- SQL 표현식, 행 필터 또는 데이터 변환 없이 대상 테이블 이름을 바꾸거나 열을 제외합니다.

### 기능 및 제한 사항 {#capabilities-and-limitations}

| 항목 | 설명 |
| --- | --- |
| 호환 모드 | OceanBase MySQL 호환 모드만 지원 |
| 동기화 방식 | 자동 테이블 생성 동기화만 지원하며 SQL 매핑 동기화는 지원되지 않음 |
| 일관성 의미 체계 | at-least-once |
| 테이블 유형 | 업스트림 테이블에는 기본 키가 있어야 하며 자동 생성되는 Doris 테이블은 Unique Key 모델을 사용 |
| 권한 | Load 권한이 필요하며 대상 테이블이 없을 때는 Create 권한도 필요 |
| Schema Change | `ADD COLUMN` 및 `DROP COLUMN`을 동기화합니다. [Schema Change Sync](./schema-change-oceanbase.md) 참조 |
| 데이터 유형 | MySQL 호환 유형 변환을 사용합니다. [Data Type Mapping](./data-type-mapping-oceanbase.md) 참조 |

## 사전 요구 사항 {#prerequisites}

작업을 생성하기 전에 다음을 확인하세요.

1. OceanBase가 MySQL 호환 모드로 실행되고 있습니다. Doris는 작업을 생성할 때 `SHOW VARIABLES LIKE 'ob_compatibility_mode'`를 실행하여 모드를 검증합니다.
2. OBBinlog 서비스가 배포되어 사용 가능한 상태입니다. 해당 MySQL 프로토콜 엔드포인트에서 `SHOW MASTER STATUS`를 실행하면 유효한 binlog 파일과 위치가 반환됩니다.
3. Doris FE, BE 및 CDC Client가 OBBinlog 서비스에 액세스할 수 있습니다.
4. 호환되는 MySQL Connector/J 드라이버를 사용할 수 있고 `jdbc_url`이 `jdbc:mysql://`로 시작합니다.
5. 소스 계정이 동기화 범위 내의 테이블, 스키마 및 binlog를 읽을 수 있습니다.
6. 동기화할 모든 업스트림 테이블에 기본 키가 있습니다.

## 빠른 시작 {#quick-start}

### 1단계: 적재 작업 생성 {#step-1-create-a-load-job}

다음 예제는 `source_db`의 `users` 및 `orders` 테이블을 동기화합니다.

```sql
CREATE JOB oceanbase_db_sync
ON STREAMING
FROM OCEANBASE (
    "jdbc_url" = "jdbc:mysql://127.0.0.1:2883",
    "driver_url" = "mysql-connector-j-8.4.0.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root@test",
    "password" = "123456",
    "database" = "source_db",
    "include_tables" = "users,orders",
    "offset" = "initial"
)
TO DATABASE target_db (
    "table.create.properties.replication_num" = "1"
);
```

- `jdbc_url`은 OBBinlog 서비스의 MySQL 프로토콜 포트를 가리킵니다. 배포 환경에 구성된 포트를 사용하세요.
- `offset = "initial"`은 기존 행을 먼저 적재한 다음 binlog 변경 사항을 지속적으로 동기화합니다.
- `include_tables`를 생략하면 `database`의 모든 적격 테이블이 동기화됩니다.
- 단일 BE 배포에서는 `replication_num`을 `1`로 설정하세요. 프로덕션에서는 클러스터 크기에 따라 복제본 수를 설정하세요.

### 2단계: 적재 상태 확인 {#step-2-check-load-status}

```sql
SELECT Name, Status, CurrentOffset, ErrorMsg
FROM jobs("type" = "insert")
WHERE Name = "oceanbase_db_sync";
```

작업이 정상적으로 실행 중이면 `Status`는 `RUNNING`입니다.

```text
+-------------------+---------+-----------------------------------------------+----------+
| Name              | Status  | CurrentOffset                                 | ErrorMsg |
+-------------------+---------+-----------------------------------------------+----------+
| oceanbase_db_sync | RUNNING | {"file":"binlog.000001","pos":"154", ...} | NULL     |
+-------------------+---------+-----------------------------------------------+----------+
```

### 3단계: 증분 동기화 확인 {#step-3-verify-incremental-sync}

OceanBase 소스 테이블에서 `INSERT`, `UPDATE` 또는 `DELETE`를 실행한 후 해당 Doris 테이블을 쿼리하여 변경 사항이 동기화되었는지 확인합니다.

```sql
SELECT * FROM target_db.users ORDER BY id;
```

일시 중지, 재개, 삭제 및 Task 쿼리 작업은 [Continuous Load Overview](./continuous-load-overview.md#common-operations)를 참조하세요.

## 데이터 소스 매개변수 {#data-source-parameters}

| 매개변수 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `jdbc_url` | 예 | - | OBBinlog 서비스의 JDBC 연결 문자열입니다. `jdbc:mysql://`로 시작해야 합니다. |
| `driver_url` | 예 | - | MySQL Connector/J 드라이버 jar의 경로입니다. 파일 이름, 로컬 절대 경로 또는 HTTP URL을 지원합니다. |
| `driver_class` | 예 | - | MySQL JDBC 드라이버 클래스입니다. 예: `com.mysql.cj.jdbc.Driver`. |
| `user` | 예 | - | OceanBase 사용자 이름입니다. OceanBase에서 요구하는 사용자 이름 형식으로 테넌트 정보를 포함하세요. |
| `password` | 예 | - | OceanBase 사용자 비밀번호입니다. |
| `database` | 예 | - | OceanBase 데이터베이스 이름입니다. |
| `include_tables` | 아니요 | - | 동기화할 테이블 이름을 쉼표로 구분하여 지정합니다. 생략하면 데이터베이스의 모든 테이블이 동기화됩니다. |
| `exclude_tables` | 아니요 | - | 동기화하지 않을 테이블 이름을 쉼표로 구분하여 지정합니다. `include_tables`가 설정되지 않은 경우에만 적용됩니다. |
| `table.<table_name>.target_table` | 아니요 | 소스 테이블 이름 | 소스 테이블의 Doris 대상 테이블 이름을 설정합니다. |
| `table.<table_name>.exclude_columns` | 아니요 | - | 소스 테이블에서 키가 아닌 열을 제외합니다. 열 이름은 쉼표로 구분하며 각 열이 존재해야 하고 기본 키 열은 제외할 수 없습니다. |
| `offset` | 아니요 | `latest` | 시작 위치입니다. `initial`: 전체 및 증분 동기화, `snapshot`: 전체 동기화만 수행, `earliest`: 사용 가능한 가장 이른 binlog 위치에서 시작, `latest`: 작업 시작 후의 변경 사항만 동기화합니다. `{"file":"binlog.000001","pos":"154"}`와 같은 정확한 위치도 지원됩니다. |
| `snapshot_split_size` | 아니요 | `40960` | 전체 동기화 단계에서 각 분할에 포함되는 행 수입니다. 양의 정수여야 합니다. |
| `snapshot_parallelism` | 아니요 | `1` | 전체 동기화 단계에서 하나의 Task가 동시에 예약할 수 있는 최대 분할 수입니다. 양의 정수여야 합니다. |
| `skip_snapshot_backfill` | 아니요 | `true` | 스냅샷 단계에서 binlog 백필을 건너뛸지 여부입니다. 자동 테이블 생성 동기화는 at-least-once 의미 체계를 제공합니다. |
| `server_id` | 아니요 | 자동 생성 | CDC reader의 서버 ID입니다. `5400`과 같은 단일 값 또는 `5400-5408`과 같은 닫힌 범위를 지원합니다. 범위에는 최소 `snapshot_parallelism`개의 ID가 포함되어야 합니다. |
| `ssl_mode` | 아니요 | `disable` | SSL 모드입니다. 유효한 값은 `disable`, `require` 및 `verify-ca`입니다. |
| `ssl_rootcert` | 조건부 필수 | - | `ssl_mode`가 `verify-ca`일 때 필요합니다. `FILE:<file_name>` 형식을 사용하고 [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md)로 먼저 파일을 업로드하세요. |

`schema`, `slot_name` 및 `publication_name` 매개변수는 지원되지 않습니다. 이 중 하나라도 지정하면 작업 생성이 실패합니다.

## 참조 매뉴얼 {#reference-manual}

### 적재 문 {#load-statement}

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[COMMENT <comment>]
FROM OCEANBASE (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
);
```

| 모듈 | 설명 |
| --- | --- |
| `job_name` | 작업 이름입니다. |
| `job_properties` | `max_interval` 및 `compute_group`과 같은 공통 Job 매개변수입니다. |
| `comment` | 작업 주석입니다. |
| `source_properties` | OceanBase 데이터 소스 매개변수입니다. |
| `target_properties` | Doris 대상 데이터베이스 매개변수입니다. |

### Doris 대상 데이터베이스 매개변수 {#doris-target-database-parameters}

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris가 테이블을 생성할 때 테이블 속성을 추가합니다. 예: `table.create.properties.replication_num`. |
| `load.strict_mode` | `false` | Stream Load에 strict mode를 활성화할지 여부입니다. |
| `load.max_filter_ratio` | `0` | 샘플링 창에서 허용되는 최대 필터 비율이며 범위는 `[0, 1]`입니다. 비율이 이 값을 초과하면 작업이 일시 중지됩니다. |

## 고려 사항 및 모범 사례 {#considerations-and-best-practices}

- 프로덕션에서 동기화 범위를 확대하기 전에 소수의 테이블로 OBBinlog 연결, 유형 매핑 및 증분 지연 시간을 확인하세요.
- `include_tables`를 사용하여 동기화 범위를 명시적으로 정의하면 나중에 데이터베이스에 추가되는 관련 없는 테이블이 자동으로 포함되지 않습니다.
- 지원되지 않는 키가 아닌 열은 `table.<table_name>.exclude_columns`로 제외하세요. 기본 키 열은 제외할 수 없습니다.
- 지원되지 않는 스키마 변경을 수행하기 전에 작업을 일시 중지하고 Doris 테이블에 호환되는 변경을 적용한 후 작업을 재개하세요.
- `CurrentOffset`, `LagBytes` 및 `ErrorMsg`를 모니터링하여 작업이 계속 진행되고 자동으로 일시 중지되지 않았는지 확인하세요.

## FAQ {#faq}

**Q1: OceanBase Oracle 호환 모드를 지원하나요?**

아니요. Doris는 작업을 생성하는 동안 `ob_compatibility_mode`를 확인하며 MySQL 호환 모드가 아니면 거부합니다.

**Q2: SQL 매핑 동기화를 지원하나요?**

아니요. OceanBase는 현재 `FROM OCEANBASE (...) TO DATABASE (...)` 자동 테이블 생성 동기화만 지원합니다.

**Q3: 작업이 시작된 후 발생한 변경 사항만 동기화하려면 어떻게 해야 하나요?**

`offset`을 `latest`로 설정하세요. 작업이 `RUNNING` 상태에 도달하기 전에 존재하던 행은 스냅샷을 통해 적재되지 않습니다.

**Q4: 기존 대상 테이블을 덮어쓰나요?**

아니요. 자동 테이블 생성은 이미 존재하는 대상 테이블을 건너뜁니다. 대상 테이블의 기본 키와 열 유형이 소스 테이블과 호환되는지 확인하세요.

## 관련 문서 {#related-documents}

- [Continuous Load Overview](./continuous-load-overview.md)
- [OceanBase Schema Change Sync](./schema-change-oceanbase.md)
- [OceanBase Data Type Mapping](./data-type-mapping-oceanbase.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
