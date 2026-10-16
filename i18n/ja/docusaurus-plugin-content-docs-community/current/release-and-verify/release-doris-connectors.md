---
title: Apache Doris Connectors のリリース
language: ja
description: "Apache Doris Spark/Flink Connector のリリース手順：Maven Staging、SVN へのアップロード、コミュニティ投票。"
keywords:
    - Apache Doris Connector のリリース
    - Spark Connector
    - Flink Connector
    - Maven Staging
    - Apache の投票
    - SVN dist
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

# Apache Doris Connectors のリリース

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Release / Apache vote process -->

現在、Doris Connectors には Flink Connector と Spark Connector が含まれます。どちらのリポジトリも Doris のメインリポジトリとは独立しています。

| Connector | リポジトリ |
| --- | --- |
| Flink Connector | [https://github.com/apache/doris-flink-connector](https://github.com/apache/doris-flink-connector) |
| Spark Connector | [https://github.com/apache/doris-spark-connector](https://github.com/apache/doris-spark-connector) |

このドキュメントでは Spark Connector 1.2.0 を例に、Connector コンポーネントの Maven Staging と SVN の準備からコミュニティ投票までの一連の手順を説明します。

## リリースの準備

まず、[リリースの準備](./release-prepare)を参照し、署名、SVN、Maven の環境をセットアップします。

## Maven へのリリース

### 1. ブランチとタグの準備

リポジトリで `release-1.2.0` ブランチを作成し、そのブランチに切り替えます。

`revision` のバージョンを `pom.xml` で `1.2.0` に変更し、コミットします。

```bash
git commit -a -m "Commit for release 1.2.0"
```

タグを作成してプッシュします。

```bash
git tag 1.2.0
git push origin 1.2.0
```

### 2. Maven Staging へのリリース

Spark Connector は Spark のバージョン（2.3、3.1、3.2 など）ごとに個別のリリースを公開するため、それぞれを個別にビルドして公開する必要があります。以下では Spark 2.3 と Scala 2.11 を例に説明します。

まず、ローカルでインストールして検証します。

```bash
mvn clean install \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3
```

> 関連するパラメーターについては、`build.sh` スクリプトのビルドコマンドを参照してください。`revision` は今回のリリースのバージョン番号です。

Apache Staging リポジトリに公開します。

```bash
mvn deploy \
-Papache-release \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3
```

コマンドが成功すると、公開された新しいバージョンが [https://repository.apache.org/#stagingRepositories](https://repository.apache.org/#stagingRepositories) に表示されます。

![](/images/staging-repositories.png)

:::caution 注意
成果物に `.asc` 署名ファイルが含まれていることを確認してください。
:::

問題がある場合は、この Staging リポジトリを破棄し、上記の手順をやり直します。

すべて正しいことを確認したら、`close` ボタンをクリックして Staging リリースを完了します。

### 3. SVN の準備

Dev SVN リポジトリをチェックアウトします。

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

タグのソースコードをパッケージ化し、署名ファイルと SHA512 チェックサムファイルを生成します（以下は `1.2.0` の例です）。

```bash
git archive --format=tar release-1.2.0 --prefix=apache-doris-spark-connector-1.2.0-src/ | gzip > apache-doris-spark-connector-1.2.0-src.tar.gz

gpg -u xxx@apache.org --armor --output apache-doris-spark-connector-1.2.0-src.tar.gz.asc  --detach-sign apache-doris-spark-connector-1.2.0-src.tar.gz
sha512sum apache-doris-spark-connector-1.2.0-src.tar.gz > apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

macOS では、次のコマンドを使用します。

```bash
shasum -a 512 apache-doris-spark-connector-1.2.0-src.tar.gz > apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

これにより、次の三つのファイルが生成されます。

| ファイル | 用途 |
| --- | --- |
| `apache-doris-spark-connector-1.2.0-src.tar.gz` | ソースパッケージ |
| `apache-doris-spark-connector-1.2.0-src.tar.gz.asc` | GPG 署名ファイル |
| `apache-doris-spark-connector-1.2.0-src.tar.gz.sha512` | SHA512 チェックサムファイル |

三つのファイルを SVN ディレクトリに移動します。

```text
doris/spark-connector/1.2.0/
```

SVN ディレクトリ全体の構成は次のとおりです。

```text
|____0.15
| |____0.15.0-rc04
| | |____apache-doris-0.15.0-incubating-src.tar.gz.sha512
| | |____apache-doris-0.15.0-incubating-src.tar.gz.asc
| | |____apache-doris-0.15.0-incubating-src.tar.gz
|____KEYS
|____spark-connector
| |____1.2.0
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz.asc
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

この構成では、`0.15` は Doris のメインコードのディレクトリで、`spark-connector/1.2.0` に今回のリリースの内容が格納されます。

> KEYS ファイルの準備方法については、[リリースの準備](./release-prepare)の該当セクションを参照してください。

### 4. 投票

次のテンプレートを使用して、`dev@doris.apache.org` メーリングリストで投票を開始します。

```text
Hi all,

This is a call for the vote to release Apache Doris Spark Connector 1.2.0

The git tag for the release:
https://github.com/apache/doris-spark-connector/releases/tag/1.2.0

Release Notes are here:
https://github.com/apache/doris-spark-connector/issues/109

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/spark-connector/1.2.0/

Maven 2 staging repository:
https://repository.apache.org/content/repositories/orgapachedoris-1031


KEYS file is available here:
https://downloads.apache.org/doris/KEYS

To verify and build, you can refer to following link:
https://doris.apache.org/community/release-and-verify/release-verify

The vote will be open for at least 72 hours.

[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...
```

## リリースの完了

残りのリリース手順については、[リリースの完了](./release-complete)を参照してください。

## 付録：SNAPSHOT の公開

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-release preview -->

Snapshot は Apache の正式なリリースバージョンではなく、リリース前のプレビューにのみ使用します。Snapshot バージョンは、PMC での議論と承認を経た後にのみ公開できます。

Spark Connector のディレクトリに移動します（Spark 2.3 と Scala 2.11 の場合）。

```bash
cd spark-doris-connector
mvn deploy \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3 \
```

公開後、Snapshot バージョンは次の場所から利用できます。

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-spark-connector/
```

## FAQ / トラブルシューティング

**Q: `mvn deploy` で `gpg: signing failed: Inappropriate ioctl for device` と表示された場合は？**

`export GPG_TTY=$(tty)` を実行して、再試行してください。

**Q: Staging リポジトリに `.asc` 署名ファイルがない場合は？**

`mvn deploy` コマンドに `-Papache-release` が含まれているか確認し、`~/.m2/settings.xml` と `settings-security.xml` が正しく設定されていることを確認してください。成果物が不足している場合は、この Staging リポジトリを破棄して `mvn deploy` を再実行します。

**Q: 同じリリースで、Spark のバージョンごとに複数の成果物を公開するには？**

Spark/Scala のバージョンの組み合わせごとに `mvn deploy` を個別に実行し、その都度、異なる `-Dspark.version`、`-Dscala.version`、`-Dspark.major.version` を指定します。すべての組み合わせが完了してから、Staging リポジトリをまとめてクローズします。
