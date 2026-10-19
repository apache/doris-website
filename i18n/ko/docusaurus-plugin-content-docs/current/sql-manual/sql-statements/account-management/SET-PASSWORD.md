---
{
    "title": "SET PASSWORD",
    "language": "ko",
    "description": "SET PASSWORD 문은 사용자의 로그인 비밀번호를 변경하는 데 사용됩니다."
}
---

## 설명 {#description}

`SET PASSWORD` 문은 사용자의 로그인 비밀번호를 변경하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SET PASSWORD [FOR <user_identity>] =
    [PASSWORD(<plain_password>)]|[<hashed_password>]
```

## 필수 매개변수 {#required-parameters}

**1. `<plain_password>`**

> 입력값은 평문 비밀번호입니다. 비밀번호 `123456`을 예로 들면, 문자열 `123456`을 그대로 사용합니다.

**2. `<hashed_password>`**

> 입력값은 암호화된 비밀번호입니다. 비밀번호 123456을 예로 들면, 문자열 `*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9`를 그대로 사용하며, 이는 `PASSWORD('123456')` 함수의 반환값입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<user_identity>`**

> 여기서 user_identity는 CREATE USER로 사용자를 생성할 때 지정한 user_identity와 정확히 일치해야 합니다. 그렇지 않으면 사용자가 존재하지 않는다는 오류가 발생합니다. user_identity를 지정하지 않으면 현재 사용자는 'username'@'ip'이며, 이는 어떤 user_identity와도 일치하지 않을 수 있습니다. 현재 사용자는 SHOW GRANTS로 확인할 수 있습니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한     | 객체    | 비고 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER 또는 ROLE    | 사용자 또는 역할에 ADMIN_PRIV 권한이 있으면 모든 사용자의 비밀번호를 변경할 수 있으며, 그렇지 않으면 현재 사용자의 비밀번호만 변경할 수 있습니다.  |

## 사용 시 참고 사항 {#usage-notes}

4.1.5부터는 `'root'@'%'`만 특별한 root 식별자로 취급됩니다. `'root'@'localhost'`와 같은 식별자는 일반 사용자로 유지되며, 사용자 이름이 root라는 이유만으로 실제 root 계정을 수정할 권한을 얻지는 않습니다. 실제 root 계정에 대한 보호는 이름이 root인 다른 사용자에게는 적용되지 않습니다.

- `FOR user_identity` 필드가 없으면 현재 사용자의 비밀번호를 변경합니다.

## 예제 {#example}

- 현재 사용자의 비밀번호 변경

```sql
SET PASSWORD = PASSWORD('123456')
SET PASSWORD = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```

- 지정한 사용자의 비밀번호 변경

```sql
SET PASSWORD FOR 'jack'@'192.%' = PASSWORD('123456')
SET PASSWORD FOR 'jack'@['domain'] = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```
