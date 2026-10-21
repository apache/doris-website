---
{
    "title": "메타데이터 캐시",
    "language": "ko",
    "description": "Apache Doris는 외부 데이터 소스에 대한 접근 성능을 높이기 위해 외부 데이터 소스의 메타데이터를 캐시합니다."
}
---

:::tip
이 문서는 4.1.x 이전 버전에 적용됩니다.
Doris 4.1.x 이상에서는 외부 메타데이터 캐시가 통합 설정 키 `meta.cache.*`를 사용하도록 리팩터링되었습니다. 각 [Catalog](./catalog-overview.md) 문서의 "메타데이터 캐시" 절을 참고하세요.
:::

Apache Doris는 외부 데이터 소스에 대한 접근 성능을 높이기 위해 외부 데이터 소스의 **메타데이터**를 캐시합니다.

메타데이터에는 데이터베이스, 테이블, 컬럼, 파티션, 스냅샷, 파일 목록 등의 정보가 포함됩니다.

이 문서에서는 이전 버전(4.1 이전)에서 캐시되는 메타데이터의 유형, 전략 및 관련 매개변수 설정을 자세히 설명합니다.

**데이터 캐시**는 [데이터 캐시 문서](./data-cache.md)를 참고하세요.

외부 메타데이터 캐시의 메모리 제한은 [외부 메타데이터 캐시 메모리 관리](./external-meta-cache-memory-management)를 참고하세요.

## 캐시 전략 {#cache-strategies}

대부분의 캐시에는 다음 세 가지 전략 지표가 있습니다.

- 최대 캐시 수

    캐시에 저장할 수 있는 객체의 최대 개수입니다. 예를 들어 테이블을 최대 1000개까지 캐시할 수 있습니다. 캐시 수가 임계값을 초과하면 LRU (Least-Recent-Used) 전략에 따라 일부 캐시를 제거합니다.

- 제거 시간

    - 3.0.6 버전까지(포함):

        캐시 객체가 캐시에 기록된 후 일정 시간이 지나면 자동으로 제거됩니다. 다음에 접근할 때 데이터 소스에서 최신 정보를 다시 가져와 캐시를 갱신합니다.

        예를 들어 사용자가 08:00에 테이블 A에 처음 접근하여 캐시에 기록한다고 가정해 보겠습니다. 제거 시간이 4시간이면 용량 문제로 교체되지 않는 한 08:00-14:00 동안 캐시에 있는 테이블 A에 직접 접근합니다. 14:00 이후에는 캐시가 제거됩니다. 사용자가 테이블 A에 다시 접근하면 데이터 소스에서 최신 정보를 가져와 캐시를 갱신합니다.

    - 3.0.7 버전부터(포함):

        3.0.7 버전부터는 **캐시 객체에 접근한 후 일정 시간이 지나면 자동으로 제거하는 방식**으로 변경되었으며, **기록된 후** 경과한 시간을 기준으로 삼지 않습니다. 캐시 객체에 접근할 때마다 타이머가 초기화되므로 자주 접근하는 객체는 항상 캐시에 남아 있습니다.

        예를 들어 사용자가 08:00에 테이블 A에 처음 접근하여 캐시에 기록한다고 가정해 보겠습니다. 제거 시간이 4시간이면 용량 문제로 교체되지 않는 한 08:00-14:00 동안 캐시에 있는 테이블 A에 직접 접근합니다. 사용자가 09:00에 이 객체에 다시 접근하면 캐시 제거 시간은 09:00부터 다시 계산되므로 15:00이 됩니다.

- 최소 갱신 시간

    캐시 객체가 캐시에 기록된 후 일정 시간이 지나면 자동으로 갱신을 트리거합니다.

    예를 들어 사용자가 08:00에 테이블 A에 처음 접근하여 캐시에 기록한다고 가정해 보겠습니다. 최소 갱신 시간이 10분이면 용량 문제로 교체되지 않는 한 08:00-8:10 동안 캐시에 있는 테이블 A에 직접 접근합니다. 08:10이 되면 캐시 객체가 [갱신 준비 완료] 상태로 표시됩니다. 사용자가 이 캐시 객체에 다시 접근하면 현재 객체를 그대로 반환하면서 동시에 캐시 갱신 작업을 트리거합니다. 캐시 갱신에 1분이 걸린다면 1분 후에 캐시에 다시 접근할 때 갱신된 캐시 객체를 가져옵니다.

    캐시 갱신은 [최소 갱신 시간을 초과한 후 캐시 객체에 처음 접근할 때] 트리거되며, 비동기로 수행됩니다. 따라서 최소 갱신 시간이 10분이라고 해서 10분 후에 반드시 최신 객체를 가져올 수 있다는 뜻은 아닙니다.

    이 전략은 [제거 시간]과 달리 주로 캐시의 최신성을 조절하는 데 사용되며, 캐시를 비동기로 갱신하여 현재 작업이 차단되지 않도록 합니다.

