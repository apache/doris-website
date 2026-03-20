---
{
  "title": "非同期マテリアライズドビューの概要",
  "language": "ja",
  "description": "マテリアライズドビューは、効率的なソリューションとして、ビューの柔軟性と物理テーブルの高性能という利点を組み合わせます。"
}
---
Materialized Viewは効率的なソリューションとして、Viewの柔軟性と物理テーブルの高いパフォーマンス上の利点を組み合わせています。
クエリの結果セットを事前計算して格納することができ、
クエリリクエストが到着した際に、格納されたmaterialized viewから直接結果を迅速に取得できるため、複雑なクエリ文の再実行のオーバーヘッドを回避できます。

## 使用例

- **クエリ高速化と並行性の向上**: Materialized Viewはクエリ速度を大幅に向上させ、同時にシステムの並行処理能力を向上させ、リソース消費を効果的に削減できます。
- **ETLプロセスの簡素化**: Extract、Transform、Load（ETL）プロセスにおいて、materialized viewはワークフローを簡素化し、開発効率を向上させ、データ処理をよりスムーズにできます。
- **レイクハウスアーキテクチャにおける外部テーブルクエリの高速化**: レイクハウスアーキテクチャにおいて、materialized viewは外部データソースのクエリ速度を大幅に向上させ、データアクセス効率を改善できます。
- **書き込み効率の向上**: リソース競合を削減することで、materialized viewはデータ書き込みプロセスを最適化し、書き込み効率を向上させ、データの一貫性と整合性を保証できます。

## 制限事項
- **非同期Materialized Viewとベーステーブルデータの一貫性**: 非同期materialized viewは最終的にベーステーブルデータと一貫性を保ちますが、リアルタイムで同期することはできないため、リアルタイム一貫性を維持することはできません。
- **Window Function クエリのサポート**: 現在、クエリにwindow functionが含まれている場合、そのクエリをmaterialized viewを利用するよう透過的に書き換えることはサポートされていません。
- **クエリテーブルより多くのテーブルを結合するMaterialized View**: Materialized viewで結合されるテーブル数がクエリに含まれるテーブル数を超える場合（例えば、クエリがt1とt2のみを含むが、materialized viewがt1、t2、および追加のt3を含む場合）、システムは現在、そのクエリをmaterialized viewを利用するよう透過的に書き換えることをサポートしていません。
- Materialized viewがUNION ALL、LIMIT、ORDER BY、CROSS JOINなどのセット操作を含む場合、materialized viewは正常に構築できますが、透過的な書き換えには使用できません。

## 原理の紹介

Materialized Viewは、データベースの高度な機能として、本質的にはMTMVタイプの内部テーブルとして機能します。Materialized viewを作成する際、システムは同時にリフレッシュタスクを登録します。このタスクは必要時に実行され、INSERT OVERWRITE文を実行して最新データをmaterialized viewに書き込みます。

**リフレッシュメカニズム**  
同期materialized viewが使用するリアルタイム増分リフレッシュとは異なり、非同期materialized viewはより柔軟なリフレッシュオプションを提供します。

- **完全リフレッシュ**:  
  このモードでは、システムはmaterialized viewのSQL定義に含まれるすべてのデータを再計算し、完全な結果をmaterialized viewに書き込みます。このプロセスにより、materialized view内のデータがベーステーブルデータと一貫性を保つことが保証されますが、より多くの計算リソースと時間を消費する可能性があります。

- **パーティション増分リフレッシュ**:  
  Materialized viewのベーステーブルのパーティションデータが変更された場合、システムはこれらの変更を智能的に識別し、影響を受けたパーティションのみをリフレッシュできます。このメカニズムにより、materialized viewのリフレッシュに必要な計算リソースと時間を大幅に削減しながら、最終的なデータ一貫性を保証します。

**透過的書き換え**:  
透過的書き換えは、データベースがクエリパフォーマンスを最適化するための重要な手段です。ユーザークエリを処理する際、システムは実行効率を向上させ、計算コストを削減するためにSQLを自動的に最適化および書き換えることができます。この書き換えプロセスはユーザーに対して透過的であり、介入を必要としません。

Dorisの非同期materialized viewは、SPJG（SELECT-PROJECT-JOIN-GROUP-BY）モデルに基づく透過的書き換えアルゴリズムを利用しています。このアルゴリズムはSQLの構造情報を深く分析し、透過的書き換えに適したmaterialized viewを自動的に検索および選択できます。複数のmaterialized viewが利用可能な場合、アルゴリズムは特定の戦略（コストモデルなど）に基づいてクエリSQLに応答するための最適なmaterialized viewを選択し、クエリパフォーマンスをさらに向上させます。

## Materialized Refresh Data Lakeのサポート

Materialized refresh data lakeのサポートは、テーブルタイプとcatalogによって異なります。

