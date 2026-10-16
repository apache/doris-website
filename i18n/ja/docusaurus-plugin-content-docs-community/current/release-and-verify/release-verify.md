---
title: Apache リリースの検証
language: ja
description: "Apache Doris リリースの検証手順。ダウンロード、署名の確認、ソースのライセンス確認、コンパイルの検証、投票を説明します。"
keywords:
    - Apache Doris
    - リリースの検証
    - GPG 署名
    - sha512 チェックサム
    - LICENSE の確認
    - skywalking-eyes
    - リリース投票
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

# Apache リリースの検証

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Apache release process / verification and voting -->

この検証手順は、次の場合に適用されます。

- リリース投票中にリリース候補（RC）を検証する場合。
- 公開済みリリースの整合性を確認する場合。

この文書では Doris Core を例に使用します。他のコンポーネントについては、名前を適宜置き換えてください。

## 検証チェックリスト

+1 票を投じる前に、以下の 7 項目すべてに合格する必要があります。

| 番号 | 確認項目 | 検証方法 |
|------|--------|----------|
| 1 | ダウンロードリンクが正規のものである | リンクのドメインが `dist.apache.org` または `downloads.apache.org` であることを確認する |
| 2 | チェックサムと PGP 署名が有効である | `gpg --verify` と `sha512sum --check` を実行する |
| 3 | コードが現在のリリースバージョンと一致する | ソースコードを Git タグと比較する |
| 4 | LICENSE と NOTICE ファイルが正しい | 手動で確認する |
| 5 | すべてのファイルに必要なライセンスヘッダーがある | `apache/skywalking-eyes` を使用する |
| 6 | ソースパッケージにコンパイル済みの内容が含まれていない | `target/`、`build/`、バイナリファイルを手動で確認する |
| 7 | コンパイルが正常に実行できる | コンパイルのドキュメントに従ってビルドする |

## 1. ソースパッケージ、署名ファイル、チェックサムファイル、KEYS をダウンロードする

関連するファイルをすべてダウンロードします。以下では `a.b.c-incubating` を例に使用します。

```shell
wget https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz

wget https://www.apache.org/dist/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz.sha512

wget https://www.apache.org/dist/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz.asc

wget https://downloads.apache.org/incubator/doris/KEYS
```

> リリース投票の検証では、投票メールに記載された SVN アドレスからファイルを取得してください。

## 2. 署名とチェックサムを確認する

### 2.1 GnuPG をインストールする

GnuPG の使用を推奨します。以下のいずれかのコマンドでインストールします。

| システム | インストールコマンド |
|------|----------|
| CentOS / RHEL | `yum install gnupg` |
| Ubuntu / Debian | `apt-get install gnupg` |

### 2.2 KEYS をインポートして検証する

以下は Doris Core のリリースを使用した例です。他のリリースも同様に検証できます。

```shell
gpg --import KEYS
gpg --verify apache-doris-a.b.c-incubating-src.tar.gz.asc apache-doris-a.b.c-incubating-src.tar.gz
sha512sum --check apache-doris-a.b.c-incubating-src.tar.gz.sha512
```

> 注: `gpg --import` が `no valid user IDs` というエラーで失敗した場合は、GPG のバージョンが互換性を持たない可能性があります。2.2.x 以降にアップグレードしてください。

## 3. ソースのライセンスヘッダーを検証する

