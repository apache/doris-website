---
{
  "title": "GRANT TO",
  "language": "ja",
  "description": "GRANT コマンドは以下の用途で使用されます："
}
---
## 説明

GRANTコマンドは以下の用途で使用されます：

1. ユーザーまたはロールに指定された権限を付与する
2. ユーザーに指定されたロールを付与する

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
**ユーザーに指定されたロールを付与する**

```sql
GRANT <role_list> TO <user_identity> 
```
## 必須パラメータ

**1. `<privilege_list>`**

付与される権限のカンマ区切りリスト。現在サポートされている権限には以下が含まれます：

- NODE_PRIV: クラスターノード操作権限（ノードのオンライン・オフライン操作を含む）。
- ADMIN_PRIV: NODE_PRIV以外のすべての権限。
- GRANT_PRIV: 操作権限に対する権限（ユーザー、ロールの作成・削除、認可・取り消し、パスワード設定など）。
- SELECT_PRIV: 指定されたデータベースまたはテーブルの読み取り権限。
- LOAD_PRIV: 指定されたデータベースまたはテーブルのインポート権限。
- ALTER_PRIV: 指定されたデータベースまたはテーブルのスキーマ変更権限。
- CREATE_PRIV: 指定されたデータベースまたはテーブルの作成権限。
- DROP_PRIV: 指定されたデータベースまたはテーブルの削除権限。
- USAGE_PRIV: 指定されたリソースおよびWorkload Group権限へのアクセス。
- SHOW_VIEW_PRIV: ビュー作成ステートメントを表示する権限。

従来の権限変換：

- ALLおよびREAD_WRITEは次のように変換されます：SELECT_PRIV、LOAD_PRIV、ALTER_PRIV、CREATE_PRIV、DROP_PRIV。
- READ_ONLYはSELECT_PRIVに変換されます。

**2. `<priv_level>`**

以下の4つの形式をサポートします：

- ..*: すべてのカタログおよびその中のすべてのデータベースとテーブルに権限を適用できます。
- catalog_name..: 指定されたカタログ内のすべてのデータベースとテーブルに権限を適用できます。
- catalog_name.db.*: 指定されたデータベース内のすべてのテーブルに権限を適用できます。
- catalog_name.db.tbl: 指定されたデータベース内の指定されたテーブルに権限を適用できます。

**3. `<resource_name>`**

リソース名を指定します。すべてのリソースに一致する`%`と`*`をサポートしますが、res*などのワイルドカードはサポートしません。

**4. `<workload_group_name>`**

Workload Group名を指定します。すべてのWorkload Groupに一致する`%`と`*`をサポートしますが、ワイルドカードはサポートしません。

**5. `<compute_group_name>`**

Compute Group名を指定します。すべてのCompute Groupに一致する`%`と`*`をサポートしますが、ワイルドカードはサポートしません。

**6. `<storage_vault_name>`**

Storage Vault名を指定します。すべてのStorage Vaultに一致する`%`と`*`をサポートしますが、ワイルドカードはサポートしません。

**7. `<user_identity>`**

権限を受け取るユーザーを指定します。CREATE USERで作成されたuser_identityである必要があります。user_identity内のホストはドメイン名でも構いません。ドメイン名の場合、権限の有効化時間が約1分遅延する場合があります。

**8. `<role_name>`**

権限を受け取るロールを指定します。指定されたロールが存在しない場合、自動的に作成されます。

**9. `<role_list>`**

割り当てられるロールのカンマ区切りリスト。指定されたロールは存在している必要があります。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | ユーザーまたはロール   | GRANT_PRIV権限を持つユーザーまたはロールのみがGRANT操作を実行できます。 |

## 例

- すべてのカタログ、データベース、テーブルの権限をユーザーに付与する：

    ```sql
    GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
    ```
- 指定されたデータベーステーブルに対する権限をユーザーに付与します:

    ```sql
    GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1  TO 'jack'@'192.8.%';
    ```
- 指定されたデータベーステーブルに対する権限をロールに付与する：

    ```sql
    GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
    ```
- すべてのリソースへのアクセスをユーザーに許可する：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
    ```
- 指定されたリソースを使用する権限をユーザーに付与する:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
    ```
- 指定されたリソースへのアクセスをロールに付与する：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
    ```
- 指定されたロールをユーザーに付与する:

    ```sql
    GRANT 'role1','role2' TO 'jack'@'%';
    ```
- 指定されたワークロードグループ'g1'をユーザーjackに付与する:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
    ```
- ユーザー jack に付与されたすべてのワークロードグループと一致:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
    ```
- ワークロードグループ 'g1' をロール my_role に付与する:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';
    ```
- jack に db1 配下の view1 の作成文の表示を許可する:

    ```sql
    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';
    ```
- 指定されたコンピュートグループを使用するユーザー権限を付与する:

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
    ```
- 指定されたコンピュートグループを使用するロール権限を付与する:

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
    ```
- ユーザーにすべてのcompute groupsの使用許可を付与する:

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP '*' TO 'jack'@'%';
    ```
- 指定されたストレージボールトを使用するためのユーザー権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
    ```
- 指定されたストレージボルトを使用するためのロール権限を付与する:

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
    ```
- すべてのストレージボールトを使用するユーザー権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT '*' TO 'jack'@'%';
    ```
