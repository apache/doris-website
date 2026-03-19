---
{
  "title": "ファイルキャッシュ統計",
  "language": "ja",
  "description": "各BEノードのデータキャッシュに関連するメトリック情報を表示するために使用されます。"
}
---
## 概要

各BEノード上のデータキャッシュに関連するメトリック情報を表示するために使用されます。メトリック情報は、BEのデータキャッシュに関連する監視メトリックから取得されます。

:::tip Tip
このシステムテーブルはバージョン2.1.6および3.0.2からサポートされています。
:::

## データベース

`information_schema`

## テーブル情報

| カラム名 | 型 | 説明 |
|---|---|---|
| BE_ID | BIGINT | BEノードID |
| BE_IP | VARCHAR(256) | BEノードIP |
| CACHE_PATH | VARCHAR(256) | BEノードキャッシュパス |
| METRIC_NAME | VARCHAR(256) | メトリック名 |
| METRIC_VALUE | DOUBLE | メトリック値 |

:::info Note

Dorisのバージョンによってメトリックが異なる場合があります

:::

### 2.1.xメトリック

> 重要なメトリックのみが記載されています。

- `normal_queue_curr_elements`

    現在キャッシュ内にあるFile Blocksの数。

- `normal_queue_max_elements`

    キャッシュで許可されるFile Blocksの最大数。

- `normal_queue_curr_size`

    現在のキャッシュサイズ。

- `normal_queue_max_size`

    許可される最大キャッシュサイズ。

- `hits_ratio`

    BE起動以降の全体的なキャッシュヒット率。範囲0-1。

- `hits_ratio_5m`

    過去5分間のキャッシュヒット率。範囲0-1。

- `hits_ratio_1h`

    過去1時間のキャッシュヒット率。範囲0-1。

### 3.0.xメトリック

TODO

## 例

1. 全てのキャッシュメトリックを照会

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
2. クエリキャッシュヒット率とヒット率による並び替え

    ```sql
    select * from information_schema.file_cache_statistics where METRIC_NAME = "hits_ratio" order by METRIC_VALUE desc;
    ```
