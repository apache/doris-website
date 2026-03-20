---
{
  "title": "データの修復",
  "language": "ja",
  "description": "Unique Key Merge on Writeテーブルについて、一部のDorisバージョンにバグがあり、システムがdelete bitmapを計算する際にエラーが発生する可能性があります。"
}
---
# データの修復

Unique Key Merge on Writeテーブルについて、一部のDorisバージョンにバグがあり、システムがdelete bitmapを計算する際にエラーが発生し、主キーの重複を引き起こす可能性があります。この場合、full compaction機能を使用してデータを修復できます。この機能はUnique Key Merge on Write以外のテーブルでは無効です。

この機能にはDorisバージョン2.0+が必要です。

この機能を使用するには、可能な限りインポートを停止する必要があります。そうでなければ、インポートタイムアウトなどの問題が発生する可能性があります。

## 簡単な原理説明

full compactionの実行後、delete bitmapが再計算され、間違ったdelete bitmapデータが削除されてデータ復旧が完了します。

## 使用方法

`POST /api/compaction/run?tablet_id={int}&compact_type=full`

または

`POST /api/compaction/run?table_id={int}&compact_type=full`

tablet_idとtable_idは一つのみ指定可能で、同時に指定することはできません。table_idを指定した後、このテーブル下のすべてのタブレットに対してfull_compactionが自動的に実行されます。

## 使用例

```
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=full"
curl -X POST "http://127.0.0.1:8040/api/compaction/run?table_id=10104&compact_type=full"
```
