---
{
    "title": "S3 알림 수집",
    "sidebar_label": "알림 수집",
    "language": "ko",
    "description": "전용 SQS 큐와 Doris Streaming Job을 사용하여 S3 파일을 수집합니다. AWS 설정, IAM 정책, SQL, 모니터링 및 전달 제한을 포함합니다.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "알림 수집"
    ]
}
---

:::caution 실험적 기능

S3 알림 수집은 실험적 기능이며 Doris 4.1.6부터 지원됩니다.

:::

알림 수집은 `NOTIFICATION`을 사용하여 SQS에서 S3 객체 생성 이벤트를 소비하고 새 파일을 Doris에 지속적으로 수집합니다. UUID 파일 이름과 어떤 순서로든 도착하는 파일에 적합하며, 파일 이름 순서에 의존하지 않습니다.

**AWS S3 알림을 동일한 Region의 SQS Standard Queue로 직접 전송하는 경우만** 지원됩니다. 각 작업에는 전용 큐가 필요합니다. 과거 객체는 검색하거나 백필하지 않습니다. 엔드투엔드 전달 의미 체계는 at-least-once입니다. 따라서 객체가 두 번 이상 수집될 수 있으며 파일 수집 순서는 보장되지 않습니다.

## 빠른 시작 {#quick-start}

이 예에서는 `s3://example-bucket/data/*.csv`를 `us-east-1`에서 사용합니다. bucket, account, queue 및 자격 증명을 실제 값으로 바꾸십시오.

### Doris 대상 테이블 준비 {#prepare-the-doris-target-table}

계정에는 대상 테이블에 대한 `LOAD` 권한과 해당 데이터베이스 및 테이블 생성 권한이 필요합니다. 다른 예제와 겹치지 않도록 별도의 빈 테이블을 사용하십시오.

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

이 단일 BE 예제는 복제본 하나를 사용합니다. 프로덕션 환경에서는 복제본 수를 조정하십시오.

### 1단계: SQS Standard Queue 생성 {#step-1-create-an-sqs-standard-queue}

S3 bucket과 **동일한 Region**에 Standard Queue를 생성하고 URL과 ARN을 기록하십시오. 일시 중지와 장애를 처리할 수 있도록 14일의 메시지 보존 기간을 권장합니다. 보존 기간이 만료되면 SQS가 메시지를 삭제합니다.

### 2단계: S3가 알림을 전송하도록 허용 {#step-2-allow-s3-to-send-notifications}

다음 statement를 queue access policy에 병합하고 account, bucket 및 queue 식별자를 바꾸십시오.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ToSendMessage",
      "Effect": "Allow",
      "Principal": {"Service": "s3.amazonaws.com"},
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:<account-id>:<queue-name>",
      "Condition": {
        "ArnEquals": {"aws:SourceArn": "arn:aws:s3:::example-bucket"},
        "StringEquals": {"aws:SourceAccount": "<account-id>"}
      }
    }
  ]
}
```

### 3단계: Doris 액세스 권한 부여 {#step-3-grant-doris-access}

작업의 IAM user 또는 role에 다음 권한을 부여하십시오. FE에는 SQS 및 S3 액세스 권한이 필요하고 BE에는 S3 객체 읽기 권한이 필요합니다. AssumeRole을 사용하려면 STS 연결도 필요합니다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::example-bucket"
    },
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::example-bucket/data/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": "arn:aws:sqs:us-east-1:<account-id>:<queue-name>"
    }
  ]
}
```

### 4단계: S3 이벤트 알림 구성 {#step-4-configure-s3-event-notifications}

bucket의 Event notifications에서 규칙을 생성하십시오.

- **All object create events** (`s3:ObjectCreated:*`)를 선택하십시오.
- Prefix에 `data/`, Suffix에 `.csv`를 입력하고 와일드카드는 사용하지 마십시오. 규칙의 범위에 작업의 URI 패턴이 포함되어야 합니다.
- 대상에서 SQS queue를 선택하십시오. SNS envelope 없이 S3 메시지를 직접 전송하십시오.

수집할 파일을 업로드하기 전에 규칙을 활성화하십시오. notification rule을 생성해도 기존 객체에 대한 이벤트는 생성되지 않습니다.

### 5단계: Streaming Job 생성 {#step-5-create-the-streaming-job}

