---
{
  "title": "ファイル作成",
  "description": "この文は、Dorisクラスターにファイルを作成およびアップロードするために使用されます。",
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
> - **url**: 必須。認証なしHTTPダウンロードURLを指定します。実行が成功した後、ファイルはDorisに保存され、このURLはもはや必要ありません。
> - **catalog**: 必須。ファイル分類のためのカテゴリ名（ユーザー定義）。特定のコマンドでファイルを特定するために使用されます（例：スケジュールされたインポートでKafkaがデータソースの場合、'kafka'カタログ配下のファイルを検索します）。
> - **md5**: オプション。ファイルのMD5チェックサム。指定された場合、ダウンロード後に検証が実行されます。

**3. `<value>`**

> ファイル属性値。

## オプションパラメータ

**1. `<database_name>`**

> ファイルが属するデータベースを指定します。指定されない場合は現在のセッションのデータベースを使用します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限         | オブジェクト    | 注記                                                                              |
|:-------------|:------------|:--------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | ユーザーまたはロールがこの操作を実行するには`ADMIN_PRIV`権限を保持する必要があります |

## 使用上の注意

- ファイルアクセスルール

> 各ファイルは特定のデータベース（Database）に属します。データベースへのアクセス権限を持つユーザーは、その中のすべてのファイルにアクセスできます。

- ファイルサイズと数量制限

> この機能は主に証明書などの小さなファイルの管理を目的として設計されています。  
> **サイズ制限**: 個別ファイルサイズは1MBに制限されています  
> **数量制限**: Dorisクラスターは最大100ファイルまでのアップロードをサポートしています

## 例

- ca.pemファイルを作成し、kafkaとして分類

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
- ファイルclient_1.keyを作成し、my_catalogとして分類する

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
