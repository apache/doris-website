---
{
  "title": "データの修復",
  "language": "ja",
  "description": "Unique Key Merge on Writeテーブルについて、一部のDorisバージョンにはバグがあり、システムがdelete bitmapを計算する際にエラーが発生する可能性があります。"
}
---
# データ修復

Unique Key Merge on Write テーブルの場合、一部の Doris バージョンにバグがあり、システムが delete bitmap を計算する際にエラーが発生し、主キーの重複を引き起こす可能性があります。この場合、full compaction 機能を使用してデータを修復できます。この機能は非 Unique Key Merge on Write テーブルでは無効です。

この機能には Doris バージョン 2.0+ が必要です。

この機能を使用するには、可能な限りインポートを停止する必要があります。そうしないと、インポートタイムアウトなどの問題が発生する可能性があります。

## 概要説明

full compaction が実行された後、delete bitmap が再計算され、間違った delete bitmap データが削除されてデータ復元が完了します。

## 使用方法

`POST /api/compaction/run?tablet_id={int}&compact_type=full`

または

`POST /api/compaction/run?table_id={int}&compact_type=full`

tablet_id と table_id のうち一つだけを指定でき、同時に指定することはできないことに注意してください。table_id を指定した後、このテーブル下のすべてのタブレットに対して full_compaction が自動的に実行されます。

## 使用例

```
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=full"
curl -X POST "http://127.0.0.1:8040/api/compaction/run?table_id=10104&compact_type=full"
```
