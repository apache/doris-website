---
{
    "title": "SET PASSWORD",
    "language": "ko",
    "description": "Doris 로그인 비밀번호를 변경하고, 비밀번호 교체 중 현재 비밀번호를 선택적으로 유지하는 방법을 설명합니다."
}
---

## 설명 {#description}

`SET PASSWORD` 문은 사용자의 로그인 비밀번호를 변경하는 데 사용합니다.

4.2.1부터 Doris는 내장 비밀번호 인증에서 `RETAIN CURRENT PASSWORD`와 `DISCARD OLD PASSWORD`를 사용한 이중 비밀번호를 지원합니다.

## 구문 {#syntax}

```sql
SET PASSWORD [FOR <user_identity>] =
    { PASSWORD(<plain_password>) | <hashed_password> }
    [RETAIN CURRENT PASSWORD]
```

## 필수 매개변수 {#required-parameters}

**1. `<plain_password>`**

> 입력값은 평문 비밀번호입니다. 비밀번호가 `123456`이라면 문자열 `123456`을 그대로 사용합니다.

**2. `<hashed_password>`**

> 입력값은 암호화된 비밀번호입니다. 비밀번호가 123456이라면 문자열 `*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9`를 그대로 사용합니다. 이 문자열은 함수 `PASSWORD('123456')`의 반환값입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<user_identity>`**

> `FOR`를 사용하면 호스트 부분을 포함하여 `CREATE USER`로 생성한 계정 식별자를 정확히 지정해야 합니다. `FOR`를 생략하면 Doris는 `CURRENT_USER()`가 반환하는 인증된 계정을 사용하며, `USER()`가 반환하는 클라이언트 IP 식별자는 사용하지 않습니다. `SHOW GRANTS`로 현재 계정을 확인할 수 있습니다.

**2. `RETAIN CURRENT PASSWORD` (4.2.1부터 지원)**

> 기존 기본 비밀번호를 보조 비밀번호로 유지하고 지정한 새 비밀번호를 기본 비밀번호로 설정합니다. 두 비밀번호 모두 인증에 사용할 수 있으며, 이전에 보조 비밀번호가 있었다면 교체됩니다. 자신의 비밀번호를 변경할 때도 전역 `GRANT_PRIV` 또는 `ADMIN_PRIV`가 필요합니다.

## 권한 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 필요합니다.

| 권한     | 대상    | 설명 |
|:--------------|:----------|:------|
| 없음 | 현재 사용자 | RETAIN 없이 자신의 비밀번호를 일반적으로 변경할 때는 추가 권한이 필요하지 않습니다. |
| GRANT_PRIV 또는 ADMIN_PRIV | 전역 | 다른 사용자의 비밀번호를 변경하거나 자신의 계정을 포함해 RETAIN CURRENT PASSWORD를 사용할 때 필요합니다. |

## 사용 시 참고 사항 {#usage-notes}

4.1.5부터 특수한 root 계정 식별자는 `'root'@'%'`뿐입니다. `'root'@'localhost'`와 같은 식별자는 일반 사용자로 유지되며, 사용자 이름이 root라는 이유만으로 실제 root 계정을 변경할 권한을 얻지 않습니다. 실제 root 계정에 적용되는 보호 조치도 이름이 root인 다른 사용자에게는 적용되지 않습니다.

- `FOR user_identity`를 지정하지 않으면 현재 사용자의 비밀번호를 변경합니다.

### 이중 비밀번호 (4.2.1부터 지원) {#dual-passwords-since-421}

- RETAIN 없이 비어 있지 않은 비밀번호로 일반적인 변경을 수행하면 기존 보조 비밀번호가 유지됩니다.
- 현재 기본 비밀번호가 비어 있으면 RETAIN은 실패합니다. 새 비밀번호가 비어 있으면 RETAIN을 지정해도 두 비밀번호가 모두 지워집니다.
- 평문 비밀번호에는 `PASSWORD('<new_password>')`를 사용합니다. 문자열을 직접 지정할 때는 이미 해시 처리된 비밀번호를 입력해야 합니다.
- 보조 비밀번호를 폐기하려면 `ALTER USER ... DISCARD OLD PASSWORD`를 사용합니다. SET PASSWORD에는 DISCARD 절이 없습니다.

전체 절차와 업그레이드 제한 사항은 [이중 비밀번호](../../../admin-manual/auth/authentication/internal#dual-passwords)를 참조하세요. 이 절들은 내장 비밀번호에 적용됩니다.

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

- 기존 비밀번호와 새 비밀번호를 함께 사용할 수 있는 기간을 두고 계정 비밀번호 교체 (4.2.1부터 지원)

전역 `GRANT_PRIV` 또는 `ADMIN_PRIV`를 가진 관리자로 실행합니다.

```sql
CREATE USER 'rotation_user'@'%' IDENTIFIED BY 'OldPwd_2026!';
SET PASSWORD FOR 'rotation_user'@'%' = PASSWORD('NewPwd_2026!') RETAIN CURRENT PASSWORD;
```

`OldPwd_2026!`와 `NewPwd_2026!` 모두 인증에 사용할 수 있습니다. 클라이언트 마이그레이션을 마친 후 기존 비밀번호를 제거합니다.

```sql
ALTER USER 'rotation_user'@'%' DISCARD OLD PASSWORD;
```

그 이후에는 `NewPwd_2026!`로만 인증할 수 있습니다.