<table>
    <tr>
        <th rowspan="2">テーブルタイプ</th>
        <th rowspan="2">カタログタイプ</th>
        <th colspan="2">リフレッシュ方法</th>
        <th>トリガーリフレッシュ</th>
    </tr>
    <tr>
        <th>完全リフレッシュ</th>
        <th>パーティションリフレッシュ</th>
        <th>自動トリガー</th>
    </tr>
    <tr>
        <td>Internal table</td>
        <td>Internal</td>
        <td>2.1でサポート</td>
        <td>2.1でサポート</td>
        <td>2.1.4でサポート</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>2.1でサポート</td>
        <td>2.1でサポート</td>
        <td>サポートなし</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>2.1でサポート</td>
        <td>サポートなし</td>
        <td>サポートなし</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>2.1でサポート</td>
        <td>サポートなし</td>
        <td>サポートなし</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>2.1でサポート</td>
        <td>サポートなし</td>
        <td>サポートなし</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>2.1でサポート</td>
        <td>サポートなし</td>
        <td>サポートなし</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>2.1でサポート</td>
        <td>サポートなし</td>
        <td>サポートなし</td>
    </tr>
</table>

## Data Lakeの透過的書き換えサポート
現在、非同期materialized viewの透過的書き換え機能は以下のテーブルとcatalogタイプをサポートしています。

リアルタイムベーステーブルデータ認識：Materialized viewが使用する基盤テーブルデータの変更を検出し、クエリ時に最新データを利用する能力を指します。

<table>
    <tr>
        <th>テーブルタイプ</th>
        <th>カタログタイプ</th>
        <th>透過的書き換えサポート</th>
        <th>リアルタイムベーステーブルデータ認識</th>
    </tr>
    <tr>
        <td>Internal table</td>
        <td>Internal</td>
        <td>サポート</td>
        <td>サポート</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>サポート</td>
        <td>3.1でサポート</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>サポート</td>
        <td>3.1でサポート</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>サポート</td>
        <td>3.1でサポート</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>サポート</td>
        <td>3.1でサポート</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>サポート</td>
        <td>サポートなし</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>サポート</td>
        <td>サポートなし</td>
    </tr>
</table>

外部テーブルを使用するMaterialized viewは、デフォルトでは透過的書き換えに参加しません。外部テーブルデータの変更を検出できず、materialized view内のデータが最新であることを保証できないためです。
外部テーブルを含むmaterialized viewの透過的書き換えを有効にしたい場合は、`SET materialized_view_rewrite_enable_contain_external_table = true`を設定できます。

バージョン2.1.11以降、Dorisは外部テーブルの透過的書き換えパフォーマンスを最適化し、主に外部テーブルを含む利用可能なmaterialized viewの取得パフォーマンスを改善しています。

外部テーブルを含むパーティション化されたmaterialized viewで透過的書き換えが遅い場合は、fe.confで以下を設定する必要があります：
`max_hive_partition_cache_num = 20000`、Hive Metastoreテーブルレベルパーティションキャッシュの最大数、デフォルト値は10000です。
外部Hiveテーブルに多くのパーティションがある場合は、この値をより高く設定できます。

`external_cache_expire_time_minutes_after_access`、最後のアクセス後にキャッシュが期限切れになるまでの時間。デフォルトは10分、適度に増加させることができます。
（外部テーブルスキーマキャッシュとHiveメタデータキャッシュに適用）

`external_cache_refresh_time_minutes = 60`、外部テーブルメタデータキャッシュの自動リフレッシュ間隔。デフォルトは10分、適度に増加させることができます。この設定はバージョン3.1以降でサポートされています。
外部テーブルメタデータキャッシュ設定の詳細については、[メタデータキャッシュ](../../../lakehouse/meta-cache.md)を参照してください

## Materialized ViewとOLAP内部テーブルの関係

非同期materialized viewは、ベーステーブルのテーブルモデルを制限なしでSQL定義に使用でき、詳細モデル、プライマリキーモデル（merge-on-writeとmerge-on-read）、集約モデルなどが可能です。

Materialized viewの基盤実装はDuplicateモデルのOLAPテーブルに依存しており、理論的にはDuplicateモデルのすべてのコア機能をサポートできます。ただし、materialized viewが安定して効率的にデータリフレッシュタスクを実行できることを保証するため、機能に対して一連の必要な制限を課しています。具体的な制限は以下の通りです：

- Materialized viewのパーティションはベーステーブルに基づいて自動的に作成・維持されるため、ユーザーはmaterialized viewに対してパーティション操作を実行できません。
- Materialized viewの背後には処理が必要な関連ジョブ（JOB）があるため、DELETE TABLEやRENAME TABLEなどのコマンドはmaterialized viewの操作に使用できません。代わりに、これらの操作にはmaterialized view専用のコマンドを使用する必要があります。
- Materialized viewの列データ型は作成時に指定されたクエリ文に基づいて自動的に推論されるため、これらのデータ型は変更できません。そうでなければ、materialized viewのリフレッシュタスクの失敗につながる可能性があります。
- Materialized viewはDuplicateテーブルにはないいくつかのプロパティを持っており、これらのプロパティはmaterialized viewのコマンドを通じて変更する必要があります。他の一般的なプロパティはALTER TABLEコマンドを使用して変更する必要があります。

## その他の参考資料
非同期materialized viewの作成、クエリ、メンテナンスについては、[非同期Materialized Viewの作成、クエリ、メンテナンス](../async-materialized-view/functions-and-demands.md)を参照できます。

ベストプラクティスについては、[ベストプラクティス](../async-materialized-view/use-guide.md)を参照できます。

よくある質問については、[よくある質問](../async-materialized-view/faq.md)を参照できます。
