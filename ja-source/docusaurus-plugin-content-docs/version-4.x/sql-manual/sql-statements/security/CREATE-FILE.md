---
{
  "title": "ファイル作成",
  "description": "この文はDorisクラスターにファイルを作成してアップロードするために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、Dorisクラスターにファイルを作成およびアップロードするために使用されます。
この機能は通常、証明書、公開鍵と秘密鍵など、他のコマンドで使用する必要があるファイルを管理するために使用されます。

## Syntax

```sql
CREATE FILE <file_name>
        [ { FROM | IN } <database_name>] PROPERTIES ("<key>"="<value>" [ , ... ]);
```
## 必須パラメータ

**<file_name>**

**1. `<file_name>`**

> カスタムファイル名。

**2. `<key>`**

> ファイル属性キー。
> - **url**: 必須。認証なしのHTTPダウンロードURLを指定します。実行が成功した後、ファイルはDorisに保存され、このURLは不要になります。
> - **catalog**: 必須。ファイル分類のためのカテゴリ名（ユーザー定義）。特定のコマンドでファイルを特定するために使用されます（例：スケジュールされたインポートでKafkaがデータソースの場合、'kafka'カタログ下のファイルを検索します）。
> - **md5**: オプション。ファイルのMD5チェックサム。提供された場合、ダウンロード後に検証が実行されます。

**3. `<value>`**

> ファイル属性値。

## オプションパラメータ

**1. `<database_name>`**

> ファイルが属するデータベースを指定します。指定されていない場合は、現在のセッションのデータベースを使用します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限         | オブジェクト    | 備考                                                                      |
|:-------------|:------------|:-------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | この操作を実行するには、ユーザーまたはロールが`ADMIN_PRIV`権限を持つ必要があります |

## 使用上の注意

- ファイルアクセスルール

> 各ファイルは特定のデータベース（Database）に属します。データベースへのアクセス権限を持つユーザーは、そのデータベース内のすべてのファイルにアクセスできます。

- ファイルサイズと数量制限

> この機能は主に証明書などの小さなファイルの管理を目的として設計されています。  
> **サイズ制限**: 個別ファイルサイズは1MBに制限されます  
> **数量制限**: Dorisクラスターは最大100ファイルまでのアップロードをサポートします

## 例

- kafkaに分類されたファイルca.pemを作成する

   ```sql
   CREATE FILE "ca.pem"
   PROPERTIES
   (
       "url" = "https://test.bj.bcebos.com/kafka-key/ca.pem",
       "catalog" = "kafka"
   );
   ```
- ファイル client.key を作成し、my_catalog として分類する

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
- ファイル client_1.key を作成し、my_catalog として分類する

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
