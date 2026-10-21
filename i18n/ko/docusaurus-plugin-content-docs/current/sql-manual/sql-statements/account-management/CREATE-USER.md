---
{
    "title": "CREATE USER",
    "language": "ko",
    "description": "CREATE USER 문은 Doris 사용자를 생성하는 데 사용됩니다."
}
---

## 설명 {#description}

`CREATE USER` 문은 Doris 사용자를 생성하는 데 사용됩니다.

## 구문 {#syntax}

```sql
CREATE USER [IF EXISTS] <user_identity> [IDENTIFIED BY <password>]
[DEFAULT ROLE <role_name>]
[<password_policy>]
[<comment>]  

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}
```
## 필수 매개변수 {#required-parameters}

**1. `<user_identity>`**

> user_identity는 사용자를 고유하게 식별합니다. 구문은 'user_name'@'host'입니다.
> `user_identity`는 user_name과 host의 두 부분으로 구성되며, username은 사용자 이름입니다. host는 클라이언트가 연결하는 호스트 주소를 식별합니다. host 부분에는 %를 사용하여 패턴 매칭을 수행할 수 있습니다. host를 지정하지 않으면 기본값은 '%'이며, 이는 사용자가 모든 호스트에서 Doris에 연결할 수 있음을 의미합니다.
> host 부분은 도메인으로 지정할 수도 있으며, 구문은 'user_name'@['domain']입니다. 대괄호로 둘러싸여 있어도 Doris는 이를 도메인으로 간주하고 해당 ip 주소를 확인하려고 시도합니다. 


## 선택적 매개변수 {#optional-parameters}

**1. `<password>`**

> 사용자 비밀번호를 지정합니다. 

**2. `<role_name>`**

> 사용자 역할을 지정합니다.
> 역할(ROLE)을 지정하면 새로 생성된 사용자에게 해당 역할의 권한이 자동으로 부여됩니다. 지정하지 않으면 사용자는 기본적으로 아무 권한도 갖지 않습니다. 지정한 ROLE은 이미 존재해야 합니다.

**3. `<password_policy>`**

> `password_policy`는 비밀번호 인증을 통한 로그인과 관련된 정책을 지정하는 절입니다. 현재 다음 정책을 지원합니다.
>
> `PASSWORD_HISTORY { <n> | DEFAULT }`
>
> 현재 사용자가 비밀번호를 재설정할 때 이전에 사용한 비밀번호를 다시 사용할 수 있는지를 설정합니다. 예를 들어, `PASSWORD_HISTORY 10`은 최근 10회에 사용한 비밀번호를 새 비밀번호로 사용할 수 없음을 의미합니다. `PASSWORD_HISTORY DEFAULT`로 설정하면 전역 변수 `password_history`의 값을 사용합니다. `0`은 이 기능을 활성화하지 않음을 의미합니다. 기본값은 0입니다.
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
> 현재 사용자의 비밀번호 만료 시간을 설정합니다. 예를 들어, `PASSWORD_EXPIRE INTERVAL 10 DAY`는 비밀번호가 10일 후에 만료됨을 의미합니다. `PASSWORD_EXPIRE NEVER`는 비밀번호가 만료되지 않음을 의미합니다. `PASSWORD_EXPIRE DEFAULT`로 설정하면 전역 변수 `default_password_lifetime`의 값을 사용합니다. 기본값은 NEVER(또는 0)이며, 이는 만료되지 않음을 의미합니다.
>
> `FAILED_LOGIN_ATTEMPTS <n>` 
>
> 현재 사용자가 로그인할 때 잘못된 비밀번호로 n회 로그인을 시도하면 계정이 잠깁니다. 예를 들어, `FAILED_LOGIN_ATTEMPTS 3`은 로그인에 3회 실패하면 계정이 잠긴다는 의미입니다.
>   
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> 계정이 잠겼을 때 잠금이 유지되는 시간을 설정합니다. 예를 들어, `PASSWORD_LOCK_TIME 1 DAY`는 계정이 하루 동안 잠긴다는 의미입니다.

**4. `<comment`>**

> 사용자 설명을 지정합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 갖고 있어야 합니다.

| 권한     | 객체    | 참고 사항 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER 또는 ROLE    | 이 작업은 ADMIN_PRIV 권한을 가진 사용자 또는 역할만 수행할 수 있습니다.  |

## 예제 {#example}

- 비밀번호가 없는 사용자 생성(host를 지정하지 않으면 jack@'%'와 동일)

```sql
CREATE USER 'jack';
```

- '172.10.1.10'에서 로그인할 수 있도록 비밀번호가 있는 사용자 생성

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY '123456';
```

- 평문 비밀번호를 전달하지 않으려면 예제 2의 사용자를 다음과 같이 생성할 수도 있습니다.

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY PASSWORD '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9';
The encrypted content can be obtained through PASSWORD(), for example:
SELECT PASSWORD('123456');
```

- '192.168' 서브넷에서 로그인할 수 있는 사용자를 생성하고 역할을 example_role로 지정

```sql
CREATE USER 'jack'@'192.168.%' DEFAULT ROLE 'example_role';
```

- 'example_domain' 도메인에서 로그인할 수 있는 사용자 생성

```sql
CREATE USER 'jack'@['example_domain'] IDENTIFIED BY '12345';
```

- 사용자를 생성하고 역할 할당

```sql
CREATE USER 'jack'@'%' IDENTIFIED BY '12345' DEFAULT ROLE 'my_role';
```

- 사용자를 생성하고, 비밀번호가 10일 후에 만료되도록 설정하며, 로그인에 3회 실패하면 계정이 하루 동안 잠기도록 설정

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_EXPIRE INTERVAL 10 DAY FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- 사용자를 생성하고, 최근에 사용한 8개의 비밀번호는 다시 설정할 수 없도록 제한

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_HISTORY 8;
```

- 설명이 있는 사용자 생성

```sql
CREATE USER 'jack' COMMENT "this is my first user";
```
