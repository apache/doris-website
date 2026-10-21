---
{
    "title": "ALTER WORKLOAD POLICY",
    "language": "ko",
    "description": "Workload Policy의 속성을 수정합니다. 현재는 속성 수정만 지원됩니다;"
}
---

## 설명 {#description}

Workload Policy의 속성을 수정합니다. 현재는 속성 수정만 지원되며, 액션과 조건 수정은 지원되지 않습니다.


## 구문 {#syntax}

```sql
ALTER WORKLOAD POLICY <workload_policy_name> PROPERTIES( <properties> )
```

## 필수 매개변수 {#required-parameters}

`<workload_policy_name>` 

Workload Policy의 이름


`<properties>`

1. enabled: true 또는 false로 설정할 수 있으며, 기본값은 true입니다. true는 현재 정책이 활성화되어 있음을 나타내며, false는 현재 정책이 비활성화되어 있음을 나타냅니다.
2. priority: 0부터 100까지의 양의 정수이며, 기본값은 0입니다. 정책의 우선순위를 나타내며, 값이 클수록 우선순위가 높습니다. 이 속성의 주된 역할은 여러 정책이 일치할 때 우선순위가 가장 높은 정책을 선택하는 것입니다.
3. workload_group: 현재 정책은 하나의 워크로드 그룹에 연결할 수 있으며, 이 경우 해당 정책은 특정 워크로드 그룹에만 적용됩니다. 기본값은 비어 있으며, 이 경우 모든 쿼리에 적용됩니다.

    워크로드 그룹 자체가 컴퓨트 그룹에 속하므로, 이 속성의 값은 다음 규칙을 따라야 합니다.

    - **클라우드(스토리지와 컴퓨팅 분리) 모드**: `<compute_group>.<workload_group>`과 같은 전체 한정 형식이 필요합니다. 예: `'workload_group'='compute_group_a.wg1'`. 단독 `<workload_group>` 형식, `.`이 둘 이상 포함된 형식, 또는 빈 부분이 있는 형식(예: `.wg1` 또는 `wg1.`)은 다음 오류와 함께 거부됩니다: `workload_group must be '<compute_group>.<workload_group>' in cloud mode`.
    - **비클라우드(스토리지와 컴퓨팅 결합) 모드**: 다음 두 가지 형식을 사용할 수 있습니다.
        - `<workload_group>`: 기본 리소스 그룹(`default`)에 속한 같은 이름의 워크로드 그룹에 기본적으로 연결합니다.
        - `<resource_group>.<workload_group>`: 리소스 그룹을 명시적으로 지정합니다. 여기서 접두사는 실제로 리소스 그룹(Tag)을 가리킵니다. 클라우드 모드와 동일한 문법을 사용하는 이유는 일관성을 유지하기 위해서입니다.
        
        `.`이 둘 이상 포함되거나 빈 부분이 있는 형식도 마찬가지로 다음 오류와 함께 거부됩니다: `workload_group must be '<workload_group>' or '<resource_group>.<workload_group>' in non-cloud mode`.

## 접근 제어 요구 사항 {#access-control-requirements}

최소한 ADMIN_PRIV 권한이 있어야 합니다.

## 예제 {#examples}

1. Workload Policy 비활성화

  ```sql
  alter workload policy cancel_big_query properties('enabled'='false')
  ```
