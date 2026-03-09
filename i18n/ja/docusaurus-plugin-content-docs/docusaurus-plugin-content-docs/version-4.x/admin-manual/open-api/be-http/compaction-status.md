---
{
  "title": "ビューコンパクション状況",
  "language": "ja",
  "description": "BEノードの全体的なcompaction状況と指定されたtabletのcompaction状況を表示するために使用されます。"
}
---
# View Compaction Status

## Request

`GET /api/compaction/run_status`
`GET /api/compaction/show?tablet_id={int}`

## Description

BEノードの全体的なcompaction状況と指定されたtabletのcompaction状況を表示するために使用されます。

## Query parameters

* `tablet_id`
    tabletのID

## Request body

なし

## Response

### ノードの全体的なcompaction状況

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
この構造は、特定のデータディレクトリでcompactionタスクを実行しているタブレットのidと、compactionの種類を表します。

### タブレットのcompaction状態を指定する

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

* cumulative policy type: 現在のタブレットで使用されている累積コンパクションポリシータイプ。
* cumulative point: baseコンパクションとcumulativeコンパクションの間のバージョン境界。ポイントより前（ポイントを除く）のバージョンはbaseコンパクションによって処理される。ポイント以降（ポイントを含む）のバージョンはcumulativeコンパクションによって処理される。
* last cumulative failure time: 最後のcumulativeコンパクションが失敗した時刻。デフォルトでは10分後に、このタブレットでcumulativeコンパクションが再度試行される。
* last base failure time: 最後のbaseコンパクションが失敗した時刻。デフォルトでは10分後に、このタブレットでbaseコンパクションが再度試行される。
* rowsets: このタブレットの現在のrowsetsコレクション。[0-48]はバージョン0-48のrowsetを意味する。2番目の数字はrowset内のセグメント数。DELETEは削除バージョンを示す。OVERLAPPINGとNONOVERLAPPINGはセグメント間のデータが重複するかどうかを示す。
* missing_rowset: 欠損しているrowsets。
* stale version path: タブレット内で現在マージされているrowsetコレクションのマージされたバージョンパス。配列構造であり、各要素はマージされたパスを表す。各要素は3つの属性を含む：path idはバージョンパスIDを示し、last create timeはそのパス上の最新のrowsetの作成時刻を示す。デフォルトでは、このパス上のすべてのrowsetsは最終作成時刻から30分後に削除される。

## Examples

```
curl http://192.168.10.24:8040/api/compaction/show?tablet_id=10015
```
