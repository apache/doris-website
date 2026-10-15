---
title: Java コードのフォーマット規約
language: ja
description: "Apache Doris の Java コードのフォーマット規約。インポート順序、Checkstyle、IDE の設定について説明します。"
keywords:
    - Apache Doris
    - Java コードのフォーマット
    - Checkstyle
    - IDEA
    - VS Code
    - インポート順序
    - formatter-check
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

# Java コードのフォーマット規約

<!-- Knowledge type: Code specification -->
<!-- Applicable scenarios: FE development / Pull Request submission -->

Apache Doris の Java コード（主に FE モジュール）は、通常 IDE で自動的にフォーマットします。このドキュメントでは、基本的なフォーマット規則と、IDE ごとの設定方法を説明します。CI パイプラインでは `formatter-check` によってコードのフォーマットを検証します。

## インポート順序の規則

<!-- Knowledge type: Code specification -->

インポート文は次のグループ順に並べ、各グループの間に空行を一行入れてください。

```text
org.apache.doris
<blank line>
third party package
<blank line>
standard java package
<blank line>
```

追加の規則は次のとおりです。

| 規則 | 説明 |
|------|-------------|
| `import *` を使用しない | 各クラスを明示的にインポートする必要があります |
| `import static` を使用しない | 静的インポートは許可されていません |

## コンパイル時の Checkstyle チェック

`maven` でコンパイルすると、デフォルトで `Checkstyle` のチェックが実行されるため、コンパイルに少し時間がかかります。チェックをスキップするには、次のコマンドを使用します。

```bash
mvn clean install -DskipTests -Dcheckstyle.skip
```

CI の `formatter-check` ではコードのフォーマットが検証されます。ローカルでチェックをスキップするのは、開発やデバッグのときだけにしてください。PR を提出する前に、コードがフォーマット規約に準拠していることを確認してください。

## Checkstyle プラグインの設定

### IDEA で Checkstyle を設定する

1. 設定画面で `Checkstyle-IDEA` プラグインをインストールします。
2. `Tools -> Checkstyle` に移動し、`Configuration File` で `Use a local Checkstyle file` をクリックします。
3. プロジェクトのルートディレクトリにある `fe/check/checkstyle/checkstyle.xml` を選択します。
4. `Checkstyle` のバージョンが 9.3 以降であることを確認します（最新バージョンを推奨します）。

![](/images/idea-checkstyle-version.png)

設定後は、`Checkstyle-IDEA` プラグインを使ってコードの Checkstyle チェックを実行できます。

![](/images/idea-checkstyle-plugin-cn.png)

### VS Code で Checkstyle を設定する

1. `Checkstyle for Java` プラグインをインストールします。
2. [Java のリンティングに関する公式ドキュメント](https://code.visualstudio.com/docs/java/java-linting)の説明とアニメーションに従って設定します。

## IDEA でのコードフォーマット

### 自動フォーマットの設定

IDEA の自動フォーマット機能の使用を推奨します。

1. `Preferences -> Editor -> Code Style -> Java` に移動します。
2. 設定アイコンの `Import Scheme` をクリックし、`IntelliJ IDEA code style XML` を選択します。
3. プロジェクトのルートディレクトリにある `build-support/IntelliJ-code-format.xml` を選択します。

### コードの並べ替え

Checkstyle は、[クラスとインターフェースの宣言](https://www.oracle.com/java/technologies/javase/codeconventions-fileorganization.html#1852)に従ってコード内の宣言順序をチェックします。

上記の `build-support/IntelliJ-code-format.xml` をインポートした後、`Code/Rearrange Code` を使うと自動的に並べ替えられます。

![](/images/idea-rearrange-code.png)

## 未使用のインポートを自動的に削除する

| 目的 | 操作 |
|---------|--------|
| 未使用のインポートだけを削除する | デフォルトのショートカット `CTRL + ALT + O` を使用します |
| 保存時に自動で削除と並べ替えを行う | `Preferences -> Editor -> General -> Auto Import -> Optimize Imports on the Fly` をオンにします |

## FAQ

**Q: CI で `formatter-check` が失敗した場合は、どう調査すればよいですか？**

IDEA または Checkstyle プラグインを使ってローカルでチェックを実行してください。インポート順序、命名規則、宣言順序が `fe/check/checkstyle/checkstyle.xml` の要件を満たしていることを確認してから、再度提出してください。

**Q: ローカルで Checkstyle をスキップすると、PR のマージに影響しますか？**

はい。CI では引き続き `formatter-check` が実行されます。ローカルの `-Dcheckstyle.skip` オプションは、開発時のビルドを速くするためだけのものです。最終的なコードは Checkstyle に合格する必要があります。