## 캐시 유형 {#cache-types}

다음 절에서는 대표적인 FE 수준 기본값과 이전 버전의 캐시 제어 설정을 설명합니다.
이를 Doris 4.1.x+의 전체 캐시 항목 구성으로 해석해서는 안 됩니다.

| 분류 | 범위 | 주요 FE 기본 설정 | 참고 |
|---|---|---|---|
| 데이터베이스 / 테이블 이름 목록 | Catalog별 / 데이터베이스별 | `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | `SHOW DATABASES` / `SHOW TABLES`에서 사용 |
| 데이터베이스 / 테이블 객체 | Catalog별 / 데이터베이스별 | `max_meta_object_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 객체 캐시는 이름 목록 캐시와 일시적으로 다를 수 있음 |
| 테이블 스키마 | Catalog별 | `max_external_schema_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 이전 버전의 Catalog별 재정의 설정: `schema.cache.ttl-second` |
| Hive 파티션 값 | Hive Catalog별 | `max_hive_partition_table_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 이전 버전의 Catalog별 재정의 설정: `partition.cache.ttl-second` |
| Hive 파티션 속성 | Hive Catalog별 | `max_hive_partition_cache_num`, `external_cache_expire_time_seconds_after_access` | 이전 버전에는 Catalog별 TTL 재정의 설정이 없음 |
| Hive 파일 목록 | Hive Catalog별 | `max_external_file_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | 이전 버전의 Catalog별 재정의 설정: `file.meta.cache.ttl-second` |
| Hudi / Iceberg / Paimon의 이전 버전 테이블 수준 메타데이터 | Catalog별 | `max_external_table_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | Doris 4.1.x+에서는 `fs_view`, `meta_client`, `view`, `manifest` 등의 현재 캐시 항목을 각 Catalog 문서에서 확인 |

### 데이터베이스 및 테이블 이름 목록 {#database-and-table-name-lists}

데이터베이스 이름 목록은 Catalog에 속한 모든 데이터베이스 이름의 목록을 말합니다.

테이블 이름 목록은 데이터베이스에 속한 모든 테이블 이름의 목록을 말합니다.

이름 목록은 `SHOW TABLES` 또는 `SHOW DATABASES` 문처럼 이름을 나열해야 하는 작업에만 사용됩니다.

각 Catalog에는 데이터베이스 이름 목록 캐시가 있고, 각 데이터베이스에는 테이블 이름 목록 캐시가 있습니다.

- 최대 캐시 수

    각 캐시에는 항목이 하나만 있으므로 최대 캐시 수는 1입니다.

- 제거 시간

    86400초로 고정되어 있습니다. 3.0.7 버전 이후에는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 갱신 시간

    FE 설정 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 이름 목록을 실시간에 더 가깝게 확인할 수 있지만, 외부 데이터 소스에 접근하는 빈도가 증가합니다.

    3.0.7 버전 이후에는 설정 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 그대로 유지됩니다.

### 데이터베이스 및 테이블 객체 {#database-and-table-objects}

개별 데이터베이스 및 테이블 객체를 캐시합니다. 쿼리, 쓰기 등 데이터베이스나 테이블에 접근하는 모든 작업은 이 캐시에서 해당 객체를 가져옵니다.

이 캐시의 객체 목록은 **데이터베이스 및 테이블 이름 목록** 캐시와 일치하지 않을 수 있습니다.

