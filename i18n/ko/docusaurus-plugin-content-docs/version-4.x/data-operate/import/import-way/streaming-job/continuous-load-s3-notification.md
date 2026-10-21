---
{
    "title": "S3 알림 수집",
    "sidebar_label": "알림 수집",
    "language": "ko",
    "description": "Doris Streaming Job과 전용 SQS 큐로 S3 파일을 수집하는 방법을 설명합니다. AWS 설정, IAM 정책, SQL, 모니터링 및 전달 제한 사항을 포함합니다.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "알림 수집"
    ]
}
---

알림 수집은 `NOTIFICATION`을 사용하여 SQS에서 S3 객체 생성 이벤트를 소비하고 새 파일을 Doris로 지속적으로 수집합니다. 파일 이름의 정렬 순서에 의존하지 않으므로 UUID 파일 이름을 사용하거나 파일이 순서 없이 도착하는 경우에 적합합니다.

**AWS S3에서 같은 리전의 SQS Standard Queue로 직접 전송하는 알림**만 지원합니다. 각 작업에는 전용 큐가 필요합니다. 기존 객체는 스캔하거나 소급 적재하지 않습니다. 종단 간 전달은 at-least-once 방식입니다. 동일한 객체가 여러 번 수집될 수 있으며, 파일 수집 순서는 보장되지 않습니다.

## 빠른 시작 {#quick-start}

이 예제에서 사용하는 경로는 `s3://example-bucket/data/*.csv`이고, 리전은 `us-east-1`입니다. 버킷, 계정, 큐, 자격 증명은 실제 값으로 바꾸세요.

### Doris 대상 테이블 준비 {#prepare-the-doris-target-table}

계정에는 대상 테이블에 대한 `LOAD` 권한과 해당 데이터베이스 및 테이블 생성 권한이 필요합니다. 다른 예제와 겹치지 않도록 별도의 빈 테이블을 사용합니다.

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

BE가 하나인 이 예제에서는 복제본을 하나 사용합니다. 프로덕션 환경에서는 복제본 수를 조정하세요.

### 1단계: SQS Standard Queue 생성 {#step-1-create-an-sqs-standard-queue}

S3 버킷과 **같은 리전**에 Standard Queue를 생성하고 URL과 ARN을 기록합니다. 일시 중지와 장애에 대비할 수 있도록 메시지 보존 기간을 14일로 설정하는 것이 좋습니다. 보존 기간이 만료되면 SQS는 메시지를 삭제합니다.

### 2단계: S3의 알림 전송 허용 {#step-2-allow-s3-to-send-notifications}

다음 구문을 큐 액세스 정책에 병합하고, 계정, 버킷, 큐 식별자를 실제 값으로 바꿉니다.

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

작업의 IAM 사용자 또는 역할에 다음 권한을 부여합니다. FE에는 SQS 및 S3 액세스 권한이 필요하고, BE에는 S3 객체를 읽을 권한이 필요합니다. AssumeRole을 사용하려면 STS에 연결할 수 있어야 합니다.

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

버킷의 이벤트 알림에서 규칙을 생성합니다.

- **모든 객체 생성 이벤트**(`s3:ObjectCreated:*`)를 선택합니다.
- 접두사는 `data/`로, 접미사는 `.csv`로 설정하고 와일드카드는 사용하지 않습니다. 규칙은 작업의 URI 패턴을 포함해야 합니다.
- 대상으로 SQS 큐를 선택합니다. SNS 메시지로 감싸지 않고 S3 메시지를 직접 전송합니다.

수집할 파일을 업로드하기 전에 규칙을 활성화합니다. 알림 규칙을 생성해도 기존 객체에 대한 이벤트는 생성되지 않습니다.

### 5단계: Streaming Job 생성 {#step-5-create-the-streaming-job}

S3 TVF는 작업 생성 시 스키마를 추론하기 위해 패턴과 일치하는 파일이 필요합니다. 알림을 활성화한 후 다음 내용이 들어 있는 비어 있지 않은 `data/001.csv`를 업로드합니다.

```text
1,Alice
2,Bob
```

그런 다음 작업을 생성합니다.

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

