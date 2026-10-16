---
{
    "title": "プロファイルアクション",
    "language": "ja",
    "description": "指定した query_id のクエリプロファイルを取得します。query_id が存在しない場合は 404 NOT FOUND ERROR を返し、存在する場合はクエリプロファイルを返します。"
}
---

# プロファイルアクション

## リクエスト

:::caution 注意:

この API を使用するには管理者権限（admin_priv）が必要です。プロファイルを表示するには、[クエリプロファイルアクション](./query-profile-action.md)の使用を推奨します。

:::

`GET /api/profile`
`GET /api/profile/text`

## 説明

指定した query_id のクエリプロファイルを取得します。
query_id が存在しない場合は、404 NOT FOUND ERROR を返します。
query_id が存在する場合は、次のようなクエリプロファイルを返します。

```
Query:
  Summary:
     - Query ID: a0a9259df9844029-845331577440a3bd
     - Start Time: 2020-06-15 14:10:05
     - End Time: 2020-06-15 14:10:05
     - Total: 8ms
     - Query Type: Query
     - Query State: EOF
     - Doris Version: trunk
     - User: root
     - Default Db: default_cluster:test
     - Sql Statement: select * from table1
  Execution Profile a0a9259df9844029-845331577440a3bd:(Active: 7.315ms, % non-child: 100.00%)
    Fragment 0:
      Instance a0a9259df9844029-845331577440a3be (host=TNetworkAddress(hostname:172.26.108.176, port:9560)):(Active: 1.523ms, % non-child: 0.24%)
         - MemoryLimit: 2.00 GB
         - PeakUsedReservation: 0.00
         - PeakMemoryUsage: 72.00 KB
         - RowsProduced: 5
         - AverageThreadTokens: 0.00
         - PeakReservation: 0.00
        BlockMgr:
           - BlocksCreated: 0
           - BlockWritesOutstanding: 0
           - BytesWritten: 0.00
           - TotalEncryptionTime: 0ns
           - BufferedPins: 0
           - TotalReadBlockTime: 0ns
           - TotalBufferWaitTime: 0ns
           - BlocksRecycled: 0
           - TotalIntegrityCheckTime: 0ns
           - MaxBlockSize: 8.00 MB
        DataBufferSender (dst_fragment_instance_id=a0a9259df9844029-845331577440a3be):
           - AppendBatchTime: 9.23us
             - ResultSendTime: 956ns
             - TupleConvertTime: 5.735us
           - NumSentRows: 5
        OLAP_SCAN_NODE (id=0):(Active: 1.506ms, % non-child: 20.59%)
           - TotalRawReadTime: 0ns
           - CompressedBytesRead: 6.47 KB
           - PeakMemoryUsage: 0.00
           - RowsPushedCondFiltered: 0
           - ScanRangesComplete: 0
           - ScanTime: 25.195us
           - BitmapIndexFilterTimer: 0ns
           - BitmapIndexFilterCount: 0
           - NumScanners: 65
           - RowsStatsFiltered: 0
           - VectorPredEvalTime: 0ns
           - BlockSeekTime: 1.299ms
           - RawRowsRead: 1.91K (1910)
           - ScannerThreadsVoluntaryContextSwitches: 0
           - RowsDelFiltered: 0
           - IndexLoadTime: 911.104us
           - NumDiskAccess: 1
           - ScannerThreadsTotalWallClockTime: 0ns
             - MaterializeTupleTime: 0ns
             - ScannerThreadsUserTime: 0ns
             - ScannerThreadsSysTime: 0ns
           - TotalPagesNum: 0
           - RowsReturnedRate: 3.319K /sec
           - BlockLoadTime: 539.289us
           - CachedPagesNum: 0
           - BlocksLoad: 384
           - UncompressedBytesRead: 0.00
           - RowsBloomFilterFiltered: 0
           - TabletCount : 1
           - RowsReturned: 5
           - ScannerThreadsInvoluntaryContextSwitches: 0
           - DecompressorTimer: 0ns
           - RowsVectorPredFiltered: 0
           - ReaderInitTime: 6.498ms
           - RowsRead: 5
           - PerReadThreadRawHdfsThroughput: 0.0 /sec
           - BlockFetchTime: 4.318ms
           - ShowHintsTime: 0ns
           - TotalReadThroughput: 0.0 /sec
           - IOTimer: 1.154ms
           - BytesRead: 48.49 KB
           - BlockConvertTime: 97.539us
           - BlockSeekCount: 0
```
テキスト形式のインターフェースでは、プロファイルのプレーンテキストをそのまま返します。
    
## パスパラメータ

なし

## クエリパラメータ

* query_id

    クエリ ID を指定します。

## リクエストボディ

なし

## レスポンス

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"profile": "query profile ..."
	},
	"count": 0
}
```
    
## 使用例

1. 指定したクエリ ID のクエリプロファイルを取得します。

    ```
    GET /api/profile?query_id=f732084bc8e74f39-8313581c9c3c0b58
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"profile": "query profile ..."
    	},
    	"count": 0
    }
    ```
2. 指定したクエリ ID のクエリプロファイルをテキスト形式で取得します。
    ```
    GET /api/profile/text?query_id=f732084bc8e74f39-8313581c9c3c0b58
    
    Response:
        Summary:
        - Profile ID: 48bdf6d75dbb46c9-998b9c0368f4561f
        - Task Type: QUERY
        - Start Time: 2023-12-20 11:09:41
        - End Time: 2023-12-20 11:09:45
        - Total: 3s680ms
        - Task State: EOF
        - User: root
        - Default Db: tpcds
        - Sql Statement: with customer_total_return as
      select sr_customer_sk as ctr_customer_sk
      ,sr_store_sk as ctr_store_sk
      ,sum(SR_FEE) as ctr_total_return
      ...
    ```
