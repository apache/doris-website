---
{
    "title": "외부 메타데이터 캐시 메모리 관리",
    "language": "ko",
    "description": "FE, Catalog 및 항목별 메모리 할당량으로 Hive, Iceberg, Paimon의 외부 메타데이터 캐시가 사용하는 FE 힙을 제한합니다.",
    "keywords": ["외부 메타데이터 캐시", "meta.cache.max-weight", "external_meta_cache_max_weight", "FE 메모리", "catalog_meta_cache_statistics", "Hive Iceberg Paimon 메타데이터 캐시"]
}
---

Doris 4.1.4부터 관리 대상 외부 메타데이터 캐시가 보관하는 메모리의 추정 사용량을 기준으로 캐시를 제한할 수 있습니다. 이를 통해 대규모 테이블, 단일 Catalog 또는 여러 Catalog의 메타데이터가 FE 힙을 계속 소비하는 것을 방지할 수 있습니다.

다음과 같은 경우에 이 기능을 사용하세요.

- Hive 테이블에 파티션이나 파일이 많아 파티션 구조와 파일 목록 구조가 커지는 경우
- Iceberg 테이블 메타데이터, 파티션 프로젝션 또는 매니페스트가 큰 경우
- Paimon 파티션 프로젝션이 큰 경우
- 하나의 FE가 여러 Catalog를 처리하며, 특정 Catalog가 메타데이터 캐시 메모리를 독점하지 않도록 해야 하는 경우

:::tip
관리 대상 캐시 항목의 종류와 이름은 Doris 4.1.x/4.2.x와 현재 버전에서 다릅니다. 4.1.x 또는 4.2.x 클러스터를 사용하는 경우 이 페이지의 4.x 버전으로 전환하세요.
:::

:::caution
이 한도는 이 문서에 나열된 관리 대상 메타데이터 캐시에만 적용됩니다. FE 힙 전체에 적용되는 엄격한 한도는 아닙니다. 메타데이터를 불러오는 동안 사용하는 임시 메모리, 실행 중인 쿼리가 여전히 참조하는 메타데이터 객체, 커넥터 SDK 캐시, Catalog 클라이언트 및 스레드 풀과 같은 공유 런타임 인프라는 할당량에 포함되지 않습니다.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Configuring FE, Catalog, and entry memory limits -->
## 빠른 시작 {#quick-start}

사전 요구 사항:

- Hive, Iceberg 또는 Paimon과 같은 기존 외부 Catalog
- FE 구성 및 대상 Catalog를 변경할 수 있는 권한
- 모든 FE에 Doris 4.1.4 이상 설치

### 1. FE 전체 한도 구성 {#1-configure-the-fe-wide-limit}

모든 FE의 `fe.conf`에 다음을 설정합니다.

```properties
external_meta_cache_max_weight = 10%
```

그러면 해당 FE의 모든 관리 대상 외부 메타데이터 캐시는 총합으로 JVM 최대 힙의 10%까지 사용할 수 있습니다. 이 설정을 변경한 후에는 FE를 재시작하세요.

고정 크기를 사용할 수도 있습니다.

```properties
external_meta_cache_max_weight = 8GB
```

### 2. 단일 Catalog 제한 {#2-limit-one-catalog}

다음 예제는 `hive_ctl`의 관리 대상 메타데이터 캐시를 총 4 GB로 제한합니다.

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB"
);
```

변경 후 Doris는 이 Catalog에서 초기화된 캐시를 지우고, 다음 접근 시 새 구성으로 다시 생성합니다.

:::tip
`meta.cache.max-weight`는 FE 전체 한도를 구성하지 않아도 작동합니다. 이 경우 해당 Catalog만 제한하며, FE의 모든 Catalog에 걸친 총사용량은 제한하지 않습니다.
:::

### 3. 개별 캐시 항목 제한 {#3-limit-individual-cache-entries}

다음 예제는 Catalog 한도와 개별 Hive 항목 한도를 설정합니다.

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.file.max-weight" = "2GB",
    "meta.cache.hive.partition_view.max-weight" = "1GB"
);
```

`file` 및 `partition_view` 항목은 각각 2 GB와 1 GB로 제한됩니다. 두 항목의 사용량 합계는 Catalog 한도인 4 GB를 초과할 수 없으며, Catalog에는 FE 전체 한도도 계속 적용됩니다.

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Understanding how FE, Catalog, and entry limits combine -->
## 할당량 계층 구조 {#quota-hierarchy}

