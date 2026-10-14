---
{
    "title": "REFRESH LDAP",
    "language": "ja",
    "description": "Doris の LDAP キャッシュ情報を更新します。"
}
---

## 説明

Doris の LDAP キャッシュ情報を更新します。LDAP サービスのユーザー情報や、Doris における LDAP ユーザーグループに対応するロール権限を変更しても、キャッシュのため変更がすぐに反映されない場合があります。この文でキャッシュを更新できます。

## 構文

```sql
REFRESH LDAP [ALL | FOR <user_name>];
```

## 任意パラメータ

**1. `[ALL]`**

すべてのユーザーの LDAP キャッシュ情報を更新するかどうか。

**2. `<user_name>`**

LDAP キャッシュ情報を更新するユーザー

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。


| 権限 | 対象 | 説明                 |
| :---------------- | :------------- | :---------------------------- |
| ADMIN_PRIV        | User or Role | すべてのユーザーの LDAP キャッシュ情報を更新できるのは、`ADMIN_PRIV` 権限を持つユーザーまたはロールのみです。それ以外は現在のユーザーの情報のみ更新できます |

## 使用上の注意

- Doris の LDAP 情報キャッシュのデフォルト有効期間は 12 時間です。`SHOW FRONTEND CONFIG LIKE 'ldap_user_cache_timeout_s';` で確認できます。
- `REFRESH LDAP ALL` はすべてのユーザーの LDAP キャッシュ情報を更新しますが、`ADMIN_PRIV` 権限が必要です。
- `user_name` を指定すると、そのユーザーの LDAP キャッシュ情報を更新します。
- `user_name` を省略すると、現在のユーザーの LDAP キャッシュ情報を更新します。

## 例

1. すべての LDAP ユーザーのキャッシュ情報を更新します。

    ```sql
    REFRESH LDAP ALL;
    ```

2. 現在の LDAP ユーザーのキャッシュ情報を更新します。

    ```sql
    REFRESH LDAP;
    ```

3. 指定した LDAP ユーザー jack のキャッシュ情報を更新します。

    ```sql
    REFRESH LDAP FOR jack;
    ```

