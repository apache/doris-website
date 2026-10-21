---
{
    "title": "UUID 데이터 타입",
    "sidebar_label": "UUID",
    "language": "ko",
    "description": "네이티브 128비트 UUID 타입: 입력 형식, 생성, 변환, 테이블 설계 및 파일 호환성."
}
---

## 설명 {#description}

`UUID`는 128비트 범용 고유 식별자를 16바이트에 저장합니다. 효율적인 저장, 동등 조건 필터링, 조인 또는 정렬이 필요한 식별자에 사용하세요. 텍스트 출력은 항상 소문자 정규 형식을 사용합니다: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

## 구문 및 입력 형식 {#syntax-and-input-format}

```sql
UUID
```

| 속성 | 동작 |
| --- | --- |
| 저장 공간 | 고정 크기 16바이트 값이며, 정규 형식 텍스트는 36자입니다 |
| 정규 형식 입력 | 32자리 십육진수이며, `8-4-4-4-12` 위치에 하이픈을 사용합니다 |
| 축약 형식 입력 | 하이픈 없는 32자리 십육진수입니다 |
| 대소문자 | 대문자와 소문자 십육진수 숫자를 모두 허용하며, 출력은 소문자입니다 |
| 값 범위 | `00000000-0000-0000-0000-000000000000`부터 `ffffffff-ffff-ffff-ffff-ffffffffffff`까지 |
| 유효성 검사 | 특정 UUID 버전이나 변형을 요구하지 않고 텍스트 형식을 검사합니다 |
| NULL | NULL을 허용하는 컬럼에서 지원합니다. 모든 비트가 영인 UUID는 `NULL`과 구별되는 유효한 값입니다 |
| 정렬 순서 | 정규 바이트 순서에 따른 부호 없는 128비트 값의 순서이며, 정규 형식으로 정규화한 텍스트의 사전식 순서와 같습니다 |

## 기본 사용법 {#basic-usage}

```sql
CREATE DATABASE IF NOT EXISTS uuid_demo;
USE uuid_demo;

CREATE TABLE uuid_events (
    id INT NOT NULL,
    event_id UUID NULL,
    generated_id UUID NOT NULL DEFAULT UUID_V7()
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO uuid_events (id, event_id) VALUES
    (1, '550E8400E29B41D4A716446655440000'),
    (2, '00000000-0000-0000-0000-000000000000'),
    (3, NULL);

SELECT id, event_id, UUID_VERSION(generated_id) AS generated_version
FROM uuid_events ORDER BY id;
```

```text
+----+--------------------------------------+-------------------+
| id | event_id                             | generated_version |
+----+--------------------------------------+-------------------+
| 1  | 550e8400-e29b-41d4-a716-446655440000 | 7                 |
| 2  | 00000000-0000-0000-0000-000000000000 | 7                 |
| 3  | NULL                                 | 7                 |
+----+--------------------------------------+-------------------+
```

`generated_id`를 생략하면 각 행에 생성된 값이 할당됩니다. 실제 텍스트는 실행할 때마다 달라집니다.

```sql
SELECT id FROM uuid_events
WHERE event_id = CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID);
```

```text
+----+
| id |
+----+
| 1  |
+----+
```

## 함수 및 변환 {#functions-and-conversion}

| 함수 | 반환값 및 용도 |
| --- | --- |
| [UUID_V4](../../sql-functions/scalar-functions/uuid-functions/uuid-v4.md) | 네이티브 무작위 UUID v4. 별칭은 `GENERATE_UUID_V4()` 및 `GENERATEUUIDV4()`입니다 |
| [UUID_V7](../../sql-functions/scalar-functions/uuid-functions/uuid-v7.md) | 밀리초 타임스탬프를 포함하는 네이티브 UUID v7. 별칭은 `GENERATE_UUID_V7()` 및 `GENERATEUUIDV7()`입니다 |
| [UUID_VERSION](../../sql-functions/scalar-functions/uuid-functions/uuid-version.md) | `TINYINT` 버전 필드(0–15)를 반환하며, 변형은 검증하지 않습니다 |
| [TO_UUID_OR_NULL](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-null.md) | 텍스트를 파싱합니다. 유효하지 않은 텍스트와 `NULL`은 `NULL`을 반환합니다 |
| [TO_UUID_OR_ZERO](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-zero.md) | 텍스트를 파싱합니다. 유효하지 않은 텍스트는 모든 비트가 영인 UUID를 반환하고, `NULL`은 `NULL`로 유지됩니다 |
| [TO_UUID_OR_DEFAULT](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-default.md) | 텍스트를 파싱합니다. 유효하지 않은 텍스트나 `NULL`에는 지정된 UUID 대체 값을 사용하며, 기본 대체 값은 모든 비트가 영인 UUID입니다 |
| [UUID_V7_TO_DATETIME](../../sql-functions/scalar-functions/uuid-functions/uuid-v7-to-datetime.md) | 선택한 시간대의 `DATETIME(3)`으로 타임스탬프를 추출합니다 |
| [DATETIME_TO_UUID_V7](../../sql-functions/scalar-functions/uuid-functions/datetime-to-uuid-v7.md) | 날짜와 시간을 세션 시간대로 해석하여 UUID v7을 생성합니다 |
| [UUID](../../sql-functions/scalar-functions/string-functions/uuid.md) | 네이티브 UUID 타입 대신 `VARCHAR`를 반환하는 기존 함수입니다 |

