---
{
  "title": "REVOKE FROM",
  "description": "REVOKE コマンドには以下の機能があります：",
  "language": "ja"
}
---
## 概要

REVOKEコマンドには以下の機能があります：

1. ユーザーまたはロールの指定された権限を取り消す。
2. 以前にユーザーに付与された指定されたロールを取り消す。

**関連コマンド**

- [GRANT TO](./GRANT-TO.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 構文

**ユーザーまたはロールの指定された権限を取り消す**

```sql
REVOKE <privilege_list> 
ON { <priv_level> 
   | RESOURCE <resource_name> 
   | WORKLOAD GROUP <workload_group_name> 
   | COMPUTE GROUP <compute_group_name> 
   | STORAGE VAULT <storage_vault_name> 
   } 
FROM { <user_identity> | ROLE <role_name> }
```
**ユーザーに以前付与された指定されたroleを取り消す**

```sql
REVOKE <role_list> FROM <user_identity> 
```
## 必須パラメータ

**1. `<privilege_list>`**

取り消す権限のカンマ区切りリスト。サポートされている権限には以下が含まれます：

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

権限のスコープを指定します。サポートされている形式には以下が含まれます：

- *.*.*: すべてのカタログ、データベース、Table
- catalog_name.*.*: 指定されたカタログ内のすべてのデータベースとTableを指定
- catalog_name.db.*: 指定されたデータベース内のすべてのTableを指定
- catalog_name.db.tbl: 指定されたデータベース内の特定のTableを指定

**3. `<resource_name>`**

リソース名を指定します。`%`（任意の文字列にマッチ）と`_`（任意の単一文字にマッチ）のワイルドカード文字をサポートします。

**4. `<workload_group_name>`**

ワークロードグループ名を指定します。`%`（任意の文字列にマッチ）と`_`（任意の単一文字にマッチ）のワイルドカード文字をサポートします。

**5. `<compute_group_name>`**

コンピュートグループ名を指定します。`%`（任意の文字列にマッチ）と`_`（任意の単一文字にマッチ）のワイルドカード文字をサポートします。

**6. `<storage_vault_name>`**

ストレージボルト名を指定します。`%`（任意の文字列にマッチ）と`_`（任意の単一文字にマッチ）のワイルドカード文字をサポートします。

**7. `<user_identity>`**

ユーザーIDを指定します。ユーザーはCREate USER文で作成されたユーザーである必要があります。ユーザーIDのホスト部分はドメイン名にすることができ、ドメイン名の場合は権限取り消し時間に1分の遅延が生じる可能性があります。

**8. `<role_name>`**

ロール名を指定します。ロールは存在している必要があります。

**9. `<role_list>`**

取り消すロールのカンマ区切りリスト。指定されたすべてのロールが存在している必要があります。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | ユーザーまたはロール   | GRANT_PRIV権限を持つユーザーまたはロールのみがGRANT操作を実行できます。 |

## 例

- 特定のデータベースのSELECT権限をユーザーから取り消す：

   ```sql
   REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';
   ```
- ユーザーから特定のリソースに対する使用権限を取り消す:

   ```sql
   REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';
   ```
- ユーザーからロールを取り消す:

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
- ユーザーからすべてのcompute groupsの使用権限を取り消す：

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM 'jack'@'%';
   ```
- roleからcompute groupの使用権限を取り消す：

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM ROLE 'my_role';
   ```
- ユーザーからすべてのstorage vaultの使用権限を取り消す：

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM 'jack'@'%';
   ```
- ロールからストレージボルトの使用権限を取り消す：

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM ROLE 'my_role';
   ```
- ロールからすべてのストレージvaultの使用権限を取り消す：

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT '%' FROM 'jack'@'%';
   ```
