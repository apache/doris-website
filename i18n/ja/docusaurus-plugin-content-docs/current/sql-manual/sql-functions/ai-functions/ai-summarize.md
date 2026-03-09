---
{
  "title": "AI_SUMMARIZE",
  "language": "ja",
  "description": "テキストの簡潔な要約を生成するために使用されます。"
}
---
<!-- 
Apache Software Foundation (ASF) の下で1つまたは複数のコントリビューター
ライセンス契約に基づきライセンスされています。著作権所有権に関する
追加情報については、この作業と共に配布されるNOTICEファイルを
参照してください。ASFはこのファイルをApache License, Version 2.0
（「ライセンス」）の下であなたにライセンスします。ライセンスに
準拠する場合を除き、このファイルを使用することはできません。
ライセンスのコピーは以下で入手できます：

  http://www.apache.org/licenses/LICENSE-2.0

適用法で要求されるか書面で合意されない限り、ライセンスの下で
配布されるソフトウェアは、明示または黙示を問わず、いかなる種類の
保証または条件もなく、「現状のまま」で配布されます。ライセンスの下で
許可される特定の言語での権限と制限については、ライセンスを
参照してください。
-->

## 説明

テキストの簡潔な要約を生成するために使用されます。

## 構文

```sql
AI_SUMMARIZE([<resource_name>], <text>)
```
## パラメータ

|    パラメータ      | 説明                |
| ----------------- | ------------------------- |
| `<resource_name>` | 指定されたリソース名|
| `<text>`          | 要約対象のテキスト  |

## 戻り値

テキストの簡潔な要約を返します。

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は変動する可能性があります。

## 例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SUMMARIZE('Apache Doris is an MPP-based real-time data warehouse known for its high query speed.') AS Result;
```
```text
+-------------------------------------------------------------------+
| Result                                                            |
+-------------------------------------------------------------------+
| Apache Doris is a high-speed, MPP-based real-time data warehouse. |
+-------------------------------------------------------------------+
```
```sql
SELECT AI_SUMMARIZE('resourse_name','Doris supports high-concurrency, real-time analytics and is widely used in business intelligence scenarios.') AS Result;
```
```text
+------------------------------------------------------------------------------------------------+
| Result                                                                                         |
+------------------------------------------------------------------------------------------------+
| Doris is a high-concurrency, real-time analytics tool commonly used for business intelligence. |
+------------------------------------------------------------------------------------------------+
```
