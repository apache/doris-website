---
{
  "title": "CREATE SQL_BLOCK_RULE",
  "language": "ja",
  "description": "このステートメントはSQLブロックルールを作成するために使用されます。"
}
---
## 説明

このステートメントはSQLブロックルールの作成に使用されます。

SQL_BLOCK_RULEは、大量のデータのスキャンを回避するなど、ユーザーが特定の操作を実行することを制限するために使用できます。

## 構文

```sql
CREATE SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```
## 必須パラメータ

**1. `<rule_name>`**

> ルールの名前。

**2. `<property>`**

> ルールのプロパティは3つのカテゴリに分けることができます：SQL実行、スキャン制限、スイッチ。
>
> SQL実行とスキャン制限のカテゴリは相互排他的です。つまり、SQLブロックルールはそのうちの1つのみを制限できます。
>
>
> **SQL実行カテゴリ**

> 2つのタイプがあり、それぞれ正規表現マッチングと完全マッチングを表します。そのうち1つのみを選択できます。
>
> - sql: マッチングルール（正規表現マッチングに基づく。特殊文字はエスケープする必要があります。例：`select *`は`select \\*`と記述する必要があります）。ユーザーがSQL文を実行する際、システムはここで設定されたSQLを正規表現として使用して、ユーザーが送信したSQLとマッチングします。マッチした場合、そのSQLの実行がブロックされます。
> - sqlHash: SQLのMD5ハッシュ値。これは主にスローログと組み合わせて使用されます。ユーザーはハッシュ値を自分で計算する必要はありません。例えば、スローログで特定のSQLが遅く実行されていることが分かった場合、`fe.audit.log`から`SqlHash`をコピーして、このSQLの実行を制限するSQL_BLOCK_RULEを作成できます。
>
> **スキャン制限カテゴリ**
> ユーザーがクエリを開始すると、クエリオプティマイザは各テーブルに対してスキャンが必要なパーティション、tablet、データ行数を計算します。以下のプロパティを使用して、これら3つの数値をすべて同時に制限することも、一部のみを制限することもできます。
> - partition_num: テーブルがスキャンするパーティションの最大数。
> - tablet_num: テーブルがスキャンするtabletの最大数。
> - cardinality: テーブルがスキャンするデータの行数。
>
> **スイッチカテゴリ**
>
> - global: ルールがすべてのユーザーに対して有効かどうか。デフォルトはfalseです。trueに設定されていない場合、ルールは`set property`コマンドを通じて特定のユーザーに適用する必要があります。
> - enable: ブロッキングルールが有効かどうか。デフォルトはtrueです。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege    | Object | Notes |
| ------------ | ------ | ----- |
| ADMIN_PRIV | Global |       |

## 例

1. すべてのユーザーが`select * from order_analysis`を実行することを防ぐルールを作成する

   ```sql
   CREATE SQL_BLOCK_RULE test_rule 
   PROPERTIES(
   "sql"="select \\* from order_analysis",
   "global"="true",
   "enable"="true"
   );
   ```
ルールで定義されたSQLを実行すると、以下に示すように例外エラーが返されます：

   ```sql
   mysql> select * from order_analysis;
   ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: order_analysis_rule
   ```
2. 同一テーブルの30個を超えるパーティションのスキャンを防止し、クエリのデータ量を100億行以下に制限するルールを作成する

   ```sql
   CREATE SQL_BLOCK_RULE test_rule2 
   PROPERTIES
   (
       "partition_num" = "30",
       "cardinality" = "10000000000",
       "global" = "true",
       "enable" = "true"
   );
   ```
3. SQLマッチングは正規表現に基づいています。より多くのSQLパターンをマッチさせたい場合は、対応する正規表現を記述する必要があります。例えば、SQLの空白を無視し、「order」で始まるテーブルへのクエリを防ぐ場合は、以下のように記述します：

   ```sql
   CREATE SQL_BLOCK_RULE test_rule3
   PROPERTIES(
     "sql"="\\s*select\\s*\\*\\s*from order_\\w*\\s*",
     "global"="true",
     "enable"="true"
   );
   ```
4. 特定のユーザーにのみ適用されるルールを作成する

   ```sql
   CREATE SQL_BLOCK_RULE test_rule4
   PROPERTIES(
       "sql"="select \\* from order_analysis",
       "global"="false",
       "enable"="true"
   );
   ```
ユーザー jack にルールを適用する

   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'test_rule4';
   ```
## その他

一般的な正規表現は以下の通りです：

TextCopy

```text
. : Matches any single character except the newline character `\n`.

* : Matches the preceding element zero or more times. For example, a* matches zero or more 'a's.

+ : Matches the preceding element one or more times. For example, a+ matches one or more 'a's.

? : Matches the preceding element zero or one time. For example, a? matches zero or one 'a'.

[] : Defines a character set. For example, [aeiou] matches any vowel.

[^] : When used in a character set, ^ indicates negation, matching characters not in the set. For example, [^0-9] matches any non-digit character.

() : Groups expressions, allowing quantifiers to be applied to them. For example, (ab)+ matches consecutive 'ab's.

| : Indicates logical OR. For example, a|b matches 'a' or 'b'.

^ : Matches the beginning of a string. For example, ^abc matches strings starting with 'abc'.

$ : Matches the end of a string. For example, xyz$ matches strings ending with 'xyz'.

\ : Escapes special characters, making them ordinary characters. For example, \\. matches the period character '.'.

\s : Matches any whitespace character, including spaces, tabs, newlines, etc.

\d : Matches any digit character, equivalent to [0-9].

\w : Matches any word character, including letters, digits, and underscores, equivalent to [a-zA-Z0-9_].
```
