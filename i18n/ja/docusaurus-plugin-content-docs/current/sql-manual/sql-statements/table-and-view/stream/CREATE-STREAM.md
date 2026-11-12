---
{
    "title": "CREATE STREAM",
    "language": "ja",
    "description": "changelog が有効な内部テーブルに Table Stream を作成し、テーブルの変更を増分消費できるようにします。"
}
---

## 説明 {#description}

changelog が有効な内部テーブルに Table Stream を作成します。Table Stream はベーステーブルの各パーティションについて消費オフセットを記録します。`SELECT ... FROM <stream>` は前回の消費以降の変更を読み取り、`INSERT INTO ... SELECT ... FROM <stream>` はそれらを消費してオフセットを進めます。機能の説明については [Table Stream の基本](../../../../data-operate/incremental/table-stream) を参照してください。

この機能はバージョン 5.0.0 以降で利用でき、実験的な機能です。FE の設定で `enable_feature_changelog = true` と `enable_table_stream = true` を指定する必要があります。

## 構文 {#syntax}

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES ("<key>" = "<value>" [, ...])]
```

## 必須パラメータ {#required-parameters}

**1. `<stream_name>`**
> Stream の識別子（名前）です。データベース内で一意である必要があり、テーブル名やビュー名と重複できません。識別子にはテーブル名と同じ規則が適用されます。

**2. `<table_name>`**
> ベーステーブルです。[changelog](../../../../data-operate/incremental/changelog) が有効な内部テーブル（`"changelog.enable" = "true"`）である必要があります。Stream とは別のデータベースにあってもかまいません。

## オプションパラメータ {#optional-parameters}

**1. `<db_name>`**
> Stream またはベーステーブルが属するデータベースです。省略すると現在のデータベースが使用されます。

**2. `IF NOT EXISTS`**
> 同じ名前の Stream がすでに存在する場合にエラーを報告しません。

**3. `<comment>`**
> Stream のコメントです。後から `ALTER STREAM ... SET COMMENT` で変更できます。

**4. `PROPERTIES`**

| プロパティ | 値 / デフォルト | 説明 |
|---|---|---|
| `type` | `append_only` / `min_delta` / `detail`<br />デフォルトは `min_delta` | 消費の種類です。`append_only` は挿入された行のみを出力します。`min_delta` は前回の消費から今回の消費までの各キーの正味の変更を出力します。`detail` はすべての変更を行ごとに出力します。`min_delta` と `detail` を使用するには、ベーステーブルが `changelog.need_historical_value` を有効にした Unique Key Merge-on-Write テーブルである必要があります。Duplicate Key テーブルでは、`min_delta` は `append_only` として処理されます |
| `show_initial_rows` | `true` / `false`<br />デフォルトは `false` | Stream の作成時にすでに存在するデータを変更として出力するかどうかを指定します。`true` の場合、最初の読み取りではベーステーブルの現在の全データが返され（変更タイプは `APPEND`）、その消費後に Stream は増分消費に切り替わります |

どちらのプロパティも作成後は変更できません。

## アクセス制御の要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| CREATE_PRIV | Stream が属するデータベース | |
| SELECT_PRIV | ベーステーブル | |

## 使用上の注意 {#usage-notes}

- ベーステーブルで changelog が有効になっていない場合、`Base Olap table ... need to enable changelog for table stream` というエラーで失敗します。
- `type` が `min_delta` の場合（または省略した場合）、ベーステーブルが要件を満たしていないと、`MIN_DELTA table stream requires base mow table to enable changelog.need_historical_value=true` というエラーで失敗します。
- 無効な `type` を指定すると、`not supported type: <value>` というエラーで失敗します。
- `CREATE OR REPLACE STREAM` はまだサポートされていません。
- Stream の列は、ベーステーブルで現在参照可能な列です。ベーステーブルに `ADD COLUMN` / `DROP COLUMN` を実行すると、自動的に同期されます。

## 例 {#examples}

1. `orders` テーブルに、作成後の変更のみを消費するデフォルトのタイプ（`min_delta`）の Stream を作成します。

    ```sql
    CREATE STREAM orders_stream ON TABLE orders;
    ```

2. `append_only` の Stream を作成し、ベーステーブルの既存データを初期変更として出力します。

    ```sql
    CREATE STREAM IF NOT EXISTS events_stream ON TABLE events
    COMMENT 'append-only events'
    PROPERTIES (
        "type" = "append_only",
        "show_initial_rows" = "true"
    );
    ```

3. ベーステーブルがデータベース `ods` にある Stream を、データベース `etl` に作成します。

    ```sql
    CREATE STREAM etl.orders_stream ON TABLE ods.orders
    PROPERTIES ("type" = "detail");
    ```