텍스트를 파싱하려면 `CAST(text AS UUID)`를 사용하고, 정규 형식으로 출력하려면 `CAST(uuid AS STRING)`을 사용하세요. `enable_strict_cast = true`이면 유효하지 않은 텍스트에 대해 오류가 발생하며, 이 설정을 비활성화하면 유효하지 않은 텍스트는 `NULL`을 반환합니다. `TRY_CAST(text AS UUID)`는 어느 모드에서든 유효하지 않은 텍스트에 대해 `NULL`을 반환합니다. UUID와 정수, 부동소수점, 날짜/시간 또는 IP 타입 사이의 직접 캐스팅은 지원하지 않습니다. 암시적 변환, VARIANT 및 마이그레이션 규칙은 [UUID 변환](conversion/uuid-conversion.md)을 참조하세요.

기존 `IS_UUID()`는 중괄호로 감싼 정규 형식 UUID처럼 네이티브 파서가 거부하는 일부 텍스트도 허용합니다. UUID 컬럼에 사용할 텍스트를 검증하려면 `TO_UUID_OR_NULL()` 또는 `TRY_CAST`를 사용하세요.

## 테이블 설계 및 제한 사항 {#table-design-and-restrictions}

- UUID 컬럼은 Duplicate, Unique 및 Aggregate 테이블의 키와 해시 분산 컬럼으로 사용할 수 있습니다.
- UUID 컬럼은 RANGE 또는 LIST 파티션 컬럼으로 사용할 수 없으며, 다중 컬럼 파티션이나 `AUTO PARTITION BY LIST`에서도 사용할 수 없습니다. UUID 컬럼에 대한 동적 파티셔닝도 지원하지 않습니다.
- UUID 값은 비교, `IN`, 정렬, 그룹화, 조인, `MIN`, `MAX` 및 `COUNT(DISTINCT ...)`를 지원합니다. UUID는 숫자 타입이 아니므로 산술 연산과 `SUM`, `AVG` 같은 숫자 집계 함수는 지원하지 않습니다.
- Aggregate 테이블의 UUID 값 컬럼은 `MIN`, `MAX`, `REPLACE` 및 `REPLACE_IF_NOT_NULL`을 지원합니다.
- UUID는 ARRAY 요소, MAP 키 또는 값, STRUCT 필드로 사용할 수 있습니다. 이를 포함하는 복합 타입의 기존 제약 조건은 그대로 적용됩니다.
- UUID는 접두사, ZoneMap, BloomFilter 및 역색인을 지원합니다. 역색인에는 텍스트 파서 없이 동등 조건/범위 조회를 사용하세요. UUID는 NGRAM_BF 또는 벡터 인덱스를 지원하지 않습니다.
- UUID는 `AUTO_INCREMENT` 컬럼이나 Sequence 컬럼으로 사용할 수 없습니다.
- 테이블 생성 시 UUID 컬럼은 리터럴 기본값과 동적 기본값 `UUID_V4()` / `UUID_V7()` 및 해당 별칭을 지원합니다. 동적 UUID 기본값은 UUID 컬럼에서만 사용할 수 있습니다. 
- `ALTER TABLE ADD COLUMN`은 UUID 리터럴 기본값을 허용하지만, UUID 생성기 기본값은 허용하지 않습니다. 기존 행마다 독립적이고 영구적인 생성 값을 채워 넣을 수 없기 때문입니다. 스키마 변경을 통해 다른 컬럼 타입을 UUID로 직접 변경하거나 UUID를 다른 타입으로 직접 변경하는 것은 지원하지 않습니다. 새 컬럼이나 테이블을 만들고 삽입 과정에서 변환하세요.

## 데이터 적재, 내보내기 및 클라이언트 {#loading-export-and-clients}

CSV 입력에서는 UUID 텍스트를 필드로 제공하고, JSON 입력에서는 JSON 문자열 또는 `null`로 제공하세요. 정규 형식과 축약 형식의 텍스트를 모두 허용합니다. 대체 값을 명시적으로 선택하려면 원본을 텍스트 형태로 데이터 적재하고, 컬럼 매핑에서 `TO_UUID_OR_*` 함수 중 하나를 사용하세요.

구조화된 인터페이스는 텍스트 형식 대신 16바이트 값을 전달합니다. Arrow IPC와 Arrow Flight SQL은 표준 `arrow.uuid` 확장을 사용하며, 기반 타입은 `fixed_size_binary(16)`입니다. Parquet 및 ORC 내보내기에서는 바이너리 값을 타입 메타데이터와 함께 기록합니다. `STRING` 컬럼에는 영향이 없습니다. UUID 텍스트가 들어 있는 문자열도 여전히 텍스트로 전송되고 내보내집니다.

