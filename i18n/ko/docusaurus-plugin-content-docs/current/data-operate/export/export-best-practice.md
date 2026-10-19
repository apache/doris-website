---
{
    "title": "데이터 내보내기 모범 사례",
    "language": "ko",
    "description": "Doris 데이터 내보내기 시 리소스 활용이 적절한지 어떻게 판단할 수 있을까요? 이 문서에서는 SELECT INTO OUTFILE과 EXPORT의 동시성 튜닝 및 속도 평가 방법을 설명합니다.",
    "sidebar_label": "모범 사례",
    "keywords": [
        "Doris 데이터 내보내기",
        "SELECT INTO OUTFILE",
        "EXPORT 명령",
        "병렬 내보내기",
        "내보내기 성능 튜닝",
        "enable_parallel_outfile",
        "parallelism",
        "data_consistency",
        "async_task_consumer_thread_num",
        "내보내기 대역폭 병목"
    ]
}
---

<!-- Knowledge type: Performance tuning / Configuration parameters -->
<!-- Applicable scenarios: Export performance bottleneck analysis / Concurrency tuning / Bandwidth utilization evaluation -->

이 문서에서는 Doris 데이터 내보내기 시 리소스 활용이 적절한지 판단하는 방법과 동시성 등의 매개변수를 조정하여 내보내기 효율을 높이는 방법을 설명합니다. 일반적으로 사용하는 두 가지 내보내기 방식을 다룹니다.

| 내보내기 방식          | 적용 시나리오                                            | 동시성 제어                              |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| `SELECT INTO OUTFILE`  | 단일 SQL 쿼리의 결과를 유연하게 사용자 지정하여 내보내기 | `enable_parallel_outfile` 세션 변수       |
| `EXPORT`               | 대용량 테이블이나 파티션을 일괄 내보내기하며, 여러 Outfile 작업으로 자동 분할 | `parallelism`, `data_consistency` 등    |

## SELECT INTO OUTFILE 튜닝 {#tuning-select-into-outfile}

<!-- Knowledge type: Operating procedure -->

`SELECT INTO OUTFILE`은 Writer를 통해 데이터를 병렬로 내보냅니다. Writer가 많을수록 내보내기 동시성이 높아지지만, 생성되는 파일 수도 늘어납니다.

### 1. 병렬 내보내기 활성화 {#1-enable-parallel-export}

**목적**: `SELECT INTO OUTFILE`의 동시성을 높입니다.

**판단 방법**: `SELECT INTO OUTFILE`이 반환하는 행 수는 병렬 Writer 수를 나타냅니다. 1개 행만 반환된다면(단일 Writer), 병렬 내보내기를 활성화해 볼 수 있습니다.

**명령**:

```sql
SET enable_parallel_outfile = true;
```

**참고 사항**:

- 활성화하면 `SELECT INTO OUTFILE`은 쿼리의 병렬도에 맞춰 Writer를 생성합니다.
- 쿼리 병렬도는 세션 변수 `parallel_pipeline_task_num`으로 제어하며, 기본값은 단일 BE의 CPU 코어 수의 절반입니다.
- 예: BE 노드가 3개이고 노드당 코어가 8개인 클러스터에서 병렬 내보내기를 활성화하면 `4 × 3 = 12`개의 Writer가 생성됩니다.

**제한 사항**: 다음 쿼리는 `enable_parallel_outfile`을 활성화해도 병렬로 내보낼 수 없습니다.

- 전역 정렬을 포함하는 쿼리. 예: `SELECT * FROM table ORDER BY id;`
- 전역 집계 의미를 갖는 쿼리. 예: `SELECT SUM(cost) FROM table;`

### 2. 내보내기 속도 평가 {#2-evaluate-export-speed}

**목적**: 내보내기 속도가 디스크 또는 네트워크 대역폭의 한계에 도달했는지 판단합니다.

**단계**:

1. `SELECT INTO OUTFILE`이 반환하는 행에서 각 Writer의 쓰기 시간(초)과 속도(KB/s)를 확인합니다.
2. 같은 노드에 있는 여러 Writer의 속도를 합산하여 해당 노드의 쓰기 속도를 구합니다.
3. 이 속도를 병목 대역폭과 비교합니다.
    - 로컬로 내보내는 경우: 디스크 대역폭과 비교합니다.
    - 객체 스토리지로 내보내는 경우: 네트워크 대역폭과 비교합니다.

실제 속도가 병목 대역폭에 가깝다면 리소스가 이미 충분히 활용되고 있는 것입니다. 그렇지 않다면 동시성을 추가로 조정할 수 있습니다.

## EXPORT 튜닝 {#tuning-export}

<!-- Knowledge type: Operating procedure / Configuration parameters -->

`EXPORT` 명령은 기본적으로 하나의 내보내기 작업을 여러 `SELECT INTO OUTFILE` 문으로 분할하여 실행합니다. 튜닝하려면 먼저 이 분할 방식을 이해해야 합니다.

### 1. 반환 결과로 실행 상태 확인 {#1-inspect-execution-through-the-returned-result}

**명령**:

```sql
SHOW EXPORT;
```