예를 들어 `SHOW TABLES` 명령으로 이름 목록 캐시에서 테이블 `A`, `B`, `C`를 가져왔다고 가정해 보겠습니다. 이때 외부 데이터 소스에 테이블 `D`가 추가되면 `SELECT * FROM D`로 테이블 `D`에 접근할 수 있고, [테이블 객체] 캐시에도 테이블 `D` 객체가 추가됩니다. 하지만 [테이블 이름 목록] 캐시는 여전히 `A`, `B`, `C`일 수 있습니다. [테이블 이름 목록] 캐시가 갱신되어야 `A`, `B`, `C`, `D`가 됩니다.

각 Catalog에는 데이터베이스 객체 캐시가 있고, 각 데이터베이스에는 테이블 객체 캐시가 있습니다.

- 최대 캐시 수

    FE 설정 항목 `max_meta_object_cache_num`으로 제어하며, 기본값은 1000입니다. 단일 Catalog에 속한 데이터베이스 수나 단일 데이터베이스에 속한 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 제거 시간

    86400초로 고정되어 있습니다. 3.0.7 버전 이후에는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 갱신 시간

    FE 설정 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 데이터베이스나 테이블을 실시간에 더 가깝게 확인할 수 있지만, 외부 데이터 소스에 접근하는 빈도가 증가합니다.

    3.0.7 버전 이후에는 설정 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 그대로 유지됩니다.

### 테이블 스키마 {#table-schema}

컬럼 이름 등 테이블의 스키마 정보를 캐시합니다. 이 캐시는 주로 접근한 테이블의 스키마를 필요할 때 불러오는 데 사용되며, 불필요한 테이블 스키마를 대량으로 동기화하여 FE 메모리를 점유하는 일을 방지합니다.

이 캐시는 Catalog별로 관리됩니다.

- 최대 캐시 수

    FE 설정 항목 `max_external_schema_cache_num`으로 제어하며, 기본값은 10000입니다.

    Catalog에 속한 전체 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 제거 시간

    86400초로 고정되어 있습니다. 3.0.7 버전 이후에는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 갱신 시간

    FE 설정 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 스키마를 실시간에 더 가깝게 확인할 수 있지만, 외부 데이터 소스에 접근하는 빈도가 증가합니다.

    3.0.7 버전 이후에는 설정 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 그대로 유지됩니다.

### Hive Metastore 테이블 파티션 목록 {#hive-metastore-table-partition-list}

Hive Metastore에서 동기화한 테이블의 파티션 목록을 캐시하는 데 사용됩니다. 파티션 목록은 쿼리 중 파티션 프루닝에 사용됩니다.

각 Hive Catalog에는 이 캐시가 하나씩 있습니다.

- 최대 캐시 수

    FE 설정 항목 `max_hive_partition_table_cache_num`으로 제어하며, 기본값은 1000입니다.

    Catalog에 속한 전체 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 제거 시간

    28800초로 고정되어 있습니다. 3.0.7 버전 이후에는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 갱신 시간

    FE 설정 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 파티션 목록을 실시간에 더 가깝게 확인할 수 있지만, 외부 데이터 소스에 접근하는 빈도가 증가합니다.

    3.0.7 버전 이후에는 설정 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 그대로 유지됩니다.

### Hive Metastore 테이블 파티션 속성 {#hive-metastore-table-partition-properties}

파일 형식, 파티션 루트 경로 등 Hive 테이블의 각 파티션 속성을 캐시하는 데 사용됩니다. 각 쿼리에서는 파티션 프루닝으로 접근할 파티션 목록을 얻은 후, 이 캐시를 통해 각 파티션의 상세 속성을 가져옵니다.

각 Hive Catalog에는 이 캐시가 하나씩 있습니다.

- 최대 캐시 수

    FE 설정 항목 `max_hive_partition_cache_num`으로 제어하며, 기본값은 10000입니다.

    Catalog에서 접근할 전체 파티션 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 제거 시간

    28800초로 고정되어 있습니다. 3.0.7 버전 이후에는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 갱신 시간

    FE 설정 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 파티션 속성을 실시간에 더 가깝게 확인할 수 있지만, 외부 데이터 소스에 접근하는 빈도가 증가합니다.

    3.0.7 버전 이후에는 설정 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 그대로 유지됩니다.

### Hive Metastore 테이블 파티션 파일 목록 {#hive-metastore-table-partition-file-list}

