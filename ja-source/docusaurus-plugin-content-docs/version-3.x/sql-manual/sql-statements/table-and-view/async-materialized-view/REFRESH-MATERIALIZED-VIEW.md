---
{
  "title": "REFRESH MATERIALIZED VIEW",
  "description": "この文は、指定された非同期マテリアライズドビューを手動で更新するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、指定されたasynchronous materialized viewを手動でリフレッシュするために使用されます

## Syntax

```sql
REFRESH MATERIALIZED VIEW <mv_name> <refresh_type>
```
項目:

```sql
refresh_type
  : { <partitionSpec> | COMPLETE | AUTO }
```
```sql
partitionSpec
  : PARTITIONS (<partition_name> [, <partition_name> [, ... ] ])
```
## 必須パラメータ

**1. `<mv_name>`**
> マテリアライズドビュー名を指定します。
>
> マテリアライズドビュー名は文字で始まる必要があり（unicode name supportが有効な場合は任意の言語の文字）、スペースや特殊文字を含むことはできません。ただし、マテリアライズドビュー名全体がバッククォートで囲まれている場合は例外です（例：`My Object`）。
>
> マテリアライズドビュー名は予約キーワードを使用できません。
>
> 詳細については、Reserved Keywordsを参照してください。

**2. `<refresh_type>`**
> このマテリアライズドビューのリフレッシュタイプを指定します。
>
> リフレッシュタイプは、partitionSpec、COMPLETE、またはAUTOのいずれかです。

## オプションパラメータ

**1. `<partition_name>`**
> パーティションをリフレッシュする際のパーティション名を指定します。
>

## アクセス制御要件
このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege  | Object | 注釈                                        |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | Materialized View  | REFRESHはマテリアライズドビューに対するALTER操作です |


## 使用上の注意

- AUTO：計算によってマテリアライズドビューのどのパーティションがベースTableと同期されていないかを判断します。（現在、ベースTableが外部Tableの場合、マテリアライズドビューと常に同期されているとみなされます。そのため、ベースTableが外部Tableの場合は、`COMPLETE`を指定するか、リフレッシュするパーティションを指定する必要があります）。その後、該当するパーティションを適宜リフレッシュします。
- COMPLETE：パーティションがベースTableと同期されているかどうかをチェックせずに、マテリアライズドビューのすべてのパーティションを強制的にリフレッシュします。
- partitionSpec：パーティションがベースTableと同期されているかどうかをチェックせずに、指定されたパーティションを強制的にリフレッシュします。

## 例

- マテリアライズドビューmv1をリフレッシュする（リフレッシュするパーティションを自動計算）

    ```sql
    REFRESH MATERIALIZED VIEW mv1 AUTO;
    ```
- p_19950801_19950901 および p_19950901_19951001 という名前のパーティションを更新する

    ```sql
    REFRESH MATERIALIZED VIEW mv1 partitions(p_19950801_19950901,p_19950901_19951001);
    ```
- すべてのマテリアライズドビューデータの強制更新

    ```sql
    REFRESH MATERIALIZED VIEW mv1 complete;
    ```
