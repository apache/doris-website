---
{
  "title": "集約キーモデルでのデータ更新",
  "language": "ja",
  "description": "この文書では主に、データロードに基づくDoris Aggregateモデルの更新方法について紹介します。"
}
---
このドキュメントでは、主にデータロードに基づいてDoris Aggregateモデルを更新する方法について説明します。

## 行全体の更新

Stream Load、Broker Load、Routine Load、Insert Intoなど、Dorisがサポートする方法を使用してAggregateモデルテーブルにデータをロードする際、新しい値は列の集約関数に従って古い値と集約され、新しい集約値が生成されます。この値は挿入時または非同期コンパクション中に生成される場合がありますが、ユーザーがクエリする際には同じ戻り値を取得できます。

## 部分列更新

Aggregate Key Modelテーブルの部分列更新に関する詳細情報（テーブル作成、データ挿入例、使用上の注意事項を含む）については、[Partial Column Update](./partial-column-update.md#partial-column-update-for-aggregate-key-model)を参照してください。
