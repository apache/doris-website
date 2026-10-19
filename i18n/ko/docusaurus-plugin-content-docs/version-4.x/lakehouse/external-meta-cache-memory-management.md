---
{
    "title": "외부 메타데이터 캐시 메모리 관리",
    "language": "ko",
    "description": "FE, Catalog 및 항목별 할당량을 사용하여 Doris 4.1.4의 Hive, Iceberg, Paimon 외부 메타데이터 캐시가 사용하는 FE 힙을 제한합니다.",
    "keywords": ["외부 메타데이터 캐시", "meta.cache.max-weight", "external_meta_cache_max_weight", "FE 메모리", "catalog_meta_cache_statistics", "Hive Iceberg Paimon 메타데이터 캐시"]
}
---

Doris 4.1.4부터 일부 외부 메타데이터 캐시는 보유 메모리의 추정 사용량을 기준으로 제한할 수 있습니다. 이를 통해 대형 테이블, 단일 Catalog 또는 여러 Catalog의 메타데이터가 FE 힙을 계속 점유하는 것을 방지합니다.

다음과 같은 경우에 이 기능을 사용하세요:

- Hive 테이블에 파티션이 많아 대규모 파티션 프루닝 구조가 생성되는 경우.
- Iceberg 테이블 메타데이터, 스냅샷 또는 매니페스트의 크기가 큰 경우.
- Paimon 테이블 세대나 스냅샷이 보유하는 메타데이터와 파티션 프로젝션의 크기가 큰 경우.
- FE가 여러 Catalog를 처리하며 특정 Catalog가 메타데이터 캐시 메모리를 독점하지 못하게 해야 하는 경우.

:::caution
이 제한은 이 문서에 나열된 추정기가 지원되는 캐시 항목에만 적용됩니다. FE 힙의 엄격한 상한은 아닙니다. Catalog 클라이언트와 스레드 풀 같은 공유 런타임 인프라는 특정 캐시 항목 하나의 사용량으로 전부 산정되지 않습니다. 반면 인증 컨텍스트와 Iceberg FileIO 구성 또는 자격 증명 등 항목이 보유하는 크기가 제한된 소유자별 페이로드는 보수적으로 사용량에 반영됩니다. 추정기가 지원되지 않는 메타데이터 캐시는 이 할당량에 포함되지 않습니다.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Configuring FE, Catalog, and entry memory limits -->
## 빠른 시작 {#quick-start}

사전 요구 사항:

- 기존 Hive, Iceberg 또는 Paimon Catalog.
- FE 구성과 대상 Catalog를 변경할 수 있는 권한.
- 모든 FE에서 Doris 4.1.4 이상 실행.

### 1. FE 전체 제한 구성 {#1-configure-the-fe-wide-limit}

모든 FE의 `fe.conf`에 다음을 설정하세요:

```properties
external_meta_cache_max_weight = 10%
```

이제 해당 FE에서 관리되는 모든 외부 메타데이터 캐시의 총사용량은 JVM 최대 힙의 10%로 제한됩니다. 이 설정을 변경한 후에는 FE를 재시작하세요.

고정 크기를 사용할 수도 있습니다:

```properties
external_meta_cache_max_weight = 8GB
```

### 2. 개별 Catalog 제한 {#2-limit-one-catalog}

다음 예에서는 `iceberg_ctl`의 관리 대상 메타데이터 캐시가 사용하는 메모리의 합계를 4 GB로 제한합니다:

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB"
);
```

변경 후 Doris는 해당 Catalog의 초기화된 캐시 그룹을 지우고, 다음 액세스 시 새 구성으로 다시 생성합니다.

:::tip
`meta.cache.max-weight`는 FE 전체 제한이 구성되지 않아도 동작합니다. 이 경우 해당 Catalog만 제한하며, FE의 모든 Catalog에 걸친 총사용량은 제한하지 않습니다.
:::

### 3. 개별 캐시 항목 제한 {#3-limit-individual-cache-entries}

다음 예에서는 Catalog 제한과 개별 Iceberg 항목 제한을 설정합니다:

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.iceberg.table.max-weight" = "1GB",
    "meta.cache.iceberg.snapshot.max-weight" = "2GB",
    "meta.cache.iceberg.manifest.enable" = "true",
    "meta.cache.iceberg.manifest.max-weight" = "1GB"
);
```

