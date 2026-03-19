---
{
  "title": "リリース 2.0.9",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.9バージョンでは約68の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.9 バージョンでは約68の改善とバグ修正が行われました。

- **クイックダウンロード** : [https://doris.apache.org/download/](https://doris.apache.org/download/)

- **GitHub** : [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 1 動作の変更

NA

## 2 新機能

- keyとvalue mvカラムの両方での述語の出現をサポート

- `bitmap_union(bitmap_from_array())`を使用したmvをサポート

- クラスター内のOLAPテーブルのレプリケート割り当てを強制するFE設定を追加

- 新しいオプティマイザーNereidsでのdate literalのタイムゾーンサポート

- フルテキスト検索`match_phrase`でslopをサポートして単語の距離を指定

- `SHOW PROC INDEXES`でindex idを表示

## 3 改善と最適化

- `first_value` / `last_value`にNULL値を無視する第二引数を追加

- `LEAD`/ `LAG`関数のoffsetパラメータで0を使用可能

- マテリアライズドビューマッチルールの優先度を調整

- TopN最適化でパフォーマンス向上のためlimit数のレコードのみを読み取り

- delete_bitmap get_agg関数のプロファイルを追加

- より良いパフォーマンスを得るためのMetaキャッシュの改良

- FE設定 `autobucket_max_buckets`を追加

改善とバグ修正の完全なリストは[GitHub](https://github.com/apache/doris/compare/2.0.8...2.0.9)でご確認ください。

## 謝辞

このリリースに貢献してくださったすべての方々に感謝いたします:

adonis0147, airborne12, amorynan, AshinGau, BePPPower, BiteTheDDDDt, CalvinKirs, cambyzju, csun5285, eldenmoon, englefly, feiniaofeiafei, HHoflittlefish777, htyoung, hust-hhb, jackwener, Jibing-Li, kaijchen, kylinmac, liaoxin01, luwei16, morningman, mrhhsg, qidaye, starocean999, SWJTU-ZhangLei, w41ter, xiaokang, xiedeyantu, xy720, zclllyybb, zhangstar333, zhannngchen, zy-kkk, zzzxl1993
