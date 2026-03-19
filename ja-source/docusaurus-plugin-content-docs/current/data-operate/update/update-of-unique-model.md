---
{
  "title": "一意キーモデルでのデータ更新",
  "language": "ja",
  "description": "この文書では、様々なロード方法を使用してDoris unique keyモデルのデータを更新する方法を紹介します。"
}
---
この文書では、様々なロード方法を使用してDorisiqueキーモデルのデータを更新する方法を紹介します。

## 全行更新

Stream Load、Broker Load、Routine Load、Insert Intoなど、Dorisでサポートされている方法を使用してunique keyモデルにデータをロードする際、既存のプライマリキーデータ行が存在しない場合は新しいデータが挿入されます。既存のプライマリキーデータ行が存在する場合は更新されます。これは、Dorisiqueキーモデルでのロード操作が「upsert」モードで動作することを意味します。既存のレコードを更新するプロセスは、デフォルトでは新しいレコードをロードするのと同じであるため、詳細についてはデータロードのドキュメントを参照してください。

## 部分列更新

Unique Key Modelテーブルの部分列更新に関する詳細情報（使用例、柔軟な部分列更新、新しい行の処理を含む）については、[Partial Column アップデート](./partial-column-update.md#partial-column-update-for-unique-key-model)を参照してください。
