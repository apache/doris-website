---
{
    "title": "ALTER COLOCATE GROUP",
    "language": "ko",
    "description": "이 문은 Colocation Group의 속성을 수정하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 Colocation Group의 속성을 수정하는 데 사용됩니다.

## 구문 {#syntax}

```sql
ALTER COLOCATE GROUP  [<database>.] <group_name>
SET (
    <property_list>
);
```
## 필수 매개변수 {#required-parameters}

**1. `<group_name>`**

수정할 Colocation Group의 이름을 지정합니다.

**2.`<property_list>`**

`property_list`는 `colocation group`의 속성이며, 현재는 `replication_num`과 `replication_allocation` 수정만 지원합니다. `colocation group`의 이 두 속성을 수정하면 그룹에 속한 테이블의 `default.replication_allocation`, `dynamic.replication_allocation` 및 기존 파티션의 replication_allocation 속성도 동일한 값으로 함께 변경됩니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<database>`**

수정할 `colocate group`이 속한 데이터베이스를 지정합니다.

참고:
1. Colocation Group이 전역 그룹인 경우, 즉 이름이 __global__ 로 시작하는 경우에는 어떤 데이터베이스에도 속하지 않습니다.

## 접근 제어 요구 사항 {#access-control-requirements}
`ADMIN` 권한이 필요합니다.

## 예제 {#examples}

1. 전역 그룹의 복제본 수를 수정합니다. 테이블을 생성할 때 `"colocate_with" = "__global__foo"`로 설정합니다.

```sql
ALTER COLOCATE GROUP __global__foo
SET (
    "replication_num"="1"
    );
```

2. 비전역 그룹의 복제본 수를 수정합니다. 테이블을 생성할 때 "colocate_with" = "bar"로 설정하며, 테이블은 example_db 데이터베이스에 속합니다.
 ```sql 
ALTER COLOCATE GROUP example_db.bar
SET (
    "replication_num"="1"
    );
```
