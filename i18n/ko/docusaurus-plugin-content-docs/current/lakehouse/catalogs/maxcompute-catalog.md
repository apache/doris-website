---
{
    "title": "MaxCompute Catalog",
    "language": "ko",
    "description": "Apache Doris MaxCompute Catalog는 Alibaba Cloud MaxCompute 데이터에 대한 연합 쿼리를 지원하며, 데이터 통합과 원본에 데이터 쓰기를 통해 데이터 마이그레이션 없이 여러 소스에 걸친 분석을 수행할 수 있도록 합니다."
}
---

[MaxCompute](https://help.aliyun.com/zh/maxcompute/)는 Alibaba Cloud의 기업용 SaaS(Software as a Service) 클라우드 데이터 웨어하우스입니다. Doris는 MaxCompute에서 제공하는 Open Storage SDK를 통해 MaxCompute 테이블 정보를 가져오고 쿼리 및 쓰기 작업을 수행할 수 있습니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| ---- | ---- |
| 데이터 통합 | MaxCompute 데이터를 읽어 Doris 내부 테이블에 씁니다. |
| 원본에 데이터 쓰기 | INSERT 명령을 사용하여 MaxCompute 테이블에 데이터를 씁니다. (4.1.0 버전부터 지원) |

## 사용 시 유의 사항 {#usage-notes}

1. 2.1.7 버전부터 MaxCompute Catalog는 [Open Storage SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)를 기반으로 개발되었습니다. 이전 버전에서는 Tunnel API를 기반으로 개발되었습니다.

2. Open Storage SDK를 사용할 때는 일부 제한 사항이 있습니다. `Usage Limitations` 섹션은 이 [문서](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)에서 확인하세요.

3. Doris 3.1.3 이전 버전에서는 MaxCompute의 프로젝트가 Doris의 데이터베이스에 대응합니다. 3.1.3 버전에서는 `mc.enable.namespace.schema` 매개변수를 통해 MaxCompute 스키마 계층을 도입할 수 있습니다.

## Catalog 구성 {#configuring-catalog}

### 구문 {#syntax}

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'max_compute',
    {McAuthProperties},
    {McRequiredProperties},
    {McOptionalProperties},
    {CommonProperties}
);
```

* `{McAuthProperties}`

    이 속성들은 쿼리 및 쓰기 작업에서 Doris가 MaxCompute에 인증하는 방식을 제어합니다.

    > 버전 참고: `mc.auth.type`, `mc.ram_role_arn`, `mc.ecs_ram_role`은 **4.0.4**부터 지원됩니다.

    | 속성 이름 | 기본값 | 설명 | 필수 여부 | 지원되는 Doris 버전 |
    | --- | --- | --- | --- | --- |
    | `mc.auth.type` | `ak_sk` | 인증 유형입니다. 지원되는 값: `ak_sk`, `ram_role_arn`, `ecs_ram_role`. | 아니요 | 4.0.4 이상 |
    | `mc.access_key` | 없음 | Alibaba Cloud AccessKey입니다. | `mc.auth.type`이 `ak_sk`(기본값) 또는 `ram_role_arn`인 경우 필수입니다. | |
    | `mc.secret_key` | 없음 | Alibaba Cloud SecretKey입니다. | `mc.auth.type`이 `ak_sk`(기본값) 또는 `ram_role_arn`인 경우 필수입니다. | |
    | `mc.ram_role_arn` | 없음 | Alibaba Cloud RAM Role ARN입니다. | `mc.auth.type`이 `ram_role_arn`인 경우 필수입니다. | 4.0.4 이상 |
    | `mc.ecs_ram_role` | 없음 | 인스턴스에 연결된 Alibaba Cloud ECS RAM Role 이름입니다. | `mc.auth.type`이 `ecs_ram_role`인 경우 필수입니다. | 4.0.4 이상 |

    `mc.auth.type`에서 지원되는 값:

    | 값 | 설명 |
    | --- | --- |
    | `ak_sk` | Alibaba Cloud AccessKey와 SecretKey를 직접 사용합니다. |
    | `ram_role_arn` | `mc.access_key`와 `mc.secret_key`를 원본 자격 증명으로 사용하여 STS `AssumeRole`을 호출한 다음, 반환된 임시 자격 증명으로 MaxCompute에 접근합니다. |
    | `ecs_ram_role` | ECS 메타데이터 서비스에서 임시 자격 증명을 가져옵니다. MaxCompute에 접근하는 Doris FE 및 BE 노드가 `mc.ecs_ram_role`에 지정된 역할을 사용할 수 있어야 합니다. |

    검증 규칙:

    1. `mc.auth.type`을 생략하면 Doris는 `ak_sk`를 사용합니다.
    2. `mc.auth.type`이 `ram_role_arn`이면 `mc.access_key`, `mc.secret_key`, `mc.ram_role_arn`을 구성해야 합니다.
    3. `mc.auth.type`이 `ecs_ram_role`이면 `mc.ecs_ram_role`을 구성해야 합니다.
    4. `mc.access_key`와 `mc.secret_key`를 사용할 때는 반드시 함께 구성해야 합니다.

    인증 유형별 SQL 예제는 [기본 예제](#basic-example)를 참고하세요.

* `{McRequiredProperties}`

    | 속성 이름 | 설명 | 지원되는 Doris 버전 |
    | --- | --- | --- |
    | `mc.default.project` | 접근할 MaxCompute 프로젝트의 이름입니다. [MaxCompute 프로젝트 목록](https://maxcompute.console.aliyun.com/cn-beijing/project-list)에서 프로젝트를 생성하고 관리할 수 있습니다. | |
    | `mc.region` | MaxCompute가 활성화된 리전입니다. Endpoint에서 해당 리전을 확인할 수 있습니다. | 2.1.7 미만 |
    | `mc.endpoint` | MaxCompute가 활성화된 리전입니다. 구성 방법은 아래의 "Endpoint 및 Quota 확인 방법" 섹션을 참고하세요. | 2.1.7 이상 |

* `{McOptionalProperties}`

    | 속성 이름 | 기본값 | 설명 | 지원되는 Doris 버전 |
    | --- | --- | --- | --- |
    | `mc.tunnel_endpoint` | 없음 | 부록의 "사용자 지정 서비스 주소"를 참고하세요. | 2.1.7 미만 |
    | `mc.odps_endpoint` | 없음 | 부록의 "사용자 지정 서비스 주소"를 참고하세요. | 2.1.7 미만 |
    | `mc.quota` | `pay-as-you-go` | Quota 이름입니다. 구성 방법은 아래의 "Endpoint 및 Quota 확인 방법" 섹션을 참고하세요. | 2.1.7 이상 |
    | `mc.split_strategy` | `byte_size` | Split 분할 방식을 설정합니다. 바이트 크기 기준인 `byte_size` 또는 행 수 기준인 `row_count`로 설정할 수 있습니다. | 2.1.7 이상 |
    | `mc.split_byte_size` | `268435456` | 각 Split이 읽는 파일 크기이며, 단위는 바이트입니다. 기본값은 256 MB입니다. `"mc.split_strategy" = "byte_size"`인 경우에만 적용됩니다. | 2.1.7 이상 |
    | `mc.split_row_count` | `1048576` | 각 Split이 읽는 행 수입니다. `"mc.split_strategy" = "row_count"`인 경우에만 적용됩니다. | 2.1.7 이상 |
    | `mc.split_cross_partition` | `false` | 생성된 Split이 파티션 경계를 넘을 수 있는지 지정합니다. | 2.1.8 이상 |
    | `mc.connect_timeout` | `10s` | MaxCompute 연결 타임아웃입니다. | 2.1.8 이상 |
    | `mc.read_timeout` | `120s` | MaxCompute 읽기 타임아웃입니다. | 2.1.8 이상 |
    | `mc.retry_count` | `4` | 타임아웃 후 재시도 횟수입니다. | 2.1.8 이상 |
    | `mc.datetime_predicate_push_down` | `true` | `timestamp/timestamp_ntz` 타입에 조건자 푸시다운을 허용할지 지정합니다. Doris는 이 두 타입을 동기화할 때 정밀도가 낮아집니다(9 -> 6). 따라서 원본 데이터의 정밀도가 6자리를 초과하면 조건자 푸시다운으로 인해 결과가 부정확해질 수 있습니다. | 2.1.9/3.0.5 이상 |
    | `mc.account_format` | `name` | Alibaba Cloud 국제 사이트와 중국 사이트의 계정 체계는 서로 다릅니다. 국제 사이트 사용자가 `user 'RAM$xxxxxx:xxxxx' is not a valid aliyun account`와 같은 오류를 겪는 경우, 이 매개변수를 `id`로 설정할 수 있습니다. | 3.0.9/3.1.1 이상 |
    | `mc.enable.namespace.schema` | `false` | MaxCompute 스키마 계층을 지원할지 지정합니다. 참고: https://help.aliyun.com/zh/maxcompute/user-guide/schema-related-operations | 3.1.3 이상 |
    | `mc.max_field_size_bytes` | `8388608` (8 MB) | 쓰기 세션에서 단일 필드에 허용되는 최대 바이트 수입니다. 큰 문자열 또는 바이너리 필드가 포함된 데이터를 쓸 때 필드 크기가 이 값을 초과하면 쓰기가 실패할 수 있습니다. 실제 데이터에 맞게 이 값을 늘릴 수 있습니다. | 4.1.0 이상 |
    | `test_connection` | `false` | Catalog 생성 시 연결 가능 여부를 검증할지 지정합니다. `true`로 설정하면 Doris가 AK/SK, endpoint 및 `mc.project`에 접근할 수 있는지 확인합니다. `mc.enable.namespace.schema`가 활성화되어 있으면 스키마 목록에도 접근할 수 있어야 합니다. 검사에 실패하면 `CREATE CATALOG`가 즉시 실패합니다. | 4.1.4 이상 |

    > 4.1.4 버전부터 `mc.connect_timeout`, `mc.read_timeout`, `mc.retry_count`가 실제로 하위 REST 클라이언트에 적용됩니다. 이전 버전에서는 이 세 속성을 설정할 수 있었지만 효과는 없었습니다.

    - `mc.max_field_size_bytes`

        MaxCompute는 기본적으로 필드당 최대 8 MB를 허용합니다. 쓰려는 데이터에 큰 문자열 또는 바이너리 필드가 포함되어 있으면 쓰기가 실패할 수 있습니다.

        이 제한을 조정하려면 먼저 MaxCompute 콘솔의 SQL 편집기에서 다음 명령을 실행하세요:

        `setproject odps.sql.cfile2.field.maxsize=262144;`

        이 명령은 단일 필드의 최대 바이트 수를 조정합니다. 단위는 KB이며 최대값은 262144입니다.

        그런 다음 Doris Catalog 속성에서 `mc.max_field_size_bytes`를 해당 바이트 값으로 설정하세요. 이 값은 MaxCompute 설정값을 초과해서는 안 됩니다.

* `{CommonProperties}`

    CommonProperties 섹션에는 공통 속성을 입력합니다. [Catalog 개요](../catalog-overview.md)의 "공통 속성" 섹션을 참고하세요.

## 메타데이터 캐시 {#meta-cache}

Apache Doris는 외부 데이터 소스에 접근하는 성능을 높이기 위해 MaxCompute 메타데이터를 캐시합니다. 메타데이터에는 테이블 스키마와 파티션 목록이 포함됩니다.

:::tip
Doris 4.1.x 이전 버전에서는 주로 FE 구성 항목을 통해 메타데이터 캐싱을 전역으로 제어합니다. 자세한 내용은 [메타데이터 캐시](../meta-cache.md)를 참고하세요.
Doris 4.1.x부터 MaxCompute Catalog의 외부 메타데이터 캐시는 통합된 `meta.cache.*` 키를 사용하여 구성합니다. 아래 항목은 현재 버전을 설명합니다. Doris 4.1.x 및 4.2.x는 다른 항목 집합을 사용하며, 이 페이지의 4.x 버전에서 설명합니다.
:::

### 캐시 속성 구성 {#meta-cache-unified-model}

각 캐시 항목은 통합된 구성 키 형식인 `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity,max-weight}`를 사용합니다. MaxCompute의 `<engine>`은 `max_compute`입니다.

| 속성 | 예제 | 의미 |
|---|---|---|
| `enable` | `true/false` | 이 캐시 항목을 활성화할지 지정합니다. |
| `ttl-second` | `600`, `0`, `-1` | `0`은 항목을 비활성화합니다(즉시 적용되며, 최신 데이터를 확인하는 데 사용할 수 있음). `-1`은 만료되지 않음을 의미합니다. 그 외 양의 정수는 접근 시점을 기준으로 한 TTL을 초 단위로 나타냅니다. |
| `capacity` | `10000` | 개수 기준 최대 캐시 항목 수입니다. `0`은 항목을 비활성화합니다. |
| `max-weight` | `1GB` | Doris 4.1.4부터 지원됩니다. 항목이 보유하는 추정 메모리의 한도이며, 선택적으로 설정합니다. 양수여야 하며 `0`은 허용되지 않습니다. 아래에 표시된 항목만 지원합니다. |

**적용 조건:** 항목은 `enable=true`, `ttl-second != 0`, `capacity > 0`일 때 적용됩니다. FE 전체, Catalog 또는 항목 수준의 메모리 한도는 추정 메모리를 기준으로 캐시 수용 여부를 추가로 제어합니다. [외부 메타데이터 캐시 메모리 관리](../external-meta-cache-memory-management)를 참고하세요.

### 캐시 모듈 {#meta-cache-unified-modules}

MaxCompute Catalog에는 다음 캐시 항목이 있으며, 이 항목은 `max-weight`를 지원합니다:

| 항목 (`<entry>`) | 속성 키 접두사 | `ENTRY_NAME` | 캐시 내용 및 영향 | 기본 활성화 여부 / TTL / 용량 |
|---|---|---|---|---|
| `partition` | `meta.cache.max_compute.partition.` | `max-compute-partition` | 테이블의 파티션 목록입니다. 영향: 파티션 프루닝 및 열거에 사용됩니다. 비활성화하면 새 파티션이 즉시 표시됩니다. | `true` / 600 s / 10000 |

MaxCompute 테이블의 열 스키마는 공유 `default` 엔진(`meta.cache.default.schema.*`)에 캐시됩니다.

### 기존 매개변수 매핑 및 변환 {#meta-cache-mapping}

| 기존 속성 키 | 통합 키 | 설명 |
|---|---|---|
| `schema.cache.ttl-second` | `meta.cache.default.schema.ttl-second` | 테이블 스키마 캐시의 만료 시간 |

### 권장 사항 {#meta-cache-best-practices}

* **최신 데이터에 실시간으로 접근**: 각 쿼리에서 MaxCompute 테이블의 최신 파티션을 확인하려면 파티션 캐시 TTL을 `0`으로 설정하세요.
  ```sql
  -- Disable the partition listing cache to detect the latest partitions of MaxCompute tables
  ALTER CATALOG mc_ctl SET PROPERTIES ("meta.cache.max_compute.partition.ttl-second" = "0");
  ```
* **참고**: Catalog 속성 변경이 성공하면 영향을 받는 메타데이터 캐시가 제거되고, 다음 접근 시 새 구성으로 다시 생성됩니다. `meta.cache.max-weight` 또는 `schema.cache.ttl-second`를 변경하면 해당 Catalog의 모든 캐시가 제거됩니다. `meta.cache.<engine>.<entry>.*`를 변경하면 해당 엔진의 캐시가 제거됩니다. 이미 실행 중인 쿼리에는 영향을 주지 않습니다.

### 관측 가능성 {#meta-cache-unified-observability}

캐시 지표는 `information_schema.catalog_meta_cache_statistics` 시스템 테이블을 통해 확인할 수 있습니다. `ENTRY_NAME`은 위 표에 나열된 이름을 표시하며, `default` 엔진 행은 공유 테이블 스키마 캐시를 나타냅니다:

```sql
SELECT engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, max_weight, estimated_weight
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'mc_ctl'
ORDER BY engine_name, entry_name;
```

이 시스템 테이블에 대한 문서를 참고하세요: [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md).

### 지원되는 MaxCompute 버전 {#supported-maxcompute-versions}

MaxCompute의 퍼블릭 클라우드 버전만 지원됩니다. 프라이빗 클라우드 버전 지원이 필요한 경우 Doris 커뮤니티 지원팀에 문의하세요.

### 지원되는 MaxCompute 테이블 {#supported-maxcompute-tables}

* 파티션 테이블, 클러스터 테이블 및 구체화된 뷰 읽기를 지원합니다.

* MaxCompute 외부 테이블, 논리 뷰 또는 Delta Tables 읽기는 지원하지 않습니다.

## 계층 매핑 {#hierarchy-mapping}

- `mc.enable.namespace.schema`가 `false`인 경우

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | N/A |
  | 데이터베이스 | 프로젝트 |
  | 테이블 | 테이블 |

- `mc.enable.namespace.schema`가 `true`인 경우

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | 프로젝트 |
  | 데이터베이스 | 스키마 |
  | 테이블 | 테이블 |

## 열 타입 매핑 {#column-type-mapping}

| MaxCompute 타입 | Doris 타입 | 설명 |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| boolean | boolean | |
| tiny | tinyint | |
| tinyint | tinyint | |
| smallint | smallint | |
| int | int | |
| bigint | bigint | |
| float | float | |
| double | double | |
| decimal(P, S) | decimal(P, S) | 1 <= P <= 38, 0 <= S <= 18 |
| char(N) | char(N) | |
| varchar(N) | varchar(N) | |
| string | string | |
| date | date | |
| datetime | datetime(3) | 정밀도 3으로 고정 매핑됩니다. `SET [GLOBAL] time_zone = 'Asia/Shanghai'`로 시간대를 지정할 수 있습니다. |
| timestamp_ntz | datetime(6) | MaxCompute의 `timestamp_ntz` 정밀도는 9이지만 Doris의 DATETIME 최대 정밀도는 6이므로, 데이터를 읽을 때 초과 부분이 잘립니다. |
| timestamp | datetime(6) | 2.1.9/3.0.5부터 지원됩니다. MaxCompute의 `timestamp` 정밀도는 9이지만 Doris의 DATETIME 최대 정밀도는 6이므로, 데이터를 읽을 때 초과 부분이 잘립니다. |
| array | array | |
| map | map | |
| struct | struct | |
| 기타 | UNSUPPORTED | |

## 기본 예제 {#basic-example}

기본 `ak_sk` 인증:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.access_key' = 'AKxxxxx',
    'mc.secret_key' = 'SKxxxxx',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

`ram_role_arn` 인증(4.0.4+):

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.auth.type' = 'ram_role_arn',
    'mc.access_key' = 'AKxxxxx',
    'mc.secret_key' = 'SKxxxxx',
    'mc.ram_role_arn' = 'acs:ram::<your_account_id>:role/<your_role_name>',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

`ecs_ram_role` 인증(4.0.4+):

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.auth.type' = 'ecs_ram_role',
    'mc.ecs_ram_role' = '<your_ecs_ram_role_name>',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.maxcompute.aliyun-inc.com/api'
);
```

