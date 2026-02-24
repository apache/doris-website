---
{
    "title": "查看 Compaction 状态",
    "language": "zh-CN",
    "description": "用于查看某个 BE 节点总体的 compaction 状态，或者指定 tablet 的 compaction 状态。"
}
---

## 请求路径

`GET /api/compaction/run_status`
`GET /api/compaction/show?tablet_id={int}`

## 描述

用于查看某个 BE 节点总体的 compaction 状态，或者指定 tablet 的 compaction 状态。

## 请求参数

* `tablet_id`

    - tablet 的 id

## 请求体

无

## 响应

### 整体 Compaction 状态

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

该结构表示某个数据目录下，正在执行 compaction 任务的 tablet 的 id，以及 compaction 的类型。

### 指定 tablet 的 Compaction 状态

```json
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

结果说明：

* cumulative policy type：当前 tablet 所使用的 cumulative compaction 策略。

* cumulative point：base 和 cumulative compaction 的版本分界线。在 point（不含）之前的版本由 base compaction 处理。point（含）之后的版本由 cumulative compaction 处理。

* last cumulative failure time：上一次尝试 cumulative compaction 失败的时间。默认 10min 后才会再次尝试对该 tablet 做 cumulative compaction。

* last base failure time：上一次尝试 base compaction 失败的时间。默认 10min 后才会再次尝试对该 tablet 做 base compaction。

* rowsets：该 tablet 当前的 rowset 集合。如 [0-48] 表示 0-48 版本。第二位数字表示该版本中 segment 的数量。`DELETE` 表示 delete 版本。`DATA` 表示数据版本。`OVERLAPPING` 和 `NONOVERLAPPING` 表示 segment 数据是否重叠。

* missing_rowsets: 缺失的版本。

* stale version path：该 table 当前被合并 rowset 集合的合并版本路径，该结构是一个数组结构，每个元素表示一个合并路径。每个元素中包含了三个属性：path id 表示版本路径 id，last create time 表示当前路径上最近的 rowset 创建时间，默认在这个时间半个小时之后这条路径上的所有 rowset 会被过期删除。

## 示例

```shell
curl http://192.168.10.24:8040/api/compaction/show?tablet_id=10015
```
