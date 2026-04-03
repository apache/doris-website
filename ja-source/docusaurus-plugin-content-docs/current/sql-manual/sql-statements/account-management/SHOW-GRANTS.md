---
{
  "title": "SHOW GRANTS",
  "language": "ja",
  "description": "このステートメントは、ユーザーの権限を表示するために使用されます。"
}
---
## 説明

このステートメントはユーザー権限を表示するために使用されます。

## 構文

```sql
SHOW [ALL] GRANTS [FOR <user_identity>];
```
## オプションパラメータ

**1. `[ALL]`**

すべてのユーザーの権限を表示するかどうか。

**2. `<user_identity>`**

  権限を表示するユーザーを指定します。`user_identity`は`CREATE USER`コマンドで作成されている必要があります。

## 戻り値

  | Column | Description |
  | -- | -- |
  | UserIdentity | ユーザーアイデンティティ |
  | Comment | コメント |
  | Password | パスワードが設定されているかどうか |
  | Roles | ロール |
  | GlobalPrivs | グローバル権限 |
  | CatalogPrivs | カタログ権限 |
  | DatabasePrivs | データベース権限 |
  | TablePrivs | テーブル権限 |
  | ColPrivs | カラム権限 |
  | ResourcePrivs | リソース権限 |
  | WorkloadGroupPrivs | WorkloadGroup権限 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege | Object | Notes                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role    | User or Roleが`GRANT_PRIV`権限を持つ場合、すべてのユーザー権限を表示でき、そうでなければ現在のユーザーの権限のみ表示可能 |

## 使用上の注意
  - `SHOW ALL GRANTS`はすべてのユーザーの権限を表示できますが、`GRANT_PRIV`権限が必要です。
  - `user_identity`が指定されている場合、指定されたユーザーの権限が表示されます。`user_identity`は`CREATE USER`コマンドで作成されている必要があります。
  - `user_identity`が指定されていない場合、現在のユーザーの権限が表示されます。
  - DorisはRBAC（Role-Based Access Control）モデルに基づく権限制御を実装しています。そのため、ここで表示される権限は実際にはユーザーに割り当てられたすべてのロールの結合権限です。権限がどの具体的なロールに由来するかを確認したい場合は、[SHOW ROLES](./SHOW-ROLES.md)コマンドを使用して詳細を表示できます。

## 例

1. すべてのユーザー権限情報を表示する。

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
