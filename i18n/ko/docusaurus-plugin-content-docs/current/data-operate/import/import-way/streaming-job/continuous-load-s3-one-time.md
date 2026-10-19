---
{
    "title": "S3 일회성 수집",
    "sidebar_label": "일회성 수집",
    "language": "ko",
    "description": "Doris Streaming Job으로 미리 준비한 S3 파일 집합을 배치 단위로 수집하는 방법과 SQL, 완료 상태, 복구, 소스 안정성 요구 사항을 설명합니다.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "일회성 수집"
    ]
}
---

일회성 수집은 `ONE_TIME`을 사용하여 조건에 맞는 S3 파일을 기존 Doris 테이블에 배치 단위로 수집합니다. 마지막 배치가 커밋되면 작업은 `FINISHED` 상태가 됩니다. 과거 데이터를 이용한 초기화, 일회성 오프라인 데이터 적재, 별도 접두사 아래의 백필에 적합합니다.

작업을 생성하기 전에 모든 파일을 준비하고, 수집 중에는 소스 경로를 변경하지 마세요. 완료된 작업은 이후에 추가되는 파일을 기다리지 않습니다. 연속 수집이 필요하면 [순서 기반 수집](./continuous-load-s3-ordered.md) 또는 [알림 기반 수집](./continuous-load-s3-notification.md)을 선택하세요.

## 빠른 시작 {#quick-start}

### 단계 1: 대상 테이블과 파일 준비 {#step-1-prepare-the-target-table-and-files}

실행 계정에는 대상 테이블에 대한 `LOAD` 권한과 데이터베이스 및 테이블을 생성하는 데 필요한 권한이 있어야 합니다. S3 자격 증명에는 `s3:ListBucket` 및 `s3:GetObject` 권한이 필요합니다. Doris 노드에서 S3 엔드포인트에 접근할 수 있어야 합니다.

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

이 예제는 BE가 하나인 클러스터에서 복제본 하나를 사용합니다. 운영 클러스터에 맞게 복제본 수를 설정하세요. 다음 내용을 `s3://bucket/001.csv`로 업로드하고, SQL의 버킷, 엔드포인트, 리전, 자격 증명을 실제 값으로 바꾸세요.

```text
1,Alice
2,Bob
```

### 단계 2: 작업 생성 {#step-2-create-the-job}

```sql
CREATE JOB s3_one_time_job
PROPERTIES (
    "s3.ingestion_mode" = "ONE_TIME",
    "s3.max_batch_files" = "256",
    "s3.max_batch_bytes" = "10737418240"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>"
);
```

## 완료 확인 {#check-completion}

작업 상태를 쿼리합니다.

```sql
SELECT Name, ExecuteType, Status
FROM jobs("type" = "insert")
WHERE Name = 's3_one_time_job';
```

예상 결과:

```text
Name             ExecuteType  Status
s3_one_time_job  STREAMING    FINISHED
```

`SELECT * FROM db1.tbl1 ORDER BY id;`를 실행합니다. 예상 결과:

```text
id  name
1   Alice
2   Bob
```

## 제한 사항 및 복구 {#limitations-and-recovery}

`ONE_TIME`은 생성 시 디렉터리 스냅샷을 만들지 않습니다. 파일 목록을 배치 단위로 조회하고 마지막 배치가 커밋되면 중지합니다. 이미 커밋된 커서 이전 위치에 추가된 파일은 백필되지 않습니다. 작업을 생성하기 전에 모든 소스 파일을 준비하고, 수집 중에는 해당 경로 아래의 객체를 쓰거나 덮어쓰지 마세요. FE가 재시작되면 작업은 커밋된 진행 지점부터 재개되며, 처리가 완료되면 `FINISHED` 상태가 됩니다.

## 매개변수 {#parameters}

다음 항목을 Job의 `PROPERTIES`에 설정합니다. S3 연결, 자격 증명, 파일 형식 옵션은 `S3(...)`에 설정합니다.

| 매개변수 | 유형 | 기본값 | 필수 여부 | 설명 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | String | `ORDERED_LIST` | 예 | `ONE_TIME`으로 설정합니다. 생성 후에는 변경할 수 없습니다. |
| `s3.max_batch_files` | 양의 정수 | `256` | 아니요 | 배치당 파일 수 임계값입니다. |
| `s3.max_batch_bytes` | Integer | `10737418240` | 아니요 | 배치당 바이트 수 임계값으로, `104857600`부터 `10737418240`까지 설정할 수 있습니다. 단위 접미사는 사용할 수 없습니다. |
| `max_interval` | 양의 정수 | `10` | 아니요 | 유휴 상태의 스케줄링 간격이며, 단위는 초입니다. |

`offset`, `s3.event.source`, `s3.sqs.queue_url`은 설정하지 마세요. `max_interval`은 완료된 작업이 추가 파일을 기다리도록 하지 않습니다. 세션 설정은 [INSERT INTO SELECT](../insert-into-manual.md#import-configuration-parameters)를 참조하세요.

수집 모드와 S3 URI는 생성 후에 변경할 수 없습니다. 모드나 경로를 변경하려면 새 작업을 생성하세요.

## 문제 해결 및 모범 사례 {#troubleshooting-and-best-practices}

- **생성 실패:** S3 TVF의 스키마 추론에 사용할 수 있도록 조건에 맞고 읽을 수 있으며 비어 있지 않은 파일이 있는지 확인하세요.
- **작업이 완료되지 않음:** `Status`, `ErrorMsg` 및 실패한 태스크를 확인하세요. 읽을 수 없는 객체나 형식 오류로 인해 배치가 커밋되지 않을 수 있습니다.
- **완료 후 새 파일을 읽지 않음:** `FINISHED`는 최종 상태입니다. 기존 데이터를 다시 적재하지 않도록 다음 배치의 파일을 별도 접두사 아래에 배치하고 새 작업을 생성하세요.
- **알림 기반 수집과 함께 사용:** 과거 데이터와 새로 유입되는 데이터에 서로 겹치지 않는 접두사를 사용하거나, 애플리케이션에서 범위 겹침과 중복을 처리하세요.

일시 중지, 재개, 태스크 확인은 [Continuous Load 개요](./continuous-load-overview.md)를 참조하세요. 작업을 수정하려면 [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)을 참조하세요.