`table`, `snapshot`, `manifest` 항목은 각각 1 GB, 2 GB, 1 GB로 제한됩니다. 이들의 총사용량은 Catalog 제한인 4 GB를 초과할 수 없으며, Catalog에는 FE 전체 제한도 계속 적용됩니다.

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Understanding how FE, Catalog, and entry limits combine -->
## 할당량 계층 구조 {#quota-hierarchy}

세 가지 수준의 메모리 제한을 사용할 수 있습니다:

| 수준 | 위치 | 설정 | 형식 | 기본값 | 범위 |
|---|---|---|---|---|---|
| FE | `fe.conf` | `external_meta_cache_max_weight` | 고정 크기 또는 JVM 최대 힙의 백분율 | 미설정(`0`), FE 전체 할당량 없음 | 현재 FE의 모든 관리 대상 외부 메타데이터 캐시 |
| Catalog | Catalog 속성 | `meta.cache.max-weight` | 고정 크기, 양수여야 함 | 미설정, Catalog 할당량 없음 | 현재 Catalog의 모든 관리 대상 항목 |
| 캐시 항목 | Catalog 속성 | `meta.cache.<engine>.<entry>.max-weight` | 고정 크기, `0`은 항목을 비활성화함 | 미설정, 상위 수준의 제한만 적용됨 | 특정 엔진의 캐시 항목 하나 |

실제 적용되는 제한은 구성된 모든 제한 중 최솟값입니다.

| FE 제한 | Catalog 제한 | 항목 제한 | 동작 |
|---|---|---|---|
| 미설정 | 미설정 | 미설정 | 메모리 사용량 계산이 비활성화되며 기존 항목 수 및 TTL 정책이 계속 사용됨 |
| 설정됨 | 미설정 | 미설정 | 모든 관리 대상 항목이 FE 할당량을 공유함 |
| 미설정 | 설정됨 | 미설정 | Catalog의 관리 대상 항목이 Catalog 할당량을 공유함 |
| 미설정 | 미설정 | 설정됨 | 해당 항목만 제한되며 FE 또는 Catalog의 합계 제한은 없음 |
| 설정됨 | 설정됨 | 설정됨 | 세 수준의 제한이 모두 적용되며 가장 엄격한 제한이 우선함 |

구성된 계층 구조는 다음 규칙을 충족해야 합니다:

- Catalog 제한은 FE 전체 제한을 초과할 수 없습니다.
- 항목 제한은 구성된 바로 위 상위 수준의 제한을 초과할 수 없습니다.
- 구성이 서로 다른 FE에서는 팔로워가 캐시 수용량을 자신의 로컬 FE 제한에 맞춰 추가로 제한합니다.

`CREATE CATALOG` 또는 `ALTER CATALOG`는 계층 구조가 유효하지 않으면 속성을 아무 알림 없이 무시하는 대신 실패합니다.

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Writing size and percentage values -->
## 값 형식 {#value-format}

고정 크기는 대소문자를 구분하지 않는 다음 이진 단위를 지원합니다:

```text
B, KB, MB, GB, TB, PB
```

예를 들어 `512MB`와 `4GB`를 사용할 수 있습니다.

고정 크기 값의 수량은 정수여야 합니다. 소수는 `12.5%`와 같은 백분율에서만 지원됩니다.

`external_meta_cache_max_weight`만 `10%` 또는 `12.5%`와 같은 백분율을 허용합니다. 백분율은 각 FE의 JVM 최대 힙을 기준으로 계산되므로 힙 크기가 서로 다른 FE에는 서로 다른 바이트 제한이 적용됩니다.

값을 영으로 설정했을 때의 의미는 수준마다 다릅니다:

