---
{
    "title": "REFRESH",
    "language": "ja",
    "description": "このステートメントは、指定したカタログ、データベース、またはテーブルのメタデータを更新します。"
}
---

## 説明

このステートメントは、指定したカタログ、データベース、またはテーブルのメタデータを更新します。

## 構文

```sql
REFRESH CATALOG <catalog_name>
    [PROPERTIES ("invalid_cache" = "true" | "false")];
REFRESH DATABASE [<catalog_name>.]<database_name>;
REFRESH TABLE [[<catalog_name>.]<database_name>.]<table_name>;
```

## 必須パラメータ

**1. `<catalog_name>`**

更新するカタログの名前。

**2. `[<catalog_name>.]<database_name>`**

更新する、カタログ内のデータベースの名前。

**3. `[[<catalog_name>.]<database_name>.]<table_name>`**

更新する、カタログ内のテーブルの名前。

## アクセス制御要件
| 権限                                                                                          | オブジェクト | 備考                                      |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | カタログ | 上記のいずれかの権限が必要です。 |


## 使用上の注意
カタログを更新すると、パーティションキャッシュ、スキーマキャッシュ、ファイルキャッシュなど、オブジェクトに関連するキャッシュが強制的に無効化されます。

`invalid_cache` は、`REFRESH CATALOG` の実行時に下位レベルのメタデータキャッシュを無効化するかどうかを制御します。

- `true`: カタログオブジェクトのキャッシュに加え、パーティション、スキーマ、ファイルなどの下位レベルのキャッシュも無効化します。これがデフォルトの動作です。
- `false`: カタログレベルのオブジェクトと名前に関するメタデータのみを更新し、下位レベルのキャッシュは保持します。

`invalid_cache` は現在、`REFRESH CATALOG` に適用されます。

## 例

1. Hive カタログを更新する

    ```sql
    REFRESH CATALOG hive;
    ```

2. 下位レベルのキャッシュを無効化せずに Hive カタログを更新する

    ```sql
    REFRESH CATALOG hive PROPERTIES("invalid_cache" = "false");
    ```

3. database1 を更新する

    ```sql
    REFRESH DATABASE ctl.database1;
    REFRESH DATABASE database1;
    ```

4. table1 を更新する

    ```sql
    REFRESH TABLE ctl.db.table1;
    REFRESH TABLE db.table1;
    REFRESH TABLE table1;
    ```