이 파일은 SQS 알림을 생성합니다. 알림을 구성하기 전에 업로드한 객체도 스키마 추론에 사용할 수 있지만 자동으로 소급 적재되지는 않습니다. 작업을 생성할 때 패턴과 일치하는 파일이 하나 이상 읽을 수 있는 상태로 남아 있어야 합니다.

IAM 역할을 사용하려면 access-key 및 secret-key 옵션을 다음과 같이 바꿉니다. `s3.external_id`는 신뢰 정책에 따라 생략할 수 있습니다.

```sql
"s3.role_arn" = "arn:aws:iam::<account-id>:role/<role-name>",
"s3.external_id" = "<external-id>"
```

FE는 자체 설정된 AWS 자격 증명을 사용하여 AssumeRole을 호출합니다. 역할에는 S3 및 SQS 권한이 필요하고, 호출자에게는 `sts:AssumeRole` 권한이 필요하며, 역할의 신뢰 정책에서 해당 호출자를 허용해야 합니다.

`data/001.csv`에 대한 알림을 처리하면 해당하는 두 행이 테이블에 저장됩니다. 이후 파일은 키가 이전에 처리한 키보다 작더라도 알림을 통해 수집됩니다. 알림이 반복되면 대상 테이블 모델에 따라 행 수가 달라질 수 있습니다.

### 6단계: 큐 백로그 모니터링 {#step-6-monitor-the-queue-backlog}

```sql
SELECT Name, Status, CurrentOffset, EndOffset, LagBytes,
       LastSourceEventTimestamp, LastTaskSuccessTime
FROM jobs("type" = "insert")
WHERE Name = 's3_event_job';
```

`CurrentOffset` 예시: `{"fileName":"data/a.csv"}`. `EndOffset` 예시: `{"fileName":"data/b.csv","lagMessages":12}`. 이 키는 사전순 워터마크가 아닌 배치 위치를 나타내므로, 수집이 밀린 데이터를 모두 처리했는지 판단하는 데 사용할 수 없습니다.

| 필드 | 알림 모드에서의 의미 |
| --- | --- |
| `LagBytes` | `-1`: 큐에 있는 객체의 바이트 크기를 확인할 수 없습니다. |
| `EndOffset.lagMessages` | 처리 중이거나 지연된 메시지를 제외한, SQS에서 조회 가능한 메시지의 대략적인 수입니다. 파일 수를 의미하지 않습니다. |
| `LastSourceEventTimestamp` | 가장 최근에 커밋된 배치에 포함된 S3 이벤트 타임스탬프의 최댓값으로, Unix 초 단위입니다. 이 값이 이전 이벤트가 모두 처리되었음을 보장하지는 않습니다. |

FE는 작업별 메트릭도 제공합니다.

```text
doris_fe_streaming_job_per_job_lag_messages
doris_fe_streaming_job_per_job_last_source_event_timestamp_seconds
```

## 확인 응답 및 제한 사항 {#acknowledgment-and-limitations}

- SQS에 보관된 알림만 소비합니다. 기존 객체는 스캔하지 않습니다.
- 작업을 생성하려면 S3 TVF 스키마 추론에 사용할 수 있는 파일이 필요합니다. 파일은 패턴과 일치하고 읽을 수 있어야 하며 비어 있지 않아야 합니다.
- 각 큐는 하나의 작업만 전용으로 사용해야 합니다. Doris는 범위를 벗어난 레코드, 형식이 잘못되었거나 지원되지 않는 알림, S3 테스트 이벤트를 건너뛰고 확인 응답을 보냅니다. URI 패턴이 서로 다른 작업끼리 큐를 공유해서는 안 됩니다.
- 유효한 파일의 메시지는 INSERT 트랜잭션이 커밋된 후 삭제됩니다. 처리 중에는 메시지 가시성 제한 시간이 연장되며, 실패한 배치는 재시도할 수 있습니다. FE는 복구 시 가장 최근에 커밋된 배치에서 영구 저장한 키를 사용하여 해당 배치의 재전달을 처리할 수 있습니다. Doris는 전체 범위에서 중복을 제거하기 위해 과거의 모든 키를 영구 저장하지는 않습니다.
- S3와 SQS는 중복 전달할 수 있습니다. 종단 간 전달 의미 체계는 at-least-once이며 파일 수집 순서는 보장되지 않습니다. 비즈니스 데이터의 중복 제거에는 Unique Key 테이블을 사용하고, 순서에 민감한 업데이트에는 필요에 따라 Sequence 열을 사용합니다.
- 객체 키는 고유하게 유지하고, 내용은 변경하지 않으며 읽을 수 있는 상태로 유지합니다. Doris는 처리 시점의 내용을 읽으므로, 이벤트가 발생했을 때 존재하던 버전을 읽는다고 보장할 수는 없습니다. 객체를 너무 일찍 삭제하면 실패와 재시도가 발생합니다.

