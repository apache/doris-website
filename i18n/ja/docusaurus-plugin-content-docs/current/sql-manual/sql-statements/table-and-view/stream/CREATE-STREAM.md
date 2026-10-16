---
{
    "title": "CREATE STREAM",
    "language": "ja",
    "description": "Row Binlog を有効にした内部テーブルに Table Stream を作成し、テーブルの変更を増分消費できるようにします。"
}
---

## 説明

Row Binlog を有効にした内部テーブルに Table Stream を作成します。Table Stream はベーステーブルの各パーティションについて消費オフセットを記録します。`SELECT ... FROM <stream>` は前回の消費以降の変更を読み取り、`INSERT INTO ... SELECT ... FROM <stream>` は変更を消費してオフセットを進めます。機能の説明は [Table Stream の基本](../../../../data-operate/incremental/table-stream)を参照してください。

この機能はバージョン 5.0.0 以降で利用でき、実験的な機能です。FE の設定で `enable_feature_binlog = true` と `enable_table_stream = true` が必要です。

## 構文

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES ("<key>" = "<value>" [, ...])]
```

## 必須パラメータ

**1. `<stream_name>`**
> Stream の識別子（名前）です。所属するデータベース内で一意である必要があり、テーブルやビューと同じ名前は使用できません。識別子の規則はテーブル名と同じです。

**2. `<table_name>`**
> ベーステーブルです。Row Binlog を有効にした内部テーブル（`"binlog.enable" = "true"`、`"binlog.format" = "ROW"`）である必要があります。Stream とは異なるデータベースに配置することもできます。

## 任意パラメータ

**1. `<db_name>`**
> Stream またはベーステーブルが属するデータベースです。省略すると現在のデータベースが使用されます。

**2. `IF NOT EXISTS`**
> 同じ名前の Stream がすでに存在する場合、エラーを報告しません。

**3. `<comment>`**
> Stream のコメントです。後から `ALTER STREAM ... SET COMMENT` で変更できます。

**4. `PROPERTIES`**

| プロパティ | 値 / デフォルト | 説明 |
|---|---|---|
| `type` | `append_only` / `min_delta` / `detail`<br />デフォルトは `min_delta` | 消費タイプです。`append_only` は挿入された行だけを出力します。`min_delta` は連続する消費の間に各キーに生じた正味の変更を出力します。`detail` はすべての変更を行ごとに出力します。`min_delta` と `detail` には、`binlog.need_historical_value` を有効にした Unique Key Merge-on-Write ベーステーブルが必要です。Duplicate Key テーブルでは、`min_delta` は `append_only` として扱われます |
| `show_initial_rows` | `true` / `false`<br />デフォルトは `false` | Stream の作成時点ですでに存在するデータを変更として出力するかどうかを指定します。`true` の場合、最初の読み取りでベーステーブルの現在の全データが返され（変更タイプは `APPEND`）、その消費後に Stream は増分消費へ切り替わります |

どちらのプロパティも作成後は変更できません。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考 |
| :-------- | :----- | :---- |
| CREATE_PRIV | Stream が属するデータベース | |
| SELECT_PRIV | ベーステーブル | |

## 使用上の注意

- ベーステーブルで Row Binlog が有効になっていない場合、`Base Olap table ... need to enable row binlog for table stream` というエラーで失敗します。
- `type` が `min_delta` の場合（省略した場合も含む）、ベーステーブルが要件を満たしていないと、`MIN_DELTA table stream requires base mow table to enable binlog.need_historical_value=true` というエラーで失敗します。
- 無効な `type` を指定すると、`not supported type: <value>` というエラーで失敗します。
- `CREATE OR REPLACE STREAM` はまだサポートされていません。
- Stream の列はベーステーブルの現在可視の列であり、ベーステーブルで `ADD COLUMN` / `DROP COLUMN` を実行すると自動的に同期されます。

## 例

1. デフォルトタイプ（`min_delta`）で、作成後の変更のみを消費する Stream を `orders` テーブルに作成します。

    ```sql
    CREATE STREAM orders_stream ON TABLE orders;
    ```

2. `append_only` タイプの Stream を作成し、ベーステーブルの既存データを初期変更として出力します。

    ```sql
    CREATE STREAM IF NOT EXISTS events_stream ON TABLE events
    COMMENT 'append-only events'
    PROPERTIES (
        "type" = "append_only",
        "show_initial_rows" = "true"
    );
    ```

3. `etl` データベースに、ベーステーブルが `ods` データベースにある Stream を作成します。

    ```sql
    CREATE STREAM etl.orders_stream ON TABLE ods.orders
    PROPERTIES ("type" = "detail");
    ```