2.1.7 미만 버전을 사용하는 경우 다음 문을 사용하세요(2.1.8 이상으로 업그레이드하는 것을 권장합니다):

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk',
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com'
);
```

스키마 지원을 사용하는 경우:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk',
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com',
    'mc.enable.namespace.schema' = 'true'
);
```

## 쿼리 작업 {#query-operations}

### 기본 쿼리 {#basic-query}

```sql
-- 1. Switch to Catalog, use database and query
SWITCH mc_ctl;
USE mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 2. Use mc database directly
USE mc_ctl.mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 3. Use full qualified name to query
SELECT * FROM mc_ctl.mc_db.mc_tbl LIMIT 10;
```

### 쿼리 최적화 {#query-optimization}

- LIMIT 쿼리 최적화(4.1.0부터)

    이 매개변수는 데이터 존재 여부를 확인하기 위해 `LIMIT 1`을 자주 사용하는 시나리오에만 적용됩니다.

    MaxCompute 테이블을 쿼리할 때 쿼리에 파티션 열의 동등 조건자(`=` 또는 `IN`)와 `LIMIT` 절만 포함되어 있으면, 세션 변수 `enable_mc_limit_split_optimization`을 활성화하여 Split 생성 전략을 최적화할 수 있습니다.

    활성화하면 시스템은 `row_offset` 전략을 사용하여 전체 데이터에 대한 Split을 생성하는 대신 필요한 수의 행만 읽습니다. 이를 통해 Split 수를 여러 개에서 정확히 하나로 줄여 쿼리 지연 시간을 크게 단축할 수 있습니다.

    이 최적화는 다음과 같은 쿼리에 적용됩니다:

    ```sql
    SELECT * FROM mc_tbl WHERE pt = 'value' LIMIT 100;
    SELECT * FROM mc_tbl WHERE pt IN ('v1', 'v2') LIMIT 100;
    ```

    활성화 방법:

    ```sql
    SET enable_mc_limit_split_optimization = true;
    ```

    > 이 매개변수는 기본적으로 비활성화되어 있습니다. 쿼리에 비파티션 열 필터나 동등 조건자가 아닌 조건자(예: `>`, `<`, `!=`)가 포함되어 있거나 `LIMIT` 절이 없으면 최적화가 적용되지 않습니다.

