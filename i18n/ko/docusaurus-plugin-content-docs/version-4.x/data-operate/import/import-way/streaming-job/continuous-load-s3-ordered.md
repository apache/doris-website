---
{
    "title": "S3 순서 기반 데이터 적재",
    "sidebar_label": "순서 기반 데이터 적재",
    "language": "ko",
    "description": "Doris Streaming Job을 사용해 S3 파일을 키의 사전식 순서로 지속적으로 적재하는 방법과 SQL, 시작 오프셋, 배치 설정, 파일 이름 제약 조건을 설명합니다.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "순서 기반 데이터 적재"
    ]
}
---

:::caution 실험적 기능

Doris의 지속적 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

순서 기반 데이터 적재는 `ORDERED_LIST`를 사용해 경로와 파일 이름을 포함한 **키의 사전식 순서**로 새 S3 객체를 지속적으로 찾습니다. 타임스탬프나 순번이 증가하도록 이름을 지정한 로그 및 ETL 파일에 적합합니다. 이 순서는 파일을 찾는 순서를 뜻하며 대상 테이블의 행 순서를 보장하지 않습니다.

이 방식은 기본 S3 데이터 적재 모드이며 큐가 필요하지 않습니다. 파일이 순서와 관계없이 도착한다면 [알림 기반 데이터 적재](./continuous-load-s3-notification.md)를 사용하세요. 미리 준비된 고정 파일 집합에는 [일회성 데이터 적재](./continuous-load-s3-one-time.md)를 사용하세요.

## 작동 방식 {#how-it-works}

Doris는 가장 최근에 커밋된 키 이후의 일치하는 파일을 검색합니다. 새 키는 커밋된 키보다 사전식 순서로 커야 합니다. `file1`, `file2`, `file3`를 적재한 뒤 새로 업로드한 `file0`은 읽지 않습니다. 새 파일이 없으면 작업은 `max_interval` 간격으로 확인합니다.

## 빠른 시작 {#quick-start}

### 단계 1: 대상 테이블과 파일 준비 {#step-1-prepare-the-target-table-and-files}

실행 계정에는 대상 테이블에 대한 `LOAD` 권한과 데이터베이스 및 테이블을 생성하는 데 필요한 권한이 있어야 합니다. S3 자격 증명에는 `s3:ListBucket` 및 `s3:GetObject` 권한이 필요합니다. Doris 노드는 S3 endpoint에 접근할 수 있어야 합니다.

```sql
CREATE DATABASE IF NOT EXISTS db1;
CREATE TABLE db1.tbl1 (
    id INT,
    name STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

이 예시는 단일 BE 클러스터에 복제본 하나를 사용합니다. 운영 클러스터에 맞게 복제본 수를 설정하세요. 다음 내용을 `s3://bucket/001.csv`로 업로드하고, SQL의 bucket, endpoint, Region, 자격 증명을 실제 값으로 바꾸세요.

```text
1,Alice
2,Bob
```

### 단계 2: 작업 생성 {#step-2-create-the-job}

기본값을 사용하려면 `s3.ingestion_mode`를 생략하거나, Job의 `PROPERTIES`에서 `ORDERED_LIST`로 명시적으로 설정하세요.

```SQL
CREATE JOB my_job
ON STREAMING
DO
INSERT INTO db1.tbl1
select * from S3(
    "uri" = "s3://bucket/*.csv",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "format" = "csv",
    "column_separator" = ","
);
```

적재한 뒤 `SELECT * FROM db1.tbl1 ORDER BY id;`를 실행하세요. 예상 결과는 다음과 같습니다.

```text
+----+-------+
| id | name  |
+----+-------+
|  1 | Alice |
|  2 | Bob   |
+----+-------+
```

### 단계 3: 진행 상황 확인 {#step-3-monitor-progress}

```sql
SELECT Name, Status, CurrentOffset, EndOffset, ErrorMsg
FROM jobs("type" = "insert")
WHERE Name = 'my_job';
```

