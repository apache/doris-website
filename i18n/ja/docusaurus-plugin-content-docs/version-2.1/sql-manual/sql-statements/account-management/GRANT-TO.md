---
{
  "title": "GRANT TO",
  "language": "ja",
  "description": "GRANTコマンドは以下の用途で使用されます："
}
---
## 説明

GRANTコマンドは以下の用途で使用されます：

1. ユーザーまたはロールに指定された権限を付与する。
2. ユーザーに指定されたロールを付与する。

**関連コマンド**

- [REVOKE FROM](./REVOKE-FROM.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)

## 構文

**ユーザーまたはロールに指定された権限を付与**

```sql
GRANT <privilege_list> 
ON { <priv_level> 
    | RESOURCE <resource_name> 
    | WORKLOAD GROUP <workload_group_name>
   } 
TO { <user_identity> | ROLE <role_name> }
```
**ユーザーに指定したロールを付与する**

```sql
GRANT <role_list> TO <user_identity> 
```
## 必須パラメータ

**1. `<privilege_list>`**

付与される権限のカンマ区切りリスト。現在サポートされている権限は以下の通りです：

- NODE_PRIV: クラスターノード操作権限、ノードのオンライン・オフライン操作を含む。
- ADMIN_PRIV: NODE_PRIV以外のすべての権限。
- GRANT_PRIV: 操作権限のための権限、ユーザー・ロールの作成・削除、認可・取消し、パスワード設定などを含む。
- SELECT_PRIV: 指定されたデータベースまたはテーブルに対する読み取り権限。
- LOAD_PRIV: 指定されたデータベースまたはテーブルに対するインポート権限。
- ALTER_PRIV: 指定されたデータベースまたはテーブルに対するスキーマ変更権限。
- CREATE_PRIV: 指定されたデータベースまたはテーブルに対する作成権限。
- DROP_PRIV: 指定されたデータベースまたはテーブルに対するドロップ権限。
- USAGE_PRIV: 指定されたリソースおよびWorkload Group権限へのアクセス。
- SHOW_VIEW_PRIV: ビューの作成文を表示する権限。

レガシー権限の変換：

- ALLおよびREAD_WRITEは次に変換されます：SELECT_PRIV, LOAD_PRIV, ALTER_PRIV, CREATE_PRIV, DROP_PRIV。
- READ_ONLYはSELECT_PRIVに変換されます。

**2. `<priv_level>`**

以下の4つの形式をサポートします：

- ..*: 権限はすべてのカタログとその中のすべてのデータベースとテーブルに適用できます。
- catalog_name..: 権限は指定されたカタログ内のすべてのデータベースとテーブルに適用できます。
- catalog_name.db.*: 権限は指定されたデータベース内のすべてのテーブルに適用できます。
- catalog_name.db.tbl: 権限は指定されたデータベース内の指定されたテーブルに適用できます。

**3. `<resource_name>`**

リソース名を指定し、すべてのリソースにマッチする`%`と`*`をサポートしますが、res*などのワイルドカードはサポートしません。

**4. `<workload_group_name>`**

workload group名を指定し、すべてのworkload groupにマッチする`%`と`*`をサポートしますが、ワイルドカードはサポートしません。

**5. `<user_identity>`**

権限を受け取るユーザーを指定します。CREATE USERで作成されたuser_identityである必要があります。user_identity内のホストはドメイン名でも構いません。ドメイン名の場合、権限の有効時間は約1分遅延する可能性があります。

**6. `<role_name>`**

権限を受け取るロールを指定します。指定されたロールが存在しない場合、自動的に作成されます。

**7. `<role_list>`**

割り当てられるロールのカンマ区切りリスト。指定されたロールは存在している必要があります。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | ユーザーまたはロール   | GRANT_PRIV権限を持つユーザーまたはロールのみがGRANT操作を実行できます。 |

## 例

- すべてのカタログとデータベースとテーブルへの権限をユーザーに付与：

    ```sql
    GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
    ```
- 指定されたデータベーステーブルに対する権限をユーザーに付与する：

    ```sql
    GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1  TO 'jack'@'192.8.%';
    ```
- 指定されたデータベーステーブルに対する権限をロールに付与する:

    ```sql
    GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
    ```
- すべてのリソースへのアクセスをユーザーに許可する:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
    ```
- 指定されたリソースを使用する権限をユーザーに付与する:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
    ```
- 指定されたリソースへのアクセス権をロールに付与する：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
    ```
- 指定されたロールをユーザーに付与する:

    ```sql
    GRANT 'role1','role2' TO 'jack'@'%';
    ```
- 指定されたワークロードグループ'g1'をユーザーjackに付与する：

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
    ```
- ユーザーjackに付与されたすべてのワークロードグループにマッチ:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
    ```
- workload group 'g1'をロールmy_roleに付与する:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';
    ```
- jack に db1 配下の view1 の作成文の表示を許可する:

    ```sql
    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';
    ```
