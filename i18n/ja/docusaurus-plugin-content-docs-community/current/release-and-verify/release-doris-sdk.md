---
title: Doris SDK のリリース
language: ja
description: "Apache Doris SDK のリリース手順: Maven Release の prepare/perform、SVN へのアップロード、コミュニティ投票。"
keywords:
    - Apache Doris
    - Doris SDK
    - リリース手順
    - Maven Release
    - SVN へのアップロード
    - コミュニティ投票
    - GPG 署名
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

# Doris SDK のリリース

<!-- Knowledge type: Operating procedure -->
<!-- Applies to: Apache release process / SDK release -->

Doris SDK のコードは、Doris 本体とは別の [apache/doris-sdk](https://github.com/apache/doris-sdk) リポジトリにあります。このドキュメントでは、`Doris SDK v1.0.0` のリリースを例に、Maven Staging への公開からコミュニティ投票までの一連の手順を説明します。

## リリース手順の概要

| ステップ | 目的 | 主な成果物 |
|------|---------|---------------|
| 1. リリースの準備 | リリースに必要な事前準備（KEYS、アカウント、環境など）を完了する | GPG キー、Apache アカウント |
| 2. ブランチの準備 | リポジトリにリリースブランチを作成する | `1.0.0-release` ブランチ |
| 3. Maven Staging への公開 | リリースタグを生成し、Apache Maven Staging に公開する | タグ、Staging リポジトリ |
| 4. SVN の準備 | ソースパッケージ、署名、チェックサムファイルを SVN にアップロードする | tar.gz / .asc / .sha512 |
| 5. 投票の開始 | dev@doris メーリングリストで投票を開始する | 投票メール |
| 6. リリースの完了 | 投票が可決されたら、アーカイブと告知を行う | リリースパッケージ |

## 1. リリースの準備

リリースの事前準備については、[リリースの準備](./release-prepare)を参照してください。

## 2. Maven への公開

### 2.1 ブランチの準備

リポジトリに `1.0.0-release` ブランチを作成し、そのブランチに切り替えます。

```shell
git checkout -b 1.0.0-release
```

### 2.2 Maven Staging への公開

次のコマンドを実行してリリースタグを生成します。

```shell
mvn release:clean
mvn release:prepare -DpushChanges=false
```

ここで、`-DpushChanges=false` は、実行中に新しく生成されたブランチとタグをリポジトリにプッシュしないことを意味します。

`mvn release:prepare` の実行後、次の三つの項目を順番に入力します。

| 入力項目 | 説明 | 例 |
|-------|-------------|---------|
| Doris SDK のバージョン | リリースするバージョン。形式は `{sdk.version}` | `1.0.0` |
| リリースタグ名 | ローカルに生成するタグの名前 | `1.0.0` |
| 次のバージョン | ローカルブランチの生成にのみ使用し、それ以外の意味はない | `1.0.1-SNAPSHOT` |

**よくある問題:**

- `mvn release:prepare` の実行中に GPG のパスフレーズを求められる場合があります。
- `gpg: no valid OpenPGP data found` というエラーが表示された場合は、次のコマンドを実行してから再試行します。

    ```shell
    export GPG_TTY=$(tty)
    ```

`mvn release:prepare` が成功すると、ローカルにタグとブランチが生成され、現在のブランチに二つのコミットが追加されます。

1. 最初のコミットは、新しく生成されたタグに対応します。
2. 二つ目のコミットは、次のバージョンのブランチに対応します。

`git log` で確認できます。

ローカルのタグが正しいことを確認したら、タグをリポジトリにプッシュします。

```shell
git push upstream --tags
```

ここで、`upstream` は `apache/doris-sdk` リポジトリを指します。

最後に、次のコマンドでビルド成果物を Maven Staging に公開します。

```shell
mvn release:perform
```

コマンドが成功すると、公開したバージョンを [Apache Maven Staging Repositories](https://repository.apache.org/#stagingRepositories) で確認できます。

![](/images/staging-repositories.png)

**注意: 公開する成果物には `.asc` 署名ファイルが含まれている必要があります。**

問題が発生した場合は、次の順序でロールバックします。

1. ローカルのタグを削除します。
2. リポジトリ上のタグを削除します。
3. ローカルに新しく生成された二つのコミットを削除します。
4. Staging Repository のページでステージングを `drop` します。
5. 上記の手順をやり直します。

確認が終わったら、ページの `close` ボタンをクリックして Staging リリースを完了します。

### 2.3 SVN の準備

#### 2.3.1 SVN リポジトリのチェックアウト

```shell
svn co https://dist.apache.org/repos/dist/dev/doris/
```

#### 2.3.2 タグのソースのパッケージ化と署名の生成

`1.0.0` を例に示します。他のタグでも操作は同様です。

```shell
git archive --format=tar 1.14_2.12-1.0.0 --prefix=apache-doris-sdk-1.0.0-src/ | gzip > apache-doris-sdk-1.0.0-src.tar.gz
gpg -u xxx@apache.org --armor --output apache-doris-sdk-1.0.0-src.tar.gz.asc  --detach-sign apache-doris-sdk-1.0.0-src.tar.gz
sha512sum apache-doris-sdk-1.14_2.12-1.0.0-src.tar.gz > apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

macOS では、`shasum` を `sha512sum` の代わりに使用します。

```shell
shasum -a 512 apache-doris-sdk-1.0.0-src.tar.gz > apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

最終的に、次の三つのファイルができます。

```text
apache-doris-sdk-1.0.0-src.tar.gz
apache-doris-sdk-1.0.0-src.tar.gz.asc
apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

#### 2.3.3 SVN へのアップロード

この三つのファイルを SVN の `doris/doris-sdk/1.0.0/` ディレクトリに移動します。最終的な SVN のディレクトリ構成は次のとおりです。

```text
├── 1.2.3-rc01
│   ├── apache-doris-1.2.3-src.tar.gz
│   ├── apache-doris-1.2.3-src.tar.gz.asc
│   ├── apache-doris-1.2.3-src.tar.gz.sha512
...
├── KEYS
├── doris-sdk
│   └── 1.0.0
│       ├── apache-doris-sdk-1.0.0-src.tar.gz
│       ├── apache-doris-sdk-1.0.0-src.tar.gz.asc
│       └── apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

ここで、`1.2.3-rc01` は Doris 本体のリポジトリ用のディレクトリで、`doris-sdk/1.0.0` には今回のリリースの内容が格納されます。

KEYS ファイルの準備手順については、[リリースの準備](./release-prepare)を参照してください。

### 2.4 投票

`dev@doris.apache.org` メーリングリストで投票を開始します。次のメールテンプレートを使用します。

```text
Hi All,

This is a call for the vote to release Apache Doris-SDK 1.0.0

The git tag for the release:
https://github.com/apache/doris-sdk/releases/tag/1.0.0

Release Notes are here:
https://github.com/apache/doris-sdk/blob/1.0.0/CHANGE-LOG.txt

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-sdk/1.0.0/

KEYS file is available here:
https://downloads.apache.org/doris/KEYS

To verify and build, you can refer to following link:
https://doris.apache.org/community/release-and-verify/release-verify

The vote will be open for at least 72 hours.

[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because …
```

## 3. リリースの完了

投票が可決されたら、残りのリリース手順について[リリースの完了](./release-complete)を参照してください。

## 付録: SNAPSHOT の公開

Snapshot は Apache の正式なリリースバージョンではなく、リリース前のプレビューにのみ使用します。PMC で協議して承認された後、Snapshot バージョンを公開できます。

Doris SDK のディレクトリに移動して、次のコマンドを実行します。

```shell
mvn deploy
```

公開した Snapshot バージョンは次の場所で確認できます。

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-sdk/
```

## FAQ

### Q1: `mvn release:prepare` が `gpg: no valid OpenPGP data found` で失敗する

GPG が現在の端末に紐付いていません。`export GPG_TTY=$(tty)` を実行して再試行します。

### Q2: Staging 段階の `close` が `No public key` で失敗する

GPG の公開鍵がキーサーバーにアップロードされていません。次のコマンドを実行して、公開鍵をパブリックキーサーバーに同期します。

```shell
gpg --keyserver hkp://keyserver.ubuntu.com --send-keys <KEY_ID>
```

`<KEY_ID>` は `gpg -k` で確認できます。

### Q3: 操作を間違えた場合、どうすればロールバックできますか？

次の手順を順番に実行します。

1. ローカルのタグを削除します: `git tag -d <tag>`。
2. リモートのタグを削除します: `git push upstream --delete <tag>`。
3. ローカルの二つのリリースコミットを取り消します。
4. Staging Repositories のページでステージングを `drop` します。
5. `mvn release:prepare` と `mvn release:perform` を再実行します。
