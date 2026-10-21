---
{
    "title": "Routine Load 원리 및 모범 사례",
    "language": "ko",
    "description": "Apache Doris Routine Load가 Kafka 데이터를 소비하는 방식을 Exactly Once 시맨틱, 튜닝 매개변수, 일반적인 문제 해결 방법과 함께 심층적으로 분석합니다.",
    "keywords": [
        "Routine Load",
        "Apache Doris Kafka 데이터 적재",
        "Doris 스트리밍 데이터 적재",
        "Exactly Once",
        "Kafka 토픽 소비",
        "데이터 적체 문제 해결",
        "max_batch_interval",
        "desired_concurrent_number",
        "out of range"
    ]
}
---

<!-- Knowledge type: Architecture principles + Configuration parameters + Troubleshooting -->
<!-- Applicable scenarios: Understanding streaming load principles / Performance tuning / Troubleshooting -->

## 1. 개요 {#1-overview}

Routine Load는 Kafka 데이터를 지속적으로 소비하여 Apache Doris에 기록합니다. Routine Load Job을 생성하면 지정한 Kafka 토픽을 자동으로 구독할 수 있습니다. 주요 기능은 다음과 같습니다.

- **고가용성:** 7x24 중단 없는 Kafka 데이터 소비를 지원하며, 장애 발생 후 자동으로 작업을 재개할 수 있습니다.
- **낮은 지연 시간:** Kafka 메시지가 수초 내에 조회 가능한 상태가 됩니다.
- **Exactly Once 시맨틱:** Kafka 데이터를 손실이나 중복 없이 소비하여 정확히 한 번만 소비되도록 보장합니다.

이 문서는 구현 원리를 심층적으로 분석하고, 일반적인 사용 시나리오의 모범 사례와 자주 발생하는 문제의 해결 방법을 소개합니다. 이를 통해 Routine Load를 빠르게 시작하고 효율적으로 운영할 수 있습니다.

목적에 따라 다음 순서로 읽는 것을 권장합니다.

