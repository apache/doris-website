---
{
    "title": "Compute Group 관리: 생성, 권한 부여 및 확장·축소",
    "sidebar_label": "Compute Group",
    "language": "ko",
    "description": "스토리지와 컴퓨팅이 분리된 아키텍처에서 Compute Group은 워크로드를 물리적으로 격리하며, 생성, 권한 부여, 전환, 탄력적인 확장 및 축소를 지원합니다.",
    "keywords": ["Compute Group", "storage-compute separation", "compute cluster", "workload isolation", "elastic scaling", "workload management", "Compute Cluster", "BE management", "default compute group"]
}
---

<!-- Knowledge type: concept + procedure -->
<!-- Applicable scenario: workload isolation and resource management in the storage-compute separation architecture -->

**Compute Group**(3.0.2 이전 버전에서는 "Compute Cluster"라고 함)은 스토리지와 컴퓨팅이 분리된 아키텍처에서 서로 다른 워크로드를 물리적으로 격리하는 수단입니다. 하나 이상의 BE 노드가 Compute Group을 구성하며, 여러 Compute Group이 공유 스토리지 계층을 통해 동일한 데이터에 접근합니다.

![compute_group](/images/compute_group_workload_management.png)

**주요 특징**:

- BE 노드는 로컬에 상태를 유지하지 않으며, 데이터는 공유 스토리지에 저장됩니다.
- 여러 Compute Group이 추가 복제본 없이 동일한 데이터를 공유합니다.
- Compute Group을 추가하거나 제거할 때 데이터를 마이그레이션할 필요가 없으며, 쿼리 실행 시 캐시 워밍업만 필요합니다.

Compute Group은 Resource Group에 비해 다음과 같은 장점이 있습니다.

| 비교 항목 | Compute Group | Resource Group |
|------|--------------|----------------|
| 스토리지 비용 | 데이터는 공유 스토리지에 저장됩니다. Compute Group 수는 복제본 수에 제한받지 않으며, 그룹 수가 늘어나도 비용이 증가하지 않습니다. | 복제본을 추가하면 스토리지 비용이 선형적으로 증가합니다. |
| 확장 및 축소의 유연성 | 새 Compute Group을 추가할 때 캐시 워밍업만 필요하며, 데이터를 마이그레이션할 필요가 없습니다. | 복제본을 추가하려면 대량의 데이터를 마이그레이션해야 합니다. |
| 격리의 완전성 | 공유 스토리지 계층에서 여러 복제본을 보장합니다. 하나의 Compute Group 내에서 BE 장애가 발생해도 데이터 적재에 영향을 주지 않습니다. | BE 장애가 발생하면 데이터 적재가 실패할 수 있습니다. |

:::caution 참고
3.0.2 이전 버전에서는 Compute Group을 Compute Cluster라고 부릅니다.
:::

## Compute Group 조회 {#view-compute-groups}

<!-- Knowledge type: procedure -->

현재 warehouse에 속한 모든 Compute Group을 조회합니다.

```sql
SHOW COMPUTE GROUPS;
```

## Compute Group 추가 {#add-a-compute-group}

<!-- Knowledge type: procedure -->

[ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) 명령으로 BE 노드를 추가하고, 해당 노드가 속할 Compute Group을 지정합니다.

**Compute Group을 지정하는 경우**:

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

**Compute Group을 지정하지 않는 경우**(기본적으로 `default_compute_group`에 추가됨):

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

## Compute Group 접근 권한 관리 {#manage-compute-group-access-permissions}

<!-- Knowledge type: procedure -->

### 접근 권한 부여 {#grant-access-permission}

사용자에게 지정한 Compute Group의 사용 권한을 부여합니다.

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user};
```

### 접근 권한 회수 {#revoke-access-permission}

지정한 Compute Group에 대한 사용자의 사용 권한을 회수합니다.

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user};
```

## 기본 Compute Group 설정 {#set-the-default-compute-group}

<!-- Knowledge type: procedure -->
<!-- Applicable scenario: read/write errors when a user has not configured a default Compute Group -->

### 기본 Compute Group 설정 및 조회 {#set-and-view-the-default-compute-group}

