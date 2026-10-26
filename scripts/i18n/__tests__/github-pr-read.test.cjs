const test=require('node:test');
const assert=require('node:assert/strict');
const {ghPages}=require('../workflow-prs.cjs');
test('transient paginated GitHub reads retry from the start and preserve the complete candidate set',()=>{
    let calls=0;const delays=[];
    const result=ghPages('repos/apache/doris-website/pulls/4518/files?per_page=100',{
        wait:ms=>delays.push(ms),run:(command,args)=>{
            assert.equal(command,'gh');assert.deepEqual(args.slice(0,3),['api','--paginate','--slurp']);
            if(calls++===0){const error=new Error('gh failed');error.stderr='gh: Server Error (HTTP 502)';throw error;}
            return '[[{"filename":"first.md"}],[{"filename":"second.md"}]]';
        }});
    assert.equal(calls,2);assert.deepEqual(delays,[1000]);assert.deepEqual(result.map(file=>file.filename),['first.md','second.md']);
});
test('authentication and exhausted transient errors fail closed',()=>{
    for(const [message,expected] of [['HTTP 401',1],['HTTP 403',1],['HTTP 502',3]]){
        let calls=0;assert.throws(()=>ghPages('endpoint',{wait:()=>{},run:()=>{calls++;throw new Error(message);}}),new RegExp(message));
        assert.equal(calls,expected);
    }
});
