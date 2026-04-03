---
{
  "title": "ファイル作成",
  "language": "ja",
  "description": "このステートメントは、Dorisクラスターにファイルを作成およびアップロードするために使用されます。"
}
---
## 説明

この文は、Dorisクラスターにファイルを作成およびアップロードするために使用されます。
この機能は通常、証明書や公開鍵、秘密鍵など、他のコマンドで使用する必要があるファイルを管理するために使用されます。

## 構文

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
> - **url**: 必須。認証不要のHTTPダウンロードURLを指定します。実行成功後、ファイルはDorisに保存され、このURLは不要になります。
> - **catalog**: 必須。ファイル分類用のカテゴリ名（ユーザー定義）。特定のコマンドでファイルを特定するために使用されます（例：スケジュールインポートでKafkaがデータソースの場合、'kafka'カテゴリ下のファイルを検索）。
> - **md5**: オプション。ファイルのMD5チェックサム。指定された場合、ダウンロード後に検証が実行されます。

**3. `<value>`**

> ファイル属性値。

## オプションパラメータ

**1. `<database_name>`**

> ファイルが属するデータベースを指定します。指定されない場合は現在のセッションのデータベースを使用します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
|:-------------|:------------|:--------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | この操作を実行するには、ユーザーまたはロールが`ADMIN_PRIV`権限を持っている必要があります |

## 使用上の注意

- ファイルアクセスルール

> 各ファイルは特定のデータベース（Database）に属します。データベースへのアクセス権限を持つユーザーは、その中のすべてのファイルにアクセスできます。

- ファイルサイズおよび数量制限

> この機能は主に証明書などの小さなファイルの管理用に設計されています。  
> **サイズ制限**: 個別ファイルサイズは1MBに制限されています  
> **数量制限**: Dorisクラスターは最大100ファイルまでのアップロードをサポートします

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
- client_1.keyファイルを作成し、my_catalogとして分類する

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