메모리 한도는 세 단계로 설정할 수 있습니다.

| 단계 | 설정 위치 | 설정 항목 | 형식 | 기본값 | 적용 범위 |
|---|---|---|---|---|---|
| FE | `fe.conf` | `external_meta_cache_max_weight` | 고정 크기 또는 JVM 최대 힙의 백분율 | `0`; FE 전체 할당량 없음 | 현재 FE의 모든 관리 대상 외부 메타데이터 캐시 |
| Catalog | Catalog 속성 | `meta.cache.max-weight` | 고정 크기; 양수여야 함 | 설정되지 않음; Catalog 할당량 없음 | 현재 Catalog의 모든 관리 대상 항목 |
| 캐시 항목 | Catalog 속성 | `meta.cache.<engine>.<entry>.max-weight` | 고정 크기; 양수여야 함 | 설정되지 않음; 상위 한도만 적용됨 | 하나의 캐시 항목 또는 해당 항목을 공유하는 캐시 그룹 |

항목의 유효 한도는 해당 항목과 그 상위에 구성된 모든 한도 중 최솟값입니다.

| FE 한도 | Catalog 한도 | 항목 한도 | 동작 |
|---|---|---|---|
| 설정되지 않음 | 설정되지 않음 | 설정되지 않음 | 메모리 사용량 집계가 비활성화되며 개수 및 TTL 정책만 적용됨 |
| 설정됨 | 설정되지 않음 | 설정되지 않음 | FE의 모든 관리 대상 항목이 FE 할당량을 공유함 |
| 설정되지 않음 | 설정됨 | 설정되지 않음 | Catalog의 모든 관리 대상 항목이 Catalog 할당량을 공유함 |
| 설정되지 않음 | 설정되지 않음 | 설정됨 | 해당 항목만 제한됨; FE 또는 Catalog 전체에 적용되는 한도는 없음 |
| 설정됨 | 설정됨 | 설정됨 | 세 단계가 모두 적용되며 가장 엄격한 한도가 적용됨 |

유효성 검사 규칙:

- 항목 한도는 같은 Catalog의 Catalog 한도를 초과할 수 없습니다. 이 경우 `CREATE CATALOG` 또는 `ALTER CATALOG`가 `meta.cache.<engine>.<entry>.max-weight can not exceed meta.cache.max-weight` 오류와 함께 실패합니다.
- 각 FE는 자체 JVM 힙을 기준으로 `external_meta_cache_max_weight`를 계산합니다. FE의 힙 크기가 서로 다르면 같은 백분율을 설정해도 바이트 단위 한도가 달라집니다.

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Writing size and percentage values -->
## 값 형식 {#value-format}

고정 크기는 대소문자를 구분하지 않는 다음 이진 단위를 지원합니다.

```text
B, KB, MB, GB, TB, PB
```

예를 들어 `512MB`와 `4GB`를 사용할 수 있습니다. 고정 크기 값은 정수여야 하며 음수일 수 없습니다.

`external_meta_cache_max_weight`만 `10%` 또는 `12.5%`와 같은 백분율을 허용합니다. 백분율은 각 FE의 JVM 최대 힙을 기준으로 계산됩니다.

영은 설정 단계에 따라 의미가 다릅니다.

| 설정 항목 | `0`의 의미 |
|---|---|
| `external_meta_cache_max_weight` | 캐시를 비활성화하지 않고 FE 전체 할당량을 비활성화함 |
| `meta.cache.max-weight` | 유효하지 않음; Catalog 한도는 양수여야 함 |
| `meta.cache.<engine>.<entry>.max-weight` | 유효하지 않음; 항목 한도는 양수여야 함 |

`0%`는 유효하지 않습니다. FE 전체 할당량을 비활성화하려면 백분율이 아닌 `0`을 사용하세요. 캐시 항목을 비활성화하려면 해당 항목의 `enable`을 `false`로 설정하거나 `ttl-second`를 `0`으로 설정하세요. `max-weight`는 이 용도로 사용할 수 없습니다.

<!-- Knowledge Type: Capability Matrix -->
<!-- Applicable Scenarios: Choosing which cache entries to limit -->
## 관리 대상 캐시 항목 {#managed-cache-entries}

