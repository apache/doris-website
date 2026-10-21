---
{
    "title": "기본 제공 권한 관리",
    "language": "ko",
    "description": "RBAC 모델을 기반으로 권한, 역할, 사용자의 세 계층 구조를 통해 Doris 리소스에 대한 세분화된 접근 제어를 구현합니다."
}
---

<!-- Knowledge type: Concept explanation + Architecture decision -->
<!-- Applicable scenarios: Privilege planning / Access control design / Multi-business isolation -->

Doris의 기본 제공 권한 관리는 **RBAC (Role-Based Access Control, 역할 기반 접근 제어)** 모델을 기반으로 합니다. "권한 → 역할 → 사용자"의 세 계층 구조를 통해 사용자의 식별 정보에 따라 노드, Catalog, 데이터베이스, 테이블, 컬럼, Resource, Workload Group 등의 리소스에 대한 각 사용자의 접근과 작업을 제한합니다.

이 문서에서는 Doris의 기본 제공 권한 관리에 관한 핵심 개념, 동작 방식, 관련 SQL 명령어, 대표적인 권한 설계 시나리오를 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오                                  | 권장 방식                                                                                       |
|-------------------------------------------|------------------------------------------------------------------------------------------------------------|
| 클러스터 운영(관리자)        | `Admin_priv` 또는 `Node_priv`를 부여하고 기본 제공 역할인 `operator` / `admin`을 사용합니다.                         |
| 데이터 개발(데이터베이스/테이블 생성, 데이터 적재) | 지정된 데이터베이스/테이블에 `CREATE`, `DROP`, `ALTER`, `LOAD`, `SELECT` 권한을 부여합니다.       |
| 데이터 쿼리(읽기 전용 접근)             | 지정된 데이터베이스/테이블/컬럼에 `Select_priv`를 부여합니다.                                                  |
| 여러 업무와 테넌트가 공유하는 클러스터 | 각 업무 데이터베이스에 대해 데이터베이스 수준의 `Grant_priv`를 가진 "업무 관리자" 사용자를 생성하고, 해당 사용자가 자체 업무 사용자를 관리하도록 합니다. |
| 리소스 / 워크로드 격리             | `Usage_priv`를 통해 Resource와 Workload Group의 사용을 제어합니다.                                        |
| 민감한 필드 보호(전화번호, 신분증 번호 등) | 컬럼 수준의 `Select_priv`를 사용하거나, [데이터 접근 제어](../authorization/data)와 함께 행 수준 정책을 구성합니다. |

## 핵심 개념 {#core-concepts}

Doris의 권한 관리는 다음 세 가지 핵심 요소로 구성됩니다.

- **권한**: 특정 리소스 객체에 대한 작업 권한입니다(읽기, 쓰기, 수정 등).
- **역할**: 사용자에게 부여할 수 있는 권한의 집합입니다.
- **사용자**: 작업을 시작하는 주체로, `user_name`과 `host`로 고유하게 식별됩니다.

### 권한 {#privilege}

권한이 적용되는 객체에는 노드, Catalog, 데이터베이스, 테이블, 컬럼, Resource, Workload Group이 포함됩니다. 각 권한은 서로 다른 작업을 허용합니다.

#### 전체 권한 항목 {#all-privilege-items}

<!-- Knowledge type: Configuration parameter -->

| 권한      | 객체 유형                                       | 설명                                                                                                                                                                                            |
|----------------|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv     | 전역                                            | 최고 관리자 권한입니다.                                                                                                                                                                          |
| Node_priv      | 전역                                            | 노드 변경 권한입니다. FE, BE, BROKER 노드의 추가, 제거, 운영 중단 등의 작업이 포함됩니다.                                                                                |
| Grant_priv     | 전역, Catalog, 데이터베이스, 테이블, Resource, Workload Group | 권한 변경 권한입니다. 권한 부여 및 회수, 사용자와 역할의 추가, 제거, 수정 등의 작업을 허용합니다.<br />다른 사용자/역할에 권한을 부여할 때: 2.1.2 버전 이전에는 현재 사용자에게 해당 수준의 `Grant_priv`만 있으면 됩니다. 2.1.2 버전부터는 현재 사용자가 부여하려는 리소스 권한도 보유해야 합니다.<br />다른 사용자에게 역할을 할당할 때는 현재 사용자가 전역 수준의 `Grant_priv`를 보유해야 합니다. |
| Select_priv    | 전역, Catalog, 데이터베이스, 테이블, 컬럼                | Catalog, 데이터베이스, 테이블, 컬럼에 대한 읽기 전용 권한입니다.                                                                                                                                          |
| Load_priv      | 전역, Catalog, 데이터베이스, 테이블                        | Catalog, 데이터베이스, 테이블에 대한 쓰기 권한입니다. Load, Insert, Delete 등의 작업이 포함됩니다.                                                                                                            |
| Alter_priv     | 전역, Catalog, 데이터베이스, 테이블                        | Catalog, 데이터베이스, 테이블에 대한 수정 권한입니다. 데이터베이스/테이블 이름 변경, 컬럼 추가/제거/수정, 파티션 추가/제거 등의 작업이 포함됩니다.                                        |
| Create_priv    | 전역, Catalog, 데이터베이스, 테이블                        | Catalog, 데이터베이스, 테이블, 뷰를 생성하는 권한입니다.                                                                                                                                              |
| Drop_priv      | 전역, Catalog, 데이터베이스, 테이블                        | Catalog, 데이터베이스, 테이블, 뷰를 삭제하는 권한입니다.                                                                                                                                                |
| Usage_priv     | Resource, Workload Group                          | Resource와 Workload Group에 대한 사용 권한입니다.                                                                                                                                                          |
| Show_view_priv | 전역, Catalog, 데이터베이스, 테이블                        | `SHOW CREATE VIEW`를 실행하는 권한입니다.                                                                                                                                                                |

