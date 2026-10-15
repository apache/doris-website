---
{
    "title": "SHOW GRANTS",
    "language": "ja",
    "description": "ユーザーの権限を表示します。"
}
---

## 説明

 ユーザーの権限を表示します。

## 構文

```sql
SHOW [ALL] GRANTS [FOR <user_identity>];
```

## 任意パラメータ

**1. `[ALL]`**

すべてのユーザーの権限を表示するかどうか。

**2. `<user_identity>`**

  権限を表示するユーザーを指定します。`user_identity` は `CREATE USER` コマンドで作成されている必要があります。

## 戻り値

  | 列 | 説明 |
  | -- | -- |
  | UserIdentity | ユーザー識別子 |
  | Comment | コメント |
  | Password | パスワードが設定されているかどうか |
  | Roles | ロール |
  | GlobalPrivs | グローバル権限 |
  | CatalogPrivs | カタログ権限 |
  | DatabasePrivs | データベース権限 |
  | TablePrivs | テーブル権限 |
  | ColPrivs | 列の権限 |
  | ResourcePrivs | リソース権限 |
  | WorkloadGroupPrivs | ワークロードグループの権限 |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role    | `GRANT_PRIV` 権限を持つユーザーまたはロールはすべてのユーザーの権限を表示できます。それ以外は現在のユーザーの権限のみ表示できます |

## 使用上の注意
  - `SHOW ALL GRANTS` ですべてのユーザーの権限を表示できますが、`GRANT_PRIV` 権限が必要です。
  - `user_identity` を指定すると、そのユーザーの権限を表示します。`user_identity` は `CREATE USER` コマンドで作成されている必要があります。
  - `user_identity` を省略すると、現在のユーザーの権限を表示します。
  - Doris は RBAC（ロールベースアクセス制御）モデルに基づいて権限を管理します。そのため、ここに表示される権限は、ユーザーに割り当てられたすべてのロールの権限を合わせたものです。特定の権限がどのロールに由来するか調べるには、[SHOW ROLES](./SHOW-ROLES.md) コマンドで詳細を確認してください。

## 例

1. すべてのユーザーの権限情報を表示します。

   ```sql
   SHOW ALL GRANTS;
   ```

   ```text
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | UserIdentity | Comment | Password | Roles    | GlobalPrivs          | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | 'root'@'%'   | ROOT    | No       | operator | Node_priv,Admin_priv | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   | 'admin'@'%'  | ADMIN   | No       | admin    | Admin_priv           | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   | 'jack'@'%'   |         | No       |          | NULL                 | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   ```

2. 指定したユーザーの権限を表示します

    ```sql
    SHOW GRANTS FOR jack@'%';
    ```

    ```text
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    | UserIdentity | Comment | Password | Roles | GlobalPrivs | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    | 'jack'@'%'   |         | No       |       | NULL        | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    ```

3. 現在のユーザーの権限を表示します

   ```sql
   SHOW GRANTS;
   ```

   ```text
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | UserIdentity | Comment | Password | Roles    | GlobalPrivs          | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | 'root'@'%'   | ROOT    | No       | operator | Node_priv,Admin_priv | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   ```