| 설정 | `0`의 의미 |
|---|---|
| `external_meta_cache_max_weight` | 캐시를 비활성화하지 않고 FE 전체 할당량을 비활성화함 |
| `meta.cache.max-weight` | 유효하지 않음. Catalog 제한은 양수여야 함 |
| `meta.cache.<engine>.<entry>.max-weight` | 해당 캐시 항목을 비활성화함. 항목 수준의 재정의 설정은 유지됨 |

`0%`는 유효하지 않습니다. FE 전체 할당량을 비활성화하려면 백분율이 아닌 `0` 값을 사용하세요.

<!-- Knowledge Type: Capability Matrix -->
<!-- Applicable Scenarios: Choosing which cache entries to limit -->
## 지원되는 캐시 항목 {#supported-cache-entries}

이 버전에서는 다음 항목만 `max-weight`를 허용합니다:

| Catalog/엔진 | 항목 | 속성 | 캐시되는 데이터 |
|---|---|---|---|
| Hive | `partition_values` | `meta.cache.hive.partition_values.max-weight` | 파티션 이름, 값, 프루닝 인덱스 및 정렬된 범위 |
| Iceberg | `table` | `meta.cache.iceberg.table.max-weight` | Iceberg 테이블 메타데이터 및 보유 중인 메타데이터 세대 |
| Iceberg | `snapshot` | `meta.cache.iceberg.snapshot.max-weight` | 스냅샷, 파티션 프로젝션 및 이들이 보유하는 테이블 세대 |
| Iceberg | `manifest` | `meta.cache.iceberg.manifest.max-weight` | 파싱된 DataFile 및 DeleteFile 목록. 이 항목은 기본적으로 비활성화되어 있으며 `enable=true`도 필요함 |
| Paimon | `table` | `meta.cache.paimon.table.max-weight` | 보유 중인 Paimon 테이블 메타데이터 및 해당 세대 |
| Paimon | `snapshot` | `meta.cache.paimon.snapshot.max-weight` | 스냅샷, 스키마 세대 및 파티션 프로젝션 |

다음과 같은 일반적인 항목은 계속 항목 수를 기준으로 제한되며 `max-weight`를 허용하지 않습니다:

- Hive의 `schema`, `partition`, `file`.
- Iceberg의 `schema`, `view`.
- Paimon의 `schema`.
- 기존 Hudi, MaxCompute 및 Doris Catalog 캐시 항목.

지원되지 않는 항목에 `max-weight`를 설정하면 Catalog 생성 또는 변경이 실패합니다. 예를 들어 다음 구성은 유효하지 않습니다:

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.hive.file.max-weight" = "1GB"
);
```

:::note
HMS Catalog는 Hive, Hudi, Iceberg 메타데이터 캐시로 라우팅할 수 있습니다. Iceberg 테이블이 포함되어 있으면 같은 HMS Catalog에서 `meta.cache.iceberg.table.max-weight`, `meta.cache.iceberg.snapshot.max-weight`, `meta.cache.iceberg.manifest.max-weight`를 사용할 수 있습니다.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Typical Hive, Iceberg, and Paimon limit configurations -->
## 예시 {#examples}

### Catalog 제한만 사용 {#use-only-catalog-limits}

FE 전체 제한이 없을 때는 Catalog를 각각 독립적으로 격리할 수 있습니다:

```sql
ALTER CATALOG hive_prod SET PROPERTIES (
    "meta.cache.max-weight" = "6GB"
);

ALTER CATALOG iceberg_ad_hoc SET PROPERTIES (
    "meta.cache.max-weight" = "2GB"
);
```

각 Catalog는 각각 6 GB와 2 GB로 제한되지만, FE에서 이들의 총사용량에 적용되는 공통 제한은 없습니다.

### 대규모 Hive 파티션 구조 제한 {#limit-large-hive-partition-structures}

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.partition_values.max-weight" = "3GB"
);
```

