---
{
    "title": "내장 인증",
    "language": "ko",
    "description": "Apache Doris의 내장 인증 메커니즘에 대한 상세 가이드입니다. user_identity의 구성, 비밀번호 정책(이력, 만료, 로그인 실패 시 잠금, 강도 검사), IP 매칭 우선순위, 화이트리스트로 블랙리스트를 구현하는 방법, 일반적인 문제 해결 방법을 설명합니다."
}
---

<!-- Knowledge type: Concept + Configuration parameters + Troubleshooting -->
<!-- Applicable scenarios: User and privilege management / Login authentication troubleshooting / Password policy configuration -->

Apache Doris는 내장 사용자 인증 메커니즘을 제공합니다. 관리자는 SQL 명령으로 사용자를 생성하고, 비밀번호를 설정하며, 접속 출처를 제어할 수 있습니다. 이 문서에서는 Doris 사용자 식별자의 구성, 사용 가능한 비밀번호 정책, IP 매칭 우선순위, 일반적인 운영 시나리오와 문제 해결 방법을 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 권장 섹션 |
| --- | --- |
| 계정 생성, 계정 삭제, 비밀번호 재설정 | [핵심 개념](#core-concepts), [주요 운영 명령](#common-operational-commands) |
| 기업 수준의 비밀번호 정책 구성(만료 / 이력 / 강도 / 잠금) | [비밀번호 정책](#password-policies) |
| 동일한 사용자 이름이 여러 `user_identity` 값과 일치하여 로그인이 거부되는 경우 | [사용자 식별자 매칭 우선순위](#user-identity-matching-priority) |
| 특정 IP의 로그인 차단(블랙리스트 구현) | [화이트리스트로 블랙리스트 구현](#simulating-a-blacklist-with-a-whitelist) |
| root 비밀번호를 잊어버렸거나 `current_user()`와 `user()`가 일치하지 않는 경우 | [자주 묻는 질문](#faq) |

## 핵심 개념 {#core-concepts}

<!-- Knowledge type: Concept -->

### 사용자 (user_identity) {#user-user_identity}

Doris에서 `user_identity`는 사용자를 고유하게 식별하며, 다음 두 부분으로 구성됩니다:

- `user_name`: 사용자 이름입니다.
- `host`: 클라이언트가 접속하는 호스트 주소입니다. `%`를 사용한 패턴 매칭을 지원합니다.

`host`를 지정하지 않으면 기본값인 `'%'`가 사용되며, 이는 사용자가 모든 호스트에서 Doris에 접속할 수 있음을 의미합니다.

### 사용자 속성 {#user-properties}

사용자 속성은 `user_name`에 직접 연결되며, `user_identity`에는 연결되지 않습니다. 즉, `user@'192.%'`와 `user@['domain']`은 동일한 사용자 속성을 공유합니다. 이 속성은 사용자에게 속하며, `user@'192.%'`나 `user@['domain']` 각각에 속하지 않습니다.

사용자 속성에는 최대 사용자 연결 수, 데이터 적재 클러스터 설정 등이 포함됩니다.

### 기본 제공 사용자 {#built-in-users}

기본 제공 사용자는 Doris가 기본적으로 생성하며, 생성 시부터 특정 권한을 갖는 사용자입니다. root와 admin이 여기에 해당합니다. 초기 비밀번호는 비어 있습니다. FE가 시작된 후 비밀번호 변경 명령으로 비밀번호를 변경할 수 있습니다. **기본 사용자는 삭제할 수 없습니다.**

| 사용자 | 허용되는 로그인 출처 | 기본 역할 |
| --- | --- | --- |
| `root@'%'` | 모든 노드 | operator |
| `admin@'%'` | 모든 노드 | admin |

### 비밀번호 {#password}

비밀번호는 사용자가 로그인할 때 사용하는 인증 정보입니다. 사용자를 생성할 때 관리자가 설정하며, 사용자도 나중에 변경할 수 있습니다.

## 인증 메커니즘 {#authentication-mechanism}

<!-- Knowledge type: Process description -->

Doris 인증은 다음 두 단계로 이루어집니다:

1. **클라이언트가 인증 정보를 전송합니다.** 클라이언트는 사용자 정보(사용자 이름, 비밀번호, 데이터베이스 등)를 묶어 Doris 서버로 전송하여 자신의 신원을 증명하고 데이터베이스 접근을 요청합니다.
2. **서버가 신원을 확인합니다.** Doris는 인증 정보를 받으면 이를 검증합니다. 사용자 이름, 비밀번호, 클라이언트 IP가 모두 올바르고 사용자에게 선택한 데이터베이스의 접근 권한이 있으면 인증에 성공하며, Doris는 해당 사용자를 시스템 사용자 식별자에 매핑합니다. 그렇지 않으면 인증에 실패하고 해당 오류 메시지를 클라이언트에 반환합니다.

## 비밀번호 정책 {#password-policies}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Enterprise security compliance / Password lifecycle management -->

Doris는 관리자가 비밀번호 수명 주기와 보안을 관리할 수 있도록 다음 비밀번호 정책을 지원합니다.

| 정책 | 목적 | 기본값 |
| --- | --- | --- |
| `PASSWORD_HISTORY` | 최근 N개의 비밀번호 재사용 금지 | 0 (비활성화) |
| `PASSWORD_EXPIRE` | 비밀번호 만료 시간 설정 | NEVER (만료되지 않음) |
| `FAILED_LOGIN_ATTEMPTS` + `PASSWORD_LOCK_TIME` | 연속 로그인 실패 시 계정 잠금 | 비활성화 |
| `validate_password_policy` | 비밀번호 강도 검사 | NONE/0 (검사하지 않음) |

### PASSWORD_HISTORY {#password_history}

현재 사용자가 비밀번호를 재설정할 때 이전 비밀번호를 재사용할 수 있는지 제어합니다. 예를 들어, `PASSWORD_HISTORY 10`은 최근 10개의 비밀번호 중 어느 것도 새 비밀번호로 사용할 수 없도록 합니다. `PASSWORD_HISTORY DEFAULT`로 설정하면 전역 변수 `password_history`의 값을 사용합니다. 0으로 설정하면 이 기능이 비활성화되며, 기본값은 0입니다.

예시:

- 전역 변수 설정: `SET GLOBAL password_history = 10`
- 사용자별 설정: `ALTER USER user1@'ip' PASSWORD_HISTORY 10`

### PASSWORD_EXPIRE {#password_expire}

현재 사용자의 비밀번호 만료 시간을 설정합니다. 예를 들어, `PASSWORD_EXPIRE INTERVAL 10 DAY`는 비밀번호가 10일 후에 만료됨을 의미합니다. `PASSWORD_EXPIRE NEVER`는 비밀번호가 만료되지 않음을 의미합니다. `PASSWORD_EXPIRE DEFAULT`로 설정하면 전역 변수 `default_password_lifetime`의 값을 사용합니다(단위: 일). 기본값은 NEVER(또는 0)이며, 비밀번호가 만료되지 않음을 의미합니다.

예시:

- 전역 변수 설정: `SET GLOBAL default_password_lifetime = 1`
- 사용자별 설정: `ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

### FAILED_LOGIN_ATTEMPTS 및 PASSWORD_LOCK_TIME {#failed_login_attempts-and-password_lock_time}

현재 사용자의 로그인 시도가 n회 실패하면 계정을 잠그고 잠금 기간을 설정합니다. 예를 들어, `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`는 로그인 시도가 3회 실패하면 계정을 하루 동안 잠근다는 의미입니다. 관리자는 ALTER USER 문으로 잠긴 계정의 잠금을 수동으로 해제할 수 있습니다.

예시:

- 사용자별 설정: `ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

### 비밀번호 강도 {#password-strength}

이 기능은 전역 변수 `validate_password_policy`로 제어합니다. 기본값은 NONE/0이며, 비밀번호 강도를 검사하지 않음을 의미합니다. STRONG/2로 설정하면 비밀번호에 최소 3가지 문자 유형이 포함되어야 합니다. 문자 유형은 대문자, 소문자, 숫자, 특수 문자의 4가지이며, 비밀번호 길이는 최소 8자여야 합니다.

예시:

- `SET validate_password_policy = STRONG`

### 비밀번호 정책 확인 {#viewing-password-policies}

위 정책을 설정한 후 다음 명령으로 확인할 수 있습니다:

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```

사용자와 호스트 부분은 각각 작은따옴표로 감싸야 합니다. 예를 들면 다음과 같습니다:

```sql
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```

## 사용자 식별자 매칭 우선순위 {#user-identity-matching-priority}

<!-- Knowledge type: Rule description -->
<!-- Applicable scenarios: Login rejection troubleshooting / Conflicts between multiple user_identity values -->

`user_identity`는 `user_name`과 `host`로 구성되지만, 로그인할 때 사용자는 `user_name`만 제공합니다. Doris는 클라이언트 IP를 기준으로 해당하는 `host`를 찾아 로그인에 사용할 `user_identity`를 결정합니다.

클라이언트 IP와 일치하는 `user_identity`가 하나뿐이면 Doris는 해당 식별자를 사용합니다. 여러 `user_identity` 값이 일치하면 Doris는 다음 우선순위를 적용합니다:

| 비교 대상 | 우선순위 |
| --- | --- |
| 특정 IP와 도메인 | 특정 IP가 도메인보다 우선 |
| 특정 IP와 IP 범위 | 더 구체적인 IP 범위가 우선(예: `192.%`가 `%`보다 우선) |

### 예시 1: IP가 도메인보다 우선 {#example-1-ip-takes-priority-over-domain}

```sql
CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
CREATE USER user1@'ip1' IDENTIFIED BY "abcde";
```

`domain1`이 `ip1`과 `ip2`라는 두 IP로 해석된다고 가정합니다. IP가 도메인보다 우선하므로, 사용자 `user1`이 `ip1`에서 비밀번호 `'12345'`로 Doris에 로그인하려고 하면 로그인이 거부됩니다(올바른 비밀번호는 `'abcde'`입니다).

### 예시 2: 더 구체적인 IP 범위가 우선 {#example-2-more-specific-ip-range-wins}

```sql
CREATE USER user1@'%' IDENTIFIED BY "12345";
CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
```

`'192.%'`가 `'%'`보다 우선하므로, 사용자 `user1`이 `192.168.1.1`에서 비밀번호 `'12345'`로 Doris에 로그인하려고 하면 로그인이 거부됩니다(올바른 비밀번호는 `'abcde'`입니다).

## 화이트리스트로 블랙리스트 구현 {#simulating-a-blacklist-with-a-whitelist}

<!-- Knowledge type: Operational technique -->
<!-- Applicable scenarios: Block specific IPs from logging in -->

Doris는 기본적으로 화이트리스트만 지원하며 블랙리스트는 지원하지 않습니다. 하지만 [사용자 식별자 매칭 우선순위](#user-identity-matching-priority)를 활용하여 블랙리스트처럼 동작하도록 구성할 수 있습니다.

예를 들어, `user@'192.%'`라는 사용자를 생성하여 `192.*`에서 로그인할 수 있도록 했다고 가정합니다. `192.168.10.1`에서의 로그인을 차단하려면 다른 사용자 `cmy@'192.168.10.1'`를 생성하고 새 비밀번호를 설정합니다. `192.168.10.1`이 `192.%`보다 우선순위가 높으므로, `192.168.10.1`에서는 더 이상 기존 비밀번호로 로그인할 수 없습니다.

## 주요 운영 명령 {#common-operational-commands}

<!-- Knowledge type: Command index -->

| 작업 | 명령 |
| --- | --- |
| 사용자 생성 | [CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) |
| 사용자에게 부여된 권한 확인 | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS) |
| 사용자 수정 | [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER) |
| 비밀번호 변경 | [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD) |
| 사용자 삭제 | [DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER) |
| 사용자 속성 설정 | [SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY) |
| 사용자 속성 확인 | [SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY) |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Login failures / Identity confusion / Forgotten passwords -->

### 질문: 비밀번호를 잊어버렸을 때 어떻게 재설정하나요? {#q-how-do-i-reset-a-forgotten-password}

비밀번호를 잊어버려 Doris에 로그인할 수 없다면 다음 단계에 따라 복구합니다:

1. FE 설정 파일에 다음 매개변수를 추가합니다:

    ```text
    skip_localhost_auth_check = true
    ```

2. FE를 재시작합니다.
3. FE 호스트에서 root 사용자로 비밀번호 없이 Doris에 로그인합니다.
4. 로그인한 후 `SET PASSWORD` 명령으로 비밀번호를 재설정합니다.

### 질문: 다른 사용자가 root 사용자의 비밀번호를 재설정할 수 있나요? {#q-can-other-users-reset-the-root-users-password}

아니요. **root를 제외한 어떤 사용자도 root 사용자의 비밀번호를 재설정할 수 없습니다.**

### 질문: `current_user()`와 `user()`의 차이는 무엇인가요? {#q-what-is-the-difference-between-current_user-and-user}

`SELECT current_user()`와 `SELECT user()`를 실행하여 각각 `current_user`와 `user`를 확인할 수 있습니다:

- `current_user`: 현재 사용자가 인증을 통과한 식별자입니다(사용자를 생성할 때 사용한 `user_identity`).
- `user`: 사용자의 현재 실제 식별자로, 실제 클라이언트 IP를 포함합니다.

예를 들어, `user1@'192.%'` 사용자를 생성한 후 사용자 `user1`이 `192.168.10.1`에서 시스템에 로그인했다고 가정합니다. 이 경우 `current_user`는 `user1@'192.%'`이고, `user`는 `user1@'192.168.10.1'`입니다.

모든 권한은 특정 `current_user`에 부여되며, 실제 사용자는 해당 `current_user`의 모든 권한을 갖습니다.

### 질문: 비밀번호가 올바른데도 사용자의 로그인이 거부됩니다. 왜 그런가요? {#q-a-users-login-is-rejected-but-the-password-is-confirmed-to-be-correct-why}

일반적으로 [사용자 식별자 매칭 우선순위](#user-identity-matching-priority) 규칙이 적용되었기 때문입니다. 클라이언트 IP가 더 구체적인 `user_identity`와 일치하므로, 해당 `user_identity`에 설정된 비밀번호로 로그인해야 합니다. 다음 명령으로 실제로 매칭된 식별자를 확인할 수 있습니다:

```sql
SELECT current_user();
```
