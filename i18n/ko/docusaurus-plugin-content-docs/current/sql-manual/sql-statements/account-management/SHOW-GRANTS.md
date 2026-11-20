---
{
    "title": "SHOW GRANTS",
    "language": "ko",
    "description": "SHOW GRANTS 출력으로 Apache Doris 사용자의 권한을 확인하고 보조 비밀번호가 유지된 계정을 식별합니다."
}
---

## 설명 {#description}

 이 문은 사용자 권한을 조회하는 데 사용합니다.

## 문법 {#syntax}

```sql
SHOW [ALL] GRANTS [FOR <user_identity>];
```

## 선택적 매개변수 {#optional-parameters}

**1. `[ALL]`**

모든 사용자의 권한을 조회할지 지정합니다.

**2. `<user_identity>`**

  권한을 조회할 사용자를 지정합니다. `user_identity`는 `CREATE USER` 명령으로 생성된 사용자여야 합니다.

## 반환값 {#return-value}

  | 열 | 설명 |
  | -- | -- |
  | UserIdentity | 사용자 식별자 |
  | Comment | 주석 |
  | Password | 사용 가능한 로컬 비밀번호가 없으면 `No`, 기본 비밀번호만 있으면 `Yes`, 유지된 보조 비밀번호도 있으면 `Yes (dual)`을 표시합니다(4.2.1부터). |
  | Roles | 역할 |
  | GlobalPrivs | 전역 권한 |
  | CatalogPrivs | Catalog 권한 |
  | DatabasePrivs | 데이터베이스 권한 |
  | TablePrivs | 테이블 권한 |
  | ColPrivs | 열 권한 |
  | ResourcePrivs | 리소스 권한 |
  | WorkloadGroupPrivs | WorkloadGroup 권한 |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 필요합니다.

| 권한 | 객체 | 설명                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | 사용자 또는 역할    | 모든 사용자의 권한을 조회하려면 사용자 또는 역할에 `GRANT_PRIV` 권한이 있어야 합니다. 그렇지 않으면 현재 사용자의 권한만 조회할 수 있습니다. |

## 사용 시 참고 사항 {#usage-notes}
  - `SHOW ALL GRANTS`로 모든 사용자의 권한을 조회하려면 `GRANT_PRIV` 권한이 필요합니다.
  - `user_identity`를 지정하면 해당 사용자의 권한을 조회합니다. 이 `user_identity`는 `CREATE USER` 명령으로 생성된 사용자여야 합니다.
  - `user_identity`를 지정하지 않으면 현재 사용자의 권한을 조회합니다.
  - Doris는 RBAC(Role-Based Access Control) 모델을 기반으로 권한을 제어합니다. 따라서 여기에 표시되는 권한은 실제로 사용자에게 할당된 모든 역할의 권한을 합친 것입니다. 특정 권한이 어떤 역할에서 부여되었는지 확인하려면 [SHOW ROLES](./SHOW-ROLES.md) 명령으로 세부 정보를 조회할 수 있습니다.

## 예시 {#examples}

1. 모든 사용자의 권한 정보를 조회합니다.

   ```sql
   SHOW ALL GRANTS;
   ```

   ```text
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | UserIdentity | Comment | Password | Roles    | GlobalPrivs          | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | 'root'@'%'   | ROOT    | No       | operator | Node_priv,Admin_priv | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   | 'admin'@'%'  | ADMIN   | No       | admin    | Admin_priv           | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   | 'jack'@'%'   |         | No       |          | NULL                 | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   ```

2. 지정한 사용자의 권한을 조회합니다.

    ```sql
    SHOW GRANTS FOR jack@'%';
    ```

    ```text
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    | UserIdentity | Comment | Password | Roles | GlobalPrivs | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    | 'jack'@'%'   |         | No       |       | NULL        | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    ```

3. 현재 사용자의 권한을 조회합니다.

   ```sql
   SHOW GRANTS;
   ```

   ```text
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | UserIdentity | Comment | Password | Roles    | GlobalPrivs          | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | 'root'@'%'   | ROOT    | No       | operator | Node_priv,Admin_priv | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   ```
