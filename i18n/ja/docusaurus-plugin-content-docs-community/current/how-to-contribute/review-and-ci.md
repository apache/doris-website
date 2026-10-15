---
title: レビューと CI
language: ja
description: Apache Doris のプルリクエストをレビューし、CI を実行し、指摘事項に対応して変更をマージするまでの手順。
keywords:
    - Apache Doris
    - プルリクエストのレビュー
    - CI
    - TeamCity
    - AI レビュー
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

<!-- Knowledge type: procedure -->
<!-- Applicable scenarios: after opening a PR / review / CI / merge -->

プルリクエスト（PR）を作成した後、コントリビューターは PR がマージされるまでに、コードレビュー、CI チェック、必要な修正を完了する必要があります。このガイドでは、PR の作成後からマージまでの一連の手順を説明します。PR の作成方法については、[プルリクエストのガイド](./pull-request.md)を参照してください。

![PR のレビュー、CI、マージのワークフロー](/images/review-and-ci-workflow.jpg)

手順の概要：

1. コミッターでない場合は、コミッターに変更内容の確認と CI ワークフローの承認を依頼します。
2. 自分の変更をレビューし、必要に応じて `doris-repo-review` スキルでローカル AI レビューを実行します。
3. CI ワークフローの承認後、PR にコメントして TeamCity のチェックを開始します。
4. CI とレビューの指摘事項に対応し、現在のコミットで必須のチェックがすべて成功していることを確認します。
5. レビュアーと該当するコードオーナーがコードを承認したら、コミッターに PR のマージを依頼します。

## 1. コミッターに CI ワークフローの承認を依頼する

コミッター以外の人が PR を作成すると、CI ワークフローが必要な権限を持つコミュニティメンバーの承認待ちになる場合があります。コミッターに変更内容を確認し、ワークフローを承認してもらってください。ワークフローの承認は、CI が PR のコードを実行できるようにするだけです。コミッターがコードを承認したり、マージに同意したりしたことは意味しません。

