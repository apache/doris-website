---
{
    "title": "메타데이터 캐시",
    "language": "ko",
    "description": "Apache Doris는 외부 데이터 소스에 대한 접근 성능을 높이기 위해 외부 데이터 소스의 메타데이터를 캐시합니다."
}
---

:::tip
이 문서는 4.1.x 이전 버전에 적용됩니다.
Doris 4.1.x 이상 버전에서는 외부 메타데이터 캐시가 통합 구성 키 `meta.cache.*`를 사용하도록 리팩터링되었습니다. 각 [Catalog](./catalog-overview.md) 문서의 "메타데이터 캐시" 절을 참조하세요.
:::

Apache Doris는 외부 데이터 소스에 대한 접근 성능을 높이기 위해 외부 데이터 소스의 **메타데이터**를 캐시합니다.

메타데이터에는 데이터베이스, 테이블, 컬럼, 파티션, 스냅샷, 파일 목록 등의 정보가 포함됩니다.

이 문서에서는 이전 버전(4.1 이전)에서 캐시하는 메타데이터의 유형, 전략 및 관련 매개변수 설정을 자세히 설명합니다.

**데이터 캐시**에 대해서는 [데이터 캐시 문서](./data-cache.md)를 참조하세요.

Doris 4.1.4의 외부 메타데이터 캐시 메모리 제한에 대해서는 [외부 메타데이터 캐시 메모리 관리](./external-meta-cache-memory-management)를 참조하세요.

## 캐시 전략 {#cache-strategies}

대부분의 캐시에는 다음 세 가지 전략 지표가 있습니다.

- 최대 캐시 항목 수

    캐시에 저장할 수 있는 객체의 최대 개수입니다. 예를 들어 테이블을 최대 1000개까지 캐시할 수 있습니다. 캐시 항목 수가 임계값을 초과하면 LRU(Least-Recent-Used) 전략으로 일부 캐시 항목을 제거합니다.

- 만료 시간

    - 3.0.6 이하 버전:

        캐시 객체를 캐시에 기록한 후 일정 시간이 지나면 해당 객체가 캐시에서 자동으로 제거됩니다. 다음에 접근할 때는 데이터 소스에서 최신 정보를 다시 가져와 캐시를 갱신합니다.

        예를 들어 사용자가 08:00에 테이블 A에 처음 접근하여 캐시에 기록했다고 가정해 보겠습니다. 만료 시간이 4시간이면 용량 문제로 교체되지 않는 한 사용자는 08:00-14:00 동안 캐시의 테이블 A에 직접 접근합니다. 14:00 이후에는 캐시가 만료되어 제거됩니다. 사용자가 테이블 A에 다시 접근하면 데이터 소스에서 최신 정보를 가져와 캐시를 갱신합니다.

    - 3.0.7 이상 버전:

        3.0.7 버전부터는 **캐시 객체에 접근한 후 일정 시간이 지나면 자동으로 제거**하도록 이 전략이 변경되었습니다. 이전에는 **기록한 후** 일정 시간이 지나면 제거했습니다. 캐시 객체에 접근할 때마다 타이머가 초기화되므로 자주 접근하는 객체는 항상 캐시에 유지됩니다.

        예를 들어 사용자가 08:00에 테이블 A에 처음 접근하여 캐시에 기록했다고 가정해 보겠습니다. 만료 시간이 4시간이면 용량 문제로 교체되지 않는 한 사용자는 08:00-14:00 동안 캐시의 테이블 A에 직접 접근합니다. 사용자가 09:00에 이 객체에 다시 접근하면 캐시 만료 시간이 09:00부터 다시 계산되므로 만료 시점은 15:00이 됩니다.

- 최소 새로 고침 시간

    캐시 객체를 캐시에 기록한 후 일정 시간이 지나면 새로 고침이 자동으로 트리거됩니다.

    예를 들어 사용자가 08:00에 테이블 A에 처음 접근하여 캐시에 기록했다고 가정해 보겠습니다. 최소 새로 고침 시간이 10분이면 용량 문제로 교체되지 않는 한 사용자는 08:00-8:10 동안 캐시의 테이블 A에 직접 접근합니다. 08:10에는 캐시 객체가 [새로 고침 준비 완료] 상태로 표시됩니다. 사용자가 이 캐시 객체에 다시 접근하면 현재 객체를 그대로 반환하면서 캐시 새로 고침 작업도 함께 트리거합니다. 캐시 갱신에 1분이 걸린다면 1분 후 캐시에 다시 접근할 때 갱신된 캐시 객체를 가져옵니다.

    캐시 새로 고침이 트리거되는 시점은 [최소 새로 고침 시간이 지난 후 캐시 객체에 처음 접근할 때]이며, 새로 고침은 비동기로 수행됩니다. 따라서 최소 새로 고침 시간이 10분이라고 해서 10분 후에 최신 객체를 가져올 수 있다는 의미는 아닙니다.

    이 전략은 [만료 시간]과 달리 주로 캐시 정보의 최신성을 조정하는 데 사용됩니다. 캐시를 비동기로 새로 고치므로 현재 작업이 차단되는 것을 방지합니다.

