---
{
    "title": "인증 및 권한 부여",
    "language": "ko",
    "description": "Doris의 권한 관리 시스템은 MySQL의 권한 관리 방식을 바탕으로 설계되었습니다."
}
---

Doris의 권한 관리 시스템은 MySQL의 권한 관리 방식을 바탕으로 설계되었습니다. 행과 열 수준의 세분화된 권한 제어, 역할 기반 접근 제어, 화이트리스트 기능을 지원합니다.

## 용어 설명 {#glossary}

1. 사용자 식별자

   권한 시스템에서는 사용자 식별자(User Identity)로 사용자를 식별합니다. 사용자 식별자는 `username`과 `host`로 구성됩니다. `username`은 영문 대소문자로 구성된 사용자 이름입니다. `host`는 사용자가 접속하는 IP를 나타냅니다. 사용자 식별자는 `username@'host'`로 표현하며, 이는 `username`이 `host`에서 접속한다는 의미입니다.

   사용자 식별자는 `username@['domain']`으로 표현할 수도 있습니다. 여기서 `domain`은 DNS를 통해 IP 집합으로 해석할 수 있는 도메인 이름을 의미합니다. 이는 최종적으로 `username@'host'`의 집합으로 표현되므로, 이후에는 모두 `username@'host'`로 표기합니다.

2. 권한

   권한은 노드, 데이터 디렉터리, 데이터베이스 또는 테이블에 적용됩니다. 각 권한은 서로 다른 작업의 수행 권한을 나타냅니다.

3. 역할

   Doris에서는 원하는 이름으로 역할을 생성할 수 있습니다. 역할은 권한의 집합으로 볼 수 있습니다. 새로 생성한 사용자에게 역할을 할당하면 해당 역할의 권한을 자동으로 상속받습니다. 이후 역할의 권한을 변경하면 해당 역할에 연결된 모든 사용자의 권한에도 변경 사항이 반영됩니다.

4. 사용자 속성

   사용자 속성은 사용자 식별자가 아닌 사용자에게 직접 속합니다. 즉, `user@'192.%'`와 `user@['domain']`은 동일한 사용자 속성 집합을 공유합니다. 이 속성은 사용자 `user`에 속하며, `user@'192.%'`나 `user@['domain']`에 속하지 않습니다.

   사용자 속성에는 최대 사용자 연결 수, 데이터 적재 클러스터 설정 등이 포함됩니다.

## 인증 및 권한 부여 프레임워크 {#authentication-and-authorization-framework}

사용자가 Apache Doris에 로그인하는 과정은 **인증**과 **권한 부여**로 나뉩니다.

- 인증: 사용자가 제공한 자격 증명(사용자 이름, 클라이언트 IP, 비밀번호 등)을 바탕으로 신원을 확인합니다. 확인이 완료되면 해당 사용자를 시스템에 정의된 사용자 식별자에 매핑합니다.
- 권한 부여: 인증으로 얻은 사용자 식별자에 연결된 권한을 바탕으로, 사용자가 수행하려는 작업에 필요한 권한을 보유하고 있는지 확인합니다.

## 인증 {#authentication}

Doris는 내장 인증 방식과 LDAP 인증을 지원합니다.

### Doris 내장 인증 방식 {#doris-built-in-authentication-scheme}

Doris 자체에 저장된 사용자 이름, 비밀번호 등의 정보를 바탕으로 인증합니다.

관리자는 `CREATE USER` 명령으로 사용자를 생성하고, `SHOW ALL GRANTS` 명령으로 모든 사용자의 권한과 역할을 확인할 수 있습니다.

사용자가 로그인하면 시스템은 사용자 이름, 비밀번호, 클라이언트 IP 주소가 올바른지 확인합니다.

#### 비밀번호 정책 {#password-policy}

Doris는 사용자가 비밀번호를 보다 효과적으로 관리할 수 있도록 다음 비밀번호 정책을 지원합니다.

1. `PASSWORD_HISTORY`

    현재 비밀번호를 재설정할 때 이전에 사용한 비밀번호를 재사용할 수 있는지 결정합니다. 예를 들어 `PASSWORD_HISTORY 10`은 최근 10개의 비밀번호를 새 비밀번호로 재사용할 수 없음을 의미합니다. `PASSWORD_HISTORY DEFAULT`로 설정하면 전역 변수 `PASSWORD_HISTORY`의 값을 사용합니다. 0으로 설정하면 이 기능이 비활성화됩니다. 기본값은 0입니다.

    예시:

    - 전역 변수 설정: `SET GLOBAL password_history = 10`
    - 사용자별 설정: `ALTER USER user1@'ip' PASSWORD_HISTORY 10`

