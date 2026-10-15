---
title: Apache Doris リリースの準備
language: ja
description: "Apache Doris のリリース準備：GPG 署名、Maven の設定、DISCUSS スレッド、およびリリースプロセス全体。"
keywords:
    - Apache Doris のリリース準備
    - リリースマネージャー
    - GPG 署名 PGP 鍵
    - Apache の投票プロセス
    - Maven settings.xml
    - Apache SVN dist
    - DISCUSS
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

# Apache Doris リリースの準備

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Version release / Apache voting process / Release Manager preparation -->

Apache プロジェクトのリリースでは、Apache Software Foundation のリリースプロセスを厳守する必要があります。このページでは、Apache Doris のリリースプロセス全体、署名環境の構築、Maven のリリース設定について説明します。初めてリリースマネージャーを務める PMC メンバーまたはコミッターを対象としています。

関連する Apache の公式ポリシーとガイド：

- [リリース作成プロセス](https://infra.apache.org/release-publishing)
- [リリースポリシー](https://www.apache.org/legal/release-policy.html)
- [Maven リリースの Maven Central Repository への公開](https://infra.apache.org/publishing-maven-artifacts.html)

各コンポーネントの詳しいリリース手順については、以下を参照してください：

- [Doris Core のリリース](./release-doris-core)
- [Doris Connectors のリリース](./release-doris-connectors)
- [Doris Shade のリリース](./release-doris-shade)
- [Doris SDK のリリース](./release-doris-sdk)

## リリースの形態

Apache プロジェクトのリリースには、主に次の三つの形態があります：

| 形態 | 説明 | 必須かどうか |
| --- | --- | --- |
| ソースリリース | ソースコードのリリース | 必須 |
| バイナリリリース | バイナリ（コンパイル済みの実行ファイル）のリリース | 任意 |
| 利便性のためのバイナリ | Maven や Docker などのサードパーティプラットフォームに公開するバイナリパッケージ | 任意 |

## リリースプロセス全体

<!-- Knowledge type: Procedure -->

各リリースでは、PMC メンバーまたはコミッターが**リリースマネージャー**を務める必要があります。全体の流れは次のとおりです：

1. **環境のセットアップ**：GPG と SVN をインストールし、署名用の公開鍵を生成します（後述）。
2. **リリースの準備**：
    1. コミュニティで DISCUSS スレッドを開始し、具体的なリリース計画を議論します。
    2. リリース用のブランチを作成します。
    3. 対象バージョンの Issue を整理します。
    4. 必要なパッチをリリースブランチにマージします。
3. **ブランチの検証**：
    1. QA で安定性をテストします。
    2. ブランチのコードのビルドプロセスを検証します。
    3. リリースノートを準備します。
4. **リリース成果物の準備**：
    1. リリースにタグを付けます。
    2. リリースする成果物を [Apache Dev SVN リポジトリ](https://dist.apache.org/repos/dist/dev/doris)にアップロードします。
    3. その他の利便性のためのバイナリを準備します（例：[Maven Staging リポジトリ](https://repository.apache.org/#stagingRepositories)にアップロードします）。
5. **コミュニティでの投票**：
    1. Doris コミュニティの Dev メーリングリスト（`dev@doris.apache.org`）で投票を開始します。
    2. 投票が可決されたら、結果を知らせるメールを送信します。
6. **完了作業**：
    1. 署名済みのパッケージを [Apache Release リポジトリ](https://dist.apache.org/repos/dist/release/doris/)にアップロードし、ダウンロードリンクを生成します。
    2. Doris の Web サイトと GitHub にダウンロードリンクを公開し、SVN 上の旧バージョンのパッケージを整理します。
    3. `dev@doris.apache.org` にアナウンスメールを送信します。

## 署名環境の準備

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: First time acting as Release Manager -->

初めてリリースする場合は、ローカル環境に次のツールを準備してください：

| ツール | 用途 | 参考資料 |
| --- | --- | --- |
| リリース署名 | Apache の署名要件を理解する | [リリース署名](https://www.apache.org/dev/release-signing.html) |
| gpg | 署名鍵を生成し、リリースパッケージに署名する | [openpgp](https://www.apache.org/dev/openpgp.html) |
| svn | リリース成果物を Apache SVN にアップロードする | [openpgp](https://www.apache.org/dev/openpgp.html) |

### GPG 鍵の準備

リリース前に、リリースマネージャーは署名用の公開鍵を生成して公開鍵サーバーにアップロードし、その鍵でリリースパッケージに署名する必要があります。

> 鍵がすでに [Apache Doris の KEYS ファイル](https://downloads.apache.org/doris/KEYS)に含まれている場合は、このセクションを省略できます。

#### GnuPG のインストール

GnuPG（略称 GPG）は PGP のフリーソフトウェア実装であり、鍵の生成とファイルへの署名に使用します。

CentOS でのインストールコマンド：

```bash
yum install gnupg
```

インストール後、デフォルトの設定ファイルは次の場所にあります：

```text
~/.gnupg/gpg.conf
```

ファイルが存在しない場合は、空のファイルを作成できます。

Apache では署名に SHA512 を推奨しています。`gpg.conf` を編集し、次の三行を追記します：

```text
personal-digest-preferences SHA512
cert-digest-algo SHA512
default-preference-list SHA512 SHA384 SHA256 SHA224 AES256 AES192 AES CAST5 ZLIB BZIP2 ZIP Uncompressed
```

#### GPG のバージョンの確認

GPG が SHA512 をサポートしていることを確認します：

```bash
$ gpg --version
gpg (GnuPG) 2.0.22
libgcrypt 1.5.3
Copyright (C) 2013 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Home: ~/.gnupg
Supported algorithms:
Pubkey: RSA, ?, ?, ELG, DSA
Cipher: IDEA, 3DES, CAST5, BLOWFISH, AES, AES192, AES256, TWOFISH,
        CAMELLIA128, CAMELLIA192, CAMELLIA256
Hash: MD5, SHA1, RIPEMD160, SHA256, SHA384, SHA512, SHA224
Compression: Uncompressed, ZIP, ZLIB, BZIP2
```

:::caution 注意
SecureCRT などのターミナルからユーザーアカウントに直接ログインする必要があります。`su - user` や `ssh` を経由するとパスフレーズの入力画面が表示されず、操作に失敗します。
:::

#### 署名鍵の生成

`gpg --gen-key` を実行し、以下の推奨設定に従って入力します：

| 項目 | 推奨値 | 備考 |
| --- | --- | --- |
| 鍵の種類 | `1`（RSA and RSA） | デフォルト |
| 鍵長 | `4096` | Apache は 4096 ビット以上を推奨 |
| 有効期間 | `0` | 有効期限なし |
| 実名 | [id.apache.org](https://id.apache.org) に表示される ID と同じ | 必須 |
| メールアドレス | Apache のメールアドレス（`xxx@apache.org`） | 必須 |

対話形式の実行例全体：

```text
$ gpg --gen-key
gpg (GnuPG) 2.0.22; Copyright (C) 2013 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Please select what kind of key you want:
   (1) RSA and RSA (default)
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
Your selection? 1
RSA keys may be between 1024 and 4096 bits long.
What keysize do you want? (2048) 4096
Requested keysize is 4096 bits
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0)
Key does not expire at all
Is this correct? (y/N) y

GnuPG needs to construct a user ID to identify your key.

Real name: xxx
Name must be at least 5 characters long
Real name: xxx-yyy
Email address: xxx@apache.org
Comment: xxx's key
You selected this USER-ID:
    "xxx-yyy (xxx's key) <xxx@apache.org>"

Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit? o
```

続いて、パスフレーズを二回入力します（8 文字以上）。

:::danger 重要
ここで設定したパスフレーズを必ず覚えておいてください。後の署名や、ほかのコンポーネントのリリースで使用します。
:::

`gpg --gen-key` が長時間応答しない場合は、次のいずれかの方法でエントロピーを補充します：

- 別のターミナルを開き、`find / | xargs file` を実行して乱数を生成します。
- `rng-tools` をインストール（`yum install rng-tools`）し、`rngd -r /dev/urandom` を実行します。これにより、鍵の生成がほぼ瞬時に完了します。

#### 公開鍵の表示とエクスポート

```bash
$ gpg --list-keys
/home/lide/.gnupg/pubring.gpg
-----------------------------
pub   4096R/33DBF2E0 2018-12-06
uid                  xxx-yyy  (xxx's key) <xxx@apache.org>
sub   4096R/0E8182E6 2018-12-06
```

ここで、`xxx-yyy` はユーザー ID、`33DBF2E0` は短いフィンガープリントです。

公開鍵をファイルにエクスポートします：

```bash
gpg --armor --output public-key.txt --export [user ID]
```

例：

```bash
$ gpg --armor --output public-key.txt --export xxx-yyy
File 'public-key.txt' already exists. Overwrite? (y/N) y
$ cat public-key.txt
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v2.0.22 (GNU/Linux)

mQINBFwJEQ0BEACwqLluHfjBqD/RWZ4uoYxNYHlIzZvbvxAlwS2mn53BirLIU/G3
9opMWNplvmK+3+gNlRlFpiZ7EvHsF/YJOAP59HmI2Z...
```

#### 公開鍵サーバーへの公開鍵のアップロード

`--send-keys` を使用して、公開鍵を Ubuntu の鍵サーバーにアップロードします：

```bash
gpg --send-keys xxxx --keyserver https://keyserver.ubuntu.com/
```

ここで `xxxx` は、前の手順の `pub` の後にある文字列です（`--list-keys` の出力内。例：`33DBF2E0`）。

`public-key.txt` の内容を貼り付け、[https://keyserver.ubuntu.com/](https://keyserver.ubuntu.com/) の Web ページからアップロードすることもできます。

アップロードが成功したら、そのページに `0x33DBF2E0` と入力して鍵を検索できます（先頭の `0x` に注意してください）。サイトの検索結果の反映には遅延があるため、約一時間待つ必要がある場合があります。

#### フィンガープリントの生成と Apache アカウントへの紐付け

鍵サーバーは本人確認を行わないため、誰でもあなたの名前で公開鍵をアップロードできます。そのため、他の人が照合できるように、[id.apache.org](https://id.apache.org) でフィンガープリントを紐付ける必要があります。

フィンガープリントを生成します：

```bash
gpg --fingerprint [user ID]
```

例：

```text
$ gpg --fingerprint xxx-yyy
pub   4096R/33DBF2E0 2018-12-06
      Key fingerprint = 07AA E690 B01D 1A4B 469B  0BEF 5E29 CE39 33DB F2E0
uid                  xxx-yyy (xxx's key) <xxx@apache.org>
sub   4096R/0E8182E6 2018-12-06
```

完全なフィンガープリント（`07AA E690 B01D 1A4B 469B  0BEF 5E29 CE39 33DB F2E0`）を `OpenPGP Public Key Primary Fingerprint` フィールドに貼り付けます。このフィールドは [https://id.apache.org](https://id.apache.org) にあります。

> 注：各 Apache アカウントには複数の公開鍵を紐付けられます。

#### KEYS ファイルへの公開鍵の追記

:::danger 重要
**KEYS ファイルの既存の内容を削除しないでください。** 新しいエントリは追記してください。
:::

Dev と Release の両方の SVN リポジトリに、順番に鍵を追記します：

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
# edit doris/KEYS file
gpg --list-sigs [user ID] >> doris/KEYS
gpg --armor --export [user ID] >> doris/KEYS
svn ci --username $ASF_USERNAME --password "$ASF_PASSWORD" -m"Update KEYS"
```

```bash
svn co https://dist.apache.org/repos/dist/release/doris
# edit doris/KEYS file
svn ci --username $ASF_USERNAME --password "$ASF_PASSWORD" -m"Update KEYS"
```

変更はその後、次の場所に自動的に同期されます：

```text
https://downloads.apache.org/doris/KEYS
```

以後のリリース投票メールでは、`https://downloads.apache.org/doris/KEYS` を使用してください。

## Maven リリースの準備

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Release Doris Connector / Shade / SDK -->

Doris Connector、Shade、SDK などのコンポーネントのリリースには Maven を使用します。そのため、`~/.m2/settings.xml` と `~/.m2/settings-security.xml` の設定が必要です。

### 1. マスターパスワードの生成

マスターパスワードは、後でほかのパスワードを暗号化するために使用します：

```bash
mvn --encrypt-master-password <password>
```

出力は `{VSb+6+76djkH/43...}` のような形式です。これを `~/.m2/settings-security.xml` に記述します：

```xml
<settingsSecurity>
  <master>{VSb+6+76djkH/43...}</master>
</settingsSecurity>
```

### 2. Apache アカウントのパスワードの暗号化

```bash
mvn --encrypt-password <password>
```

`<password>` は Apache アカウントのパスワードです。出力は `{GRKbCylpwysHfV...}` のような形式です。

次の `<servers>` 設定を `~/.m2/settings.xml` に追加します：

```xml
<servers>
  <!-- To publish a snapshot of your project -->
  <server>
    <id>apache.snapshots.https</id>
    <username>yangzhg</username>
    <password>{GRKbCylpwysHfV...}</password>
  </server>
  <!-- To stage a release of your project -->
  <server>
    <id>apache.releases.https</id>
    <username>yangzhg</username>
    <password>{GRKbCylpwysHfV...}</password>
  </server>
</servers>
```

二つの `server id` の用途：

| サーバー ID | 用途 |
| --- | --- |
| `apache.snapshots.https` | SNAPSHOT バージョンを公開する |
| `apache.releases.https` | Release バージョンを Staging リポジトリに公開する |

## コミュニティでの DISCUSS スレッドの開始

<!-- Knowledge type: Procedure -->

リリース前に DISCUSS スレッドを開始することは必須ではありませんが、重要なリリースでは `dev@doris.apache.org` メーリングリストで開始することを**強く推奨**します。議題には、次のようなものがあります：

- 重要な機能の説明と設計上のポイント。
- バグ修正の説明。
- 互換性の変更とアップグレード時の注意事項。
- リリース予定日。

## FAQ／トラブルシューティング

**Q：`gpg --gen-key` が応答しません。どうすればよいですか？**

エントロピーが不足していることが原因です。`find / | xargs file` を実行するか、`rng-tools` をインストールして `rngd -r /dev/urandom` を実行し、乱数源を補充してください。

**Q：署名時に `gpg: signing failed: Inappropriate ioctl for device` というエラーが発生します。どうすればよいですか？**

ターミナルがパスフレーズの入力を受け取れません。`export GPG_TTY=$(tty)` を実行してから、もう一度試してください。

**Q：`mvn deploy` で 401 Unauthorized が返されます。どうすればよいですか？**

`apache.releases.https` に設定したユーザー名と暗号化済みパスワードを `~/.m2/settings.xml` で確認し、`~/.m2/settings-security.xml` のマスターパスワードが一致することを確認してください。

**Q：鍵サーバーにアップロードした鍵が見つかりません。どうすればよいですか？**

`keyserver.ubuntu.com` には同期の遅延があり、通常は約一時間かかります。
