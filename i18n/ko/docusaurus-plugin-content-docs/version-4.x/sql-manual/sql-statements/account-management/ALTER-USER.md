---
{
    "title": "ALTER USER",
    "language": "ko",
    "description": "ALTER USER 문은 비밀번호와 비밀번호 정책 등 사용자 계정의 속성을 수정하는 데 사용됩니다."
}
---

## 설명 {#description}

`ALTER USER` 문은 비밀번호와 비밀번호 정책 등 사용자 계정의 속성을 수정하는 데 사용됩니다.

## 구문 {#syntax}

```sql
ALTER USER [IF EXISTS] <user_identity> [IDENTIFIED BY <password>]
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
> `user_identity`는 user_name과 host의 두 부분으로 구성되며, username은 사용자 이름입니다. host는 클라이언트가 연결하는 호스트 주소를 식별합니다. host 부분에는 %를 사용하여 패턴 매칭을 할 수 있습니다. host를 지정하지 않으면 기본값은 '%'이며, 이는 사용자가 모든 호스트에서 Doris에 연결할 수 있음을 의미합니다.
> host 부분을 도메인으로 지정할 수도 있으며, 구문은 'user_name'@['domain']입니다. 대괄호로 둘러싸여 있어도 Doris는 이를 도메인으로 간주하고 해당 ip 주소를 확인하려고 합니다. 

## 선택적 매개변수 {#optional-parameters}

**1. `<password>`**

> 사용자 비밀번호를 지정합니다. 

**2. `<password_policy>`**

> `password_policy`는 비밀번호 인증을 통한 로그인과 관련된 정책을 지정하는 절입니다. 현재 다음 정책을 지원합니다:
>
> `PASSWORD_HISTORY { <n> | DEFAULT}`
>
>    현재 사용자가 비밀번호를 재설정할 때 이전에 사용한 비밀번호를 다시 사용할 수 있는지 지정합니다. 예를 들어, `PASSWORD_HISTORY 10`은 최근 10회에 설정한 비밀번호를 새 비밀번호로 사용하는 것을 금지합니다. `PASSWORD_HISTORY DEFAULT`로 설정하면 전역 변수 `password_history`의 값이 사용됩니다. `0`은 이 기능을 활성화하지 않음을 의미합니다. 기본값은 0입니다.
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
>    현재 사용자의 비밀번호 만료 시간을 설정합니다. 예를 들어, `PASSWORD_EXPIRE INTERVAL 10 DAY`는 비밀번호가 10일 후에 만료됨을 의미합니다. `PASSWORD_EXPIRE NEVER`는 비밀번호가 만료되지 않음을 의미합니다. `PASSWORD_EXPIRE DEFAULT`로 설정하면 전역 변수 `default_password_lifetime`의 값이 사용됩니다. 기본값은 NEVER(또는 0)이며, 만료되지 않음을 의미합니다.
>
> `FAILED_LOGIN_ATTEMPTS <n>` 
>
> 현재 사용자가 로그인할 때 비밀번호를 n회 잘못 입력하면 계정이 잠깁니다. 예를 들어, `FAILED_LOGIN_ATTEMPTS 3`은 로그인 시 비밀번호를 3회 잘못 입력하면 계정이 잠긴다는 의미입니다.
>   
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> 계정이 잠겼을 때 적용할 잠금 시간을 설정합니다. 예를 들어, `PASSWORD_LOCK_TIME 1 DAY`는 계정이 하루 동안 잠긴다는 의미입니다.
>
> `ACCOUNT_UNLOCK`
>    
> `ACCOUNT_UNLOCK`은 잠긴 사용자의 잠금을 해제하는 데 사용됩니다.

**3. `<comment>`**

>사용자 설명을 지정합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다:

| 권한     | 객체    | 참고 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER 또는 ROLE    | 이 작업은 ADMIN_PRIV 권한이 있는 사용자 또는 역할만 수행할 수 있습니다  |

## 사용 시 참고 사항 {#usage-notes}

4.1.5부터는 `'root'@'%'`만 특수한 root 계정으로 취급됩니다. `'root'@'localhost'`와 같은 계정은 여전히 일반 사용자이며, 사용자 이름만으로 실제 root 계정을 수정할 권한을 얻지는 않습니다. 실제 root 계정에 대한 보호도 이름이 root인 다른 사용자에게는 적용되지 않습니다.

1. 버전 2.0부터 이 명령은 더 이상 사용자 역할 수정을 지원하지 않습니다. 관련 작업에는 [GRANT](./GRANT-TO.md)와 [REVOKE](./REVOKE-FROM.md)를 사용하세요.

2. ALTER USER 명령에서는 다음 계정 속성 중 하나만 한 번에 수정할 수 있습니다:
- 비밀번호 변경
- `PASSWORD_HISTORY` 수정
- `PASSWORD_EXPIRE` 수정
- `FAILED_LOGIN_ATTEMPTS`와 `PASSWORD_LOCK_TIME` 수정
- 사용자 잠금 해제

## 예제 {#example}

준비: 아래 예제에서 사용할 대상 사용자 `jack`을 생성합니다:

```sql
CREATE USER jack@'%' IDENTIFIED BY "12345";
```

- 사용자 비밀번호 변경

```sql
ALTER USER jack@'%' IDENTIFIED BY "12345";
```

- 사용자 비밀번호 정책 수정
	
```sql
ALTER USER jack@'%' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- 사용자 잠금 해제

```sql
ALTER USER jack@'%' ACCOUNT_UNLOCK
```

- 사용자 설명 수정

```sql
ALTER USER jack@'%' COMMENT "this is my first user"
```
