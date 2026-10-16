---
title: Apache Doris Core のリリース
language: ja
description: "Apache Doris Core のリリース手順全体：ブランチの準備、タグ付け、署名、SVN へのアップロード、Dev および IPMC の投票。"
keywords:
    - Apache Doris Core のリリース
    - Doris のリリース手順
    - Apache の投票
    - SVN dist
    - GPG 署名
    - リリース候補 rc01
    - リリースマネージャー
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

# Apache Doris Core のリリース

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Version release / Apache voting process -->

Doris Core は [https://github.com/apache/doris](https://github.com/apache/doris) のコードを指します。このドキュメントでは、リリースマネージャーが行うブランチの準備と検証から、パッケージ化、署名、コミュニティでの投票まで、リリース手順全体を説明します。

## リリースの準備

まず、[リリースの準備](./release-prepare)を参照し、署名、SVN、Maven などの環境を設定してください。

### 1. ブランチを準備する

リリース前に、次のように新しいリリースブランチを作成します。

```bash
git checkout -b branch-0.9
```

ブランチを作成したら、十分にテストを行い、機能が使用できること、バグが収束していること、重要なバグが修正されていることを確認します。この間、コミュニティでの報告を確認し、必要なパッチをリリースブランチに cherry-pick すべきか判断してください。

### 2. Issue を整理する

このリリースに属するすべての Issue を確認します。

- 完了した Issue をクローズします。
- このリリースで完了できない Issue は、後のバージョンに延期します。

### 3. 必要なパッチをマージする

リリースを待つ間にも、重要なパッチがマージされる場合があります。コミュニティから、リリースに取り込む必要がある重要なバグが報告された場合は、リリースマネージャーが評価し、対応するパッチをリリースブランチにマージします。

## ブランチを検証する

### 1. 安定性テスト

タグ付けしたブランチを QA チームに引き渡し、安定性テストを実施します。テスト中に修正が必要な問題が見つかった場合は、修正 PR の完了後にリリースブランチへマージします。

ブランチ全体が安定してから、正式なリリースの準備に進んでください。

### 2. コンパイルの検証

コンパイルに関するドキュメントを参照し、ソースコードが正しくコンパイルできることを確認します。

### 3. リリースノートを準備する

このリリースの主な機能、バグ修正、互換性に関する変更をまとめ、リリースノートを準備します（通常は GitHub Issue として公開します）。

## コミュニティでの投票手順

### 1. リリースにタグを付ける

ブランチが十分に安定したら、そのブランチにタグを作成できます。

タグを付ける前に、`build_version` 変数を `gensrc/script/gen_build_version.sh` で変更します。例：`build_version="0.10.0-release"`。

```bash
$ git checkout branch-0.9
$ git tag -a 0.9.0-rc01 -m "0.9.0 release candidate 01"
$ git push origin 0.9.0-rc01
Counting objects: 1, done.
Writing objects: 100% (1/1), 165 bytes | 0 bytes/s, done.
Total 1 (delta 0), reused 0 (delta 0)
To git@github.com:apache/doris.git
 * [new tag]         0.9.0-rc01 -> 0.9.0-rc01

$ git tag
```

### 2. パッケージ化、署名、アップロード

:::caution 注意
以下の手順では、SecureCRT などのターミナルからユーザーアカウントに直接ログインする必要があります。`su - user` や `ssh` を経由するとパスワード入力欄が表示されず、エラーになるため、使用しないでください。
:::

ソースコードをパッケージ化し、GPG 署名ファイルと SHA512 チェックサムファイルを生成します。

```bash
$ git checkout 0.9.0-rc01

$ git archive --format=tar 0.9.0-rc01 --prefix=apache-doris-0.9.0-incubating-src/ | gzip > apache-doris-0.9.0-incubating-src.tar.gz

$ gpg -u xxx@apache.org --armor --output apache-doris-0.9.0-incubating-src.tar.gz.asc --detach-sign apache-doris-0.9.0-incubating-src.tar.gz

$ gpg --verify apache-doris-0.9.0-incubating-src.tar.gz.asc apache-doris-0.9.0-incubating-src.tar.gz

$ sha512sum apache-doris-0.9.0-incubating-src.tar.gz > apache-doris-0.9.0-incubating-src.tar.gz.sha512

$ sha512sum --check apache-doris-0.9.0-incubating-src.tar.gz.sha512
```

| ファイル | 用途 |
| --- | --- |
| `*-src.tar.gz` | ソースパッケージ |
| `*-src.tar.gz.asc` | GPG 署名ファイル |
| `*-src.tar.gz.sha512` | SHA512 チェックサムファイル |

Dev SVN リポジトリをチェックアウトします。

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

三つのファイルを、次の SVN ディレクトリ構成に配置します。

```text
./doris/
|-- 0.9.0-rc01
|   |-- apache-doris-0.9.0-incubating-src.tar.gz
|   |-- apache-doris-0.9.0-incubating-src.tar.gz.asc
|   `-- apache-doris-0.9.0-incubating-src.tar.gz.sha512
`-- KEYS
```

SVN にコミットします。

```bash
svn add 0.9.0-rc01
svn commit -m "Add 0.9.0-rc1"
```

### 3. Dev メーリングリストで投票を開始する

`dev@doris.apache.org` で、次の件名の投票を開始します。

> [VOTE] Apache Doris 0.9.0-incubating-rc01 のリリース

本文のテンプレート：

```text
Hi all,

Please review and vote on Apache Doris 0.9.0-incubating-rc01 release.

The release candidate has been tagged in GitHub as 0.9.0-rc01, available
here:
https://github.com/apache/incubator-doris/releases/tag/0.9.0-rc01

Release Notes are here:
https://github.com/apache/incubator-doris/issues/1891

Thanks to everyone who has contributed to this release.

The artifacts (source, signature and checksum) corresponding to this release
candidate can be found here:
https://dist.apache.org/repos/dist/dev/incubator/doris/0.9/0.9.0-rc1/

This has been signed with PGP key 33DBF2E0, corresponding to
lide@apache.org.
KEYS file is available here:
https://downloads.apache.org/incubator/doris/KEYS
It is also listed here:
https://people.apache.org/keys/committer/lide.asc

To verify and build, you can refer to following link:
http://doris.incubator.apache.org/community/release-and-verify/release-verify.html

The vote will be open for at least 72 hours.
[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...

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

### 4. Dev 投票の結果メールを送信する

投票が可決されたら、次の件名で結果メールを送信します。

> [Result][VOTE] Apache Doris 0.9.0-incubating-rc01 のリリース

本文のテンプレート：

```text
Thanks to everyone, and this vote is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 Zhao Chun
+1 xxx
+1 Li Chaoyong
+1 Mingyu Chen

Best Regards,
xxx
```

### 5. IPMC 投票を開始する

:::tip ヒント
プロジェクトがインキュベーション中でない場合は、このセクションと次のセクションを省略します。
:::

`general@incubator.apache.org` で、次の件名の IPMC 投票を開始します。

> [VOTE] Apache Doris 0.9.0-incubating-rc01 のリリース

本文のテンプレート：

```text
Hi all,

Please review and vote on Apache Doris 0.9.0-incubating-rc01 release.

Apache Doris is an MPP-based interactive SQL data warehousing for reporting and analysis.

The Apache Doris community has voted on and approved this release:
https://lists.apache.org/thread.html/d70f7c8a8ae448bf6680a15914646005c6483564464cfa15f4ddc2fc@%3Cdev.doris.apache.org%3E

The vote result email thread:
https://lists.apache.org/thread.html/64d229f0ba15d66adc83306bc8d7b7ccd5910ecb7e842718ce6a61da@%3Cdev.doris.apache.org%3E

The release candidate has been tagged in GitHub as 0.9.0-rc01, available here:
https://github.com/apache/doris/releases/tag/0.9.0-rc01

There is no CHANGE LOG file because this is the first release of Apache Doris.
Thanks to everyone who has contributed to this release, and there is a simple release notes can be found here:
https://github.com/apache/doris/issues/406

The artifacts (source, signature and checksum) corresponding to this release candidate can be found here:
https://dist.apache.org/repos/dist/dev/incubator/doris/0.9/0.9.0-rc01/

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

Step1: Pull the docker image with Doris building environment
$ docker pull apache/doris:build-env-1.3.1
You can check it by listing images, its size is about 3.28GB.

Step2: Run the Docker image
You can run image directly:
$ docker run -it apache/doris:build-env-1.3.1

Step3: Download Doris source
Now you should in docker environment, and you can download Doris source package.
(If you have downloaded source and it is not in image, you can map its path to image in Step2.)
$ wget https://dist.apache.org/repos/dist/dev/doris/0.9/0.9.0-rc01/apache-doris-0.9.0.rc01-incubating-src.tar.gz

Step4: Build Doris
Now you can decompress and enter Doris source path and build Doris.
$ tar zxvf apache-doris-0.9.0.rc01-incubating-src.tar.gz
$ cd apache-doris-0.9.0.rc01-incubating-src
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

メールスレッドのリンクは、次のページで確認できます。

```text
https://lists.apache.org/list.html?dev@doris.apache.org
```

### 6. IPMC 投票の結果メールを送信する

:::tip ヒント
プロジェクトがインキュベーション中でない場合は、このセクションを省略します。
:::

`general@incubator.apache.org` に、次の件名で結果メールを送信します。

> [RESULT][VOTE] Apache Doris 0.9.0-incubating-rc01 のリリース

本文のテンプレート：

```text
Hi,

Thanks to everyone, and the vote for releasing Apache Doris 0.9.0-incubating-rc01 is now closed.

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

## リリースを完了する

残りのリリース手順を完了するには、[リリースの完了](./release-complete)を参照してください。

## FAQ / トラブルシューティング

**Q：`gpg --verify` で `gpg: Can't check signature: No public key` と表示される場合は？**

対応する公開鍵がローカルにありません。`gpg --keyserver https://keyserver.ubuntu.com/ --recv-keys <KEY_ID>` を実行して公開鍵を取得し、再試行してください。

**Q：`svn commit` で `Authentication failed` と表示される場合は？**

環境変数 `$ASF_USERNAME` と `$ASF_PASSWORD` が正しく設定されているか確認してください。パスワードには Apache LDAP のパスワードを使用します。

**Q：投票開始から 72 時間未満で投票を早期に締め切ることはできますか？**

いいえ。Apache のポリシーでは、リリース投票を少なくとも 72 時間継続する必要があるため、期限まで待ってください。