| 작업 | 명령 | 필요한 권한 |
|------|------|---------|
| 현재 사용자의 기본 Compute Group 설정 | `SET PROPERTY 'default_compute_group' = '{clusterName}';` | 추가 권한 필요 없음 |
| 다른 사용자의 기본 Compute Group 설정 | `SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';` | Admin 권한 필요 |
| 현재 사용자의 기본 Compute Group 조회 | `SHOW PROPERTY;` | 추가 권한 필요 없음 |
| 다른 사용자의 기본 Compute Group 조회 | `SHOW PROPERTY FOR {user};` | 해당 조회 권한 필요 |

반환된 결과에서 `default_compute_group` 필드의 값이 현재 기본 Compute Group입니다.

### 권한 설명 {#permission-description}

**Admin 사용자**(예: `CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`):

- 자신과 다른 사용자의 기본 Compute Group을 설정할 수 있습니다.
- 자신과 다른 사용자의 `PROPERTY`를 조회할 수 있습니다.

**일반 사용자**(예: `CREATE USER jack1 IDENTIFIED BY '123456'`):

- 자신의 기본 Compute Group만 설정할 수 있습니다.
- 자신의 `PROPERTY`만 조회할 수 있습니다.
- `SHOW COMPUTE GROUPS`를 실행할 수 없습니다(이 작업에는 `GRANT ADMIN` 권한이 필요합니다).

### 자주 묻는 질문 {#faq}

#### 질문: 데이터를 읽거나 쓸 때 오류가 발생합니다 {#q-an-error-occurs-when-performing-data-reads-or-writes}
현재 사용자에게 기본 Compute Group이 설정되어 있지 않습니다. `use @cluster`를 실행하여 현재 세션의 Compute Group을 지정하거나, `SET PROPERTY`로 기본값을 설정하세요.

#### 질문: 기본 Compute Group을 설정했지만 읽기와 쓰기 시 여전히 오류가 발생합니다 {#q-a-default-compute-group-has-been-set-but-reads-and-writes-still-report-errors}
이전에 지정한 Compute Group이 삭제되었습니다. `use @cluster`를 실행하여 다시 지정하거나, `SET PROPERTY`로 기본 설정을 갱신하세요.

## 기본 Compute Group 자동 선택 {#automatic-selection-of-the-default-compute-group}

<!-- Knowledge type: concept -->

사용자가 기본 Compute Group을 명시적으로 설정하지 않으면, 시스템은 다음 조건을 충족하는 Compute Group을 자동으로 선택합니다.

- Active 상태의 BE 노드가 있습니다.
- 현재 사용자에게 해당 Compute Group의 사용 권한이 있습니다.

동일한 세션 내에서는 기본 Compute Group이 변경되지 않습니다. 세션이 바뀔 때 다음 상황에 해당하면 시스템이 자동으로 다시 선택합니다.

| 선택을 다시 수행하는 조건 | 항상 변경되는지 여부 |
|----------|------------|
| 사용자가 이전에 선택된 Compute Group의 사용 권한을 잃음 | 항상 변경됨 |
| Compute Group이 추가되거나 제거됨 | 항상 변경됨 |
| 이전에 선택된 Compute Group에 더 이상 Active 상태의 BE 노드가 없음 | 변경될 수 있음 |

## Compute Group 전환 {#switch-compute-groups}

<!-- Knowledge type: procedure -->

스토리지와 컴퓨팅이 분리된 아키텍처에서는 하나의 문에서 데이터베이스와 Compute Group을 함께 지정할 수 있습니다.

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

데이터베이스 이름이나 Compute Group 이름에 예약된 키워드가 포함되어 있으면 해당 이름을 백틱(`` ` ``)으로 감싸세요.

## Compute Group 확장 및 축소 {#compute-group-scaling}

<!-- Knowledge type: procedure -->
<!-- Applicable scenario: elastic scaling, workload adjustment -->

BE 노드를 추가하거나 제거하여 Compute Group을 탄력적으로 확장하거나 축소할 수 있습니다.

- **확장**: `ALTER SYSTEM ADD BACKEND`는 지정한 Compute Group에 새 BE를 추가합니다.
- **축소**: `ALTER SYSTEM DECOMMISSION BACKEND`는 Compute Group에서 BE를 해제합니다.

자세한 작업 방법은 [스토리지와 컴퓨팅 분리 운영](../../install/choosing-deployment-mode)을 참조하세요.
