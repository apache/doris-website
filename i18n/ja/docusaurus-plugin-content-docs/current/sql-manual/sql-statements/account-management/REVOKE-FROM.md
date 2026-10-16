---
{
    "title": "REVOKE FROM",
    "language": "ja",
    "description": "REVOKE コマンドは、次の操作に使用します。"
}
---

## 説明

REVOKE コマンドは、次の操作に使用します。

1. ユーザーまたはロールから指定した権限を取り消します。
2. 以前ユーザーに付与した指定のロールを取り消します。

**関連コマンド**

- [GRANT TO](./GRANT-TO.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 構文

**ユーザーまたはロールから指定した権限を取り消す**

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

**ユーザーに付与した指定のロールを取り消す**

```sql
REVOKE <role_list> FROM <user_identity> 
```

## 必須パラメータ

**1. `<privilege_list>`**

取り消す権限をカンマ区切りで指定します。次の権限をサポートします。

- NODE_PRIV: クラスターノードの操作権限
- ADMIN_PRIV: 管理者権限
- GRANT_PRIV: 権限付与の権限
- SELECT_PRIV: クエリ権限
- LOAD_PRIV: データインポート権限
- ALTER_PRIV: 変更権限
- CREATE_PRIV: 作成権限
- DROP_PRIV: 削除権限
- USAGE_PRIV: 使用権限
- SHOW_VIEW_PRIV: ビュー定義の表示権限

**2. `<priv_level>`**

権限の適用範囲を指定します。次の形式をサポートします。

- *.*.*: すべてのカタログ、データベース、テーブル
- catalog_name.*.*: 指定したカタログ内のすべてのデータベースとテーブル
- catalog_name.db.*: 指定したデータベース内のすべてのテーブル
- catalog_name.db.tbl: 指定したデータベース内の指定したテーブル

**3. `<resource_name>`**

リソース名を指定します。`%`（任意の文字列に一致）と `_`（任意の一文字に一致）のワイルドカードを使用できます。

**4. `<workload_group_name>`**

ワークロードグループ名を指定します。`%`（任意の文字列に一致）と `_`（任意の一文字に一致）のワイルドカードを使用できます。

**5. `<compute_group_name>`**

コンピュートグループ名を指定します。`%`（任意の文字列に一致）と `_`（任意の一文字に一致）のワイルドカードを使用できます。

**6. `<storage_vault_name>`**

ストレージボールト名を指定します。`%`（任意の文字列に一致）と `_`（任意の一文字に一致）のワイルドカードを使用できます。


**7. `<user_identity>`**

ユーザー識別子を指定します。CREATE USER 文で作成したユーザーである必要があります。host 部分にはドメイン名を指定できます。その場合、権限の取り消しが反映されるまで 1 分ほど遅れることがあります。

**8. `<role_name>`**

ロール名を指定します。ロールは存在する必要があります。

**9. `<role_list>`**

取り消すロールをカンマ区切りで指定します。指定するロールはすべて存在する必要があります。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role   | REVOKE 操作を実行できるのは GRANT_PRIV 権限を持つユーザーまたはロールのみです。 |

## 例

準備として、以降の例で権限を取り消す対象のユーザー、ロール、データベース、ワークロードグループを作成し、前提となる `GRANT` を実行し、各 `REVOKE` が意味を持つようにします（付与されていない権限は取り消せません）。

```sql
CREATE DATABASE db1;
CREATE USER jack@'192.%' IDENTIFIED BY 'jack_pwd';
CREATE USER jack@'%' IDENTIFIED BY 'jack_pwd';
CREATE ROLE role1;
CREATE ROLE role2;
CREATE ROLE my_role;
CREATE WORKLOAD GROUP g1 PROPERTIES("max_cpu_percent"="10");

GRANT SELECT_PRIV ON db1.* TO 'jack'@'192.%';
GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'192.%';
GRANT 'role1','role2' TO 'jack'@'192.%';
GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
GRANT USAGE_PRIV ON STORAGE VAULT '%' TO 'jack'@'%';
```

- 特定のデータベースに対する SELECT 権限をユーザーから取り消します。

   ```sql
   REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';
   ```

- 特定のリソースの使用権限をユーザーから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';
   ```

- ユーザーからロールを取り消します。

   ```sql
   REVOKE 'role1','role2' FROM 'jack'@'192.%';
   ```

- 特定のワークロードグループの使用権限をユーザーから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM 'jack'@'%';
   ```

- すべてのワークロードグループの使用権限をユーザーから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP '%' FROM 'jack'@'%';
   ```

- すべてのコンピュートグループの使用権限をユーザーから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM 'jack'@'%';
   ```

- コンピュートグループの使用権限をロールから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM ROLE 'my_role';
   ```

- すべてのストレージボールトの使用権限をユーザーから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM 'jack'@'%';
   ```

- ストレージボールトの使用権限をロールから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM ROLE 'my_role';
   ```

- すべてのストレージボールトの使用権限をロールから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT '%' FROM 'jack'@'%';
   ```
