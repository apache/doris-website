---
{
    "title": "내장 인증",
    "language": "ko",
    "description": "Doris 사용자, 비밀번호 정책, 이중 비밀번호 교체, 사용자 ID 매칭 및 인증 문제 해결을 관리합니다."
}
---

<!-- Knowledge type: Concept + Configuration parameters + Troubleshooting -->
<!-- Applicable scenarios: User and privilege management / Login authentication troubleshooting / Password policy configuration -->

Apache Doris는 내장 사용자 인증 메커니즘을 제공합니다. 관리자는 SQL 명령으로 사용자를 생성하고 비밀번호를 설정하며 연결 소스를 제어합니다. 이 문서에서는 Doris 사용자 ID의 구성 방식, 사용 가능한 비밀번호 정책, IP 매칭 우선순위, 일반적인 운영 시나리오와 문제 해결 방법을 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 권장 섹션 |
| --- | --- |
| 계정 생성, 계정 삭제, 비밀번호 재설정 | [핵심 개념](#core-concepts), [일반적인 운영 명령](#common-operational-commands) |
| 엔터프라이즈급 비밀번호 정책 구성(만료 / 이력 / 강도 / 잠금) | [비밀번호 정책](#password-policies) |
| 클라이언트가 마이그레이션하는 동안 애플리케이션 비밀번호 교체 | [이중 비밀번호](#dual-passwords) |
| 동일한 사용자 이름이 여러 `user_identity` 값과 일치하여 로그인이 거부됨 | [사용자 ID 매칭 우선순위](#user-identity-matching-priority) |
| 특정 IP의 로그인 차단(블랙리스트 시뮬레이션) | [화이트리스트로 블랙리스트 시뮬레이션](#simulating-a-blacklist-with-a-whitelist) |
| root 비밀번호를 잊었거나 `current_user()`가 `user()`와 일치하지 않음 | [FAQ](#faq) |

## 핵심 개념 {#core-concepts}

<!-- Knowledge type: Concept -->

### 사용자(`user_identity`) {#user-user_identity}

Doris에서 `user_identity`는 사용자를 고유하게 식별하며 다음 두 부분으로 구성됩니다.

- `user_name`: 사용자 이름입니다.
- `host`: 클라이언트가 연결하는 호스트 주소입니다. 퍼지 매칭을 위해 `%`를 지원합니다.

`host`를 지정하지 않으면 기본값은 `'%'`이며, 이는 사용자가 모든 호스트에서 Doris에 연결할 수 있음을 의미합니다.

### 사용자 속성 {#user-properties}

사용자 속성은 `user_identity`가 아니라 `user_name`에 직접 연결됩니다. 즉, `user@'192.%'`와 `user@['domain']`은 동일한 사용자 속성 집합을 공유합니다. 속성은 `user@'192.%'` 또는 `user@['domain']`이 아니라 사용자에게 속합니다.

사용자 속성에는 사용자 연결의 최대 수, 데이터 적재 클러스터 구성 등이 포함되지만 이에 국한되지는 않습니다.

### 내장 사용자 {#built-in-users}

내장 사용자는 Doris가 기본적으로 생성하며 기본 권한을 보유하는 사용자로, root와 admin이 포함됩니다. 초기 비밀번호는 비어 있습니다. FE가 시작된 후 비밀번호 변경 명령으로 비밀번호를 변경할 수 있습니다. **기본 사용자는 삭제할 수 없습니다.**

| 사용자 | 허용되는 로그인 소스 | 기본 역할 |
| --- | --- | --- |
| `root@'%'` | 모든 노드 | operator |
| `admin@'%'` | 모든 노드 | admin |

### 비밀번호 {#password}

비밀번호는 사용자가 로그인할 때 사용하는 자격 증명입니다. 사용자를 생성할 때 관리자가 설정하며, 사용자가 나중에 변경할 수도 있습니다.

## 인증 메커니즘 {#authentication-mechanism}

<!-- Knowledge type: Process description -->

Doris 인증은 다음 두 단계로 구성됩니다.

1. **클라이언트가 인증 정보를 보냅니다.** 클라이언트는 사용자 정보(사용자 이름, 비밀번호, 데이터베이스 등)를 패키징하여 Doris 서버로 보내 자신의 ID를 증명하고 데이터베이스 액세스를 요청합니다.
2. **서버가 ID를 확인합니다.** Doris는 인증 정보를 받은 후 이를 검증합니다. 사용자 이름, 비밀번호, 클라이언트 IP가 모두 올바르고 사용자가 선택한 데이터베이스에 액세스할 수 있으면 인증이 성공하고 Doris는 사용자를 시스템 사용자 ID에 매핑합니다. 그렇지 않으면 인증이 실패하고 해당 오류 메시지가 클라이언트에 반환됩니다.

## 비밀번호 정책 {#password-policies}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Enterprise security compliance / Password lifecycle management -->

Doris는 관리자가 비밀번호 수명 주기와 보안을 관리할 수 있도록 다음 비밀번호 정책을 지원합니다.

| 정책 | 목적 | 기본값 |
| --- | --- | --- |
| `PASSWORD_HISTORY` | 최근 N개의 비밀번호 재사용 금지 | 0(비활성화) |
| `PASSWORD_EXPIRE` | 비밀번호 만료 시간 설정 | NEVER(만료되지 않음) |
| `FAILED_LOGIN_ATTEMPTS` + `PASSWORD_LOCK_TIME` | 연속 로그인 실패 후 계정 잠금 | 비활성화 |
| `validate_password_policy` | 비밀번호 강도 검증 | NONE/0(검증하지 않음) |

### PASSWORD_HISTORY {#password_history}

현재 사용자가 비밀번호를 재설정할 때 이전 비밀번호를 다시 사용할 수 있는지 제어합니다. 예를 들어 `PASSWORD_HISTORY 10`은 최근 10개의 비밀번호를 새 비밀번호로 사용하는 것을 금지합니다. `PASSWORD_HISTORY DEFAULT`로 설정하면 전역 변수 `password_history`의 값이 사용됩니다. 0은 이 기능을 비활성화하며 기본값은 0입니다.

예시:

- 전역 변수 설정: `SET GLOBAL password_history = 10`
- 사용자에 대해 설정: `ALTER USER user1@'ip' PASSWORD_HISTORY 10`

### PASSWORD_EXPIRE {#password_expire}

현재 사용자의 비밀번호 만료 시간을 설정합니다. 예를 들어 `PASSWORD_EXPIRE INTERVAL 10 DAY`는 비밀번호가 10일 후 만료됨을 의미합니다. `PASSWORD_EXPIRE NEVER`는 비밀번호가 만료되지 않음을 의미합니다. `PASSWORD_EXPIRE DEFAULT`로 설정하면 전역 변수 `default_password_lifetime`의 값(일 단위)이 사용됩니다. 기본값은 NEVER(또는 0)이며, 비밀번호가 만료되지 않음을 의미합니다.

예시:

- 전역 변수 설정: `SET GLOBAL default_password_lifetime = 1`
- 사용자에 대해 설정: `ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

### FAILED_LOGIN_ATTEMPTS 및 PASSWORD_LOCK_TIME {#failed_login_attempts-and-password_lock_time}

로그인에 n회 실패하면 현재 사용자의 계정을 잠그고 잠금 기간을 설정합니다. 예를 들어 `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`는 로그인에 3회 실패한 후 계정이 하루 동안 잠김을 의미합니다. 관리자는 ALTER USER 문으로 잠긴 계정을 수동으로 잠금 해제할 수 있습니다.

예시:

- 사용자에 대해 설정: `ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

### 비밀번호 강도 {#password-strength}

이 기능은 전역 변수 `validate_password_policy`로 제어됩니다. 기본값은 NONE/0이며 비밀번호 강도를 확인하지 않습니다. STRONG/2로 설정하면 비밀번호에 다음 4가지 범주 중 3가지 이상(대문자, 소문자, 숫자, 특수 문자)이 포함되어야 하고 길이가 8 이상이어야 합니다.

예시:

- `SET validate_password_policy = STRONG`

### 비밀번호 정책 확인 {#viewing-password-policies}

위 정책을 설정한 후 다음 명령으로 확인할 수 있습니다.

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```

사용자와 호스트 부분은 각각 작은따옴표로 묶어야 합니다. 예를 들면 다음과 같습니다.

```sql
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```

## 이중 비밀번호 {#dual-passwords}

<!-- Knowledge type: Operational procedure + Rules -->
<!-- Applicable scenarios: Application credential rotation -->

**4.2.1부터 지원됩니다.** 내장 비밀번호 인증은 동일한 계정에 기본 비밀번호 하나와 보존된 보조 비밀번호 하나를 유지할 수 있습니다. 이 중첩 기간을 활용하면 이전 비밀번호를 계속 사용하는 클라이언트를 거부하지 않고 새 비밀번호로 마이그레이션할 수 있습니다. 보조 비밀번호는 기본적으로 존재하지 않으며 `RETAIN CURRENT PASSWORD`를 사용해야만 생성됩니다. 이러한 변경은 이후 인증에 적용되며 기존 세션의 연결을 끊지 않습니다.

### 사전 요구 사항 {#prerequisites}

- 이 절을 사용하기 전에 모든 FE를 4.2.1 이상으로 업그레이드합니다.
- 전역 `GRANT_PRIV` 또는 `ADMIN_PRIV`이 있는 관리자가 교체를 실행해야 합니다. 자신의 계정에서도 RETAIN에는 이 권한이 필요하며, RETAIN이 없는 일반적인 자체 서비스 SET PASSWORD에는 필요하지 않습니다.
- 내장된 비어 있지 않은 기본 비밀번호를 사용하는 계정을 사용합니다. LDAP 및 인증 통합은 자체 자격 증명을 관리합니다.

### 비밀번호 교체 {#rotate-a-password}

1. 예시 계정을 생성한 다음 현재 비밀번호를 보존하면서 새 비밀번호를 설정합니다. 기존 계정의 경우 ALTER USER 문만 실행합니다.

    ```sql
    CREATE USER 'app_user'@'%' IDENTIFIED BY 'OldPwd_2026!';
    ALTER USER 'app_user'@'%' IDENTIFIED BY 'NewPwd_2026!' RETAIN CURRENT PASSWORD;
    ```

    `OldPwd_2026!`과 `NewPwd_2026!` 모두 인증에 사용할 수 있습니다. 이에 상응하는 보존 변경은 `SET PASSWORD FOR 'app_user'@'%' = PASSWORD('NewPwd_2026!') RETAIN CURRENT PASSWORD`이며, ALTER 문 대신 사용하고 ALTER 문 뒤에 실행하지 마십시오.

2. 모든 클라이언트를 `NewPwd_2026!`을 사용하도록 업데이트합니다. 계정의 보존된 비밀번호 상태를 확인합니다.

    ```sql
    SHOW GRANTS FOR 'app_user'@'%';
    ```

    `Password` 열에는 `Yes (dual)`이 표시됩니다. `SHOW ALL GRANTS` 및 `SHOW PROC '/auth'`에도 동일한 표시가 나타납니다. 각 FE의 `doris_fe_secondary_password_auth_total` 메트릭은 계정 정책 검사를 통과한 후 보조 비밀번호를 사용하여 성공한 인증 횟수를 모든 계정에 걸쳐 집계합니다. 이 누적 카운터가 0으로 돌아가기를 기다리지 말고 증가량을 관찰하십시오.

3. 모든 클라이언트의 마이그레이션이 완료되면 보조 비밀번호를 취소합니다.

    ```sql
    ALTER USER 'app_user'@'%' DISCARD OLD PASSWORD;
    ```

    이제 `NewPwd_2026!`만 인증할 수 있으며 `Password` 열은 `Yes`로 돌아갑니다. 보조 비밀번호가 없을 때 DISCARD를 반복해도 아무런 영향이 없습니다.

### 비밀번호 수명 및 정책 규칙 {#password-lifetime-and-policy-rules}

| 작업 | 결과 |
| --- | --- |
| RETAIN을 사용한 비어 있지 않은 새 비밀번호 | 이전 기본 비밀번호가 유일한 보조 비밀번호가 되고, 이전에 있던 보조 비밀번호는 교체됩니다. |
| RETAIN을 사용하지 않은 비어 있지 않은 변경 | 기존 보조 비밀번호는 계속 유효합니다. 기본 비밀번호만 교체해도 보조 비밀번호는 취소되지 않습니다. |
| 비어 있는 새 비밀번호 | RETAIN을 사용하더라도 두 슬롯이 모두 지워집니다. |
| 현재 기본 비밀번호가 비어 있을 때 RETAIN 사용 | 거부됩니다. |
| DISCARD OLD PASSWORD | 보조 비밀번호만 제거됩니다. 비밀번호 이력과 비밀번호 만료 시계는 변경되지 않습니다. |

두 비밀번호 모두 계정의 잠금 및 만료 정책이 적용됩니다. RETAIN을 사용한 변경도 비밀번호 변경이므로 비밀번호 강도 및 이력 규칙을 따르고 만료 시계를 갱신합니다. 인증 통합을 바인딩, 바인딩 해제 또는 변경하면 보존된 보조 비밀번호가 지워지며 이러한 전환 중에는 RETAIN이 거부됩니다. DISCARD는 독립적인 ALTER USER 작업이며 비밀번호 변경, 정책 변경 또는 주석과 함께 사용할 수 없습니다.

### 도메인 계정 및 버전 변경 {#domain-accounts-and-version-changes}

도메인 계정의 경우 DISCARD는 먼저 영구 도메인 계정을 지웁니다. 확인된 IP 항목은 다음 도메인 확인자 새로 고침 시점에 보존된 복사본을 더 이상 허용하지 않게 됩니다. 일반적인 간격은 10초이지만 엄격한 취소 시간 제한은 아닙니다.

롤링 업그레이드 중에는 이전 FE가 기본 비밀번호로만 인증하며 새 절을 구문 분석할 수 없습니다. 이중 비밀번호 교체를 시작하기 전에 모든 FE의 업그레이드가 완료될 때까지 기다립니다. 이 기능을 사용한 후 다운그레이드하면 보존된 보조 비밀번호가 손실되고 기본 비밀번호만 남습니다. 다시 업그레이드해도 이전 보조 비밀번호는 복원되지 않습니다.

전체 문 구문 참조는 [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER) 및 [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD)를 참조하십시오.

## 사용자 ID 매칭 우선순위 {#user-identity-matching-priority}

<!-- Knowledge type: Rule description -->
<!-- Applicable scenarios: Login rejection troubleshooting / Conflicts between multiple user_identity values -->

`user_identity`는 `user_name`과 `host`로 구성되지만 로그인할 때 사용자는 `user_name`만 제공합니다. Doris는 클라이언트 IP를 기준으로 해당 `host`를 매칭하여 로그인에 사용할 `user_identity`를 결정합니다.

클라이언트 IP와 일치하는 `user_identity`가 하나뿐이면 Doris는 해당 항목을 사용합니다. 여러 `user_identity` 값이 일치하면 Doris는 다음 우선순위를 적용합니다.

| 비교 시나리오 | 우선순위 |
| --- | --- |
| 특정 IP와 도메인 | 특정 IP가 도메인보다 우선 |
| 특정 IP와 IP 범위 | 더 구체적인 IP 범위가 우선(예: `%`보다 `192.%`) |

### 예시 1: IP가 도메인보다 우선 {#example-1-ip-takes-priority-over-domain}

```sql
CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
CREATE USER user1@'ip1' IDENTIFIED BY "abcde";
```

`domain1`이 두 IP인 `ip1`과 `ip2`로 확인된다고 가정합니다. IP가 도메인보다 우선하므로 사용자 `user1`이 `ip1`에서 비밀번호 `'12345'`로 Doris에 로그인하려 하면 로그인이 거부됩니다(올바른 비밀번호는 `'abcde'`입니다).

### 예시 2: 더 구체적인 IP 범위가 우선 {#example-2-more-specific-ip-range-wins}

```sql
CREATE USER user1@'%' IDENTIFIED BY "12345";
CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
```

`'192.%'`가 `'%'`보다 우선하므로 사용자 `user1`이 `192.168.1.1`에서 비밀번호 `'12345'`로 Doris에 로그인하려 하면 로그인이 거부됩니다(올바른 비밀번호는 `'abcde'`입니다).

## 화이트리스트로 블랙리스트 시뮬레이션 {#simulating-a-blacklist-with-a-whitelist}

<!-- Knowledge type: Operational technique -->
<!-- Applicable scenarios: Block specific IPs from logging in -->

Doris는 기본적으로 블랙리스트를 지원하지 않고 화이트리스트만 지원합니다. 그러나 [사용자 ID 매칭 우선순위](#user-identity-matching-priority)를 사용하여 블랙리스트를 시뮬레이션할 수 있습니다.

예를 들어 `user@'192.%'`라는 사용자가 생성되어 `192.*`에서 오는 사용자의 로그인을 허용한다고 가정합니다. `192.168.10.1`에서 오는 로그인을 차단하려면 `cmy@'192.168.10.1'`이라는 사용자를 추가로 생성하고 새 비밀번호를 설정합니다. `192.168.10.1`이 `192.%`보다 우선순위가 높으므로 `192.168.10.1`에서 오는 사용자는 더 이상 이전 비밀번호로 로그인할 수 없습니다.

## 일반적인 운영 명령 {#common-operational-commands}

<!-- Knowledge type: Command index -->

| 작업 | 명령 |
| --- | --- |
| 사용자 생성 | [CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) |
| 사용자 권한 확인 | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS) |
| 사용자 수정 | [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER) |
| 비밀번호 변경 | [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD) |
| 사용자 삭제 | [DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER) |
| 사용자 속성 설정 | [SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY) |
| 사용자 속성 확인 | [SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY) |

## FAQ {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Login failures / Identity confusion / Forgotten passwords -->

### Q: 잊어버린 비밀번호를 어떻게 재설정하나요? {#q-how-do-i-reset-a-forgotten-password}

비밀번호를 잊어 Doris에 로그인할 수 없는 경우 다음 단계에 따라 복구합니다.

1. FE 구성 파일에 다음 매개변수를 추가합니다.

    ```text
    skip_localhost_auth_check = true
    ```

2. FE를 다시 시작합니다.
3. FE 호스트에서 비밀번호 없이 root 사용자로 Doris에 로그인합니다.
4. 로그인한 후 `SET PASSWORD` 명령으로 비밀번호를 재설정합니다.

### Q: 다른 사용자가 root 사용자의 비밀번호를 재설정할 수 있나요? {#q-can-other-users-reset-the-root-users-password}

아니요. **root 이외의 사용자는 root 사용자의 비밀번호를 재설정할 수 없습니다.**

### Q: `current_user()`와 `user()`의 차이는 무엇인가요? {#q-what-is-the-difference-between-current_user-and-user}

`SELECT current_user()` 및 `SELECT user()`를 실행하여 각각 `current_user`와 `user`를 확인할 수 있습니다.

- `current_user`: 현재 사용자가 인증을 통과한 ID입니다(사용자 생성 시 사용된 `user_identity`).
- `user`: 실제 클라이언트 IP를 포함한 현재 사용자의 실제 ID입니다.

예를 들어 `user1@'192.%'` 사용자가 생성된 후 `192.168.10.1`의 사용자 `user1`이 시스템에 로그인한다고 가정합니다. 이 경우 `current_user`는 `user1@'192.%'`이고 `user`는 `user1@'192.168.10.1'`입니다.

모든 권한은 특정 `current_user`에 부여되며 실제 사용자는 해당 `current_user`의 모든 권한을 보유합니다.

### Q: 사용자의 로그인이 거부되었지만 비밀번호가 올바른 것으로 확인되었습니다. 이유는 무엇인가요? {#q-a-users-login-is-rejected-but-the-password-is-confirmed-to-be-correct-why}

대개 [사용자 ID 매칭 우선순위](#user-identity-matching-priority) 규칙이 적용되었기 때문입니다. 클라이언트 IP가 더 구체적인 `user_identity`와 일치했으므로 해당 `user_identity`에 속한 비밀번호로 로그인해야 합니다. 다음 명령으로 실제로 매칭된 ID를 확인할 수 있습니다.

```sql
SELECT current_user();
```