이는 주로 파티션이 많은 Hive 테이블에 대해 생성되는 파티션 프루닝 구조를 제한합니다. Hive 파일 목록 캐시는 이 할당량에 포함되지 않습니다.

### Paimon 테이블 세대 및 스냅샷 제한 {#limit-paimon-table-generations-and-snapshots}

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "2GB",
    "meta.cache.paimon.table.max-weight" = "512MB",
    "meta.cache.paimon.snapshot.max-weight" = "1536MB"
);
```

Paimon은 `table` 및 `snapshot` 항목 모두에 대해 독립적인 메모리 제한을 지원합니다. 이 예에서는 Catalog 제한인 2 GB 내에서 보유 중인 테이블 세대에 최대 512 MB, 스냅샷 프로젝션에 최대 1536 MB를 예약합니다.

### 기존 캐시 속성과의 호환성 {#compatibility-with-existing-cache-properties}

기존 Catalog와의 호환성을 위해 Iceberg와 Paimon의 `table.enable`, `table.ttl-second`, `table.capacity` 값은 해당 스냅샷 항목의 속성을 명시적으로 설정하지 않았을 때 그 항목의 기본값으로도 사용됩니다. 예를 들면 다음과 같습니다:

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.paimon.table.ttl-second" = "600",
    "meta.cache.paimon.snapshot.max-weight" = "1536MB"
);
```

여기서 `table.ttl-second`는 Paimon 테이블 객체 캐시와 스냅샷 캐시 모두의 TTL을 제어하며, `snapshot.max-weight`는 스냅샷 캐시만 제한합니다.

`max-weight`에는 호환성을 위한 매핑이 적용되지 않습니다. 추정기가 지원되는 실제 항목 이름을 사용하세요:

- `meta.cache.iceberg.table.max-weight`: Iceberg 테이블 객체용.
- `meta.cache.iceberg.snapshot.max-weight`: Iceberg 스냅샷용.
- `meta.cache.paimon.table.max-weight`: Paimon 테이블 세대용.
- `meta.cache.paimon.snapshot.max-weight`: Paimon 스냅샷용.

### 메모리 정책과 TTL 정책 함께 사용 {#combine-memory-and-ttl-policies}

