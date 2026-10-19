---
{
    "title": "디스크 용량 관리",
    "language": "ko",
    "description": "Doris BE의 디스크 워터마크 메커니즘(High Watermark, Flood Stage), 관련 FE/BE 매개변수, 디스크가 가득 찼을 때 공간을 확보하고 복구하는 긴급 조치를 설명합니다.",
    "keywords": [
        "disk capacity management",
        "disk watermark",
        "high watermark",
        "flood stage",
        "Flood Stage",
        "High Watermark",
        "storage_root_path",
        "BE disk full",
        "disk usage",
        "ADMIN CLEAN TRASH",
        "recycle bin cleanup",
        "disk space reclamation",
        "Doris operations",
        "tablet deletion",
        "replica modification"
    ]
}
---

<!-- Knowledge type: Operations / Configuration parameters / Troubleshooting -->
<!-- Applicable scenarios: BE disk usage too high, BE process failure caused by a full disk, need to proactively control disk watermarks -->

이 문서에서는 Doris의 디스크 저장 공간과 관련된 시스템 매개변수와 대응 방법을 설명합니다. 운영 엔지니어가 디스크 워터마크 메커니즘을 이해하고 적절한 임계값을 설정하며, 디스크 공간이 부족하거나 가득 찼을 때 클러스터를 빠르게 복구할 수 있도록 안내합니다.

Doris의 데이터 디스크 사용량을 관리하지 않으면 디스크가 가득 차는 순간 BE 프로세스가 비정상 종료됩니다. Doris는 각 디스크의 사용량과 남은 공간을 모니터링하고, 여러 단계의 경고 워터마크에 따라 시스템 작업을 제한하여 디스크가 가득 차는 상황을 최대한 방지합니다.

## 적용 시나리오 {#applicable-scenarios}

<!-- Knowledge type: Scenario description -->

| 시나리오 | 중점 사항 |
| --- | --- |
| 일상적인 용량 계획 | FE/BE 워터마크 메커니즘을 이해하고 조기에 경고 |
| 디스크 사용량이 High Watermark에 근접 | FE 임계값을 조정하고 균형 조정이나 복구 작업으로 인한 추가 공간 사용 방지 |
| 디스크 사용량이 Flood Stage에 도달 | 쓰기가 차단된 원인을 조사하고 선제적으로 공간 확보 |
| 디스크가 가득 차 BE를 시작할 수 없음 | 임시 파일을 삭제하여 프로세스를 긴급 복구 |
| 여러 복제본을 사용하는 테이블의 빠른 비용 절감 | 복제본 수를 일시적으로 줄이고 복구 후 다시 늘림 |

## 용어 {#terminology}

- **Data Dir**: `storage_root_path`에 지정된 각 데이터 디렉터리를 뜻하며, BE 구성 파일 `be.conf`에서 설정합니다. 일반적으로 각 데이터 디렉터리는 하나의 디스크에 대응하므로, 아래에서 사용하는 **디스크**라는 용어는 데이터 디렉터리도 가리킵니다.
- **High Watermark**: FE 측의 낮은 단계 임계값입니다. 사용량이 이 임계값을 초과하면 균형 조정 등의 일부 작업이 제한됩니다.
- **Flood Stage**: FE와 BE 양쪽에 설정되는 높은 단계 임계값입니다. 사용량이 이 임계값을 초과하면 자체 보호 조치로 쓰기 등의 주요 작업이 금지됩니다.

## 기본 원리 {#basic-principles}

<!-- Knowledge type: How it works -->

1. BE는 약 일 분마다 디스크 사용량을 FE에 보고합니다.
2. FE는 보고된 통계에 따라 다음과 같이 작업을 제한합니다.
    - 사용량이 **High Watermark**를 초과하면 균형 조정, Decommission 등의 작업이 제한됩니다.
    - 사용량이 **Flood Stage**를 초과하면 데이터 적재와 복원 등의 쓰기 작업이 금지됩니다.
3. FE는 BE 디스크 상태를 완전히 실시간으로 파악할 수 없고 Compaction과 같은 BE 내부 작업을 제어할 수도 없습니다. 따라서 BE에도 **Flood Stage**를 설정하며, BE는 자체 보호 조치로 특정 작업을 능동적으로 거부하거나 중단합니다.

