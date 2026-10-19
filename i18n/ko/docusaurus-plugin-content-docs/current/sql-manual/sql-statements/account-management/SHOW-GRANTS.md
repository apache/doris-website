---
{
    "title": "SHOW GRANTS",
    "language": "ko",
    "description": "이 문은 사용자의 권한을 조회하는 데 사용됩니다."
}
---

## 설명 {#description}

 이 문은 사용자의 권한을 조회하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW [ALL] GRANTS [FOR <user_identity>];
```

## 선택적 매개변수 {#optional-parameters}

**1. `[ALL]`**

모든 사용자의 권한을 조회할지 여부입니다.

**2. `<user_identity>`**

  권한을 조회할 사용자를 지정합니다. `user_identity`는 `CREATE USER` 명령으로 생성되어 있어야 합니다.

## 반환 값 {#return-value}

  | 열 | 설명 |
  | -- | -- |
  | UserIdentity | 사용자 식별 정보 |
  | Comment | 주석 |
  | Password | 비밀번호 설정 여부 |
  | Roles | 역할 |
  | GlobalPrivs | 전역 권한 |
  | CatalogPrivs | Catalog 권한 |
  | DatabasePrivs | 데이터베이스 권한 |
  | TablePrivs | 테이블 권한 |
  | ColPrivs | 열 권한 |
  | ResourcePrivs | 리소스 권한 |
  | WorkloadGroupPrivs | WorkloadGroup 권한 |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다.

| 권한 | 객체 | 참고 사항                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | 사용자 또는 역할    | 사용자 또는 역할에 `GRANT_PRIV` 권한이 있으면 모든 사용자의 권한을 조회할 수 있으며, 그렇지 않으면 현재 사용자의 권한만 조회할 수 있습니다 |

## 사용 시 참고 사항 {#usage-notes}
  - `SHOW ALL GRANTS`로 모든 사용자의 권한을 조회할 수 있지만, `GRANT_PRIV` 권한이 필요합니다.
  - `user_identity`를 지정하면 해당 사용자의 권한을 조회합니다. 이때 `user_identity`는 `CREATE USER` 명령으로 생성되어 있어야 합니다.
  - `user_identity`를 지정하지 않으면 현재 사용자의 권한을 조회합니다.
  - Doris는 RBAC(역할 기반 접근 제어) 모델을 기반으로 권한 제어를 구현합니다. 따라서 여기에 표시되는 권한은 실제로 사용자에게 할당된 모든 역할의 권한을 합친 것입니다. 특정 권한이 어떤 역할에서 부여되었는지 확인하려면 [SHOW ROLES](./SHOW-ROLES.md) 명령으로 세부 정보를 조회할 수 있습니다.

## 예제 {#examples}

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

2. 지정한 사용자의 권한을 조회합니다

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

3. 현재 사용자의 권한을 조회합니다

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