모든 관리 대상 메타데이터 캐시에는 크기 추정기가 있습니다. FE 전체 한도, Catalog 한도 또는 항목 한도 중 하나라도 항목에 적용되면 해당 항목은 메모리 사용량을 기준으로 관리됩니다. 개수만으로 관리되는 별도의 항목 그룹은 없습니다. 적용되는 한도가 없으면 모든 항목은 자체 `enable`, `ttl-second`, `capacity` 설정만 사용합니다.

캐시 항목은 `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity,max-weight}`로 구성합니다. 아래 표에는 `<engine>` 및 `<entry>` 토큰, `ENTRY_NAME`에 해당하는 이름이 표시되는 `information_schema.catalog_meta_cache_statistics`, 그리고 기본값이 나와 있습니다. 나열된 `<entry>` 토큰만 `max-weight`를 허용합니다. 알려진 엔진 아래에 그 밖의 `max-weight` 키를 지정하면 `CREATE CATALOG` 또는 `ALTER CATALOG`가 `Unknown metadata cache weight property` 오류와 함께 실패합니다.

### 모든 외부 Catalog의 테이블 스키마 {#table-schema-of-every-external-catalog}

| `<engine>` | `<entry>` | `ENTRY_NAME` | 캐시되는 데이터 | 기본 활성화 여부 / TTL / 용량 |
|---|---|---|---|---|
| `default` | `schema` | `schema` | 모든 Catalog 유형의 외부 테이블 열 스키마 | `true` / `external_cache_expire_time_seconds_after_access` (86400 s) / `max_external_schema_cache_num` (10000) |

기존 Catalog 속성인 `schema.cache.ttl-second`는 `meta.cache.default.schema.ttl-second`에 매핑됩니다.

### Hive {#hive}

`hive` 엔진은 Hive Catalog와 Hudi Catalog의 Hive Metastore 캐시에서 사용됩니다.

| `<entry>` | `ENTRY_NAME` | 캐시되는 데이터 | 기본 활성화 여부 / TTL / 용량 |
|---|---|---|---|
| `table` | `hive-table` | Hive Metastore의 테이블 객체 | `true` / 86400 s / 10000 |
| `partition_names` | `hive-partition-names` | 테이블의 파티션 이름 목록 | `true` / 86400 s / 10000 |
| `partition` | `hive-partition` | 위치 및 입력 형식을 포함한 파티션 객체 | `true` / 86400 s / 100000 |
| `column_stats` | `hive-column-stats` | Hive Metastore의 열 통계 | `true` / 86400 s / 10000 |
| `file` | `hive-file` | 테이블 또는 파티션의 파일 목록 | `true` / 86400 s / 10000 |
| `partition_view` | `hive-partition-view` | 파티션 이름에서 파생된 파티션 프루닝 구조 | `true` / 86400 s / 1000 |

기존 속성은 다음과 같이 통합 키에 매핑됩니다. `schema.cache.ttl-second`는 `meta.cache.hive.table.ttl-second`에, `partition.cache.ttl-second`는 `meta.cache.hive.partition_names.ttl-second`에, `file.meta.cache.ttl-second`는 `meta.cache.hive.file.ttl-second`에 매핑됩니다.

Iceberg 테이블이 포함된 Hive Metastore Catalog는 아래의 `iceberg` 항목도 사용합니다.

### Iceberg {#iceberg}

| `<entry>` | `ENTRY_NAME` | 캐시되는 데이터 | 기본 활성화 여부 / TTL / 용량 |
|---|---|---|---|
| `table` | `iceberg-table` | 불러온 Iceberg 테이블 메타데이터 | `true` / `meta.cache.iceberg.table.ttl-second` (86400 s) / 1000 |
| `partition` | `iceberg-partition` | 테이블 스냅샷의 원시 파티션 데이터 | `true` / `table`과 동일 / 1000 |
| `manifest` | `iceberg-manifest` | 파싱된 매니페스트 내용; `meta.cache.iceberg.manifest.enable`이 `true`인 경우에만 스캔 계획 수립에 사용됨(기본값 `false`) | `true` / 만료 없음 / 100000 |
| `partition_view` | `iceberg.mvcc-partition-view`, `iceberg.list-partitions-view` | 하나의 한도를 공유하는 두 파생 파티션 프로젝션 | `true` / 86400 s / 1000 |

