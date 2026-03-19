---
{
  "title": "GRANT TO",
  "description": "GRANT コマンドは次の用途に使用されます：",
  "language": "ja"
}
---
## 説明

GRANTコマンドは以下の目的で使用されます：

1. ユーザーまたはロールに指定された権限を付与する。
2. ユーザーに指定されたロールを付与する。

**関連コマンド**

- [REVOKE FROM](./REVOKE-FROM.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 構文

**ユーザーまたはロールに指定された権限を付与する**

```sql
GRANT <privilege_list> 
ON { <priv_level> 
    | RESOURCE <resource_name> 
    | WORKLOAD GROUP <workload_group_name> 
    | COMPUTE GROUP <compute_group_name> 
    | STORAGE VAULT <storage_vault_name>
   } 
TO { <user_identity> | ROLE <role_name> }
```
**ユーザーに指定されたroleを付与する**

```sql
GRANT <role_list> TO <user_identity> 
```
## 必須パラメータ

**1. `<privilege_list>`**

付与する権限のカンマ区切りリスト。現在サポートされている権限は以下の通りです：

- NODE_PRIV: クラスターノード操作権限。ノードのオンライン・オフライン操作を含みます。
- ADMIN_PRIV: NODE_PRIVを除くすべての権限。
- GRANT_PRIV: 操作権限に対する権限。ユーザー・ロールの作成と削除、認可と取り消し、パスワード設定などを含みます。
- SELECT_PRIV: 指定されたデータベースまたはTableに対する読み取り権限。
- LOAD_PRIV: 指定されたデータベースまたはTableに対するインポート権限。
- ALTER_PRIV: 指定されたデータベースまたはTableに対するスキーマ変更権限。
- CREATE_PRIV: 指定されたデータベースまたはTableに対する作成権限。
- DROP_PRIV: 指定されたデータベースまたはTableに対するドロップ権限。
- USAGE_PRIV: 指定されたリソースとWorkload Group権限へのアクセス。
- SHOW_VIEW_PRIV: ビュー作成文を表示する権限。

レガシー権限の変換：

- ALLとREAD_WRITEは次のように変換されます：SELECT_PRIV、LOAD_PRIV、ALTER_PRIV、CREATE_PRIV、DROP_PRIV。
- READ_ONLYはSELECT_PRIVに変換されます。

**2. `<priv_level>`**

以下の4つの形式をサポートします：

- ..*: すべてのカタログとその中のすべてのデータベースとTableに権限を適用できます。
- catalog_name..: 指定されたカタログ内のすべてのデータベースとTableに権限を適用できます。
- catalog_name.db.*: 指定されたデータベース下のすべてのTableに権限を適用できます。
- catalog_name.db.tbl: 指定されたデータベース下の指定されたTableに権限を適用できます。

**3. `<resource_name>`**

リソース名を指定します。すべてのリソースにマッチする`%`と`*`をサポートしますが、res*などのワイルドカードはサポートしません。

**4. `<workload_group_name>`**

workload group名を指定します。すべてのworkload groupにマッチする`%`と`*`をサポートしますが、ワイルドカードはサポートしません。

**5. `<compute_group_name>`**

compute group名を指定します。すべてのcompute groupにマッチする`%`と`*`をサポートしますが、ワイルドカードはサポートしません。

**6. `<storage_vault_name>`**

storage vault名を指定します。すべてのstorage vaultにマッチする`%`と`*`をサポートしますが、ワイルドカードはサポートしません。

**7. `<user_identity>`**

権限を受け取るユーザーを指定します。CREATE USERで作成されたuser_identityである必要があります。user_identityのホストはドメイン名でも構いません。ドメイン名の場合、権限の有効時間が約1分遅れる可能性があります。

**8. `<role_name>`**

権限を受け取るロールを指定します。指定されたロールが存在しない場合、自動的に作成されます。

**9. `<role_list>`**

割り当てるロールのカンマ区切りリスト。指定されたロールは存在している必要があります。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 注意事項                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | UserまたはRole   | GRANT_PRIV権限を持つユーザーまたはロールのみがGRANT操作を実行できます。 |

## 例

- ユーザーにすべてのカタログとデータベースとTableへの権限を付与する：

    ```sql
    GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
    ```
- 指定されたデータベースTableに対する権限をユーザーに付与する:

    ```sql
    GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1  TO 'jack'@'192.8.%';
    ```
- 指定されたデータベースTableに対する権限をロールに付与する:

    ```sql
    GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
    ```
- ユーザーに全てのリソースへのアクセスを許可する:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
    ```
- 指定されたリソースを使用する権限をユーザーに付与する:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
    ```
指定されたリソースへのアクセスをロールに付与する：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
    ```
- 指定されたロールをユーザーに付与する:

    ```sql
    GRANT 'role1','role2' TO 'jack'@'%';
    ```
指定されたワークロードグループ'g1'をユーザーjackに付与する：

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
    ```
- ユーザー jack に付与されたすべてのワークロードグループとマッチします:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
    ```
ワークロードグループ 'g1' をロール my_role に付与する：

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';
    ```
- jack に db1 配下の view1 の作成文を表示する権限を許可する:

    ```sql
    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';
    ```
- 指定されたcompute groupを使用するためのユーザー権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
    ```
- 指定されたcompute groupを使用するためのロール権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
    ```
- 全てのコンピュートグループを使用するためのユーザー権限を付与する:

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP '*' TO 'jack'@'%';
    ```
- 指定されたストレージボールトを使用するためのユーザー権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
    ```
- 指定されたストレージボルトを使用するロール権限を付与する:

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
    ```
- 全てのストレージボルトを使用するユーザー権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT '*' TO 'jack'@'%';
    ```
