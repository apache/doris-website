---
{
    "title": "GRANT TO",
    "language": "ko",
    "description": "GRANT 명령은 다음 용도로 사용됩니다:"
}
---

## 설명 {#description}

GRANT 명령은 다음 용도로 사용됩니다:

1. 사용자 또는 역할에 지정된 권한을 부여합니다.
2. 사용자에게 지정된 역할을 부여합니다.

**관련 명령**

- [REVOKE FROM](./REVOKE-FROM.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 구문 {#syntax}

**사용자 또는 역할에 지정된 권한 부여**

```sql
GRANT <privilege_list> 
ON { <priv_level> 
    | RESOURCE <resource_name> 
    | WORKLOAD GROUP <workload_group_name> 
    | COMPUTE GROUP <compute_group_name> 
    | STORAGE VAULT <storage_vault_name>
   } 
TO { <user_identity> | ROLE <role_name> }
```

**사용자에게 지정된 역할 부여**

```sql
GRANT <role_list> TO <user_identity> 
```

## 필수 매개변수 {#required-parameters}

**1. `<privilege_list>`**

부여할 권한을 쉼표로 구분한 목록입니다. 현재 지원되는 권한은 다음과 같습니다:

- NODE_PRIV: 노드의 온라인 및 오프라인 전환 작업을 포함한 클러스터 노드 작업 권한입니다.
- ADMIN_PRIV: NODE_PRIV를 제외한 모든 권한입니다.
- GRANT_PRIV: 사용자와 역할의 생성 및 삭제, 권한 부여 및 회수, 비밀번호 설정 등을 포함한 권한 관리 권한입니다.
- SELECT_PRIV: 지정된 데이터베이스 또는 테이블에 대한 읽기 권한입니다.
- LOAD_PRIV: 지정된 데이터베이스 또는 테이블에 대한 데이터 적재 권한입니다.
- ALTER_PRIV: 지정된 데이터베이스 또는 테이블에 대한 스키마 변경 권한입니다.
- CREATE_PRIV: 지정된 데이터베이스 또는 테이블에 대한 생성 권한입니다.
- DROP_PRIV: 지정된 데이터베이스 또는 테이블에 대한 삭제 권한입니다.
- USAGE_PRIV: 지정된 리소스 및 Workload Group에 대한 접근 권한입니다.
- SHOW_VIEW_PRIV: 뷰 생성 구문을 조회할 수 있는 권한입니다.

기존 권한 변환:

- ALL과 READ_WRITE는 SELECT_PRIV, LOAD_PRIV, ALTER_PRIV, CREATE_PRIV, DROP_PRIV로 변환됩니다.
- READ_ONLY는 SELECT_PRIV로 변환됩니다.

**2. `<priv_level>`**

다음 네 가지 형식을 지원합니다:

- ..*: 모든 Catalog와 그 안의 모든 데이터베이스 및 테이블에 권한을 적용할 수 있습니다.
- catalog_name..: 지정된 Catalog의 모든 데이터베이스 및 테이블에 권한을 적용할 수 있습니다.
- catalog_name.db.*: 지정된 데이터베이스의 모든 테이블에 권한을 적용할 수 있습니다.
- catalog_name.db.tbl: 지정된 데이터베이스의 특정 테이블에 권한을 적용할 수 있습니다.

**3. `<resource_name>`**

리소스 이름을 지정합니다. `%`와 `*`로 모든 리소스를 지정할 수 있지만, res*와 같은 와일드카드는 지원하지 않습니다.

**4. `<workload_group_name>`**

워크로드 그룹 이름을 지정합니다. `%`와 `*`로 모든 워크로드 그룹을 지정할 수 있지만, 와일드카드는 지원하지 않습니다.

**5. `<compute_group_name>`**

컴퓨트 그룹 이름을 지정합니다. `%`와 `*`로 모든 컴퓨트 그룹을 지정할 수 있지만, 와일드카드는 지원하지 않습니다.

**6. `<storage_vault_name>`**

스토리지 볼트 이름을 지정합니다. `%`와 `*`로 모든 스토리지 볼트를 지정할 수 있지만, 와일드카드는 지원하지 않습니다.

**7. `<user_identity>`**

권한을 받을 사용자를 지정합니다. CREATE USER로 생성한 user_identity여야 합니다. user_identity의 호스트는 도메인 이름일 수 있습니다. 도메인 이름인 경우 권한이 적용되기까지 약 1분이 지연될 수 있습니다.

**8. `<role_name>`**

권한을 받을 역할을 지정합니다. 지정된 역할이 없으면 자동으로 생성됩니다.

**9. `<role_list>`**

부여할 역할을 쉼표로 구분한 목록입니다. 지정된 역할은 이미 존재해야 합니다.

4.1.5부터 권한 객체 이름은 `db`, `db.table` 또는 `catalog.db.table`과 같이 최대 세 개의 구성 요소로 이루어질 수 있으며, 이에 해당하는 와일드카드 형식도 포함됩니다. 구성 요소가 세 개를 초과하면 추가 접두사를 아무런 알림 없이 무시하지 않고 거부합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한 | 객체 | 참고                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | 사용자 또는 역할   | GRANT_PRIV 권한을 가진 사용자 또는 역할만 GRANT 작업을 수행할 수 있습니다. |

4.1.5부터 `ADMIN`이 아닌 사용자가 열 권한을 부여하거나 회수하려면 기존 `GRANT` 권한과 더불어 해당 테이블 권한 또는 나열된 모든 열에 대한 해당 권한이 필요합니다. `GRANT` 권한만으로는 자신이 보유하지 않은 열 권한을 부여하거나 회수할 수 없습니다.

## 예시 {#examples}

- 사용자에게 모든 Catalog와 데이터베이스 및 테이블에 대한 권한을 부여합니다:

    ```sql
    GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
    ```

- 사용자에게 지정된 데이터베이스 테이블에 대한 권한을 부여합니다:

    ```sql
    GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1  TO 'jack'@'192.8.%';
    ```

- 역할에 지정된 데이터베이스 테이블에 대한 권한을 부여합니다:

    ```sql
    GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
    ```

- 사용자에게 모든 리소스에 대한 접근 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
    ```

- 사용자에게 지정된 리소스의 사용 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
    ```

- 역할에 지정된 리소스에 대한 접근 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
    ```

- 사용자에게 지정된 역할을 부여합니다:

    ```sql
    GRANT 'role1','role2' TO 'jack'@'%';
    ```

- 사용자 jack에게 지정된 워크로드 그룹 'g1'에 대한 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
    ```

- 모든 워크로드 그룹을 대상으로 사용자 jack에게 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
    ```

- 역할 my_role에 워크로드 그룹 'g1'에 대한 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';
    ```

- jack이 db1에 있는 view1의 생성 구문을 조회할 수 있도록 허용합니다:

    ```sql
    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';
    ```

- 사용자에게 지정된 컴퓨트 그룹의 사용 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
    ```

- 역할에 지정된 컴퓨트 그룹의 사용 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
    ```

- 사용자에게 모든 컴퓨트 그룹의 사용 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP '*' TO 'jack'@'%';
    ```

- 사용자에게 지정된 스토리지 볼트의 사용 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
    ```

- 역할에 지정된 스토리지 볼트의 사용 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
    ```

- 사용자에게 모든 스토리지 볼트의 사용 권한을 부여합니다:

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT '*' TO 'jack'@'%';
    ```
