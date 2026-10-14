---
{
    "title": "ALTER CATALOG",
    "language": "ja",
    "description": "この文は、指定したカタログのプロパティを設定するために使用します。"
}
---

## 説明

この文は、指定したカタログのプロパティを設定するために使用します。


## 構文
1) カタログの名前を変更する

    ```sql
    ALTER CATALOG <catalog_name> RENAME <new_catalog_name>;
    ```

2) カタログのプロパティを変更または追加する

    ```sql
    ALTER CATALOG <catalog_name> SET PROPERTIES ('<key>' = '<value>' [, ... ]);  
    ```

3) カタログのコメントを変更する

    ```sql
    ALTER CATALOG <catalog_name> MODIFY COMMENT "<new catalog comment>";
    ```

## 必須パラメータ

**1. `<catalog_name>`**

変更するカタログの名前

**2. `<new_catalog_name>`**

変更後の新しいカタログ名

**3. `'<key>' = '<value>'`**

変更または追加するカタログのプロパティのキーと値

**4. `<new catalog comment>`**

変更後のカタログのコメント


## アクセス権限の要件
| 権限       | オブジェクト | 備考                                        |
|:-----------|:-------------|:--------------------------------------------|
| ALTER_PRIV | カタログ     | カタログに対する ALTER_PRIV 権限が必要です。 |

## 使用上の注意

1) カタログの名前を変更する
- 組み込みカタログ `internal` の名前は変更できません。
- カタログの名前を変更できるのは、少なくとも Alter 権限を持つユーザーだけです。
- カタログの名前を変更した後は、REVOKE コマンドと GRANT コマンドを使用して、該当するユーザーの権限を変更してください。

2) カタログのプロパティを変更または追加する

- プロパティ `type` は変更できません。
- 組み込みカタログ `internal` のプロパティは変更できません。
- 指定したキーの値を更新します。キーがカタログのプロパティに存在しない場合は、追加されます。

3) カタログのコメントを変更する

- 組み込みカタログ `internal` は変更できません。

## 例

1. カタログ ctlg_hive の名前を hive に変更する

      ```sql
      ALTER CATALOG ctlg_hive RENAME hive;
      ```

2. カタログ hive のプロパティ `hive.metastore.uris` を変更する

      ```sql
      ALTER CATALOG hive SET PROPERTIES ('hive.metastore.uris'='thrift://172.21.0.1:9083');
      ```

3. カタログ hive のコメントを変更する
      ```sql
      ALTER CATALOG hive MODIFY COMMENT "new catalog comment";
      ```