메모리 제한은 `enable`, `ttl-second`, `capacity`와 함께 사용할 수 있습니다:

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.iceberg.snapshot.enable" = "true",
    "meta.cache.iceberg.snapshot.ttl-second" = "1800",
    "meta.cache.iceberg.snapshot.capacity" = "1000",
    "meta.cache.iceberg.snapshot.max-weight" = "2GB"
);
```

`max-weight`가 활성화되면 메모리 가중치를 기준으로 캐시 축출이 결정되며, `capacity`가 최대 항목 수 제한으로 동시에 적용되지는 않습니다. 단, `capacity=0`이면 여전히 캐시가 비활성화되므로 메모리 제한을 사용할 때는 양수로 유지하세요.

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Understanding admission rejection and its effect on queries -->
## 제한에 도달했을 때의 동작 {#behavior-when-a-limit-is-reached}

캐시 미스가 발생하면 Doris는 다음과 같이 동작합니다:

1. 외부 소스에서 메타데이터를 로드합니다.
2. 후보 객체를 고정하거나 구체화하고 보유 메모리 사용량을 추정합니다.
3. FE, Catalog 및 항목의 할당량을 원자적으로 확인합니다.
4. 할당량이 부족하면 같은 항목에서 사용 빈도가 낮은 데이터를 축출하고 다시 시도합니다. 로컬 축출로 필요한 예약량을 확보할 수 없으면 Doris는 형제 항목에서 피어 회수를 예약합니다(FE 전체에서 용량이 부족한 경우에는 다른 Catalog에서도 회수합니다).
5. 여전히 캐시 수용에 실패하면 로드한 객체를 캐시에 저장하지 않고 현재 요청에 반환합니다.

따라서 사용 가능한 할당량보다 큰 새 객체가 들어오더라도 일반적으로 캐시 할당량 때문에 쿼리가 실패하지는 않습니다. 이 객체는 캐시에 보관되지 않으므로 이후 액세스에서 다시 로드되어 쿼리 계획 지연 시간이 늘어날 수 있습니다.

Doris가 신뢰할 수 있는 완전한 추정치를 산출할 수 없는 경우에도 객체의 사용량을 과소 산정하는 대신 캐싱을 건너뜁니다. 예를 들어 보유 중인 테이블 형태가 지원되지 않거나, Iceberg 메타데이터가 여전히 지연 로딩 상태이거나, 준비에 실패하거나, 사용량 계산 작업 예산을 초과한 경우가 이에 해당합니다. 추정기는 리플렉션 기반의 범용 객체 그래프 순회나 컨테이너 샘플링을 수행하지 않습니다. Iceberg는 스냅샷 메타데이터가 이미 로드되었는지 확인하는 데만 실패 시 차단 방식의 비공개 필드 검사 하나를 사용하여 추정 중 IO를 방지합니다.

:::note
로컬 축출은 동기식입니다. 피어 회수는 비동기식으로 가능한 범위에서 수행되므로, 형제 항목에서 이후의 캐시 수용을 위해 메모리를 회수하는 동안 현재 캐시 미스의 결과는 캐시에 저장되지 않은 채 반환될 수 있습니다. 특정 항목이 공유 FE 또는 Catalog 할당량을 독점하지 못하게 해야 한다면 항목 수준의 제한을 구성하세요.
:::

예약된 새로고침의 추정치가 불완전하거나 예산이 부족하여 캐시에 수용할 수 없으면 Doris는 정상 상태가 확인된 이전 캐시 세대를 유지합니다. 거부된 새로고침은 반영되지 않습니다.

:::caution
할당량 검사는 객체를 로드하고 준비한 후 캐시에 수용할 때 수행됩니다. Doris는 외부 소스에 액세스하기 전에 힙을 예약하지 않습니다. 따라서 원격 로드가 실패하거나 유난히 큰 객체 하나가 생성 완료 전에 FE 힙을 소진하면 현재 요청이 여전히 실패할 수 있습니다. 이 기능은 로드 성공 후 보유하는 메모리를 제한하며, 단일 메타데이터 로드의 OOM을 방지하는 기능은 아닙니다.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Applying limit changes without restarting queries -->
## 구성 적용 및 캐시 새로고침 {#applying-configuration-and-refreshing-caches}

- `external_meta_cache_max_weight`를 변경한 후에는 FE를 재시작하세요.
- `meta.cache.max-weight` 또는 `meta.cache.<engine>.<entry>.*`를 포함한 Catalog 속성을 변경하면 Catalog 실행 컨텍스트가 재설정되고, 해당 Catalog를 통해 라우팅되는 모든 메타데이터 캐시 엔진의 초기화된 항목이 지워집니다. 다음 액세스 시 새 컨텍스트와 구성으로 다시 생성됩니다.
- 이미 실행 중인 쿼리는 로드된 객체를 계속 사용할 수 있으며, 이후 액세스에는 새 구성이 사용됩니다.

메모리 제한은 객체를 캐시에 보관할지를 제어합니다. 외부 메타데이터를 변경하지 않으며 `REFRESH CATALOG`, TTL 또는 메타데이터 이벤트 동기화를 대체하지 않습니다.

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Troubleshooting / Performance tuning of FE heap usage -->
## 메모리 압박 모니터링 및 문제 해결 {#monitoring-and-troubleshooting-memory-pressure}

시스템 테이블 [`catalog_meta_cache_statistics`](../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics)은 FE, Catalog, 메타데이터 캐시 엔진, 캐시 항목의 각 조합에 대해 한 행을 반환합니다. 다음 열은 메모리 관리 상태를 나타냅니다:

| 열 | 의미 | 시간 기준 |
|---|---|---|
| `MAX_WEIGHT` | 항목에 실제로 적용되는 메모리 제한으로, 단위는 바이트입니다. `-1`은 FE, Catalog, 항목 수준의 제한 중 어느 것도 해당 항목에 적용되지 않음을 뜻합니다. | 구성값 |
| `ESTIMATED_WEIGHT` | 항목이 현재 예약한 추정 바이트 수. | 쿼리 시점의 게이지 값 |
| `WEIGHT_REJECT_COUNT` | 예산 부족 또는 불완전한 추정으로 캐시 수용이 거부된 횟수. | 현재 캐시 인스턴스의 누적값 |
| `LAST_WEIGHT_REJECT_REASON` | 가장 최근에 거부된 이유. | 최신 값 |

Catalog 속성 변경이나 FE 재시작으로 캐시 그룹이 다시 생성되면 누적 카운터는 영부터 다시 집계됩니다. 이 테이블은 이력을 보관하지 않으므로 추세가 필요하면 주기적으로 샘플링하세요. `max_weight >= 0`인 행은 메모리 관리 대상 항목이며, 제한값 자체는 `fe.conf`와 Catalog 속성에서 가져옵니다.

FE 힙 사용량이 높고 외부 메타데이터 캐시가 원인으로 의심되면 다음 단계를 따르세요.

### 1. 관리 대상 캐시가 메모리 압박의 원인인지 확인 {#1-check-whether-managed-caches-contribute-to-the-pressure}

```sql
SELECT fe_host,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host
ORDER BY fe_host;
```

예약량 합계를 구성된 `external_meta_cache_max_weight` 및 FE 힙과 비교하세요. 이 값은 캐시에 보관된 메모리의 추정 가중치이며 FE 힙 전체 사용량은 아닙니다. 로드 중 임시 메모리, 항목 수로 제한되는 항목, 커넥터 SDK 캐시는 포함되지 않습니다. 예약량이 낮은데 FE 힙 사용량이 계속 높다면 6단계로 이동하세요.

### 2. 원인이 되는 Catalog 찾기 {#2-locate-the-responsible-catalogs}

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

각 Catalog의 사용량을 해당 `meta.cache.max-weight`와 비교하세요. 예약량이 제한에 가깝거나 특정 FE에서 다른 FE보다 훨씬 큰 Catalog를 찾으세요.

### 3. 캐시 항목별 세부 확인 {#3-drill-down-to-cache-entries}

```sql
SELECT engine_name, entry_name,
       estimated_weight, max_weight,
       weight_reject_count, last_weight_reject_reason