| 인터페이스 또는 형식 | UUID 표현 방식 |
| --- | --- |
| MySQL 프로토콜 | 정규 형식 텍스트입니다. Doris 컬럼이 UUID여도 클라이언트는 문자열 타입으로 보고할 수 있습니다 |
| Arrow Flight SQL | 네이티브 UUID를 표준 `arrow.uuid` 확장으로 표현하며, 기반 형식은 16바이트 big-endian `fixed_size_binary(16)` 값입니다. ARRAY, MAP 또는 STRUCT에 중첩된 UUID 요소도 포함됩니다. Arrow Flight SQL JDBC 드라이버를 사용하면 컬럼 타입은 `Types.OTHER`이며, `getObject()`는 `java.util.UUID`를 반환하고, `getString()`은 정규 형식 텍스트를 반환하며, `getBytes()`는 16바이트를 반환합니다 |
| CSV, JSON 및 Hive Text 출력 | 정규 형식 텍스트입니다. JSON에서는 UUID 값을 문자열로 표현합니다 |
| `OUTFILE` / `EXPORT`를 통한 Parquet 내보내기 | Parquet UUID 논리 어노테이션이 있는 `FIXED_LEN_BYTE_ARRAY(16)`을 사용하며, 정규 big-endian 바이트 순서로 저장합니다. 중첩된 UUID 요소도 포함됩니다. dev 버전은 TVF 스키마 추론 중에 네이티브 UUID도 복원합니다 |
| `OUTFILE` / `EXPORT`를 통한 ORC 내보내기 | `BINARY`에 Doris 전용 `doris.logical_type=uuid` 속성을 사용하며, 중첩된 UUID 요소도 포함됩니다. ORC에는 표준 UUID 타입이 없으므로 다른 도구에서는 일반 바이너리로 인식합니다 |
| 네이티브 Parquet UUID 입력 | UUID 어노테이션이 있는 `FIXED_LEN_BYTE_ARRAY(16)`을 정규 big-endian 바이트 순서로 지원하며, 중첩된 요소도 포함됩니다. dev 버전은 네이티브 `UUID`를 추론하며, `enable_mapping_varbinary`와 무관하게 동작합니다. 4.1.5의 TVF는 해당 옵션에 따라 STRING / VARBINARY를 사용합니다 |
| ORC 입력 | `BINARY` 컬럼에 `doris.logical_type=uuid` 속성이 있으면 네이티브 UUID로 다시 읽습니다. 중첩된 요소와 두 ORC 리더 모두에서 지원하며, TVF는 이러한 컬럼을 `uuid`, `array<uuid>` 및 `struct<k:uuid>`로 보고합니다. dev 버전에서 별도 표시가 없는 `BINARY`는 `VARBINARY`로 매핑되며, `STRING`은 `STRING`으로 유지됩니다 |
| Iceberg | dev 버전은 Iceberg UUID를 네이티브 Doris UUID에 직접 매핑하며, `enable.mapping.varbinary`와 무관하게 동작합니다. Doris 4.1.5는 이를 `VARBINARY(16)`에 매핑합니다. Parquet 쓰기에서는 UUID 논리 어노테이션을 유지합니다 |
| ClickHouse JDBC Catalog | ClickHouse UUID는 네이티브 Doris UUID에 매핑됩니다. 이전에 문서화된 릴리스에서는 STRING에 매핑됩니다 |
| Python UDF | SQL UUID는 `uuid.UUID`에 매핑되고, `NULL`은 `None`에 매핑됩니다. 스칼라 함수, 벡터화 함수(`list` 및 `pandas.Series`), 집계 함수 및 테이블 함수에서 지원하며, ARRAY, MAP 또는 STRUCT에 중첩된 UUID 요소도 포함됩니다. UUID를 반환하는 함수는 `uuid.UUID` 객체 또는 `None`을 반환해야 합니다 |
| Java UDF | SQL UUID는 `java.util.UUID`에 매핑되며, 지원되는 복합 타입 내부에서도 동일하게 적용됩니다 |

## 권장 사용법 {#best-practices}

식별자가 UUID이고 16바이트 저장 공간이나 UUID 비교가 유용한 경우 네이티브 타입을 사용하세요. 마이그레이션 전에 기존 문자열 데이터를 정규화하고 검증하세요. 원래 표기나 UUID가 아닌 식별자를 보존해야 한다면 텍스트 저장 방식을 유지하세요. 무작위 식별자에는 `UUID_V4()`를 사용하고, 대략적인 시간 지역성을 갖는 식별자에는 `UUID_V7()`을 사용하세요. 이벤트 시간 필터링에는 별도의 날짜/시간 컬럼을 유지하세요. 분산 UUID v7 생성은 전역 순서나 정확한 이벤트 타임스탬프를 제공하지 않습니다.
