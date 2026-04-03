---
{
  "title": "ビューコンパクション状況",
  "language": "ja",
  "description": "BEノードの全体的なcompaction状況と、指定されたtabletのcompaction状況を表示するために使用されます。"
}
---
# View Compaction Status

## Request

`GET /api/compaction/run_status`
`GET /api/compaction/show?tablet_id={int}`

## 詳細

BEノードの全体的なcompactionステータスと、指定されたtabletのcompactionステータスを表示するために使用されます。

## Query parameters

* `tablet_id`
    tabletのID

## Request body

なし

## Response

### ノードの全体的なcompactionステータス

```
{
  "CumulativeCompaction": {
         "/home/disk1" : [10001, 10002],
         "/home/disk2" : [10003]
  },
  "BaseCompaction": {
         "/home/disk1" : [10001, 10002],
         "/home/disk2" : [10003]
  }
}
```
この構造体は、特定のデータディレクトリでコンパクションタスクを実行しているタブレットのidと、コンパクションの種類を表します。

### タブレットのコンパクション状態を指定する

```
{
    "cumulative policy type": "SIZE_BASED",
    "cumulative point": 50,
    "last cumulative failure time": "2019-12-16 18:13:43.224",
    "last base failure time": "2019-12-16 18:13:23.320",
    "last cumu success time": ,
    "last base success time": "2019-12-16 18:11:50.780",
    "rowsets": [
        "[0-48] 10 DATA OVERLAPPING 574.00 MB",
        "[49-49] 2 DATA OVERLAPPING 574.00 B",
        "[50-50] 0 DELETE NONOVERLAPPING 574.00 B",
        "[51-51] 5 DATA OVERLAPPING 574.00 B"
    ],
    "missing_rowsets": [],
    "stale version path": [
        {
            "path id": "2",
            "last create time": "2019-12-16 18:11:15.110 +0800",
            "path list": "2-> [0-24] -> [25-48]"
        }, 
        {
            "path id": "1",
            "last create time": "2019-12-16 18:13:15.110 +0800",
            "path list": "1-> [25-40] -> [40-48]"
        }
    ]
}
```
結果の説明:

* cumulative policy type: 現在のタブレットで使用されているcumulative compactionのポリシータイプ。
* cumulative point: baseとcumulative compaction間のバージョン境界。ポイントより前（除く）のバージョンはbase compactionで処理されます。ポイント以降（含む）はcumulative compactionで処理されます。
* last cumulative failure time: 最後にcumulative compactionが失敗した時刻。デフォルトでは10分後に、このタブレットでcumulative compactionが再度試行されます。
* last base failure time: 最後にbase compactionが失敗した時刻。デフォルトでは10分後に、このタブレットでbase compactionが再度試行されます。
* rowsets: このタブレットの現在のrowsetsコレクション。[0-48]はバージョン0-48のrowsetを意味します。2番目の数字はrowset内のセグメント数です。DELETEは削除バージョンを示します。OVERLAPPINGとNONOVERLAPPINGはセグメント間のデータが重複しているかどうかを示します。
* missing_rowset: 欠落しているrowsets。
* stale version path: タブレット内で現在マージされているrowsetコレクションのマージされたバージョンパス。これは配列構造で、各要素はマージされたパスを表します。各要素には3つの属性があります：path idはバージョンパスIDを示し、last create timeはパス上の最新rowsetの作成時刻を示します。デフォルトでは、このパス上のすべてのrowsetsはlast create timeの30分後に削除されます。

## Examples

```
curl http://192.168.10.24:8040/api/compaction/show?tablet_id=10015
```
