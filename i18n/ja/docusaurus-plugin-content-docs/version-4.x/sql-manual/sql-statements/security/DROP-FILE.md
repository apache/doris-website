---
{
  "title": "DROP FILE",
  "description": "このステートメントは、アップロードされたファイルを削除するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、アップロードされたファイルを削除するために使用されます。

## grammar:

```sql
DROP FILE "<file_name>" [ { FROM | IN } <database>] PROPERTIES ("<key>"="<value>" [ , ... ])
```
## 必須パラメータ

**1. `<file_name>`**

> カスタムファイル名。

**2. `<key>`**

> ファイル属性キー。
> - **catalog**: 必須。ファイルの分類カテゴリ。

**3. `<value>`**

> ファイル属性値。

## オプションパラメータ

**1. `<database>`**

> ファイルが属するデータベースを指定します。指定されない場合は、現在のセッションのデータベースを使用します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、以下の最小権限を持つ必要があります：

| 権限 | オブジェクト | 注記 |
|:-------------|:------------|:--------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | この操作を実行するには、ユーザーまたはロールが`ADMIN_PRIV`権限を保持する必要があります |

## 例

- ファイルca.pemを削除する

    ```sql
    DROP FILE "ca.pem" properties("catalog" = "kafka");
    ```
`my_catalog`に分類されているファイル`client.key`を削除する

  ```sql
  DROP FILE "client.key"
  IN my_database
  ```
- `my_catalog`に分類されているファイル`client_1.key`を削除する

  ```sql
  DROP FILE "client_1.key"
  FROM my_database
  ```