2. `PASSWORD_EXPIRE`

    현재 사용자의 비밀번호 만료 기간을 설정합니다. 예를 들어 `PASSWORD_EXPIRE INTERVAL 10 DAY`는 비밀번호가 10일 후에 만료됨을 의미합니다. `PASSWORD_EXPIRE NEVER`는 비밀번호가 만료되지 않음을 나타냅니다. `PASSWORD_EXPIRE DEFAULT`로 설정하면 전역 변수 `default_password_lifetime`의 값(일 단위)을 사용합니다. 기본값은 NEVER(또는 0)이며, 만료되지 않음을 의미합니다.

    예시:

    - 전역 변수 설정: `SET GLOBAL default_password_lifetime = 1`
    - 사용자별 설정: `ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

3. `FAILED_LOGIN_ATTEMPTS` 및 `PASSWORD_LOCK_TIME`

    비밀번호 입력 오류가 몇 번 발생하면 사용자 계정을 잠글지, 얼마나 오래 잠글지 설정합니다. 예를 들어 `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`는 로그인에 3번 실패하면 계정을 하루 동안 잠근다는 의미입니다. 관리자는 `ALTER USER` 문으로 계정 잠금을 해제할 수 있습니다.

    예시:

    - 사용자별 설정: `ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

4. 비밀번호 강도

    전역 변수 `validate_password_policy`로 제어합니다. 기본값은 `NONE/0`이며, 비밀번호 강도를 검사하지 않습니다. `STRONG/2`로 설정하면 비밀번호에 대문자, 소문자, 숫자, 특수 문자 중 최소 세 가지를 포함해야 하며, 길이는 최소 8자여야 합니다.

    예시:

    - `SET validate_password_policy=STRONG`

    Doris 4.0.4부터 비밀번호 강도 검증 정책이 다음과 같이 강화되었습니다.

    1. `validate_password_policy`를 `STRONG/2`로 설정하면 비밀번호에 **4가지 문자 유형을 모두 포함**해야 합니다(대문자, 소문자, 숫자, 특수 문자). 기존 요구 사항은 "4가지 중 3가지"였습니다.

    2. **사전 단어 검사** 추가: 비밀번호에 흔히 사용되는 취약한 단어(password, admin, test, root 등)를 포함할 수 없습니다. 시스템에는 흔히 사용되는 취약한 단어 사전이 내장되어 있으며, 해당 단어를 포함한 비밀번호는 거부됩니다.

    3. **사용자 지정 사전 파일** 지원: 전역 변수 `validate_password_dictionary_file`로 사용자 지정 사전 파일 이름을 지정할 수 있습니다. 사전 파일은 `${DORIS_HOME}/plugins/security/` 디렉터리에 배치해야 합니다. 파일은 한 줄에 한 단어를 작성하는 형식이며, 빈 줄과 `#`으로 시작하는 줄은 무시됩니다.

       예시:
       - `SET GLOBAL validate_password_dictionary_file = 'my_dictionary.txt'`

자세한 내용은 [ALTER USER](../../sql-manual/sql-statements/account-management/ALTER-USER.md)를 참조하세요.

### LDAP 기반 인증 방식 {#ldap-based-authentication-scheme}

[LDAP 기반 인증 방식](./authentication/ldap.md)을 참조하세요.

## 권한 부여 {#authorization}

### 권한 관련 작업 {#permission-operations}