## FE 매개변수 {#fe-parameters}

<!-- Knowledge type: Configuration parameters -->

FE 측에는 **High Watermark**와 **Flood Stage**라는 두 단계의 임계값을 설정합니다. 각 단계에는 "사용률"과 "남은 용량"이라는 두 가지 조건이 있습니다.

### High Watermark {#high-watermark}

```text
storage_high_watermark_usage_percent defaults to 85 (85%).
storage_min_left_capacity_bytes defaults to 2GB.
```

발동 조건: 디스크 사용률이 `storage_high_watermark_usage_percent`보다 **높거나**, 남은 디스크 용량이 `storage_min_left_capacity_bytes`보다 **적을** 때입니다.

조건이 충족되면 해당 디스크는 다음 작업의 대상 경로로 더 이상 사용되지 않습니다.

- Tablet 균형 조정(Balance)
- Colocation 테이블의 데이터 샤드 재배치(Relocation)
- Decommission

### Flood Stage {#flood-stage}

```text
storage_flood_stage_usage_percent defaults to 95 (95%).
storage_flood_stage_left_capacity_bytes defaults to 1GB.
```

발동 조건: 디스크 사용률이 `storage_flood_stage_usage_percent`보다 **높고**, **동시에** 남은 디스크 용량이 `storage_flood_stage_left_capacity_bytes`보다 **적을** 때입니다.

조건이 충족되면 해당 디스크는 대상 경로로 더 이상 사용되지 않으며, 다음 작업이 금지됩니다.

- Tablet 균형 조정(Balance)
- Colocation 테이블의 데이터 샤드 재배치(Relocation)
- 복제본 보충
- 복원 작업
- 데이터 적재(Load/Insert)

### FE 매개변수 요약 {#fe-parameter-summary}

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `storage_high_watermark_usage_percent` | 85 (85%) | FE High Watermark 사용률 임계값 |
| `storage_min_left_capacity_bytes` | 2 GB | FE High Watermark 남은 용량 임계값 |
| `storage_flood_stage_usage_percent` | 95 (95%) | FE Flood Stage 사용률 임계값 |
| `storage_flood_stage_left_capacity_bytes` | 1 GB | FE Flood Stage 남은 용량 임계값 |

## BE 매개변수 {#be-parameters}

<!-- Knowledge type: Configuration parameters -->

BE 측에는 **Flood Stage**만 설정합니다. FE의 감지가 지연되거나 FE가 BE 내부 작업을 제어할 수 없는 상황에서 자체 보호를 위해 사용됩니다.

```text
storage_flood_stage_usage_percent defaults to 90 (90%).
storage_flood_stage_left_capacity_bytes defaults to 1GB.
```

발동 조건: 디스크 사용률이 `storage_flood_stage_usage_percent`보다 **높고**, **동시에** 남은 디스크 용량이 `storage_flood_stage_left_capacity_bytes`보다 **적을** 때입니다.

조건이 충족되면 해당 디스크에서 다음 작업이 금지됩니다.

- Base/Cumulative Compaction
- 데이터 쓰기(모든 데이터 적재 작업 포함)
- Clone Task: 일반적으로 복제본 복구나 균형 조정 중에 실행됩니다.
- Push Task: Hadoop 데이터 적재의 Loading 단계에서 파일을 다운로드할 때 실행됩니다.
- Alter Task: Schema Change 또는 Rollup 작업입니다.
- Download Task: 복원 작업의 Downloading 단계입니다.

### BE 매개변수 요약 {#be-parameter-summary}

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `storage_flood_stage_usage_percent` | 90 (90%) | BE Flood Stage 사용률 임계값 |
| `storage_flood_stage_left_capacity_bytes` | 1 GB | BE Flood Stage 남은 용량 임계값 |

## 디스크 공간 확보 {#releasing-disk-space}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: disk above the high watermark or flood stage, need to recover the cluster quickly -->

디스크 사용량이 High Watermark나 Flood Stage를 초과하면 많은 작업이 금지됩니다. 다음 방법으로 디스크 사용량을 줄이고 시스템을 복구할 수 있습니다. 위험이 낮은 방법부터 시도하고, 데이터 파일을 직접 삭제하는 방법은 최후의 수단으로만 고려하세요.

