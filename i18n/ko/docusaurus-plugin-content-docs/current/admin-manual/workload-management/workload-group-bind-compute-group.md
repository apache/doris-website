---
{
    "title": "Workload Group을 Compute Group에 바인딩: 워크로드 간 리소스 격리",
    "sidebar_label": "Workload Group을 Compute Group에 바인딩",
    "language": "ko",
    "description": "Apache Doris에서 Workload Group을 특정 Compute Group에 바인딩하여 워크로드별 리소스 할당량을 독립적으로 관리하는 방법을 알아봅니다. 스토리지-컴퓨트 분리형 및 통합형 아키텍처에 모두 적용됩니다.",
    "keywords": ["Workload Group", "Compute Group", "Resource Group", "리소스 격리", "멀티테넌시", "리소스 관리", "스토리지-컴퓨트 분리"]
}
---

<!-- Knowledge type: Concept + Procedure -->

## Workload Group을 Compute Group에 바인딩하는 이유 {#why-bind-workload-group-to-compute-group}

Doris는 **Compute Group**을 통해 클러스터 내 BE 노드를 논리적으로 그룹화하여 독립적인 하위 클러스터를 구성하고, 서로 다른 워크로드의 컴퓨트 리소스를 격리할 수 있습니다.

이전 버전에서는 **Workload Group이 모든 Compute Group에 전역적으로 적용**되어 서로 다른 워크로드가 동일한 리소스 할당량 설정을 공유해야 했습니다. 예를 들면 다음과 같습니다.

- 워크로드 A와 워크로드 B가 각각 자체 Workload Group을 생성했고, 리소스 할당량의 합계가 이미 100%에 도달했습니다.
- 워크로드 A는 Workload Group을 더 이상 생성할 수 없었습니다.
- 두 워크로드에 필요한 Workload Group 설정은 크게 달랐지만, 이전 아키텍처에서는 워크로드별로 독립적으로 관리할 수 없었습니다.

이 문제를 해결하기 위해 현재 버전에서는 **Workload Group을 Compute Group에 바인딩**하는 메커니즘을 도입하여 각 Compute Group이 자체 Workload Group 설정을 독립적으로 유지할 수 있도록 했습니다.

## Compute Group과 Resource Group의 관계 {#relationship-between-compute-group-and-resource-group}

<!-- Knowledge type: Concept definition -->

| 아키텍처 유형 | 해당 개념 | 설명 |
|---------|---------|------|
| 스토리지-컴퓨트 분리형 | Compute Group | 독립적인 하위 클러스터를 구성하는 논리적 분할 단위 |
| 스토리지-컴퓨트 통합형 | Resource Group | 기능적으로 Compute Group과 동일 |

리소스 관리 측면에서 두 개념은 논리적으로 동등하게 취급할 수 있습니다. **이 문서에서 설명하는 Workload Group과 Compute Group 간 바인딩은 스토리지-컴퓨트 분리형 및 통합형 아키텍처에 모두 적용됩니다.**

## 동작 방식 {#how-it-works}

<!-- Knowledge type: Concept -->

### 이전 버전의 설계 {#design-in-earlier-versions}

클러스터에 Compute Group A(워크로드 A 처리)와 Compute Group B(워크로드 B 처리)가 있고, 리소스 할당량의 합계가 100%인 두 Workload Group, `group_a`와 `group_b`가 있다고 가정합니다.

이전 버전에서는 아래 그림과 같이 `group_a`와 `group_b`가 Compute Group의 경계에 제한되지 않고 **모든 BE 노드**에 적용되었습니다.

![이전 버전: Workload Group이 전역적으로 적용됨](/images/wg_bind_cg1.png)

이로 인해 다음과 같은 문제가 발생했습니다.

- 워크로드 A가 `group_a`를 생성한 후 리소스 할당량이 모두 소진되어 Workload Group을 추가로 생성할 수 없었습니다.
- 두 워크로드의 Workload Group 설정이 서로 영향을 주어 워크로드별로 다르게 관리하기 어려웠습니다.

### 현재 버전의 설계 {#design-in-the-current-version}

현재 버전에서는 Workload Group을 특정 Compute Group에 바인딩할 수 있습니다. 아래 그림과 같이 **각 Compute Group은 자체 Workload Group 설정을 독립적으로 유지합니다**.

![현재 버전: Compute Group별로 Workload Group이 격리됨](/images/wg_bind_cg2.png)

## 사용 방법 {#usage}

<!-- Knowledge type: Procedure -->

:::tip 기본 Compute Group
Doris에는 기본 Compute Group 메커니즘이 있습니다. 소속을 지정하지 않고 새 BE 노드를 추가하면 해당 노드는 자동으로 기본 Compute Group에 배치됩니다.

| 아키텍처 유형 | 기본 Compute Group 이름 |
|---------|----------------------|
| 스토리지-컴퓨트 분리형 | `default_compute_group` |
| 스토리지-컴퓨트 통합형 | `default` |
:::

