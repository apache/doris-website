---
{
    "title": "CREATE WORKLOAD GROUP | 컴퓨팅 관리",
    "language": "ko",
    "description": "이 문은 워크로드 그룹을 생성하는 데 사용됩니다. 워크로드 그룹을 사용하면 단일 be에서 cpu 리소스와 메모리 리소스를 격리할 수 있습니다.",
    "sidebar_label": "CREATE WORKLOAD GROUP"
}
---

# CREATE WORKLOAD GROUP {#create-workload-group}

## 설명 {#description}

이 문은 워크로드 그룹을 생성하는 데 사용됩니다. 워크로드 그룹을 사용하면 단일 be에서 cpu 리소스와 메모리 리소스를 격리할 수 있습니다.

## 구문 {#syntax}

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "rg_name"
[FOR <compute_group>]
PROPERTIES (
    `<property>`
    [ , ... ]
);
```

## 매개변수 {#parameters}

1. `<compute_group>`

    워크로드 그룹이 연결될 컴퓨트 그룹을 지정합니다.

    - **클라우드(스토리지와 컴퓨팅 분리) 모드**: `FOR <compute_group>` 절을 **반드시 명시적으로 지정해야 합니다**. 생략하면 다음 오류가 발생합니다: `Must specify compute group via 'FOR <compute_group>' in cloud mode.`
    - **비클라우드(스토리지와 컴퓨팅 결합) 모드**: `FOR <compute_group>` 절은 선택 사항입니다. 여기서 지정하는 값은 실제로 컴퓨트 그룹이 아닌 리소스 그룹(Tag)을 가리킵니다. 이 구문은 일관성을 위해 클라우드 모드와 공유됩니다. 생략하면 기본 리소스 그룹(`default`)이 사용됩니다.

2. `<property>`

    `<property>`의 형식은 `<key>` = `<value>`이며, `<key>`에 지정할 수 있는 구체적인 값은 [워크로드 그룹](../../../../admin-manual/workload-management/workload-group.md)을 참조하세요.


## 예제 {#examples}

1. g1이라는 워크로드 그룹을 생성합니다(비클라우드 모드: 기본 리소스 그룹에 연결).

   ```sql
    create workload group if not exists g1
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```

2. g1이라는 워크로드 그룹을 생성하고 `compute_group_a`에 연결합니다(클라우드 모드에서는 이 절이 필수입니다).

   ```sql
    create workload group if not exists g1 for compute_group_a
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```