## 쓰기 작업 {#write-operations}

4.1.0 버전부터 Doris는 MaxCompute 테이블에 대한 쓰기 작업을 지원합니다. 표준 INSERT 문을 사용하여 Doris를 통해 다른 데이터 소스의 데이터를 MaxCompute 테이블에 직접 쓸 수 있습니다.

:::note
- 이 기능은 실험적 기능이며, 4.1.0 버전부터 지원됩니다.
- 파티션 테이블과 비파티션 테이블 모두에 쓰기를 지원합니다.
- 클러스터 테이블, 트랜잭션 테이블, Delta Tables 또는 외부 테이블에 쓰기는 지원하지 않습니다.
:::

### INSERT INTO {#insert-into}

INSERT 작업은 대상 테이블에 데이터를 추가합니다.

예제:

```sql
INSERT INTO mc_tbl values (val1, val2, val3, val4);
INSERT INTO mc_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO mc_tbl(col1, col2) values (val1, val2);
INSERT INTO mc_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");

-- Write to specified partition (you can specify only some partition columns, with remaining partitions written dynamically)
INSERT INTO mc_tbl PARTITION(ds='20250201') SELECT id, name FROM source_tbl;
INSERT INTO mc_tbl PARTITION(ds='20250101', region='bj') VALUES (1, 'v1'), (2, 'v2');
```

