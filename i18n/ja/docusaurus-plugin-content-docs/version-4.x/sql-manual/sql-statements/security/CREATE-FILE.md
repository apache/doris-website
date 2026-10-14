---
{
    "title": "CREATE FILE",
    "language": "ja",
    "description": "この文は、ファイルを作成して Doris クラスターにアップロードするために使用します。"
}
---

## 説明

この文は、ファイルを作成して Doris クラスターにアップロードするために使用します。
通常は、証明書、公開鍵、秘密鍵など、他のコマンドで使用するファイルの管理に使用します。

## 構文

```sql
CREATE FILE <file_name>
        [ { FROM | IN } <database_name>] PROPERTIES ("<key>"="<value>" [ , ... ]);
```

## 必須パラメータ

**1. `<file_name>`**

> ユーザーが指定するファイル名。

**2. `<key>`**

> ファイル属性のキー。
> - **url**: 必須。認証不要の HTTP ダウンロード URL を指定します。実行に成功すると、ファイルは Doris に保存され、それ以降この URL は不要になります。
> - **catalog**: 必須。ファイルを分類するためのカテゴリ名（ユーザー定義）。特定のコマンドでファイルを探すために使用します（例：Kafka をデータソースとする定期インポートでは、'kafka' catalog 内のファイルを検索します）。
> - **md5**: 任意。ファイルの MD5 チェックサム。指定した場合は、ダウンロード後に検証が行われます。

**3. `<value>`**

> ファイル属性の値。

## 任意パラメータ

**1. `<database_name>`**

> ファイルが属するデータベースを指定します。省略した場合は、現在のセッションのデータベースを使用します。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限         | 対象            | 説明                                                                |
|:-------------|:----------------|:--------------------------------------------------------------------|
| `ADMIN_PRIV` | ユーザー / ロール | この操作を実行するには、ユーザーまたはロールが `ADMIN_PRIV` 権限を持つ必要があります。 |

## 使用上の注意

- ファイルへのアクセス規則

> 各ファイルは特定のデータベース（Database）に属します。そのデータベースへのアクセス権限を持つユーザーは、データベース内のすべてのファイルにアクセスできます。

- ファイルのサイズと件数の制限

> この機能は主に証明書などの小さなファイルの管理を想定しています。
> **サイズ制限**: 個々のファイルのサイズは 1MB 以下です。
> **件数制限**: Doris クラスターにアップロードできるファイルは最大 100 個です。

## 例

- kafka に分類されるファイル ca.pem を作成します。

   ```sql
   CREATE FILE "ca.pem"
   PROPERTIES
   (
       "url" = "https://test.bj.bcebos.com/kafka-key/ca.pem",
       "catalog" = "kafka"
   );
   ```

- my_catalog に分類されるファイル client.key を作成します。

   ```sql
   CREATE FILE "client.key"
   IN my_database
   PROPERTIES
   (
       "url" = "https://test.bj.bcebos.com/kafka-key/client.key",
       "catalog" = "my_catalog",
       "md5" = "b5bb901bf10f99205b39a46ac3557dd9"
   );
   ```

- my_catalog に分類されるファイル client_1.key を作成します。

  ```sql
    CREATE FILE "client_1.key"
    FROM my_database
    PROPERTIES
    (
       "url" = "https://test.bj.bcebos.com/kafka-key/client.key",
       "catalog" = "my_catalog",
       "md5" = "b5bb901bf10f99205b39a46ac3557dd9"
    );
    ```

