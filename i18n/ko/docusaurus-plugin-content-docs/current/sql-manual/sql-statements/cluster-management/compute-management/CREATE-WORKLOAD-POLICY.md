---
{
    "title": "CREATE WORKLOAD POLICY",
    "language": "ko",
    "description": "쿼리가 특정 조건을 충족할 때 해당 쿼리에 지정된 동작을 수행하는 Workload Policy를 생성합니다."
}
---

## 설명 {#description}

쿼리가 특정 조건을 충족할 때 해당 쿼리에 지정된 동작을 수행하는 Workload Policy를 생성합니다.

## 구문 {#syntax}

```sql
CREATE WORKLOAD POLICY [ IF NOT EXISTS ] <workload_policy_name>
CONDITIONS(<conditions>) ACTIONS(<actions>)
[ PROPERTIES (<properties>) ]
```

## 필수 매개변수 {#required-parameters}

1. `<workload_policy_name>`: Workload Policy의 이름입니다.

2. `<conditions>`
    - be_scan_rows: 단일 BE 프로세스 내에서 SQL이 스캔한 행 수입니다. BE에서 SQL이 여러 작업으로 동시 실행되는 경우, 동시 실행된 작업의 누적값입니다.
    - be_scan_bytes: 단일 BE 프로세스 내에서 SQL이 스캔한 바이트 수입니다. BE에서 SQL이 여러 작업으로 동시 실행되는 경우, 동시 실행된 작업의 누적값이며 단위는 바이트입니다.
    - query_time: 단일 BE 프로세스에서 SQL의 실행 시간이며, 단위는 밀리초입니다.
    - query_be_memory_bytes: 버전 2.1.5부터 지원됩니다. 단일 BE 프로세스 내에서 SQL이 사용하는 메모리 양입니다. BE에서 SQL이 여러 작업으로 동시 실행되는 경우, 동시 실행된 작업의 누적값이며 단위는 바이트입니다.

3. `<actions>`
    - cancel_query: 쿼리를 취소합니다.

## 선택 매개변수 {#optional-parameters}

1. `<properties>`
    - enabled: true 또는 false로 설정할 수 있으며, 기본값은 true입니다. true는 정책 활성화, false는 정책 비활성화를 의미합니다.
    - priority: 0에서 100 사이의 양의 정수이며, 기본값은 0입니다. 값이 클수록 우선순위가 높습니다. 쿼리가 여러 정책의 조건을 충족하면 우선순위가 가장 높은 정책이 선택됩니다.
    - workload_group: 정책을 하나의 워크로드 그룹에 연결할 수 있으며, 이 경우 해당 워크로드 그룹에만 정책이 적용됩니다. 기본값은 빈 값이며, 모든 쿼리에 적용됨을 의미합니다.

        워크로드 그룹 자체가 컴퓨팅 그룹에 속하므로, 이 속성의 값은 다음 규칙을 따라야 합니다.

        - **클라우드(스토리지와 컴퓨팅 분리) 모드**: 완전 수식 형식인 `<compute_group>.<workload_group>`을 사용해야 합니다. 예: `'workload_group'='compute_group_a.wg1'`. 단독 `<workload_group>` 형식, `.`이 둘 이상인 형식, 빈 구성 요소가 포함된 형식(예: `.wg1` 또는 `wg1.`)은 다음 오류와 함께 거부됩니다: `workload_group must be '<compute_group>.<workload_group>' in cloud mode`.
        - **비클라우드(스토리지와 컴퓨팅 통합) 모드**: 다음 두 가지 형식을 허용합니다.
            - `<workload_group>`: 기본 리소스 그룹(`default`)에 속한 동일한 이름의 워크로드 그룹에 기본적으로 연결됩니다.
            - `<resource_group>.<workload_group>`: 리소스 그룹을 명시적으로 지정합니다. 여기서 접두사는 실제로 리소스 그룹(Tag)을 가리킵니다. 클라우드 모드와 문법을 공유하는 것은 일관성을 유지하기 위해서입니다.
            
            `.`이 둘 이상이거나 빈 구성 요소가 포함된 경우에도 다음 오류와 함께 거부됩니다: `workload_group must be '<workload_group>' or '<resource_group>.<workload_group>' in non-cloud mode`.

## 접근 제어 요구 사항 {#access-control-requirements}

최소한 ADMIN_PRIV 권한이 있어야 합니다.

## 예제 {#examples}

1. 실행 시간이 3초를 초과하는 모든 쿼리를 취소하는 Workload Policy를 생성합니다.

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query)
    ```

2. 기본적으로 비활성화된 Workload Policy를 생성합니다.

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('enabled'='false')
    ```

3. 클라우드 모드에서 워크로드 그룹 `wg1`이 컴퓨팅 그룹 `compute_group_a`에 속할 때 해당 워크로드 그룹에만 적용되는 정책을 생성합니다(완전 수식 형식에 유의하세요).

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('workload_group'='compute_group_a.wg1')
    ```
