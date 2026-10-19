---
{
    "title": "REFRESH LDAP",
    "language": "ko",
    "description": "이 문은 Doris의 LDAP 캐시 정보를 새로 고치는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 Doris의 LDAP 캐시 정보를 새로 고치는 데 사용됩니다. LDAP 서비스에서 사용자 정보를 수정하거나 Doris에서 LDAP 사용자 그룹에 해당하는 역할의 권한을 수정하면, 캐시로 인해 변경 사항이 즉시 적용되지 않을 수 있습니다. 이 문을 사용하여 캐시를 새로 고칠 수 있습니다.

## 구문 {#syntax}

```sql
REFRESH LDAP [ALL | FOR <user_name>];
```

## 선택적 매개변수 {#optional-parameters}

**1. `[ALL]`**

모든 사용자의 LDAP 캐시 정보를 새로 고칠지 여부입니다.

**2. `<user_name>`**

LDAP 캐시 정보를 새로 고칠 사용자입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 있어야 합니다.


| 권한 | 대상 | 참고 사항                 |
| :---------------- | :------------- | :---------------------------- |
| ADMIN_PRIV        | 사용자 또는 역할 | `ADMIN_PRIV` 권한이 있는 사용자 또는 역할만 모든 사용자의 LDAP 캐시 정보를 새로 고칠 수 있습니다. 해당 권한이 없으면 현재 사용자의 LDAP 캐시 정보만 새로 고칠 수 있습니다. |

## 사용 시 참고 사항 {#usage-notes}

- Doris에서 LDAP 정보 캐시의 기본 만료 시간은 12시간이며, `SHOW FRONTEND CONFIG LIKE 'ldap_user_cache_timeout_s';` 명령으로 확인할 수 있습니다.
- `REFRESH LDAP ALL`은 모든 사용자의 LDAP 캐시 정보를 새로 고치며, `ADMIN_PRIV` 권한이 필요합니다.
- `user_name`을 지정하면 지정한 사용자의 LDAP 캐시 정보를 새로 고칩니다.
- `user_name`을 지정하지 않으면 현재 사용자의 LDAP 캐시 정보를 새로 고칩니다.

## 예시 {#examples}

1. 모든 LDAP 사용자의 캐시 정보를 새로 고칩니다.

    ```sql
    REFRESH LDAP ALL;
    ```

2. 현재 LDAP 사용자의 캐시 정보를 새로 고칩니다.

    ```sql
    REFRESH LDAP;
    ```

3. 지정한 LDAP 사용자 jack의 캐시 정보를 새로 고칩니다.

    ```sql
    REFRESH LDAP FOR jack;
    ```
