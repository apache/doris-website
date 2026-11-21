---
{
    "title": "내장 인증",
    "language": "ko",
    "description": "Doris 사용자, 비밀번호 정책, 이중 비밀번호 교체, 사용자 ID 매칭 및 인증 문제 해결 방법을 설명합니다."
}
---

<!-- Knowledge type: Concept + Configuration parameters + Troubleshooting -->
<!-- Applicable scenarios: User and privilege management / Login authentication troubleshooting / Password policy configuration -->

Apache Doris는 내장 사용자 인증 기능을 제공합니다. 관리자는 SQL 명령으로 사용자를 생성하고 비밀번호를 설정하며 접속 출처를 제어합니다. 이 문서에서는 Doris 사용자 ID의 구성, 사용 가능한 비밀번호 정책, IP 매칭 우선순위, 일반적인 운영 시나리오와 문제 해결 방법을 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 권장 섹션 |
| --- | --- |
| 계정 생성, 계정 삭제, 비밀번호 재설정 | [핵심 개념](#core-concepts), [주요 운영 명령](#common-operational-commands) |
| 기업용 비밀번호 정책 구성(만료 / 이력 / 강도 / 잠금) | [비밀번호 정책](#password-policies) |
| 클라이언트를 이전하는 동안 애플리케이션 비밀번호 교체 | [이중 비밀번호](#dual-passwords) |
| 동일한 사용자 이름이 여러 `user_identity` 값과 일치하여 로그인이 거부됨 | [사용자 ID 매칭 우선순위](#user-identity-matching-priority) |
| 특정 IP의 로그인 차단(블랙리스트 모의 구현) | [화이트리스트로 블랙리스트 모의 구현](#simulating-a-blacklist-with-a-whitelist) |
| root 비밀번호를 잊었거나 `current_user()`와 `user()`가 일치하지 않음 | [FAQ](#faq) |

## 핵심 개념 {#core-concepts}

<!-- Knowledge type: Concept -->

### 사용자(user_identity) {#user-user_identity}

Doris에서 `user_identity`는 사용자를 고유하게 식별하며 다음 두 부분으로 구성됩니다.

- `user_name`: 사용자 이름입니다.
- `host`: 클라이언트가 접속하는 호스트 주소입니다. `%`를 사용한 패턴 매칭을 지원합니다.

`host`를 지정하지 않으면 기본값은 `'%'`이며, 이는 사용자가 어느 호스트에서나 Doris에 접속할 수 있음을 뜻합니다.

### 사용자 속성 {#user-properties}

사용자 속성은 `user_identity`가 아닌 `user_name`에 직접 연결됩니다. 즉, `user@'192.%'`와 `user@['domain']`은 동일한 사용자 속성 집합을 공유합니다. 이 속성은 `user@'192.%'`나 `user@['domain']`이 아니라 사용자에게 속합니다.

사용자 속성에는 최대 사용자 연결 수와 데이터 적재 클러스터 구성 등이 포함되며, 이에 국한되지 않습니다.

### 내장 사용자 {#built-in-users}

내장 사용자는 Doris가 기본으로 생성하는 사용자로, root와 admin이 여기에 포함되며 처음부터 특정 권한을 가집니다. 초기 비밀번호는 비어 있습니다. FE가 시작된 후 비밀번호 변경 명령으로 비밀번호를 변경할 수 있습니다. **기본 사용자는 삭제할 수 없습니다.**

| 사용자 | 허용되는 로그인 출처 | 기본 역할 |
| --- | --- | --- |
| `root@'%'` | 모든 노드 | operator |
| `admin@'%'` | 모든 노드 | admin |

### 비밀번호 {#password}

비밀번호는 사용자가 로그인할 때 사용하는 인증 정보입니다. 관리자가 사용자를 생성할 때 설정하며, 이후 사용자가 직접 변경할 수도 있습니다.

## 인증 메커니즘 {#authentication-mechanism}

<!-- Knowledge type: Process description -->

Doris 인증은 다음 두 단계로 이루어집니다.

1. **클라이언트가 인증 정보를 전송합니다.** 클라이언트는 사용자 정보(사용자 이름, 비밀번호, 데이터베이스 등)를 묶어 Doris 서버로 전송하여 자신의 신원을 증명하고 데이터베이스 접근을 요청합니다.
2. **서버가 신원을 확인합니다.** Doris는 인증 정보를 받으면 이를 확인합니다. 사용자 이름, 비밀번호, 클라이언트 IP가 모두 올바르고 사용자에게 선택한 데이터베이스에 대한 접근 권한이 있으면 인증에 성공하며, Doris는 사용자를 시스템 사용자 ID에 매핑합니다. 그렇지 않으면 인증에 실패하고 해당 오류 메시지를 클라이언트에 반환합니다.

## 비밀번호 정책 {#password-policies}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Enterprise security compliance / Password lifecycle management -->

Doris는 관리자가 비밀번호 수명 주기와 보안을 관리할 수 있도록 다음 비밀번호 정책을 지원합니다.

| 정책 | 목적 | 기본값 |
| --- | --- | --- |
| `PASSWORD_HISTORY` | 최근 N개의 비밀번호 재사용 금지 | 0(비활성화) |
| `PASSWORD_EXPIRE` | 비밀번호 만료 시간 설정 | NEVER(만료되지 않음) |
| `FAILED_LOGIN_ATTEMPTS` + `PASSWORD_LOCK_TIME` | 연속 로그인 실패 후 계정 잠금 | 비활성화 |
| `validate_password_policy` | 비밀번호 강도 검사 | NONE/0(검사하지 않음) |

### PASSWORD_HISTORY {#password_history}

현재 사용자가 비밀번호를 재설정할 때 이전 비밀번호를 재사용할 수 있는지 제어합니다. 예를 들어 `PASSWORD_HISTORY 10`은 최근 10개의 비밀번호를 새 비밀번호로 사용하는 것을 금지합니다. `PASSWORD_HISTORY DEFAULT`로 설정하면 전역 변수 `password_history`의 값을 사용합니다. 0이면 이 기능이 비활성화되며, 기본값은 0입니다.

예시:

- 전역 변수 설정: `SET GLOBAL password_history = 10`
- 사용자별 설정: `ALTER USER user1@'ip' PASSWORD_HISTORY 10`

### PASSWORD_EXPIRE {#password_expire}

현재 사용자 비밀번호의 만료 시간을 설정합니다. 예를 들어 `PASSWORD_EXPIRE INTERVAL 10 DAY`는 비밀번호가 10일 후에 만료됨을 뜻합니다. `PASSWORD_EXPIRE NEVER`는 비밀번호가 만료되지 않음을 뜻합니다. `PASSWORD_EXPIRE DEFAULT`로 설정하면 전역 변수 `default_password_lifetime`의 값을 사용합니다(단위: 일). 기본값은 NEVER(또는 0)이며, 비밀번호가 만료되지 않음을 뜻합니다.

예시:

- 전역 변수 설정: `SET GLOBAL default_password_lifetime = 1`
- 사용자별 설정: `ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

### FAILED_LOGIN_ATTEMPTS 및 PASSWORD_LOCK_TIME {#failed_login_attempts-and-password_lock_time}

현재 사용자가 로그인에 n회 실패하면 계정을 잠그고 잠금 기간을 설정합니다. 예를 들어 `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`는 로그인에 3회 실패한 후 계정을 하루 동안 잠근다는 뜻입니다. 관리자는 ALTER USER 문으로 잠긴 계정을 수동으로 잠금 해제할 수 있습니다.

예시:

- 사용자별 설정: `ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

### 비밀번호 강도 {#password-strength}

이 기능은 전역 변수 `validate_password_policy`로 제어합니다. 기본값은 NONE/0이며, 비밀번호 강도를 검사하지 않습니다. STRONG/2로 설정하면 비밀번호에 대문자, 소문자, 숫자, 특수 문자라는 4개 범주 중 최소 3개가 포함되어야 하고 길이는 8자 이상이어야 합니다.

예시:

- `SET validate_password_policy = STRONG`

### 비밀번호 정책 조회 {#viewing-password-policies}

위 정책을 설정한 후 다음 명령으로 조회할 수 있습니다.

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```

사용자와 호스트 부분을 각각 작은따옴표로 감싸야 합니다. 예를 들면 다음과 같습니다.

```sql
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```

## 이중 비밀번호 {#dual-passwords}

<!-- Knowledge type: Operational procedure + Rules -->
<!-- Applicable scenarios: Application credential rotation -->

**4.2.1부터 지원합니다.** 내장 비밀번호 인증에서는 동일한 계정에 기본 비밀번호 하나와 보관된 보조 비밀번호 하나를 유지할 수 있습니다. 두 비밀번호가 모두 유효한 기간을 활용하면 이전 비밀번호를 계속 사용하는 클라이언트의 접속을 거부하지 않으면서 새 비밀번호로 이전할 수 있습니다. 보조 비밀번호는 기본적으로 없으며 `RETAIN CURRENT PASSWORD`를 사용해야만 생성됩니다. 이러한 변경은 이후의 인증에 적용되며 기존 세션의 연결을 끊지 않습니다.

### 사전 요구 사항 {#prerequisites}

- 이 구문을 사용하기 전에 모든 FE를 4.2.1 이상으로 업그레이드합니다.
- 전역 `GRANT_PRIV` 또는 `ADMIN_PRIV`가 있는 관리자로 비밀번호를 교체합니다. 자신의 계정에 RETAIN을 사용할 때도 이 권한이 필요하지만, RETAIN 없이 일반 사용자가 자신의 비밀번호를 변경하는 SET PASSWORD에는 필요하지 않습니다.
- 내장 인증을 사용하고 기본 비밀번호가 비어 있지 않은 계정을 사용합니다. LDAP와 인증 연동은 자체 인증 정보를 관리합니다.

### 비밀번호 교체 {#rotate-a-password}

1. 예시 계정을 생성한 다음, 현재 비밀번호를 유지하면서 새 비밀번호를 설정합니다. 기존 계정이라면 ALTER USER 문만 실행합니다.

    ```sql
    CREATE USER 'app_user'@'%' IDENTIFIED BY 'OldPwd_2026!';
    ALTER USER 'app_user'@'%' IDENTIFIED BY 'NewPwd_2026!' RETAIN CURRENT PASSWORD;
    ```

    `OldPwd_2026!`와 `NewPwd_2026!`를 모두 인증에 사용할 수 있습니다. 동일하게 기존 비밀번호를 유지하려면 `SET PASSWORD FOR 'app_user'@'%' = PASSWORD('NewPwd_2026!') RETAIN CURRENT PASSWORD`를 사용할 수도 있습니다. 이 명령은 ALTER 문 대신 사용하고, ALTER 문 다음에 실행하지 마세요.

2. 모든 클라이언트가 `NewPwd_2026!`를 사용하도록 업데이트합니다. 계정의 보조 비밀번호 유지 상태를 확인합니다.

    ```sql
    SHOW GRANTS FOR 'app_user'@'%';
    ```

    `Password` 열에 `Yes (dual)`이 표시됩니다. `SHOW ALL GRANTS`와 `SHOW PROC '/auth'`에서도 같은 표시를 볼 수 있습니다. 각 FE의 `doris_fe_secondary_password_auth_total` 지표는 계정 정책 검사를 통과한 후 보조 비밀번호로 인증에 성공한 횟수를 모든 계정에 걸쳐 집계합니다. 이 누적 카운터가 0으로 돌아오기를 기다리지 말고 증가량을 관찰하세요.

3. 모든 클라이언트의 이전이 끝나면 보조 비밀번호를 폐기합니다.

    ```sql
    ALTER USER 'app_user'@'%' DISCARD OLD PASSWORD;
    ```

    이후에는 `NewPwd_2026!`로만 인증할 수 있으며 `Password` 열은 `Yes`로 돌아갑니다. 보조 비밀번호가 없을 때 DISCARD를 다시 실행해도 아무 변화가 없습니다.

### 비밀번호 수명 주기 및 정책 규칙 {#password-lifetime-and-policy-rules}

| 작업 | 결과 |
| --- | --- |
| 비어 있지 않은 새 비밀번호와 RETAIN 사용 | 이전 기본 비밀번호가 유일한 보조 비밀번호가 되며, 더 이전의 보조 비밀번호는 교체됩니다. |
| RETAIN 없이 비어 있지 않은 비밀번호로 변경 | 기존 보조 비밀번호는 계속 유효합니다. 기본 비밀번호만 교체해도 보조 비밀번호는 폐기되지 않습니다. |
| 빈 새 비밀번호 | RETAIN을 사용하더라도 두 비밀번호가 모두 지워집니다. |
| 현재 기본 비밀번호가 빈 상태에서 RETAIN 사용 | 거부됩니다. |
| DISCARD OLD PASSWORD | 보조 비밀번호만 제거됩니다. 비밀번호 이력과 비밀번호 만료 시점은 변경되지 않습니다. |

두 비밀번호 모두 계정의 잠금 및 만료 정책을 따릅니다. RETAIN을 사용하는 변경도 비밀번호 변경이므로 비밀번호 강도 및 이력 규칙을 따르고 만료 시점을 갱신합니다. 인증 연동을 연결하거나 해제하거나 변경하면 보관된 보조 비밀번호가 지워지며, 이러한 전환 과정에서는 RETAIN이 거부됩니다. DISCARD는 독립적인 ALTER USER 작업이며 비밀번호 변경, 정책 변경 또는 주석과 결합할 수 없습니다.

### 도메인 계정과 버전 변경 {#domain-accounts-and-version-changes}

도메인 계정에서 DISCARD를 실행하면 먼저 영구 도메인 계정에서 보조 비밀번호가 지워집니다. 확인된 IP 항목은 다음 도메인 확인 갱신 시점부터 보관된 비밀번호 복사본을 더 이상 허용하지 않습니다. 일반적인 갱신 간격은 10초이지만, 이것이 철회 완료 시간의 엄격한 상한은 아닙니다.

순차 업그레이드 중에는 이전 버전의 FE가 기본 비밀번호로만 인증하고 새 구문을 해석할 수 없습니다. 이중 비밀번호 교체를 시작하기 전에 모든 FE의 업그레이드가 끝날 때까지 기다리세요. 이 기능을 사용한 후 다운그레이드하면 보관된 보조 비밀번호가 손실되고 기본 비밀번호만 남습니다. 다시 업그레이드해도 이전 보조 비밀번호는 복원되지 않습니다.

전체 구문은 [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER)와 [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD)를 참조하세요.

## 사용자 ID 매칭 우선순위 {#user-identity-matching-priority}

<!-- Knowledge type: Rule description -->
<!-- Applicable scenarios: Login rejection troubleshooting / Conflicts between multiple user_identity values -->

`user_identity`는 `user_name`과 `host`로 구성되지만, 사용자는 로그인할 때 `user_name`만 제공합니다. Doris는 클라이언트 IP를 기준으로 해당 `host`를 매칭하여 로그인에 사용할 `user_identity`를 결정합니다.

클라이언트 IP와 일치하는 `user_identity`가 하나뿐이면 Doris는 그 값을 사용합니다. 여러 `user_identity` 값이 일치하면 다음 우선순위를 적용합니다.

| 비교 상황 | 우선순위 |
| --- | --- |
| 특정 IP와 도메인 | 특정 IP가 도메인보다 우선합니다. |
| 특정 IP와 IP 범위 | 더 구체적인 IP 범위가 우선합니다(예: `%`보다 `192.%`). |

### 예시 1: IP가 도메인보다 우선함 {#example-1-ip-takes-priority-over-domain}

```sql
CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
CREATE USER user1@'ip1' IDENTIFIED BY "abcde";
```

`domain1`이 `ip1`과 `ip2`라는 두 IP로 확인된다고 가정합니다. IP가 도메인보다 우선하므로 사용자 `user1`이 `ip1`에서 비밀번호 `'12345'`로 Doris에 로그인하려 하면 거부됩니다. 올바른 비밀번호는 `'abcde'`입니다.

### 예시 2: 더 구체적인 IP 범위가 우선함 {#example-2-more-specific-ip-range-wins}

```sql
CREATE USER user1@'%' IDENTIFIED BY "12345";
CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
```

`'192.%'`가 `'%'`보다 우선하므로 사용자 `user1`이 `192.168.1.1`에서 비밀번호 `'12345'`로 Doris에 로그인하려 하면 거부됩니다. 올바른 비밀번호는 `'abcde'`입니다.

## 화이트리스트로 블랙리스트 모의 구현 {#simulating-a-blacklist-with-a-whitelist}

<!-- Knowledge type: Operational technique -->
<!-- Applicable scenarios: Block specific IPs from logging in -->

Doris는 블랙리스트를 기본으로 지원하지 않고 화이트리스트만 지원합니다. 하지만 [사용자 ID 매칭 우선순위](#user-identity-matching-priority)를 이용해 블랙리스트를 모의 구현할 수 있습니다.

예를 들어 `192.*`에서 접속하는 사용자의 로그인을 허용하는 `user@'192.%'`라는 사용자를 생성했다고 가정합니다. `192.168.10.1`에서의 로그인을 차단하려면 `cmy@'192.168.10.1'`이라는 사용자를 하나 더 생성하고 새 비밀번호를 설정합니다. `192.168.10.1`이 `192.%`보다 우선하므로 `192.168.10.1`에서 접속하는 사용자는 더 이상 이전 비밀번호로 로그인할 수 없습니다.

## 주요 운영 명령 {#common-operational-commands}

<!-- Knowledge type: Command index -->

| 작업 | 명령 |
| --- | --- |
| 사용자 생성 | [CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) |
| 사용자 권한 조회 | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS) |
| 사용자 변경 | [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER) |
| 비밀번호 변경 | [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD) |
| 사용자 삭제 | [DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER) |
| 사용자 속성 설정 | [SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY) |
| 사용자 속성 조회 | [SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY) |

## FAQ {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Login failures / Identity confusion / Forgotten passwords -->

### Q: 잊어버린 비밀번호를 어떻게 재설정하나요? {#q-how-do-i-reset-a-forgotten-password}

비밀번호를 잊어 Doris에 로그인할 수 없다면 다음 단계에 따라 복구합니다.

1. FE 구성 파일에 다음 매개변수를 추가합니다.

    ```text
    skip_localhost_auth_check = true
    ```

2. FE를 다시 시작합니다.
3. FE 호스트에서 비밀번호 없이 root 사용자로 Doris에 로그인합니다.
4. 로그인한 후 `SET PASSWORD` 명령으로 비밀번호를 재설정합니다.

### Q: 다른 사용자가 root 사용자의 비밀번호를 재설정할 수 있나요? {#q-can-other-users-reset-the-root-users-password}

아니요. **root 외의 사용자는 root 사용자의 비밀번호를 재설정할 수 없습니다.**

### Q: `current_user()`와 `user()`는 어떻게 다른가요? {#q-what-is-the-difference-between-current_user-and-user}

`SELECT current_user()`와 `SELECT user()`를 실행하면 각각 `current_user`와 `user`를 확인할 수 있습니다.

- `current_user`: 현재 사용자가 인증을 통과할 때 사용한 ID입니다(사용자 생성 시 사용한 `user_identity`).
- `user`: 실제 클라이언트 IP를 포함해 사용자가 현재 가진 실제 사용자 ID입니다.

예를 들어 `user1@'192.%'` 사용자를 생성한 후 `192.168.10.1`에서 사용자 `user1`이 시스템에 로그인했다고 가정합니다. 이 경우 `current_user`는 `user1@'192.%'`이고 `user`는 `user1@'192.168.10.1'`입니다.

모든 권한은 특정 `current_user`에 부여되며, 실제 사용자는 해당 `current_user`의 모든 권한을 가집니다.

### Q: 비밀번호가 올바른데도 사용자 로그인이 거부되는 이유는 무엇인가요? {#q-a-users-login-is-rejected-but-the-password-is-confirmed-to-be-correct-why}

일반적으로 [사용자 ID 매칭 우선순위](#user-identity-matching-priority) 규칙이 적용되었기 때문입니다. 클라이언트 IP가 더 구체적인 `user_identity`와 일치했으므로 해당 `user_identity`의 비밀번호로 로그인해야 합니다. 다음 명령으로 실제로 매칭된 ID를 확인할 수 있습니다.

```sql
SELECT current_user();
```
