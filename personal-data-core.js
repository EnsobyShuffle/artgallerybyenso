(function (root) {
  'use strict';
  const FAVORITES = 'artlooking:favorites';
  const NOTES = 'artlooking:notes';
  function validId(id) {
    return typeof id === 'string' && id.length > 0 && id.length <= 250 && !['__proto__', 'prototype', 'constructor'].includes(id);
  }
  function validate(input) {
    if (!input || input.format !== 'artlooking-personal-data' || input.version !== 1) throw new Error('请选择画廊导出的备份文件。');
    if (!Array.isArray(input.favorites) || input.favorites.length > 20000 || !input.favorites.every(validId)) throw new Error('收藏数据格式不正确。');
    if (!input.notes || typeof input.notes !== 'object' || Array.isArray(input.notes)) throw new Error('笔记数据格式不正确。');
    const entries = Object.entries(input.notes);
    if (entries.length > 20000 || entries.some(([k,v]) => !validId(k) || typeof v !== 'string' || v.length > 100000)) throw new Error('笔记数据格式不正确或过大。');
    return { format: input.format, version: 1, favorites: [...new Set(input.favorites)], notes: Object.fromEntries(entries) };
  }
  function read(storage) {
    const a = storage.getItem(FAVORITES), b = storage.getItem(NOTES);
    return validate({format:'artlooking-personal-data',version:1,favorites:a===null?[]:JSON.parse(a),notes:b===null?{}:JSON.parse(b)});
  }
  function merge(current, incoming) {
    current=validate(current); incoming=validate(incoming);
    const notes={...current.notes}; let conflicts=0;
    for (const [id, text] of Object.entries(incoming.notes)) {
      if (!Object.hasOwn(notes,id) || !notes[id]) notes[id]=text;
      else if (text && notes[id]!==text) conflicts++;
    }
    return { data:validate({format:'artlooking-personal-data',version:1,favorites:[...new Set([...current.favorites,...incoming.favorites])],notes}), conflicts };
  }
  function restore(storage, incoming) {
    const beforeA=storage.getItem(FAVORITES), beforeB=storage.getItem(NOTES);
    const result=merge(read(storage),incoming);
    try {
      storage.setItem(FAVORITES,JSON.stringify(result.data.favorites));
      storage.setItem(NOTES,JSON.stringify(result.data.notes));
    } catch (error) {
      let rollbackFailed=false;
      for(const [key,original] of [[FAVORITES,beforeA],[NOTES,beforeB]]) {
        try { if(original===null)storage.removeItem(key);else storage.setItem(key,original); }
        catch { rollbackFailed=true; }
      }
      throw new Error(rollbackFailed?'保存失败，回退未能全部完成；请保留备份文件并勿清除浏览器数据。':'当前浏览器无法保存，原有数据已保留。');
    }
    return result;
  }
  root.GalleryPersonalData={validate,read,merge,restore};
  if(typeof module==='object' && module.exports)module.exports=root.GalleryPersonalData;
})(typeof window==='object'?window:globalThis);
