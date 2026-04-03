---
{
  "title": "リリース 1.1.5",
  "language": "ja",
  "description": "このリリースでは、DorisチームはVersion 1.1.4以降、約36件の問題修正またはパフォーマンス改善を行いました。このリリースはVersion 1のバグ修正リリースです。"
}
---
このリリースでは、Dorisチームは1.1.4以降の約36の問題またはパフォーマンス改善を修正しました。このリリースは1.1のバグ修正リリースであり、すべてのユーザーはこのリリースにアップグレードすることが推奨されます。

# 動作の変更

"select year(birthday) as birthday"のようにエイリアス名が元の列名と同じで、それをgroup by、order by、having句で使用する場合、これまでのdorisの動作はMySQLと異なっていました。このリリースでは、MySQLの動作に従うようになりました。Group byとhaving句は最初に元の列を使用し、order byは最初にエイリアスを使用します。ここでは少し混乱するかもしれないので、元の列名と同じエイリアスは使用しないことをお勧めします。

# 機能

murmur_hash3_64のサポートを追加。[#14636](https://github.com/apache/doris/pull/14636)

# 改善

パフォーマンス向上のためconvert_tzにタイムゾーンキャッシュを追加。[#14616](https://github.com/apache/doris/pull/14616)

show句を呼び出す際にテーブル名で結果をソート。[#14492](https://github.com/apache/doris/pull/14492)

# バグ修正

select句にif定数式がある場合のコアダンプを修正。[#14858](https://github.com/apache/doris/pull/14858)

ColumnVector::insert_date_columnがクラッシュする可能性があった問題を修正。[#14839](https://github.com/apache/doris/pull/14839)

high_priority_flush_thread_num_per_storeのデフォルト値を6に更新し、ロードパフォーマンスが向上しました。[#14775](https://github.com/apache/doris/pull/14775)

quick compactionのコア問題を修正。[#14731](https://github.com/apache/doris/pull/14731)

パーティション列がduplicate keyではない場合、spark loadがIndexOutOfBoundsエラーを投げる問題を修正。[#14661](https://github.com/apache/doris/pull/14661)

VCollectorIteratorのメモリリーク問題を修正。[#14549](https://github.com/apache/doris/pull/14549)

sequence列がある場合のcreate table likeを修正。[#14511](https://github.com/apache/doris/pull/14511)

CPUを大量に消費するtotal_bytesの使用に代わって、バッチサイズ計算にavg rowsetを使用。[#14273](https://github.com/apache/doris/pull/14273)

conjunctを使ったright outer joinのコア問題を修正。[#14821](https://github.com/apache/doris/pull/14821)

tcmalloc gcのポリシーを最適化。[#14777](https://github.com/apache/doris/pull/14777) [#14738](https://github.com/apache/doris/pull/14738) [#14374](https://github.com/apache/doris/pull/14374)