[Apache Doris の Slack コミュニティ](https://doris.apache.org/slack?utm_source=website&utm_medium=docs&utm_content=review_ci)に参加し、コミュニティが適切なレビュアーを見つけられるよう、`#dev` チャンネルに次の情報を投稿してください。

```text
PR: <PR URL>
Module: <affected module>
Change: <one-sentence purpose>
Local validation: <tests already run>
Help needed: Approve CI workflow / Review
```

誰に連絡すればよいかわからない場合は、そのモジュールで最近マージされた PR や、変更対象ファイルのコミット履歴を確認してください。その後、モジュールに詳しいコミッターに `#dev` で声をかけることができます。

## 2. 変更内容をローカルでレビューする

ワークフローの承認やリモート CI の結果を待つ間に、PR をセルフレビューしてください。

- 変更されたファイルが PR の説明と一致し、無関係な編集が含まれていないことを確認します。
- 通常の処理、エラー時の処理、境界条件、互換性への影響を確認します。
- 新しい動作に対するテストがあり、既存のテストが理由なく削除されたり、チェック内容が弱められたりしていないことを確認します。
- 必要に応じて、設定のリファレンス、ユーザードキュメント、エラーメッセージ、アップグレード時の注意事項を更新します。
- ログにパスワード、トークン、キー、その他の秘密情報が含まれていないことを確認します。

### `doris-repo-review` でローカル AI レビューを実行する

Apache Doris は [`doris-repo-review` スキル](https://github.com/apache/doris-skills/tree/main/skills/doris-repo-review)を提供しています。このスキルは、ローカルにチェックアウトした Doris のソースコードから、オンラインの Code Review パイプラインと同じ方法で PR をレビューします。コードのコンパイルやテストの実行は行わないため、CI の代わりにはなりません。

Apache Doris のスキルをインストールします。

```bash
npx skills add apache/doris-skills
```

ローカル環境には `git`、認証済みの `gh` CLI、`jq`、`python3` が必要です。Doris のチェックアウトには Git の全履歴が必要です。ローカルの `apache/doris` ソースチェックアウトで、スキルをサポートするエージェントから次のコマンドを実行します。

```text
/doris-repo-review https://github.com/apache/doris/pull/<PR number>
```

コマンドの後にレビューで重点的に確認する点を追加できます。

```text
/doris-repo-review https://github.com/apache/doris/pull/<PR number> focus on compatibility and error handling
```

このスキルは現在の作業ディレクトリを PR の正確なコミットに合わせ、英語と中国語のレビュードキュメントを `review-docs/` に書き込みます。実行前に、追跡対象のローカル変更を自分でコミットするか stash してください。このスキルは変更を stash したり削除したりせず、実行後に作業ディレクトリが detached HEAD の状態になる場合があります。

次の条件がすべて満たされると、スキルはローカルで認証済みの `gh` アカウントから、機械が読み取れる PASS コメントを自動投稿します。

- レビューの判定が `APPROVE` で、`Blocker` または `Major` の指摘がない。
- レビューが収束し、レビュードキュメントが検証に合格した。
- 選択したモデルと推論の労力がスキルの要件を満たしている。
- レビュー中に PR の head が変わっていない。

判定が `REQUEST_CHANGES` の場合、レビューが収束しなかった場合、実行環境が要件を満たさない場合、または PR の head が変わった場合、スキルは PASS コメントを投稿しません。このコメントは、特定のコミットに対するローカル AI レビューの実施記録です。Apache プロジェクトの人間による承認ではなく、レビュアーによるコードの承認の代わりにもなりません。

## 3. TeamCity CI を開始する

CI ワークフローが承認されたら、PR に次のコメントを投稿して TeamCity パイプラインを開始します。

```text
run buildall
```

`run buildall` は、PR で変更されたファイルに応じて、該当するすべてのチェックを開始します。通常の検証にはこのコマンドを使用してください。特定のチェック群だけを実行または再実行するには、[TeamCity のトリガーワークフロー](https://github.com/apache/doris/blob/master/.github/workflows/comment-to-trigger-teamcity.yml)が現在サポートしている別のコマンドを使用します。

| コマンド | 用途 |
|---------|---------|
| `run buildall` | 該当するすべてのコンパイルとテストを開始する |
| `run compile` | コンパイルチェックを開始する |
| `run beut` | BE の単体テストを開始する |
| `run feut` | FE の単体テストを開始する |
| `run cloudut` | Cloud の単体テストを開始する |
| `run p0` | P0 回帰テストを開始する |
| `run p1` | P1 回帰テストを開始する |
| `run external` | External 回帰テストを開始する |
| `run cloud_p0` | Cloud P0 回帰テストを開始する |
| `run cloud_p1` | Cloud P1 回帰テストを開始する |
| `run vault_p0` | Vault P0 回帰テストを開始する |
| `run nonConcurrent` | 並列実行できない回帰テストを開始する |
| `run check_coverage` | コードカバレッジのチェックを開始する |
| `run performance` | パフォーマンステストを開始する |

PR が `regression-test/pipeline/` 以下の認証情報に関わるパイプラインスクリプトを変更する場合、個別のテストコマンドはブロックされます。スクリプトの安全性を確認した後、コミッターが `run buildall` を使用して変更を確認したことを示し、パイプラインを開始する必要があります。

## 4. CI が成功したか確認する

PR のチェックには、必須のものと必須ではないものがあります。

- **必須のチェック**：PR の現在の head に対する必須のチェックがすべて成功しなければ、PR はマージできません。
- **必須ではないチェック**：結果は追加の判断材料になりますが、失敗してもマージを直接妨げるものではありません。失敗した場合も無視せず、変更が原因かどうかを調べてください。

CI が失敗した場合は、チェックのログを開き、原因がコードの不具合、テストの不具合、インフラストラクチャの問題、不安定なテストのどれに当たるかを判断します。コードやテストの不具合は修正し、新しいコミットを push してください。インフラストラクチャの問題や不安定なテストが疑われる場合は、失敗したログの URL と判断理由を PR に記載し、コミッターまたはモジュールのメンテナーに再実行や調査の協力を依頼してください。

push するたびに PR の head は変わります。最新のコミットに対するチェックだけを確認してください。古いコミットに対する成功したチェックや AI Review PASS は、現在のコミットには適用されません。

## 5. コミッターにオンライン AI レビューの開始を依頼する

コミッター、または必要なリポジトリ権限を持つ別のメンバーは、PR に次のコメントを投稿してオンライン AI レビューを開始できます。

```text
/review
```

コマンドに重点的に確認する点を追加することもできます。

```text
/review focus on compatibility and error handling
```

オンライン AI レビューは `doris-repo-review` スキルと同じ方法を使用しますが、ジョブはオンラインのキューに入り、利用可能なリソースを待つ必要があります。PR の Checks 欄で `code-review` のステータスと GitHub Actions のログを確認してください。ジョブがしばらく Queued または Running の状態にあるという理由だけで、重複して実行しないでください。

`code-review` チェックの成功は、オンラインレビューが完了し、レビューが提出されたことを意味します。問題が見つからなかったことは意味しません。レビューの概要と行単位のコメントを読み、指摘事項に対応してください。

## 6. レビューの指摘事項に対応し、マージを完了する

### コードオーナーの承認を得る

Apache Doris は [`.github/CODEOWNERS`](https://github.com/apache/doris/blob/master/.github/CODEOWNERS) を使用して、特定のコードパスにコードオーナーを割り当てています。PR がこれらのパスのいずれかを変更すると、GitHub は対応する個人またはチームにレビューを依頼します。コードオーナーのレビューが必要なモジュールでは、PR をマージする前に該当するコードオーナーの承認を得る必要があります。

コードオーナーの承認、CI ワークフローの承認、一般のレビュアーによる承認は、それぞれ別の要件です。互いに代用できません。PR の Reviewers 欄とマージ要件を確認し、コードオーナーのレビューが保留中かどうかを調べてください。誰に連絡すればよいかわからない場合は、現在の `CODEOWNERS` ファイルを正しい情報源として参照し、Slack の `#dev` チャンネルに PR の URL を投稿してください。リポジトリの設定は変更される可能性があるため、このガイドにはコードオーナーの一覧を転載していません。

### レビューの指摘事項に対応する

人間または AI によるレビューのフィードバックを受けたら、次の手順で対応します。

1. 各指摘が現在の変更に該当するか判断します。
2. 妥当な指摘にはコード、テスト、ドキュメントで対応し、変更内容を返信します。
3. 該当しない指摘には、技術的な理由と裏付けとなる情報を説明します。
4. 問題に対応してから、その会話を解決済みにします。
5. 新しいコミットを push した後、影響を受ける CI とレビューのチェックを再実行します。古いコミットに紐づく AI Review PASS は、新しいコミットには適用されません。
6. PR にコンフリクトがある場合は、最新のマージ先ブランチにリベースして解消します。

PR が次の条件をすべて満たしたら、コミッターにマージを依頼します。

- PR の説明が揃っており、変更範囲が明確である。
- レビューの指摘事項にすべて対応済みである。
- 最新の PR head に対する必須のチェックがすべて成功している。
- マージ先ブランチとの未解決のコンフリクトがない。
- レビュアーがコードを承認している。
- 変更したパスのコードオーナーが、必要に応じてコードを承認している。

コミッターは、レビュー、CI の結果、プロジェクトのマージ方針に基づいて、マージするかどうかを最終的に判断します。
