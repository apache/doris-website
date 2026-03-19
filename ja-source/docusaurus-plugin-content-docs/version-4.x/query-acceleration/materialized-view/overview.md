---
{
  "title": "マテリアライズドビューの概要",
  "description": "マテリアライズドビューは、計算ロジックとデータの両方を含むエンティティです。ビューとは異なり、",
  "language": "ja"
}
---
Materialized viewsは、計算ロジックとデータの両方を含むエンティティです。計算ロジックのみを含み、データ自体を格納しないviewsとは異なり、materialized viewsはデータを格納します。

## Materialized Viewsのユースケース

Materialized viewsは、SQL定義に基づいてデータを計算・格納し、ポリシーに従って定期的またはリアルタイムで更新されます。直接クエリすることも、透過的なクエリ書き換えに使用することも可能です。以下のシナリオで適用できます：

### クエリアクセラレーション

BIレポートやad-hocクエリなどの意思決定支援システムでは、これらの分析クエリは多くの場合集約操作を伴い、複数tableのjoinが含まれることがあります。このようなクエリの結果計算はリソース集約的で、応答時間が数分に達する場合がありますが、ビジネスシナリオでは秒レベルの応答が求められることが多いため、materialized viewsを構築して一般的なクエリを高速化できます。

### 軽量ETL（データモデリング）

データ階層化シナリオでは、ネストされたmaterialized viewsを使用してDWD層とDWM層を構築し、materialized viewsのスケジューリングとリフレッシュ機能を活用できます。

### レイクハウス統合

複数の外部データソースに対して、これらのデータソースが使用するtable用にmaterialized viewsを構築することで、外部tableから内部tableへのインポートコストを節約し、クエリプロセスを高速化できます。

## Materialized Viewsの分類

### データの適時性による分類：同期vs非同期

- 同期materialized viewsは、ベースtableデータとの強い整合性を維持する必要があります。

- 非同期materialized viewsは、ベースtableデータとの結果整合性を維持し、ある程度の遅延が生じる場合があります。これらは通常、データの適時性が重要でないシナリオで使用され、多くの場合T+1や時間単位のデータを使用してmaterialized viewsを構築します。高い適時性が必要な場合は、同期materialized viewsの使用を検討してください。

現在、同期materialized viewsは直接クエリをサポートしていませんが、非同期materialized viewsはサポートしています。

### 透過的書き換えをサポートするSQLモードによる分類：単一Tablevs複数table

Materialized viewのSQL定義には、単一tableクエリまたは複数tableクエリを含めることができます。使用されるtable数の観点から、materialized viewsは単一tableまたは複数tableのmaterialized viewsとして分類できます。

- 非同期materialized viewsの場合、単一tableと複数tableの両方を使用できます。

- 同期materialized viewsの場合、単一tableのみ使用できます。

### Materialized Viewリフレッシュによる分類：フルリフレッシュvsパーティション増分リフレッシュvsリアルタイムリフレッシュ

**非同期Materialized Viewsの場合**

- フルリフレッシュ：materialized viewのSQL定義の全データを計算します。

- パーティション増分リフレッシュ：materialized viewのベースtableのパーティションデータが変更された場合、変更に対応するmaterialized viewのパーティションを特定し、それらのパーティションのみをリフレッシュすることで、materialized view全体をリフレッシュすることなくパーティション増分リフレッシュを実現します。

**同期Materialized Viewsの場合**

- リアルタイムリフレッシュとして理解でき、ベースtableデータとの整合性を維持します。
