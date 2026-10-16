---
title: Apache Doris のバージョン規則とバージョンの選択
language: ja
description: Apache Doris のバージョン番号の規則（メジャー／マイナー／パッチ）、アップグレードとダウングレードの互換性ポリシー、CPU に応じたバイナリの選択方法。
keywords:
    - Apache Doris のバージョン番号
    - Doris のバージョン規則
    - Doris のアップグレードとダウングレード
    - Latest／Stable バージョン
    - x64 avx2 ARM64
    - Doris バイナリの選択
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

# Apache Doris のバージョン規則とバージョンの選択

<!-- Knowledge type: Rule specification -->
<!-- Applicable scenarios: Version selection / Upgrade and downgrade evaluation / Pre-deployment check -->

このドキュメントでは、Apache Doris のバージョン番号の意味、アップグレードとダウングレードの互換性ポリシー、および CPU アーキテクチャに応じたバイナリの選択方法を説明します。

## バージョン番号の規則

Apache Doris は、`X.Y.Z` という三部構成のバージョン番号を使用します。各部分の意味、一般的な変更内容、リリース間隔は次のとおりです。

| 位置 | 名称 | 意味 | リリース間隔 |
| --- | --- | --- | --- |
| X | メジャー | 主要機能のリリース、またはアーキテクチャのアップグレード | 毎年 |
| Y | マイナー | 重要な機能、パフォーマンスの最適化、または必要なメタデータ／データ形式の変更 | 四半期ごと |
| Z | パッチ | バグ修正、パフォーマンスの最適化、小規模な機能の更新 | 通常 2～4 週間ごと |

## バージョンのアップグレードとダウングレード

<!-- Knowledge type: Rule specification -->

| アップグレードの種類 | 前方互換性（旧 → 新） | 後方互換性（新 → 旧） | 推奨事項 |
| --- | --- | --- | --- |
| メジャー（X） | 互換性あり | 保証されない | アップグレード前にデータをバックアップする |
| マイナー（Y） | 互換性あり | 保証されない | アップグレード前にデータをバックアップする |
| パッチ（Z） | 互換性あり | 互換性あり | データの互換性を懸念せず、直接アップグレードまたはダウングレードできる |

メジャー（X）およびマイナー（Y）バージョンのアップグレードでは、メタデータやデータ形式が変更される場合があります。Apache Doris は、これらの変更について前方互換性（古いバージョンから新しいバージョンへのアップグレード）を保証しますが、後方互換性（新しいバージョンから古いバージョンへのダウングレード）は保証しません。パッチ（Z）バージョンは、アップグレードとダウングレードの両方に対応しています。

## バージョンの選び方

Apache Doris チームは主に、**Latest** と **Stable** のラベルが付いた直近の二つのバージョンブランチを保守しています。

| ラベル | 内容 | 適した場面 |
| --- | --- | --- |
| Latest | 最新の機能、最適化、バグ修正 | 新機能の試用、POC の検証、パフォーマンステスト、本番導入前の環境 |
| Stable | 継続的なバグ修正と、より高い安定性 | 本番環境 |

## CPU モデルとバイナリのバージョン

<!-- Knowledge type: Hardware requirement -->
<!-- Applicable scenarios: Pre-deployment check / Environment acceptance -->

Apache Doris は、CPU アーキテクチャと命令セットに応じた三種類のバイナリを提供しています。

| バイナリ名 | 対応する CPU | 説明 |
| --- | --- | --- |
| x64(avx2) | AVX2 命令セットをサポートする x86_64 CPU | 標準の推奨版で、パフォーマンスが最も高い |
| x64(no avx2) | AVX2 命令セットをサポートしない x86_64 CPU | 旧世代の x86_64 プロセッサ向け |
| ARM64 | ARM ベースの CPU | ARM サーバー向け（Kunpeng、Graviton など） |

:::tip ヒント
CPU が AVX2 命令セットをサポートしているかどうかを確認するには、次のコマンドを実行します。

```bash
cat /proc/cpuinfo | grep avx2
```

出力があれば、その CPU は AVX2 をサポートしており、`x64(avx2)` バイナリを選択できます。
:::

## よくある質問

**質問：2.0.x から 1.2.x に直接ダウングレードできますか？**

いいえ。メジャーまたはマイナーバージョンをまたぐダウングレードでは、メタデータとデータ形式の互換性が保証されません。メジャーまたはマイナーバージョンをアップグレードする前に、必ず完全なバックアップを取得してください。

**質問：パッチバージョンは、途中のバージョンを飛ばして（たとえば 2.0.1 から直接 2.0.5 に）アップグレードできますか？**

はい。パッチバージョンは前方互換性と後方互換性を維持するため、アップグレード時もダウングレード時も途中のバージョンを飛ばせます。

**質問：Latest と Stable のどちらを選べばよいですか？**

本番環境では、Stable を優先してください。評価や新機能の試用には、Latest を選んでください。