- 사용자 생성: [CREATE USER](../../sql-manual/sql-statements/account-management/CREATE-USER)
- 사용자 수정: [ALTER USER](../../sql-manual/sql-statements/account-management/ALTER-USER.md)
- 사용자 삭제: [DROP USER](../../sql-manual/sql-statements/account-management/DROP-USER.md)
- 권한 부여/역할 할당: [GRANT](../../sql-manual/sql-statements/account-management/GRANT-TO)
- 권한 회수/역할 해제: [REVOKE](../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)
- 역할 생성: [CREATE ROLE](../../sql-manual/sql-statements/account-management/CREATE-ROLE.md)
- 역할 삭제: [DROP ROLE](../../sql-manual/sql-statements/account-management/DROP-ROLE.md)
- 역할 수정: [ALTER ROLE](../../sql-manual/sql-statements/account-management/ALTER-ROLE.md)
- 현재 사용자의 권한 및 역할 확인: [SHOW GRANTS](../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- 모든 사용자의 권한 및 역할 확인: [SHOW ALL GRANTS](../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- 생성된 역할 확인: [SHOW ROLES](../../sql-manual/sql-statements/account-management/SHOW-ROLES.md)
- 사용자 속성 설정: [SET PROPERTY](../../sql-manual/sql-statements/account-management/SET-PROPERTY.md)
- 사용자 속성 확인: [SHOW PROPERTY](../../sql-manual/sql-statements/account-management/SHOW-PROPERTY.md)
- 비밀번호 변경: [SET PASSWORD](../../sql-manual/sql-statements/account-management/SET-PASSWORD.md)
- 지원되는 모든 권한 확인: [SHOW PRIVILEGES]
- 행 정책 확인: [SHOW ROW POLICY]
- 행 정책 생성: [CREATE ROW POLICY]

### 권한 유형 {#types-of-permissions}

Doris는 현재 다음 권한을 지원합니다.

1. `Node_priv`

    노드 변경 권한입니다. FE, BE, BROKER 노드의 추가, 삭제, 오프라인 전환을 포함합니다.

    Root 사용자는 기본적으로 이 권한을 가집니다. `Grant_priv`와 `Node_priv`를 모두 가진 사용자는 다른 사용자에게 이 권한을 부여할 수 있습니다.

    이 권한은 Global 수준에서만 부여할 수 있습니다.

2. `Grant_priv`

    권한을 변경할 수 있는 권한입니다. 권한 부여 및 회수, 사용자/역할의 추가/삭제/수정 등의 작업을 수행할 수 있습니다.

    2.1.2 버전 이전에는 다른 사용자/역할에 권한을 부여할 때 현재 사용자에게 해당 수준의 `Grant_priv` 권한만 있으면 되었습니다. 2.1.2 버전 이후에는 권한을 부여하려는 리소스에 대한 권한도 필요합니다.

    다른 사용자에게 역할을 할당하려면 Global 수준의 `Grant_priv` 권한이 필요합니다.

3. `Select_priv`

    데이터 디렉터리, 데이터베이스, 테이블에 대한 읽기 전용 권한입니다.

4. `Load_priv`

    데이터 디렉터리, 데이터베이스, 테이블에 대한 쓰기 권한입니다. 데이터 적재, Insert, Delete 등을 포함합니다.

5. `Alter_priv`

    데이터 디렉터리, 데이터베이스, 테이블에 대한 변경 권한입니다. 데이터베이스/테이블 이름 변경, 열 추가/삭제/수정, 파티션 추가/삭제 등을 포함합니다.

6. `Create_priv`

    데이터 디렉터리, 데이터베이스, 테이블, 뷰를 생성할 수 있는 권한입니다.

7. `Drop_priv`

    데이터 디렉터리, 데이터베이스, 테이블, 뷰를 삭제할 수 있는 권한입니다.

8. `Usage_priv`

    Resource 및 Workload Group에 대한 사용 권한입니다.

9. `Show_view_priv`

    `SHOW CREATE VIEW`를 실행할 수 있는 권한입니다.

### 권한 수준 {#permission-levels}

#### 전역 권한 {#global-permissions}

GRANT 문에서 범위를 `*.*.*`로 지정하여 부여하는 권한입니다. 모든 Catalog 내의 모든 테이블에 적용됩니다.

#### Catalog 권한 {#catalog-permissions}

GRANT 문에서 범위를 `ctl.*.*`로 지정하여 부여하는 권한입니다. 지정한 Catalog 내의 모든 테이블에 적용됩니다.

#### 데이터베이스 권한 {#database-permissions}

GRANT 문에서 범위를 `ctl.db.*`로 지정하여 부여하는 권한입니다. 지정한 데이터베이스 내의 모든 테이블에 적용됩니다.

#### 테이블 권한 {#table-permissions}

GRANT 문에서 범위를 `ctl.db.tbl`로 지정하여 부여하는 권한입니다. 지정한 테이블 내의 모든 열에 적용됩니다.

#### 열 권한 {#column-permissions}

열 권한은 주로 테이블 내 특정 열에 대한 사용자 접근을 제한하는 데 사용됩니다. 관리자는 열 권한으로 특정 열의 조회, 편집 등의 권한을 설정하여 해당 열 데이터에 대한 사용자의 접근과 조작을 제어할 수 있습니다.

`GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1`로 테이블의 특정 열에 대한 권한을 부여할 수 있습니다.

현재 열 권한은 `Select_priv`만 지원합니다.

#### 행 수준 권한 {#row-level-permissions}

행 정책을 사용하면 관리자가 데이터 내 필드를 기준으로 접근 정책을 정의하여 사용자가 접근할 수 있는 행을 제어할 수 있습니다.

구체적으로, 관리자는 데이터에 저장된 실제 값을 기준으로 행에 대한 사용자 접근을 필터링하거나 제한하는 규칙을 만들 수 있습니다.

1.2 버전부터 `CREATE ROW POLICY` 명령으로 행 수준 권한을 생성할 수 있습니다.

2.1.2 버전부터 Apache Ranger의 `Row Level Filter`를 통해 행 수준 권한을 설정할 수 있습니다.

#### 사용 권한 {#usage-permissions}

- Resource 권한

    Resource 권한은 Resource에만 적용되며, 데이터베이스나 테이블의 권한과는 관련이 없습니다. `Usage_priv`와 `Grant_priv`만 부여할 수 있습니다.

    `GRANT USAGE_PRIV ON RESOURCE '%' TO user1`로 모든 Resource에 대한 권한을 부여할 수 있습니다.

- Workload Group 권한

    Workload Group 권한은 Workload Group에만 적용되며, 데이터베이스나 테이블의 권한과는 관련이 없습니다. `Usage_priv`와 `Grant_priv`만 부여할 수 있습니다.

    `GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO user1`로 모든 Workload Group에 대한 권한을 부여할 수 있습니다.

### 데이터 마스킹 {#data-masking}

데이터 마스킹은 원본 데이터를 수정, 대체 또는 숨겨 민감한 데이터를 보호하는 방법입니다. 마스킹된 데이터는 일정한 형식과 특성을 유지하면서 민감한 정보는 더 이상 포함하지 않습니다.

예를 들어 관리자는 신용카드 번호나 신분증 번호와 같은 민감한 필드의 숫자 일부 또는 전체를 별표 `*`나 다른 문자로 대체하거나, 실명을 가명으로 대체할 수 있습니다.

2.1.2 버전부터 Apache Ranger의 Data Masking을 통해 특정 열에 데이터 마스킹 정책을 설정할 수 있습니다. 현재는 [Apache Ranger](./authorization/ranger.md)를 통해서만 설정할 수 있습니다.

### Doris 내장 권한 부여 방식 {#doris-built-in-authorization-scheme}

Doris의 권한 설계는 RBAC(역할 기반 접근 제어) 모델을 기반으로 합니다. 사용자는 역할에 연결되고, 역할은 권한에 연결됩니다. 따라서 사용자는 역할을 통해 간접적으로 권한에 연결됩니다.

역할이 삭제되면 사용자는 해당 역할에 연결된 모든 권한을 자동으로 잃습니다.

사용자와 역할의 연결이 해제되면 사용자는 해당 역할의 모든 권한을 자동으로 잃습니다.

역할에 권한을 추가하거나 역할에서 권한을 제거하면 해당 역할에 연결된 사용자의 권한도 그에 따라 변경됩니다.

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

위 그림의 관계는 다음과 같습니다.

User1과 user2는 모두 `priv1` 권한을 `role1`을 통해 가집니다.

UserN은 `priv1` 권한을 `role3`을 통해 가지며, `priv2`와 `privN` 권한을 `roleN`을 통해 가집니다. 따라서 userN은 `priv1`, `priv2`, `privN` 권한을 동시에 가집니다.

사용 편의를 위해 사용자에게 직접 권한을 부여할 수도 있습니다. 내부적으로는 사용자마다 고유한 기본 역할이 생성됩니다. 사용자에게 권한을 부여하는 것은 실제로 해당 사용자의 기본 역할에 권한을 부여하는 것입니다.

기본 역할은 삭제하거나 다른 사용자에게 할당할 수 없습니다. 사용자가 삭제되면 해당 사용자의 기본 역할도 자동으로 삭제됩니다.

### Apache Ranger 기반 권한 부여 방식 {#authorization-scheme-based-on-apache-ranger}

[Apache Ranger 기반 권한 부여 방식](./authorization/ranger.md)을 참조하세요.

## 자주 묻는 질문 {#common-questions}

### 권한 설명 {#explanation-of-permissions}

1. ADMIN 권한이나 GLOBAL 수준의 GRANT 권한이 있는 사용자는 다음 작업을 수행할 수 있습니다.

    - CREATE USER
    - DROP USER
    - ALTER USER
    - SHOW GRANTS
    - CREATE ROLE
    - DROP ROLE
    - ALTER ROLE
    - SHOW ROLES
    - SHOW PROPERTY FOR USER

2. GRANT/REVOKE

    - ADMIN 권한이 있는 사용자는 모든 사용자에 대해 권한을 부여하거나 회수할 수 있습니다.
    - ADMIN 권한이나 GLOBAL 수준의 GRANT 권한이 있는 사용자는 사용자에게 역할을 할당할 수 있습니다.
    - 해당 수준의 GRANT 권한과 부여하려는 권한을 가진 사용자는 사용자/역할에 해당 권한을 부여할 수 있습니다.

3. SET PASSWORD

    - ADMIN 권한이나 GLOBAL 수준의 GRANT 권한이 있는 사용자는 root 이외의 사용자에 대해 비밀번호를 설정할 수 있습니다.
    - 일반 사용자는 자신에게 해당하는 사용자 식별자의 비밀번호를 설정할 수 있습니다. 자신에게 해당하는 사용자 식별자는 `SELECT CURRENT_USER()` 명령으로 확인할 수 있습니다.
    - ROOT 사용자는 자신의 비밀번호를 변경할 수 있습니다.

### 추가 정보 {#additional-information}

1. Doris가 초기화되면 다음 사용자와 역할이 자동으로 생성됩니다.

    - operator 역할: `Node_priv`와 `Admin_priv`를 가지며, 이는 Doris의 모든 권한에 해당합니다.
    - admin 역할: `Admin_priv`를 가지며, 이는 노드 변경을 제외한 모든 권한에 해당합니다.
    - root@'%': 모든 노드에서 로그인할 수 있는 root 사용자이며, operator 역할을 가집니다.
    - admin@'%': 모든 노드에서 로그인할 수 있는 admin 사용자이며, admin 역할을 가집니다.

2. 기본으로 생성된 사용자와 역할을 삭제하거나 해당 권한을 변경하는 것은 지원하지 않습니다.
    - root@'%'와 admin@'%' 사용자는 삭제할 수 없습니다. 다만 root@'xxx'와 admin@'xxx' 사용자(xxx는 % 이외의 모든 호스트를 의미함)는 생성하거나 삭제할 수 있습니다. Doris는 이들을 일반 사용자로 취급합니다.
    - root@'%'와 admin@'%'의 기본 역할은 회수할 수 없습니다.
    - operator와 admin 역할은 삭제할 수 없습니다.
    - operator와 admin 역할의 권한은 수정할 수 없습니다.

3. operator 역할을 가진 사용자는 Root 한 명뿐입니다. admin 역할은 여러 사용자가 가질 수 있습니다.

4. 충돌이 발생할 수 있는 일부 작업에 대한 설명은 다음과 같습니다.

    1. 도메인과 IP 충돌:

        다음 사용자를 생성했다고 가정합니다.

        `CREATE USER user1@['domain'];`

        그리고 다음과 같이 권한을 부여합니다.

        `GRANT SELECT_PRIV ON *.* TO user1@['domain']`

        이 도메인은 ip1과 ip2라는 두 IP로 해석됩니다.

        이후 `user1@'ip1'`에 별도의 권한을 부여한다고 가정합니다.

        `GRANT ALTER_PRIV ON *.* TO user1@'ip1';`

        그러면 `user1@'ip1'`은 Select_priv와 Alter_priv 권한을 모두 갖게 됩니다. 이후 `user1@['domain']`의 권한을 다시 변경해도 `user1@'ip1'`에는 변경 사항이 반영되지 않습니다.

    2. 중복 IP 충돌:

        다음 사용자를 생성했다고 가정합니다.

        ```
        CREATE USER user1@'%' IDENTIFIED BY "12345";
        CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
        ```

        우선순위는 `'192.%'`가 `'%'`보다 높습니다. 따라서 사용자 `user1`이 `192.168.1.1` 머신에서 비밀번호 `'12345'`로 Doris에 로그인하려고 하면 접근이 거부됩니다.

5. 비밀번호를 잊은 경우

    비밀번호를 잊어 Doris에 로그인할 수 없다면 FE 설정 파일에 `skip_localhost_auth_check=true`를 추가하고 FE를 재시작합니다. 그러면 로컬 머신에서 비밀번호 없이 root로 Doris에 로그인할 수 있습니다.

    로그인한 후 `SET PASSWORD` 명령으로 비밀번호를 재설정할 수 있습니다.

6. root 사용자 본인 외에는 누구도 root 사용자의 비밀번호를 재설정할 수 없습니다.

7. `Admin_priv` 권한은 GLOBAL 수준에서만 부여하거나 회수할 수 있습니다.

8. `current_user()` 및 `user()`

    사용자는 자신의 `current_user`와 `user`를 각각 `SELECT current_user()`와 `SELECT user()`로 확인할 수 있습니다. 여기서 `current_user`는 사용자가 인증받은 식별자를 나타내며, `user`는 현재 실제 사용자 식별자입니다.

    예시:

    `user1@'192.%'`를 생성한 후 사용자 `user1`이 `192.168.10.1`에서 로그인했다고 가정합니다. 이때 `current_user`는 `user1@'192.%'`이고, `user`는 `user1@'192.168.10.1'`입니다.

    모든 권한은 특정 `current_user`에 부여되며, 실제 사용자는 해당 `current_user`의 모든 권한을 가집니다.

## 모범 사례 {#best-practices}

다음은 Doris 권한 시스템의 활용 사례입니다.

1. 시나리오 1

   Doris 클러스터 사용자는 관리자(Admin), 개발 엔지니어(RD), 사용자(Client)로 나뉩니다. 관리자는 전체 클러스터에 대한 모든 권한을 가지며, 주로 클러스터 구성과 노드 관리를 담당합니다. 개발 엔지니어는 데이터베이스와 테이블 생성, 데이터 적재 및 수정 등 비즈니스 모델링을 담당합니다. 사용자는 여러 데이터베이스와 테이블에 접근하여 데이터를 조회합니다.

   이 시나리오에서는 관리자에게 ADMIN 또는 GRANT 권한을 부여할 수 있습니다. RD에게는 모든 데이터베이스와 테이블 또는 특정 데이터베이스와 테이블에 대한 CREATE, DROP, ALTER, LOAD, SELECT 권한을 부여할 수 있습니다. Client에게는 모든 데이터베이스와 테이블 또는 특정 데이터베이스와 테이블에 대한 SELECT 권한을 부여할 수 있습니다. 또한 여러 사용자의 권한 부여 절차를 간소화하기 위해 역할을 생성할 수 있습니다.

2. 시나리오 2

   클러스터에는 여러 업무가 있을 수 있으며, 각 업무는 하나 이상의 데이터 세트를 사용할 수 있습니다. 각 업무는 자체 사용자를 관리해야 합니다. 이 시나리오에서는 관리자가 데이터베이스마다 DATABASE 수준의 GRANT 권한을 가진 사용자를 생성할 수 있습니다. 이 사용자는 지정된 데이터베이스에 대해서만 사용자에게 권한을 부여할 수 있습니다.

3. 블랙리스트

   Doris 자체는 블랙리스트를 지원하지 않고 화이트리스트만 지원하지만, 특정 방법으로 블랙리스트와 같은 효과를 낼 수 있습니다. `user@'192.%'`라는 사용자를 생성하여 `192.*`에서 접속하는 사용자의 로그인을 허용했다고 가정합니다. `192.168.10.1`에서 접속하는 사용자의 로그인을 금지하려면 새로운 비밀번호를 가진 사용자 `cmy@'192.168.10.1'`을 생성할 수 있습니다. `192.168.10.1`은 `192.%`보다 우선순위가 높으므로, `192.168.10.1`에서 접속하는 사용자는 더 이상 기존 비밀번호로 로그인할 수 없습니다.
