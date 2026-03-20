---
{
  "title": "SHOW GRANTS",
  "description": "この文は、ユーザー権限を表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントはユーザー権限を表示するために使用されます。

## Syntax

```sql
SHOW [ALL] GRANTS [FOR <user_identity>];
```
## オプションパラメータ

**1. `[ALL]`**

すべてのユーザーの権限を表示するかどうか。

**2. `<user_identity>`**

  権限を表示するユーザーを指定します。`user_identity`は`CREATE USER`コマンドによって作成されている必要があります。

## 戻り値

  | Column | デスクリプション |
  | -- | -- |
  | UserIdentity | ユーザーアイデンティティ |
  | Comment | コメント |
  | Password | パスワードが設定されているかどうか |
  | Roles | ロール |
  | GlobalPrivs | グローバル権限 |
  | CatalogPrivs | Catalog権限 |
  | DatabasePrivs | Database権限 |
  | TablePrivs | Table権限 |
  | ColPrivs | Column権限 |
  | ResourcePrivs | Resource権限 |
  | WorkloadGroupPrivs | WorkloadGroup権限 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | 注釈                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role    | UserまたはRoleが`GRANT_PRIV`権限を持つ場合、すべてのユーザー権限を表示できます。そうでなければ、現在のユーザーの権限のみ表示できます |

## 使用上の注意
  - `SHOW ALL GRANTS`はすべてのユーザーの権限を表示できますが、`GRANT_PRIV`権限が必要です。
  - `user_identity`が指定されている場合、指定されたユーザーの権限が表示されます。また、`user_identity`は`CREATE USER`コマンドによって作成されている必要があります。
  - `user_identity`が指定されていない場合、現在のユーザーの権限が表示されます。
  - DorisはRBAC（Role-Based Access Control）モデルに基づいて権限制御を実装しています。そのため、ここに表示される権限は実際にはユーザーに割り当てられたすべてのロールの組み合わせ権限です。特定の権限がどのロールから来ているかを確認したい場合は、[SHOW ROLES](./SHOW-ROLES.md)コマンドを使用して詳細を表示できます。

## 例

1. すべてのユーザー権限情報を表示します。

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
2. 指定されたユーザーの権限を表示する

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
3. 現在のユーザーの権限を表示する

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
