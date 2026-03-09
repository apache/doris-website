---
{
  "title": "リリース 2.0.13",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.13バージョンでは約112の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.13バージョンでは約112の改善とバグ修正が行われました

[Quick Download](https://doris.apache.org/download/)

## 動作変更

SQLの入力は、クライアント側で`CLIENT_MULTI_STATEMENTS`設定が有効になっている場合のみ複数のステートメントとして扱われ、MySQLとの互換性が向上しました。[#36759](https://github.com/apache/doris/pull/36759)

## 新機能

- 新しいBE設定`allow_zero_date`が追加され、すべてゼロの日付を許可します。`false`に設定すると、`0000-00-00`は`NULL`として解析され、`true`に設定すると`0000-01-01`として解析されます。デフォルト値は`false`で、以前の動作との一貫性を保ちます。[#34961](https://github.com/apache/doris/pull/34961)

- `LogicalWindow`と`LogicalPartitionTopN`が複数フィールドの述語プッシュダウンをサポートし、パフォーマンスが向上しました。[#36828](https://github.com/apache/doris/pull/36828)

- ES CatalogがES `nested`または`object`タイプをDoris `JSON`タイプにマッピングするようになりました。[#37101](https://github.com/apache/doris/pull/37101)

## 改善

- `LIMIT`を含むクエリが早期にデータ読み込みを終了し、リソース消費を削減してパフォーマンスを向上させます。[#36535](https://github.com/apache/doris/pull/36535)

- 空のキーを持つ特殊なJSONデータがサポートされるようになりました。[#36762](https://github.com/apache/doris/pull/36762)

- routine loadの安定性と使いやすさが改善され、ロードバランシング、自動回復、例外処理、より使いやすいエラーメッセージなどが含まれます。[#36450](https://github.com/apache/doris/pull/36450) [#35376](https://github.com/apache/doris/pull/35376) [#35266](https://github.com/apache/doris/pull/35266) [ #33372](https://github.com/apache/doris/pull/33372) [#32282](https://github.com/apache/doris/pull/32282) [#32046](https://github.com/apache/doris/pull/32046) [#32021](https://github.com/apache/doris/pull/32021) [#31846](https://github.com/apache/doris/pull/31846) [#31273](https://github.com/apache/doris/pull/31273)

- BEロードバランシングのハードディスク選択戦略と速度の最適化。[#36826](https://github.com/apache/doris/pull/36826) [#36795](https://github.com/apache/doris/pull/36795) [#36509](https://github.com/apache/doris/pull/36509)

- JDBC catalogの安定性と使いやすさが改善され、暗号化、スレッドプール接続数設定、より使いやすいエラーメッセージなどが含まれます。[#36940](https://github.com/apache/doris/pull/36940) [#36720](https://github.com/apache/doris/pull/36720) [#30880](https://github.com/apache/doris/pull/30880) [#35692](https://github.com/apache/doris/pull/35692)

完全なリストはGitHubの[link](https://github.com/apache/doris/compare/2.0.12...2.0.13)からアクセスでき、主要な機能と改善点は以下にハイライトされています。

## クレジット

このリリースに貢献していただいたすべての方々に感謝いたします：

@Gabriel39, @Jibing-Li, @Johnnyssc, @Lchangliang, @LiBinfeng-01, @SWJTU-ZhangLei, @Thearas, @Yukang-Lian, @Yulei-Yang, @airborne12, @amorynan, @bobhan1, @cambyzju, @csun5285, @dataroaring, @deardeng, @eldenmoon, @englefly, @feiniaofeiafei, @hello-stephen, @jacktengg, @kaijchen, @liutang123, @luwei16, @morningman, @morrySnow, @mrhhsg, @mymeiyi, @platoneko, @qidaye, @sollhui, @starocean999, @w41ter, @xiaokang, @xy720, @yujun777, @zclllyybb, @zddr
