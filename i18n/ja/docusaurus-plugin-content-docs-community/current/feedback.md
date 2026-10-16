---
title: 問題を報告する
language: ja
description: "Apache Doris のバグ報告や提案を送るための公式窓口（メーリングリストと GitHub Issue）と、分かりやすい報告を書くためのポイント。"
keywords:
    - Apache Doris の問題に関するフィードバック
    - Doris のバグ報告
    - Doris GitHub Issue
    - dev@doris.apache.org
    - Doris メーリングリストへのフィードバック
    - Issue の作成
    - 再現手順
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

# 問題に関するフィードバック

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Bug report / Feature suggestion / Usage question -->

Apache Doris の使用中にバグやパフォーマンスの問題を見つけた場合、または機能を提案したい場合は、メーリングリストまたは GitHub Issue を通じてコミュニティに報告できます。このページでは、二つの公式なフィードバック窓口と、分かりやすい報告に含めるべき主な情報を説明します。

## フィードバック窓口の一覧

問題の種類に応じて窓口を選んでください。

| 窓口 | 対象となる内容 | 送信先 |
|------|----------|------|
| メーリングリスト | 使い方に関する質問、設計に関する議論、コミュニティの話題 | `dev@doris.apache.org` にメールを送信（事前に購読が必要） |
| GitHub Issue | 再現可能なバグ、具体的な機能提案、ドキュメントの問題 | <https://github.com/apache/doris/issues/new/choose> |
| セキュリティ脆弱性 | セキュリティ上の問題（公開しないでください） | [セキュリティ脆弱性の報告](security)を参照 |

## フィードバック方法

### 方法 1：メーリングリスト

1. 件名と本文を自由に記入して `dev-subscribe@doris.apache.org` にメールを送り、届いた案内に従って購読を完了してください（詳しくは[メーリングリストの購読](subscribe-mail-list)を参照してください）。
2. 購読が確認されたら、問題や提案の内容を `dev@doris.apache.org` にメールで送ってください。

### 方法 2：GitHub Issue

[新規 Issue ページ](https://github.com/apache/doris/issues/new/choose)を開き、テンプレートを使用して Bug Report または Feature Request を提出してください。

## 分かりやすいフィードバックを書くためのポイント

<!-- Knowledge type: Writing guide -->

コミュニティが問題をすばやく特定できるように、報告には次の情報を含めてください。

- **問題を詳しく説明する**：ログ、重要なエラーメッセージ、すでに行ったトラブルシューティングや分析の内容を記載してください。
- **問題を絞り込む**：範囲を狭め、問題に関係のない業務上の背景情報を省いてください。
- **再現手順を示す**：問題を再現できる最小限の SQL、設定、またはスクリプトを添付してください。
- **問題そのものに焦点を当てる**：できるだけ業務や利用場面から切り離して説明してください。利用場面の情報が必要な場合は、その背景を明確かつ具体的に記載してください。

## 関連リンク

- [メーリングリストの購読](subscribe-mail-list)：5 つの手順で dev メーリングリストの購読を完了できます。
- [セキュリティ脆弱性の報告](security)：ASF の手順に従ってセキュリティ上の問題を報告します。
- [コミュニティへの参加](join-community)：Slack、Twitter、LinkedIn などの窓口を紹介します。
