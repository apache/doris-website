---
{
    "title": "파티셔닝과 버키팅",
    "language": "ko",
    "description": "쿼리 필터, 데이터 분포, 보존 요구 사항에 따라 Doris 테이블의 파티셔닝과 버키팅을 선택합니다."
}
---

Doris는 테이블을 두 단계로 구성합니다. 파티션은 컬럼 값을 기준으로 행을 나누고, 버킷은 병렬 처리를 위해 각 파티션을 태블릿으로 나눕니다. 쿼리 필터, 데이터 분포, 보존 요구 사항에 따라 설계를 선택하세요.

## 시계열 데이터 설계의 시작점 {#starting-point-for-time-series-data}

지속적으로 유입되는 시계열 데이터의 경우, 자동 파티셔닝을 사용하면 행이 유입될 때 시간별 파티션을 생성할 수 있습니다. 다음 예제에서는 일별 파티션과 자동 버킷 크기 조정을 사용합니다.

데이터베이스와 테이블을 생성할 권한이 있는 계정으로 MySQL 클라이언트에 연결하세요. 이 예제에서는 BE가 하나인 개발 클러스터에서도 실행할 수 있도록 복제본을 하나만 사용합니다. 프로덕션 환경에서는 적절한 복제본 수를 선택하세요.

```sql
CREATE DATABASE IF NOT EXISTS partition_demo;
USE partition_demo;

CREATE TABLE sales (
    sale_time   DATETIME NOT NULL,
    order_id    BIGINT   NOT NULL,
    amount      DECIMAL(10, 2)
)
DUPLICATE KEY(sale_time, order_id)
AUTO PARTITION BY RANGE (date_trunc(sale_time, 'day')) ()
DISTRIBUTED BY HASH(order_id) BUCKETS AUTO
PROPERTIES (
    "replication_num" = "1",
    "estimate_partition_size" = "1G"
);

INSERT INTO sales VALUES
    ('2026-10-14 10:00:00', 1, 12.50),
    ('2026-10-15 11:00:00', 2, 20.00);

SELECT COUNT(*) AS row_count FROM sales;
```

```text
+-----------+
| row_count |
+-----------+
|         2 |
+-----------+
```

데이터 적재 시 일별 파티션 두 개가 생성됩니다. `BUCKETS AUTO`는 예상 파티션 크기와 클러스터 리소스를 바탕으로 버킷 수를 선택하며, 기존 파티션의 크기는 변경하지 않습니다. 작은 파티션이 너무 많이 생성되지 않도록 파티션 간격을 선택하세요. 작은 참조 테이블이나 시간 기반 필터링 또는 보존 정책이 필요하지 않은 테이블은 단일 파티션을 사용할 수 있습니다.

## 설계 선택 {#choose-your-design}

| 설계 항목 | 기본 선택 | 다른 옵션을 선택할 때 |
| --- | --- | --- |
| 파티셔닝 | 시간 또는 목록 파티션을 필요할 때 생성하는 [자동 파티셔닝](./auto-partitioning) | 사용자 지정 범위, 숫자 범위 또는 그룹화된 LIST 값이 필요하면 [수동 파티셔닝](./manual-partitioning)을 사용하세요. 일정에 따른 생성과 이동 시간 윈도우가 필요하면 [동적 파티셔닝](./dynamic-partitioning)을 사용하세요. |
| 버키팅 방식 | 동등 조건 필터에 적합하고 데이터를 고르게 분산하는 컬럼을 기준으로 해시 버키팅 | 랜덤 버키팅은 DUPLICATE 테이블의 데이터 쏠림을 줄일 수 있지만, 버킷 프루닝은 지원하지 않습니다. [데이터 버키팅](./data-bucketing)을 참조하세요. |
| 버킷 수 | 대표적인 `BUCKETS AUTO` 설정과 `estimate_partition_size` 값 | 명시적인 제어가 필요하면 고정된 개수를 사용하세요. 태블릿 크기와 쿼리 병렬성을 고려하면서 태블릿 관리 오버헤드와 균형을 맞추세요. |

## 오래된 파티션 만료 처리 {#expire-old-partitions}

각 보존 모드는 서로 다른 정책을 나타냅니다.

| 파티션 모드 | 속성 | 보존 규칙 |
| --- | --- | --- |
| [동적 파티셔닝](./dynamic-partitioning) | `dynamic_partition.start`(예: `-7`) | 설정된 시간 단위와 시간대를 사용하여 현재 시간을 기준으로 하는 시간 윈도우 |
| [자동 파티셔닝](./auto-partitioning)(RANGE) | `partition.retention_count`(예: `3`) | 파티션 값을 기준으로 가장 최근의 **과거** 파티션 N개를 유지하며, 현재 및 미래 파티션도 유지 |

파티션 수만으로는 경과 시간을 보장할 수 없습니다. 데이터가 드물게 유입되거나 오래된 데이터만 있는 경우, 가장 최근의 과거 파티션 N개가 N일보다 훨씬 오래되었을 수 있습니다. 데이터가 일정 기간이 지나면 반드시 만료되어야 하는 경우에는 시간 윈도우를 선택하세요.

예제 테이블에 다음 정책을 적용하면 현재 및 미래 파티션과 함께 가장 최근의 과거 파티션 세 개를 유지합니다.

```sql
ALTER TABLE partition_demo.sales SET ("partition.retention_count" = "3");
```

이후 FE 스케줄러가 보존 개수를 초과하는 과거 파티션을 삭제합니다. 이 속성은 AUTO RANGE 테이블에만 적용되며, 동적 파티셔닝이 활성화된 상태에서는 함께 사용할 수 없습니다. 스케줄링 동작과 Doris 4.1.4의 변경 사항을 포함한 버전별 제한 사항은 [자동 파티셔닝: 수명 주기 관리](./auto-partitioning#lifecycle-management)를 참조하세요.

보존 정책을 적용하면 데이터가 **삭제**됩니다. 콜드 데이터를 유지하면서 더 저렴한 스토리지로 이동하려면 [계층형 스토리지](../tiered-storage/overview)를 사용하세요.

## 작동 방식 {#how-it-works}

```text
Table → Partition (by column value) → Bucket (hash or random) → Tablet (shard on a BE node)
```

파티션은 쿼리 프루닝과 데이터 수명 주기 관리를 지원합니다. 버킷은 병렬 읽기와 쓰기를 제공합니다. 태블릿, 복제본, 노드 배치 및 운영 명령은 [파티셔닝과 버키팅의 작동 방식](./basic-concepts)을 참조하세요.

## 다음 단계 {#next-steps}

- [자동 파티셔닝](./auto-partitioning): 필요할 때 파티션 생성.
- [동적 파티셔닝](./dynamic-partitioning): 일정에 따른 생성과 이동 시간 윈도우.
- [수동 파티셔닝](./manual-partitioning): 명시적인 범위와 목록 파티션.
- [데이터 버키팅](./data-bucketing): 방식, 키 및 버킷 수 선택.
- [파티셔닝과 버키팅의 작동 방식](./basic-concepts): 데이터 분산 모델.
- [일반적인 문제](./common-issues): 파티션 및 버킷 설계 문제 해결.