### INSERT OVERWRITE {#insert-overwrite}

INSERT OVERWRITE는 테이블의 기존 데이터를 새 데이터로 완전히 덮어씁니다.

```sql
INSERT OVERWRITE TABLE mc_tbl VALUES(val1, val2, val3, val4);
INSERT OVERWRITE TABLE mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Write to specified partition
INSERT OVERWRITE TABLE mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```

### CTAS {#ctas}

`CTAS` 문을 사용하여 MaxCompute 테이블을 생성하고 데이터를 쓸 수 있습니다:

```sql
CREATE TABLE mc_tbl AS SELECT * FROM other_table;
```

## 데이터베이스 및 테이블 관리 {#database-and-table-management}

4.1.0 버전부터 Doris는 MaxCompute 데이터베이스와 테이블의 생성 및 삭제를 지원합니다.

:::note
- 이 기능은 실험적 기능이며, 4.1.0 버전부터 지원됩니다.
- 파티션 테이블과 비파티션 테이블의 생성 및 삭제를 지원합니다.
- 클러스터 테이블, 트랜잭션 테이블, Delta Tables 또는 외부 테이블 생성은 지원하지 않습니다.
:::

데이터베이스나 테이블을 생성하거나 삭제할 때 Doris는 해당 MaxCompute API를 호출하여 작업을 수행합니다. 작업이 반환된 후 MaxCompute 측의 메타데이터 변경 사항이 후속 작업에 완전히 반영되기까지는 짧은 시간이 필요합니다.

