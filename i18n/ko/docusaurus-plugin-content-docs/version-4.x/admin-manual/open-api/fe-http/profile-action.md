---
{
    "title": "프로파일 액션",
    "language": "ko",
    "description": "지정한 쿼리 ID의 쿼리 프로파일을 가져오는 데 사용합니다. queryid가 존재하지 않으면 404 NOT FOUND ERROR를 반환합니다. queryid가 존재하면,"
}
---

# 프로파일 액션 {#profile-action}

## 요청 {#request}

:::caution 참고:

이 API를 사용하려면 관리자 권한(admin_priv)이 필요합니다. 프로파일을 확인할 때는 [쿼리 프로파일 액션](./query-profile-action.md)을 사용하는 것을 권장합니다.

:::

`GET /api/profile`
`GET /api/profile/text`

## 설명 {#description}

지정한 쿼리 ID의 쿼리 프로파일을 가져오는 데 사용합니다.
query_id가 존재하지 않으면 404 NOT FOUND ERROR를 반환합니다.
query_id가 존재하면 다음과 같은 쿼리 프로파일을 반환합니다.

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
텍스트 인터페이스를 사용하면 프로파일 내용을 일반 텍스트로 반환합니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* query_id

    쿼리 ID를 지정합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

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

## 예시 {#examples}

1. 지정한 쿼리 ID의 쿼리 프로파일 가져오기

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
2. 지정한 쿼리 ID의 쿼리 프로파일을 텍스트로 가져오기
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