## 캐시 유형 {#cache-types}

다음 절에서는 대표적인 FE 수준 기본 설정과 이전 버전의 캐시 제어 설정을 설명합니다.
이를 Doris 4.1.x+의 전체 캐시 항목 구성표로 해석해서는 안 됩니다.

| 분류 | 범위 | 주요 FE 기본 설정 | 비고 |
|---|---|---|---|
| 데이터베이스 / 테이블 이름 목록 | Catalog별 / 데이터베이스별 | `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | `SHOW DATABASES` / `SHOW TABLES`에서 사용 |
| 데이터베이스 / 테이블 객체 | Catalog별 / 데이터베이스별 | `max_meta_object_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 객체 캐시는 이름 목록 캐시와 일시적으로 다를 수 있음 |
| 테이블 스키마 | Catalog별 | `max_external_schema_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 이전 버전의 Catalog별 재정의 속성: `schema.cache.ttl-second` |
| Hive 파티션 값 | Hive Catalog별 | `max_hive_partition_table_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 이전 버전의 Catalog별 재정의 속성: `partition.cache.ttl-second` |
| Hive 파티션 속성 | Hive Catalog별 | `max_hive_partition_cache_num`, `external_cache_expire_time_seconds_after_access` | 이전 버전에서는 Catalog별 TTL 재정의를 지원하지 않음 |
| Hive 파일 목록 | Hive Catalog별 | `max_external_file_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 이전 버전의 Catalog별 재정의 속성: `file.meta.cache.ttl-second` |
| Hudi / Iceberg / Paimon의 이전 버전 테이블 수준 메타데이터 | Catalog별 | `max_external_table_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | Doris 4.1.x+의 경우 각 Catalog 문서에서 `fs_view`, `meta_client`, `view`, `manifest` 등의 현재 캐시 항목을 확인 |

### 데이터베이스 및 테이블 이름 목록 {#database-and-table-name-lists}

데이터베이스 이름 목록은 Catalog 아래에 있는 모든 데이터베이스 이름의 목록을 의미합니다.

테이블 이름 목록은 데이터베이스 아래에 있는 모든 테이블 이름의 목록을 의미합니다.

이름 목록은 `SHOW TABLES` 또는 `SHOW DATABASES` 문과 같이 이름을 나열해야 하는 작업에만 사용됩니다.

각 Catalog에는 데이터베이스 이름 목록 캐시가 있습니다. 각 데이터베이스에는 테이블 이름 목록 캐시가 있습니다.

- 최대 캐시 항목 수

    각 캐시에는 항목이 하나만 있습니다. 따라서 최대 캐시 항목 수는 1입니다.

- 만료 시간

    86400초로 고정되어 있습니다. 3.0.7 버전부터는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 새로 고침 시간

    FE 구성 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 이름 목록을 더 빠르게 확인할 수 있지만 외부 데이터 소스에 접근하는 빈도가 높아집니다.

    3.0.7 버전부터는 구성 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 동일합니다.

### 데이터베이스 및 테이블 객체 {#database-and-table-objects}

개별 데이터베이스 및 테이블 객체를 캐시합니다. 쿼리, 쓰기 등 데이터베이스나 테이블에 접근하는 모든 작업은 이 캐시에서 해당 객체를 가져옵니다.

이 캐시의 객체 목록은 **데이터베이스 및 테이블 이름 목록** 캐시와 일치하지 않을 수 있습니다.

예를 들어 `SHOW TABLES` 명령으로 이름 목록 캐시에서 테이블 `A`, `B`, `C`를 조회했다고 가정해 보겠습니다. 이때 외부 데이터 소스에 테이블 `D`가 추가되면 `SELECT * FROM D`로 테이블 `D`에 접근할 수 있으며, [테이블 객체] 캐시에 테이블 `D` 객체가 추가됩니다. 하지만 [테이블 이름 목록] 캐시는 여전히 `A`, `B`, `C`일 수 있습니다. [테이블 이름 목록] 캐시가 새로 고쳐져야 `A`, `B`, `C`, `D`가 됩니다.

