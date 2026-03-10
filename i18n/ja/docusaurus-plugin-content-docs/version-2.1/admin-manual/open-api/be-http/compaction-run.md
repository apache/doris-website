---
{
  "title": "手動でCompactionを実行",
  "language": "ja",
  "description": "POST /api/compaction/run?tableid={int}&compacttype=full なお、tableid=xxxはcompacttype=fullが指定された場合にのみ有効になります。"
}
---
# 手動でコンパクションをトリガーする

## Request

`POST /api/compaction/run?tablet_id={int}&compact_type={enum}`
`POST /api/compaction/run?table_id={int}&compact_type=full` 注意：table_id=xxxは、compact_type=fullが指定された場合のみ有効になります。
`GET /api/compaction/run_status?tablet_id={int}`


## Description

手動で比較をトリガーし、ステータスを表示するために使用されます。

## Query parameters

* `tablet_id`
    - tabletのID

* `table_id`
    - tableのID。注意：table_id=xxxは、compact_type=fullが指定された場合のみ有効になり、tablet_idとtable_idは一つずつしか指定できず、同時に指定することはできません。table_idを指定した後、このtable配下のすべてのtabletに対してfull_compactionが自動的に実行されます。

* `compact_type`
    - 値は`base`または`cumulative`または`full`です。full_compactionの使用シナリオについては、[Data Recovery](../../trouble-shooting/repairing-data)を参照してください。

## Request body

なし

## Response

### Trigger Compaction

tabletが存在しない場合、JSON形式のエラーが返されます：

```
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```
タブレットが存在し、タブレットが実行されていない場合、JSON形式が返されます：

```
{
    "status": "Fail",
    "msg": "fail to execute compaction, error = -2000"
}
```
タブレットが存在し、タブレットが実行中の場合、JSON形式が返されます：

```
{
    "status": "Success",
    "msg": "compaction task is successfully triggered."
}
```
結果の説明:

* status: トリガータスクのステータス。正常にトリガーされた場合はSuccess、何らかの理由（例：適切なバージョンが取得できない）でFailを返します。
* msg: 具体的な成功または失敗情報を提供します。

### ステータス表示

タブレットが存在しない場合、JSON形式でエラーが返されます:

```
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```
タブレットが存在し、タブレットが実行されていない場合、JSON形式が返されます：

```
{
    "status" : "Success",
    "run_status" : false,
    "msg" : "this tablet_id is not running",
    "tablet_id" : 11308,
    "schema_hash" : 700967178,
    "compact_type" : ""
}
```
タブレットが存在し、タブレットが実行中の場合、JSON形式が返されます：

```
{
    "status" : "Success",
    "run_status" : true,
    "msg" : "this tablet_id is running",
    "tablet_id" : 11308,
    "schema_hash" : 700967178,
    "compact_type" : "cumulative"
}
```
結果の説明:

* run_status: 現在の手動コンパクションタスクの実行ステータスを取得します。

### 例

```
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=cumulative"
```