작업 생성 중 스키마 추론을 수행하려면 S3 TVF에 일치하는 파일이 필요합니다. 알림을 활성화한 후 다음 내용을 포함하는 비어 있지 않은 `data/001.csv`를 업로드하십시오.

```text
1,Alice
2,Bob
```

그런 다음 작업을 생성하십시오.

```sql
CREATE JOB s3_event_job
PROPERTIES (
    "s3.ingestion_mode" = "NOTIFICATION",
    "s3.event.source" = "SQS",
    "s3.sqs.queue_url" = "https://sqs.us-east-1.amazonaws.com/<account-id>/<queue-name>",
    "max_interval" = "10"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://example-bucket/data/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "provider" = "S3",
    "s3.region" = "us-east-1",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.access_key" = "<access-key>",
    "s3.secret_key" = "<secret-key>"
);
```

이 파일은 SQS 알림을 생성합니다. 알림을 구성하기 전에 업로드한 객체는 스키마 추론에 사용할 수 있지만 자동으로 백필되지 않습니다. 작업을 생성할 때 일치하는 파일 하나 이상을 계속 읽을 수 있어야 합니다.

IAM role을 사용하려면 access-key 및 secret-key 옵션을 다음으로 바꾸십시오. `s3.external_id`는 trust policy에 따라 선택 사항입니다.

```sql
"s3.role_arn" = "arn:aws:iam::<account-id>:role/<role-name>",
"s3.external_id" = "<external-id>"
```

FE는 구성된 AWS 자격 증명을 사용하여 AssumeRole을 호출합니다. role에는 S3 및 SQS 권한이 필요하고, 호출자에는 `sts:AssumeRole` 권한이 필요하며, role의 trust policy에서 해당 호출자를 허용해야 합니다.

`data/001.csv`에 대한 알림을 처리한 후 테이블에는 해당하는 두 행이 포함됩니다. 이후 파일은 알림을 통해 수집되며, 해당 key가 이전에 처리된 key보다 작아도 수집할 수 있습니다. 알림이 반복되면 대상 테이블 모델에 따라 행 수에 영향을 줄 수 있습니다.

### 6단계: 큐 백로그 모니터링 {#step-6-monitor-the-queue-backlog}

```sql
SELECT Name, Status, CurrentOffset, EndOffset, LagBytes,
       LastSourceEventTimestamp, LastTaskSuccessTime
FROM jobs("type" = "insert")
WHERE Name = 's3_event_job';
```

`CurrentOffset` 예시는 `{"fileName":"data/a.csv"}`입니다. `EndOffset` 예시는 `{"fileName":"data/b.csv","lagMessages":12}`입니다. 이러한 키는 사전순 워터마크가 아니라 배치 위치를 설명하며, 수집이 따라잡았는지 판단하는 데 사용할 수 없습니다.

| 필드 | 알림 모드의 의미 |
| --- | --- |
| `LagBytes` | `-1`: 대기 중인 객체의 바이트 크기를 사용할 수 없습니다. |
| `EndOffset.lagMessages` | 처리 중(in-flight) 및 지연(delayed) 메시지를 제외한 SQS의 대략적인 표시 가능 메시지 수입니다. 파일 수가 아닙니다. |
| `LastSourceEventTimestamp` | 최근 커밋된 배치에서 S3 이벤트 타임스탬프의 최댓값이며 Unix 초 단위입니다. 이전 이벤트가 모두 처리되었음을 증명하지 않습니다. |

FE는 작업별 메트릭도 제공합니다.

```text
doris_fe_streaming_job_per_job_lag_messages
doris_fe_streaming_job_per_job_last_source_event_timestamp_seconds
```

## 확인 및 제한 사항 {#acknowledgment-and-limitations}