`001.csv`가 커밋되면 `Status`는 `RUNNING`, `CurrentOffset`은 `{"fileName":"001.csv"}`일 것으로 예상됩니다. 데이터 적재를 계속하려면 `002.csv`처럼 사전식 순서로 더 큰 키를 업로드하세요. 새 파일이 없어도 작업은 실행 상태를 유지합니다.

## 매개변수 {#parameters}

다음 항목은 Job의 `PROPERTIES`에서 설정합니다. S3 연결, 자격 증명, 파일 형식 옵션은 `S3(...)`에서 설정합니다.

| 매개변수 | 유형 | 기본값 | 필수 여부 | 설명 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | 문자열 | `ORDERED_LIST` | 아니요 | `ORDERED_LIST`로 설정합니다. 생성 후에는 변경할 수 없습니다. |
| `offset` | JSON 문자열 | 없음 | 아니요 | 지정한 키 **이후**부터 읽습니다. 예: `'{"fileName":"data/001.csv"}'`. 설정하지 않으면 일치하는 경로의 시작부터 읽습니다. |
| `s3.max_batch_files` | 양의 정수 | `256` | 아니요 | 배치당 파일 수 임계값입니다. |
| `s3.max_batch_bytes` | 정수 | `10737418240` | 아니요 | 배치당 바이트 수 임계값입니다. 범위는 `104857600`부터 `10737418240`까지이며 단위 접미사는 사용할 수 없습니다. |
| `max_interval` | 양의 정수 | `10` | 아니요 | 새 파일이 없을 때 작업을 예약하는 간격(초)입니다. |

배치 임계값에 도달할 때까지 기다려야만 삽입이 시작되는 것은 아닙니다.

### 특정 파일 이후부터 시작 {#start-after-a-specific-file}

`data/001.csv`와 그 이전 파일을 이미 처리했다면 다음과 같이 `data/002.csv`부터 읽으세요.

```sql
CREATE JOB s3_after_offset_job
PROPERTIES (
    "s3.ingestion_mode" = "ORDERED_LIST",
    "offset" = "{\"fileName\":\"data/001.csv\"}"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/data/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>"
);
```

이 설정은 `data/001.csv`와 그보다 작은 모든 키를 건너뛰고, 이후의 일치하는 키만 적재합니다. 빠른 시작 예시와 데이터가 중복되지 않도록 이 예시에는 별도의 대상 테이블을 사용하세요.

데이터 적재 모드와 S3 URI는 생성 후 변경할 수 없습니다. 모드나 경로를 바꾸려면 새 작업을 생성하세요.

## 문제 해결 및 제한 사항 {#troubleshooting-and-limitations}

- **새 파일이 적재되지 않음:** 키가 URI와 일치하고 `CurrentOffset`보다 큰지 확인하세요. 커서 이전에 추가된 파일은 자동으로 소급 적재되지 않습니다. 소급 적재에는 별도의 접두사와 일회성 작업을 사용하거나, 파일을 업로드하기 전에 알림 기반 데이터 적재를 설정하세요.
- **예상과 다른 순서:** `000001.csv`처럼 고정 길이 타임스탬프나 앞을 0으로 채운 순번을 사용하세요. 그렇지 않으면 `file10`이 `file2`보다 앞에 정렬됩니다.
- **객체가 덮어써지거나 삭제됨:** 각 키를 고유하게 유지하고 적재 중에는 내용을 변경하지 않으며 읽을 수 있도록 유지하세요. 이미 커밋된 객체를 덮어써도 다시 적재되지 않습니다.
- **빈 경로에서 생성 실패:** 작업을 생성할 때 S3 TVF가 스키마를 추론하려면 일치하는, 읽을 수 있는 비어 있지 않은 파일이 필요합니다.

작업 일시 중지, 재개 및 태스크 확인은 [지속적 데이터 적재 개요](./continuous-load-overview.md)를 참조하세요. 작업을 수정하려면 [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)을 참조하세요.