FROM information_schema.catalog_meta_cache_statistics
WHERE fe_host = '<fe_host>'
  AND catalog_name = '<catalog_name>'
  AND max_weight >= 0
ORDER BY estimated_weight DESC;
```

`estimated_weight`가 `max_weight`에 가까워지는 항목은 Catalog 사용량의 큰 부분을 차지합니다. `weight_reject_count`가 증가하면 할당량이 부족하다는 의미입니다. 객체를 로드하고 사용 빈도가 낮은 데이터를 축출했는데도 객체가 캐시에 보관되지 않아 이후 액세스에서 다시 로드되는 상황입니다. `last_weight_reject_reason`은 가장 최근 거부의 원인이 예산 부족인지 불완전한 추정인지 알려줍니다. 불완전한 추정은 할당량 문제가 아니며, 해당 객체는 캐시에 저장되지 않은 상태로 제공됩니다.

### 4. 제어 방법 선택 {#4-choose-a-control}

| 목표 | 설정 | 적용 시점 |
|---|---|---|
| 특정 FE의 총사용량 제한 | `external_meta_cache_max_weight`를 `fe.conf`에서 설정 | FE 재시작 후 |
| 특정 Catalog 격리 | `meta.cache.max-weight` | `ALTER CATALOG` 후 다음 액세스 시 |
| 지원되는 특정 항목의 사용량 독점 방지 | `meta.cache.<engine>.<entry>.max-weight` | `ALTER CATALOG` 후 다음 액세스 시 |
| 캐싱보다 최신 메타데이터 우선 | `meta.cache.<engine>.<entry>.ttl-second` 값을 낮추거나 `meta.cache.<engine>.<entry>.enable`을 `false`로 설정 | `ALTER CATALOG` 후 다음 액세스 시 |

### 5. 변경 후의 동작 {#5-what-happens-after-the-change}

- Catalog 속성을 변경하면 해당 Catalog의 초기화된 캐시 그룹이 지워지고 필요할 때 다시 생성됩니다. 시스템 테이블의 카운터는 영부터 다시 집계됩니다.
- 이미 실행 중인 쿼리는 로드된 객체를 계속 보유합니다.
- 할당량을 낮추면 캐시 미스가 증가합니다. 워킹 세트가 다시 제한 안에 들어올 때까지 외부 메타데이터 로드가 늘고 계획 지연 시간이 길어질 수 있습니다.

### 6. 이 메커니즘으로 해결할 수 없는 문제 {#6-what-this-mechanism-cannot-solve}

계산된 가중치가 낮은데 FE 힙 사용량이 계속 높다면 메모리 압박의 원인은 할당량 밖에 있습니다. `max-weight`를 더 낮춰도 도움이 되지 않습니다. 대신 다음을 조사하세요:

- Hive의 `schema`, `partition`, `file` 같은 항목 수로 제한되는 항목. 해당 항목의 `capacity`와 `ttl-second`를 조정하세요.
- 실행 중인 쿼리가 여전히 참조하는 메타데이터 객체.
- 커넥터 SDK 캐시. 예를 들어 `io.manifest.cache-enabled`로 제어되는 Iceberg 매니페스트 캐시나 Paimon의 `CachingCatalog`가 있으며, 후자는 `paimon.cache-enabled`로 제어됩니다.
- 캐시 수용 전에 발생하는, 단일 대규모 메타데이터 로드의 로딩 및 구체화 과정에서의 메모리 사용량 급증.

### 증상별 참고 사항 {#symptom-reference}

| 증상 | 쿼리 | 해석 | 조치 |
|---|---|---|---|
| FE 힙 사용량이 높고 예약량 합계가 `external_meta_cache_max_weight`에 가까움 | 1단계 | 관리 대상 캐시가 FE 전체 상한에 도달함 | FE 제한 또는 가장 큰 Catalog의 제한을 낮추거나 FE에 더 많은 힙을 할당 |
| FE 힙 사용량이 높지만 예약량 합계는 낮음 | 1단계 | 메모리 압박의 원인이 할당량 밖에 있음 | 6단계를 따름 |
| 특정 Catalog의 사용량이 해당 `meta.cache.max-weight`에 가깝거나 특정 FE에서 훨씬 큼 | 2단계 | 워킹 세트가 할당된 몫을 초과함 | 힙에 여유가 있으면 제한을 높이거나 해당 Catalog 내에 항목 제한을 추가 |
| `weight_reject_count`가 계속 증가하며 원인이 예산 부족임 | 3단계 | 객체가 로드되지만 캐시에 보관되지 않아 나중에 다시 로드됨 | 할당량을 높이거나 경쟁하는 다른 항목의 제한을 낮춤 |
| `weight_reject_count`가 계속 증가하며 원인이 불완전한 추정임 | 3단계 | 객체를 신뢰성 있게 추정할 수 없어 캐시에 저장되지 않음 | 할당량을 변경해도 도움이 되지 않음. 쿼리는 캐싱 없이 계속 성공함 |
| `estimated_weight`가 `max_weight`에 머물고 적중률이 낮음 | 3단계 | 항목이 할당량 내에서 빈번하게 축출되고 다시 로드됨 | 항목 제한을 높이거나 TTL을 줄여 워킹 세트를 축소 |

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Limits of estimated memory accounting -->
## 유의 사항 {#caveats}

- `max-weight`는 캐시에 보관되는 메모리의 추정 사용량을 기준으로 한 수용 예산입니다. 유형별 공식은 오프라인에서 보정하고 올림 처리한 구조적 상수와 로더 실행 시 수집한 페이로드 카운터를 사용하며, 실행 중인 JVM이나 타사 SDK의 정확한 메모리 배치를 모델링하지는 않습니다. 결과는 운영체제 RSS가 아니며 FE 힙 및 GC 모니터링을 대체하지 않습니다.
- 공유 런타임 인프라는 개별 항목의 사용량으로 전부 산정되지 않지만, 항목이 보유하는 크기가 제한된 소유자별 인증 컨텍스트, FileIO 구성, 스토리지 자격 증명 및 변환 페이로드는 보수적으로 포함됩니다.
- 메모리 가중치로 제한되는 항목은 값에 소프트 참조를 사용합니다. 예약 레코드는 키, 세대 및 가중치를 보관하지만 캐시된 값에 대한 강한 참조는 보관하지 않습니다. 힙에 여유가 부족하면 JVM은 TTL이 만료되거나 할당량이 가득 차기 전에 값을 회수할 수 있습니다. Doris는 해당 예약을 해제하고 이후 액세스에서 값을 다시 로드합니다.
- 큰 객체는 로드, 새로고침 또는 교체 시에만 추정됩니다. 산출된 가중치는 반영된 세대와 함께 보관되므로 캐시 적중 시 객체 내용을 다시 스캔하지 않습니다.
- Iceberg 테이블이나 스냅샷을 처음 캐시에 수용할 때 현재 스냅샷의 매니페스트 목록을 구체화할 수 있으며, 이로 인해 초기 로드 지연 시간이 늘어날 수 있습니다.
- 새로 지정한 DDL 속성에서 엔진 이름, 항목 이름 또는 옵션의 철자가 틀리면 엄격하게 거부합니다. 반면 런타임에 파싱할 수 없는 기존 영속화 속성은 경고를 남기고 무시하여 업그레이드된 Catalog가 계속 초기화될 수 있도록 합니다.
- Iceberg Catalog에 Doris 메모리 관리가 활성화되어 있으면 Iceberg SDK의 매니페스트 콘텐츠 캐시는 Doris 할당량 밖에 있으므로 자동으로 활성화되지 않습니다. `io.manifest.cache-enabled`를 명시적으로 설정하면 이 설정이 우선 적용됩니다.
- Paimon Catalog에 Doris 메모리 관리가 활성화되어 있으면 크기에 제한이 없는 두 번째 메타데이터 캐시가 생기지 않도록 Paimon SDK 수준의 `CachingCatalog`가 기본적으로 비활성화됩니다. `paimon.cache-enabled`를 명시적으로 설정하면 이 설정이 우선 적용됩니다.
- Iceberg 또는 Paimon을 업그레이드한 후에는 FE SDK JAR을 개별적으로 교체하지 말고 Doris 릴리스에 포함된 SDK 버전을 사용하세요.

<!-- Knowledge Type: Architecture Decision -->
<!-- Applicable Scenarios: Planning metadata-cache memory across Catalogs -->
## 권장 사항 {#best-practices}

1. FE 전체 제한부터 설정하여 Catalog 전체의 총사용량이 제한 없이 늘어나지 않도록 하세요.
2. FE를 공유하는 대규모 프로덕션 Catalog에 Catalog 제한을 추가하세요.
3. 사용량의 큰 부분을 차지하는 항목에만 항목 수준의 제한을 추가하세요. 모든 항목에 개별 설정이 필요한 것은 아닙니다.
4. JVM 힙 대부분을 외부 메타데이터 캐시에 할당하지 말고 쿼리 계획과 기타 FE 캐시를 위한 힙을 충분히 확보하세요.
5. 캐시 수용 거부 후 같은 객체가 반복적으로 다시 로드되면 할당량을 높이거나 경쟁하는 다른 항목의 제한을 낮추세요.
6. FE 힙 크기가 서로 다르면 백분율을 사용하고, 모든 FE에 같은 바이트 제한을 적용해야 한다면 고정 크기를 사용하세요.
