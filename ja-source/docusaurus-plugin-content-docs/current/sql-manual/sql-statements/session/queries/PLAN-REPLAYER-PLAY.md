---
{
  "title": "プラン リプレイヤー 再生",
  "language": "ja",
  "description": "PLAN REPLAYER PLAYは、Doris開発者がオプティマイザの問題を分析するために使用するツールです。PLAN REPLAYER DUMPによって生成された診断ファイルに基づいて、"
}
---
## 説明

PLAN REPLAYER PLAYは、Dorisの開発者がオプティマイザの問題を分析するために使用するツールです。PLAN REPLAYER DUMPによって生成された診断ファイルに基づき、対応するバージョンのfeでメタデータと統計情報を読み込み、開発者が問題を再現してデバッグできるようにします。

## 構文

```sql
PLAN REPLAYER PLAY <absolute-directory-of-dumpfile>；
```
## 必須パラメータ

`<absolute-directory-of-dumpfile>`

- dump fileの絶対パスを指定する文字列。
- 識別子はダブルクォートで囲む必要があり、対応するファイルへの絶対パスです。

## 例


`dumpfile: /home/wangwu/dumpfile.json`がある場合、以下のSQLを使用してシナリオを再現できます：

```sql
PLAN REPLAYER PLAY "/home/wangwu/dumpfile.json"；
```
