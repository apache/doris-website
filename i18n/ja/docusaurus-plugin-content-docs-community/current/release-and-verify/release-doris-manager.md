---
title: Doris Manager のリリース
language: ja
description: "Apache Doris Manager のリリース手順。ブランチ管理、タグ付け、パッケージ化と署名、SVN へのアップロード、コミュニティ投票、IPMC 投票を説明します。"
keywords:
    - Apache Doris
    - Doris Manager
    - リリース手順
    - コミュニティ投票
    - IPMC 投票
    - GPG 署名
    - SVN へのアップロード
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

# Doris Manager のリリース

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Apache release process / Doris Manager release -->

Doris Manager のコードベースは Doris 本体とは別に、[apache/doris-manager](https://github.com/apache/doris-manager) で管理されています。このドキュメントでは、Doris Manager のリリース手順全体を説明します。

## リリース手順の概要

| フェーズ | 手順 | 目的 |
|------|------|------|
| 準備 | 1. リリースの準備 | GPG キー、SVN へのアクセス権などの前提条件を整える |
| 準備 | 2. ブランチの準備 | リリースブランチを作成し、機能の安定性を確認する |
| 準備 | 3. Issue の整理 | 完了した Issue をクローズし、未完了の Issue を延期する |
| 準備 | 4. 必要なパッチのマージ | 重要なパッチを評価してマージする |
| 検証 | 5. ブランチの検証 | 安定性テストとビルドの検証を行う |
| 投票 | 6. タグ付け、パッケージ化、署名、アップロード | RC パッケージを作成し、SVN にアップロードする |
| 投票 | 7. dev@doris での投票 | コミュニティで投票する |
| 投票 | 8. IPMC での投票 | Incubator PMC で投票する |
| 完了 | 9. リリースの完了 | アーカイブ、公開、告知を行う |

## 1. リリースの準備

リリース前の作業については、[リリースの準備](./release-prepare)を参照してください。

## 2. ブランチの準備

リリース前に新しいブランチを作成します。

```shell
git checkout -b branch-1.0.0
```

ブランチの作成後、十分なテストを行い、次の点を確認します。

- 機能が期待どおりに動作すること。
- バグが収束しつつあること。
- 重要なバグがすべて修正されていること。

テスト中はコミュニティからのフィードバックを待ち、マージが必要なパッチがあるか判断します。必要な場合は、そのパッチをリリースブランチに cherry-pick します。

## 3. Issue の整理

このリリースに含まれるすべての Issue を確認します。

- 完了した Issue をクローズします。
- 完了できない Issue は、以降のリリースに延期します。

## 4. 必要なパッチのマージ

リリースを待つ間に、重要なパッチのマージが必要になる場合があります。コミュニティから、このリリースに含めるべき重要なバグが報告された場合、リリースマネージャーが修正を評価し、そのパッチをリリースブランチにマージします。

## 5. ブランチの検証

### 5.1 安定性テスト

準備したブランチを QA に渡して安定性テストを行います。テスト中に修正が必要な問題が見つかった場合は、修正 PR の準備ができ次第、リリースブランチにマージします。

ブランチ全体が安定してから、リリースに進みます。

### 5.2 ビルドの検証

ビルドに関するドキュメントを参照し、ソースからビルドして、ソースコードが正しくコンパイルされることを確認します。

## 6. コミュニティでのリリース投票手順

### 6.1 タグの作成

ブランチが安定したら、そのブランチにタグを作成します。例:

```shell
git checkout branch-1.0.0
git tag -a 1.0.0-rc01 -m "doris manager 1.0.0 release candidate 01"
git push origin 1.0.0-rc01
```

期待される出力:

```text
Counting objects: 1, done.
Writing objects: 100% (1/1), 165 bytes | 0 bytes/s, done.
Total 1 (delta 0), reused 0 (delta 0)
To git@github.com:apache/doris-manager.git
 * [new tag]         1.0.0-rc01 -> 1.0.0-rc01
```

`git tag` を実行すると、ローカルのタグを一覧表示できます。

### 6.2 パッケージ化、署名、アップロード

以下の手順では、SecureCRT などのターミナルから対象のユーザーアカウントに直接ログインする必要があります。**`su - user` や `ssh` を使ってユーザーを切り替えないでください。** パスワードの入力プロンプトが表示されず、コマンドがエラーになる場合があります。

#### 6.2.1 パッケージ化と署名

```shell
git archive --format=tar 1.0.0-rc01 --prefix=apache-doris-incubating-manager-src-1.0.0-rc01/ | gzip > apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

gpg -u xxx@apache.org --armor --output apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc --detach-sign apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

gpg --verify apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

sha512sum apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz > apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512

sha512sum --check apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512
```

#### 6.2.2 SVN へのアップロード

SVN リポジトリをチェックアウトします。

```shell
svn co https://dist.apache.org/repos/dist/dev/doris/
```

上記で作成したファイルを、次の SVN パスに配置します。

```text
./doris/
├── doris-manager
│   └── 1.0.0
│       ├── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz
│       ├── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc
│       └── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512
```

これらのファイルをアップロードします。

```shell
svn add 1.0.0-rc01
svn commit -m "Add doris manager 1.0.0-rc01"
```

### 6.3 dev@doris.apache.org に投票メールを送信

メールの件名:

```text
[VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

メール本文のテンプレート:

```text
Hi All,

This is a call for vote to release Doris Manager v1.0.0 for Apache Doris(Incubating).

- apache-doris-incubating-manager-src-1.0.0-rc01

The release node:



The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/

Keys to verify the Release Candidate:
https://downloads.apache.org/doris/KEYS

Look at here for how to verify this release candidate:
http://doris.apache.org/community/release-and-verify/release-verify.html

Vote thread at dev@doris: [1]

The vote will be open for at least 72 hours or until necessary number of votes are reached.

Please vote accordingly:

[ ] +1 approve
[ ] +0 no opinion
[ ] -1 disapprove with the reason

[1] vote thread in dev@doris


Brs,
xxxx
------------------
DISCLAIMER: 
Apache Doris (incubating) is an effort undergoing incubation at The
Apache Software Foundation (ASF), sponsored by the Apache Incubator PMC.

Incubation is required of all newly accepted
projects until a further review indicates that the
infrastructure, communications, and decision making process have
stabilized in a manner consistent with other successful ASF
projects.

While incubation status is not necessarily a reflection
of the completeness or stability of the code, it does indicate
that the project has yet to be fully endorsed by the ASF.
```

### 6.4 投票の可決後、結果をメールで通知

メールの件名:

```text
[Result][VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

メール本文のテンプレート:

```text
Thanks to everyone, and this vote is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 jiafeng Zhang
+1 xxx
+1 EmmyMiao87
+1 Mingyu Chen

Best Regards,
xxx
```

## 7. IPMC での投票

dev メーリングリストでの投票が可決されたら、`general@incubator.apache.org` メーリングリストにメールを送信して、IPMC の投票を開始します。

メール本文のテンプレート:

```text
Hi all,

Please review and vote on Apache Doris Manager 1.0.0-incubating-rc01 release.

Doris manager is a platform for automatic installation, deployment and management of Doris groups

The Apache Doris community has voted on and approved this release:
https://lists.apache.org/thread.html/d70f7c8a8ae448bf6680a15914646005c6483564464cfa15f4ddc2fc@%3Cdev.doris.apache.org%3E

The vote result email thread:
https://lists.apache.org/thread.html/64d229f0ba15d66adc83306bc8d7b7ccd5910ecb7e842718ce6a61da@%3Cdev.doris.apache.org%3E

The release candidate has been tagged in GitHub as 1.0.0-rc01, available here:
https://github.com/apache/doris-manager/releases/tag/1.0.0-rc01

There is no CHANGE LOG file because this is the first release of Apache Doris.
Thanks to everyone who has contributed to this release, and there is a simple release notes can be found here:
https://github.com/apache/doris/issues/406

The artifacts (source, signature and checksum) corresponding to this release candidate can be found here:
https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/

This has been signed with PGP key 33DBF2E0, corresponding to lide@apache.org.
KEYS file is available here:
https://downloads.apache.org/doris/KEYS
It is also listed here:
https://people.apache.org/keys/committer/lide.asc

The vote will be open for at least 72 hours.
[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...

To verify and build, you can refer to following instruction:

Firstly, you must be install and start docker service, and then you could build Doris as following steps:

$ wget https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

Step4: Build Doris
Now you can decompress and enter Doris source path and build Doris.
$ tar zxvf apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz
$ cd apache-doris-incubating-manager-src-1.0.0-rc01
$ sh build.sh

Best Regards,
xxx

----
DISCLAIMER: 
Apache Doris (incubating) is an effort undergoing incubation at The
Apache Software Foundation (ASF), sponsored by the Apache Incubator PMC.

Incubation is required of all newly accepted
projects until a further review indicates that the
infrastructure, communications, and decision making process have
stabilized in a manner consistent with other successful ASF
projects.

While incubation status is not necessarily a reflection
of the completeness or stability of the code, it does indicate
that the project has yet to be fully endorsed by the ASF.
```

メールスレッドのリンクは次の場所で確認できます。

```text
https://lists.apache.org/list.html?dev@doris.apache.org
```

### 7.1 general@incubator.apache.org に結果メールを送信

メールの件名:

```text
[RESULT][VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

メール本文のテンプレート:

```text
Hi,

Thanks to everyone, and the vote for releasing Apache Doris Manager 1.0.0-incubating-rc01 is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 Willem Jiang
+1 Justin Mclean
+1 ShaoFeng Shi
+1 Makoto Yui

The vote thread:
https://lists.apache.org/thread.html/da05fdd8d84e35de527f27200b5690d7811a1e97d419d1ea66562130@%3Cgeneral.incubator.apache.org%3E

Best Regards,
xxx
```

## 8. リリースの完了

すべてのリリース作業を終えるには、[リリースの完了](./release-complete)を参照してください。

## よくある質問

### Q1: `ssh` や `su - user` 経由でパッケージ化と署名を実行できないのはなぜですか？

`ssh` または `su -` で開いたターミナルでは、GPG のパスワード入力プロンプトが正しく表示されず、署名コマンドが失敗します。SecureCRT などのターミナルから、対象のユーザーアカウントに直接ログインしてください。

### Q2: `gpg --verify` で `gpg verify failed` または `BAD signature` と表示される

考えられる原因:

- 公開鍵がインポートされていない: 先に `gpg --import KEYS` を実行してください。
- 署名ファイルとソースパッケージが一致しない: `.asc` ファイルと `.tar.gz` ファイルが同じビルドから作成されたことを確認してください。

### Q3: `sha512sum --check` で `shasum mismatch` と表示される

転送中にソースパッケージが破損したか、上書きされた可能性があります。ソースパッケージを再ダウンロードするか、`.sha512` チェックサムファイルを再生成して検証し直してください。
