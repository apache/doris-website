---
{
    "title": "AWS Kinesis",
    "language": "ko",
    "description": "Routine Load로 AWS Kinesis Data Streams의 데이터를 Apache Doris에 지속적으로 적재하는 방법과 설정, 인증, 샤드 위치 및 문제 해결 방법을 안내합니다."
}
---

Routine Load는 AWS Kinesis Data Streams를 지속적으로 읽고 Doris 테이블에 레코드를 적재할 수 있습니다. 스트림은 샤드로 구성되며, Doris는 샤드별 시퀀스 번호로 진행 상황을 추적합니다.

:::info 버전
Kinesis Routine Load는 dev 버전에서 사용할 수 있습니다. 4.x 소스 브랜치에는 이 데이터 소스가 포함되어 있지 않으므로 해당 버전에는 이 가이드가 적용되지 않습니다.
:::

## 사전 요구 사항 {#prerequisites}

- Kinesis Routine Load가 포함된 Doris 빌드를 사용합니다. BE에서 Kinesis 엔드포인트에 접근할 수 있어야 합니다.
- Kinesis 스트림과 해당 스트림에 대한 `kinesis:ListShards`, `kinesis:GetShardIterator`, `kinesis:GetRecords` 권한이 있는 자격 증명을 준비합니다.
- 데이터베이스 및 테이블 생성 권한과 대상 테이블에 대한 `LOAD_PRIV` 권한이 있는 Doris 계정을 사용합니다. 기존 작업을 관리하려면 적절한 데이터 적재 권한도 필요합니다.
- 아래의 데이터 생성 명령을 실행하려면 `kinesis:PutRecord` 권한이 있는 자격 증명으로 AWS CLI를 구성합니다. 전용 테스트 스트림을 사용하거나 스트림의 기존 레코드를 고려해야 합니다.

Doris는 액세스 키와 보안 키 쌍, 세션 토큰이 포함된 임시 자격 증명, 수임한 IAM 역할 또는 BE 프로세스에서 사용할 수 있는 AWS 기본 자격 증명 체인을 지원합니다. 일반적인 AWS 자격 증명 지침은 [AWS 인증](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md)을 참조하세요.

## 빠른 시작 {#quick-start}

### 1. 데이터베이스 및 대상 테이블 생성 {#1-create-a-database-and-target-table}

MySQL 클라이언트에서 다음 SQL을 실행합니다. 이 예제는 단일 BE 개발 클러스터에 맞춰 복제본 하나를 사용합니다. 운영 환경에서는 적절한 복제본 수를 선택하세요.

```sql
CREATE DATABASE IF NOT EXISTS kinesis_demo;
USE kinesis_demo;

CREATE TABLE kinesis_events (
    id BIGINT NOT NULL,
    name STRING
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### 2. Routine Load 작업 생성 {#2-create-a-routine-load-job}

이 구문을 실행하기 전에 스트림 이름, 리전 및 자격 증명을 바꿉니다. 속성은 `kinesis_stream`이며, `aws.` 접두사를 붙이지 않습니다. `TRIM_HORIZON`은 스트림에 아직 보존되어 있는 가장 오래된 레코드부터 읽습니다.

```sql
CREATE ROUTINE LOAD kinesis_demo.kinesis_job ON kinesis_events
COLUMNS(id, name)
PROPERTIES (
    "format" = "json",
    "desired_concurrent_number" = "1"
)
FROM KINESIS (
    "aws.region" = "us-east-1",
    "kinesis_stream" = "my-test-stream",
    "aws.access_key" = "<access_key>",
    "aws.secret_key" = "<secret_key>",
    "property.kinesis_default_pos" = "TRIM_HORIZON"
);
```

적절한 AWS 기본 자격 증명 체인이 이미 구성된 BE 환경에서는 액세스 키와 보안 키 속성을 생략합니다. 역할 및 임시 자격 증명 설정은 매개변수 참조를 확인하세요.

### 3. 테스트 레코드 쓰기 및 확인 {#3-write-a-test-record-and-verify-it}

테스트 스트림용 AWS CLI v2가 구성된 셸에서 다음 명령을 실행합니다.

```shell
aws kinesis put-record \
  --region us-east-1 \
  --stream-name my-test-stream \
  --partition-key 1 \
  --cli-binary-format raw-in-base64-out \
  --data '{"id":1,"name":"Alice"}'
