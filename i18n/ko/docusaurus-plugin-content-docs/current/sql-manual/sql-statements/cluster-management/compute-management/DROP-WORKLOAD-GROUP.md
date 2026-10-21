---
{
    "title": "DROP WORKLOAD GROUP",
    "language": "ko",
    "description": "이 문은 워크로드 그룹을 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 워크로드 그룹을 삭제하는 데 사용됩니다.

## 구문 {#syntax}

```sql
DROP WORKLOAD GROUP [IF EXISTS] '<rg_name>' [FOR <compute_group>]
```

## 매개변수 {#parameters}

1. `<compute_group>`

    삭제할 워크로드 그룹이 속한 컴퓨트 그룹을 지정합니다.

    - **클라우드(스토리지와 컴퓨팅이 분리된) 모드**: `FOR <compute_group>` 절을 **반드시 명시해야 합니다**. 생략하면 다음 오류가 발생합니다: `Must specify compute group via 'FOR <compute_group>' in cloud mode.`
    - **비클라우드(스토리지와 컴퓨팅이 결합된) 모드**: `FOR <compute_group>` 절은 선택 사항입니다. 여기서 지정하는 값은 실제로 리소스 그룹(Tag)을 가리키며, 클라우드 모드와의 일관성만을 위해 동일한 구문을 사용합니다. 생략하면 기본 리소스 그룹(`default`)에 속한 같은 이름의 워크로드 그룹이 삭제됩니다.

## 예제 {#examples}

1. g1이라는 이름의 워크로드 그룹을 삭제합니다(비클라우드 모드: 기본 리소스 그룹에서 g1 삭제):
    
    ```sql
    drop workload group if exists g1;
    ```

2. g1이라는 이름의 워크로드 그룹을 `compute_group_a`에서 삭제합니다(클라우드 모드에서는 이 절이 필수입니다):

    ```sql
    drop workload group if exists g1 for compute_group_a;
    ```
