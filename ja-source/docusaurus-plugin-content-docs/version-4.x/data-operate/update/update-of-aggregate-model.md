---
{
  "title": "Aggregate Key Model でのデータ更新",
  "description": "このドキュメントでは、主にデータロードに基づいてDoris Aggregateモデルを更新する方法について説明します。",
  "language": "ja"
}
---
このドキュメントでは、主にデータロードに基づいてDoris Aggregateモデルを更新する方法を紹介します。

## 全行更新

Stream Load、Broker Load、Routine Load、Insert Intoなど、Dorisでサポートされている方法を使用してAggregateモデルtableにデータをロードする場合、新しい値は列の集約関数に従って古い値と集約され、新しい集約値が生成されます。この値は挿入時または非同期コンパクション中に生成される場合がありますが、ユーザーはクエリ時に同じ戻り値を取得します。

## 部分列更新

Aggregate Key ModelTableの部分列更新に関する詳細情報（table作成、データ挿入例、使用上の注意など）については、[Partial Column アップデート](./partial-column-update.md#partial-column-update-for-aggregate-key-model)を参照してください。