이 기능은 `mc.enable.namespace.schema` 속성이 `true`로 설정된 경우에만 사용할 수 있습니다.

### 데이터베이스 생성 및 삭제 {#creating-and-dropping-databases}

`SWITCH` 문을 사용하여 해당 Catalog로 전환한 다음 `CREATE DATABASE` 문을 실행할 수 있습니다:

```sql
SWITCH mc;
CREATE DATABASE [IF NOT EXISTS] mc_schema;
```

전체 정규화된 이름을 사용하여 생성할 수도 있습니다:

```sql
CREATE DATABASE [IF NOT EXISTS] mc.mc_schema;
```

데이터베이스 삭제:

```sql
DROP DATABASE [IF EXISTS] mc.mc_schema;
```

:::caution
MaxCompute 데이터베이스를 삭제하면 그 안의 모든 테이블도 함께 삭제됩니다.
:::

### 테이블 생성 및 삭제 {#creating-and-dropping-tables}

* **생성**

  Doris는 MaxCompute에서 파티션 테이블 또는 비파티션 테이블 생성을 지원합니다.

  예제:

  ```sql
  CREATE TABLE mc_schema.mc_tbl1 (
      bool_col BOOLEAN,
      int_col INT,
      bigint_col BIGINT,
      float_col FLOAT,
      double_col DOUBLE,
      decimal_col DECIMAL(18,6),
      string_col STRING,
      varchar_col VARCHAR(200),
      char_col CHAR(50),
      date_col DATE,
      datetime_col DATETIME,
      arr_col ARRAY<STRING>,
      map_col MAP<STRING, STRING>,
      struct_col STRUCT<f1:STRING, f2:INT>
  );

  CREATE TABLE mc_schema.mc_tbl2 (
    id INT,
    val STRING,
    ds STRING,
    region STRING
  )
  PARTITION BY (ds, region)();
  ```

