---
{
    "title": "REVOKE FROM",
    "language": "ko",
    "description": "REVOKE 명령은 다음 기능을 제공합니다:"
}
---

## 설명 {#description}

REVOKE 명령은 다음 기능을 제공합니다:

1. 사용자 또는 역할의 지정된 권한을 회수합니다.
2. 사용자에게 이전에 부여한 지정된 역할을 회수합니다.

**관련 명령**

- [GRANT TO](./GRANT-TO.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 구문 {#syntax}

**사용자 또는 역할의 지정된 권한 회수**

```sql
REVOKE <privilege_list> 
ON { <priv_level> 
   | RESOURCE <resource_name> 
   | WORKLOAD GROUP <workload_group_name> 
   | COMPUTE GROUP <compute_group_name> 
   | STORAGE VAULT <storage_vault_name> 
   } 
FROM { <user_identity> | ROLE <role_name> }
```

**사용자에게 이전에 부여한 지정된 역할 회수**

```sql
REVOKE <role_list> FROM <user_identity> 
```

## 필수 매개변수 {#required-parameters}

**1. `<privilege_list>`**

회수할 권한을 쉼표로 구분한 목록입니다. 지원되는 권한은 다음과 같습니다:

- NODE_PRIV: 클러스터 노드 작업 권한
- ADMIN_PRIV: 관리자 권한
- GRANT_PRIV: 권한 부여 권한
- SELECT_PRIV: 쿼리 권한
- LOAD_PRIV: 데이터 적재 권한
- ALTER_PRIV: 수정 권한
- CREATE_PRIV: 생성 권한
- DROP_PRIV: 삭제 권한
- USAGE_PRIV: 사용 권한
- SHOW_VIEW_PRIV: 뷰 정의 조회 권한

**2. `<priv_level>`**

권한의 적용 범위를 지정합니다. 지원되는 형식은 다음과 같습니다:

- *.*.*: 모든 Catalog, 데이터베이스 및 테이블
- catalog_name.*.*: 지정한 Catalog의 모든 데이터베이스와 테이블
- catalog_name.db.*: 지정한 데이터베이스의 모든 테이블
- catalog_name.db.tbl: 지정한 데이터베이스의 특정 테이블

**3. `<resource_name>`**

리소스 이름을 지정합니다. 와일드카드 문자로 `%`(임의의 문자열과 일치)와 `_`(임의의 단일 문자와 일치)를 지원합니다.

**4. `<workload_group_name>`**

워크로드 그룹 이름을 지정합니다. 와일드카드 문자로 `%`(임의의 문자열과 일치)와 `_`(임의의 단일 문자와 일치)를 지원합니다.

**5. `<compute_group_name>`**

컴퓨트 그룹 이름을 지정합니다. 와일드카드 문자로 `%`(임의의 문자열과 일치)와 `_`(임의의 단일 문자와 일치)를 지원합니다.

**6. `<storage_vault_name>`**

스토리지 볼트 이름을 지정합니다. 와일드카드 문자로 `%`(임의의 문자열과 일치)와 `_`(임의의 단일 문자와 일치)를 지원합니다.


**7. `<user_identity>`**

사용자 식별 정보를 지정합니다. 사용자는 CREATE USER 문으로 생성된 사용자여야 합니다. 사용자 식별 정보의 호스트 부분에는 도메인 이름을 사용할 수 있으며, 도메인 이름을 사용하는 경우 권한 회수가 적용되기까지 1분 지연될 수 있습니다.

**8. `<role_name>`**

역할 이름을 지정합니다. 해당 역할이 존재해야 합니다.

**9. `<role_list>`**

회수할 역할을 쉼표로 구분한 목록입니다. 지정한 모든 역할이 존재해야 합니다.

4.1.5부터 권한 객체 이름은 `db`, `db.table` 또는 `catalog.db.table`과 같이 최대 세 개의 구성 요소로 이루어지며, 이에 대응하는 와일드카드 형식도 포함됩니다. 구성 요소가 세 개를 초과하면 추가 접두사를 묵시적으로 무시하는 대신 해당 이름을 거부합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한 | 객체 | 참고                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | 사용자 또는 역할   | GRANT_PRIV 권한이 있는 사용자나 역할만 REVOKE 작업을 수행할 수 있습니다. |

4.1.5부터 `ADMIN`이 아닌 사용자가 열 권한을 부여하거나 회수하려면 기존 `GRANT` 권한과 함께 해당 테이블 권한 또는 나열된 모든 열 각각에 대한 해당 권한이 필요합니다. `GRANT` 권한만으로는 자신이 보유하지 않은 열 권한을 부여하거나 회수할 수 없습니다.

## 예제 {#examples}

사전 준비: 아래 예제에서 권한이나 역할을 회수할 대상인 사용자, 역할, 데이터베이스, 워크로드 그룹을 생성하고, 필요한 `GRANT` 문을 미리 실행하여 각 `REVOKE`로 회수할 권한을 부여합니다(부여한 적이 없는 권한은 회수할 수 없습니다):

```sql
CREATE DATABASE db1;
CREATE USER jack@'192.%' IDENTIFIED BY 'jack_pwd';
CREATE USER jack@'%' IDENTIFIED BY 'jack_pwd';
CREATE ROLE role1;
CREATE ROLE role2;
CREATE ROLE my_role;
CREATE WORKLOAD GROUP g1 PROPERTIES("max_cpu_percent"="10");

GRANT SELECT_PRIV ON db1.* TO 'jack'@'192.%';
GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'192.%';
GRANT 'role1','role2' TO 'jack'@'192.%';
GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
GRANT USAGE_PRIV ON STORAGE VAULT '%' TO 'jack'@'%';
```

- 사용자의 특정 데이터베이스에 대한 SELECT 권한 회수:

   ```sql
   REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';
   ```

- 사용자의 특정 리소스에 대한 사용 권한 회수:

   ```sql
   REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';
   ```

- 사용자에게 부여된 역할 회수:

   ```sql
   REVOKE 'role1','role2' FROM 'jack'@'192.%';
   ```

- 사용자의 특정 워크로드 그룹에 대한 사용 권한 회수:

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM 'jack'@'%';
   ```

- 사용자의 모든 워크로드 그룹에 대한 사용 권한 회수:

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP '%' FROM 'jack'@'%';
   ```

- 사용자의 모든 컴퓨트 그룹에 대한 사용 권한 회수:

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM 'jack'@'%';
   ```

- 역할의 컴퓨트 그룹에 대한 사용 권한 회수:

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM ROLE 'my_role';
   ```

- 사용자의 모든 스토리지 볼트에 대한 사용 권한 회수:

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM 'jack'@'%';
   ```

- 역할의 스토리지 볼트에 대한 사용 권한 회수:

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM ROLE 'my_role';
   ```

- 역할의 모든 스토리지 볼트에 대한 사용 권한 회수:

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT '%' FROM 'jack'@'%';
   ```
