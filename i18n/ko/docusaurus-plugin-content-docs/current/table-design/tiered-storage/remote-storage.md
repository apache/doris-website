---
{
    "title": "로컬-원격 계층형 스토리지",
    "language": "ko",
    "description": "Apache Doris 원격 스토리지는 콜드 데이터를 S3 호환 오브젝트 스토리지 또는 HDFS로 자동 마이그레이션하여 로컬 스토리지 비용을 줄입니다. 핫-콜드 데이터 계층화 시나리오에 적합합니다.",
    "keywords": [
        "Doris 원격 스토리지",
        "핫-콜드 계층화",
        "콜드 데이터 아카이빙",
        "S3 오브젝트 스토리지",
        "HDFS 스토리지",
        "Storage Policy",
        "cooldown_ttl"
    ]
}
---

<!-- Knowledge type: Feature overview + Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Hot-cold data tiering / Reducing storage costs / Historical data archiving -->


로컬-원격 계층형 스토리지는 Apache Doris가 제공하는 핫-콜드 데이터 계층화 기능입니다. 콜드 데이터를 외부 스토리지 시스템(S3 호환 오브젝트 스토리지 또는 HDFS 등)으로 자동 마이그레이션하여 로컬 디스크 사용량과 전체 스토리지 비용을 줄입니다.

**적용 시나리오**:

- 과거 데이터 아카이빙: 접근 빈도가 낮은 과거 데이터를 저비용 오브젝트 스토리지로 마이그레이션합니다.
- 핫-콜드 계층화: 핫 데이터는 로컬 SSD/HDD에 유지하고, 콜드 데이터는 원격 스토리지로 옮깁니다.
- 스토리지 비용 최적화: 로컬 고성능 스토리지를 오브젝트 스토리지로 대체하여 TCO를 줄입니다.

:::warning 참고
원격 스토리지의 데이터는 **복제본이 하나뿐입니다**. 데이터 신뢰성은 원격 스토리지 자체의 신뢰성 보장에 달려 있습니다. 원격 스토리지에서 EC (erasure coding) 또는 다중 복제본 메커니즘이 활성화되어 있는지 확인하세요.
:::

## 빠른 탐색 {#quick-navigation}