* **삭제**

  `DROP TABLE` 문을 사용하여 MaxCompute 테이블을 삭제할 수 있습니다. 현재 테이블을 삭제하면 파티션 데이터를 포함한 데이터도 함께 삭제됩니다.

  예제:

  ```sql
  DROP TABLE [IF EXISTS] mc_tbl;
  ```

## 자주 묻는 질문 {#faq}

### Endpoint 및 Quota 확인 방법(Doris 2.1.7 이상에 적용) {#how-to-obtain-endpoint-and-quota-applicable-for-doris-217-and-later}

1. 데이터 전송 서비스에 전용 리소스 그룹을 사용하는 경우

    이 [문서](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts)의 "전용 데이터 서비스 리소스 그룹 사용" 장에 있는 "2. 권한 부여" 섹션을 참고하여 필요한 권한을 활성화하세요. "Quota 관리" 목록에서 해당 `QuotaName`을 확인하고 복사한 뒤 `"mc.quota" = "QuotaName"`을 지정하세요. 이 경우 VPC 또는 퍼블릭 네트워크를 통해 MaxCompute에 접근할 수 있습니다. VPC는 대역폭이 보장되지만 퍼블릭 네트워크의 대역폭 리소스는 제한적입니다.

2. 사용량 기반 과금 방식을 사용하는 경우

    이 [문서](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)의 "Open Storage 사용(사용량 기반 과금)" 섹션을 참고하여 Open Storage(Storage API) 스위치를 활성화하고 AK와 SK에 해당하는 사용자에게 권한을 부여하세요. 이 경우 `mc.quota`는 기본값인 `pay-as-you-go`를 사용하므로 이 값을 별도로 지정할 필요가 없습니다. 사용량 기반 과금 방식에서는 VPC를 통해서만 MaxCompute에 접근할 수 있으며, 퍼블릭 네트워크로는 접근할 수 없습니다. 선불 사용자만 퍼블릭 네트워크를 통해 MaxCompute에 접근할 수 있습니다.

