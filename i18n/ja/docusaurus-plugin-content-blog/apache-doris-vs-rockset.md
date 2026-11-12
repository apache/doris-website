---
{
  "title": "Apache Doris が Rockset に代わる最適なオープンソース製品である理由",
  "summary": "Rockset の代替を掲げる多くの製品の中で、Apache Doris は主要機能をすべて備えた数少ない製品の一つです。",
  "description": "Rockset の代替を掲げる多くの製品の中で、Apache Doris は主要機能をすべて備えた数少ない製品の一つです。",
  "date": "2024-06-24",
  "author": "velodb.io · Zaki Lu, Apache Doris Committer",
  "tags": [
    "Tech Sharing"
  ],
  "externalLink": "https://www.velodb.io/blog/567",
  "image": "/images/doris-vs-rockset.jpeg"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

OpenAI は [Rockset の買収](https://openai.com/index/openai-acquires-rockset/)を発表し、データ業界に大きな反響をもたらしました。クラウド型のフルマネージド分析データベースの買収を祝う声とともに、ある疑問も浮かびます。 **なぜ [Rockset](https://rockset.com)**なのでしょうか。

![OpenAI による Rockset の買収](/images/openai-twitter-rockset.png)

Rockset は Meta の元エンジニアリングディレクター Venkat Venkataramani が 2016 年に設立し、リアルタイム検索とデータ分析に注力しています。他の DBMS と比べた特徴は次のとおりです。

- **リアルタイムのデータ更新**：最新データの取得と配信により鮮度を保ち、フィールド単位の更新をミリ秒単位で実行できます。

- **統合インデックス**：転置インデックス、列指向ストレージ、行指向ストレージの利点を組み合わせ、効率的で柔軟なクエリを提供します。

- **半構造化データのネイティブサポート**：半構造化データ処理、ハッシュ結合、ネストループ結合への需要に対応します。

- **SQL と JOIN の互換性**：検索インデックスがさまざまな結合クエリ向けに最適化されています。

一方、この発表により Rockset の利用者は、各自の用途に適した代替製品を三か月以内に見つける必要に迫られました。他の分析データベースにとっては好機ですが、上記の主要機能をすべて備える製品は多くありません。その一つが Apache Doris です。

オープンソースのリアルタイムデータウェアハウスである Apache Doris は、世界で 4000 社以上に利用され、次の機能を提供しています。

- **リアルタイムのデータ更新**：Apache Doris は [リアルタイム更新](https://doris.apache.org/docs/table-design/data-model/unique) と削除に加え、一部の列だけを更新する機能も備え、頻繁にデータが変わる用途に適しています。

- **行・列ハイブリッドストレージ**：Apache Doris は列指向のデータウェアハウスであり、 [ClickBench](https://benchmark.clickhouse.com/)で優れた OLAP 性能を実現しています。さらに行指向ストレージにより、 [高並列のポイントクエリ](https://doris.apache.org/docs/query/high-concurrent-point-query/)にも対応し、ほぼ百万件のクエリ要求にミリ秒単位で応答できます。

- **[転置インデックス](https://doris.apache.org/docs/table-design/index/inverted-index) と全文検索**：すべてのフィールドにインデックスを作成でき、フィールドを柔軟に組み合わせて多次元分析と効率的なキーワード検索を実行できます。

- **半構造化データのネイティブサポート**：Apache Doris が導入した [VARIANT](https://doris.apache.org/docs/sql-manual/sql-types/Data-Types/VARIANT) データ型は、低コストのストレージ上で柔軟なスキーマと高速クエリを実現します。従来の JSON 処理と比較して、10 倍の性能向上を得られる場合があります。

- **多様な SQL と [結合操作のサポート](https://doris.apache.org/docs/query/join-optimization/doris-join-optimization)**：MySQL の構文とインターフェースに高い互換性があり、INNER JOIN、CROSS JOIN、各種 OUTER JOIN を利用できます。データ型に応じた自動最適化により、さまざまな状況で適切な性能を引き出します。

Apache ソフトウェア財団のトップレベルプロジェクトとして、Apache Doris は成長を続けるコミュニティに支えられています。原文の公開時点では GitHub Star が 11.8K を超え、636 人のコントリビューターが参加しています。

Apache Doris は Rockset の優れたオープンソース代替製品です。ご相談は dev@doris.apache.org までお寄せください。
