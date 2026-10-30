(() => {
  'use strict';
  const api=window.GalleryPersonalData;
  const get=id=>document.getElementById(id);
  let pending=null;
  const status=text=>{get('status').textContent=text;};
  function summary(){const d=api.read(localStorage);get('summary').textContent=`当前浏览器：${d.favorites.length} 件收藏，${Object.keys(d.notes).length} 条笔记。`;}
  try{summary();}catch{status('当前数据无法读取，请勿清除浏览器数据。');get('export').disabled=true;get('file').disabled=true;}
  get('export').addEventListener('click',()=>{
    try{
      const data={...api.read(localStorage),exportedAt:new Date().toISOString()};
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='gallery-personal-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      status('已发起备份下载，请确认文件已保存到设备。');
    }catch{status('导出失败，请保留原来的浏览器数据。');}
  });
  let revision=0;
  get('file').addEventListener('change',async()=>{
    const current=++revision;pending=null;get('import').disabled=true;get('preview').textContent='';
    const f=get('file').files[0];if(!f)return;
    try{
      if(f.size>5*1024*1024)throw new Error('备份文件过大，请选择小于 5 MB 的画廊备份。');
      const parsed=api.validate(JSON.parse(await f.text()));if(current!==revision)return;
      const result=api.merge(api.read(localStorage),parsed);pending=parsed;
      get('preview').textContent=`备份包含 ${parsed.favorites.length} 件收藏、${Object.keys(parsed.notes).length} 条笔记。\n发现 ${result.conflicts} 条不同版本的笔记，将保留当前版本。`;
      get('import').disabled=false;status('文件已检查，点击“合并到当前浏览器”后才会保存。');
    }catch(e){if(current===revision)status(e.message||'无法读取这个备份文件。');}
  });
  get('import').addEventListener('click',()=>{
    if(!pending)return;
    try{const result=api.restore(localStorage,pending);summary();status(`导入完成。${result.conflicts?'有 '+result.conflicts+' 条不同版本的笔记保留了当前版本，请留存备份文件。':''}`);pending=null;get('import').disabled=true;}
    catch(e){status(e.message||'导入失败。');}
  });
})();