Hive 테이블의 단일 파티션에 속한 파일 목록 정보를 캐시하는 데 사용됩니다. 이 캐시는 파일 시스템의 List 작업 오버헤드를 줄이는 데 사용됩니다.

- 최대 캐시 수

    FE 설정 항목 `max_external_file_cache_num`으로 제어하며, 기본값은 10000입니다.

    접근할 파일 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 제거 시간

    기본값은 28800초입니다. 3.0.7 버전 이후에는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

    Catalog 속성에 `file.meta.cache.ttl-second` 속성을 설정하면 해당 시간을 사용합니다.

    Hive 테이블의 데이터 파일이 자주 변경되어 캐시가 최신성 요구 사항을 충족하지 못하는 경우가 있습니다. 이 매개변수를 0으로 설정하면 이 캐시를 비활성화할 수 있습니다. 이 경우 쿼리마다 파일 목록을 실시간으로 가져오므로 성능이 저하될 수 있지만 파일 정보의 최신성은 높아집니다.

- 최소 갱신 시간

    FE 설정 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 파일 목록을 실시간에 더 가깝게 확인할 수 있지만, 외부 데이터 소스에 접근하는 빈도가 증가합니다.

    3.0.7 버전 이후에는 설정 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 그대로 유지됩니다.

### Hudi 테이블 파티션 {#hudi-table-partitions}

