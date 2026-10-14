---
{
    "title": "コンパクションを手動で開始する",
    "language": "ja",
    "description": "POST /api/compaction/run?tableid={int}&compacttype=full tableid=xxx は compacttype=full が指定されている場合にのみ有効になります。"
}
---

# コンパクションを手動で開始する

## リクエスト

`POST /api/compaction/run?tablet_id={int}&compact_type={enum}`
`POST /api/compaction/run?table_id={int}&compact_type=full` table_id=xxx は compact_type=full が指定されている場合にのみ有効になります。
`GET /api/compaction/run_status?tablet_id={int}`


## 説明

コンパクションを手動で開始し、そのステータスを表示するために使用します。

## クエリパラメータ

* `tablet_id`
    - タブレットの ID。

* `table_id`
    - テーブルの ID。table_id=xxx は compact_type=full が指定されている場合にのみ有効です。tablet_id と table_id のうち指定できるのはいずれか一方のみで、同時に指定することはできません。table_id を指定すると、このテーブルに属するすべてのタブレットに対して full_compaction が自動的に実行されます。

* `compact_type`
    - 値は `base`、`cumulative`、`full` のいずれかです。full_compaction の使用場面については、[データの復旧](../../trouble-shooting/repairing-data)を参照してください。

## リクエストボディ

なし

## レスポンス

### コンパクションの開始

タブレットが存在しない場合、JSON 形式のエラーが返されます。

```
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```

タブレットが存在し、稼働していない場合、次の JSON が返されます。

```
{
    "status": "Fail",
    "msg": "fail to execute compaction, error = -2000"
}
```

タブレットが存在し、稼働している場合、次の JSON が返されます。

```
{
    "status": "Success",
    "msg": "compaction task is successfully triggered."
}
```

結果の説明：

* status: タスクの開始結果です。正常に開始された場合は Success を返します。何らかの理由で開始できない場合（適切なバージョンを取得できない場合など）は Fail を返します。
* msg: 成功または失敗に関する具体的な情報を示します。

### ステータスの表示

タブレットが存在しない場合、JSON 形式のエラーが返されます。
```
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```
タブレットが存在し、稼働していない場合、次の JSON が返されます。

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

タブレットが存在し、稼働している場合、次の JSON が返されます。
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

結果の説明：

* run_status: 現在の手動コンパクションタスクの実行状態を示します。

### 使用例

```
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=cumulative"
```