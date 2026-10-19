---
{
    "title": "데이터 내보내기 개요",
    "language": "ko",
    "description": "Apache Doris 데이터 내보내기 개요: 쿼리 결과 집합이나 테이블 데이터를 Parquet, ORC, CSV 등의 형식으로 HDFS, S3 또는 로컬 파일 시스템에 내보내는 방법을 설명합니다."
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Data export solution selection / Cross-system data exchange -->

데이터 내보내기 기능은 **쿼리 결과 집합**이나 **Apache Doris 테이블 데이터**를 지정된 파일 형식으로 지정된 스토리지 시스템에 기록합니다. 주로 결과 집합 다운로드와 시스템 간 데이터 교환에 사용됩니다.

## 데이터 내보내기와 데이터 백업 비교 {#data-export-vs-data-backup}

데이터 내보내기와 데이터 백업 모두 Apache Doris의 데이터를 외부 스토리지로 출력할 수 있지만, 용도가 다릅니다. 다음 표는 두 기능의 주요 차이점을 비교합니다.

| 비교 항목                | 데이터 내보내기                                                        | 데이터 백업                                                       |
| ------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 최종 저장 위치           | HDFS, 객체 스토리지, 로컬 파일 시스템                                  | HDFS, 객체 스토리지                                                |
| 데이터 형식              | Parquet, ORC, CSV 등의 개방형 형식                                     | Apache Doris 내부 저장 형식                                        |
| 실행 속도                | 보통(데이터를 읽고 대상 형식으로 변환해야 함)                          | 빠름(Doris 데이터 파일을 직접 업로드하므로 파싱이나 변환이 필요 없음) |
| 유연성                   | SQL로 내보내기 범위를 유연하게 정의 가능                               | 테이블 단위의 전체 백업만 지원                                     |
| 주요 사용 시나리오       | 결과 집합 다운로드, 서로 다른 시스템 간 데이터 교환                  | 데이터 백업, Apache Doris 클러스터 간 데이터 마이그레이션           |

## 내보내기 방법 선택 {#choosing-an-export-method}

<!-- Knowledge type: Architecture selection decision -->

Apache Doris는 다양한 내보내기 요구 사항에 맞춰 다음 세 가지 데이터 내보내기 방법을 제공합니다.

- **[SELECT INTO OUTFILE](./outfile.md)**: 모든 SQL 결과 집합의 내보내기를 지원합니다.
- **[EXPORT](./export-manual.md)**: 테이블 단위로 데이터 일부 또는 전체를 내보낼 수 있습니다.
- **[MySQL DUMP](./export-with-mysql-dump.md)**: MySQL Dump 명령과 호환되는 데이터 내보내기를 지원합니다.

### 세 가지 방법의 기능 비교 {#capability-comparison-of-the-three-methods}

다음 표는 실행 방식, SQL 기능, 동시성, 지원 형식을 기준으로 세 가지 내보내기 방법을 비교하여 빠르게 선택할 수 있도록 돕습니다.

| 비교 항목                | SELECT INTO OUTFILE                                                          | EXPORT                                                | MySQL DUMP             |
| ------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------- |
| 동기 / 비동기            | 동기                                                                         | 비동기(제출 후 `SHOW EXPORT`로 진행 상황 확인)          | 동기                   |
| 임의의 SQL 지원          | 지원                                                                         | 미지원                                                | 미지원                 |
| 지정된 파티션 내보내기   | 지원                                                                         | 지원                                                  | 미지원                 |
| 지정된 Tablet 내보내기   | 지원                                                                         | 미지원                                                | 미지원                 |
| 동시 내보내기            | 지원, 높은 동시성(`ORDER BY` 등의 단일 노드 연산자에 의해 제한됨)              | 지원, 높은 동시성(Tablet 단위 동시성)                  | 미지원, 단일 스레드 내보내기 |
| 지원하는 내보내기 형식   | Parquet, ORC, CSV                                                             | Parquet, ORC, CSV                                      | MySQL Dump 전용 형식    |
| 외부 테이블 지원         | 지원                                                                         | 일부 지원                                             | 미지원                 |
| 뷰 지원                  | 지원                                                                         | 지원                                                  | 지원                   |
| 지원하는 내보내기 위치   | S3, HDFS                                                                     | S3, HDFS                                              | LOCAL                  |

### 적합한 시나리오 {#applicable-scenarios}

#### SELECT INTO OUTFILE {#select-into-outfile}

다음 시나리오에 적합합니다.

- 내보낼 데이터에 필터링, 집계, 조인 등의 복잡한 연산 로직을 적용해야 하는 경우
- 동기 작업 실행이 적합한 경우

자세한 사용법은 [SELECT INTO OUTFILE](./outfile.md)을 참고하세요.

#### EXPORT {#export}

다음 시나리오에 적합합니다.

- 간단한 필터 조건만으로 단일 테이블의 대용량 데이터를 내보내는 경우
- 비동기 작업 제출이 필요한 경우

자세한 사용법은 [Export 비동기 내보내기](./export-manual.md)를 참고하세요.

#### MySQL Dump {#mysql-dump}

다음 시나리오에 적합합니다.

- MySQL 생태계와의 호환성이 필요하고, 테이블 스키마와 데이터를 모두 내보내야 하는 경우
- 개발, 테스트 또는 데이터 양이 매우 적은 경우에만 사용

자세한 사용법은 [MySQL Dump](./export-with-mysql-dump.md)를 참고하세요.

## 내보낸 파일의 컬럼 타입 매핑 {#column-type-mapping-for-exported-files}

<!-- Knowledge type: Configuration parameters / Type mapping reference -->

Parquet와 ORC 파일 형식에는 각각 고유한 데이터 타입 정의가 있으며, Apache Doris는 내보내기 시 내부 데이터 타입을 해당 Parquet/ORC 타입으로 자동 변환합니다. CSV 형식에는 타입 정의가 없으므로 모든 데이터가 텍스트로 출력됩니다.

Apache Doris 데이터 타입과 ORC 및 Parquet 형식 간의 매핑은 다음과 같습니다.

UUID 값은 CSV에서만 36자 길이의 소문자 표준 텍스트로 내보냅니다. Parquet에서는 UUID 컬럼을 Parquet UUID 논리 주석이 있는 `FIXED_LEN_BYTE_ARRAY(16)`로, 표준 빅 엔디언 바이트 순서로 기록합니다. ORC에는 표준 UUID 타입이 없으므로, ORC에서는 UUID 컬럼을 Doris 전용 `BINARY` 타입과 `doris.logical_type=uuid` 속성으로 기록합니다. ARRAY, MAP 또는 STRUCT 안에 중첩된 UUID 요소에도 최상위 컬럼과 같은 표현을 사용합니다. dev 버전에서는 Doris가 작성한 ORC 파일이나 UUID 논리 주석이 있는 Parquet 파일을 테이블 반환 함수로 다시 읽으면 네이티브 UUID 타입이 복원됩니다. Iceberg UUID 필드에 기록할 때는 [Iceberg 컬럼 타입 매핑](../../lakehouse/catalogs/iceberg-catalog.mdx#column-type-mapping)을 따릅니다.

### ORC 타입 매핑 {#orc-type-mapping}

| Doris 타입              | ORC 타입  |
| ----------------------- | --------- |
| boolean                 | boolean   |
| tinyint                 | tinyint   |
| smallint                | smallint  |
| int                     | int       |
| bigint                  | bigint    |
| largeInt                | string    |
| date                    | string    |
| datev2                  | date      |
| datetime                | string    |
| datetimev2              | timestamp |
| timestamptz | timestamp with local time zone (ORC TIMESTAMP_INSTANT; 4.1.5부터 시점 의미 보존) |
| varbinary | binary |
| float                   | float     |
| double                  | double    |
| char / varchar / string | string    |
| uuid                    | binary    |
| decimal                 | decimal   |
| struct                  | struct    |
| map                     | map       |
| array                   | array     |
| json                    | string    |
| variant                 | string    |
| bitmap                  | binary    |
| quantile_state          | binary    |
| hll                     | binary    |

### Parquet 타입 매핑 {#parquet-type-mapping}

Apache Doris는 Parquet 파일 형식으로 내보낼 때 먼저 메모리에 있는 Doris 데이터를 Arrow 메모리 형식으로 변환한 다음, Arrow를 통해 Parquet 파일에 기록합니다. 매핑은 다음과 같습니다.

| Doris 타입              | Arrow 타입  | Parquet 물리 타입     | Parquet 논리 타입                |
| ----------------------- | ----------- | --------------------- | -------------------------------- |
| boolean                 | boolean     | BOOLEAN               |                                  |
| tinyint                 | int8        | INT32                 | INT_8                            |
| smallint                | int16       | INT32                 | INT_16                           |
| int                     | int32       | INT32                 | INT_32                           |
| bigint                  | int64       | INT64                 | INT_64                           |
| largeInt                | utf8        | BYTE_ARRAY            | UTF8                             |
| date                    | utf8        | BYTE_ARRAY            | UTF8                             |
| datev2                  | date32      | INT32                 | DATE                             |
| datetime                | utf8        | BYTE_ARRAY            | UTF8                             |
| datetimev2              | timestamp   | INT96 / INT64         | TIMESTAMP(MICROS/MILLIS/SECONDS) |
| float                   | float32     | FLOAT                 |                                  |
| double                  | float64     | DOUBLE                |                                  |
| char / varchar / string | utf8        | BYTE_ARRAY            | UTF8                             |
| uuid                    | fixed_size_binary(16) | FIXED_LEN_BYTE_ARRAY | UUID                    |
| decimal                 | decimal128  | FIXED_LEN_BYTE_ARRAY  | DECIMAL(scale, precision)        |
| struct                  | struct      |                       | Parquet Group                    |
| map                     | map         |                       | Parquet Map                      |
| array                   | list        |                       | Parquet List                     |
| json                    | utf8        | BYTE_ARRAY            | UTF8                             |
| variant                 | utf8        | BYTE_ARRAY            | UTF8                             |
| bitmap                  | binary      | BYTE_ARRAY            |                                  |
| quantile_state          | binary      | BYTE_ARRAY            |                                  |
| hll                     | binary      | BYTE_ARRAY            |                                  |

:::note
Parquet Export 및 Outfile에서는 `enable_int96_timestamps` 속성으로 Doris `DATETIMEV2` 값의 물리적 인코딩을 선택할 수 있습니다. 기본값은 `false`이며, Parquet timestamp 논리 타입을 사용해 `INT64`로 기록합니다. 이 속성을 `true`로 설정하여 더 이상 권장되지 않는 `INT96` 인코딩으로 기록하는 것은 Hive 2 또는 Hive 3 같은 레거시 다운스트림 리더에서 해당 인코딩을 요구하는 경우로 제한하세요. 비동기 Export는 이 속성을 내보내기 작업과 함께 저장하고 작업 실행 시 적용합니다. 이후 Doris에서 명시적으로 `INT96`로 내보낸 파일을 읽을 때는 Hive Catalog 또는 파일 테이블 반환 함수에서 `hive.parquet.time-zone`을 내보내기 세션의 시간대로 설정하여 FileScannerV2가 원래의 로컬 시각 값을 복원하도록 하세요. 이 기본값은 4.1.5부터 적용되며, 속성에는 `true` 또는 `false`만 지정할 수 있습니다.
:::

## 관련 문서 {#related-documents}

- [Export 비동기 내보내기](./export-manual.md): `EXPORT` 명령으로 테이블 또는 파티션 데이터를 비동기로 내보냅니다.
- [SELECT INTO OUTFILE](./outfile.md): `SELECT INTO OUTFILE`로 쿼리 결과를 동기로 내보냅니다.
- [MySQL Dump](./export-with-mysql-dump.md): `mysqldump` 도구로 테이블 스키마와 데이터를 내보냅니다.
- [데이터 내보내기 모범 사례](./export-best-practice.md): 내보내기 동시성 조정과 내보내기 속도 평가 방법을 설명합니다.