| 우선순위 | 작업 | 적용 시나리오 | 위험 |
| --- | --- | --- | --- |
| 1 | 테이블 또는 파티션 삭제 | 정리할 수 있는 과거 데이터가 있음 | 복구할 수 없지만 영향 범위를 제어할 수 있음 |
| 2 | BE 확장 | 리소스가 충분하고 몇 시간에서 며칠까지 기다릴 수 있음 | 낮음 |
| 3 | 테이블 또는 파티션의 복제본 수 변경 | 긴급 상황에서 일시적으로 비용 절감 | 데이터 신뢰성 저하 |
| 4 | 부가 파일 삭제(log/snapshot/trash) | 디스크가 가득 차 BE를 시작할 수 없음 | 휴지통에서의 복구에 영향 |
| 5 | 데이터 파일 삭제 | 위의 모든 방법이 실패한 경우의 최후 수단 | **데이터 손실 가능** |

### 테이블 또는 파티션 삭제 {#drop-a-table-or-partition}

테이블이나 파티션을 삭제하면 디스크 사용량을 빠르게 줄이고 클러스터를 복구할 수 있습니다.

> **참고**: `DROP`만 디스크 사용량을 빠르게 줄일 수 있으며, `DELETE`는 그렇지 않습니다.

```text
DROP TABLE tbl;
ALTER TABLE tbl DROP PARTITION p1;
```

### BE 확장 {#scale-out-be}

확장 후에는 디스크 사용량이 낮은 BE 노드로 데이터 샤드가 자동으로 분산됩니다. 데이터 양과 노드 수에 따라 클러스터가 균형 상태에 도달하기까지 몇 시간에서 며칠이 걸릴 수 있습니다.

### 테이블 또는 파티션의 복제본 수 변경 {#modify-the-replica-count-of-a-table-or-partition}

테이블이나 파티션의 복제본 수를 줄일 수 있습니다. 예를 들어 기본 복제본 수인 3개를 2개로 줄일 수 있습니다. 이 방법은 데이터 신뢰성을 낮추지만, 디스크 사용량을 빠르게 줄여 클러스터를 정상 상태로 되돌릴 수 있어 주로 긴급 복구에 사용됩니다. 복구 후에는 확장이나 데이터 삭제로 디스크 사용량을 줄인 다음 복제본 수를 다시 3개로 복원하세요.

복제본 수 변경은 즉시 적용되며, 초과 복제본은 백그라운드에서 비동기적으로 삭제됩니다.

```text
ALTER TABLE tbl MODIFY PARTITION p1 SET("replication_num" = "2");
```

### 부가 파일 삭제 {#delete-extra-files}

디스크가 가득 차 BE 프로세스가 이미 비정상 종료되었고 다시 시작할 수 없다면, 데이터 디렉터리 아래의 임시 파일을 삭제하여 BE 프로세스를 시작할 수 있는 공간을 확보하세요. 이러한 상황은 FE나 BE의 감지가 지연될 때 발생할 수 있습니다. 다음 디렉터리의 파일은 직접 삭제할 수 있습니다.

- `log/`: 로그 디렉터리의 로그 파일입니다.
- `snapshot/`: 스냅샷 디렉터리의 스냅샷 파일입니다.
- `trash/`: 휴지통의 파일입니다.

> **참고**: 이 작업은 [BE 휴지통에서 데이터 복원](../data-admin/recyclebin)에 영향을 줍니다.

BE를 여전히 시작할 수 있다면 다음 명령으로 임시 파일을 직접 정리할 수 있습니다. 이 명령은 **모든** 휴지통 파일과 만료된 스냅샷 파일을 정리하므로, **휴지통에서 데이터를 복원하는 데 영향을 줍니다**.

```text
ADMIN CLEAN TRASH ON(BackendHost:BackendHeartBeatPort);
```

`ADMIN CLEAN TRASH`를 수동으로 실행하지 않아도 시스템은 몇 분에서 수십 분 이내에 자동으로 정리 작업을 실행합니다. 동작은 다음 두 가지 경우로 나뉩니다.

- 디스크 사용량이 Flood Stage의 90%에 **도달하지 않은** 경우: 만료된 휴지통 파일과 만료된 스냅샷 파일만 정리합니다. 최근 파일은 유지되며 데이터 복구에 영향을 주지 않습니다.
- 디스크 사용량이 Flood Stage의 90%에 **도달한** 경우: **모든** 휴지통 파일과 만료된 스냅샷 파일을 정리하며, **이때는 휴지통에서의 복구에 영향을 줍니다**.

