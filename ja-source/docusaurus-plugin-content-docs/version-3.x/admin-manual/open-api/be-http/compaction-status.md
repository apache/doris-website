---
{
  "title": "ビュー圧縮ステータス",
  "language": "ja",
  "description": "BEノードの全体的なコンパクション状況と指定されたタブレットのコンパクション状況を確認するために使用されます。"
}
---
# View Compaction Status

## Request

`GET /api/compaction/run_status`
`GET /api/compaction/show?tablet_id={int}`

## 詳細

BEノードの全体的なcompactionステータスと指定されたtabletのcompactionステータスを表示するために使用されます。

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
この構造は、特定のデータディレクトリでcompactionタスクを実行しているタブレットのidと、compactionの種類を表しています。

### タブレットのcompactionステータスを指定する

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
* cumulative point: baseコンパクションとcumulativeコンパクション間のバージョン境界。ポイント以前（ポイントを除く）のバージョンはbaseコンパクションで処理される。ポイント以降（ポイントを含む）のバージョンはcumulativeコンパクションで処理される。
* last cumulative failure time: 最後のcumulativeコンパクションが失敗した時刻。デフォルトでは10分後に、このタブレットでcumulativeコンパクションが再度試行される。
* last base failure time: 最後のbaseコンパクションが失敗した時刻。デフォルトでは10分後に、このタブレットでbaseコンパクションが再度試行される。
* rowsets: このタブレットの現在のrowsetコレクション。[0-48]はバージョン0-48のrowsetを意味する。2番目の数値はrowset内のセグメント数である。DELETEは削除バージョンを示す。OVERLAPPINGとNONOVERLAPPINGはセグメント間のデータが重複しているかどうかを示す。
* missing_rowset: 不足しているrowset。
* stale version path: タブレット内で現在マージされているrowsetコレクションのマージされたバージョンパス。これは配列構造で、各要素はマージされたパスを表す。各要素には3つの属性が含まれる：path idはバージョンパスidを示し、last create timeはそのパス上の最新rowsetの作成時刻を示す。デフォルトでは、このパス上のすべてのrowsetは最後の作成時刻から30分後に削除される。

## Examples

```
curl http://192.168.10.24:8040/api/compaction/show?tablet_id=10015
```
