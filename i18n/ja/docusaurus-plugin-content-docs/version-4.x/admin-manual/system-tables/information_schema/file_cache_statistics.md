---
{
    "title": "file_cache_statistics",
    "language": "ja",
    "description": "各 BE ノードのデータキャッシュに関連するメトリクス情報を表示します。"
}
---

## 概要 {#overview}

各 BE ノードのデータキャッシュに関連するメトリクス情報を表示します。この情報は、BE のデータキャッシュに関する監視メトリクスから取得されます。

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
| METRIC_VALUE | STRING | メトリクス値のテキスト表現。数値の比較や計算を行う場合は、明示的にキャストしてください |

:::info 注記

Doris のバージョンによって、利用できるメトリクスが異なる場合があります。

:::

### 2.1.x のメトリクス {#21x-metrics}

> 主要なメトリクスのみを記載します。

- `normal_queue_curr_elements`

    現在キャッシュ内にある File Block の数。

- `normal_queue_max_elements`

    キャッシュ内に保持できる File Block の最大数。

- `normal_queue_curr_size`

    現在のキャッシュサイズ。

- `normal_queue_max_size`

    許容される最大キャッシュサイズ。

- `hits_ratio`

    BE の起動以降のキャッシュヒット率。範囲は 0-1。

- `hits_ratio_5m`

    過去 5 分間のキャッシュヒット率。範囲は 0-1。

- `hits_ratio_1h`

    過去 1 時間のキャッシュヒット率。範囲は 0-1。

### 3.0.x のメトリクス {#30x-metrics}

TODO

### バージョン 4.1.5 でのメトリクスの変更 {#metric-changes-in-version-415}

バージョン 4.1.5 以降、次の二つの `METRIC_NAME` の値を利用できます。これらは、各 BE とキャッシュパスについて、プロセスの起動時から個別に累積されます。

| METRIC_NAME | 単位 | 意味 |
| --- | --- | --- |
| `evict_not_downloaded_size` | バイト | ダウンロード完了前に削除されたキャッシュブロックの論理範囲サイズの累計。現在ダウンロード中のブロックは含みません。ダウンロード済みデータの物理的なエビクションを表すものではありません |
| `evict_not_downloaded_num` | ブロック | このように削除されたキャッシュブロックの累計数 |

同じバージョン以降、`total_removed_size` は、ダウンロードが完全に完了してから削除されたキャッシュブロックのバイト数のみを集計します。ダウンロードが完了していないブロックは、新しいメトリクスで別途集計します。ダウンロード中のブロックに削除マークを付けても、これらのカウンターは増加しません。

対応する brpc の `/vars` 名は `file_cache_evict_not_downloaded_size` と `file_cache_evict_not_downloaded_num` で、それぞれにキャッシュパスがプレフィックスとして付きます。詳しくは[ファイルキャッシュの監視](../../../compute-storage-decoupled/file-cache/file-cache.md#cache-space-and-hit-rate-metrics)を参照してください。システムテーブルの `METRIC_NAME` にはパスのプレフィックスは付かず、パスは `CACHE_PATH` に表示されます。

たとえば、新しいメトリクスと、ダウンロード済みデータの累計削除量をクエリするには、次のようにします。

```sql
SELECT BE_ID, CACHE_PATH, METRIC_NAME, CAST(METRIC_VALUE AS DOUBLE) AS metric_value
FROM information_schema.file_cache_statistics
WHERE METRIC_NAME IN ('total_removed_size', 'evict_not_downloaded_size', 'evict_not_downloaded_num')
ORDER BY BE_ID, CACHE_PATH, METRIC_NAME;
```

このクエリは、各 BE の各キャッシュパスについてメトリクスを返します。値はキャッシュの動作に応じて変化します。

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
