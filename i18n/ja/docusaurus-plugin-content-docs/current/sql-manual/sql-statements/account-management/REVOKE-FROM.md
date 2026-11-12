---
{
    "title": "REVOKE FROM",
    "language": "ja",
    "description": "REVOKE コマンドには次の機能があります。"
}
---

## 説明 {#description}

REVOKE コマンドには次の機能があります。

1. ユーザーまたはロールに付与された指定の権限を取り消します。
2. ユーザーに以前付与された指定のロールを取り消します。

**関連コマンド**

- [GRANT TO](./GRANT-TO.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 構文 {#syntax}

**ユーザーまたはロールに付与された指定の権限を取り消す**

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

**ユーザーに以前付与された指定のロールを取り消す**

```sql
REVOKE <role_list> FROM <user_identity>
```

## 必須パラメータ {#required-parameters}

**1. `<privilege_list>`**

取り消す権限をカンマで区切って指定します。指定できる権限は次のとおりです。

- NODE_PRIV: クラスターノードの操作権限
- ADMIN_PRIV: 管理者権限
- GRANT_PRIV: 権限の付与権限
- SELECT_PRIV: クエリ権限
- LOAD_PRIV: データロード権限
- ALTER_PRIV: 変更権限
- CREATE_PRIV: 作成権限
- DROP_PRIV: 削除権限
- USAGE_PRIV: 使用権限
- SHOW_VIEW_PRIV: ビュー定義の表示権限

**2. `<priv_level>`**

権限の適用範囲を指定します。指定できる形式は次のとおりです。

- *.*.*: すべてのカタログ、データベース、テーブル
- catalog_name.*.*: 指定したカタログ内のすべてのデータベースとテーブル
- catalog_name.db.*: 指定したデータベース内のすべてのテーブル
- catalog_name.db.tbl: 指定したデータベース内の特定のテーブル

**3. `<resource_name>`**

リソース名を指定します。ワイルドカード文字として、`%`（任意の文字列に一致）と `_`（任意の一文字に一致）を使用できます。

**4. `<workload_group_name>`**

ワークロードグループ名を指定します。ワイルドカード文字として、`%`（任意の文字列に一致）と `_`（任意の一文字に一致）を使用できます。

**5. `<compute_group_name>`**

コンピュートグループ名を指定します。ワイルドカード文字として、`%`（任意の文字列に一致）と `_`（任意の一文字に一致）を使用できます。

**6. `<storage_vault_name>`**

ストレージボールト名を指定します。ワイルドカード文字として、`%`（任意の文字列に一致）と `_`（任意の一文字に一致）を使用できます。


**7. `<user_identity>`**

ユーザー識別子を指定します。対象のユーザーは CREATE USER 文で作成されている必要があります。ユーザー識別子のホスト部分にはドメイン名を指定できます。ドメイン名を使用する場合、権限の取り消しが反映されるまでに 1 分程度かかることがあります。

**8. `<role_name>`**

ロール名を指定します。ロールは存在している必要があります。

**9. `<role_list>`**

取り消すロールをカンマで区切って指定します。指定するロールはすべて存在している必要があります。

4.1.5 以降、権限の対象名を構成できる要素は最大三つです。`db`、`db.table`、`catalog.db.table`、およびそれぞれに対応するワイルドカード形式を指定できます。三つを超える要素を指定すると、余分な接頭部分が黙って無視されるのではなく、エラーになります。

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | ユーザーまたはロール   | GRANT_PRIV 権限を持つユーザーまたはロールのみが REVOKE 操作を実行できます。 |

4.1.5 以降、`ADMIN` 以外のユーザーが列の権限を付与または取り消すには、既存の `GRANT` 権限に加え、対応するテーブルの権限、または指定したすべての列に対する対応する権限が必要です。`GRANT` 権限だけでは、自分が持っていない列の権限を付与または取り消すことはできません。

## 例 {#examples}

準備として、以下の例で権限やロールを取り消す対象となるユーザー、ロール、データベース、ワークロードグループを作成し、各 `REVOKE` の前提となる `GRANT` を実行します（付与されていない権限は取り消せません）。

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

- 特定のリソースに対する使用権限をユーザーから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';
   ```

- ユーザーに付与されたロールを取り消します。

   ```sql
   REVOKE 'role1','role2' FROM 'jack'@'192.%';
   ```

- 特定のワークロードグループに対する使用権限をユーザーから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM 'jack'@'%';
   ```

- すべてのワークロードグループに対する使用権限をユーザーから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP '%' FROM 'jack'@'%';
   ```

- すべてのコンピュートグループに対する使用権限をユーザーから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM 'jack'@'%';
   ```

- コンピュートグループに対する使用権限をロールから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM ROLE 'my_role';
   ```

- すべてのストレージボールトに対する使用権限をユーザーから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM 'jack'@'%';
   ```

- ストレージボールトに対する使用権限をロールから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM ROLE 'my_role';
   ```

- すべてのストレージボールトに対する使用権限をロールから取り消します。

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT '%' FROM 'jack'@'%';
   ```
