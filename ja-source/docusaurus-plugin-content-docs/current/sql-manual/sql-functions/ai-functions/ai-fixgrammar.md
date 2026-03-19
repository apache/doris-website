---
{
  "title": "AI_FIXGRAMMAR",
  "language": "ja",
  "description": "テキストの文法エラーを修正するために使用されます。"
}
---
<!-- 
Apache Software Foundation (ASF) の下で一つまたは複数の
貢献者ライセンス契約に基づいてライセンスされています。著作権所有権に関する
追加情報については、この作業と共に配布されるNOTICEファイルを
参照してください。ASFはこのファイルを
Apache License, Version 2.0（以下
「License」）の下であなたにライセンスします。あなたはLicenseに
準拠する場合を除き、このファイルを使用することはできません。
Licenseのコピーは以下で入手できます

  http://www.apache.org/licenses/LICENSE-2.0

適用法で要求されるか書面で合意されない限り、
Licenseの下で配布されるソフトウェアは
明示または黙示を問わず、いかなる種類の保証や条件もなく
「現状のまま」ベースで配布されます。Licenseの下での
特定の言語での権限と制限については
Licenseを参照してください。
-->

## 説明

テキストの文法エラーを修正するために使用されます。

## 構文

```sql
AI_FIXGRAMMAR([<resource_name>], <text>)
```
## パラメータ

|    パラメータ      | 説明                                 |
| ----------------- | ------------------------------------------- |
| `<resource_name>` | 指定されたリソース名、オプション       |
| `<text>`          | 文法修正されるテキスト            |

## 戻り値

文法修正後のテキスト文字列を返します。

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は変動する可能性があります。

## 例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_FIXGRAMMAR('Apache Doris a great system DB') AS Result;
```
```text
+------------------------------------------+
| Result                                   |
+------------------------------------------+
| Apache Doris is a great database system. |
+------------------------------------------+
```
```sql
SELECT AI_FIXGRAMMAR('resource_name', 'I am like to using Doris') AS Result;
```
```text
+--------------------+
| Result             |
+--------------------+
| I like using Doris |
+--------------------+
```