반환 결과에는 이차원 배열 구조의 JSON 문자열이 포함됩니다.

- **첫 번째 차원**: 동시에 실행되는 Export 스레드 수, 즉 병렬로 실행되는 Outfile 문 수입니다.
- **두 번째 차원**: 단일 Outfile 문의 반환값으로, 여러 Writer의 쓰기 세부 정보입니다.

**예시**:

```json
[
    [
        {
            "fileNumber": "1",
            "totalRows": "640321",
            "fileSize": "350758307",
            "url": "file:///127.0.0.1/mnt/disk2/ftw/tmp/export/exp_59fd917c43874adc-9b1c3e9cd6e655be_*",
            "writeTime": "17.989",
            "writeSpeed": "19041.66"
        },
        {...},
        {...},
        {...}
    ],
    [
        {
            "fileNumber": "1",
            "totalRows": "646609",
            "fileSize": "354228704",
            "url": "file:///127.0.0.1/mnt/disk2/ftw/tmp/export/exp_c75b9d4b59bf4943-92eb94a7b97e46cb_*",
            "writeTime": "17.249",
            "writeSpeed": "20054.64"
        },
        {...},
        {...},
        {...}
    ]
]
```

**설명**: 위 예시에서는 Outfile 명령 2개가 실행되었으며, 각 명령에서 Writer 4개가 병렬로 데이터를 기록했습니다. Export 명령 속성의 `parallelism` 매개변수로 동시에 실행되는 Outfile 명령 수를 제어하여 전체 동시성을 조정할 수 있습니다.

### 2. 병렬도에 영향을 주는 매개변수 {#2-parameters-that-affect-parallelism}

<!-- Knowledge type: Configuration parameters -->

Export 작업의 전체 병렬도는 다음 매개변수에 의해 함께 결정됩니다.

| 매개변수                         | 적용 범위         | 기본값     | 설명                                                                                |
| --------------------------------- | ------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `parallelism`                     | Export 명령 | -          | 하나의 Export 작업을 분할할 수 있는 최대 Outfile 명령 수를 제어합니다            |
| `data_consistency`                | Export 명령 | `partition`| 파티션 내에서 Outfile 명령을 추가로 분할할지 제어합니다                      |
| `async_task_consumer_thread_num`  | FE 설정     | `64`        | 클러스터에서 동시에 실행할 수 있는 전체 Export Task 수로, 모든 Export Task가 공유합니다  |

#### parallelism {#parallelism}

단일 Export 작업을 분할할 수 있는 최대 Outfile 명령 수, 즉 작업 내 동시성의 상한을 제어합니다.

#### data_consistency {#data_consistency}

파티션 내에서 Outfile 명령을 추가로 분할할지 제어합니다.

- `partition`(기본값): 파티션을 추가로 분할하지 않습니다. Outfile 명령 수는 대상 파티션 수보다 작거나 같습니다.
- `none`: 파티션을 추가로 분할하여 동시성을 높입니다. 다만 파티션에 데이터가 기록되고 있다면 내보내기 일관성이 보장되지 않을 수 있습니다. 같은 파티션의 서로 다른 Outfile 명령이 서로 다른 버전의 데이터를 내보낼 수 있기 때문입니다.

자세한 내용은 [EXPORT 명령 매뉴얼](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md)을 참조하세요.

#### async_task_consumer_thread_num {#async_task_consumer_thread_num}

현재 클러스터에서 동시에 실행할 수 있는 Export Task 수의 상한을 나타내는 FE 설정 매개변수입니다. 기본값은 `64`입니다.

- 하나의 Export Job은 동시성에 따라 여러 Export Task로 분할됩니다.
- 모든 Export Task가 이 한도를 공유합니다.
- 클러스터에서 동시에 실행할 수 있는 내보내기 작업 수를 늘리려면 이 매개변수 값을 높이고 FE 노드를 재시작합니다.

## 튜닝 절차 참고 {#tuning-workflow-reference}

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenarios: Export performance bottleneck localization -->

내보내기 성능이 기대에 미치지 못하면 다음 순서로 점검합니다.

1. **동시성 확인**: 반환 결과(`SELECT INTO OUTFILE`의 행 수 또는 `SHOW EXPORT`의 JSON)를 사용하여 실제로 동시에 실행되는 Writer 수를 확인합니다.
2. **대역폭 활용도 평가**: 단일 노드의 Writer 속도를 합산하고 디스크 또는 네트워크 대역폭과 비교하여 병목에 도달했는지 판단합니다.
3. **동시성 매개변수 조정**:
    - `SELECT INTO OUTFILE`: `enable_parallel_outfile`을 활성화하고, 필요한 경우 `parallel_pipeline_task_num`을 조정합니다.
    - `EXPORT`: `parallelism`을 조정하고, 필요한 경우 `data_consistency`를 `none`으로 설정합니다.
4. **클러스터 수준의 한도 조정**: 클러스터에서 너무 많은 Export 작업이 동시에 실행되어 제한이 걸린다면 FE 설정 `async_task_consumer_thread_num`의 값을 높이고 FE를 재시작합니다.
