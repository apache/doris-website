---
{
  "title": "REVOKE FROM",
  "language": "ja",
  "description": "REVOKEコマンドには以下の機能があります："
}
---
## 説明

REVOKEコマンドは以下の機能を持ちます：

1. ユーザーまたはロールの指定された権限を取り消します。
2. ユーザーに以前付与された指定されたロールを取り消します。

**関連コマンド**

- [GRANT TO](./GRANT-TO.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)

## 構文

**ユーザーまたはロールの指定された権限を取り消す**

```sql
REVOKE <privilege_list> 
ON { <priv_level> 
   | RESOURCE <resource_name> 
   | WORKLOAD GROUP <workload_group_name> 
   }
FROM { <user_identity> | ROLE <role_name> }
```
**ユーザーに以前付与された指定されたroleを取り消す**

```sql
REVOKE <role_list> FROM <user_identity> 
```
## 必須パラメータ

**1. `<privilege_list>`**

取り消す権限のカンマ区切りリスト。サポートされる権限は以下の通りです：

- NODE_PRIV: クラスターノード操作権限
- ADMIN_PRIV: 管理者権限
- GRANT_PRIV: 認可権限
- SELECT_PRIV: クエリ権限
- LOAD_PRIV: データインポート権限
- ALTER_PRIV: 変更権限
- CREATE_PRIV: 作成権限
- DROP_PRIV: 削除権限
- USAGE_PRIV: 使用権限
- SHOW_VIEW_PRIV: ビュー定義権限

**2. `<priv_level>`**

権限のスコープを指定します。サポートされる形式は以下の通りです：

- *.*.*: 全てのカタログ、データベース、テーブル
- catalog_name.*.*: 指定されたカタログ内の全てのデータベースとテーブルを指定
- catalog_name.db.*: 指定されたデータベース内の全てのテーブルを指定
- catalog_name.db.tbl: 指定されたデータベース内の特定のテーブルを指定

**3. `<resource_name>`**

リソース名を指定します。`%`（任意の文字列にマッチ）と `_`（任意の単一文字にマッチ）のワイルドカード文字をサポートします。

**4. `<workload_group_name>`**

ワークロードグループ名を指定します。`%`（任意の文字列にマッチ）と `_`（任意の単一文字にマッチ）のワイルドカード文字をサポートします。

**5. `<user_identity>`**

ユーザーアイデンティティを指定します。ユーザーはCREate USER文で作成されたユーザーである必要があります。ユーザーアイデンティティのhost部分はドメイン名にすることができ、ドメイン名の場合は権限取り消し時間に1分の遅延が生じる場合があります。

**6. `<role_name>`**

ロール名を指定します。ロールは存在している必要があります。

**7. `<role_list>`**

取り消すロールのカンマ区切りリスト。指定された全てのロールが存在している必要があります。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低でも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | ユーザーまたはロール   | GRANT_PRIV権限を持つユーザーまたはロールのみがGRANT操作を実行できます。 |

## 例

- 特定のデータベースに対するSELECT権限をユーザーから取り消す：

   ```sql
   REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';
   ```
- 特定のリソースに対するユーザーの使用権限を取り消す:

   ```sql
   REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';
   ```
- ユーザーからroleを取り消す:

   ```sql
   REVOKE 'role1','role2' FROM 'jack'@'192.%';
   ```
- 特定のワークロードグループに対するユーザーの使用権限を取り消す：

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM 'jack'@'%';
   ```
- ユーザーからすべてのworkload groupsの使用権限を取り消す:

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP '%' FROM 'jack'@'%';
   ```
- ユーザーからロールを取り消す:

   ```sql
   REVOKE 'role1','role2' FROM ROLE 'test_role';
   ```
