const test=require('node:test'),assert=require('node:assert/strict');
const cheerio=require('cheerio');
const {readMetadata}=require('../static-metadata.cjs');
test('streamed metadata preserves DOM semantics for nested content, void tags, entities and raw scripts',()=>{
    const html=`<!doctype html><html lang=ja><head><link rel=canonical href="https://example.test/a?x=1&amp;y=2"><link rel=alternate hreflang=ja href=/ja/a><link rel=alternate hreflang=ja href=/duplicate><meta name=robots content=noindex><meta property=og:url content=/a><meta property=og:locale content=ja_JP></head><body><nav><h2 id=ignore>Sidebar</h2></nav><article class="theme-doc-markdown other" lang=en><div data-translation-status=fallback><h1 id=title>Title</h1><img src=a><p><br>Body</p><section><h2 id="a&amp;b">Nested</h2></section><h3>No ID</h3></div></article><h2 id=outside>Outside</h2><script>const html='<h2 id="fake">';</script></body></html>`;
    const $=cheerio.load(html),alternates=new Map();
    $('link[rel="alternate"][hreflang]').each((i,n)=>{const lang=$(n).attr('hreflang');if(!alternates.has(lang))alternates.set(lang,[]);alternates.get(lang).push($(n).attr('href'));});
    assert.deepEqual(readMetadata(html),{htmlLang:'ja',bodyLang:'en',translationStatus:'fallback',
        canonicals:$('link[rel=canonical]').map((i,n)=>$(n).attr('href')).get(),alternates,
        headingIds:$('.theme-doc-markdown h1,.theme-doc-markdown h2,.theme-doc-markdown h3').map((i,n)=>$(n).attr('id')??'').get(),
        robots:'noindex',ogUrl:'/a',ogLocale:'ja_JP'});
});
