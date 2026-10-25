(() => {
  const input = document.querySelector('#fileInput');
  const media = document.querySelector('#mediaElement');
  const list = document.querySelector('#playlist');
  const sideList = document.querySelector('#sidebarPlaylist');
  const $ = (selector) => document.querySelector(selector);
  let tracks = [], current = -1, shuffle = false, repeat = false, liked = false, toastTimer;
  const urls = new Map();
  const format = (seconds) => { if (!Number.isFinite(seconds)) return '0:00'; const m=Math.floor(seconds/60),s=Math.floor(seconds%60);return `${m}:${String(s).padStart(2,'0')}`; };
  const showToast = (message) => { const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2300); };
  const prettyType = (file) => file.type.startsWith('video/') ? 'Video' : 'Audio';
  function addFiles(files) {
    const accepted = [...files].filter(f => f.type.startsWith('audio/') || f.type.startsWith('video/') || /\.(mp3|wav|ogg|m4a|aac|flac|mp4|webm|mov|mkv)$/i.test(f.name));
    if(!accepted.length){showToast('Choose a supported audio or video file.');return;}
    accepted.forEach(file=>{tracks.push({file,name:file.name.replace(/\.[^.]+$/,''),type:prettyType(file)});});
    render();showToast(`${accepted.length} ${accepted.length===1?'file':'files'} added to your queue`);
    if(current<0)playTrack(0);
  }
  function render(){
    $('#trackCount').textContent=tracks.length;
    $('#queueDuration').textContent=`${tracks.length} ${tracks.length===1?'track':'tracks'}`;
    if(!tracks.length){list.innerHTML='<div class="queue-empty"><div class="empty-icon">♫</div><strong>Your queue is empty</strong><p>Add audio or video files to see them here.</p><button class="outline-button" id="emptyAddButton">Choose files</button></div>';$('#emptyAddButton').onclick=()=>input.click();sideList.innerHTML='<div class="empty-side">Your queue is waiting.<br>Drop a track to get started.</div>';return;}
    list.innerHTML=''; sideList.innerHTML='';
    tracks.forEach((track,index)=>{
      const row=document.createElement('div');row.className=`track-row${index===current?' active':''}`;row.innerHTML=`<span class="track-index">${index===current&& !media.paused?'♫':String(index+1).padStart(2,'0')}</span><span class="track-cover">${track.type==='Video'?'▣':'♫'}</span><span class="track-details"><strong></strong><span>${track.type} · Local file</span></span><span class="track-length">${track.duration||'--:--'}</span><button class="remove-track" aria-label="Remove track" title="Remove">×</button>`;row.querySelector('strong').textContent=track.name;
      row.addEventListener('click',e=>{if(!e.target.closest('.remove-track'))playTrack(index);});row.querySelector('.remove-track').onclick=e=>{e.stopPropagation();removeTrack(index);};list.append(row);
      const side=document.createElement('div');side.className=`side-track${index===current?' current':''}`;side.innerHTML=`<span class="side-thumb">♫</span><span></span>`;side.querySelector('span:last-child').textContent=track.name;side.onclick=()=>playTrack(index);sideList.append(side);
    });
  }
  function playTrack(index){if(index<0||index>=tracks.length)return;current=index;const track=tracks[index];if(!urls.has(track))urls.set(track,URL.createObjectURL(track.file));media.src=urls.get(track);media.play().then(()=>{}).catch(()=>showToast('This file could not be played in your browser.'));$('#trackTitle').textContent=track.name;$('#trackMeta').textContent=`${track.type} · Local file`;$('#playButton').textContent='Ⅱ';$('#playButton').setAttribute('aria-label','Pause');if(track.type==='Video'){media.setAttribute('controls','');media.style.cssText='position:fixed;width:1px;height:1px;opacity:.01;bottom:0;right:0;z-index:-1';}else{media.removeAttribute('controls');media.style.cssText=''}render();}
  function removeTrack(index){const removed=tracks[index];if(urls.has(removed)){URL.revokeObjectURL(urls.get(removed));urls.delete(removed);}tracks.splice(index,1);if(index===current){media.pause();current=-1;if(tracks.length)playTrack(Math.min(index,tracks.length-1));else resetPlayer();}else if(index<current)current--;render();}
  function resetPlayer(){media.removeAttribute('src');media.load();$('#trackTitle').textContent='Nothing playing yet';$('#trackMeta').textContent='Choose a file to get started';$('#playButton').textContent='▶';$('#playButton').setAttribute('aria-label','Play');$('#currentTime').textContent='0:00';$('#duration').textContent='0:00';$('#seekBar').value=0;render();}
  function togglePlay(){if(current<0){if(tracks.length)playTrack(0);else input.click();return;}if(media.paused)media.play().catch(()=>{});else media.pause();}
  function next(){if(!tracks.length)return;let index;if(shuffle&&tracks.length>1){do{index=Math.floor(Math.random()*tracks.length)}while(index===current);}else index=(current+1)%tracks.length;playTrack(index);}
  function previous(){if(media.currentTime>3){media.currentTime=0;return;}if(!tracks.length)return;playTrack((current-1+tracks.length)%tracks.length);}
  $('#chooseButton').onclick=$('#addNav').onclick=$('#queueAddButton').onclick=$('#emptyAddButton').onclick=()=>input.click();$('#moreButton').onclick=()=>input.click();input.onchange=()=>{addFiles(input.files);input.value='';};
  $('#playButton').onclick=togglePlay;$('#nextButton').onclick=next;$('#previousButton').onclick=previous;
  $('#shuffleButton').onclick=()=>{shuffle=!shuffle;$('#shuffleButton').classList.toggle('selected',shuffle);showToast(shuffle?'Shuffle is on':'Shuffle is off');};
  $('#repeatButton').onclick=()=>{repeat=!repeat;media.loop=repeat;$('#repeatButton').classList.toggle('selected',repeat);showToast(repeat?'Repeat is on':'Repeat is off');};
  $('#likeButton').onclick=()=>{liked=!liked;$('#likeButton').textContent=liked?'♥':'♡';$('#likeButton').classList.toggle('liked',liked);};
  $('#volumeBar').oninput=e=>{media.volume=Number(e.target.value);$('.volume-value').textContent=`${Math.round(media.volume*100)}%`;};media.volume=.8;
  $('#seekBar').oninput=e=>{if(Number.isFinite(media.duration))media.currentTime=media.duration*Number(e.target.value)/1000;};
  media.ontimeupdate=()=>{if(Number.isFinite(media.duration)){$('#seekBar').value=media.currentTime/media.duration*1000;$('#currentTime').textContent=format(media.currentTime);}};
  media.onloadedmetadata=()=>{const track=tracks[current];if(track){track.duration=format(media.duration);render();}$('#duration').textContent=format(media.duration);};
  media.onplay=()=>{$('#playButton').textContent='Ⅱ';$('#playButton').setAttribute('aria-label','Pause');render();};media.onpause=()=>{$('#playButton').textContent='▶';$('#playButton').setAttribute('aria-label','Play');render();};media.onended=()=>{if(!repeat)next();};
  $('#clearPlaylist').onclick=()=>{tracks.forEach(t=>{if(urls.has(t))URL.revokeObjectURL(urls.get(t));});tracks=[];current=-1;resetPlayer();showToast('Queue cleared');};
  $('#themeToggle').onclick=()=>document.body.classList.toggle('light');$('#libraryNav').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();togglePlay();}if(e.code==='ArrowRight'&&Number.isFinite(media.duration))media.currentTime=Math.min(media.duration,media.currentTime+5);if(e.code==='ArrowLeft'&&Number.isFinite(media.duration))media.currentTime=Math.max(0,media.currentTime-5);if(e.code==='ArrowUp'){media.volume=Math.min(1,media.volume+.05);$('#volumeBar').value=media.volume;$('.volume-value').textContent=`${Math.round(media.volume*100)}%`;}if(e.code==='ArrowDown'){media.volume=Math.max(0,media.volume-.05);$('#volumeBar').value=media.volume;$('.volume-value').textContent=`${Math.round(media.volume*100)}%`;}});
  const zone=$('#dropZone');['dragenter','dragover'].forEach(type=>document.addEventListener(type,e=>{e.preventDefault();zone.classList.add('drag-over');}));['dragleave','drop'].forEach(type=>document.addEventListener(type,e=>{e.preventDefault();if(type==='drop')addFiles(e.dataTransfer.files);zone.classList.remove('drag-over');}));
})();
