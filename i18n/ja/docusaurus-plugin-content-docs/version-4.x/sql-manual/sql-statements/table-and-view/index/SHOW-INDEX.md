---
{
    "title": "SHOW INDEX",
    "language": "ja",
    "description": "テーブルのインデックス情報を表示します。内部テーブルの転置インデックスと ANN インデックス、および Lance Catalog テーブルの論理インデックスに対応します。"
}
---

## 説明

このステートメントは、テーブルのインデックス情報を表示します。内部テーブルでは、転置インデックスと ANN インデックスのみをサポートします。

Lance Filesystem Catalog のテーブルでは、Lance データセットに記録された論理スカラーインデックスと論理ベクトルインデックスを表示します。値が入る列は `Table`、`Key_name`、`Seq_in_index`、`Column_name`、`Index_type`、`Properties` のみです。Lance REST Catalog はサポートされません。詳しくは、[Lance インデックスの確認](../../../../lakehouse/catalogs/lance-catalog.mdx#inspect-lance-indexes)を参照してください。

Iceberg や Paimon など、その他の外部カタログのテーブルでは、結果は空になります。これらの形式では、代わりにシステムテーブルを通じてテーブルのメタデータを公開します。詳しくは、[Iceberg のシステムテーブル](../../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables)と[Paimon のシステムテーブル](../../../../lakehouse/catalogs/paimon-catalog.mdx#system-tables)を参照してください。Paimon のインデックスファイルは、システムテーブル [`table_indexes`](../../../../lakehouse/catalogs/paimon-catalog.mdx#table_indexes)で確認できます。

## 構文

```SQL
SHOW INDEX [ ES ] FROM [ <db_name>. ] <table_name> [ FROM <db_name> ];
```

## 別の構文

```SQL
SHOW KEY[ S ] FROM [ <db_name>. ] <table_name> [ FROM <db_name> ];
```
## 必須パラメータ

**1. `<table_name>`**: インデックスが属するテーブルの名前。

## 任意パラメータ

**1. `<db_name>`**: データベース名。省略した場合は、現在のデータベースを使用します。

## 戻り値

| 列名 | 型 | 説明 |
|------|----|------|
| Table | string | インデックスが属するテーブルの名前。 |
| Non_unique | int | インデックスが一意かどうかを示します。<br> - `0`: 一意インデックス <br> - `1`: 非一意インデックス |
| Key_name | string | インデックスの名前。 |
| Seq_in_index | int | インデックス内での列の位置。複数の列で複合インデックスを構成する場合、列の順序を示します。 |
| Column_name | string | インデックス対象の列の名前。 |
| Collation | string | インデックス列の並び順。<br> - `A`: 昇順 <br> - `D`: 降順。 |
| Cardinality | int | インデックス内の一意な値の数。クエリ効率の推定に使用され、値が大きいほどインデックスの選択性とクエリ効率が高くなります。 |
| Sub_part | int | インデックスに使用する接頭辞の長さ。インデックス列が文字列型の場合、`Sub_part` は先頭からインデックス化する文字数を表します。 |
| Packed | string | インデックスが圧縮されているかどうか。 |
| Null | string | `NULL` 値を許可するかどうか。<br> - `YES`: NULL 値を許可 <br> - `NO`: NULL 値を許可しない |
| Index_type | string | インデックスの種類。<br> - `BTREE`: B+ 木インデックス（MySQL のデフォルトの種類）<br> - `HASH`: ハッシュインデックス <br> - `RTREE`: R 木インデックス <br> - `INVERTED`: 転置インデックス（全文検索インデックスなど） |
| Comment | string | インデックスのコメントまたは説明。通常はユーザーが指定したコメントです。 |
| Properties | string | インデックスの追加プロパティ。 |


## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考 |
|:-----|:-----|:-----|
| SHOW_PRIV | データベース | |

## 例

- 指定した `table_name` のインデックスを表示します

     ```SQL
      SHOW INDEX FROM example_db.table_name;
     ```

- Lance Catalog テーブルの論理インデックスを表示します

     ```SQL
      SHOW INDEX FROM lance_catalog.default.items;
     ```