3. `mc.endpoint`는 "리전 Endpoint 참조 표"에 따라 구성하세요. 해당 표는 [Alibaba Cloud Endpoint 문서](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)에서 확인할 수 있습니다.

    VPC를 통해 접근하는 사용자는 "리전별 Endpoint 참조 표(Alibaba Cloud VPC 네트워크 연결 방식)"의 "VPC 네트워크 Endpoint" 열에 따라 `mc.endpoint`를 구성해야 합니다. 퍼블릭 네트워크를 통해 접근하는 사용자는 "리전별 Endpoint 참조 표(Alibaba Cloud 클래식 네트워크 연결 방식)"의 "클래식 네트워크 Endpoint" 열 또는 "리전별 Endpoint 참조 표(외부 네트워크 연결 방식)"의 "외부 네트워크 Endpoint" 열에서 선택하여 `mc.endpoint`를 구성할 수 있습니다.

### 사용자 지정 서비스 주소(Doris 2.1.7 이전 버전에 적용) {#custom-service-address-applicable-for-versions-before-doris-217}

Doris 2.1.7 이전 버전에서는 Tunnel SDK를 사용하여 MaxCompute와 상호작용하므로, 다음 두 Endpoint 속성이 필요합니다:

* `mc.odps_endpoint`: MaxCompute Endpoint로, MaxCompute 메타데이터(데이터베이스 및 테이블 정보)를 가져오는 데 사용됩니다.

