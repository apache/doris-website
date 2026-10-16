---
title: ドキュメントの書式仕様
language: ja
description: "Apache Doris ドキュメントの書式仕様。ファイル名、英語の大文字・小文字、SQL 関数、省略形に関する規則を説明します。"
keywords:
    - Apache Doris
    - ドキュメントの書式仕様
    - ファイル名の規則
    - SQL 関数の命名
    - Markdown の仕様
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

<!-- Knowledge Type: Rules and Specifications -->
<!-- Applicable Scenarios: Documentation Contribution / Documentation Review -->

この文書は、Apache Doris ドキュメントの書式仕様です。次の内容を扱います。

1. ファイル名、URL、レイアウトの基本的な書式規則
2. ドキュメント本文で推奨される表示要素

:::caution 注意

- 過去のバージョンと最新バージョンのどちらのドキュメントを編集する場合も、PR は [apache/doris-website](https://github.com/apache/doris-website) リポジトリに提出してください。
- ドキュメントの変更を提出する前に、[ドキュメントへの貢献ガイド](./contribute-doc)を読んでください。

:::

## 基本的な書式仕様

### ファイル名と URL の命名

ドキュメント名は内容を簡潔に表し、長くなりすぎないようにします。Doris の Web サイトではファイル名が URL にも使われるため、ファイル名の規則は `sidebars.json` の項目名にも対応します。

| 規則 | 説明 | 例 |
| --- | --- | --- |
| サイドバーとの一致 | ファイル名は `sidebars.json` 内のドキュメント名と一致させる必要があります | `quick-start` |
| すべて小文字 | ファイル名には小文字のみを使います。大文字と小文字を混在させず、句読点も追加しません | `standard-deployment` |
| ハイフンで区切る | 複数の英単語はハイフン `-` で区切ります。アンダースコア `_` は推奨しません | `bloom-filter-index` |
| 関数名の例外 | 特定の関数名にアンダースコアが含まれる場合は、その関数の命名規則に従います | `array_max` |

### 英語の大文字・小文字に関する規則

| 場面 | 規則 |
| --- | --- |
| 見出し | 最初の単語の頭文字を大文字にします。固有名詞を除き、その他の単語は小文字にします |
| 中国語の文中の英語 | 主に CamelCase に従います。固有名詞は慣例的な表記に従います |
| 中国語と英語の混在 | 中国語のドキュメントでは、できるだけ中国語で表現します。特定の語句や単語に限って英語を使います。英語のドキュメントにも同じ考え方が当てはまります |

### 英語の固有名詞に関する規則

中国語のドキュメントで、正式な中国語訳のない外国企業のブランド名、製品名、技術用語に言及する場合は、適切な大文字・小文字を使って英語名をそのまま記載します。以下の表は随時更新します。PR で項目を追加できます。

| 正式な中国語訳がない語 |
| --- |
| GitHub |
| SQL |
| CPU |
| FE |
| BE |
| HTTP |
| MySQL |
| MongoDB |
| Elasticsearch |
| Azure |
| AWS |
| S3 |
| Doris Manager |
| WebUI |
| Flink Doris Connector |

### SQL 関数と SQL マニュアルに関する規則

| 場面 | 規則 | 例 |
| --- | --- | --- |
| SQL 関数名 | すべて大文字にします。構文上の慣例に従い、文字列をアンダースコア `_` で区切ります | `ARRAY_MAX`, `DIGITAL_MASKING` |
| DML / DDL / データ型 / クラスタ管理 | 大文字にします。文字列は半角スペースで区切ります | `ALTER CATALOG`, `SELECT * FROM` |
| 例と参照 | 小文字も使用できます | `col_name1`, `sample_value` |

SQL 関数のドキュメントの構成については、[ドキュメントへの貢献ガイドの「コマンドヘルプマニュアルの書き方」](./contribute-doc#how-to-write-the-command-help-manual)を参照してください。

### 省略形に関する規則

省略形には中国語の省略形と英語の省略形があります。以下の規則に従ってください。

**中国語の省略形**: 分かりやすく、曖昧さのない省略形にしてください。初出時に正式名称を説明し、以降は省略形を使うことを読者に知らせることを推奨します。

**英語の省略形**:

- 見出しでは英語の省略形を説明しません
- 本文で省略形が最初に現れるときは、`Tablet & Partition`（以降のドキュメントでは「partitions and buckets」と呼びます）のように、正式名称を説明することを推奨します
- 標準的でない省略形は使いません

:::tip

| 誤り | 正しい表記 |
| --- | --- |
| 16c32g | 16 cores, 32 GB |
| 10w | 100,000 |

:::

## ドキュメントの構成に関する規則

### 見出し

適切な見出しレベルと見出しの表現は、読者がドキュメント全体の論理を理解し、構成をひと目で把握するのに役立ちます。

**1. 見出しレベル**

技術ドキュメントの見出しレベルは最大二段階です。**本文の見出しは `##` から始め、レベルを飛ばさずに下げてください。**

| レベル | 構文 | 説明 |
| --- | --- | --- |
| レベル 1 の見出し | `{ "title": "", "language": "" }` | 記事のタイトルです。**記事のタイトルに `#` を使わないでください** |
| レベル 2 の見出し | `##` | 記事本文の見出しです |
| レベル 3 の見出し | `###` | レベル 2 の見出しの下に置く小見出しです |

```markdown
{
    "title": "Document title (the # level 1 heading)",
    "language": "en"
}


## Level 2 heading

### Level 3 heading
```

**2. 見出しの表現形式**

技術ドキュメントの見出しには、例えば次のような表現形式があります。

- 名詞句。例: 「High-Concurrency Point Query Principles」
- トピック + 動詞。例: 「Docker Deployment」
- 動詞 + トピック。例: 「Configuration File Directory」
- 修飾語 + トピック。例: 「Schema Change」または「Flink Doris Connector User Guide」
- 前置詞 + 修飾語 + トピック。例: 「Deploying with Doris Operator」

**3. その他の注意事項**

見出しの表現に厳密なテンプレートはありません。次の原則に従ってください。

- セクションの中心となる内容を簡潔にまとめます
- 同じレベルの見出しには、できるだけ同じ表現形式を使います
- **子見出しで親見出しの内容を繰り返さないでください**
- **見出しの末尾に句読点を付けないでください**
- 見出しでは省略形を説明しません

### 導入文

導入文は本文の前に置きます。ドキュメントの概要を示し、可能であれば 150 語以内に収めてください。

次の二つの書き方を参考にできます。

- XXX とは何かを説明する。例: 「Data Export はデータをエクスポートする Doris の機能です。これは...」
- この文書が XXX を紹介することを述べる。例: 「この文書では、Data Export の基本原理、使い方、ベストプラクティス、注意事項を紹介します」

## ドキュメント本文の要素（参考）

### Tab キーの使い方

技術ドキュメントでは、インデントや位置合わせに Tab キーとスペースキーをよく使います。そのため、次の方法を推奨します。

- インデントには Tab を使います。インデントで Tab とスペースを混在させないでください
- Visual Studio Code などのエディターでは、Tab 一つを半角スペース四つに統一します
- インデントはドキュメントの表示に影響します。**VS Code などのリッチテキストエディターでの表示を基準にしてください**（例えば、多段階にインデントされた構造内のコードブロックでも、正しく表示するためにインデントをなくす必要がある場合があります）

### スペースの使い方

- 中国語の前後に英語または数字が隣接する場合は、半角スペースを入れます
- 中国語にコードボックスが隣接する場合は、コードボックスの前後に半角スペースを入れます
- **括弧の内側**にはスペースを入れません。**括弧の外側**には前後に半角スペースを入れます

:::tip

半角スペースを一括追加するツール: https://github.com/huacnlee/autocorrect

:::

### 番号付きリストと箇条書き

技術ドキュメントの本文では、番号付きリストと箇条書きをよく使います。番号付きリストは通常、項目間の優先順位を示します。

- **番号付き項目には `1. **Bold ordered text**` という形式を推奨します**。これにより、項目のテキストがインデントされずに親レベルに揃います
- 番号付き項目の中に箇条書きを入れる場合は、番号付き項目のテキストを太字にし、箇条書きのテキストは太字にしません

### リンク

ドキュメント内のリンクは、関連ドキュメントや外部サイトへ読者を案内します。次の規則に従うことを推奨します。

- **リンクの説明**: 同じ種類のリンクには一貫した表現を使います。一つのドキュメント内で「詳しくはこちら」「詳細はこちらを参照」「詳細はこちらにあります」などの表現を繰り返さないでください
- **リンクの形式**:
    - 同じドキュメント内の別の見出しへのリンク: `[Inverted Index]`
    - 近くにあるドキュメントへのリンク: `[BITMAP Index]`
    - 外部サイトへのリンク: `[Wikipedia - Inverted Index](https://en.wikipedia.org/wiki/Inverted_index)`
- **リンクのパス**:
    - 一つのドキュメント内では、相対パスか絶対パスのどちらかに統一し、混在させないことを推奨します
    - 外部サイトへの遷移を減らし、リンク先のページが利用できなくなっても読者が困らないようにすることを推奨します。外部サイトへ案内する必要がある場合は、「XXX を開くにはクリックしてください」など、外部サイトに移動することを読者に知らせてください

### コードブロックとコード内のコメント

コードブロックを挿入する際は、次の規則に従ってください。

- インラインコードにはバッククォート一つ（`` ` ``）を使います。複数行のコードにはバッククォート三つを使います
- インラインコードの前後にはスペースを入れます。複数行のコードと本文の間には空行を入れます
- **コードブロックのインデントに注意してください**。番号付きリストや箇条書きの項目内にコードブロックを置く場合は、その項目のインデントレベルに合わせます
- 複数行のコードには、対応する構文ハイライトを使えるように、**コードフェンスを付けて言語を指定する**ことを推奨します

よく使う言語と、そのコードフェンスの指定子は次のとおりです。

| コードの種類 | コードフェンスの指定子 |
| --- | --- |
| シェルスクリプト | ` ```shell ` |
| Python コード | ` ```python ` |
| JSON コード | ` ```json ` |
| XML ドキュメント | ` ```xml ` |
| SQL クエリ（小文字の `sql` を使います。大文字では正しく表示されません） | ` ```sql ` |
| YAML ファイル | ` ```yaml ` または ` ```yml ` |
| Markdown テキスト | ` ```markdown ` または ` ```md ` |
| JavaScript コード | ` ```js ` または ` ```javascript ` |
| Java コード | ` ```java ` |
| C++ コード | ` ```cpp ` |
| C コード | ` ```c ` |
| Ruby コード | ` ```ruby ` |
| HTML コード | ` ```html ` |
| CSS コード | ` ```css ` |
| PHP コード | ` ```php ` |

`shell` コードを使う場合は、入力コマンドと出力結果を分けて記載します。次に Kubernetes クラスタへのアクセスに関するドキュメントの例を示します。

- 次のコマンドを使って、該当する Service を確認します。

    ```shell
    kubectl get pod --namespace doris
    ```

- 出力結果は次のとおりです。

    ```shell
    NAME                     READY   STATUS    RESTARTS   AGE
    doriscluster-helm-fe-0   1/1     Running   0          1m39s
    doriscluster-helm-fe-1   1/1     Running   0          1m39s
    doriscluster-helm-fe-2   1/1     Running   0          1m39s
    doriscluster-helm-be-0   1/1     Running   0          16s
    doriscluster-helm-be-1   1/1     Running   0          16s
    doriscluster-helm-be-2   1/1     Running   0          16s
    ```

### 注意書き

注意書きは、技術ドキュメント内で内容を強調するために使います。用途に応じて次の規則に従ってください。

| 種類 | 用途 | 構文 |
| --- | --- | --- |
| Tip | 主に操作のヒントに使用します | `:::tip Tip` |
| Info | 補足情報や説明に使用します | `:::info Note` |
| Caution | 操作上の警告や注意点に使用します | `:::caution Caution` |

注意書きには、番号付きリスト、箇条書き、コードブロックを含めることができます。

次に、Markdown ドキュメント内の注意書きの例を示します。

```markdown
:::tip Tip
This is a tip
:::

:::info Note
This is a note
:::

:::caution Caution
This is a caution
:::
```

### 画像

画像を挿入する際は、次の規則に従ってください。

- 画像名には `Broadcast Join Principle` のような内容を表すテキストを使います
- 画像を挿入する際は、**代替テキストを追加してください**。推奨する構文は `![Alt text description](https://example.com/your-image.png)` です
- 画像を中央に配置するには、次のようにします。

    ```markdown
    <div style={{textAlign:'center'}}>
    <img src="image URL" alt="text description" style={{display: 'inline-block'}}/>
    </div >
    ```

### 表

表のセル内に改行を挿入するには、`<p>XXXX</p>` を使います。

### 折りたたみボックス

折りたたみボックスはレベル 3 の見出しの後に使います。内容の階層が多すぎる場合は、折りたたみボックスで区切ることができます。

次の規則に従ってください。

- 構文は `<details><summary>Collapsible box title</summary> Collapsible box content</details>` を使います
- 折りたたみボックスのインデントに注意してください。レベル 3 の見出しの下では、行頭から記述します

次に、Markdown で折りたたみボックスを使う例を示します。

```markdown
<details>
<summary>Fill in the title here</summary>
This is the collapsible box content
<p>To add a line break, use an HTML tag</p>
<p>XXXXXXXX</p>
</details>
```

### タブセレクター

タブセレクターはレベル 3 の見出しの後に使います。ドキュメントの内容の階層が多すぎる場合は、タブセレクターのコンテナーを使えます。

次の規則に従ってください。

- タブセレクターのインデントに注意してください。レベル 3 の見出しの下では、行頭から記述します
- 構文は次のとおりです。

```markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="Content title 1" label="Content title 1" default>
    <p>Content 1 </p>
    <p>Content 2 </p>
  </TabItem>
  <TabItem value="Content title 2" label="Content title 2" default>
    <p>Content 1 </p>
    <p>Content 2 </p>
  </TabItem>
</Tabs>
```

### バージョンタグ

新しいドキュメントでは、**複数のドキュメントバージョンを区別するためにバージョンタグを使うことは推奨しません**。機能をバージョン別に区別する必要がある場合は、`:::tip :::` の注意書きで示せます。

### 引用

新しいドキュメントでは、内容の説明や入れ子構造に **`>` の引用記号を使うことは推奨しません**。注記を追加する必要がある場合は、`:::info :::` の注意書きを使ってください。

## 関連ドキュメント

- [ドキュメントへの貢献ガイド](./contribute-doc)
- [ブログを共有する方法](./how-to-share-blogs)
