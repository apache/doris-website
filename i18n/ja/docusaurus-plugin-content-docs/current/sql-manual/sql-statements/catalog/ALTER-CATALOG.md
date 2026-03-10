---
{
  "title": "ALTER CATALOG",
  "language": "ja",
  "description": "この文は、指定されたカタログのプロパティを設定するために使用されます。"
}
---
## 説明

このステートメントは、指定されたカタログのプロパティを設定するために使用されます。


## 構文
1) カタログの名前を変更する

    ```sql
    ALTER CATALOG <catalog_name> RENAME <new_catalog_name>;
    ```
2) カタログのプロパティを変更/追加する

    ```sql
    ALTER CATALOG <catalog_name> SET PROPERTIES ('<key>' = '<value>' [, ... ]);  
    ```
3) カタログのコメントを変更する

    ```sql
    ALTER CATALOG <catalog_name> MODIFY COMMENT "<new catalog comment>";
    ```
## 必須パラメータ

**1. `<catalog_name>`**

変更すべきカタログの名前

**2. `<new_catalog_name>`**

変更後の新しいカタログ名

**3. `'<key>' = '<value>'`**

変更/追加が必要なカタログプロパティのキーと値

**4. `<new catalog comment>`**

変更後のカタログコメント


## アクセス制御要件
| 権限  | オブジェクト  | 備考                                     |
|:-----------|:--------|:------------------------------------------|
| ALTER_PRIV | Catalog | カタログのALTER_PRIVが必要 |

## 使用上の注意

1) カタログのリネーム
- 組み込みカタログ`internal`はリネームできません
- 少なくともAlter権限を持つユーザーのみがカタログをリネームできます
- カタログのリネーム後、REVOKEおよびGRANTコマンドを使用して適切なユーザー権限を変更してください

2) カタログのプロパティの変更/追加

- プロパティ`type`は変更できません。
- 組み込みカタログ`internal`のプロパティは変更できません。
- 指定されたキーの値を更新します。カタログプロパティにキーが存在しない場合は追加されます。

3) カタログのコメント変更

- 組み込みカタログ`internal`は変更できません

## 例

1. カタログctlg_hiveをhiveにリネーム

      ```sql
      ALTER CATALOG ctlg_hive RENAME hive;
      ```
2. catalog hiveの`hive.metastore.uris`プロパティを変更する

      ```sql
      ALTER CATALOG hive SET PROPERTIES ('hive.metastore.uris'='thrift://172.21.0.1:9083');
      ```
3. catalog hiveのコメントを変更する

      ```sql
      ALTER CATALOG hive MODIFY COMMENT "new catalog comment";
      ```
