---
{
    "title": "S3 순차 수집",
    "sidebar_label": "순차 수집",
    "language": "ko",
    "description": "Doris Streaming Job을 사용하여 S3 파일을 키의 사전순으로 지속적으로 수집하는 방법을 설명합니다. SQL, 시작 오프셋, 배치 처리, 이름 지정 제약 조건을 다룹니다.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "순차 수집"
    ]
}
---

순차 수집은 `ORDERED_LIST`를 사용하여 경로와 파일 이름을 포함한 **키의 사전순**으로 새로운 S3 객체를 지속적으로 찾습니다. 타임스탬프나 일련번호가 증가하도록 이름이 지정된 로그 및 ETL 파일에 적합합니다. 이 순서는 파일을 찾는 순서를 뜻하며, 대상 테이블의 행 순서를 보장하지 않습니다.

이는 기본 S3 수집 모드이며 큐가 필요하지 않습니다. 도착 순서가 일정하지 않은 파일에는 [알림 기반 수집](./continuous-load-s3-notification.md)을 사용하세요. 미리 준비된 정적 파일 집합에는 [일회성 수집](./continuous-load-s3-one-time.md)을 사용하세요.

## 작동 방식 {#how-it-works}

Doris는 가장 최근에 커밋된 키 이후에서 조건에 맞는 파일을 검색합니다. 새 키는 커밋된 키보다 사전순으로 뒤에 있어야 합니다. `file1`, `file2`, `file3`을 수집한 후 새로 업로드된 `file0`은 읽지 않습니다. 새 파일이 없으면 작업은 `max_interval` 간격으로 폴링합니다.

## 빠른 시작 {#quick-start}

### 1단계: 대상 테이블 및 파일 준비 {#step-1-prepare-the-target-table-and-files}

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

이 예제는 단일 BE 클러스터를 위해 복제본 하나를 사용합니다. 운영 클러스터에 맞게 복제본 수를 설정하세요. 다음 내용을 `s3://bucket/001.csv`로 업로드하고 SQL의 버킷, 엔드포인트, Region 및 자격 증명을 실제 값으로 바꾸세요:

```text
1,Alice
2,Bob
```

### 2단계: 작업 생성 {#step-2-create-the-job}

기본값을 사용하려면 `s3.ingestion_mode`를 생략하세요. 또는 `ORDERED_LIST` 값을 Job `PROPERTIES`에 명시적으로 설정하세요.

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

수집 후 `SELECT * FROM db1.tbl1 ORDER BY id;`를 실행하세요. 예상 결과:

```text
+----+-------+
| id | name  |
+----+-------+
|  1 | Alice |
|  2 | Bob   |
+----+-------+
```

### 3단계: 진행 상황 모니터링 {#step-3-monitor-progress}

```sql
SELECT Name, Status, CurrentOffset, EndOffset, ErrorMsg
FROM jobs("type" = "insert")
WHERE Name = 'my_job';
```

`001.csv`가 커밋되면 `Status`는 `RUNNING`이고 `CurrentOffset`은 `{"fileName":"001.csv"}`이어야 합니다. 수집을 계속하려면 `002.csv`처럼 사전순으로 뒤에 오는 키를 업로드하세요. 새 파일이 없어도 작업은 실행 상태를 유지합니다.

## 매개변수 {#parameters}

Job `PROPERTIES`에서 다음 항목을 설정하세요. S3 연결, 자격 증명 및 파일 형식 옵션은 `S3(...)`에 지정합니다.

| 매개변수 | 유형 | 기본값 | 필수 여부 | 설명 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | String | `ORDERED_LIST` | 아니요 | `ORDERED_LIST`로 설정합니다. 생성 후에는 변경할 수 없습니다. |
| `offset` | JSON 문자열 | 없음 | 아니요 | 이 키보다 사전순으로 뒤에 있는 파일만 읽습니다. 예: `'{"fileName":"data/001.csv"}'`. 지정하지 않으면 일치하는 경로의 처음부터 시작합니다. |
| `s3.max_batch_files` | 양의 정수 | `256` | 아니요 | 배치당 파일 수 임곗값입니다. |
| `s3.max_batch_bytes` | 정수 | `10737418240` | 아니요 | 배치당 바이트 수 임곗값으로, `104857600`에서 `10737418240` 사이입니다. 단위 접미사는 사용할 수 없습니다. |
| `max_interval` | 양의 정수 | `10` | 아니요 | 유휴 상태의 스케줄링 간격(초)입니다. |

배치 임곗값이 설정되어 있어도 작업이 데이터를 삽입하기 전에 배치가 가득 찰 때까지 기다릴 필요는 없습니다.

### 특정 파일 다음부터 시작하기 {#start-after-a-specific-file}

`data/001.csv` 및 그 이전 파일을 이미 처리했다면 다음과 같이 `data/002.csv`부터 읽도록 설정하세요:

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

이 설정은 `data/001.csv` 및 사전순으로 그 앞에 있는 모든 키를 건너뛰고, 그 뒤에 있는 일치하는 키만 수집합니다. 빠른 시작 예제와 데이터가 겹치지 않도록 이 예제에는 별도의 대상 테이블을 사용하세요.

수집 모드와 S3 URI는 생성 후 변경할 수 없습니다. 모드나 경로를 변경하려면 다른 작업을 생성하세요.

## 문제 해결 및 제한 사항 {#troubleshooting-and-limitations}

- **새 파일이 수집되지 않음:** 키가 URI와 일치하고 `CurrentOffset`보다 사전순으로 뒤에 있는지 확인하세요. 커서 이전에 추가된 파일은 소급 수집되지 않습니다. 과거 데이터를 수집하려면 별도의 접두사와 일회성 작업을 사용하거나, 파일을 업로드하기 전에 알림 기반 수집을 설정하세요.
- **예상과 다른 순서:** 고정 길이의 타임스탬프 또는 `000001.csv`처럼 앞을 영으로 채운 카운터를 사용하세요. 그렇지 않으면 `file10`이 `file2`보다 먼저 정렬됩니다.
- **객체 덮어쓰기 또는 삭제:** 각 키는 고유해야 하며, 수집 중에는 내용을 변경하지 않고 읽을 수 있는 상태로 유지해야 합니다. 이미 커밋된 객체를 덮어써도 다시 수집되지 않습니다.
- **빈 경로에서 생성 실패:** S3 TVF가 작업 생성 시 스키마를 추론하려면 조건에 맞고 읽을 수 있으며 내용이 비어 있지 않은 파일이 필요합니다.

일시 중지, 재개 및 태스크 확인에 대해서는 [지속적 데이터 적재 개요](./continuous-load-overview.md)를 참조하세요. 작업을 수정하려면 [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)을 참조하세요.