| 섹션 | 내용 |
| --- | --- |
| [S3 호환 스토리지에 콜드 데이터 저장](#storing-cold-data-on-s3-compatible-storage) | 콜드 데이터를 S3 호환 오브젝트 스토리지로 옮기기 |
| [HDFS에 콜드 데이터 저장](#storing-cold-data-on-hdfs) | 콜드 데이터를 HDFS로 옮기기 |
| [기존 테이블의 데이터를 원격 스토리지로 이전](#cooling-down-existing-tables-to-remote-storage) | 기존 테이블 또는 파티션에 원격 스토리지 구성하기 |
| [Compaction 구성](#configuring-compaction) | 원격 스토리지의 Compaction 동작 조정하기 |
| [제한 사항](#limitations) | 원격 스토리지의 기능 제한 |
| [콜드 데이터 공간 관리](#cold-data-space-management) | 콜드 데이터 조회 및 공간 회수하기 |
| [쿼리 및 성능 최적화](#query-and-performance-optimization) | 로컬 Cache 메커니즘 |
| [FAQ](#faq) | 오류 해결 및 구성 참고 사항 |

## 사용 방법 {#usage}

<!-- Knowledge type: Operation steps -->

원격 스토리지 작업 흐름은 **Resource 생성, Storage Policy 생성, 테이블 생성 또는 변경 시 Policy 연결**의 세 단계로 이루어집니다.

### S3 호환 스토리지에 콜드 데이터 저장 {#storing-cold-data-on-s3-compatible-storage}

<!-- Applicable scenarios: Use AWS S3, MinIO, Alibaba Cloud OSS, Tencent Cloud COS, or other object storage -->

#### 1단계: S3 Resource 생성 {#step-1-create-an-s3-resource}

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000"
);
```

:::tip
S3 Resource를 생성하면 원격 연결 검사를 수행하여 Resource 구성이 올바른지 확인합니다.
:::

#### 2단계: Storage Policy 생성 {#step-2-create-a-storage-policy}

이전 단계에서 생성한 Resource를 연결합니다.

```sql
CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);
```

#### 3단계: 테이블 생성 시 Storage Policy 사용 {#step-3-use-the-storage-policy-when-creating-a-table}

```sql
CREATE TABLE IF NOT EXISTS create_table_use_created_policy
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```

:::warning 참고
`"enable_unique_key_merge_on_write" = "true"`로 설정된 Unique 테이블은 원격 스토리지를 사용할 수 없습니다.
:::

### HDFS에 콜드 데이터 저장 {#storing-cold-data-on-hdfs}

<!-- Applicable scenarios: An existing Hadoop/HDFS cluster is used as the cold data storage pool -->

#### 1단계: HDFS Resource 생성 {#step-1-create-an-hdfs-resource}

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
    "type" = "hdfs",
    "fs.defaultFS" = "fs_host:default_fs_port",
    "hadoop.username" = "hive",
    "hadoop.password" = "hive",
    "root_path" = "/my/root/path",
    "dfs.nameservices" = "my_ha",
    "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
    "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
    "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
    "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

#### 2단계: Storage Policy 생성 {#step-2-create-a-storage-policy-1}

```sql
CREATE STORAGE POLICY test_policy PROPERTIES (
    "storage_resource" = "remote_hdfs",
    "cooldown_ttl" = "300"
);
```

#### 3단계: Storage Policy를 사용하는 테이블 생성 {#step-3-create-a-table-that-uses-the-storage-policy}

```sql
CREATE TABLE IF NOT EXISTS create_table_use_created_policy (
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```

:::warning 참고
`"enable_unique_key_merge_on_write" = "true"`로 설정된 Unique 테이블은 원격 스토리지를 사용할 수 없습니다.
:::

### 기존 테이블의 데이터를 원격 스토리지로 이전 {#cooling-down-existing-tables-to-remote-storage}

<!-- Applicable scenarios: Existing tables or partitions that need remote storage capability added -->

Doris는 새 테이블 생성뿐 아니라 기존 테이블 또는 파티션(PARTITION)에 원격 스토리지를 구성하는 기능도 지원합니다.

**테이블 전체에 원격 스토리지 구성**:

```sql
ALTER TABLE create_table_not_have_policy SET ("storage_policy" = "test_policy");
```

**특정 파티션에 원격 스토리지 구성**:

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy" = "test_policy");
```

:::tip 테이블 수준 및 파티션 수준 Policy의 우선순위
테이블 생성 시 테이블 전체와 일부 파티션에 **서로 다른** Storage Policy를 지정하면 파티션 수준 Policy는 무시되고, 테이블의 모든 파티션에 테이블 수준 Policy가 적용됩니다.

특정 파티션에 다른 Policy를 지정하려면 위에 나온 `ALTER TABLE ... MODIFY PARTITION` 문을 사용하세요.

구문에 대한 자세한 내용은 다음을 참고하세요.

- [CREATE RESOURCE](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE)
- [CREATE STORAGE POLICY](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY)
- [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)
- [ALTER TABLE](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN)
:::

### Compaction 구성 {#configuring-compaction}

<!-- Knowledge type: Configuration parameters -->

원격 스토리지의 Compaction 동작은 BE 매개변수로 제어합니다.

| 매개변수 | 기본값 | 단위 | 설명 |
| --- | --- | --- | --- |
| `cold_data_compaction_thread_num` | 2 | 개 | 원격 스토리지 Compaction의 동시 실행 스레드 수 |
| `cold_data_compaction_interval_sec` | 1800 | 초 | 원격 스토리지 Compaction의 실행 간격(기본값 30분) |

## 제한 사항 {#limitations}

<!-- Knowledge type: Functional limitations -->

원격 스토리지에는 다음과 같은 제한 사항이 있습니다.

- 원격 스토리지를 사용하는 테이블은 **백업을 지원하지 않습니다**.
- 원격 스토리지의 위치 정보(endpoint, bucket, path 등)는 **수정할 수 없습니다**.
- Merge-on-Write가 활성화된 Unique 모델 테이블은 원격 스토리지를 **지원하지 않습니다**.
- Storage Policy는 생성, 수정 및 삭제할 수 있습니다. **삭제하기 전에 해당 Storage Policy를 참조하는 테이블이 없는지 확인해야 합니다**.
- 테이블에 Storage Policy를 설정하면 **설정을 해제할 수 없습니다**.

## 콜드 데이터 공간 관리 {#cold-data-space-management}

### 콜드 데이터 사용량 조회 {#viewing-cold-data-usage}

콜드 데이터의 공간 사용량은 두 가지 방법으로 조회할 수 있습니다.

| 방법 | 명령 | 필드 | 참고 사항 |
| --- | --- | --- | --- |
| 방법 1 | `SHOW PROC '/backends'` | `RemoteUsedCapacity` | 각 BE가 업로드한 객체의 전체 크기를 조회합니다. **반영에 약간의 지연이 있습니다** |
| 방법 2 | `SHOW TABLETS FROM tableName` | `RemoteDataSize` | 각 Tablet이 차지하는 객체 크기를 조회합니다 |

### 가비지 컬렉션 {#garbage-collection}

원격 스토리지에서 가비지 데이터가 발생할 수 있는 상황은 다음과 같습니다.

1. Rowset 업로드가 실패했지만 일부 Segment는 업로드에 성공한 경우.
2. 업로드된 Rowset이 여러 복제본 간에 일치하지 않는 경우.
3. Compaction이 완료된 후, 해당 Compaction에 참여했던 이전 Rowset이 남아 있는 경우.

**공간 회수 정책**: 가비지 데이터는 즉시 정리되지 않습니다. 회수 간격은 BE 매개변수 `remove_unused_remote_files_interval_sec`로 제어하며, 기본값은 `21600`초(6시간)입니다.

## 쿼리 및 성능 최적화 {#query-and-performance-optimization}

<!-- Knowledge type: Performance optimization -->

Doris는 쿼리 성능을 최적화하고 오브젝트 스토리지 API 호출 비용을 절감하기 위해 **로컬 Cache** 메커니즘을 도입했습니다. 원격 스토리지의 데이터를 처음 쿼리하면 Doris는 해당 데이터를 BE 로컬 디스크에 적재하여 캐시로 사용합니다.

**Cache 특성**:

- 캐시는 BE 로컬 디스크에 저장되며 **메모리를 사용하지 않습니다**.
- 캐시는 LRU(가장 오랫동안 사용되지 않은 항목을 먼저 제거) 정책으로 관리되며 **TTL을 지원하지 않습니다**.

구성에 대한 자세한 내용은 [Data Cache](../../lakehouse/data-cache) 문서를 참고하세요.

## FAQ {#faq}

<!-- Knowledge type: Troubleshooting -->

### Q1: S3 Resource 생성 시 `host must not be null` 오류가 발생하면 어떻게 해야 하나요? {#q1-what-should-i-do-if-creating-an-s3-resource-reports-host-must-not-be-null}

**오류 메시지**:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository:
connect to s3 failed: Unable to marshall request to JSON: host must not be null.
```

**원인**: S3 SDK는 기본적으로 virtual-hosted 방식의 접근을 사용하지만, 일부 오브젝트 스토리지 서비스(MinIO 등)는 이 방식을 활성화하지 않았거나 지원하지 않습니다.

**해결 방법**: Resource 구성에 `"use_path_style" = "true"`를 추가하여 path-style 방식의 접근을 강제합니다.

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000",
    "use_path_style" = "true"
);
```

### Q2: `cooldown_ttl`과 같은 쿨다운 매개변수를 수정하면 어떻게 동작하나요? {#q2-how-does-modifying-cooldown-parameters-such-as-cooldown_ttl-behave}

쿨다운 관련 매개변수를 수정하면 변경 사항은 **아직 원격 스토리지로 이전되지 않은 데이터에만 적용됩니다**. 이미 원격 스토리지에 있는 데이터에는 영향을 주지 않습니다.

**예시**: `cooldown_ttl`을 21일에서 7일로 변경해도 이미 원격 스토리지에 있는 데이터는 **로컬로 다시 이동하지 않습니다**.

### Q3: 어떤 테이블 모델이 원격 스토리지를 지원하지 않나요? {#q3-which-table-models-do-not-support-remote-storage}

Unique 모델 테이블은 Merge-on-Write가 활성화된 경우(즉, `"enable_unique_key_merge_on_write" = "true"`) 원격 스토리지를 지원하지 않습니다. 다른 모델(Duplicate, Aggregate, MoW가 비활성화된 Unique)은 모두 지원합니다.

### Q4: 원격 스토리지의 데이터 신뢰성은 어떻게 보장하나요? {#q4-how-is-the-data-reliability-of-remote-storage-guaranteed}

Doris는 원격 스토리지에 **복제본을 하나만** 유지하므로 데이터 신뢰성은 전적으로 원격 스토리지 자체에 달려 있습니다. 데이터를 보호하려면 원격 스토리지에서 **EC (erasure coding)** 또는 **다중 복제본**과 같은 메커니즘을 활성화하는 것이 좋습니다.
