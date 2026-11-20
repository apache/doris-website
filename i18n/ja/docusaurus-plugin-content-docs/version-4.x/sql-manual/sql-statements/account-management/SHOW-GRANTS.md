---
{
    "title": "SHOW GRANTS",
    "language": "ja",
    "description": "SHOW GRANTS の出力を使用して Apache Doris ユーザーの権限を確認し、保持されているセカンダリパスワードを持つアカウントを特定します。"
}
---

## 説明 {#description}

この文は、ユーザーの権限を確認するために使用します。

## 構文 {#syntax}

```sql
SHOW [ALL] GRANTS [FOR <user_identity>];
```

## オプションのパラメータ {#optional-parameters}

**1. `[ALL]`**

すべてのユーザーの権限を表示するかどうかを指定します。

**2. `<user_identity>`**

権限を確認するユーザーを指定します。`user_identity` は `CREATE USER` コマンドで作成されている必要があります。

## 戻り値 {#return-value}

  | カラム | 説明 |
  | -- | -- |
  | UserIdentity | ユーザーの識別情報 |
  | Comment | コメント |
  | Password | 使用可能なローカルパスワードがない場合は `No`、プライマリパスワードのみがある場合は `Yes`、保持されているセカンダリパスワードもある場合は `Yes (dual)`（4.2.1 以降）。 |
  | Roles | ロール |
  | GlobalPrivs | グローバル権限 |
  | CatalogPrivs | Catalog 権限 |
  | DatabasePrivs | データベース権限 |
  | TablePrivs | テーブル権限 |
  | ColPrivs | カラム権限 |
  | ResourcePrivs | リソース権限 |
  | WorkloadGroupPrivs | WorkloadGroup 権限 |

## アクセス制御の要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | ユーザーまたはロール    | ユーザーまたはロールに `GRANT_PRIV` 権限があれば、すべてのユーザーの権限を表示できます。それ以外の場合は、現在のユーザーの権限のみを表示できます |

## 使用上の注意 {#usage-notes}
  - `SHOW ALL GRANTS` ではすべてのユーザーの権限を表示できますが、`GRANT_PRIV` 権限が必要です。
  - `user_identity` を指定すると、そのユーザーの権限を表示します。`user_identity` は `CREATE USER` コマンドで作成されている必要があります。
  - `user_identity` を指定しない場合は、現在のユーザーの権限を表示します。
  - Doris は RBAC（Role-Based Access Control）モデルに基づいて権限を制御します。そのため、ここに表示される権限は、実際にはユーザーに割り当てられたすべてのロールの権限を合わせたものです。権限がどのロールに由来するかを確認するには、[SHOW ROLES](./SHOW-ROLES.md) コマンドで詳細を表示できます。

## 例 {#examples}

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

2. 指定したユーザーの権限を表示します。

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

3. 現在のユーザーの権限を表示します。

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
