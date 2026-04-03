---
{
  "title": "マテリアライズドビューの概要",
  "description": "マテリアライズドビューは、計算ロジックとデータの両方を含むエンティティです。ビューとは異なり、",
  "language": "ja"
}
---
Materialized viewsは、計算ロジックとデータの両方を含むエンティティです。計算ロジックのみを含み、データ自体を格納しないviewsとは異なり、materialized viewsはデータを格納します。

## Materialized Viewsのユースケース

Materialized viewsはSQL定義に基づいてデータを計算・格納し、ポリシーに従って定期的またはリアルタイムで更新されます。直接クエリすることも、透過的なクエリ書き換えに使用することも可能です。以下のシナリオで適用できます：

### クエリの高速化

BIレポートやアドホッククエリなどの意思決定支援システムにおいて、これらの分析クエリは集約操作を含むことが多く、複数tableの結合を含む場合があります。このようなクエリの結果計算はリソース集約的で、応答時間が数分に達する可能性がある一方、ビジネスシナリオでは秒レベルの応答が求められることが多いため、materialized viewsを構築して一般的なクエリを高速化できます。

### 軽量ETL（データモデリング）

データレイヤリングシナリオにおいて、ネストしたmaterialized viewsを使用してDWDおよびDWMレイヤーを構築し、materialized viewsのスケジューリングおよび更新機能を活用できます。

### レイクハウス統合

複数の外部データソースに対して、これらのデータソースが使用するtableのmaterialized viewsを構築することで、外部tableから内部tableへのインポートコストを削減し、クエリプロセスを高速化できます。

## Materialized Viewsの分類

### データ適時性による分類：同期 vs 非同期

- 同期materialized viewsは、ベースtableデータとの強い一貫性を維持する必要があります。

- 非同期materialized viewsは、ベースtableデータとの結果整合性を維持し、多少の遅延が生じる可能性があります。通常、データの適時性が重要でないシナリオで使用され、しばしばT+1または時間単位のデータを使用してmaterialized viewsを構築します。高い適時性が必要な場合は、同期materialized viewsの使用を検討してください。

現在、同期materialized viewsは直接クエリをサポートしておらず、非同期materialized viewsはサポートしています。

### 透過的書き換えをサポートするSQLモードによる分類：単一table vs 複数table

Materialized viewのSQL定義は、単一tableクエリまたは複数tableクエリを含むことができます。使用されるtable数の観点から、materialized viewsは単一tableまたは複数tableのmaterialized viewsとして分類できます。

- 非同期materialized viewsの場合、単一tableと複数tableの両方を使用できます。

- 同期materialized viewsの場合、単一tableのみ使用できます。

### Materialized View更新による分類：完全更新 vs パーティション増分更新 vs リアルタイム更新

**非同期Materialized Viewsの場合**

- 完全更新：materialized viewのSQL定義の全データを計算します。

- パーティション増分更新：materialized viewのベースtableのパーティションデータが変更された場合、変更に対応するmaterialized viewのパーティションを特定し、それらのパーティションのみを更新することで、materialized view全体を更新することなくパーティション増分更新を実現します。

**同期Materialized Viewsの場合**

- リアルタイム更新として理解でき、ベースtableデータとの一貫性を維持します。