#### 권한 수준 {#privilege-levels}

동일한 권한을 서로 다른 수준에서 부여할 수 있습니다. `GRANT` 문에 지정된 리소스 경로가 권한의 적용 범위를 결정합니다.

| 수준          | 권한 부여 경로 예시                                            | 적용 범위                                                  |
|----------------|---------------------------------------------------------------|--------------------------------------------------------|
| 전역         | `GRANT ... ON *.*.* TO user1`                                 | 모든 Catalog의 모든 데이터베이스 또는 테이블                   |
| Catalog        | `GRANT ... ON ctl.*.* TO user1`                               | 지정된 Catalog의 모든 데이터베이스 또는 테이블         |
| 데이터베이스       | `GRANT ... ON ctl.db.* TO user1`                              | 지정된 데이터베이스의 모든 테이블                    |
| 테이블          | `GRANT ... ON ctl.db.tbl TO user1`                            | 지정된 테이블의 모든 컬럼                      |
| 컬럼         | `GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1`         | 지정된 테이블의 지정된 컬럼. 현재 컬럼 권한은 `Select_priv`만 지원합니다. |
| 행            | 정책에 따라 정의합니다. [데이터 접근 제어](../authorization/data)를 참조하세요. | 사용자가 접근할 수 있는 데이터 행을 제어합니다.         |
| Resource       | `GRANT USAGE_PRIV ON RESOURCE '%' TO user1`                   | Resource 사용. `Usage_priv`와 `Grant_priv`만 지원합니다. |
| Workload Group | `GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO user1`             | Workload Group 사용. `Usage_priv`와 `Grant_priv`만 지원합니다. |

:::tip
`Admin_priv`는 전역 수준에서만 부여하거나 회수할 수 있습니다.
:::

### 역할 {#role}

역할은 권한의 집합입니다. 사용자에게 역할을 할당하면 해당 사용자는 그 역할의 모든 권한을 자동으로 상속받습니다. 이후 역할의 권한이 변경되면 해당 역할을 가진 모든 사용자에게도 변경 사항이 반영됩니다.

#### 기본 제공 역할 {#built-in-roles}

Doris는 기본적으로 다음 두 가지 역할을 생성합니다.

| 기본 제공 역할 | 기본 권한         | 대표적인 용도                            |
|---------------|----------------------------|----------------------------------------|
| operator      | `Admin_priv` + `Node_priv` | 클러스터 운영, 노드 변경  |
| admin         | `Admin_priv`               | 업무 관리, 데이터 관리   |

#### 사용자 정의 역할 {#custom-roles}

`CREATE ROLE`로 이름이 있는 역할을 생성하고, 자주 사용하는 권한을 조합하여 여러 사용자에게 일괄 부여할 수 있습니다. 이를 통해 권한을 통합 관리하고 회수하기가 쉬워집니다.

### 사용자 {#user}

Doris에서는 `user_identity`로 사용자를 고유하게 식별합니다. `user_identity`는 다음 두 부분으로 구성됩니다.

- `user_name`: 사용자 이름입니다.
- `host`: 사용자 클라이언트가 접속하는 호스트 주소입니다.

## 권한 관리 동작 방식 {#authorization-mechanism}

<!-- Knowledge type: Architecture principle -->

Doris의 권한 시스템은 RBAC 모델을 기반으로 합니다. 사용자는 역할과 연결되고, 역할은 권한과 연결됩니다. **사용자는 역할을 통해 간접적으로 권한을 보유합니다.**

```
┌────────┐        ┌────────┐         ┌────────┐
│  user1 ├────┬───►  role1 ├────┬────►  priv1 │
└────────┘    │   └────────┘    │    └────────┘
              │                 │
              │                 │
              │   ┌────────┐    │
              │   │  role2 ├────┤
┌────────┐    │   └────────┘    │    ┌────────┐
│  user2 ├────┘                 │  ┌─►  priv2 │
└────────┘                      │  │ └────────┘
                  ┌────────┐    │  │
           ┌──────►  role3 ├────┘  │
           │      └────────┘       │
           │                       │
           │                       │
┌────────┐ │      ┌────────┐       │ ┌────────┐
│  userN ├─┴──────►  roleN ├───────┴─►  privN │
└────────┘        └────────┘         └────────┘
```

