---
{
    "title": "Lance | ファイル形式",
    "language": "ja",
    "description": "Apache Doris による Lance ファイル形式の読み取りサポートについて説明します。",
    "sidebar_label": "Lance"
}
---

# Lance

:::note
Lance のサポートは Apache Doris 4.2 以降で利用できます。
:::

[Lance](https://docs.lancedb.com/lance) は、分析と AI ワークロード向けに設計されたカラム指向のデータ形式です。Doris は Lance Catalog、または `s3()` と `local()` のテーブル値関数（TVF）を通じて Lance データセットを読み取れます。

## サポートされる機能

| 機能 | サポート状況 |
|---|---|
| Lance Catalog | Filesystem Catalog と REST Catalog に対応 |
| ファイル TVF | `s3()` と `local()` に対応 |
| スキーマ推論とカラムプルーニング | 対応 |
| Fragment の並列スキャン | Catalog クエリと S3 TVF で対応 |
| 述語プッシュダウン | 対応するスカラー述語をサポート |
| ベクトル検索 | `vector_search()` による Lance ベクトルインデックスと Flat Search に対応 |
| Lance への書き込み | 非対応 |
| Time Travel | 非対応 |
| 全文検索 / ハイブリッド検索 | 非対応 |

## ファイル TVF で Lance データセットをクエリする

`uri` または `file_path` は、`data/*.lance` のような内部ファイルではなく、**単一の Lance データセットのルートディレクトリ**を直接指す必要があります。

次の例では、S3 互換のオブジェクトストレージにある Lance データセットを読み取ります。

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

ローカルのデータセットを読み取るには、`local()` を使用し、`file_path` でデータセットのルート、`backend_id` で対象の BE を指定します。Doris は `file_path` をそのまま Lance Reader に渡し、`user_files_secure_path` を先頭に付けたり、パスを Glob として展開したりしません。絶対パスを推奨します。

## 制限事項

- Lance へのアクセスは読み取り専用です。Lance テーブルの作成、書き込み、更新、削除には対応していません。
- Lance 形式に対応するのは `s3()` と `local()` のみです。HDFS や HTTP など、ほかのファイル TVF は対応していません。
- TVF パスごとに表せる Lance データセットは一つだけで、`path_partition_keys` には対応していません。
- クエリはデータセットの現在のバージョンを読み取ります。SQL でバージョンを指定したり、Time Travel を実行したりすることはできません。
- ローカル TVF のスキーマ検出と実行では、それぞれ独立してデータセットの最新バージョンを開きます。ローカル TVF クエリの分析中および実行中は、データセットを変更しないでください。

## 参考資料

- [Lance 形式のドキュメント](https://docs.lancedb.com/lance)