* `mc.tunnel_endpoint`: Tunnel Endpoint로, MaxCompute 데이터를 읽는 데 사용됩니다.

기본적으로 MaxCompute Catalog는 `mc.region`과 `mc.public_access`를 기반으로 Endpoint를 생성합니다.

생성 형식은 다음과 같습니다:

| `mc.public_access` | `mc.odps_endpoint` | `mc.tunnel_endpoint` |
| --- | --- | --- |
| `false` | `http://service.{mc.region}.maxcompute.aliyun-inc.com/api` | `http://dt.{mc.region}.maxcompute.aliyun-inc.com` |
| `true` | `http://service.{mc.region}.maxcompute.aliyun.com/api` | `http://dt.{mc.region}.maxcompute.aliyun.com` |

사용자는 `mc.odps_endpoint`와 `mc.tunnel_endpoint`를 개별적으로 지정하여 서비스 주소를 사용자 지정할 수도 있습니다. 이는 자체 배포된 MaxCompute 환경에 적합합니다.

MaxCompute Endpoint 및 Tunnel Endpoint 구성 방법은 [리전 및 네트워크 연결 방식별 Endpoint](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)를 참고하세요.

### 리소스 사용량 제어 {#resource-usage-control}

사용자는 [테이블 수준 요청 동시성](https://help.aliyun.com/zh/maxcompute/user-guide/data-transfer-service-quota-manage?spm=a2c4g.11186623.help-menu-search-27797.d_2)을 두 세션 변수 `parallel_pipeline_task_num`과 `num_scanner_threads`로 조정하여 데이터 전송 서비스의 리소스 소비를 제어할 수 있습니다. 해당 동시성은 `max(parallel_pipeline_task_num * be num * num_scanner_threads)`와 같습니다.

참고:

1. 이 방법은 단일 쿼리 내 단일 테이블의 동시 요청 수만 제어할 수 있으며, 여러 SQL 문에 걸친 리소스 사용량은 제어할 수 없습니다.

2. 동시성을 낮추면 쿼리 실행 시간이 늘어납니다.

### 쓰기 권장 사항 {#write-best-practices}

- 가능한 한 파티션을 지정하여 쓰는 것을 권장합니다. 예: `INSERT INTO mc_tbl PARTITION(ds='20250201')`. 파티션을 지정하지 않으면 MaxCompute Storage API의 제한으로 인해 각 파티션의 데이터를 순차적으로 써야 합니다. 따라서 실행 계획은 파티션 열을 기준으로 데이터를 정렬하며, 데이터양이 많으면 상당한 메모리 리소스를 소비하여 쓰기가 실패할 수 있습니다.

- 파티션을 지정하지 않고 쓸 때는 `SET enable_strict_consistency_dml = false`를 설정하지 마세요. 이 설정은 정렬 노드를 강제로 제거하여 파티션 데이터가 순서 없이 쓰이게 하며, 결국 MaxCompute에서 오류가 발생합니다.

- `LIMIT` 절을 추가하지 마세요. `LIMIT` 절이 추가되면 Doris는 쓰기 건수를 보장하기 위해 단일 스레드만 사용하여 데이터를 씁니다. 소규모 테스트에는 사용할 수 있지만, `LIMIT` 값이 크면 쓰기 성능이 저하됩니다.

### 쓰기 오류: `Data invalid: ODPS-0020041:StringOutOfMaxLength` {#write-error-data-invalid-odps-0020041stringoutofmaxlength}

`mc.max_field_size_bytes`에 대한 설명을 참고하세요.
