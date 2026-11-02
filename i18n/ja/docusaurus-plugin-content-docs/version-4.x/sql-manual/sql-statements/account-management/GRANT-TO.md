---
{
    "title": "GRANT TO",
    "language": "ja",
    "description": "GRANT コマンドは次の用途に使用します："
}
---

## 説明 {#description}

GRANT コマンドは次の用途に使用します：

1. 指定した権限をユーザーまたはロールに付与します。
2. 指定したロールをユーザーに付与します。

**関連コマンド**

- [REVOKE FROM](./REVOKE-FROM.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 構文 {#syntax}

**指定した権限をユーザーまたはロールに付与する**

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

**指定したロールをユーザーに付与する**

```sql
GRANT <role_list> TO <user_identity>
```

## 必須パラメータ {#required-parameters}

**1. `<privilege_list>`**

付与する権限のコンマ区切りリストです。現在、次の権限がサポートされています：

- NODE_PRIV: クラスターノードの操作権限。ノードのオンライン化やオフライン化などの操作が含まれます。
- ADMIN_PRIV: NODE_PRIV 以外のすべての権限。
- GRANT_PRIV: ユーザーやロールの作成・削除、権限の付与と取り消し、パスワードの設定など、操作権限を操作するための権限。
- SELECT_PRIV: 指定したデータベースまたはテーブルに対する読み取り権限。
- LOAD_PRIV: 指定したデータベースまたはテーブルへのデータロード権限。
- ALTER_PRIV: 指定したデータベースまたはテーブルのスキーマ変更権限。
- CREATE_PRIV: 指定したデータベースまたはテーブルに対する作成権限。
- DROP_PRIV: 指定したデータベースまたはテーブルに対する削除権限。
- USAGE_PRIV: 指定したリソースおよび Workload Group へのアクセス権限。
- SHOW_VIEW_PRIV: ビュー作成ステートメントを表示する権限。

旧式権限の変換：

- ALL と READ_WRITE は SELECT_PRIV, LOAD_PRIV, ALTER_PRIV, CREATE_PRIV, DROP_PRIV に変換されます。
- READ_ONLY は SELECT_PRIV に変換されます。

**2. `<priv_level>`**

次の 4 つの形式をサポートします：

- ..*：権限をすべてのカタログと、その中のすべてのデータベースおよびテーブルに適用できます。
- catalog_name..：権限を指定したカタログ内のすべてのデータベースおよびテーブルに適用できます。
- catalog_name.db.*：権限を指定したデータベース配下のすべてのテーブルに適用できます。
- catalog_name.db.tbl：権限を指定したデータベース配下の指定したテーブルに適用できます。

**3. `<resource_name>`**

リソース名を指定します。すべてのリソースに一致させる `%` と `*` をサポートしますが、res* のようなワイルドカードはサポートしません。

**4. `<workload_group_name>`**

workload group 名を指定します。すべての workload group に一致させる `%` と `*` をサポートしますが、ワイルドカードはサポートしません。

**5. `<compute_group_name>`**

compute group 名を指定します。すべての compute group に一致させる `%` と `*` をサポートしますが、ワイルドカードはサポートしません。

**6. `<storage_vault_name>`**

storage vault 名を指定します。すべての storage vault に一致させる `%` と `*` をサポートしますが、ワイルドカードはサポートしません。

**7. `<user_identity>`**

権限を受け取るユーザーを指定します。CREATE USER で作成された user_identity である必要があります。user_identity 内のホストにはドメイン名を指定できます。ドメイン名の場合、権限の有効化までに約 1 分遅れることがあります。

**8. `<role_name>`**

権限を受け取るロールを指定します。指定したロールが存在しない場合は自動的に作成されます。

**9. `<role_list>`**

割り当てるロールのコンマ区切りリストです。指定したロールは存在している必要があります。

4.1.5 以降、権限オブジェクト名は最大 3 つのコンポーネント、`db`、`db.table`、または `catalog.db.table` で構成されます。対応するワイルドカード形式も使用できます。3 つを超えるコンポーネントは、余分なプレフィックスを黙って無視せず、拒否されます。

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーは、少なくとも次の権限を持っている必要があります：

| 権限 | オブジェクト | 注記 |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | ユーザーまたはロール   | GRANT_PRIV 権限を持つユーザーまたはロールのみが GRANT 操作を実行できます。 |

4.1.5 以降、`ADMIN` 以外のユーザーが列権限を付与または取り消すには、既存の `GRANT` 権限に加えて、対応するテーブル権限、または一覧に含まれる各列に対する対応する権限の両方が必要です。`GRANT` だけでは、自身が保持していない列権限をユーザーが付与または取り消すことはできません。

## 例 {#examples}

- ユーザーにすべてのカタログとデータベースおよびテーブルへの権限を付与します：

    ```sql
    GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
    ```

- ユーザーに指定したデータベーステーブルへの権限を付与します：

    ```sql
    GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1  TO 'jack'@'192.8.%';
    ```

- ロールに指定したデータベーステーブルへの権限を付与します：

    ```sql
    GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
    ```

- ユーザーにすべてのリソースへのアクセス権を付与します：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
    ```

- ユーザーに指定したリソースを使用する権限を付与します：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
    ```

- ロールに指定したリソースへのアクセス権を付与します：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
    ```

- 指定したロールをユーザーに付与します：

    ```sql
    GRANT 'role1','role2' TO 'jack'@'%';
    ```

- ユーザー jack に指定した workload group 'g1' を付与します：

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
    ```

- ユーザー jack に付与されたすべての workload group に一致させます：

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
    ```

- ロール my_role に workload group 'g1' を付与します：

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';
    ```

- jack が db1 配下の view1 の作成ステートメントを表示できるようにします：

    ```sql
    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';
    ```

- ユーザーに指定した compute group の使用権限を付与します：

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
    ```

- ロールに指定した compute group の使用権限を付与します：

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
    ```

- ユーザーにすべての compute group の使用権限を付与します：

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP '*' TO 'jack'@'%';
    ```

- ユーザーに指定した storage vault の使用権限を付与します：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
    ```

- ロールに指定した storage vault の使用権限を付与します：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
    ```

- ユーザーにすべての storage vault の使用権限を付与します：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT '*' TO 'jack'@'%';
    ```