이전 버전의 Hudi 파티션 메타데이터 캐싱에 대한 요약입니다.
Doris 4.1.x+의 현재 Hudi 캐시 항목에는 `fs_view`와 `meta_client`도 포함됩니다. [Hudi Catalog](./catalogs/hudi-catalog.md#meta-cache-unified-modules)를 참고하세요.

각 Hudi Catalog에는 이 캐시가 하나씩 있습니다.

- 최대 캐시 수

    FE 설정 항목 `max_external_table_cache_num`으로 제어하며, 기본값은 1000입니다.

    Hudi 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 제거 시간

    28800초로 고정되어 있습니다. 3.0.7 버전 이후에는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 갱신 시간

    FE 설정 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 Hudi 파티션 속성을 실시간에 더 가깝게 확인할 수 있지만, 외부 데이터 소스에 접근하는 빈도가 증가합니다.

    3.0.7 버전 이후에는 설정 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 그대로 유지됩니다.

### Iceberg 테이블 정보 {#iceberg-table-information}

이전 버전의 Iceberg 테이블 메타데이터 캐싱에 대한 요약입니다. 테이블 객체는 Iceberg API를 통해 불러오고 구성합니다.
Doris 4.1.x+에서 현재 확인할 수 있는 캐시 항목은 [Iceberg Catalog](./catalogs/iceberg-catalog.mdx#meta-cache-unified-modules)에 설명되어 있습니다.

각 Iceberg Catalog에는 이 캐시가 하나씩 있습니다.

- 최대 캐시 수

    FE 설정 항목 `max_external_table_cache_num`으로 제어하며, 기본값은 1000입니다.

    Iceberg 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 제거 시간

    28800초로 고정되어 있습니다. 3.0.7 버전 이후에는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 갱신 시간

    FE 설정 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 Iceberg 테이블 속성을 실시간에 더 가깝게 확인할 수 있지만, 외부 데이터 소스에 접근하는 빈도가 증가합니다.

    3.0.7 버전 이후에는 설정 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 그대로 유지됩니다.

### Iceberg 스냅샷 관련 메타데이터 {#iceberg-snapshot-related-metadata}

Iceberg 테이블 메타데이터에서 파생되는 스냅샷 관련 메타데이터에 대한 이전 버전의 요약입니다.
현재 구현에서는 이 메타데이터를 4.1.x의 `table`, `view`, `manifest`와 별개인 캐시 항목으로 이해해서는 안 됩니다.

- 최대 캐시 수

    FE 설정 항목 `max_external_table_cache_num`으로 제어하며, 기본값은 1000입니다.

    Iceberg 테이블 수에 따라 이 매개변수를 적절히 조정할 수 있습니다.

- 제거 시간

    28800초로 고정되어 있습니다. 3.0.7 버전 이후에는 FE 매개변수 `external_cache_expire_time_seconds_after_access`로 설정하며, 기본값은 86400초입니다.

- 최소 갱신 시간

    FE 설정 항목 `external_cache_expire_time_minutes_after_access`로 제어하며, 단위는 분입니다. 기본값은 10분입니다. 이 시간을 줄이면 Doris에서 최신 Iceberg 테이블 속성을 실시간에 더 가깝게 확인할 수 있지만, 외부 데이터 소스에 접근하는 빈도가 증가합니다.

    3.0.7 버전 이후에는 설정 항목 이름이 `external_cache_refresh_time_minutes`로 변경되었습니다. 기본값은 그대로 유지됩니다.

## 캐시 갱신 {#cache-refresh}

앞서 설명한 갱신 및 제거 전략 외에도 사용자가 메타데이터를 수동으로 갱신하거나 예약하여 갱신할 수 있습니다.

### 수동 갱신 {#manual-refresh}

`REFRESH` 문을 사용하여 Catalog, 데이터베이스 또는 테이블의 메타데이터를 무효화합니다.
현재 구문, 권한 및 예제는 [REFRESH](../sql-manual/sql-statements/catalog/REFRESH.md)를 참고하세요.

주요 동작은 다음과 같습니다.

- `REFRESH CATALOG`는 Catalog 수준의 객체 캐시를 무효화하며, 기본적으로 하위 수준의 메타데이터 캐시도 무효화합니다.
- `REFRESH DATABASE`는 데이터베이스 하나에 속한 메타데이터를 무효화합니다.
- `REFRESH TABLE`은 테이블 하나의 메타데이터를 무효화합니다.
- `REFRESH CATALOG`에서 `invalid_cache = false`를 지정하면 하위 수준의 캐시를 유지하고 객체/이름 목록만 갱신합니다.

### 예약 갱신 {#scheduled-refresh}

Catalog를 생성할 때 예약 갱신을 설정할 수 있습니다.

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'metadata_refresh_interval_sec' = '3600'
);
```

위 예제의 `metadata_refresh_interval_sec`는 Catalog를 3600초마다 갱신한다는 의미입니다. 이는 3600초마다 다음 문을 한 번씩 자동 실행하는 것과 같습니다.

`REFRESH CATALOG ctl1;`

## 모범 사례 {#best-practices}

캐싱은 메타데이터 접근 성능을 크게 높이고, 성능 변동이나 메타데이터 서비스 부하를 유발할 수 있는 빈번한 원격 메타데이터 접근을 방지합니다. 하지만 캐싱은 데이터의 최신성을 떨어뜨리기도 합니다. 예를 들어 캐시 갱신 시간이 10분이면 십 분 동안은 캐시된 메타데이터만 읽을 수 있습니다. 따라서 상황에 맞게 캐시를 적절히 설정해야 합니다.

### 기본 동작 {#default-behavior}

이 절에서는 기본 매개변수 설정에서 사용자가 알아두면 좋은 캐시 동작을 주로 설명합니다.

- 외부 데이터 소스에 새 데이터베이스나 테이블이 추가되면 Doris에서 SELECT로 실시간 쿼리할 수 있습니다. 하지만 SHOW DATABASES와 SHOW TABLES에는 표시되지 않을 수 있으므로 캐시를 수동으로 갱신하거나 최대 10분 동안 기다려야 합니다.
- 외부 데이터 소스에 새 파티션이 추가되면 캐시를 수동으로 갱신하거나 최대 10분 동안 기다려야 새 파티션 데이터를 쿼리할 수 있습니다.
- 파티션 데이터 파일이 변경되면 캐시를 수동으로 갱신하거나 최대 10분 동안 기다려야 새 파티션 데이터를 쿼리할 수 있습니다.

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

설정 후에는 Doris에서 최신 테이블 스키마를 실시간으로 확인할 수 있습니다. 다만 이 설정으로 메타데이터 서비스의 부하가 증가할 수 있습니다.

### Hive Catalog 메타데이터 캐시 비활성화 {#disable-hive-catalog-metadata-cache}

Hive Catalog에서 실시간으로 갱신된 데이터를 쿼리하기 위해 캐시를 비활성화하려면 다음 매개변수를 설정하면 됩니다.

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

다만 이 경우 Hive Metastore, HDFS 등 외부 데이터 소스에 대한 접근 부하가 증가하여 메타데이터 접근 지연 시간이 불안정해지는 등의 현상이 발생할 수 있습니다.
