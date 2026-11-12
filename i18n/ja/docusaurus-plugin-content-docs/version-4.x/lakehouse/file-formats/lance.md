---
{
    "title": "Lance | ファイル形式",
    "language": "ja",
    "description": "このドキュメントでは、Apache Doris による Lance ファイル形式の読み取りについて説明します。",
    "sidebar_label": "Lance"
}
---

# Lance {#lance}

:::note
Lance は Apache Doris 4.2 以降でサポートされます。
:::

[Lance](https://docs.lancedb.com/lance) は、分析と AI のワークロード向けに設計された列指向データ形式です。Doris は、Lance Catalog、または `s3()` と `local()` のテーブル値関数（TVF）を通じて Lance データセットを読み取れます。

Lance の型マッピングについては、[Doris のデータ型マッピング](../catalogs/lance-catalog/doris-type-mapping.md)を参照してください。

## サポートされる機能 {#supported-features}

| 機能 | サポート状況 |
|---|---|
| Lance Catalog | Filesystem Catalog と REST Catalog をサポート |
| ファイル TVF | `s3()` と `local()` をサポート |
| スキーマ推論とカラムプルーニング | 対応 |
| 並列 Fragment スキャン | Catalog クエリと S3 TVF で対応 |
| 述語プッシュダウン | 対応するスカラー述語をサポート |
| ベクトル検索 | Lance ベクトルインデックスと `vector_search()` を使った Flat Search をサポート |
| Lance への書き込み | 非対応 |
| Time Travel | 非対応 |
| 全文検索／ハイブリッド検索 | 非対応 |

Catalog の設定、型マッピング、述語プッシュダウン、ベクトル検索の詳細については、[Lance Catalog](../catalogs/lance-catalog.mdx)を参照してください。

## ファイル TVF で Lance データセットをクエリする {#query-a-lance-dataset-with-a-file-tvf}

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

ローカルのデータセットを読み取るには、`local()` を使用し、`file_path` でデータセットのルートを、`backend_id` で対象の BE を指定します。Doris は `file_path` を Lance Reader に直接渡し、`user_files_secure_path` を先頭に追加したり、パスを Glob として展開したりしません。絶対パスを推奨します。

## 制限事項 {#limitations}

- Lance へのアクセスは読み取り専用です。Lance テーブルの作成、書き込み、更新、削除には対応していません。
- Lance 形式をサポートするのは `s3()` と `local()` のみです。HDFS や HTTP など、ほかのファイル TVF には対応していません。
- TVF のパスで指定できる Lance データセットは単一のものに限られ、`path_partition_keys` には対応していません。
- クエリはデータセットの現在のバージョンを読み取ります。SQL で Version を選択したり、Time Travel を実行したりすることはできません。
- ローカル TVF では、スキーマの検出時と実行時に、それぞれ独立して最新のデータセットバージョンを開きます。ローカル TVF のクエリを解析・実行している間は、データセットを変更しないでください。

## 参考資料 {#references}

- [Lance Catalog](../catalogs/lance-catalog.mdx)
- [Lance 形式のドキュメント](https://docs.lancedb.com/lance)