각 Catalog에는 데이터베이스 객체 캐시가 있습니다. 각 데이터베이스에는 테이블 객체 캐시가 있습니다.

- 최대 캐시 항목 수

    FE 구성 항목 `max_meta_object_cache_num`으로 제어하며, 기본값은 1000입니다. 단일 Catalog 아래의 데이터베이스 수나 단일 데이터베이스 아래의 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 만료 시간

    86400초로 고정되어 있습니다. 3.0.7 버전부터는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 새로 고침 시간

    FE 구성 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 데이터베이스나 테이블을 더 빠르게 확인할 수 있지만 외부 데이터 소스에 접근하는 빈도가 높아집니다.

    3.0.7 버전부터는 구성 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 동일합니다.

### 테이블 스키마 {#table-schema}

컬럼 이름 등 테이블의 스키마 정보를 캐시합니다. 이 캐시는 주로 접근한 테이블의 스키마를 필요할 때만 가져오는 데 사용됩니다. 이를 통해 불필요한 테이블 스키마를 대량으로 동기화하여 FE 메모리를 차지하는 것을 방지합니다.

이 캐시는 Catalog별로 관리됩니다.

- 최대 캐시 항목 수

    FE 구성 항목 `max_external_schema_cache_num`으로 제어하며, 기본값은 10000입니다.

    Catalog 아래의 전체 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 만료 시간

    86400초로 고정되어 있습니다. 3.0.7 버전부터는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 새로 고침 시간

    FE 구성 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 스키마를 더 빠르게 확인할 수 있지만 외부 데이터 소스에 접근하는 빈도가 높아집니다.

    3.0.7 버전부터는 구성 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 동일합니다.

### Hive Metastore 테이블 파티션 목록 {#hive-metastore-table-partition-list}

Hive Metastore에서 동기화한 테이블의 파티션 목록을 캐시하는 데 사용됩니다. 파티션 목록은 쿼리 중 파티션 프루닝에 사용됩니다.

각 Hive Catalog에 이 캐시가 하나씩 있습니다.

- 최대 캐시 항목 수

    FE 구성 항목 `max_hive_partition_table_cache_num`으로 제어하며, 기본값은 1000입니다.

    Catalog 아래의 전체 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 만료 시간

    28800초로 고정되어 있습니다. 3.0.7 버전부터는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 새로 고침 시간

    FE 구성 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 파티션 목록을 더 빠르게 확인할 수 있지만 외부 데이터 소스에 접근하는 빈도가 높아집니다.

    3.0.7 버전부터는 구성 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 동일합니다.

### Hive Metastore 테이블 파티션 속성 {#hive-metastore-table-partition-properties}

파일 형식, 파티션 루트 경로 등 Hive 테이블의 각 파티션 속성을 캐시하는 데 사용됩니다. 각 쿼리에서는 파티션 프루닝으로 접근할 파티션 목록을 얻은 후 이 캐시를 통해 각 파티션의 상세 속성을 가져옵니다.

각 Hive Catalog에 이 캐시가 하나씩 있습니다.

- 최대 캐시 항목 수

    FE 구성 항목 `max_hive_partition_cache_num`으로 제어하며, 기본값은 10000입니다.

    Catalog 아래에서 접근할 전체 파티션 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 만료 시간

    28800초로 고정되어 있습니다. 3.0.7 버전부터는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 새로 고침 시간

    FE 구성 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 파티션 속성을 더 빠르게 확인할 수 있지만 외부 데이터 소스에 접근하는 빈도가 높아집니다.

    3.0.7 버전부터는 구성 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 동일합니다.

### Hive Metastore 테이블 파티션 파일 목록 {#hive-metastore-table-partition-file-list}

Hive 테이블의 단일 파티션 아래에 있는 파일 목록 정보를 캐시하는 데 사용됩니다. 이 캐시는 파일 시스템의 List 작업에 드는 오버헤드를 줄이는 데 사용됩니다.

