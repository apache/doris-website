---
{
    "title": "SET PROPERTY",
    "language": "ko",
    "description": "사용자에게 할당된 리소스, 데이터 적재 클러스터 등을 포함한 사용자 속성을 설정합니다."
}
---

## 설명 {#description}

사용자에게 할당된 리소스, 데이터 적재 클러스터 등을 포함한 사용자 속성을 설정합니다.

**관련 명령**

- [CREATE USER](./CREATE-USER.md)
- [SHOW PROPERTY](./SHOW-PROPERTY.md)

## 구문 {#syntax}

```sql
SET PROPERTY [ FOR '<user_name>' ] '<key_1>' = '<value_1>' [, '<key_2>' = '<value_2>', ...];
```

## 필수 매개변수 {#required-parameters}
**1. `<key_n>`**

슈퍼 사용자 권한:

 - `max_user_connections`: 최대 연결 수입니다.
 - `max_query_instances`: 사용자가 쿼리를 실행할 때 동시에 사용할 수 있는 인스턴스 수입니다.
 - `sql_block_rules`: SQL 차단 규칙을 설정합니다. 설정하면 이 사용자가 보낸 쿼리가 규칙과 일치할 경우 거부됩니다.
 - `cpu_resource_limit`: 쿼리에 사용할 cpu 리소스를 제한합니다. 자세한 내용은 세션 변수 `cpu_resource_limit`에 대한 설명을 참조하세요. -1은 설정되지 않았음을 의미합니다.
 - `exec_mem_limit`: 쿼리의 메모리 사용량을 제한합니다. 자세한 내용은 세션 변수 `exec_mem_limit`에 대한 설명을 참조하세요. -1은 설정되지 않았음을 의미합니다.
 - `resource_tags`: 사용자의 리소스 태그 권한을 지정합니다.
 - `query_timeout`: 사용자의 쿼리 시간 제한 권한을 지정합니다.
 - `default_workload_group`: 사용자의 기본 워크로드 그룹을 지정합니다.
 - `default_compute_group`: 사용자의 기본 컴퓨트 그룹을 지정합니다.

참고: `cpu_resource_limit`, `exec_mem_limit` 속성을 설정하지 않으면 기본적으로 세션 변수의 값이 사용됩니다.

**2. `<value_n>`**

지정된 키에 설정할 값입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<user_name>`**

속성을 설정할 사용자의 이름입니다. 생략하면 현재 사용자의 속성이 설정됩니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한 | 객체 | 참고 사항                |
| :---------------- | :------------- | :---------------------------- |
| ADMIN_PRIV        | 사용자 또는 역할    | 이 `SET PROPERTY` 작업은 `ADMIN_PRIV` 권한이 있는 사용자 또는 역할만 수행할 수 있습니다. |

## 사용 시 참고 사항 {#usage-notes}

- 여기서 설정하는 사용자 속성은 user에 적용되며 user_identity에는 적용되지 않습니다. 즉, 두 사용자 'jack'@'%'와 'jack'@'192.%'를 CREATE USER 문으로 생성한 경우, SET PROPERTY 문은 사용자 jack에만 사용할 수 있으며 'jack'@'% ' 또는 'jack'@'192.%'에는 사용할 수 없습니다.

## 예제 {#examples}

- 사용자 jack의 최대 연결 수를 1000으로 변경

   ```sql
   SET PROPERTY FOR 'jack' 'max_user_connections' = '1000';
   ```

- 사용자 jack의 쿼리에서 사용할 수 있는 인스턴스 수를 3000으로 변경

   ```sql
   SET PROPERTY FOR 'jack' 'max_query_instances' = '3000';
   ```

- 사용자 jack의 SQL 차단 규칙 변경

   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'rule1, rule2';
   ```

- 사용자 jack의 cpu 사용량 제한 변경

   ```sql
   SET PROPERTY FOR 'jack' 'cpu_resource_limit' = '2';
   ```

- 사용자의 리소스 태그 권한 변경

   ```sql
   SET PROPERTY FOR 'jack' 'resource_tags.location' = 'group_a, group_b';
   ```

- 사용자의 쿼리 메모리 사용량 제한 변경(바이트 단위)

   ```sql
   SET PROPERTY FOR 'jack' 'exec_mem_limit' = '2147483648';
   ```

- 사용자의 쿼리 시간 제한 변경(초 단위)

   ```sql
   SET PROPERTY FOR 'jack' 'query_timeout' = '500';
   ```
