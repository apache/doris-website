---
{
    "title": "컴퓨트 그룹 관리: 생성, 권한 부여, 전환, 확장 및 축소 작업 가이드",
    "sidebar_label": "컴퓨트 그룹 관리",
    "language": "ko",
    "description": "컴퓨팅과 스토리지가 분리된 아키텍처에서 컴퓨트 그룹을 생성하고, 권한을 부여하고, 기본 그룹을 설정하고, 그룹을 전환하고, 확장 및 축소하는 등 모든 관리 작업을 설명합니다.",
    "keywords": ["컴퓨트 그룹", "컴퓨트 그룹", "컴퓨팅과 스토리지 분리", "컴퓨트 그룹 권한 부여", "컴퓨트 그룹 확장 및 축소", "읽기/쓰기 분리", "부하 분산"]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cluster management / Resource isolation / Load distribution -->

컴퓨팅과 스토리지가 분리된 아키텍처에서는 하나 이상의 컴퓨트 노드(BE)를 **컴퓨트 그룹**으로 묶을 수 있습니다. 이 문서는 조회, 추가, 권한 부여, 기본 그룹 설정, 전환, 확장 및 축소를 비롯한 컴퓨트 그룹의 모든 관리 작업을 설명합니다.

:::note 버전 참고
3.0.2 이전 버전에서는 컴퓨트 그룹을 **컴퓨트 클러스터**라고 불렀습니다.
:::

## 컴퓨트 그룹 활용 사례 {#compute-group-use-cases}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Multi-tenant isolation / Read-write separation / Load isolation -->

여러 컴퓨트 그룹을 사용하는 아키텍처에서는 `USE @<compute_group_name>` 문을 사용하여 특정 워크로드를 지정한 컴퓨트 그룹으로 라우팅하고, 서로 다른 유형의 워크로드를 물리적으로 격리할 수 있습니다.

다음 시나리오는 C1과 C2라는 두 컴퓨트 그룹을 가정합니다.

| 시나리오 | 설명 | 사용 방법 |
| :--- | :--- | :--- |
| **읽기 간 격리** | 대규모 쿼리를 각각 별도의 컴퓨트 노드에서 실행하여 CPU/메모리 리소스 경합 방지 | 쿼리 1은 `USE @c1` 사용, 쿼리 2는 `USE @c2` 사용 |
| **읽기/쓰기 격리** | 데이터 적재와 쿼리 간의 리소스 경합 방지. C1은 C2에 새로 적재된 데이터에 접근 가능 | 쿼리는 `USE @c1` 사용, 데이터 적재는 `USE @c2` 사용 |
| **쓰기 간 격리** | 빈번한 소규모 데이터 적재와 대규모 배치 데이터 적재를 별도로 실행하여 상호 간섭 방지 | 소규모 데이터 적재는 `USE @c1` 사용, 배치 데이터 적재는 `USE @c2` 사용 |

:::caution 참고

위의 격리는 CPU와 메모리 같은 컴퓨팅 리소스에 적용됩니다. [피어 캐시 읽기](./file-cache/file-cache-peer-read)는 기본적으로 활성화되어 있으므로, 한 컴퓨트 그룹의 쿼리가 로컬 캐시에서 데이터를 찾지 못하면 다른 컴퓨트 그룹에 있는 BE의 File Cache를 읽을 수 있습니다. 그룹 간 캐시 채우기를 설정한 경우에는 해당 그룹이 쿼리를 대신해 객체 스토리지에서 데이터를 가져오도록 할 수도 있습니다. 이로 인해 컴퓨트 그룹 간의 네트워크, 디스크, 캐시 격리가 약해집니다. 엄격한 격리가 필요하면 BE에서 피어 캐시 읽기를 비활성화하세요.

:::

## 기본 컴퓨트 그룹 선택 방식 {#default-compute-group-selection-mechanism}

<!-- Knowledge type: System behavior description -->

사용자가 명시적으로 [기본 컴퓨트 그룹을 설정](#set-the-default-compute-group)하지 않은 경우, 시스템은 다음 조건을 충족하는 컴퓨트 그룹을 자동으로 선택합니다.

- 컴퓨트 그룹에 활성 상태인 컴퓨트 노드가 하나 이상 있습니다.
- 현재 사용자에게 해당 컴퓨트 그룹의 USAGE_PRIV 권한이 있습니다.

동일한 세션 내에서는 사용자가 명시적으로 변경하지 않는 한 기본 컴퓨트 그룹이 유지됩니다. 세션이 달라지면 다음 조건 중 하나가 발생할 때 시스템이 기본 컴퓨트 그룹을 자동으로 전환할 수 있습니다.

| 전환 조건 | 항상 전환되는지 여부 |
| :--- | :---: |
| 사용자가 이전에 선택된 컴퓨트 그룹의 USAGE_PRIV 권한을 잃음 | 예 |
| 컴퓨트 그룹이 추가되거나 제거됨 | 예 |
| 이전에 선택된 컴퓨트 그룹에 활성 상태인 컴퓨트 노드가 더 이상 없음 | 전환될 수 있음 |

## 모든 컴퓨트 그룹 조회 {#view-all-compute-groups}

<!-- Knowledge type: Operational steps -->

**목적**: 현재 리포지토리의 모든 컴퓨트 그룹을 조회합니다.

**명령**:

```sql
SHOW COMPUTE GROUPS;
```

**설명**: 반환되는 결과는 사용자의 권한 수준에 따라 달라집니다.

- `ADMIN` 권한이 있는 사용자는 모든 컴퓨트 그룹을 조회할 수 있습니다.
- 일반 사용자는 `USAGE_PRIV` 권한이 있는 컴퓨트 그룹만 조회할 수 있습니다.
- 사용자에게 어떤 컴퓨트 그룹의 USAGE_PRIV 권한도 없으면 결과가 비어 있습니다.

## 컴퓨트 그룹 추가 {#add-a-compute-group}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cluster initialization / Adding compute resources -->

**사전 조건**: `OPERATOR` 권한(노드 관리 권한)이 필요합니다. 기본적으로 root 계정만 이 권한을 가집니다. `GRANT` 명령을 사용하여 다른 계정에 이 권한을 부여할 수 있습니다. 자세한 내용은 [권한 관리](../sql-manual/sql-statements/account-management/GRANT-TO)를 참조하세요.

**목적**: BE 노드를 추가하고 컴퓨트 그룹에 할당합니다.

**명령(컴퓨트 그룹 지정)**:

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

**명령(기본 컴퓨트 그룹 사용)**: 컴퓨트 그룹을 지정하지 않으면 노드는 기본적으로 `default_compute_group`에 합류합니다.

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

자세한 내용은 [ADD BACKEND SQL 참조](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND)를 참조하세요.

## 컴퓨트 그룹 접근 권한 부여 {#grant-compute-group-access}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Multi-user permission management -->

**사전 조건**: 현재 사용자에게 `ADMIN` 권한이 있거나 admin 역할에 속해야 합니다.

**목적**: 지정한 사용자에게 컴퓨트 그룹의 USAGE_PRIV 권한을 부여합니다.

**명령**:

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user};
```

## 컴퓨트 그룹 접근 권한 회수 {#revoke-compute-group-access}

<!-- Knowledge type: Operational steps -->

**사전 조건**: 현재 사용자에게 `ADMIN` 권한이 있거나 admin 역할에 속해야 합니다.

**목적**: 지정한 사용자의 컴퓨트 그룹 USAGE_PRIV 권한을 회수합니다.

**명령**:

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user};
```

## 기본 컴퓨트 그룹 설정 {#set-the-default-compute-group}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: User-level resource isolation -->

### 현재 사용자의 기본 그룹 설정 {#set-for-the-current-user}

**사전 조건**: 현재 사용자에게 대상 컴퓨트 그룹의 USAGE_PRIV 권한이 이미 있어야 합니다.

```sql
SET PROPERTY 'default_compute_group' = '{clusterName}';
```

### 다른 사용자의 기본 그룹 설정 {#set-for-another-user}

**사전 조건**: 현재 사용자에게 관리자 권한이 있어야 합니다.

```sql
SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';
```

### 기본 컴퓨트 그룹 조회 {#view-the-default-compute-group}

현재 사용자의 기본 컴퓨트 그룹을 조회합니다. 결과의 `default_compute_group` 값이 기본 컴퓨트 그룹입니다.

```sql
SHOW PROPERTY;
```

다른 사용자의 기본 컴퓨트 그룹을 조회합니다(관리자 권한 필요).

```sql
SHOW PROPERTY FOR {user};
```

### 권한 설명 {#permission-description}

| 사용자 역할 | 작업 가능 범위 |
| :--- | :--- |
| 관리자 사용자(예: `CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`) | 자신과 다른 사용자의 기본 컴퓨트 그룹을 설정할 수 있으며, 자신과 다른 사용자의 `PROPERTY`를 조회할 수 있음 |
| 일반 사용자(예: `CREATE USER jack1 IDENTIFIED BY '123456'`) | 자신의 기본 컴퓨트 그룹만 설정할 수 있고, 자신의 `PROPERTY`만 조회할 수 있으며, 모든 컴퓨트 그룹을 조회할 수는 없음(`GRANT ADMIN` 권한 필요) |

:::caution 참고

- 현재 사용자에게 기본 컴퓨트 그룹이 설정되어 있지 않으면 데이터를 읽거나 쓸 때 오류가 발생합니다. `USE @cluster` 명령으로 현재 세션의 컴퓨트 그룹을 지정하거나, `SET PROPERTY` 문으로 기본 컴퓨트 그룹을 설정하세요.
- 현재 사용자에게 기본 컴퓨트 그룹이 설정되어 있더라도 이후에 해당 컴퓨트 그룹이 삭제되면 데이터를 읽거나 쓸 때 오류가 발생합니다. `USE @cluster` 명령으로 컴퓨트 그룹을 다시 지정하거나, `SET PROPERTY`로 기본 컴퓨트 그룹 설정을 업데이트하세요.

:::

## 컴퓨트 그룹 전환 {#switch-compute-groups}

<!-- Knowledge type: Operational steps -->

**목적**: 컴퓨팅과 스토리지가 분리된 아키텍처에서 현재 세션에 사용할 데이터베이스와 컴퓨트 그룹을 지정합니다.

**구문**:

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

**설명**: 데이터베이스 이름이나 컴퓨트 그룹 이름에 예약 키워드가 포함되어 있으면 해당 이름을 백틱(`` ` ``)으로 감싸세요.

## 컴퓨트 그룹 확장 및 축소 {#scale-compute-groups}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Elastic scaling / Capacity planning -->

다음 명령으로 BE 노드를 추가하거나 제거하여 컴퓨트 그룹을 확장하거나 축소합니다.

- **확장**: `ALTER SYSTEM ADD BACKEND`
- **축소**: `ALTER SYSTEM DECOMMISSION BACKEND`

### 확장 및 축소 후 부하 재분산 {#load-rebalancing-after-scaling}

Cloud Rebalance는 Doris의 컴퓨팅과 스토리지가 분리된 아키텍처에서 사용하는 부하 분산 메커니즘입니다. 컴퓨트 그룹의 BE 노드가 확장되거나 축소되면 시스템은 클러스터 전체의 읽기 및 쓰기 트래픽 분포를 자동으로 재조정합니다. 장기간 오프라인 상태인 노드도 축소 이벤트로 처리됩니다.

#### 균형 조정 전략 유형 {#balance-strategy-types}

<!-- Knowledge type: Configuration parameters -->

:::caution 지원 버전

`balance_type` 기능은 **Doris 3.1.3** 및 **Doris 4.0.2**부터 지원됩니다. 이 버전들 이전에는 FE 전역 설정인 `enable_cloud_warm_up_for_rebalance`로만 리밸런싱 중 워밍업 작업의 실행 여부를 제어할 수 있었습니다.

:::

다음 예시는 확장 시나리오를 기준으로 네 가지 전략 유형을 설명합니다.

| 전략 유형 | 새 노드가 준비될 때까지 걸리는 시간 | 성능 영향 | 기술 원리 | 적용 시나리오 |
| :--- | :---: | :---: | :--- | :--- |
| `without_warmup` | 가장 빠름 | 가장 큼 | FE가 샤드 매핑을 직접 업데이트함. 첫 읽기/쓰기 시 파일 캐시가 없어 S3에서 데이터를 가져와야 함 | 새 노드를 신속하게 가동해야 하고 성능 변동을 허용할 수 있는 경우에 적합 |
| `async_warmup` | 빠름 | 캐시 미스 발생 가능 | 워밍업 작업을 발행하고, 작업이 성공하거나 시간 초과되면 매핑을 업데이트함. 매핑 전환 중 파일 캐시를 채우려고 시도하지만 일부 첫 읽기에서는 여전히 캐시 미스가 발생할 수 있음 | 범용으로 사용 가능하며, 성능이 무난함 |
| `sync_warmup` | 느림 | 캐시 미스가 거의 없음 | 워밍업 작업을 발행하고, FE가 작업 완료를 확인한 후에만 매핑을 변경하여 캐시 마이그레이션의 완료를 보장함 | 확장 및 축소 후 높은 성능이 필요하고 새 노드의 파일 캐시가 채워져 있어야 하는 경우에 적합 |
| `peer_read_async_warmup` | 가장 빠름 | 작음 | FE가 샤드 매핑을 직접 변경하고 최선 노력 방식의 워밍업 작업을 발행함. 새 노드의 첫 읽기는 [피어 캐시 읽기](./file-cache/file-cache-peer-read)를 통해 원본 BE의 파일 캐시에서 데이터를 가져오며, 이를 위해 BE에서 `enable_cache_read_from_peer`를 활성화 상태(기본값)로 유지해야 함 | S3에서 직접 읽지 않고 새 노드를 신속하게 가동해야 하며, 원본 BE가 추가 읽기 부하를 감당할 수 있는 경우에 적합 |

#### 설정 {#configuration}

##### 전역 기본 균형 조정 유형 {#global-default-balance-type}

FE 설정 파일(`fe.conf`)에서 전역 기본값을 설정합니다.

```
cloud_warm_up_for_rebalance_type = "async_warmup"
```

##### 컴퓨트 그룹 수준 설정 {#compute-group-level-configuration}

컴퓨트 그룹마다 균형 조정 유형을 개별적으로 설정할 수 있습니다.

```sql
ALTER COMPUTE GROUP cg1 PROPERTIES("balance_type"="async_warmup");
```

##### 설정 우선순위 규칙 {#configuration-priority-rules}

1. 컴퓨트 그룹에 `balance_type`이 설정되어 있지 않으면 전역 기본값인 `async_warmup`을 사용합니다.
2. 컴퓨트 그룹에 `balance_type`이 설정되어 있으면 리밸런싱을 실행할 때 해당 그룹의 설정이 우선 적용됩니다.

## 컴퓨트 그룹 이름 변경 {#rename-a-compute-group}

<!-- Knowledge type: Operational steps -->

**목적**: 기존 컴퓨트 그룹의 이름을 새 이름으로 변경합니다.

**명령**:

```sql
ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>;
```

:::caution 참고

이름을 변경해도 기존 컴퓨트 그룹 이름(`old_name`)에 연결된 사용자 권한과 기본 컴퓨트 그룹 설정은 새 이름(`new_name`)으로 자동 업데이트되지 **않습니다**. 관리자 권한이 있는 계정으로 권한을 수동으로 다시 부여해야 합니다. 이 동작은 MySQL 권한 시스템과 동일합니다.

:::

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting / Permission issues / Performance tuning -->

### 전역 리밸런싱 유형을 어떻게 조회하고 변경하나요? {#how-do-i-view-and-modify-the-global-rebalance-type}

- **조회**:
    ```sql
    ADMIN SHOW FRONTEND CONFIG LIKE "cloud_warm_up_for_rebalance_type";
    ```
- **변경**(FE를 재시작하지 않아도 적용됨):
    ```sql
    ADMIN SET FRONTEND CONFIG ("cloud_warm_up_for_rebalance_type" = "without_warmup");
    ```

### 컴퓨트 그룹의 균형 조정 유형을 어떻게 조회하나요? {#how-do-i-query-the-balance-type-of-a-compute-group}

`SHOW COMPUTE GROUPS;`를 실행하세요. 결과의 `properties` 열에는 각 컴퓨트 그룹의 속성이 포함되어 있으며, 여기에서 `balance_type` 설정을 확인할 수 있습니다.

### 클러스터의 Tablet 상태가 안정적인지 어떻게 확인하나요? {#how-do-i-determine-whether-the-cluster-is-in-a-stable-tablet-state}

**방법 1: `SHOW BACKENDS`로 확인**

BE 노드 간 tablet 수가 대략적으로 균형을 이루는지 확인합니다. 참고 범위는 다음과 같습니다.

```
(total tablets in cluster / number of BEs in Compute Group) × 0.95
~
(total tablets in cluster / number of BEs in Compute Group) × 1.05
```

여기서 0.05는 FE 설정 항목인 `cloud_rebalance_percent_threshold`의 기본값입니다. BE 노드 간 tablet 분포를 더 균일하게 하려면 이 설정값을 줄이세요.

**방법 2: FE 메트릭으로 관찰**

FE 메트릭에서 `doris_fe_cloud_.*_balance_num` 메트릭 계열을 확인합니다. 값이 장기간 변하지 않으면 컴퓨트 그룹이 균형 상태에 도달한 것입니다. 지속적으로 관찰할 수 있도록 모니터링 대시보드에 이 메트릭을 설정하는 것을 권장합니다.

```bash
curl "http://feip:fe_http_port/metrics" | grep '_balance_num'
```

### 데이터를 읽거나 쓸 때 "기본 컴퓨트 그룹이 설정되지 않음" 오류가 발생하면 어떻게 해야 하나요? {#what-should-i-do-if-a-no-default-compute-group-configured-error-occurs-during-data-readwrite}

다음 방법 중 하나로 문제를 해결하세요.

1. `USE @cluster` 명령을 사용하여 현재 세션의 컴퓨트 그룹을 임시로 지정합니다.
2. `SET PROPERTY 'default_compute_group' = '{clusterName}'`를 사용하여 기본 컴퓨트 그룹을 영구적으로 설정합니다.

### 기본 컴퓨트 그룹이 삭제된 후 오류가 발생하면 어떻게 해야 하나요? {#what-should-i-do-if-an-error-occurs-after-the-default-compute-group-is-deleted}

컴퓨트 그룹이 삭제되면 해당 컴퓨트 그룹을 사용하는 사용자에게 읽기/쓰기 작업 중 오류가 발생합니다. 해결 방법은 다음과 같습니다.

1. `USE @cluster` 명령을 사용하여 현재 세션의 컴퓨트 그룹을 다시 지정합니다.
2. `SET PROPERTY`를 사용하여 기본 컴퓨트 그룹을 다른 유효한 컴퓨트 그룹으로 업데이트합니다.