## 매개변수 {#parameters}

Job `PROPERTIES`에서 다음 항목을 설정합니다. S3 연결, 자격 증명, 파일 형식 옵션은 `S3(...)`에 지정합니다.

| 매개변수 | 유형 | 기본값 | 필수 여부 | 설명 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | 문자열 | `ORDERED_LIST` | 예 | `NOTIFICATION`으로 설정합니다. 생성 후에는 변경할 수 없습니다. |
| `s3.event.source` | 문자열 | 없음 | 예 | 반드시 `SQS`여야 합니다. 생성 후에는 변경할 수 없습니다. |
| `s3.sqs.queue_url` | 문자열 | 없음 | 예 | 전용 SQS 큐의 URL입니다. 생성 후에는 변경할 수 없습니다. |
| `s3.max_batch_files` | 양의 정수 | `256` | 아니요 | 배치당 파일 수 임계값입니다. |
| `s3.max_batch_bytes` | 정수 | `10737418240` | 아니요 | 배치당 바이트 임계값으로, `104857600`부터 `10737418240`까지 설정할 수 있습니다. 단위 접미사는 허용되지 않습니다. |
| `max_interval` | 양의 정수 | `10` | 아니요 | 유휴 상태일 때의 스케줄링 간격(초)입니다. `7200`보다 작아야 합니다. |

배치 임계값은 엄격한 제한이 아니며, 배치가 가득 찰 때까지 기다릴 필요는 없습니다. 이미 수신한 메시지는 같은 배치에 유지됩니다. 임계값에 도달하면 다음 수신을 중단하므로 배치는 어느 임계값이든 초과할 수 있습니다. `offset`은 작업 생성 시와 `ALTER JOB`에서 사용할 수 없습니다. S3 URI는 변경할 수 없습니다. 경로나 큐를 변경하려면 다른 작업을 생성합니다.

## 문제 해결 및 모범 사례 {#troubleshooting-and-best-practices}

| 증상 | 확인 사항 및 조치 |
| --- | --- |
| 작업 생성 실패 | 패턴과 일치하는 비어 있지 않은 파일, S3/SQS 권한, 네트워크 연결을 확인합니다. |
| 작업은 실행되지만 파일이 수집되지 않음 | 업로드 전에 알림이 활성화되었는지, `s3:ObjectCreated:*`가 선택되었는지, 필터가 URI를 포함하는지, 다른 소비자가 큐를 읽고 있지 않은지 확인합니다. |
| 기존 파일 누락 | 알림 규칙은 과거 이벤트를 재생하지 않습니다. 별도의 접두사와 [일회성 수집](./continuous-load-s3-one-time.md)을 사용합니다. |
| 일시 중지 후 파일 누락 | SQS 메시지 보존 기간을 확인하고, 필요하면 누락된 파일을 별도로 소급 적재합니다. |
| 반복적인 읽기 실패 | `ErrorMsg`와 작업 오류를 살펴봅니다. 객체의 가용성, 불변성, 형식 호환성을 확인합니다. |
| 중복 행 | 비즈니스 키와 대상 테이블 모델을 검토합니다. 과거의 모든 파일에 대한 전역 중복 제거에 의존하지 마세요. |

메시지 보존 기간을 충분히 설정하고, 객체를 변경하지 않으며 읽을 수 있는 상태로 유지하세요. 대략적인 백로그, 마지막 성공 시간, 작업 오류를 모니터링하세요. 작업 관리에 대해서는 [연속 데이터 적재 개요](./continuous-load-overview.md)와 [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)을 참고하세요.