다음 Iceberg 캐시에는 `<entry>` 토큰이 없습니다. 이 캐시는 Catalog 및 FE 전체 한도를 따르며, TTL은 `meta.cache.iceberg.table.ttl-second`에서 가져옵니다.

| `ENTRY_NAME` | 캐시되는 데이터 |
|---|---|
| `iceberg-latest-snapshot` | 테이블의 최신 스냅샷 ID |
| `iceberg-format` | 테이블에서 추론한 파일 형식 |
| `iceberg-comment` | 테이블 주석; vended credentials를 사용하는 REST Catalog에만 생성됨 |
| `iceberg-equality-delete-field-ids` | 스냅샷의 동등성 삭제 필드 ID |

:::note
`iceberg.rest.session`이 `user`이면 공유 캐시가 사용자별 권한 검사를 우회할 수 있으므로 `table`, `partition`, `partition_view`, latest-snapshot 및 format 캐시가 생성되지 않습니다. vended credentials를 사용하는 REST Catalog 역시 `table` 캐시를 생성하지 않습니다.
:::

### Paimon {#paimon}

| `<entry>` | `ENTRY_NAME` | 캐시되는 데이터 | 기본 활성화 여부 / TTL / 용량 |
|---|---|---|---|
| `partition_view` | `paimon.partition-view` | 테이블 스냅샷에서 파생된 파티션 프로젝션 | `true` / 86400 s / 1000 |

다음 Paimon 캐시에는 `<entry>` 토큰이 없으며 Catalog 및 FE 전체 한도만 따릅니다.

| `ENTRY_NAME` | 캐시되는 데이터 | TTL |
|---|---|---|
| `paimon-schema-at` | 특정 스냅샷 시점의 테이블 스키마 | 만료 없음; 용량 10000 |
| `paimon-latest-snapshot` | 테이블의 최신 스냅샷 ID | `meta.cache.paimon.table.ttl-second` (86400 s); 용량 1000 |

`meta.cache.paimon.table.ttl-second`는 Paimon 테이블 스키마 캐시의 TTL도 제어합니다.

### Hudi {#hudi}

Hudi Catalog는 캐시를 `hudi` 엔진 아래에 표시하지만, 실제로는 Hive Metastore 캐시이며 `meta.cache.hive.<entry>.*` 키로 구성합니다. 해당 항목은 `table`, `partition_names`, `partition`, `column_stats`입니다.

### MaxCompute {#maxcompute}

| `<engine>` | `<entry>` | `ENTRY_NAME` | 캐시되는 데이터 | 기본 활성화 여부 / TTL / 용량 |
|---|---|---|---|---|
| `max_compute` | `partition` | `max-compute-partition` | 테이블의 파티션 목록 | `true` / 600 s / 10000 |

### ADBC {#adbc}

| `<engine>` | `<entry>` | `ENTRY_NAME` | 캐시되는 데이터 | 기본 활성화 여부 / TTL / 용량 |
|---|---|---|---|---|
| `adbc` | `metadata` | `adbc-namespaces`, `adbc-table-names`, `adbc-table-schema` | 네임스페이스, 테이블 이름 및 테이블 스키마; 세 캐시가 하나의 한도를 공유함 | `true` / 600 s / 1000 |

### Doris {#doris}

Doris Catalog는 `schema` 및 `backends` 항목을 `doris` 엔진 아래에 표시하며, `meta.cache.doris.<entry>.*` 키로 구성합니다.

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Typical Hive, Iceberg, and Paimon limit configurations -->
## 예제 {#examples}

### Catalog 한도만 사용 {#use-only-catalog-limits}

FE 전체 한도가 없을 때는 Catalog별로 독립적인 한도를 설정합니다.

```sql
ALTER CATALOG hive_prod SET PROPERTIES (
    "meta.cache.max-weight" = "6GB"
);

ALTER CATALOG iceberg_ad_hoc SET PROPERTIES (
    "meta.cache.max-weight" = "2GB"
);
```

각 Catalog는 각각 6 GB와 2 GB로 제한되지만, FE에서 두 Catalog의 사용량 합계에 적용되는 공통 한도는 없습니다.

