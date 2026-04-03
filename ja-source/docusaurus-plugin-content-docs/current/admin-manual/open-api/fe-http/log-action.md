---
{
  "title": "ログアクション",
  "language": "ja",
  "description": "GETはDorisのWARNINGログの最新部分を取得するために使用され、POSTメソッドはFEのログレベルを動的に設定するために使用されます。"
}
---
# Log Action

## リクエスト

```
GET /rest/v1/log
```
## 説明

GETはDorisのWARNINGログの最新部分を取得するために使用され、POSTメソッドはFEのログレベルを動的に設定するために使用されます。
    
## パスパラメータ

なし

## クエリパラメータ

* `add_verbose`

    POSTメソッドのオプションパラメータ。指定されたパッケージのDEBUGレベルログを有効にします。
    
* `del_verbose`

    POSTメソッドのオプションパラメータ。指定されたパッケージのDEBUGレベルログを無効にします。
    
## リクエストボディ

なし

## レスポンス

```
GET /rest/v1/log

{
	"msg": "success",
	"code": 0,
	"data": {
		"LogContents": {
			"logPath": "/home/disk1/cmy/git/doris/core-for-ui/output/fe/log/fe.warn.log",
			"log": "<pre>2020-08-26 15:54:30,081 WARN (UNKNOWN 10.81.85.89_9213_1597652404352(-1)|1) [Catalog.notifyNewFETypeTransfer():2356] notify new FE type transfer: UNKNOWN</br>2020-08-26 15:54:32,089 WARN (RepNode 10.81.85.89_9213_1597652404352(-1)|61) [Catalog.notifyNewFETypeTransfer():2356] notify new FE type transfer: MASTER</br>2020-08-26 15:54:35,121 WARN (stateListener|73) [Catalog.replayJournal():2510] replay journal cost too much time: 2975 replayedJournalId: 232383</br>2020-08-26 15:54:48,117 WARN (leaderCheckpointer|75) [Catalog.replayJournal():2510] replay journal cost too much time: 2812 replayedJournalId: 232383</br></pre>",
			"showingLast": "603 bytes of log"
		},
		"LogConfiguration": {
			"VerboseNames": "org",
			"AuditNames": "slow_query,query",
			"Level": "INFO"
		}
	},
	"count": 0
}  
```
その中で、`data.LogContents.log`は`fe.warn.log`の最新部分のログ内容を意味します。

```
POST /rest/v1/log?add_verbose=org

{
	"msg": "success",
	"code": 0,
	"data": {
		"LogConfiguration": {
			"VerboseNames": "org",
			"AuditNames": "slow_query,query",
			"Level": "INFO"
		}
	},
	"count": 0
}
```
