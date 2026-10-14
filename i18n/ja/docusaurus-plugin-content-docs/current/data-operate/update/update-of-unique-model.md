---
{
    "title": "Unique Key モデルのロードによる更新",
    "language": "ja",
    "description": "Stream Load や Routine Load などのロード方式を使って、Doris の Unique（主キー）モデルのデータを更新する方法。行全体の Upsert と部分列更新をサポートします。"
}
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenarios: Data update / Real-time write / Unique model Upsert -->

リアルタイムデータウェアハウスや業務データベースの同期では、次のような課題がよくあります。

- 業務テーブルのデータを主キーに基づいて継続的に更新する必要がある（注文ステータスの変更やユーザープロファイルの更新など）。書き込み時には「挿入」か「更新」かを自動的に判定したい。
- 一部のフィールドだけが変わる（例えば注文の `status` のみ）。毎回、行全体のデータを組み立てるのは避けたい。

このような場合、Doris の Unique（主キー）モデルでは、ロードを使った二つの更新方法である**行全体の更新**と**部分列更新**を使用できます。この文書では両方の方法を説明します。

## 行全体の更新

<!-- Knowledge type: Capability definition -->

Doris の Unique モデルへのロードは **Upsert** モードで動作します。新しいデータを書き込むと、Doris は主キーに基づいて「挿入」か「更新」かを自動的に判定します。

| 場面 | 動作 |
| --- | --- |
| 主キーが存在しない | 新しいデータ行を挿入する |
| 主キーがすでに存在する | 既存のデータ行を新しいデータで上書きする |

サポートされるロード方式は次のとおりです。

- Stream Load
- Broker Load
- Routine Load
- Insert Into

> 行全体の更新は、新しいレコードのロードと同じです。詳しい使い方は、[データのロード](../import/import-way/stream-load-manual.md)のドキュメントを参照してください。

## 部分列更新

<!-- Knowledge type: Capability definition -->

一部のフィールドだけを更新する場合、Unique モデルの部分列更新機能を使うと、行全体のデータを組み立てずに済みます。詳しい情報（使用例、柔軟な部分列更新、新しい行の扱いなど）は、[列更新](./partial-column-update.md#column-update-on-the-unique-key-model)のドキュメントを参照してください。
