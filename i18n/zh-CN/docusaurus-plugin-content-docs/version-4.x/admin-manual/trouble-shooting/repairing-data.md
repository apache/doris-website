---
{
    "title": "数据修复",
    "language": "zh-CN",
    "description": "对于 Unique Key Merge on Write 表，在某些 Doris 的版本中存在 Bug，可能会导致系统在计算 Delete Bitmap 时出现错误，导致出现重复主键，此时可以利用 Full Compaction 功能进行数据的修复。"
}
---

对于 Unique Key Merge on Write 表，在某些 Doris 的版本中存在 Bug，可能会导致系统在计算 Delete Bitmap 时出现错误，导致出现重复主键，此时可以利用 Full Compaction 功能进行数据的修复。本功能对于非 Unique Key Merge on Write 表无效。

该功能需要 Doris 版本 2.0+。

使用该功能，需要尽可能停止导入，否则可能会出现导入超时等问题。

## 简要原理说明

执行 Full Compaction 后，会对 Delete Bitmap 进行重新计算，将错误的 Delete Bitmap 数据删除，以完成数据的修复。

## 使用说明

`POST /api/compaction/run?tablet_id={int}&compact_type=full`

或

`POST /api/compaction/run?table_id={int}&compact_type=full`

注意，`tablet_id` 和 `table_id` 只能指定一个，不能够同时指定，指定 `table_id` 后会自动对此 table 下所有 tablet 执行 `full_compaction`。

## 使用例子

```shell
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=full"
curl -X POST "http://127.0.0.1:8040/api/compaction/run?table_id=10104&compact_type=full"
```