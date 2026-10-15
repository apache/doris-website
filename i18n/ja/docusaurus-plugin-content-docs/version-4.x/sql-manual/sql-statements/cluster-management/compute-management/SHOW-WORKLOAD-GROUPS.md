---
{
    "title": "SHOW WORKLOAD GROUPS",
    "language": "ja",
    "description": "このステートメントは、現在のユーザーが表示を許可されているワークロードグループを表示します。"
}
---

## 説明

このステートメントは、現在のユーザーが表示を許可されているワークロードグループを表示します。`LIKE` を使用して、名前をパターンで照合できます。特定のワークロードグループを表示するには、そのワークロードグループに対する `USAGE_PRIV`、またはグローバルな `ADMIN_PRIV` が必要です。

## 構文

```sql
SHOW WORKLOAD GROUPS [LIKE "<pattern>"];
```

## 例

### 例 1: すべてのワークロードグループを表示する

```sql
SHOW WORKLOAD GROUPS;
```

```text
mysql> show workload groups \G;
*************************** 1. row ***************************
                          Id: 1754728930516
                        Name: normal
             min_cpu_percent: 20%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 50%
             max_concurrency: 1
              max_queue_size: 1
               queue_timeout: 0
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
*************************** 2. row ***************************
                          Id: 1754740507946
                        Name: test_group2
             min_cpu_percent: 10%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 3%
             max_concurrency: 2147483647
              max_queue_size: 0
               queue_timeout: 0
             scan_thread_num: -1
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
```

### 例 2: パターンを使用してワークロードグループを表示する

```sql
SHOW WORKLOAD GROUPS LIKE "normal%";
```

```text
mysql> show workload groups like "normal%" \G;
*************************** 1. row ***************************
                          Id: 1754728930516
                        Name: normal
             min_cpu_percent: 20%
             max_cpu_percent: 30%
          min_memory_percent: 0%
          max_memory_percent: 50%
             max_concurrency: 1
              max_queue_size: 1
               queue_timeout: 0
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 75%
       memory_high_watermark: 85%
               compute_group: default
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
          slot_memory_policy: none
           running_query_num: 0
           waiting_query_num: 0
```

## フィールドの説明

このステートメントは、現在のユーザーが表示できるワークロードグループを返します。主な出力フィールドを以下に示します。

| フィールド | 説明 |
| --- | --- |
| `Id` | ワークロードグループの ID。 |
| `Name` | ワークロードグループの名前。 |
| `min_cpu_percent` | 最低限保証される CPU 使用率。 |
| `max_cpu_percent` | CPU 使用率の上限。 |
| `min_memory_percent` | 最低限保証されるメモリ使用率。 |
| `max_memory_percent` | メモリ使用率の上限。 |
| `max_concurrency` | 同時実行クエリ数の上限。 |
| `max_queue_size` | 待機中のクエリのキューの最大長。 |
| `queue_timeout` | キューでの最大待機時間（ミリ秒）。 |
| `scan_thread_num` | ワークロードグループが使用するローカルスキャンスレッドの数。 |
| `max_remote_scan_thread_num` | リモートデータソース用のスキャンスレッド数の上限。 |
| `min_remote_scan_thread_num` | リモートデータソース用のスキャンスレッド数の下限。 |
| `memory_low_watermark` | メモリ使用量の低水位。 |
| `memory_high_watermark` | メモリ使用量の高水位。 |
| `compute_group` | ワークロードグループが属するコンピュートグループ。非クラウドモードでは通常、`default` などのデフォルトのリソースグループまたはタグが表示されます。 |
| `read_bytes_per_second` | Doris の内部テーブルの読み取りに対する I/O スループットの上限（バイト/秒）。`-1` は無制限を意味します。 |
| `remote_read_bytes_per_second` | リモートデータソースの読み取りに対する I/O スループットの上限（バイト/秒）。`-1` は無制限を意味します。 |
| `slot_memory_policy` | クエリスロットのメモリ割り当てポリシー。 |
| `running_query_num` | このワークロードグループで現在実行中のクエリ数。 |
| `waiting_query_num` | このワークロードグループのキューで現在待機中のクエリ数。 |

## 使用上の注意

1. このステートメントは `LIKE` によるフィルタリングのみをサポートし、`WHERE` 句はサポートしません。
2. このステートメントは、ワークロードグループ情報の簡単な表示を目的としています。より複雑なクエリやフィルタリングには、TVF の `workload_groups()` を使用してください。
3. 結果は権限によって絞り込まれます。特定のワークロードグループを表示するには、そのワークロードグループに対する `USAGE_PRIV`、またはグローバルな `ADMIN_PRIV` が必要です。例:

   ```sql
   GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
   ```

4. 現在の実装では、互換性のため、デフォルトのワークロードグループ `normal` は通常、追加の権限付与なしで表示できます。
