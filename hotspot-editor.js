(() => {
  let state;
  const bar=document.createElement('div');
  bar.hidden=true;
  bar.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:20;background:#152436;padding:8px;max-height:38vh;overflow:auto;font:14px sans-serif';
  const toggle=document.createElement('button'); toggle.textContent='Edit hotspots';
  toggle.style.cssText='position:sticky;top:0;z-index:1;background:#f0f3f6;color:#152436';
  toggle.style.cssText='position:sticky;top:0;z-index:1;background:#f0f3f6;color:#152436';
  toggle.disabled=true;
  const panel=document.createElement('div'); panel.hidden=true;
  const help=document.createElement('p'); help.textContent='拖曳全景，把中央 + 對準 hotspot 位置，再選目標房間並新增。觀看時點標記；Quest 用射線指向藍色球，再按扳機或捏合。';
  const room=document.createElement('select'); room.setAttribute('aria-label','正在編輯的相片');
  const target=document.createElement('select'); target.setAttribute('aria-label','Hotspot 目標房間');
  const add=document.createElement('button'); add.textContent='在中央新增 hotspot';
  const items=document.createElement('div');
  const save=document.createElement('button'); save.textContent='匯出 hotspot 設定';
  const load=document.createElement('input'); load.type='file'; load.accept='.json,application/json'; load.setAttribute('aria-label','匯入 hotspot 設定');
  const message=document.createElement('p'); message.setAttribute('role','status');
  const exported=document.createElement('textarea'); exported.hidden=true; exported.readOnly=true; exported.setAttribute('aria-label','匯出的 hotspot 設定'); exported.style.cssText='width:95%;height:100px';
  const note=document.createElement('p'); note.textContent='設定檔不包含相片。下次請選同一組檔名和次序，再匯入設定；離開前請匯出保存。修改連結位置或目標可刪除後重新新增。';
  panel.append(help,room,target,add,items,save,load,note,exported);
  bar.append(toggle,panel,message); document.body.append(bar);
  const send=(method,value)=>{ if(window.unityInstance) window.unityInstance.SendMessage('WebXR Album',method,value); };
  const command=value=>send('HotspotCommand',value);
  toggle.onclick=()=>command('edit');
  room.onchange=()=>command('room:'+room.value);
  add.onclick=()=>command('add:'+target.value);
  save.onclick=()=>{
    if(!state) return;
    exported.value=JSON.stringify(state.document,null,2);exported.hidden=false;
    message.textContent='已產生設定。若瀏覽器沒有下載檔案，可複製下方文字保存為 album-hotspots.json。';
    const url=URL.createObjectURL(new Blob([JSON.stringify(state.document,null,2)],{type:'application/json'}));
    const a=document.createElement('a'); a.href=url;a.download='album-hotspots.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  load.onchange=async()=>{
    const file=load.files[0];load.value='';if(!file)return;
    if(file.size>1024*1024){message.textContent='設定檔過大。';return;}
    try { const text=await file.text(); JSON.parse(text); send('ImportHotspots',text); }
    catch(e){message.textContent='無法讀取 JSON 設定檔。';}
  };
  window.addEventListener('album-import-result',e=>{if(!e.detail){bar.hidden=false;command('state');}});
  window.addEventListener('album-hotspot-state',e=>{
    state=JSON.parse(e.detail); const selectedTarget=target.value;
    toggle.disabled=state.current<0;
    bar.style.left=state.editing?'0':'auto';
    exported.hidden=true;
    panel.hidden=!state.editing;toggle.textContent=state.editing?'完成編輯 / 觀看':'Edit hotspots';
    message.textContent=state.message || '';
    room.replaceChildren();target.replaceChildren();items.replaceChildren();
    state.document.photos.forEach((name,i)=>{
      const option=new Option((i+1)+'. '+name,String(i));room.add(option);
      if(i!==state.current)target.add(new Option(name,String(i)));
    });
    room.value=String(state.current);
    if([...target.options].some(o=>o.value===selectedTarget))target.value=selectedTarget;
    add.disabled=!target.options.length;
    state.document.hotspots.forEach((h,i)=>{
      if(h.room!==state.current)return;
      const row=document.createElement('div'); const name=document.createElement('span'); name.textContent='→ '+state.document.photos[h.target];
      const remove=document.createElement('button');remove.textContent='刪除';remove.setAttribute('aria-label','刪除 hotspot '+(i+1));remove.onclick=()=>command('remove:'+i);
      row.append(name,remove);items.append(row);
    });
  });
})();