ライセンスヘッダーの検証には [skywalking-eyes](https://github.com/apache/skywalking-eyes) を使用します。

ソースのルートディレクトリに移動し、次のコマンドを実行します。

```shell
sudo docker run -it --rm -v $(pwd):/github/workspace apache/skywalking-eyes header check
```

出力例:

```text
INFO GITHUB_TOKEN is not set, license-eye won't comment on the pull request
INFO Loading configuraftion from file: .licenserc.yaml
INFO Totally checked 5611 files, valid: 3926, invalid: 0, ignored: 1685, fixed: 0
```

`invalid` が 0 であれば、この確認は合格です。

## 4. コンパイルを検証する

各コンポーネントのコンパイル手順については、以下のドキュメントを参照してください。

- Doris Core のコンパイル: [コンパイルのドキュメント](/community/source-install/compilation-with-docker)を参照してください。
- Flink Doris Connector のコンパイル: [Flink Doris Connector のドキュメント](/docs/dev/connection-integration/data-integration/flink-doris-connector)を参照してください。
- Spark Doris Connector のコンパイル: [Spark Doris Connector のドキュメント](/docs/dev/connection-integration/data-integration/spark-doris-connector)を参照してください。

## 5. 投票する

投票の詳細については、[ASF の投票手順](https://www.apache.org/foundation/voting.html)を参照してください。

検証後、以下のテンプレートを使用して `dev@doris` メーリングリストの投票メールに返信できます。

```text
+1 (binding) or +1 (non-binding)

My Apache ID(optional): morningman

I checked:

[x] The download link is legal.
[x] The PGP signature are valid.
[x] The source code matches the current release version.
[x] The LICENSE and NOTICE files are correct.
[x] All files carry the necessary protocol header.
[x] The compiled content is not included in the source package.
[x] The compilation can be executed smoothly.

Other comments...
```

### 5.1 投票の主なルール

| ルール | 説明 |
|------|------|
| 拘束力のある票 | PMC メンバーの票には拘束力があります。それ以外の票は参考意見として扱われます |
| 可決条件 | 過半数の賛成が必要です。PMC メンバーから少なくとも三票の +1 があり、+1 が -1 を上回る必要があります |
| 投票期間 | 少なくとも 72 時間、投票を受け付けます |
| 暗黙の +1 はない | リリースマネージャーも他の投票者も、暗黙の +1 を持ちません。明示的に投じられた票のみを数えます |

PMC メンバーの票には拘束力がありますが、参考意見として扱われる場合でも、コミュニティはすべてのメンバーに投票を奨励しています。

リリースマネージャーは各票の有効性を確認する必要があります。PMC メンバー一覧を使って、メールアドレスが一致するか確認できます。推奨事項は次のとおりです。

- 投票の有効性を確保するため、Apache のメールアドレスを使用してください。
- リリースマネージャーが集計しやすいように、投票に Apache ID を記載してください。

一般に、重大な問題が見つかった場合、コミュニティはリリース投票を取り消します。ただし、ほとんどの場合、最終判断はリリースマネージャーに委ねられます。具体的な手順はプロジェクトによって異なりますが、**「少なくとも三票の +1 が必要」という最低定足数のルールは共通です**。

注: **リリースマネージャーも ASF の投票に参加する他の人も、暗黙の +1 を持ちません。明示的に投じられた票のみを数えます。** リリースマネージャーにもリリースへの投票が推奨されます。

## FAQ / トラブルシューティング

### Q1: `gpg --verify` で `gpg verify failed` または `BAD signature` が報告される

考えられる原因:

- KEYS ファイルがインポートされていません。先に `gpg --import KEYS` を実行してください。
- 署名ファイルがソースパッケージと一致していません。`.asc` ファイルと `.tar.gz` ファイルが同じディレクトリにあり、バージョン番号が一致することを確認してください。
- ダウンロード中にソースパッケージが破損しました。再ダウンロードして `.sha512` ファイルと照合してください。

### Q2: `gpg --import` で `no valid user IDs` が報告される

GPG のバージョンが古すぎます。2.2.x 以降にアップグレードしてください。

```shell
# Ubuntu
apt-get install gnupg2

# CentOS
yum install gnupg2
```

### Q3: `sha512sum --check` で `shasum mismatch` または `FAILED` が報告される

ソースパッケージが破損しているか、チェックサムファイルと一致していません。ソースパッケージを再ダウンロードし、ファイルサイズを比較してダウンロードが完了していることを確認したうえで、もう一度検証してください。

### Q4: skywalking-eyes で `LICENSE check failed` または `invalid > 0` が報告される

ソースコード内の一部のファイルにライセンスヘッダーがありません。主な原因は次のとおりです。

- 新しく追加したコードファイルに Apache License のヘッダーがありません。
- サードパーティーのファイルが `paths-ignore` に記載されていません（設定ファイル: `.licenserc.yaml`）。

リリースマネージャーは問題を修正し、新しい RC を作成する必要があります。

### Q5: コンパイルに失敗した場合は -1 を投じるべきですか？

コンパイル失敗の原因がリリースパッケージ自体にある場合（ファイルの欠落や依存関係のエラーなど）は、-1 を投じて詳しい理由を記載してください。ローカル環境に原因がある場合（依存関係の不足や JDK のバージョン違いなど）は、判断する前に環境の問題を調査してください。
