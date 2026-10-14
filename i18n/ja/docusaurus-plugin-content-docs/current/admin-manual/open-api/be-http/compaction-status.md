---
{
    "title": "コンパクション状態の確認",
    "language": "ja",
    "description": "BE ノード全体のコンパクション状態と、指定したタブレットのコンパクション状態を確認します。"
}
---

# コンパクション状態の確認

## リクエスト

`GET /api/compaction/run_status`
`GET /api/compaction/show?tablet_id={int}`

## 説明

BE ノード全体のコンパクション状態と、指定したタブレットのコンパクション状態を確認します。

## クエリパラメータ

* `tablet_id`
    タブレットの ID

## リクエストボディ

なし

## レスポンス

### ノード全体のコンパクション状態

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

この構造は、各データディレクトリでコンパクションを実行中のタブレット ID と、コンパクションの種類を示します。

### 指定したタブレットのコンパクション状態

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

結果の説明：

* cumulative policy type: 現在のタブレットで使用されている累積コンパクションポリシーの種類です。
* cumulative point: ベースコンパクションと累積コンパクションの対象となるバージョンの境界です。このポイントより前のバージョン（ポイント自体を含まない）はベースコンパクションで処理され、ポイント以降のバージョン（ポイント自体を含む）は累積コンパクションで処理されます。
* last cumulative failure time: 最後に累積コンパクションが失敗した時刻です。デフォルトでは、10 分後にこのタブレットで累積コンパクションが再試行されます。
* last base failure time: 最後にベースコンパクションが失敗した時刻です。デフォルトでは、10 分後にこのタブレットでベースコンパクションが再試行されます。
* rowsets: このタブレットの現在の rowset の集合です。[0-48] はバージョン 0-48 の rowset を表します。二番目の数値は rowset 内のセグメント数です。DELETE は削除バージョンを示します。OVERLAPPING と NONOVERLAPPING は、セグメント間のデータが重複しているかどうかを示します。
* missing_rowset: 欠落している rowset です。
* stale version path: タブレット内で現在マージされている rowset の集合のマージ済みバージョンパスです。配列形式で、各要素が一つのマージ済みパスを表します。各要素には三つの属性が含まれます。path id はバージョンパスの ID、last create time はそのパスで最後に作成された rowset の作成時刻を示します。デフォルトでは、このパス上のすべての rowset は、最後の作成時刻から半時間が経過すると削除されます。

## 例

```
curl http://192.168.10.24:8040/api/compaction/show?tablet_id=10015
```
