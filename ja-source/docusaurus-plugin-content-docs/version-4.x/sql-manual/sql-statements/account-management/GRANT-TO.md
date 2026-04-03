---
{
  "title": "GRANT TO",
  "description": "GRANT コマンドは以下の用途で使用されます：",
  "language": "ja"
}
---
## 説明

GRANTコマンドは以下の用途で使用されます：

1. 指定された権限をユーザーまたはロールに付与する。
2. 指定されたロールをユーザーに付与する。

**関連コマンド**

- [REVOKE FROM](./REVOKE-FROM.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 構文

**指定された権限をユーザーまたはロールに付与する**

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
## 必要なパラメータ

**1. `<privilege_list>`**

付与する権限のカンマ区切りリスト。現在サポートされている権限は以下の通りです：

- NODE_PRIV: ノードのオンライン・オフライン操作を含むクラスターノード操作権限。
- ADMIN_PRIV: NODE_PRIV を除くすべての権限。
- GRANT_PRIV: ユーザー、ロールの作成と削除、認可と取り消し、パスワード設定などを含む操作権限のための権限。
- SELECT_PRIV: 指定されたデータベースまたはTableの読み取り権限。
- LOAD_PRIV: 指定されたデータベースまたはTableのインポート権限。
- ALTER_PRIV: 指定されたデータベースまたはTableのスキーマ変更権限。
- CREATE_PRIV: 指定されたデータベースまたはTableの作成権限。
- DROP_PRIV: 指定されたデータベースまたはTableの削除権限。
- USAGE_PRIV: 指定されたリソースと Workload Group 権限へのアクセス。
- SHOW_VIEW_PRIV: ビュー作成文を表示する権限。

レガシー権限の変換：

- ALL と READ_WRITE は次のように変換されます：SELECT_PRIV、LOAD_PRIV、ALTER_PRIV、CREATE_PRIV、DROP_PRIV。
- READ_ONLY は SELECT_PRIV に変換されます。

**2. `<priv_level>`**

以下の4つの形式をサポートします：

- ..*: 権限はすべてのカタログとその中のすべてのデータベースとTableに適用できます。
- catalog_name..: 権限は指定されたカタログ内のすべてのデータベースとTableに適用できます。
- catalog_name.db.*: 権限は指定されたデータベース配下のすべてのTableに適用できます。
- catalog_name.db.tbl: 権限は指定されたデータベース配下の指定されたTableに適用できます。

**3. `<resource_name>`**

リソース名を指定します。すべてのリソースにマッチする `%` と `*` をサポートしますが、res* などのワイルドカードはサポートしません。

**4. `<workload_group_name>`**

ワークロードグループ名を指定します。すべてのワークロードグループにマッチする `%` と `*` をサポートしますが、ワイルドカードはサポートしません。

**5. `<compute_group_name>`**

コンピュートグループ名を指定します。すべてのコンピュートグループにマッチする `%` と `*` をサポートしますが、ワイルドカードはサポートしません。

**6. `<storage_vault_name>`**

ストレージボルト名を指定します。すべてのストレージボルトにマッチする `%` と `*` をサポートしますが、ワイルドカードはサポートしません。

**7. `<user_identity>`**

権限を受け取るユーザーを指定します。CREATE USER で作成された user_identity である必要があります。user_identity のホストはドメイン名にできます。ドメイン名の場合、権限の有効時間が約1分遅れる場合があります。

**8. `<role_name>`**

権限を受け取るロールを指定します。指定されたロールが存在しない場合、自動的に作成されます。

**9. `<role_list>`**

割り当てるロールのカンマ区切りリスト。指定されたロールは存在している必要があります。

## アクセス制御要件

この SQL コマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 注記                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User または Role   | GRANT_PRIV 権限を持つユーザーまたはロールのみが GRANT 操作を実行できます。 |

## 例

- すべてのカタログとデータベースとTableへの権限をユーザーに付与：

    ```sql
    GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
    ```
指定されたデータベースTableに対する権限をユーザーに付与する：

    ```sql
    GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1  TO 'jack'@'192.8.%';
    ```
- 指定されたデータベースTableに対する権限をロールに付与する：

    ```sql
    GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
    ```
- すべてのリソースへのアクセスをユーザーに付与する:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
    ```
- 指定されたリソースを使用するためのユーザー権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
    ```
指定されたリソースへのアクセス権をロールに付与する：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
    ```
指定されたロールをユーザーに付与する:

    ```sql
    GRANT 'role1','role2' TO 'jack'@'%';
    ```
指定されたワークロードグループ 'g1' をユーザー jack に付与する:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
    ```
- ユーザー jack に付与されたすべてのワークロードグループをマッチ:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
    ```
ワークロードグループ 'g1' をロール my_role に付与する：

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';
    ```
- db1 配下の view1 の作成文を jack が参照できるようにする:

    ```sql
    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';
    ```
- 指定されたコンピュートグループを使用するユーザー権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
    ```
- 指定されたcompute groupを使用するためのロール権限を付与する:

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
    ```
- すべてのcompute groupsを使用するユーザー権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP '*' TO 'jack'@'%';
    ```
- 指定されたストレージボルトを使用するためのユーザー権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
    ```
- 指定されたストレージボルトを使用するためのロール権限を付与する：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
    ```
- 全てのストレージボルトを使用するためのユーザー権限を付与する:

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT '*' TO 'jack'@'%';
    ```