- 최대 캐시 항목 수

    FE 구성 항목 `max_external_file_cache_num`으로 제어하며, 기본값은 10000입니다.

    접근할 파일 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 만료 시간

    기본값은 28800초입니다. 3.0.7 버전부터는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

    Catalog 속성에 `file.meta.cache.ttl-second` 속성을 설정하면 해당 시간이 사용됩니다.

    Hive 테이블의 데이터 파일이 자주 변경되어 캐시가 최신성 요구 사항을 충족하지 못하는 경우가 있습니다. 이 매개변수를 0으로 설정하면 이 캐시를 비활성화할 수 있습니다. 이 경우 각 쿼리에서 파일 목록을 실시간으로 가져오므로 성능이 저하될 수 있지만 파일 정보의 최신성은 높아집니다.

- 최소 새로 고침 시간

    FE 구성 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 파일 목록을 더 빠르게 확인할 수 있지만 외부 데이터 소스에 접근하는 빈도가 높아집니다.

    3.0.7 버전부터는 구성 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 동일합니다.

### Hudi 테이블 파티션 {#hudi-table-partitions}

이전 버전의 Hudi 파티션 메타데이터 캐싱에 대한 개요입니다.
현재 Doris 4.1.x+의 Hudi 캐시 항목에는 `fs_view`와 `meta_client`도 포함됩니다. [Hudi Catalog](./catalogs/hudi-catalog.md#meta-cache-unified-modules)를 참조하세요.

각 Hudi Catalog에 이 캐시가 하나씩 있습니다.

- 최대 캐시 항목 수

    FE 구성 항목 `max_external_table_cache_num`으로 제어하며, 기본값은 1000입니다.

    Hudi 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 만료 시간

    28800초로 고정되어 있습니다. 3.0.7 버전부터는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 새로 고침 시간

    FE 구성 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 Hudi 파티션 속성을 더 빠르게 확인할 수 있지만 외부 데이터 소스에 접근하는 빈도가 높아집니다.

    3.0.7 버전부터는 구성 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 동일합니다.

### Iceberg 테이블 정보 {#iceberg-table-information}

이전 버전의 Iceberg 테이블 메타데이터 캐싱에 대한 개요입니다. 테이블 객체는 Iceberg API를 통해 가져와 구성합니다.
Doris 4.1.x+에서 현재 확인할 수 있는 캐시 항목은 [Iceberg Catalog](./catalogs/iceberg-catalog.mdx#meta-cache-unified-modules)에 설명되어 있습니다.

각 Iceberg Catalog에 이 캐시가 하나씩 있습니다.

- 최대 캐시 항목 수

    FE 구성 항목 `max_external_table_cache_num`으로 제어하며, 기본값은 1000입니다.

    Iceberg 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 만료 시간

    28800초로 고정되어 있습니다. 3.0.7 버전부터는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 새로 고침 시간

    FE 구성 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 Iceberg 테이블 속성을 더 빠르게 확인할 수 있지만 외부 데이터 소스에 접근하는 빈도가 높아집니다.

    3.0.7 버전부터는 구성 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 동일합니다.

### Iceberg 스냅샷 관련 메타데이터 {#iceberg-snapshot-related-metadata}

Iceberg 테이블 메타데이터에서 파생되는 스냅샷 관련 메타데이터에 대한 이전 버전의 개요입니다.
현재 구현에서는 이를 4.1.x의 `table`, `view`, `manifest`와 나란히 존재하는 별도 캐시 항목으로 해석해서는 안 됩니다.

- 최대 캐시 항목 수

    FE 구성 항목 `max_external_table_cache_num`으로 제어하며, 기본값은 1000입니다.

    Iceberg 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 만료 시간

    28800초로 고정되어 있습니다. 3.0.7 버전부터는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 새로 고침 시간

    FE 구성 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 Iceberg 테이블 속성을 더 빠르게 확인할 수 있지만 외부 데이터 소스에 접근하는 빈도가 높아집니다.

    3.0.7 버전부터는 구성 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 동일합니다.

## 캐시 새로 고침 {#cache-refresh}

위에서 설명한 새로 고침 및 만료 전략 외에도 메타데이터를 수동으로 또는 정해진 주기에 따라 새로 고칠 수 있습니다.

### 수동 새로 고침 {#manual-refresh}

`REFRESH` 문을 사용하여 Catalog, 데이터베이스 또는 테이블의 메타데이터를 무효화합니다.
현재 구문, 권한 및 예시는 [REFRESH](../sql-manual/sql-statements/catalog/REFRESH.md)를 참조하세요.

동작 개요:

- `REFRESH CATALOG`는 Catalog 수준 객체 캐시를 무효화하며, 기본적으로 하위 수준 메타데이터 캐시도 무효화합니다.
- `REFRESH DATABASE`는 특정 데이터베이스 아래의 메타데이터를 무효화합니다.
- `REFRESH TABLE`은 특정 테이블의 메타데이터를 무효화합니다.
- `REFRESH CATALOG`에서 `invalid_cache = false`를 지정하면 하위 수준 캐시는 유지하고 객체/이름 목록만 새로 고칩니다.

### 예약 새로 고침 {#scheduled-refresh}

Catalog를 생성할 때 주기적인 새로 고침을 설정할 수 있습니다.

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'metadata_refresh_interval_sec' = '3600'
);
```

위 예시에서 `metadata_refresh_interval_sec`는 Catalog를 3600초마다 새로 고친다는 의미입니다. 이는 3600초마다 다음 문을 자동으로 한 번 실행하는 것과 같습니다.

`REFRESH CATALOG ctl1;`

## 모범 사례 {#best-practices}

캐싱은 메타데이터 접근 성능을 크게 높일 수 있으며, 성능 변동이나 메타데이터 서비스의 부하를 유발할 수 있는 빈번한 원격 메타데이터 접근을 방지합니다. 하지만 캐싱은 데이터의 최신성을 떨어뜨리기도 합니다. 예를 들어 캐시 새로 고침 시간이 10분이면 십 분 동안은 캐시된 메타데이터만 읽을 수 있습니다. 따라서 상황에 맞게 캐시를 적절히 설정해야 합니다.

### 기본 동작 {#default-behavior}

이 절에서는 기본 매개변수 설정에서 사용자가 알아두어야 할 주요 캐시 동작을 설명합니다.

- 외부 데이터 소스에 새 데이터베이스나 테이블이 추가되면 Doris에서 SELECT를 통해 실시간으로 쿼리할 수 있습니다. 하지만 SHOW DATABASES와 SHOW TABLES에서는 표시되지 않을 수 있으므로 캐시를 수동으로 새로 고치거나 최대 10분을 기다려야 합니다.
- 외부 데이터 소스에 새 파티션이 추가되면 캐시를 수동으로 새로 고치거나 최대 10분을 기다려야 새 파티션 데이터를 쿼리할 수 있습니다.
- 파티션 데이터 파일이 변경되면 캐시를 수동으로 새로 고치거나 최대 10분을 기다려야 새 파티션 데이터를 쿼리할 수 있습니다.

### 스키마 캐시 비활성화 {#disable-schema-cache}

모든 유형의 외부 Catalog에서 최신 테이블 스키마를 실시간으로 확인하려면 스키마 캐시를 비활성화할 수 있습니다.

- 전역 비활성화

    ```text
    -- fe.conf
    max_external_schema_cache_num=0 // Disable Schema cache.
    ```

- 이전 버전의 Catalog 수준 속성

    ```text
    -- Catalog property
    "schema.cache.ttl-second" = "0" // Legacy property, supported in 2.1.11 / 3.0.6
    ```

설정 후 Doris에서 최신 테이블 스키마를 실시간으로 확인할 수 있습니다. 다만 이 설정으로 인해 메타데이터 서비스의 부하가 증가할 수 있습니다.

### Hive Catalog 메타데이터 캐시 비활성화 {#disable-hive-catalog-metadata-cache}

Hive Catalog에서 실시간으로 갱신되는 데이터를 쿼리하기 위해 캐시를 비활성화하려면 다음 매개변수를 설정할 수 있습니다.

- 전역 비활성화

    ```text
    -- fe.conf
    max_external_file_cache_num=0    // Disable file list cache
    max_hive_partition_table_cache_num=0  // Disable partition list cache
    max_hive_partition_cache_num=0   // Disable partition property cache
    ```

- 이전 버전의 Catalog 수준 속성

    ```text
    -- Catalog property
    "file.meta.cache.ttl-second" = "0" // Disable file list cache
    "partition.cache.ttl-second" = "0" // Disable partition list cache (supported in 2.1.11 / 3.0.6)
    ```

위 매개변수를 설정하면 다음과 같이 동작합니다.

- 외부 데이터 소스의 새 파티션을 실시간으로 쿼리할 수 있습니다.
- 파티션 데이터 파일의 변경 사항을 실시간으로 쿼리할 수 있습니다.
- 파티션 속성의 변경 사항을 반영하려면 파티션 속성 캐시도 비활성화해야 합니다.

하지만 이렇게 하면 Hive Metastore, HDFS 등의 외부 데이터 소스에 대한 접근 부하가 증가하여 메타데이터 접근 지연 시간이 불안정해지는 등의 현상이 발생할 수 있습니다.