### Hive 파일 목록 및 파티션 구조 제한 {#limit-hive-file-listings-and-partition-structures}

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.file.max-weight" = "2GB",
    "meta.cache.hive.partition_view.max-weight" = "1GB"
);
```

파일이 많은 테이블의 파일 목록과 파티션이 많은 테이블의 파티션 프루닝 구조가 일반적으로 가장 큰 Hive 항목입니다.

### Iceberg 메타데이터 제한 및 매니페스트 캐시 활성화 {#limit-iceberg-metadata-and-enable-the-manifest-cache}

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.iceberg.table.max-weight" = "1GB",
    "meta.cache.iceberg.partition.max-weight" = "1GB",
    "meta.cache.iceberg.manifest.enable" = "true",
    "meta.cache.iceberg.manifest.max-weight" = "1GB"
);
```

### Paimon 파티션 프로젝션 제한 {#limit-paimon-partition-projections}

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "2GB",
    "meta.cache.paimon.partition_view.max-weight" = "1GB"
);
```

나머지 Paimon 캐시에는 Catalog 한도인 2 GB가 적용됩니다.

### 메모리 및 TTL 정책 함께 사용 {#combine-memory-and-ttl-policies}

메모리 한도는 `enable`, `ttl-second`, `capacity`와 함께 사용할 수 있습니다.

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.hive.file.enable" = "true",
    "meta.cache.hive.file.ttl-second" = "1800",
    "meta.cache.hive.file.capacity" = "20000",
    "meta.cache.hive.file.max-weight" = "2GB"
);
```

`capacity`는 계속 개수 한도로 작동하며, `max-weight`는 메모리 한도를 추가합니다. 둘 중 하나에 먼저 도달하면 캐시에서 항목을 제거합니다. `capacity=0` 또는 `ttl-second=0`으로 설정하면 기존과 마찬가지로 해당 항목이 비활성화됩니다.

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Understanding admission rejection and its effect on queries -->
## 한도에 도달했을 때의 동작 {#behavior-when-a-limit-is-reached}

캐시 미스가 발생하면 Doris는 다음과 같이 동작합니다.

1. 외부 소스에서 메타데이터를 불러옵니다.
2. 불러온 객체를 보관하는 데 필요한 메모리를 추정하고, 사용량 집계를 위한 고정 오버헤드 512바이트를 추가합니다.
3. FE, Catalog 및 항목 할당량을 원자적으로 확인합니다.
4. 캐시 저장이 거부되면 불러온 객체를 캐시에 저장하지 않고 현재 요청에 반환하며, 다른 항목에 자주 사용하지 않는 데이터를 비동기적으로 해제하도록 요청합니다. 먼저 같은 Catalog의 항목에 요청하고, FE 전체 할당량이 부족한 경우 다른 Catalog에도 요청합니다.

객체의 캐시 저장이 거부되어도 쿼리가 실패하지는 않습니다. 객체가 캐시에 보관되지 않으므로 이후 접근 시 다시 불러오게 되며, 비동기 회수를 통해 충분한 여유 할당량이 확보될 때까지 쿼리 계획 수립 지연 시간이 증가합니다.

캐시 적중 시에는 메모리 추정을 건너뜁니다. 추정기에는 두 종류가 있습니다.

- 유형별 추정기는 Hive Metastore 객체, Hive 파일 목록, Iceberg 테이블 메타데이터, 매니페스트, 그리고 Hive, Iceberg, Paimon의 파생 파티션 프로젝션 크기를 추정합니다.
- 범용 추정기는 정해진 방문 횟수 한도 내에서 나머지 캐시의 객체 그래프 전체를 순회합니다. 방문 횟수 한도를 소진하거나 그래프에 검사할 수 없는 클래스가 포함되어 있으면 추정이 불완전합니다.

추정이 불완전하면 객체 크기를 실제보다 작게 집계하는 대신 캐시 저장을 거부합니다. 거부 사유는 `LAST_WEIGHT_REJECT_REASON`에 기록됩니다.

| 사유 | 의미 |
|---|---|
| `budget_exceeded` | FE, Catalog 또는 항목 할당량으로 객체를 수용할 수 없음 |
| `entry_too_large` | 객체 하나의 크기가 항목의 유효 한도보다 큼 |
| `incomplete_estimate:<detail>` | 추정기가 객체 크기를 신뢰할 수 있게 추정하지 못함 |
| `invalid_zero_estimate` | 추정기가 영을 반환함 |

