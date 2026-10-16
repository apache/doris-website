---
title: セキュリティ脆弱性の報告
language: ja
description: "Apache Doris のセキュリティ脆弱性を報告する方法：security@apache.org にメールで ASF セキュリティチームへ連絡し、公式の責任ある情報開示手順に従ってください。"
keywords:
    - Apache Doris セキュリティ
    - Doris セキュリティ脆弱性
    - security@apache.org
    - ASF セキュリティチーム
    - 責任ある情報開示
    - 脆弱性報告
    - CVE
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

# セキュリティ脆弱性の報告

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Vulnerability reporting / Security disclosure -->

Apache Software Foundation（ASF）は、同財団のソフトウェアプロジェクトにおけるセキュリティ上の問題に厳正に対処しています。Apache Doris も、製品の機能に関わるセキュリティ上の問題を重視しています。このページでは、ASF の公式手続きに従って Doris のセキュリティ脆弱性や潜在的な脅威を報告する方法を説明します。

## 報告先の概要

| 項目 | 説明 |
|------|------|
| 送信先 | [Apache セキュリティチーム](http://www.apache.org/security/) |
| メールアドレス | [security@apache.org](mailto:security@apache.org) |
| プロジェクト名 | メールには必ず `Doris` と明記してください |
| 情報開示の原則 | メールを送信する前に、公開チャネルで脆弱性を**開示しないでください** |

## 報告手順

<!-- Knowledge type: Procedure -->

1. **メールを作成する**：[security@apache.org](mailto:security@apache.org) に送信します。件名と本文の両方に、プロジェクト名が `Doris` であることを明記してください。
2. **問題を説明する**：脆弱性や潜在的な脅威の影響範囲、影響を受けるバージョン、考えられる攻撃シナリオを明確に記載してください。
3. **再現手順を添える**：セキュリティ上の問題を再現できる最小限の手順、PoC、またはログの抜粋を提供してください。
4. **返信を待つ**：評価と分析の後、Apache セキュリティチームと Doris コミュニティから直接連絡があります。

## 注意事項

- **公開しない**：セキュリティチームから返信を受け、公開時期を調整するまでは、GitHub Issues、メーリングリスト、Slack、SNS など、いかなる公開チャネルでも脆弱性を議論しないでください。
- **通常のフィードバック窓口を使わない**：セキュリティ上の問題を、[フィードバック](feedback)に記載された GitHub Issues や dev メーリングリストに投稿しないでください。
- **責任ある情報開示に従う**：手順の詳細は、[ASF のセキュリティ情報開示ポリシー](http://www.apache.org/security/)を参照してください。

## 関連リンク

- [ASF セキュリティチームのホームページ](http://www.apache.org/security/)
- [フィードバック](feedback)：セキュリティ以外の問題の連絡窓口。
- [コミュニティへの参加](join-community)：コミュニティのその他の連絡窓口。
