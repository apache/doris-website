---
{
    "title": "データの修復",
    "language": "ja",
    "description": "Unique Key Merge on Write テーブルでは、Doris の一部のバージョンに不具合があり、システムによる delete bitmap の計算でエラーが発生する場合があります。"
}
---

# データの修復

Unique Key Merge on Write テーブルでは、Doris の一部のバージョンに不具合があり、システムによる delete bitmap の計算でエラーが発生して主キーが重複する場合があります。この場合、full compaction 機能を使用してデータを修復できます。この機能は Unique Key Merge on Write 以外のテーブルには効果がありません。

この機能を使用するには、Doris 2.0 以降が必要です。

この機能を使用する際は、可能な限りデータのインポートを停止してください。停止しないと、インポートのタイムアウトなどの問題が発生する可能性があります。

## 仕組みの概要

full compaction を実行すると、delete bitmap が再計算され、誤った delete bitmap データが削除されて、データが修復されます。

## 使用方法

`POST /api/compaction/run?tablet_id={int}&compact_type=full`

または

`POST /api/compaction/run?table_id={int}&compact_type=full`

tablet_id と table_id はどちらか一方のみ指定でき、同時には指定できません。table_id を指定すると、このテーブルに属するすべての tablet に対して full_compaction が自動的に実行されます。

## 使用例

```
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=full"
curl -X POST "http://127.0.0.1:8040/api/compaction/run?table_id=10104&compact_type=full"
```
