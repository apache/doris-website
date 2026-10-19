---
{
    "title": "데이터 내보내기 개요",
    "language": "ko",
    "description": "Apache Doris 데이터 내보내기 개요: 쿼리 결과 집합이나 테이블 데이터를 Parquet, ORC, CSV 등의 형식으로 HDFS, S3 또는 로컬 파일 시스템에 내보내는 방법을 설명합니다."
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Data export solution selection / Cross-system data exchange -->

데이터 내보내기 기능은 **쿼리 결과 집합** 또는 **Apache Doris 테이블 데이터**를 지정한 파일 형식으로 지정한 스토리지 시스템에 기록합니다. 주로 결과 집합 다운로드와 시스템 간 데이터 교환에 사용합니다.

## 데이터 내보내기와 데이터 백업 비교 {#data-export-vs-data-backup}

데이터 내보내기와 데이터 백업은 모두 Apache Doris의 데이터를 외부 스토리지로 출력할 수 있지만, 용도가 다릅니다. 다음 표는 두 기능의 주요 차이점을 비교합니다.

| 비교 항목                | 데이터 내보내기                                                        | 데이터 백업                                                       |
| ------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 최종 저장 위치           | HDFS, 객체 스토리지, 로컬 파일 시스템                                  | HDFS, 객체 스토리지                                                |
| 데이터 형식              | Parquet, ORC, CSV 등의 개방형 형식                                     | Apache Doris 내부 저장 형식                                        |
| 실행 속도                | 보통(데이터를 읽고 대상 형식으로 변환해야 함)                           | 빠름(Doris 데이터 파일을 직접 업로드하므로 파싱이나 변환이 필요하지 않음) |
| 유연성                   | SQL로 내보내기 범위를 유연하게 정의할 수 있음                           | 테이블 단위 전체 백업만 지원                                       |
| 일반적인 사용 사례       | 결과 집합 다운로드, 서로 다른 시스템 간 데이터 교환                   | 데이터 백업, Apache Doris 클러스터 간 데이터 마이그레이션           |

## 내보내기 방식 선택 {#choosing-an-export-method}

<!-- Knowledge type: Architecture selection decision -->

Apache Doris는 다양한 내보내기 요구 사항에 맞춰 다음 세 가지 데이터 내보내기 방식을 제공합니다.

- **[SELECT INTO OUTFILE](./outfile.md)**: 모든 SQL 결과 집합의 내보내기를 지원합니다.
- **[EXPORT](./export-manual.md)**: 테이블 단위로 일부 또는 전체 데이터의 내보내기를 지원합니다.
- **[MySQL DUMP](./export-with-mysql-dump.md)**: MySQL Dump 명령과 호환되는 데이터 내보내기 방식입니다.

### 세 가지 방식의 기능 비교 {#capability-comparison-of-the-three-methods}

다음 표는 실행 방식, SQL 기능, 동시성, 지원 형식을 기준으로 세 가지 내보내기 방식을 비교하여 적합한 방식을 빠르게 선택할 수 있도록 돕습니다.

| 비교 항목                | SELECT INTO OUTFILE                                                          | EXPORT                                                | MySQL DUMP             |
| ------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------- |
| 동기 / 비동기            | 동기                                                                         | 비동기(제출 후 `SHOW EXPORT`로 진행 상황 확인)          | 동기                   |
| 임의의 SQL 지원          | 지원                                                                         | 미지원                                                | 미지원                 |
| 지정한 파티션 내보내기    | 지원                                                                         | 지원                                                  | 미지원                 |
| 지정한 tablet 내보내기    | 지원                                                                         | 미지원                                                | 미지원                 |
| 동시 내보내기            | 높은 동시성 지원(`ORDER BY` 등의 단일 노드 연산자에 의해 제한됨)              | 높은 동시성 지원(Tablet 단위 동시 처리)                | 미지원, 단일 스레드 내보내기 |
| 지원하는 내보내기 형식    | Parquet, ORC, CSV                                                             | Parquet, ORC, CSV                                     | MySQL Dump 전용 형식   |
| 외부 테이블 지원         | 지원                                                                         | 부분 지원                                             | 미지원                 |
| 뷰 지원                  | 지원                                                                         | 지원                                                  | 지원                   |
| 지원하는 내보내기 위치    | S3, HDFS                                                                     | S3, HDFS                                              | LOCAL                  |

### 적합한 사용 사례 {#applicable-scenarios}

#### SELECT INTO OUTFILE {#select-into-outfile}

다음과 같은 경우에 적합합니다.

- 내보낼 데이터에 필터링, 집계, 조인 등의 복잡한 연산이 필요한 경우.
- 동기 작업 실행이 적합한 경우.

자세한 사용 방법은 [SELECT INTO OUTFILE](./outfile.md)을 참조하세요.

#### EXPORT {#export}

다음과 같은 경우에 적합합니다.

- 간단한 필터 조건만 필요한 대용량 단일 테이블 내보내기.
- 작업을 비동기로 제출해야 하는 경우.

자세한 사용 방법은 [EXPORT 비동기 내보내기](./export-manual.md)를 참조하세요.

#### MySQL Dump {#mysql-dump}

다음과 같은 경우에 적합합니다.

- MySQL 생태계와의 호환성이 필요하며, 테이블 스키마와 데이터를 모두 내보내야 하는 경우.
- 개발, 테스트 또는 데이터 양이 매우 적은 경우에만 사용.

자세한 사용 방법은 [MySQL Dump](./export-with-mysql-dump.md)를 참조하세요.

## 내보낸 파일의 열 타입 매핑 {#column-type-mapping-for-exported-files}

<!-- Knowledge type: Configuration parameters / Type mapping reference -->

Parquet와 ORC 파일 형식에는 각각 고유한 데이터 타입 정의가 있으며, Apache Doris는 내보내기 시 내부 데이터 타입을 해당 Parquet/ORC 타입으로 자동 변환합니다. CSV 형식에는 타입 정의가 없으므로 모든 데이터가 텍스트로 출력됩니다.

Apache Doris 데이터 타입과 ORC 및 Parquet 형식 간의 매핑은 다음과 같습니다.

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
| timestamptz | timestamp with local time zone (ORC TIMESTAMP_INSTANT; 4.1.5부터 시점(instant) 의미를 보존) |
| varbinary | binary |
| float                   | float     |
| double                  | double    |
| char / varchar / string | string    |
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

Apache Doris는 데이터를 Parquet 파일 형식으로 내보낼 때 먼저 메모리 내 Doris 데이터를 Arrow 메모리 형식으로 변환한 다음, Arrow를 통해 Parquet 파일에 기록합니다. 매핑은 다음과 같습니다.

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
4.1.5부터 Outfile과 Export는 `enable_int96_timestamps`로 Parquet 타임스탬프 인코딩을 제어합니다. 기본값은 `false`이며, 논리 타임스탬프 타입을 지정하여 `INT64`로 기록합니다. 이전 버전의 기본값은 `INT96`였습니다. 레거시 리더와의 호환성이 필요한 경우에만 `true`로 설정하세요. `true`와 `false`만 허용됩니다. 대신 `parquet.enable_int96_timestamps`를 사용하지 마세요. 시점(instant) 및 로컬 시간(wall-clock) 타임스탬프의 의미는 [Parquet](../../lakehouse/file-formats/parquet.md)를 참조하세요.
:::

## 관련 문서 {#related-documents}

- [EXPORT 비동기 내보내기](./export-manual.md): `EXPORT` 명령으로 테이블 또는 파티션 데이터를 비동기로 내보냅니다.
- [SELECT INTO OUTFILE](./outfile.md): `SELECT INTO OUTFILE`로 쿼리 결과를 동기로 내보냅니다.
- [MySQL Dump](./export-with-mysql-dump.md): `mysqldump` 도구로 테이블 스키마와 데이터를 내보냅니다.
- [데이터 내보내기 모범 사례](./export-best-practice.md): 내보내기 동시성 튜닝과 내보내기 속도 평가 방법을 설명합니다.
