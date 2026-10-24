---
{
    "title": "GRANT TO",
    "language": "ja",
    "description": "GRANT コマンドは、次の操作に使用します。"
}
---

## 説明 {#description}

GRANT コマンドは、次の操作に使用します。

1. ユーザーまたはロールに指定した権限を付与する。
2. ユーザーに指定したロールを付与する。

**関連コマンド**

- [REVOKE FROM](./REVOKE-FROM.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 構文 {#syntax}

**ユーザーまたはロールに指定した権限を付与する**

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

**ユーザーに指定したロールを付与する**

```sql
GRANT <role_list> TO <user_identity>
```

## 必須パラメータ {#required-parameters}

**1. `<privilege_list>`**

付与する権限をカンマで区切ったリストです。現在、次の権限がサポートされています。

- NODE_PRIV: ノードのオンライン化とオフライン化を含む、クラスターノードの操作権限。
- ADMIN_PRIV: NODE_PRIV を除くすべての権限。
- GRANT_PRIV: ユーザーやロールの作成と削除、権限の付与と取り消し、パスワードの設定など、権限を管理するための権限。
- SELECT_PRIV: 指定したデータベースまたはテーブルの読み取り権限。
- LOAD_PRIV: 指定したデータベースまたはテーブルへのデータロード権限。
- ALTER_PRIV: 指定したデータベースまたはテーブルのスキーマ変更権限。
- CREATE_PRIV: 指定したデータベースまたはテーブルの作成権限。
- DROP_PRIV: 指定したデータベースまたはテーブルの削除権限。
- USAGE_PRIV: 指定したリソースへのアクセス権限および Workload Group の使用権限。
- SHOW_VIEW_PRIV: ビューの作成文を表示する権限。

旧形式の権限は次のように変換されます。

- ALL と READ_WRITE は、SELECT_PRIV、LOAD_PRIV、ALTER_PRIV、CREATE_PRIV、DROP_PRIV に変換されます。
- READ_ONLY は SELECT_PRIV に変換されます。

**2. `<priv_level>`**

次の四つの形式をサポートします。

- ..*: すべてのカタログと、その中のすべてのデータベースおよびテーブルに権限を適用できます。
- catalog_name..: 指定したカタログ内のすべてのデータベースおよびテーブルに権限を適用できます。
- catalog_name.db.*: 指定したデータベース内のすべてのテーブルに権限を適用できます。
- catalog_name.db.tbl: 指定したデータベース内の指定したテーブルに権限を適用できます。

**3. `<resource_name>`**

リソース名を指定します。`%` と `*` を使用してすべてのリソースに一致させることができますが、res* のようなワイルドカードはサポートされません。

**4. `<workload_group_name>`**

Workload Group 名を指定します。`%` と `*` を使用してすべての Workload Group に一致させることができますが、ワイルドカードはサポートされません。

**5. `<compute_group_name>`**

Compute Group 名を指定します。`%` と `*` を使用してすべての Compute Group に一致させることができますが、ワイルドカードはサポートされません。

**6. `<storage_vault_name>`**

Storage Vault 名を指定します。`%` と `*` を使用してすべての Storage Vault に一致させることができますが、ワイルドカードはサポートされません。

**7. `<user_identity>`**

権限を付与するユーザーを指定します。CREATE USER で作成された user_identity である必要があります。user_identity のホストにはドメイン名を指定できます。ドメイン名を指定した場合、権限が有効になるまで約 1 分かかることがあります。

**8. `<role_name>`**

権限を付与するロールを指定します。指定したロールが存在しない場合は、自動的に作成されます。

**9. `<role_list>`**

付与するロールをカンマで区切ったリストです。指定したロールは存在している必要があります。

4.1.5 以降、権限の対象オブジェクト名は、対応するワイルドカード形式を含め、`db`、`db.table`、`catalog.db.table` のいずれかで、構成要素は最大三つです。構成要素が三つを超える場合、余分なプレフィックスが暗黙に無視されることはなく、エラーになります。

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | ユーザーまたはロール   | GRANT_PRIV 権限を持つユーザーまたはロールのみが GRANT 操作を実行できます。 |

4.1.5 以降、`ADMIN` 以外のユーザーが列の権限を付与または取り消すには、既存の `GRANT` 権限に加えて、対応するテーブルの権限、または指定したすべての列について対応する権限が必要です。`GRANT` 権限だけでは、自分が持っていない列の権限を付与したり取り消したりできません。

## 例 {#examples}

- すべてのカタログ、データベース、テーブルに対する権限をユーザーに付与する。

    ```sql
    GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
    ```

- 指定したデータベースのテーブルに対する権限をユーザーに付与する。

    ```sql
    GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1  TO 'jack'@'192.8.%';
    ```

- 指定したデータベースのテーブルに対する権限をロールに付与する。

    ```sql
    GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
    ```

- すべてのリソースへのアクセス権限をユーザーに付与する。

    ```sql
    GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
    ```

- 指定したリソースの使用権限をユーザーに付与する。

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
    ```

- 指定したリソースへのアクセス権限をロールに付与する。

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
    ```

- 指定したロールをユーザーに付与する。

    ```sql
    GRANT 'role1','role2' TO 'jack'@'%';
    ```

- Workload Group 'g1' の使用権限をユーザー jack に付与する。

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
    ```

- ユーザー jack に付与する権限の対象を、すべての Workload Group に一致させる。

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
    ```

- Workload Group 'g1' の使用権限をロール my_role に付与する。

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';
    ```

- jack が db1 内の view1 の作成文を表示できるようにする。

    ```sql
    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';
    ```

- 指定した Compute Group の使用権限をユーザーに付与する。

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
    ```

- 指定した Compute Group の使用権限をロールに付与する。

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
    ```

- すべての Compute Group の使用権限をユーザーに付与する。

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP '*' TO 'jack'@'%';
    ```

- 指定した Storage Vault の使用権限をユーザーに付与する。

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
    ```

- 指定した Storage Vault の使用権限をロールに付与する。

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
    ```

- すべての Storage Vault の使用権限をユーザーに付与する。

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT '*' TO 'jack'@'%';
    ```