:::caution
할당량 검사는 객체를 불러온 후 캐시에 저장하는 단계에서 수행됩니다. Doris는 외부 소스에 접근하기 전에 힙을 예약하지 않습니다. 따라서 원격 소스에서 객체를 불러오지 못하거나, 예외적으로 큰 객체가 생성 완료 전에 FE 힙을 소진하면 현재 요청이 여전히 실패할 수 있습니다. 이 기능은 객체를 성공적으로 불러온 뒤 보관하는 메모리를 제한하며, 메타데이터를 한 번 불러오는 과정에서 발생하는 OOM을 방지하는 기능은 아닙니다.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Applying limit changes without restarting queries -->
## 구성 적용 및 캐시 새로 고침 {#applying-configuration-and-refreshing-caches}

- `external_meta_cache_max_weight`를 변경한 후에는 FE를 재시작하세요. Catalog가 초기화된 상태에서는 이 값을 변경할 수 없습니다.
- `meta.cache.max-weight` 또는 `schema.cache.ttl-second`를 변경하면 해당 Catalog의 모든 메타데이터 캐시가 삭제됩니다. `meta.cache.<engine>.<entry>.*`를 변경하면 해당 엔진의 캐시가 삭제됩니다. 다음 접근 시 새 구성으로 캐시가 다시 생성됩니다.
- 이미 실행 중인 쿼리는 불러온 객체를 계속 유지합니다.
- Paimon Catalog에 FE 전체 한도 또는 Catalog 한도가 적용되면, 사용량이 집계되지 않는 별도의 메타데이터 캐시가 생기지 않도록 Paimon 자체 SDK의 `CachingCatalog`가 기본적으로 비활성화됩니다. 명시적으로 설정한 `paimon.cache-enabled` 속성이 있으면 해당 설정이 우선합니다.

메모리 한도는 객체를 캐시에 보관할지 여부를 제어합니다. 외부 메타데이터를 변경하지 않으며 `REFRESH CATALOG`, TTL 또는 메타데이터 이벤트 동기화를 대체하지 않습니다.

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Troubleshooting / Performance tuning of FE heap usage -->
## 메모리 압박 모니터링 및 문제 해결 {#monitoring-and-troubleshooting-memory-pressure}

시스템 테이블 [`catalog_meta_cache_statistics`](../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics)은 FE, Catalog, 메타데이터 캐시 엔진 및 캐시 항목의 각 조합에 대해 한 행을 제공합니다. 다음 열은 메모리 관리를 설명합니다.

| 열 | 의미 | 시간 기준 |
|---|---|---|
| `MAX_WEIGHT` | 항목의 유효 메모리 한도이며 단위는 바이트입니다. `-1`은 해당 항목에 FE, Catalog 또는 항목 한도가 적용되지 않음을 의미합니다. | 구성 값 |
| `ESTIMATED_WEIGHT` | 항목이 현재 예약한 추정 바이트 수입니다. | 쿼리 시점의 게이지 값 |
| `WEIGHT_REJECT_COUNT` | 위에 나열된 사유 중 하나로 캐시 저장이 거부된 횟수입니다. | 현재 캐시 인스턴스의 누적값 |
| `LAST_WEIGHT_REJECT_REASON` | 가장 최근에 캐시 저장이 거부된 사유입니다. | 최신 값 |

Catalog 속성 변경 또는 FE 재시작 후 캐시가 다시 생성되면 누적 카운터는 영부터 다시 시작합니다. 이 테이블은 이력을 보관하지 않으므로 추세가 필요하면 주기적으로 값을 수집하세요. `max_weight >= 0`인 행이 메모리 사용량을 기준으로 관리되는 항목이며, 한도 자체는 `fe.conf` 및 Catalog 속성에서 가져옵니다.

또한 Doris는 캐시 저장이 거부되면 항목별로 분당 최대 한 번씩만 경고를 기록하도록 로그 빈도를 제한합니다.

```text
Metadata cache entry 'hive-file' rejected a value by weight: reason=budget_exceeded, used=..., max=...
```

FE 힙 사용량이 높고 외부 메타데이터 캐시가 원인으로 의심되면 다음 절차를 따르세요.

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

예약량 합계를 구성된 `external_meta_cache_max_weight` 및 FE 힙과 비교하세요. 이 값은 캐시에 보관된 메모리의 추정 사용량이며 FE 힙 전체 사용량이 아닙니다. 메타데이터를 불러오는 동안 사용하는 임시 메모리, 실행 중인 쿼리가 참조하는 객체, 커넥터 SDK 캐시는 포함되지 않습니다. 예약량은 낮지만 FE 힙 사용량이 계속 높으면 6단계로 이동하세요.

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

