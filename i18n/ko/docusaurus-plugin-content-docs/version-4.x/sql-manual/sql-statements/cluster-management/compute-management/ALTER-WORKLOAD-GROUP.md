---
{
    "title": "ALTER WORKLOAD GROUP",
    "language": "ko",
    "description": "이 문은 워크로드 그룹을 수정하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 워크로드 그룹을 수정하는 데 사용됩니다.

## 구문 {#syntax}

```sql
ALTER WORKLOAD GROUP  "<rg_name>"
[FOR <compute_group>]
PROPERTIES (
  `<property>`
  [ , ... ]
);
```

:::note
`ALTER` 문은 워크로드 그룹의 속성만 수정하며, **워크로드 그룹과 컴퓨트 그룹 간의 바인딩은 변경할 수 없습니다**. `FOR <compute_group>` 절은 수정할 워크로드 그룹이 속한 컴퓨트 그룹을 지정하는 데 사용됩니다.
:::

## 매개변수 {#parameters}

1. `<compute_group>`

    수정할 워크로드 그룹이 속한 컴퓨트 그룹을 지정합니다.

    - **클라우드(스토리지와 컴퓨팅이 분리된) 모드**: `FOR <compute_group>` 절을 **반드시 명시적으로 지정해야 합니다**. 생략하면 다음 오류가 발생합니다: `Must specify compute group via 'FOR <compute_group>' in cloud mode.`
    - **비클라우드(스토리지와 컴퓨팅이 결합된) 모드**: `FOR <compute_group>` 절은 선택 사항입니다. 여기서 지정하는 값은 실제로 리소스 그룹(Tag)을 가리키며, 클라우드 모드와의 일관성을 위해 동일한 문법을 사용합니다. 생략하면 기본 리소스 그룹(`default`)에 속한 같은 이름의 워크로드 그룹을 대상으로 합니다.

2. `<property>`

    `<property>`의 형식은 `<key>` = `<value>`이며, `<key>`에 지정할 수 있는 구체적인 값은 [워크로드 그룹](../../../../admin-manual/workload-management/workload-group.md)을 참조하세요.

## 예제 {#examples}

1. 이름이 g1인 워크로드 그룹을 수정합니다(비클라우드 모드에서는 기본 리소스 그룹에 속한 g1에 적용됩니다):

    ```sql
    alter workload group g1
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```

2. `compute_group_a`에 속한 이름이 g1인 워크로드 그룹을 수정합니다(클라우드 모드에서는 해당 절이 필수입니다):

    ```sql
    alter workload group g1 for compute_group_a
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```
