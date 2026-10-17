---
{
    "title": "file_cache_statistics",
    "language": "ja",
    "description": "各 BE ノードのデータキャッシュに関するメトリクス情報を表示するために使用します。"
}
---

## 概要 {#overview}

各 BE ノードのデータキャッシュに関するメトリクス情報を表示するために使用します。この情報は、BE のデータキャッシュに関する監視メトリクスから取得されます。

:::tip ヒント
このシステムテーブルは、バージョン 2.1.6 および 3.0.2 以降でサポートされています。
:::

## データベース {#database}

`information_schema`

## テーブル情報 {#table-information}

| カラム名 | 型 | 説明 |
|---|---|---|
| BE_ID | BIGINT | BE ノードの ID |
| BE_IP | STRING | BE ノードの IP アドレス |
| CACHE_PATH | STRING | BE ノードのキャッシュパス |
| METRIC_NAME | STRING | メトリクス名 |
| METRIC_VALUE | STRING | メトリクス値のテキスト表現。数値の比較や計算には明示的にキャストしてください |

:::info 注

Doris のバージョンによって、利用できるメトリクスは異なる場合があります。

:::

### 2.1.x のメトリクス {#21x-metrics}

> 主要なメトリクスのみを記載しています。

- `normal_queue_curr_elements`

    現在キャッシュにある File Block の数。

- `normal_queue_max_elements`

    キャッシュに格納できる File Block の最大数。

- `normal_queue_curr_size`

    現在のキャッシュサイズ。

- `normal_queue_max_size`

    許容されるキャッシュの最大サイズ。

- `hits_ratio`

    BE の起動以降のキャッシュヒット率。範囲は 0～1。

- `hits_ratio_5m`

    直近 5 分間のキャッシュヒット率。範囲は 0～1。

- `hits_ratio_1h`

    直近 1 時間のキャッシュヒット率。範囲は 0～1。

### 3.0.x のメトリクス {#30x-metrics}

TODO

### バージョン 4.1.5 でのメトリクスの変更 {#metric-changes-in-version-415}

バージョン 4.1.5 以降、次の二つの `METRIC_NAME` 値を利用できます。これらは、プロセスの起動時から BE ごと、キャッシュパスごとに個別に累積されます。

| METRIC_NAME | 単位 | 意味 |
| --- | --- | --- |
| `evict_not_downloaded_size` | バイト | ダウンロード完了前に削除されたキャッシュブロックの論理範囲サイズの累計。現在ダウンロード中のブロックは含まず、ダウンロード済みデータが物理的に削除された量を示すものではありません |
| `evict_not_downloaded_num` | ブロック | このように削除されたキャッシュブロックの累計数 |

同じバージョン以降、`total_removed_size` は、ダウンロードが完了した後に削除されたキャッシュブロックのバイト数のみをカウントします。ダウンロードが完了していないブロックは、新しいメトリクスで個別に集計されます。ダウンロード中のブロックに削除マークを付けても、これらのカウンターは増加しません。

対応する brpc `/vars` の名前は `file_cache_evict_not_downloaded_size` と `file_cache_evict_not_downloaded_num` で、それぞれ先頭にキャッシュパスが付きます。[File Cache Monitoring](../../../compute-storage-decoupled/file-cache/file-cache.md#cache-space-and-hit-rate-metrics) を参照してください。システムテーブルの `METRIC_NAME` にはパスのプレフィックスが付かず、パスは `CACHE_PATH` に表示されます。

例えば、新しいメトリクスとダウンロード済みデータの累積削除量を確認するには、次のクエリを実行します。

```sql
SELECT BE_ID, CACHE_PATH, METRIC_NAME, CAST(METRIC_VALUE AS DOUBLE) AS metric_value
FROM information_schema.file_cache_statistics
WHERE METRIC_NAME IN ('total_removed_size', 'evict_not_downloaded_size', 'evict_not_downloaded_num')
ORDER BY BE_ID, CACHE_PATH, METRIC_NAME;
```

このクエリは、各 BE のキャッシュパスごとのメトリクスを返します。値はキャッシュの利用状況に応じて変化します。

## 例 {#examples}

1. すべてのキャッシュメトリクスをクエリする

    ```sql
    mysql> select * from information_schema.file_cache_statistics;
    +-------+---------------+----------------------------+----------------------------+--------------------+
    | BE_ID | BE_IP         | CACHE_PATH                 | METRIC_NAME                | METRIC_VALUE       |
    +-------+---------------+----------------------------+----------------------------+--------------------+
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_curr_elements |               1392 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_curr_size     |          248922234 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_max_elements  |             102400 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_max_size      |        21474836480 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio                 | 0.8539634687001242 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio_1h              |                  0 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio_5m              |                  0 |
    +-------+---------------+----------------------------+----------------------------+--------------------+
    ```

2. キャッシュヒット率をクエリし、ヒット率で並べ替える

    ```sql
    select * from information_schema.file_cache_statistics where METRIC_NAME = "hits_ratio" order by cast(METRIC_VALUE as double) desc;
    ```