위 그림에서 볼 수 있듯이:

- `user1`과 `user2`는 모두 `priv1` 권한을 보유하며, 이 권한은 `role1`을 통해 부여됩니다.
- `userN`이 보유한 `priv1` 권한은 `role3`을 통해, `priv2`와 `privN` 권한은 `roleN`을 통해 부여됩니다. 따라서 `userN`은 `priv1`, `priv2`, `privN` 권한을 동시에 보유합니다.

### 권한 상속 및 회수 규칙 {#privilege-inheritance-and-revocation-rules}

- 역할이 삭제되면 해당 역할을 가진 사용자는 그 역할의 모든 권한을 **자동으로 잃습니다**.
- 사용자의 역할 할당이 해제되면 해당 사용자는 그 역할의 모든 권한을 **자동으로 잃습니다**.
- 역할의 권한이 추가되거나 제거되면 해당 역할을 가진 모든 사용자의 권한도 **동시에 변경됩니다**.

### 참고 사항 {#notes}

- 편의를 위해 Doris는 사용자에게 직접 권한을 부여하는 방식을 지원합니다. 내부 구현에서는 사용자마다 전용 **기본 역할**을 생성합니다. 사용자에게 직접 권한을 부여하면 실제로는 이 기본 역할에 권한이 부여됩니다.
- 기본 역할은 삭제하거나 다른 사용자에게 할당할 수 없습니다. 사용자가 삭제되면 해당 사용자의 기본 역할도 자동으로 삭제됩니다.

## 관련 SQL 명령어 {#related-sql-commands}

<!-- Knowledge type: Command reference -->

| 작업 유형          | 명령어                                                                                  |
|-----------------------------|------------------------------------------------------------------------------------------|
| 권한 부여 / 역할 할당         | [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)                  |
| 권한 회수 / 역할 할당 해제      | [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM)              |
| 역할 생성                 | [CREATE ROLE](../../../sql-manual/sql-statements/account-management/CREATE-ROLE)         |
| 역할 삭제                   | [DROP ROLE](../../../sql-manual/sql-statements/account-management/DROP-ROLE)             |
| 역할 변경                  | [ALTER ROLE](../../../sql-manual/sql-statements/account-management/ALTER-ROLE)           |
| 현재 사용자의 권한 조회 | [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)         |
| 모든 사용자의 권한 조회    | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)     |
| 생성된 역할 조회          | [SHOW ROLES](../../../sql-manual/sql-statements/account-management/SHOW-ROLES)           |
| 지원되는 모든 권한 항목 조회 | [SHOW PRIVILEGES](../../../sql-manual/sql-statements/account-management/SHOW-PRIVILEGES) |

## 권장 사용 방법 {#best-practices}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Privilege planning / Multi-business isolation -->

다음은 Doris 권한 시스템을 활용하는 두 가지 대표적인 시나리오입니다.

### 시나리오 1: 단일 업무 클러스터에서 역할에 따른 업무 분담 {#scenario-1-role-based-division-of-duties-in-a-single-business-cluster}

Doris 클러스터의 사용자를 관리자(Admin), 개발 엔지니어(RD), 클라이언트(Client)로 구분합니다.

- **관리자**: 클러스터 전체의 모든 권한을 보유하며 클러스터 구축, 노드 관리 등을 담당합니다.
- **개발 엔지니어(RD)**: 데이터베이스와 테이블 생성, 데이터 적재 및 수정 등 업무 모델링을 담당합니다.
- **클라이언트**: 여러 데이터베이스와 테이블에 접근하여 데이터를 조회합니다.

권장 권한 부여 방안은 다음과 같습니다.

- 관리자: `Admin_priv` 또는 전역 `Grant_priv`를 부여합니다.
- RD: 모든 데이터베이스/테이블 또는 지정된 데이터베이스/테이블에 `Create_priv`, `Drop_priv`, `Alter_priv`, `Load_priv`, `Select_priv`를 부여합니다.
- 클라이언트: 모든 데이터베이스/테이블 또는 지정된 데이터베이스/테이블에 `Select_priv`를 부여합니다.

서로 다른 역할을 생성하면 여러 사용자에 대한 일괄 권한 부여를 간소화할 수 있습니다.

### 시나리오 2: 여러 업무를 운영하는 클러스터에서 관리 권한 위임 {#scenario-2-delegated-management-in-a-multi-business-cluster}

하나의 클러스터에서 여러 업무를 운영합니다. 각 업무는 하나 이상의 데이터베이스를 사용하며, 자체 사용자를 관리해야 합니다.

권장 권한 부여 방안: 관리자는 각 업무 데이터베이스에 대해 "업무 관리자" 사용자를 생성하고, 해당 사용자에게 그 데이터베이스에 대한 데이터베이스 수준의 `Grant_priv`를 부여합니다. 이 사용자는 권한을 부여받은 데이터베이스 범위 내에서만 다른 사용자에게 권한을 부여할 수 있습니다. 이를 통해 업무 간 권한 격리와 자체 관리가 가능합니다.
