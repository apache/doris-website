---
{
  "title": "PLAN REPLAYER PLAY",
  "description": "PLAN REPLAYER PLAYは、Doris開発者がオプティマイザーの問題を分析するために使用するツールです。PLAN REPLAYER DUMPによって生成された診断ファイルに基づいて、",
  "language": "ja"
}
---
## デスクリプション

PLAN REPLAYER PLAYは、Dorisの開発者がオプティマイザの問題を分析するために使用するツールです。PLAN REPLAYER DUMPによって生成された診断ファイルに基づいて、対応するバージョンのfeでメタデータと統計情報を読み込み、開発者が問題を再現してデバッグできるようにします。

## Syntax

```sql
PLAN REPLAYER PLAY <absolute-directory-of-dumpfile>；
```
## 必須パラメータ

`<absolute-directory-of-dumpfile>`

- ダンプファイルの絶対パスを指定する文字列。
- 識別子は二重引用符で囲む必要があり、対応するファイルへの絶対パスです。

## 例


`dumpfile: /home/wangwu/dumpfile.json`がある場合、以下のSQLを使用してシナリオを再現できます：

```sql
PLAN REPLAYER PLAY "/home/wangwu/dumpfile.json"；
```