```

이 명령은 샤드 ID와 시퀀스 번호를 반환합니다. Routine Load는 비동기적으로 실행됩니다. 작업이 레코드를 읽고 커밋한 후 Doris에서 다음 쿼리를 실행합니다.

```sql
SELECT id, name FROM kinesis_demo.kinesis_events WHERE id = 1;
```

```text
+----+-------+
| id | name  |
+----+-------+
|  1 | Alice |
+----+-------+
```

## 매개변수 {#parameters}

아래의 모든 속성은 `FROM KINESIS (...)` 절에 속합니다. 선택적 속성을 생략하면 기본값이 유지됩니다. `format`, `jsonpaths`, `desired_concurrent_number` 등의 일반 작업 속성은 `PROPERTIES (...)`에 속합니다. [Routine Load](../import-way/routine-load-manual.md)를 참조하세요.

| 매개변수 | 유형 / 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `aws.region` | 문자열; 필수 | 없음 | 스트림이 있는 리전입니다. 예: `us-east-1`. |
| `kinesis_stream` | 문자열; 필수 | 없음 | 스트림 이름입니다. `aws.kinesis_stream`을 사용하지 마세요. |
| `aws.endpoint` | 문자열; 선택 | 해당 리전의 AWS 엔드포인트 | 사용자 지정 Kinesis 엔드포인트입니다. 예를 들어 LocalStack 엔드포인트를 지정할 수 있습니다. 기존 별칭인 `kinesis_endpoint`도 사용할 수 있지만, `aws.endpoint` 사용을 권장합니다. |
| `aws.access_key` | 문자열; 선택 | 명시적인 자격 증명이 없으면 AWS 기본 자격 증명 체인 사용 | 액세스 키 ID입니다. `aws.secret_key`와 함께 제공해야 합니다. |
| `aws.secret_key` | 문자열; 선택 | 없음 | `aws.access_key`와 쌍을 이루는 보안 키입니다. |
| `aws.session_key` | 문자열; 선택 | 없음 | 임시 자격 증명의 세션 토큰입니다. |
| `aws.role_arn` | 문자열; 선택 | 없음 | 수임할 IAM 역할입니다. 자격 증명의 주체에 해당 역할을 수임할 권한이 있어야 합니다. |
| `kinesis_shards` | 쉼표로 구분된 문자열; 선택 | 샤드 자동 검색 | 읽을 샤드 ID입니다. |
| `kinesis_shards_pos` | 쉼표로 구분된 문자열; 선택 | 명시적으로 나열한 각 샤드에 대해 `LATEST` | `kinesis_shards`와 일대일로 대응하는 위치입니다. 각 값은 `TRIM_HORIZON`, `LATEST` 또는 시퀀스 번호입니다. 시퀀스 번호를 지정하면 해당 레코드 **이후**부터 읽기 시작합니다. |
| `property.kinesis_default_pos` | 문자열; 선택 | `LATEST` | 기본 시작 위치입니다. `TRIM_HORIZON`, `LATEST` 또는 시퀀스 번호를 지정합니다. `kinesis_shards_pos`와 함께 사용할 수 없습니다. 타임스탬프 문자열은 지원하지 않습니다. |
| 기타 `property.*` | 문자열; 선택 | BE 옵션에 따라 다름 | `property.` 접두사를 제거한 후 BE로 전달합니다. 예를 들어 `property.aws.external.id`는 역할 수임에 사용할 외부 ID를 제공하며 역할 ARN이 필요합니다. BE에서 지원하는 옵션만 사용하세요. |

## 작업 모니터링 및 관리 {#monitor-and-manage-the-job}

```sql
SHOW ROUTINE LOAD FOR kinesis_demo.kinesis_job;
```

| 필드 | 의미 |
| --- | --- |
| `State` | 작업이 스케줄링되고 스트림을 읽을 수 있으면 `RUNNING`이 됩니다. 작업이 `PAUSED` 상태이면 일시 중지 사유를 확인합니다. |
| `DataSourceType` | `KINESIS`입니다. |
| `DataSourceProperties` | 리전, 스트림, 엔드포인트 및 구성된 샤드입니다. |
| `Progress` | 샤드별 시퀀스 번호 진행 상황입니다. 시퀀스 번호는 Kafka 오프셋과 다르며, 합산하여 레코드 수를 계산할 수 없습니다. |
| `Lag` | 확인 가능한 경우, 최신 레코드 대비 샤드별 지연 시간을 밀리초 단위로 표시합니다. |

```sql
PAUSE ROUTINE LOAD FOR kinesis_demo.kinesis_job;
RESUME ROUTINE LOAD FOR kinesis_demo.kinesis_job;
STOP ROUTINE LOAD FOR kinesis_demo.kinesis_job;
```

`PAUSE`는 새 태스크의 스케줄링을 중단하며, 작업은 나중에 재개할 수 있습니다. `STOP`은 작업을 영구적으로 종료합니다. 중지된 작업은 재개할 수 없습니다.

## 주의 사항 및 모범 사례 {#caveats-and-best-practices}

- 기본값인 `LATEST`는 과거 레코드를 다시 읽지 않습니다. 보존된 가장 오래된 데이터부터 읽으려면 `TRIM_HORIZON`을 사용하고, 재처리 범위를 제어하려면 명시적인 샤드 위치를 지정합니다. Kinesis에서 이미 만료된 데이터는 시작 위치를 변경해도 복구할 수 없습니다.
- 명시적으로 지정한 샤드 ID와 위치의 항목 수는 같아야 합니다. `kinesis_shards_pos`와 `property.kinesis_default_pos`를 함께 사용하지 마세요.
- 작업 생성 시 잘못된 속성이라는 오류가 발생하면 철자를 확인하고 작업 속성과 데이터 소스 속성을 구분했는지 확인합니다. 특히 `aws.kinesis_stream`과 타임스탬프 형식의 시작 위치 문자열은 유효하지 않습니다.
- 작업이 일시 중지되면 `SHOW ROUTINE LOAD`와 BE 로그에서 인증, 엔드포인트, 샤드 및 데이터 형식 오류를 확인합니다. JSON 레코드는 대상 열 또는 구성된 매핑과 일치해야 합니다.
- 실제 워크로드를 대표하는 스트림 처리량을 기준으로 동시 실행 수준을 정합니다. Kinesis 읽기 제한과 샤드 분포에 따라 처리량이 제한될 수 있습니다. 태스크를 추가해도 AWS의 샤드별 제한을 우회할 수는 없습니다.
