---
{
  "title": "Unique Key Model でのデータ更新",
  "description": "このドキュメントでは、様々なロード方法を使用してDoris unique keyモデルのデータを更新する方法を紹介します。",
  "language": "ja"
}
---
このドキュメントでは、様々な読み込み方法を使用してDorisのunique keyモデルでデータを更新する方法について紹介します。

## 全行更新

Stream Load、Broker Load、Routine Load、Insert Intoなど、Dorisがサポートする方法を使用してunique keyモデルにデータを読み込む際、既存のprimary keyデータ行が存在しない場合は新しいデータが挿入されます。既存のprimary keyデータ行が存在する場合は、それが更新されます。これは、Dorisのunique keyモデルでの読み込み操作が「upsert」モードで動作することを意味します。既存レコードを更新するプロセスは、デフォルトで新しいレコードを読み込むプロセスと同じであるため、詳細についてはデータ読み込みドキュメントを参照してください。

## 部分列更新

Unique Key ModelTableの部分列更新に関する詳細情報（使用例、柔軟な部分列更新、新規行の処理を含む）については、[Partial Column アップデート](./partial-column-update.md#partial-column-update-for-unique-key-model)を参照してください。
