---
title: ブログを共有する方法
language: ja
description: "Apache Doris コミュニティに技術ブログを共有する方法：推奨される内容、投稿方法、公開までの流れ。"
keywords:
    - Apache Doris
    - 技術ブログの投稿
    - Doris ブログ
    - コミュニティへの貢献
    - 技術情報の共有
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

<!-- Knowledge type: Procedure -->
<!-- Use case: Blog submission / community content contribution -->

Doris コミュニティでは、Doris に関する技術記事を歓迎しています。記事がマージされると、Doris の Web サイトに掲載されます。このページでは、推奨される記事の内容、投稿方法、貢献の手順を説明します。

## 推奨される記事の内容

記事の内容には、次のようなテーマが含まれます。これらに限定されるものではありません。

| テーマ | トピックの例 |
| --- | --- |
| Doris の活用方法 | 効率的なデータ取り込み、クエリのチューニング、運用の実践例 |
| Doris の機能紹介 | マテリアライズドビュー、転置インデックス、レイクハウス機能 |
| Doris のシステムチューニング | FE / BE パラメータのチューニング、JVM の最適化 |
| Doris の内部動作の解説 | クエリの実行、ストレージ形式、コンパクションの仕組み |
| Doris のビジネスシナリオでの活用 | ユーザー行動分析、ログ検索、リアルタイムレポートの実践例 |

## 投稿の手順

<!-- Knowledge type: Procedure -->

1. ブログの Markdown ファイルを用意し、`/blog` ディレクトリ（[apache/doris-website](https://github.com/apache/doris-website) リポジトリ内）に配置します。
2. [ドキュメントの書式規約](./docs-format-specification) に従って本文を整えます。コードフェンス、画像の代替テキスト、中国語と英語の文字間のスペースなどの規約を適用してください。
3. リポジトリのルートにある README と関連する索引を確認し、ブログの項目を追加する必要があるか判断します。
4. ブログのテーマと著者情報を記載して、`apache/doris-website` に Pull Request を提出します。
5. コミュニティの Committer によるレビューを待ち、フィードバックに応じて修正した後、main ブランチにマージします。

リポジトリの最新情報と手順については、[apache/doris-website の README](https://github.com/apache/doris-website) を参照してください。

## 関連ドキュメント

- [ドキュメント貢献ガイド](./contribute-doc)
- [ドキュメントの書式規約](./docs-format-specification)
