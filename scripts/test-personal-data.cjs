const assert=require('node:assert/strict');
const api=require('../personal-data-core.js');
const make=(favorites=[],notes={})=>({format:'artlooking-personal-data',version:1,favorites,notes});
const a=make(['a'],{a:'原笔记'}),b=make(['a','b'],{a:'不同笔记',b:'新增'});
const merged=api.merge(a,b);
assert.deepEqual(merged.data.favorites,['a','b']);
assert.equal(merged.data.notes.a,'原笔记');assert.equal(merged.data.notes.b,'新增');assert.equal(merged.conflicts,1);
assert.deepEqual(api.merge(merged.data,b).data,merged.data);
assert.throws(()=>api.validate(JSON.parse('{"format":"artlooking-personal-data","version":1,"favorites":[],"notes":{"__proto__":"x"}}')));
assert.throws(()=>api.validate({...a,notes:[]}));
assert.throws(()=>api.validate({...a,version:2}));
function storage(fail=false){const values=new Map([['artlooking:favorites','["a"]'],['artlooking:notes','{"a":"原笔记"}']]);let failed=false;return {values,getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k),setItem:(k,v)=>{if(fail&&k==='artlooking:notes'&&!failed){failed=true;throw Error('quota');}values.set(k,v);}};}
const s=storage();api.restore(s,b);assert.deepEqual(api.read(s),merged.data);
const broken=storage(true);assert.throws(()=>api.restore(broken,b));assert.deepEqual(api.read(broken),a);
const malformed=storage();malformed.values.set('artlooking:notes','{');const saved=[...malformed.values];assert.throws(()=>api.restore(malformed,b));assert.deepEqual([...malformed.values],saved);
console.log('PASS: merge, conflict preservation, idempotency, hostile keys, schema validation, rollback, corrupt-data preservation');
