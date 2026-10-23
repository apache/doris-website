---
{
    "title": "Lance | ファイル形式",
    "language": "ja",
    "description": "このドキュメントでは、Apache Doris による Lance ファイル形式の読み取りサポートについて説明します。",
    "sidebar_label": "Lance"
}
---

# Lance {#lance}

:::note
Lance は Apache Doris 4.2 以降でサポートされています。
:::

[Lance](https://docs.lancedb.com/lance) は、分析と AI のワークロード向けに設計されたカラム指向のデータ形式です。Doris は、Lance Catalog、または `s3()` と `local()` のテーブル値関数（TVF）を使用して Lance データセットを読み取れます。

Lance の型マッピングについては、[Doris のデータ型マッピング](../catalogs/lance-catalog/doris-type-mapping.md)を参照してください。

## 対応機能 {#supported-features}

| 機能 | 対応状況 |
|---|---|
| Lance Catalog | Filesystem Catalog と REST Catalog に対応 |
| ファイル TVF | `s3()` と `local()` に対応 |
| スキーマ推論と列プルーニング | 対応 |
| 並列 Fragment スキャン | Catalog クエリと S3 TVF で対応 |
| 述語プッシュダウン | 互換性のあるスカラー述語に対応 |
| ベクトル検索 | `vector_search()` を通じて Lance のベクトルインデックスと Flat Search に対応 |
| Lance への書き込み | 非対応 |
| Time Travel | Lance Catalog で対応。ファイル TVF は現在のバージョンのみを読み取り |
| 全文検索 | `full_text_search()` を通じて既存の Lance FTS インデックスに対応 |
| ハイブリッド検索 | 非対応 |

Catalog の設定、述語プッシュダウン、ベクトル検索、全文検索の詳細については、[Lance Catalog](../catalogs/lance-catalog.mdx) を参照してください。

## ファイル TVF を使用して Lance データセットをクエリする {#query-a-lance-dataset-with-a-file-tvf}

`uri` または `file_path` には、`data/*.lance` のような内部ファイルではなく、**単一の Lance データセットのルートディレクトリ**を直接指定する必要があります。

次の例では、S3 互換のオブジェクトストレージから Lance データセットを読み取ります。

```sql
SELECT user_id, name
FROM s3(
    "uri" = "s3://my-bucket/lance/user_profiles.lance",
    "s3.endpoint" = "http://127.0.0.1:9000",
    "s3.access_key" = "admin",
    "s3.secret_key" = "password",
    "s3.region" = "us-east-1",
    "use_path_style" = "true",
    "format" = "lance"
)
WHERE user_id > 100;
```

ローカルのデータセットを読み取るには、`local()` を使用し、`file_path` にデータセットのルート、`backend_id` に対象の BE を指定します。Doris は `file_path` を Lance Reader に直接渡します。`user_files_secure_path` を先頭に付けたり、パスを Glob として展開したりすることはありません。絶対パスを推奨します。

## 制限事項 {#limitations}

- Lance へのアクセスは読み取り専用です。Lance テーブルの作成、書き込み、更新、削除には対応していません。
- Lance 形式に対応しているのは `s3()` と `local()` のみです。HDFS や HTTP など、ほかのファイル TVF には対応していません。
- 単一の TVF パスで指定できる Lance データセットは単一のものに限られ、`path_partition_keys` には対応していません。
- ファイル TVF のクエリはデータセットの現在のバージョンを読み取ります。過去のバージョンを選択したり、Time Travel を実行したりするには、[Lance Catalog](../catalogs/lance-catalog.mdx#time-travel) を使用してください。
- ローカル TVF のスキーマ検出と実行では、それぞれ独立してデータセットの最新バージョンを開きます。ローカル TVF のクエリの解析中や実行中は、データセットを変更しないでください。

## 参考資料 {#references}

- [Lance Catalog](../catalogs/lance-catalog.mdx)
- [Lance 形式のドキュメント](https://docs.lancedb.com/lance)