각 Catalog의 사용량을 해당 `meta.cache.max-weight`와 비교하세요. 예약량이 한도에 근접한 Catalog나 특정 FE에서 다른 FE보다 훨씬 큰 Catalog를 찾으세요.

### 3. 캐시 항목별로 상세 확인 {#3-drill-down-to-cache-entries}

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

`estimated_weight`가 `max_weight`에 근접한 항목은 Catalog에서 큰 비중을 차지합니다. `weight_reject_count`가 증가하고 사유가 `budget_exceeded`라면 할당량이 부족하다는 뜻입니다. 객체를 불러와 반환하지만 캐시에 보관하지 않으므로 이후 접근 시 다시 불러옵니다. `entry_too_large`는 단일 객체가 항목 한도를 초과한다는 의미입니다. `incomplete_estimate`는 할당량 문제가 아니며, 객체는 캐시에 저장되지 않은 상태로 제공됩니다.

### 4. 제어 방법 선택 {#4-choose-a-control}

| 목표 | 설정 항목 | 적용 시점 |
|---|---|---|
| 단일 FE의 총사용량 제한 | `external_meta_cache_max_weight`를 `fe.conf`에서 설정 | FE 재시작 후 |
| 단일 Catalog 격리 | `meta.cache.max-weight` | `ALTER CATALOG` 후 다음 접근 시 |
| 단일 항목의 메모리 독점 방지 | `meta.cache.<engine>.<entry>.max-weight` | `ALTER CATALOG` 후 다음 접근 시 |
| 캐싱보다 메타데이터 최신성 우선 | `meta.cache.<engine>.<entry>.ttl-second`를 줄이거나 `meta.cache.<engine>.<entry>.enable`을 `false`로 설정 | `ALTER CATALOG` 후 다음 접근 시 |

### 5. 변경 후 동작 {#5-what-happens-after-the-change}

- Catalog 속성을 변경하면 영향을 받는 캐시가 삭제되고 필요할 때 다시 생성됩니다. 시스템 테이블의 카운터는 영부터 다시 시작합니다.
- 이미 실행 중인 쿼리는 불러온 객체를 계속 유지합니다.
- 할당량을 줄이면 캐시 미스가 증가합니다. 작업 집합이 다시 한도 내에 들어올 때까지 외부 메타데이터를 불러오는 횟수와 계획 수립 지연 시간이 늘어날 수 있습니다.

### 6. 이 메커니즘으로 해결할 수 없는 문제 {#6-what-this-mechanism-cannot-solve}

집계된 메모리 사용량은 낮지만 FE 힙 사용량이 계속 높으면 할당량에 포함되지 않는 곳에서 메모리 압박이 발생하는 것입니다. `max-weight`를 더 낮춰도 도움이 되지 않습니다. 다음 항목을 조사하세요.

- 실행 중인 쿼리가 여전히 참조하는 메타데이터 객체
- 커넥터 SDK 캐시. 예를 들어 Paimon의 `CachingCatalog`는 `paimon.cache-enabled`가 명시적으로 설정된 경우 사용될 수 있습니다.
- 단일 대형 메타데이터를 불러오고 구체화하는 과정에서 발생하는 최대 메모리 사용량. 이는 캐시 저장 허용 여부를 판단하기 전에 발생합니다.
- 관리 대상 Catalog 소유자 외부에서 생성되어 시스템 테이블에 표시되지 않는 FE 내부 캐시

### 증상별 참고 사항 {#symptom-reference}

