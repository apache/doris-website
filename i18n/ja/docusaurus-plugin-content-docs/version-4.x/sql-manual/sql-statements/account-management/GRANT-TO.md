---
{
    "title": "GRANT TO",
    "language": "ja",
    "description": "GRANT コマンドは、次の操作に使用します。"
}
---

## 説明

GRANT コマンドは、次の操作に使用します。

1. 指定した権限をユーザーまたはロールに付与します。
2. 指定したロールをユーザーに付与します。

**関連コマンド**

- [REVOKE FROM](./REVOKE-FROM.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 構文

**指定した権限をユーザーまたはロールに付与**

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

**指定したロールをユーザーに付与**

```sql
GRANT <role_list> TO <user_identity> 
```

## 必須パラメータ

**1. `<privilege_list>`**

付与する権限をカンマ区切りで指定します。現在は次の権限をサポートします。

- NODE_PRIV: ノードのオンライン・オフライン操作を含む、クラスターノードの操作権限。
- ADMIN_PRIV: NODE_PRIV を除くすべての権限。
- GRANT_PRIV: ユーザーやロールの作成・削除、権限の付与・取り消し、パスワード設定などを行う権限。
- SELECT_PRIV: 指定したデータベースまたはテーブルに対する読み取り権限。
- LOAD_PRIV: 指定したデータベースまたはテーブルへのインポート権限。
- ALTER_PRIV: 指定したデータベースまたはテーブルのスキーマ変更権限。
- CREATE_PRIV: 指定したデータベースまたはテーブルの作成権限。
- DROP_PRIV: 指定したデータベースまたはテーブルの削除権限。
- USAGE_PRIV: 指定したリソースとワークロードグループの使用権限。
- SHOW_VIEW_PRIV: ビューの作成文を表示する権限。

従来の権限の変換:

- ALL と READ_WRITE は SELECT_PRIV、LOAD_PRIV、ALTER_PRIV、CREATE_PRIV、DROP_PRIV に変換されます。
- READ_ONLY は SELECT_PRIV に変換されます。

**2. `<priv_level>`**

次の四つの形式をサポートします。

- ..*: すべてのカタログ、およびその中のすべてのデータベースとテーブルに権限を適用できます。
- catalog_name..: 指定したカタログ内のすべてのデータベースとテーブルに権限を適用できます。
- catalog_name.db.*: 指定したデータベース内のすべてのテーブルに権限を適用できます。
- catalog_name.db.tbl: 指定したデータベース内の指定したテーブルに権限を適用できます。

**3. `<resource_name>`**

リソース名を指定します。`%` と `*` を使用してすべてのリソースに一致させることはできますが、res* のようなワイルドカードには対応しません。

**4. `<workload_group_name>`**

ワークロードグループ名を指定します。`%` と `*` ですべてのワークロードグループに一致させることはできますが、ワイルドカードには対応しません。

**5. `<compute_group_name>`**

コンピュートグループ名を指定します。`%` と `*` ですべてのコンピュートグループに一致させることはできますが、ワイルドカードには対応しません。

**6. `<storage_vault_name>`**

ストレージボールト名を指定します。`%` と `*` ですべてのストレージボールトに一致させることはできますが、ワイルドカードには対応しません。

**7. `<user_identity>`**

権限の付与先ユーザーを指定します。CREATE USER で作成した user_identity である必要があります。user_identity の host にはドメイン名を指定できます。その場合、権限が有効になるまで約 1 分遅れることがあります。

**8. `<role_name>`**

権限の付与先ロールを指定します。指定したロールが存在しない場合は自動的に作成されます。

**9. `<role_list>`**

割り当てるロールをカンマ区切りで指定します。指定するロールは存在する必要があります。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role   | REVOKE 操作を実行できるのは GRANT_PRIV 権限を持つユーザーまたはロールのみです。 |

## 例

- すべてのカタログ、データベース、テーブルに対する権限をユーザーに付与します。

    ```sql
    GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
    ```

- 指定したデータベーステーブルに対する権限をユーザーに付与します。

    ```sql
    GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1  TO 'jack'@'192.8.%';
    ```

- 指定したデータベーステーブルに対する権限をロールに付与します。

    ```sql
    GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
    ```

- すべてのリソースへのアクセス権をユーザーに付与します。

    ```sql
    GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
    ```

- 指定したリソースの使用権限をユーザーに付与します。

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
    ```

- 指定したリソースへのアクセス権をロールに付与します。

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
    ```

- 指定したロールをユーザーに付与します。

    ```sql
    GRANT 'role1','role2' TO 'jack'@'%';
    ```

- 指定したワークロードグループ 'g1' をユーザー jack に付与します。

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
    ```

- すべてのワークロードグループに一致する権限をユーザー jack に付与します。

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
    ```

- ワークロードグループ 'g1' をロール my_role に付与します。

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';
    ```

- jack に db1 の view1 の作成文を表示する権限を付与します。

    ```sql
    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';
    ```

- 指定したコンピュートグループの使用権限をユーザーに付与します。

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
    ```

- 指定したコンピュートグループの使用権限をロールに付与します。

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
    ```

- すべてのコンピュートグループの使用権限をユーザーに付与します。

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP '*' TO 'jack'@'%';
    ```

- 指定したストレージボールトの使用権限をユーザーに付与します。

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
    ```

- 指定したストレージボールトの使用権限をロールに付与します。

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
    ```

- すべてのストレージボールトの使用権限をユーザーに付与します。

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT '*' TO 'jack'@'%';
    ```