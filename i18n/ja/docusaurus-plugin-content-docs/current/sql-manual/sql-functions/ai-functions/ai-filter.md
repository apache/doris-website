---
{
  "title": "AI_FILTER",
  "language": "ja",
  "description": "指定された条件に基づいてテキストをフィルタリングします。"
}
---
<!-- 
Apache Software Foundation (ASF) にライセンスされており、
一つまたは複数の貢献者ライセンス契約の下にあります。著作権所有権に
関する追加情報については、この作業と共に配布されるNOTICEファイルを
参照してください。ASFは、Apache License, Version 2.0
（「License」）の下でこのファイルをあなたにライセンスします。
あなたはライセンスに従わない限り、このファイルを使用することはできません。
ライセンスのコピーは以下で入手できます：

  http://www.apache.org/licenses/LICENSE-2.0

適用法により要求される場合、または書面で同意された場合を除き、
ライセンスの下で配布されるソフトウェアは「AS IS」ベースで配布され、
明示または黙示を問わず、いかなる種類の保証または条件もありません。
ライセンスの下での特定の言語による権限と制限については、
ライセンスを参照してください。
-->

## 説明

与えられた条件に基づいてテキストをフィルタリングします。

## 構文

```sql
AI_FILTER([<resource_name>], <text>)
```
## パラメータ

| Parameter         | Description                       |
|-------------------|-----------------------------------|
| `<resource_name>` | 指定されたリソース名、オプション |
| `<text>`          | 評価対象の情報   |

## 戻り値

boolean値を返します。

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は固定されない場合があります。

## 例

以下の表は、宅配会社が受け取ったコメントを表しているとします：

```sql
CREATE TABLE user_comments (
    id      INT,
    comment VARCHAR(500)
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "1"
);
```
ポジティブなコメントをクエリしたい場合は、以下を使用できます：

```sql
SELECT id, comment FROM user_comments
WHERE AI_FILTER('resource_name', CONCAT('This is a positive comment: ', comment));
```
結果は次のようになります：

```text
+------+--------------------------------------------+
| id   | comment                                    |
+------+--------------------------------------------+
|    1 | Absolutely fantastic, highly recommend it. |
|    3 | This product is amazing and I love it.     |
+------+--------------------------------------------+
```
