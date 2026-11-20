---
{
    "title": "ALTER USER",
    "language": "ko",
    "description": "ALTER USER 문은 이중 비밀번호 교체를 포함하여 계정 비밀번호와 정책을 변경합니다."
}
---

## 설명 {#description}

`ALTER USER` 문은 비밀번호와 비밀번호 정책 등 사용자 계정의 속성을 변경하는 데 사용합니다.

4.2.1부터 Doris는 `RETAIN CURRENT PASSWORD`와 `DISCARD OLD PASSWORD`를 사용한 내장 비밀번호 인증의 이중 비밀번호를 지원합니다.

## 구문 {#syntax}

```sql
ALTER USER [IF EXISTS] <user_identity>
    [IDENTIFIED BY <password> [RETAIN CURRENT PASSWORD] | DISCARD OLD PASSWORD]
[<password_policy>]
[<comment>]

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}
    5. ACCOUNT_UNLOCK
```

## 필수 매개변수 {#required-parameters}

**1. `<user_identity`>**

> user_identity는 사용자를 고유하게 식별합니다. 구문은 'user_name'@'host'입니다.
> `user_identity`는 user_name과 host의 두 부분으로 구성됩니다. user_name은 사용자 이름이고, host는 클라이언트가 접속하는 호스트 주소를 나타냅니다. host 부분에는 퍼지 매칭을 위해 %를 사용할 수 있습니다. host를 지정하지 않으면 기본값은 '%'이며, 이는 사용자가 어느 호스트에서든 Doris에 접속할 수 있음을 의미합니다.
> host 부분을 도메인으로 지정할 수도 있습니다. 구문은 'user_name'@['domain']입니다. 대괄호로 둘러싸인 경우 Doris는 이를 도메인으로 간주하고 IP 주소를 확인하려고 시도합니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<password>`**

> 사용자 비밀번호를 지정합니다.

**2. `<password_policy>`**

> `password_policy`는 비밀번호 인증 로그인과 관련된 정책을 지정하는 절입니다. 현재 다음 정책을 지원합니다.
>
> `PASSWORD_HISTORY { <n> | DEFAULT}`
>
>    현재 사용자가 비밀번호를 재설정할 때 이전에 사용한 비밀번호를 다시 사용할 수 있는지 지정합니다. 예를 들어 `PASSWORD_HISTORY 10`은 최근 10번 설정한 비밀번호를 새 비밀번호로 사용할 수 없다는 뜻입니다. `PASSWORD_HISTORY DEFAULT`로 설정하면 전역 변수 `password_history`의 값을 사용합니다. `0`은 이 기능을 사용하지 않음을 뜻합니다. 기본값은 0입니다.
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
>    현재 사용자 비밀번호의 만료 시간을 설정합니다. 예를 들어 `PASSWORD_EXPIRE INTERVAL 10 DAY`는 비밀번호가 10일 후 만료된다는 뜻입니다. `PASSWORD_EXPIRE NEVER`는 비밀번호가 만료되지 않음을 뜻합니다. `PASSWORD_EXPIRE DEFAULT`로 설정하면 전역 변수 `default_password_lifetime`의 값을 사용합니다. 기본값은 NEVER(또는 0)이며, 비밀번호가 만료되지 않음을 뜻합니다.
>
> `FAILED_LOGIN_ATTEMPTS <n>`
>
> 현재 사용자가 잘못된 비밀번호로 n번 로그인하면 계정이 잠깁니다. 예를 들어 `FAILED_LOGIN_ATTEMPTS 3`은 잘못된 비밀번호로 3번 로그인하면 계정이 잠긴다는 뜻입니다.
>
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> 계정이 잠겼을 때의 잠금 시간을 설정합니다. 예를 들어 `PASSWORD_LOCK_TIME 1 DAY`는 계정이 하루 동안 잠긴다는 뜻입니다.
>
> `ACCOUNT_UNLOCK`
>
> `ACCOUNT_UNLOCK`는 잠긴 사용자의 계정을 잠금 해제하는 데 사용합니다.

**3. `<comment>`**

> 사용자 설명을 지정합니다.

**4. `RETAIN CURRENT PASSWORD` (4.2.1부터)**

> `IDENTIFIED BY`와 함께 사용하여 기존 주 비밀번호를 보조 비밀번호로 유지합니다. 새 비밀번호는 주 비밀번호가 되며, 두 비밀번호 모두 인증에 사용할 수 있습니다. 이전에 유지하던 보조 비밀번호가 있다면 새 보조 비밀번호로 대체됩니다.

**5. `DISCARD OLD PASSWORD` (4.2.1부터)**

> 유지 중인 보조 비밀번호를 제거하고 주 비밀번호는 그대로 둡니다. 독립적인 작업이므로 비밀번호 변경, 비밀번호 정책, 설명 또는 다른 계정 작업과 함께 사용할 수 없습니다. 보조 비밀번호가 없으면 아무 영향이 없습니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 있어야 합니다.

| 권한     | 대상    | 비고 |
|:--------------|:----------|:------|
| GRANT_PRIV 또는 ADMIN_PRIV | 전역 | RETAIN CURRENT PASSWORD와 DISCARD OLD PASSWORD를 포함한 ALTER USER 실행에 필요합니다. |

## 사용 시 참고 사항 {#usage-notes}

4.1.5부터 특수한 root 계정은 `'root'@'%'`뿐입니다. `'root'@'localhost'`와 같은 계정은 일반 사용자 계정이며, 사용자 이름이 root라는 이유만으로 실제 root 계정을 변경할 권한을 얻지 않습니다. 실제 root 계정에 적용되는 보호 조치도 이름이 root인 다른 사용자에게는 적용되지 않습니다.

1. 버전 2.0부터 이 명령은 사용자 역할 변경을 지원하지 않습니다. 관련 작업에는 [GRANT](./GRANT-TO.md)와 [REVOKE](./REVOKE-FROM.md)를 사용하세요.

2. 하나의 ALTER USER 명령에서는 다음 계정 속성 중 하나만 변경할 수 있습니다.
- 비밀번호 변경. 선택적으로 RETAIN CURRENT PASSWORD를 함께 사용 가능
- 유지 중인 보조 비밀번호 제거
- `PASSWORD_HISTORY` 변경
- `PASSWORD_EXPIRE` 변경
- `FAILED_LOGIN_ATTEMPTS`와 `PASSWORD_LOCK_TIME` 변경
- 사용자 잠금 해제

### 이중 비밀번호 (4.2.1부터) {#dual-passwords-since-421}

- `RETAIN CURRENT PASSWORD`를 사용하려면 현재 주 비밀번호가 비어 있지 않아야 하며 비밀번호를 변경해야 합니다. 새 비밀번호가 비어 있으면 RETAIN을 지정해도 두 비밀번호가 모두 지워집니다.
- RETAIN 없이 비어 있지 않은 비밀번호로 변경하면 기존 보조 비밀번호는 유지됩니다. 해당 인증 정보가 폐기되지는 않습니다.
- 계정 잠금과 비밀번호 만료 검사는 두 비밀번호 모두에 적용됩니다. DISCARD는 비밀번호 이력을 변경하거나 비밀번호 만료 시간의 계산을 다시 시작하지 않습니다.

비밀번호 교체 절차, 관찰 방법, 도메인 계정 동작 및 업그레이드 제한은 [이중 비밀번호](../../../admin-manual/auth/authentication/internal#dual-passwords)를 참조하세요. 이러한 절은 내장 비밀번호를 관리하며, LDAP나 외부 인증 연동에서 보관하는 인증 정보에는 적용되지 않습니다.

## 예제 {#example}

준비: 아래 예제에서 사용할 대상 사용자 `jack`을 생성합니다.

```sql
CREATE USER jack@'%' IDENTIFIED BY "12345";
```

- 사용자 비밀번호 변경

```sql
ALTER USER jack@'%' IDENTIFIED BY "12345";
```

- 사용자 비밀번호 정책 변경

```sql
ALTER USER jack@'%' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- 사용자 잠금 해제

```sql
ALTER USER jack@'%' ACCOUNT_UNLOCK
```

- 사용자 설명 변경

```sql
ALTER USER jack@'%' COMMENT "this is my first user"
```

- 이전 비밀번호를 계속 사용할 수 있도록 유지하면서 비밀번호 교체(4.2.1부터)

```sql
ALTER USER jack@'%' IDENTIFIED BY 'NewPwd_2026!' RETAIN CURRENT PASSWORD;
```

이전 비밀번호와 `NewPwd_2026!` 모두 인증에 사용할 수 있습니다. 모든 클라이언트가 새 비밀번호로 전환한 뒤에는 유지 중인 이전 비밀번호를 제거합니다.

```sql
ALTER USER jack@'%' DISCARD OLD PASSWORD;
```

이후에는 `NewPwd_2026!`만 인증에 사용할 수 있습니다.