:::caution `FOR` 절의 동작은 아키텍처에 따라 다릅니다
- **클라우드(스토리지-컴퓨트 분리) 모드**: CREATE / ALTER / DROP WORKLOAD GROUP에는 `FOR <compute_group>` 절을 **반드시** 명시해야 합니다. 생략하면 다음 오류가 발생합니다: `Must specify compute group via 'FOR <compute_group>' in cloud mode.`
- **비클라우드(스토리지-컴퓨트 결합) 모드**: `FOR <compute_group>` 절은 선택 사항입니다. 여기서 지정하는 값은 실제 Compute Group이 아니라 Resource Group(Tag)을 가리킵니다. 이 문법은 오직 일관성을 위해 클라우드 모드와 공유합니다. 생략하면 기본 Resource Group(`default`)이 사용됩니다.
:::

### Workload Group 생성 {#create-a-workload-group}

**특정 Compute Group에 바인딩:**

```sql
CREATE WORKLOAD GROUP group_a FOR compute_group_a PROPERTIES ('cpu_share'='1024');
```

**Compute Group을 지정하지 않는 경우(비클라우드 모드에서만 가능하며, 기본 Resource Group에 바인딩):**

```sql
CREATE WORKLOAD GROUP group_a PROPERTIES ('cpu_share'='1024');
```

### Workload Group 삭제 {#drop-a-workload-group}

**특정 Compute Group에서 삭제:**

```sql
DROP WORKLOAD GROUP group_a FOR compute_group_a;
```

**Compute Group을 지정하지 않는 경우(비클라우드 모드에서만 가능하며, 기본 Resource Group에서 삭제):**

```sql
DROP WORKLOAD GROUP group_a;
```

### Workload Group 속성 변경 {#alter-workload-group-properties}

**특정 Compute Group에 속한 Workload Group의 속성 변경:**

```sql
ALTER WORKLOAD GROUP group_a FOR compute_group_a PROPERTIES ('cpu_share'='2048');
```

**Compute Group을 지정하지 않는 경우(비클라우드 모드에서만 가능하며, 기본 Resource Group에 속한 Workload Group 변경):**

```sql
ALTER WORKLOAD GROUP group_a PROPERTIES ('cpu_share'='2048');
```

:::note
`ALTER` 문은 Workload Group의 속성을 변경하는 데만 사용됩니다. **Workload Group과 Compute Group 간의 바인딩 관계는 변경할 수 없습니다.**
:::

### Workload Policy에서 Workload Group 참조 {#referencing-a-workload-group-from-a-workload-policy}

`workload_group` 속성을 [CREATE WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY) / [ALTER WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY)에서 설정할 때는 Workload Group이 Compute Group에 속하므로 값이 다음 규칙을 따라야 합니다.

- **클라우드(스토리지-컴퓨트 분리) 모드**: 다음 예와 같이 전체 경로를 지정하는 `<compute_group>.<workload_group>` 형식이 필요합니다.

    ```sql
    CREATE WORKLOAD POLICY p1 CONDITIONS(query_time > 3000) ACTIONS(cancel_query)
    PROPERTIES('workload_group'='compute_group_a.wg1');
    ```

- **비클라우드(스토리지-컴퓨트 결합) 모드**: `<workload_group>`(기본 Resource Group)과 `<resource_group>.<workload_group>` 형식을 모두 사용할 수 있습니다.

## 참고 사항 {#notes}

<!-- Knowledge type: Constraints and limitations -->

1. **바인딩 관계는 변경할 수 없음**: Workload Group은 생성 시 특정 Compute Group에 고정적으로 할당되며, 다른 Compute Group으로 이전할 수 없습니다.

2. **업그레이드 시 동작**: 이전 버전에서 현재 버전으로 업그레이드하면 시스템은 기존 Workload Group을 기반으로 각 Compute Group에 이름은 같지만 ID가 다른 새 Workload Group을 자동으로 생성합니다. 예를 들어 이전 버전에 Compute Group 두 개와 `group_a`가 있었다면, 업그레이드 후 각 Compute Group에는 `group_a`라는 새 Workload Group이 생성되며, 어떤 Compute Group에도 속하지 않았던 원래의 `group_a`는 자동으로 삭제됩니다.

3. **권한 관리 방식 유지**: Workload Group에 대한 권한 검사는 여전히 Workload Group 이름을 기준으로 수행되며, 관리 방식도 이전 버전과 동일합니다.

4. **`normal` Workload Group의 수명 주기**: Doris에는 이름이 `normal`인 기본 Workload Group이 있습니다. 새 Compute Group이 생성될 때마다 시스템은 해당 Compute Group에 대응하는 `normal` Workload Group을 자동으로 생성합니다. Compute Group이 삭제되면 연결된 `normal` Workload Group도 자동으로 삭제됩니다. `normal` Workload Group의 수명 주기는 시스템에서 전적으로 관리하므로 수동 작업이 필요하지 않습니다.