1. 작동 방식을 이해하려면 [구현 원리](#2-implementation-principles)를 읽으세요.
2. 성능을 최적화하려면 [모범 사례](#3-best-practices)를 읽으세요.
3. 문제를 해결하려면 [일반적인 문제 해결](#4-common-troubleshooting)을 읽으세요.

## 2. 구현 원리 {#2-implementation-principles}

<!-- Knowledge type: Architecture principles -->

Kafka 데이터는 스트림 형태로 존재하며, Doris는 Kafka 스트리밍 데이터를 "마이크로 배치" 방식으로 소비합니다. Routine Load Job이 생성되면 시스템은 설정된 동시 실행 수에 따라 Job을 여러 Task로 나누어 동시에 실행합니다. 각 Task는 Kafka 토픽의 특정 파티션에서 데이터를 소비합니다. 각 Task는 하나의 트랜잭션에 대응하며, 실행이 완료되면 다음 배치의 데이터를 계속 소비할 새 Task가 생성됩니다.

다음 절에서는 세 가지 측면을 살펴봅니다.

- Job과 Task의 스케줄링 방식
- Exactly Once 시맨틱의 구현 방식
- 단일 스트림 다중 테이블 쓰기의 실행 흐름

### 2.1 Job 및 Task 스케줄링 {#21-job-and-task-scheduling}

Routine Load는 두 단계의 스케줄링 모델을 사용합니다.

| 스케줄링 단계 | 역할 |
| ---------------- | ----------------------------------------------------------------------------- |
| **Job 스케줄링** | Task 분할, 장애 복구, 수명 주기 관리 담당 |
| **Task 스케줄링** | 실제 데이터 가져오기, 변환, 쓰기 작업을 BE 노드에 전달하여 실행하도록 하는 역할 담당 |

#### 2.1.1 Job 스케줄링 {#211-job-scheduling}

**Job 상태 머신**

| 상태 | 의미 |
| -------------- | ---------------------------------------------------------------- |
| NEED_SCHEDULE | 최초 스케줄링을 기다리거나 재스케줄링이 필요한 상태 |
| RUNNING | 정상적으로 데이터를 소비하는 상태 |
| PAUSED | 사용자 요청 또는 예외로 일시 중지된 상태로, 자동 재개 가능 |
| CANCELLED | 데이터베이스 또는 테이블 삭제와 같은 복구 불가능한 오류로 종료된 상태 |
| STOPPED | 수동으로 중지되어 복구할 수 없는 상태 |

**스케줄링 동작**

스케줄링 스레드는 매 스케줄링 주기(10s)마다 Job 상태에 따라 다음 작업을 수행합니다.

- **NEED_SCHEDULE:** 토픽 메타데이터(파티션 수, 시작 오프셋)를 가져오고, 다음 공식에 따라 Task를 분할한 뒤 `needScheduleTasksQueue`에 넣어 Task 스케줄링 스레드가 스케줄링을 시작할 때까지 대기시킵니다.

    ```Plain
    taskNum = min(topic_partition_num,
                  desired_concurrent_number,
                  max_routine_load_task_concurrent_num)
    ```

- **RUNNING:** 토픽 메타데이터를 주기적으로 가져오며, 파티션 수가 변경되면 즉시 재스케줄링합니다.

- **PAUSED:** Job의 고가용성을 보장하기 위해 자동 재개 메커니즘을 사용합니다. 예기치 않게 일시 중지되면 Routine Load Scheduler 스레드가 Job의 자동 재개를 시도합니다. Kafka의 예기치 않은 중단이나 그 밖의 원인으로 Kafka가 작동하지 않는 경우, 자동 재개 메커니즘은 Kafka가 복구된 후 수동 개입 없이 데이터 적재 Job이 정상적으로 계속 실행되도록 합니다. 단, 다음 세 가지 경우에는 Job이 자동으로 재개되지 **않습니다**.

    1. 사용자가 `PAUSE ROUTINE LOAD` 명령을 수동으로 실행한 경우.
    2. 데이터 품질 문제가 있는 경우.
    3. 데이터베이스 또는 테이블 삭제처럼 자동으로 복구할 수 없는 경우.

    이 세 가지 경우를 제외하면 일시 중지된 모든 Job은 자동 재개를 시도합니다.

- **CANCELLED / STOPPED:** 일정 시간이 지난 후 리소스를 회수합니다.

#### 2.1.2 Task 스케줄링 {#212-task-scheduling}

**스케줄링 조건**

Task 스케줄링은 다음 조건 중 하나를 충족해야 합니다.

- Task가 아직 파티션 끝까지 읽지 않아 소비할 데이터가 남아 있어야 합니다. 이는 리소스 낭비를 방지하기 위한 조건입니다.
- 이전 실행에서 이미 EOF까지 읽었다면, 마지막 실행이 시작된 후 `max_batch_interval`이 지나야 새 스케줄링을 시작합니다. 이는 소비 속도가 생산 속도보다 빠를 때 데이터를 적절한 배치 크기로 모아, 작은 트랜잭션이 지나치게 많이 생성되는 것을 방지하기 위한 조건입니다.

**부하 분산 전략**

스케줄러는 다음 우선순위에 따라 Task를 실행할 BE 노드를 선택합니다.

1. 현재 실행 중인 Task가 가장 적은 BE를 우선 선택합니다.
2. 여러 BE의 Task 수가 같으면, 초기화 오버헤드를 줄이기 위해 캐시된 Kafka Consumer가 있는 노드를 우선 선택합니다.

**배치 종료 조건**

다음 조건 중 하나라도 충족되면 현재 Task가 종료됩니다.

- `max_batch_interval`에 설정된 시간에 도달한 경우.
- `max_batch_rows`에 설정된 행 수에 도달한 경우.
- `max_batch_size`에 설정된 바이트 크기에 도달한 경우.
- Kafka EOF를 읽어 스트림 끝에 도달한 경우.

Task가 종료되면 트랜잭션을 커밋하고, 즉시 새 Task를 생성하여 다음 스케줄링을 기다리는 큐에 넣습니다. 이를 통해 데이터를 지속적으로 소비합니다.

### 2.2 Exactly Once 시맨틱 {#22-exactly-once-semantics}

<!-- Knowledge type: Architecture principles -->

Routine Load는 "소비 진행 상황 영속화"와 "커밋 검증"이라는 두 가지 메커니즘을 통해 Kafka 데이터를 손실이나 중복 없이 소비하도록 보장합니다.

#### 2.2.1 소비 진행 상황 영속화 {#221-persisting-consumption-progress}

각 Task는 트랜잭션을 커밋할 때 소비 진행 상황을 트랜잭션 정보와 함께 FE edit log에 기록하고, Berkeley DB JE를 사용하여 모든 FE Follower에 동기화합니다. Master 전환이나 재시작 후에도 진행 상황 정보는 정확하게 유지됩니다.

#### 2.2.2 커밋 검증 {#222-commit-verification}

수동 일시 중지, Master 전환, 토픽 메타데이터 변경으로 Job이 재스케줄링되면 두 Task가 잠시 같은 파티션을 동시에 소비할 수 있습니다. 중복 쓰기를 방지하기 위해 다음과 같이 처리합니다.

- 각 Job은 메모리에서 `routineLoadTaskInfoList`를 유지합니다.
- Task는 커밋 전에 자신이 여전히 `routineLoadTaskInfoList`에 있는지 확인하며, 없으면 커밋이 거부됩니다.

### 2.3 단일 스트림 다중 테이블 쓰기 {#23-one-stream-multi-table-writing}

단일 스트림 다중 테이블 쓰기는 하나의 Routine Load Job에서 여러 대상 테이블에 동시에 데이터를 기록하는 기능입니다. 핵심 흐름은 다음과 같습니다.

1. **계획 수립 단계:** Job 생성 시점에는 대상 테이블을 모두 확정할 수 없으므로 실행 계획 수립을 런타임까지 미룹니다. 런타임에 BE가 FE Master에 실행 계획을 동적으로 요청합니다.
2. **데이터 캐싱:** BE는 먼저 로컬 다중 테이블 파이프에 데이터를 캐시합니다. 캐시된 레코드가 200개에 도달하거나 아직 실행 계획을 요청하지 않은 새 테이블이 5개가 되면, BE가 실행 계획을 요청하고 실행하여 데이터 적체를 방지합니다.
3. **실행 계획 재사용:** 동일한 트랜잭션 내에서는 캐시된 실행 계획을 재사용하며, 트랜잭션이 바뀌면 메타데이터를 최신 상태로 유지하기 위해 새 계획을 요청합니다.

## 3. 모범 사례 {#3-best-practices}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Performance tuning -->

Routine Load의 기본 매개변수는 대부분의 시나리오에 적합합니다. 수동 튜닝은 다음 세 가지 대표적인 시나리오에서만 필요합니다.

| 시나리오 | 권장 매개변수 변경 사항 |
| --------------------------------- | ------------------------------------------------------------------- |
| 낮은 지연 시간이 필요한 경우 | `max_batch_interval`을 기본값인 60s보다 작게 설정 |
| 데이터량이 적고 리소스 사용량에 민감한 경우 | `desired_concurrent_number`를 줄임 |
| 높은 처리량이 필요한 경우 | `max_batch_interval`을 기본값인 60s에서 120-180s로 늘림 |

## 4. 일반적인 문제 해결 {#4-common-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Routine Load exception troubleshooting -->

### 4.1 데이터 적체 {#41-data-backlog}

다음 세 단계에 따라 데이터 적체의 원인을 파악하고 최적화하세요.

**단계 1: Task 상태 확인**

`SHOW ROUTINE LOAD\G`를 사용하여 Task 상태를 확인하고, 다음 항목을 중점적으로 살펴보세요.

- `State`가 `RUNNING`인지 확인합니다. 다른 상태라면 `ReasonOfStateChanged` 필드에서 원인을 확인합니다.
- `OtherMsg`에 오류 메시지가 있는지 확인합니다.

**단계 2: 처리량 한도 도달 여부 확인**

BE 로그를 통해 처리량 한도에 도달했는지 확인합니다. `consumer group done` 로그 항목을 검색하세요. `left_time / left_rows / left_bytes` 값은 어떤 임계값에 먼저 도달했는지 보여 주므로, 이에 따라 `max_batch_size` 또는 `max_batch_rows`를 늘릴 수 있습니다.

```C++
consumer group done: 894fc32d5b9d3e93-7387a02da6dafd88. consume time(ms)=34004, received rows=2679540, received bytes=2147484043, eos: 0, left_time: 25996, left_rows: 17320460, left_bytes: -395, blocking get time(us): 949236, blocking put time(us): 28730419, id=69616a41fc064f1e-a93ff0ddd217f0a0, job_id=48121487, txn_id=61763720, label=ods_hq_market_unique_jobs_0-48121487-69616a41fc064f1e-a93ff0ddd217f0a0-61763720, elapse(s)=34
```

위 예시에서 `left_bytes: -395`는 `max_batch_size`가 한도에 도달하여 배치가 34초 내에 종료되었음을 나타냅니다. 이 경우 `max_batch_size`를 적절히 늘려 `max_batch_interval` 내에 단일 배치에서 가능한 한 많은 데이터를 적재하면 처리량을 높일 수 있습니다.

**단계 3: 동시 실행 수 및 처리량 늘리기**

- `desired_concurrent_number`를 토픽의 파티션 수에 맞게 늘립니다.
- `max_batch_interval`(예: 120s에서 180s로), `max_batch_size` 또는 `max_batch_rows`를 적절히 늘려 트랜잭션당 데이터량과 배치당 데이터량을 늘리고 트랜잭션 오버헤드를 줄입니다.

### 4.2 예기치 않은 Task 일시 중지 {#42-task-unexpectedly-paused}

Routine Load에는 자동 재개 메커니즘이 내장되어 있어, 예기치 않은 일시 중지는 대부분 재시도됩니다. Task가 `PAUSED` 상태로 유지되며 자동으로 재개되지 않으면 `SHOW ROUTINE LOAD`를 실행하고 다음 사항을 조사하세요.

- `PAUSE ROUTINE LOAD`가 수동으로 실행되었는지 확인합니다.
- 데이터 품질 문제(예: 형식 오류 또는 필드 누락)가 있는지 확인합니다.
- Kafka 데이터가 만료되어 `out of range` 오류가 발생했는지 확인합니다.

## 5. 자주 묻는 질문 {#5-faq}

<!-- Knowledge type: FAQ -->

**Q1: Routine Load는 Exactly Once 시맨틱을 어떻게 보장하나요?**

두 가지 메커니즘으로 보장합니다. (1) 각 Task가 트랜잭션을 커밋할 때 소비 진행 상황을 FE edit log에 기록하고, Berkeley DB JE를 통해 모든 FE Follower에 동기화합니다. (2) Task는 커밋 전에 자신이 여전히 `routineLoadTaskInfoList`에 있는지 확인하며, 없으면 커밋이 거부되므로 동시 실행으로 인한 중복 쓰기를 방지합니다.

**Q2: PAUSED 상태의 Job은 자동으로 재개되나요?**

예기치 않은 일시 중지는 대부분 자동으로 재개됩니다. 다만 다음 세 가지 경우에는 자동으로 재개되지 **않습니다**. `PAUSE ROUTINE LOAD`를 수동으로 실행한 경우, 데이터 품질 문제가 있는 경우, 데이터베이스 또는 테이블 삭제와 같은 복구 불가능한 오류가 발생한 경우입니다.

**Q3: Task 수는 무엇으로 결정되나요?**

다음 공식에 따라 결정됩니다. `taskNum = min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)`.

**Q4: `max_batch_interval`은 언제 늘려야 하나요?**

높은 처리량이 필요한 시나리오에서는 기본값인 60s에서 120s-180s로 늘리면 트랜잭션당 데이터량을 늘릴 수 있습니다. 이를 통해 트랜잭션 오버헤드를 줄이고 전체 처리량을 높일 수 있습니다.

**Q5: 로그의 `out of range` 오류는 무엇을 의미하나요?**

Kafka에서 소비할 데이터가 만료되어(Kafka 보존 정책에 따라 정리되어) 소비 오프셋이 유효하지 않게 되었음을 의미합니다. Kafka 토픽의 보존 기간을 확인하거나 Routine Load가 데이터를 소비하기 시작할 오프셋을 재설정해야 합니다.