- 보존된 SQS 알림만 소비합니다. 과거 객체는 검색하거나 백필하지 않습니다.
- 작업을 생성하려면 S3 TVF 스키마 추론을 위해 일치하고 읽을 수 있는 비어 있지 않은 파일이 필요합니다.
- 각 queue는 하나의 job에만 독점되어야 합니다. Doris는 범위를 벗어난 레코드, 잘못되었거나 지원되지 않는 알림 및 S3 테스트 이벤트를 건너뛰고 확인합니다. URI 패턴이 다른 Job들이 하나의 queue를 공유해서는 안 됩니다.
- 유효한 파일의 경우 INSERT 트랜잭션이 커밋된 후 메시지가 삭제됩니다. 처리 중에는 Visibility가 연장되며 실패한 배치는 재시도할 수 있습니다. FE 복구 시 최근 커밋된 배치의 영속화된 key를 사용하여 재전달을 처리할 수 있지만, 전역 중복 제거를 위해 모든 과거 key를 저장하지는 않습니다.
- S3와 SQS 모두 중복 메시지를 전달할 수 있습니다. 엔드투엔드 의미 체계는 at-least-once이며 파일 수집 순서는 보장되지 않습니다. 필요에 따라 비즈니스 중복 제거에는 Unique Key 테이블을 사용하고 순서에 민감한 업데이트에는 Sequence 열을 사용하십시오.
- 객체 key를 고유하게 유지하고 콘텐츠를 변경하지 않으며 읽을 수 있도록 유지하십시오. Doris는 이벤트가 생성될 때 존재했던 버전이 아니라 처리 시점의 콘텐츠를 읽습니다. 객체를 너무 일찍 삭제하면 오류와 재시도가 발생합니다.

## 매개변수 {#parameters}

다음 항목은 Job `PROPERTIES`에서 구성합니다. S3 연결, 자격 증명 및 파일 형식 옵션은 `S3(...)`에 지정합니다.

| 매개변수 | 유형 | 기본값 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | 문자열 | `ORDERED_LIST` | 예 | `NOTIFICATION`으로 설정합니다. 생성 후 변경할 수 없습니다. |
| `s3.event.source` | 문자열 | None | 예 | `SQS`여야 합니다. 생성 후 변경할 수 없습니다. |
| `s3.sqs.queue_url` | 문자열 | None | 예 | 전용 SQS queue의 URL입니다. 생성 후 변경할 수 없습니다. |
| `s3.max_batch_files` | 양의 정수 | `256` | 아니요 | 배치당 파일 수 임계값입니다. |
| `s3.max_batch_bytes` | 정수 | `10737418240` | 아니요 | 배치당 바이트 임계값이며 `104857600`에서 `10737418240` 사이입니다. 단위 접미사는 허용되지 않습니다. |
| `max_interval` | 양의 정수 | `10` | 아니요 | 유휴 스케줄링 간격(초)입니다. `7200`보다 작아야 합니다. |

배치 임계값은 소프트 임계값이므로 전체 배치가 찰 때까지 기다릴 필요가 없습니다. 이미 수신한 메시지는 같은 배치에 유지됩니다. 다음 receive는 임계값에 도달한 후 중지되므로 배치가 두 임계값 중 하나를 초과할 수 있습니다. `offset`은 생성 및 `ALTER JOB` 시 사용할 수 없습니다. S3 URI는 변경할 수 없습니다. 경로나 queue를 변경하려면 다른 job을 생성하십시오.

## 문제 해결 및 모범 사례 {#troubleshooting-and-best-practices}

| 증상 | 확인 및 조치 |
| --- | --- |
| 작업 생성 실패 | 일치하는 비어 있지 않은 파일, S3/SQS 권한 및 네트워크 연결을 확인하십시오. |
| 작업이 실행되지만 파일을 수집하지 않음 | 알림이 업로드보다 먼저 활성화되었는지, `s3:ObjectCreated:*`가 선택되었는지, 필터가 URI를 포함하는지, 다른 소비자가 queue를 읽고 있지 않은지 확인하십시오. |
| 과거 파일이 누락됨 | notification rule은 과거 이벤트를 재생하지 않습니다. 별도의 prefix와 [일회성 수집](./continuous-load-s3-one-time.md)을 사용하십시오. |
| 일시 중지 후 파일이 누락됨 | SQS 메시지 보존 기간을 확인하고 필요한 경우 누락된 파일을 별도로 백필하십시오. |
| 반복적인 읽기 실패 | `ErrorMsg`와 task 오류를 확인하십시오. 객체의 사용 가능성, 변경 불가 여부 및 형식 호환성을 점검하십시오. |
| 중복 행 | 비즈니스 키와 대상 테이블 모델을 검토하십시오. 전체 과거 파일의 중복 제거에 의존하지 마십시오. |

충분한 메시지 보존 기간을 설정하고 객체를 변경 불가능하고 읽을 수 있는 상태로 유지하며, 대략적인 백로그, 마지막 성공 시간 및 task 오류를 모니터링하십시오. Job 관리에 대해서는 [Continuous Load Overview](./continuous-load-overview.md) 및 [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)을 참조하십시오.