자동 정리 주기는 구성 항목 `max_garbage_sweep_interval`과 `min_garbage_sweep_interval`로 변경할 수 있습니다.

휴지통 파일이 없어 복구에 실패하면 다음과 같은 결과가 반환될 수 있습니다.

```text
{"status": "Fail","msg": "can find tablet path in trash"}
```

### 데이터 파일 삭제 (위험!!!) {#delete-data-files-dangerous}

위의 어떤 작업으로도 공간을 확보할 수 없다면 데이터 파일을 직접 삭제하여 공간을 확보해야 합니다. 데이터 파일은 지정된 데이터 디렉터리의 `data/` 디렉터리 아래에 있습니다.

> **경고**: 데이터 샤드(Tablet)를 삭제하기 전에 해당 Tablet의 복제본 중 최소 하나가 정상인지 확인하세요. 그렇지 않으면 **유일한 복제본을 삭제하여 데이터가 손실됩니다**.

id가 `12345`인 Tablet을 삭제한다고 가정하면 절차는 다음과 같습니다.

1. Tablet의 디렉터리를 찾습니다. 일반적으로 `data/shard_id/tablet_id/` 아래에 있습니다. 예를 들면 다음과 같습니다.

    ```text
    data/0/12345/
    ```

2. tablet id와 schema hash를 기록합니다. schema hash는 이전 단계에서 찾은 디렉터리의 바로 아래 디렉터리 이름입니다. 예를 들어 `352781111`입니다.

    ```text
    data/0/12345/352781111
    ```

3. 데이터 디렉터리를 삭제합니다.

    ```shell
    rm -rf data/0/12345/
    ```

4. Tablet 메타데이터를 삭제합니다. 자세한 내용은 [Tablet 메타데이터 관리 도구](../trouble-shooting/tablet-meta-tool)를 참조하세요.

    ```shell
    ./lib/meta_tool --operation=delete_header --root_path=/path/to/root_path --tablet_id=12345 --schema_hash=352781111
    ```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

### 질문: 데이터 적재 작업이 오류와 함께 거부됩니다. 어떻게 해야 하나요? {#q-a-load-task-is-rejected-with-an-error-what-should-i-do}

디스크 사용량이 FE 또는 BE의 Flood Stage를 초과했습니다. "디스크 공간 확보" 절을 참조하고, 과거 파티션에 대한 `DROP` 실행이나 확장을 우선 고려하세요.

### 질문: 복제본 균형 조정이 오랫동안 완료되지 않습니다. 어떻게 해야 하나요? {#q-replica-balancing-does-not-converge-for-a-long-time-what-should-i-do}

일부 디스크가 High Watermark를 초과하여 균형 조정의 대상 디스크로 사용될 수 없습니다. High Watermark를 초과한 디스크의 공간을 확보하거나 BE를 확장한 다음 자동 균형 조정이 완료될 때까지 기다리세요.

### 질문: BE 프로세스가 시작되지 않고 디스크가 가득 찼습니다. 어떻게 해야 하나요? {#q-the-be-process-fails-to-start-and-the-disk-is-full-what-should-i-do}

`data/`가 있는 디스크가 가득 찼습니다. 먼저 `log/`, `snapshot/`, `trash/`를 삭제하여 공간을 확보한 다음 BE를 시작하세요.

### 질문: `ADMIN CLEAN TRASH`를 실행한 후 데이터를 복원할 수 없습니다. 어떻게 해야 하나요? {#q-after-running-admin-clean-trash-data-cannot-be-restored-what-should-i-do}

휴지통 파일이 정리된 상태입니다. 이 작업은 되돌릴 수 없습니다. 복구 전에 영향을 평가하세요.

### 질문: 자동 정리에서 `can find tablet path in trash`가 반환됩니다. 어떻게 해야 하나요? {#q-automatic-cleanup-returns-can-find-tablet-path-in-trash-what-should-i-do}

디스크 사용량이 Flood Stage의 90%에 도달하여 휴지통이 완전히 정리되었습니다. 워터마크 상태를 확인하고 디스크 공간을 확보한 후 다시 시도하세요.