| 증상 | 확인 쿼리 | 해석 | 조치 |
|---|---|---|---|
| FE 힙 사용량이 높고 예약량 합계가 `external_meta_cache_max_weight`에 근접함 | 1단계 | 관리 대상 캐시가 FE 전체 한도에 도달함 | FE 한도 또는 가장 큰 Catalog의 한도를 낮추거나 FE에 더 많은 힙을 할당 |
| FE 힙 사용량은 높지만 예약량 합계는 낮음 | 1단계 | 할당량 외부에서 메모리 압박이 발생함 | 6단계를 따름 |
| 특정 Catalog가 자체 `meta.cache.max-weight`에 근접하거나 특정 FE에서 훨씬 큼 | 2단계 | 해당 Catalog의 작업 집합이 할당된 몫을 초과함 | 힙에 여유가 있으면 한도를 높이거나 내부 항목 한도를 추가 |
| `weight_reject_count`가 계속 증가하고 사유가 `budget_exceeded`임 | 3단계 | 객체를 불러오지만 캐시에 보관하지 않아 이후 다시 불러옴 | 할당량을 높이거나 경쟁하는 다른 항목의 한도를 낮춤 |
| `weight_reject_count`가 계속 증가하고 사유가 `entry_too_large`임 | 3단계 | 개별 객체가 항목 한도를 초과함 | 항목 한도를 높이거나 해당 객체가 캐시 없이 제공되는 것을 허용 |
| `weight_reject_count`가 계속 증가하고 사유가 `incomplete_estimate`임 | 3단계 | 객체 크기를 신뢰할 수 있게 추정할 수 없어 캐시에 저장되지 않음 | 할당량을 변경해도 도움이 되지 않음; 캐시 없이도 쿼리는 성공함 |
| `estimated_weight`가 `max_weight` 수준을 유지하며 캐시 적중률이 낮음 | 3단계 | 항목이 할당량 내에서 저장과 제거를 반복함 | 항목 한도를 높이거나 TTL을 줄여 작업 집합을 축소 |

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Limits of estimated memory accounting -->
## 주의 사항 {#caveats}

- `max-weight`는 캐시에 보관되는 메모리의 추정 사용량을 기준으로 한 캐시 저장 허용 한도입니다. 추정에는 구조별 상수와 페이로드 카운터를 사용하며, 실행 중인 JVM의 정확한 메모리 배치를 모델링하지는 않습니다. 이 결과는 운영체제의 RSS가 아니며 FE 힙 및 GC 모니터링을 대체하지 않습니다.
- 캐시된 값은 제거되거나 만료되거나 무효화될 때까지 강한 참조로 유지됩니다. 메타데이터 캐시가 작업 집합에 따라 계속 증가해서는 안 된다면 할당량을 구성하세요.
- Catalog 클라이언트, FileIO 인스턴스, 스레드 풀과 같은 공유 런타임 인프라는 어느 항목의 사용량에도 포함되지 않습니다.
- 여러 물리적 캐시가 하나의 `<entry>` 토큰을 공유하여 하나의 항목 한도를 함께 사용할 수 있습니다. 예를 들어 두 Iceberg `partition_view` 캐시와 세 ADBC `metadata` 캐시가 이에 해당합니다.
- 추정이 불완전한 객체는 캐시에 저장되지 않습니다. 항목의 캐시 적중률이 낮고 `incomplete_estimate` 사유의 거부가 함께 나타나면 해당 객체 유형에는 캐싱이 효과적이지 않습니다.
- 새로 제출하는 DDL 속성에서는 알려진 엔진의 알 수 없는 `max-weight` 키를 엄격하게 거부합니다. 이전 또는 이후 버전에서 저장된 알 수 없는 키는 허용하므로, 업그레이드된 Catalog도 계속 초기화할 수 있습니다.

<!-- Knowledge Type: Architecture Decision -->
<!-- Applicable Scenarios: Planning metadata-cache memory across Catalogs -->
## 모범 사례 {#best-practices}

1. Catalog 전체의 총사용량이 무제한으로 증가하지 않도록 FE 전체 한도부터 설정하세요.
2. FE를 공유하는 대규모 프로덕션 Catalog에는 Catalog 한도를 추가하세요.
3. 사용량에서 큰 비중을 차지하는 항목에만 항목 수준 한도를 추가하세요. 모든 항목에 개별 설정이 필요한 것은 아닙니다.
4. JVM 힙 대부분을 외부 메타데이터 캐시에 할당하기보다 쿼리 계획 수립 및 기타 FE 캐시를 위해 충분한 힙을 남겨 두세요.
5. `budget_exceeded` 사유로 캐시 저장이 거부된 뒤 같은 객체를 반복해서 다시 불러온다면 할당량을 늘리거나 경쟁하는 다른 항목의 한도를 줄이세요.
6. FE 힙 크기가 서로 다르면 백분율을 사용하고, 모든 FE에 동일한 바이트 한도를 적용해야 하면 고정 크기를 사용하세요.
