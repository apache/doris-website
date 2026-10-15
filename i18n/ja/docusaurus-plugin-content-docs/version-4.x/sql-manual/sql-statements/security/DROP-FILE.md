---
{
    "title": "DROP FILE",
    "language": "ja",
    "description": "このステートメントは、アップロードされたファイルを削除するために使用します。"
}
---

## 説明

このステートメントは、アップロードされたファイルを削除するために使用します。

## 構文

```sql
DROP FILE "<file_name>" [ { FROM | IN } <database>] PROPERTIES ("<key>"="<value>" [ , ... ])
```

## 必須パラメータ

**1. `<file_name>`**

> ユーザーが指定したファイル名。

**2. `<key>`**

> ファイル属性のキー。
> - **catalog**: 必須。ファイルの分類カテゴリ。

**3. `<value>`**

> ファイル属性の値。

## 省略可能なパラメータ

**1. `<database>`**

> ファイルが属するデータベースを指定します。省略した場合は、現在のセッションのデータベースを使用します。

## アクセス制御要件

この SQL コマンドを実行するユーザーには、次の権限が最低限必要です。

| 権限         | 対象             | 説明                                                                     |
|:-------------|:-----------------|:-------------------------------------------------------------------------|
| `ADMIN_PRIV` | ユーザー / ロール | この操作を実行するには、ユーザーまたはロールに `ADMIN_PRIV` 権限が必要です。 |

## 使用例

- ファイル ca.pem を削除する

    ```sql
    DROP FILE "ca.pem" properties("catalog" = "kafka");
    ```
- ファイル `client.key` を削除する（`my_catalog` に分類）

  ```sql
  DROP FILE "client.key"
  IN my_database
  ```

- ファイル `client_1.key` を削除する（`my_catalog` に分類）

  ```sql
  DROP FILE "client_1.key"
  FROM my_database
  ```
