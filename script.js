// ============ العناصر ============
const audio = document.getElementById('audio');
const songsGrid = document.getElementById('songsGrid');
const searchInput = document.getElementById('searchInput');

let current = 0, shuffle = false, repeat = false, artistFilter = null;
let liked = new Set(JSON.parse(localStorage.getItem('liked') || '[]'));

// ترميز مسارات الملفات (مسافات / عربي / أقواس)
const url = s => encodeURI(s);

// ============ عرض الأغاني ============
function visibleSongs() {
    const q = searchInput.value.trim().toLowerCase();
    return songs.filter(s =>
        (!artistFilter || s.artist === artistFilter) &&
        (!q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
    );
}

function renderSongs() {
    const list = visibleSongs();
    songsGrid.innerHTML = '';
    list.forEach(song => {
        const i = songs.indexOf(song);
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="cover">
                <img src="${song.cover}" alt="${song.title}" loading="lazy"
                     onerror="this.src='https://placehold.co/300x300/1a1a2e/8b5cf6?text=%E2%99%AA%EF%B8%8F'">
                ${song.lyrics ? '' : '<span class="no-badge">بدون كلمات</span>'}
                <button class="card-play"><i class="fas fa-play"></i></button>
            </div>
            <h3>${song.title}</h3>
            <p>${song.artist}</p>`;
        card.onclick = () => openSongPage(i);
        card.querySelector('.card-play').onclick = e => { e.stopPropagation(); openSongPage(i); playSong(i); };
        songsGrid.appendChild(card);
    });
    document.getElementById('noResults').classList.toggle('hidden', list.length > 0);
    document.getElementById('songsTitle').textContent =
        artistFilter ? `🎤 أغاني ${artistFilter}` : '🔥 الأغاني';
}

// ============ 🔍 بحث فوري (يتحدث تلقائياً مع أي أغنية جديدة) ============
searchInput.addEventListener('input', renderSongs);
document.getElementById('searchBtn').addEventListener('click', renderSongs);
document.getElementById('showAllBtn').addEventListener('click', () => {
    artistFilter = null; searchInput.value = '';
    renderSongs(); renderArtistActive();
});

// ============ 🎤 فلتر الفنانين ============
function renderArtists() {
    document.getElementById('artistsRow').innerHTML = artists.map(a => `
        <div class="artist-card" data-name="${a.name}">
            <img src="${a.img}" alt="${a.name}" loading="lazy"
                 onerror="this.src='https://placehold.co/200x200/1a1a2e/8b5cf6?text=${encodeURIComponent(a.name[0])}'">
            <h3>${a.name}</h3>
            <span>${songs.filter(s => s.artist === a.name).length} أغاني</span>
        </div>`).join('');
    document.getElementById('sidebarArtists').innerHTML = artists.map(a => `
        <div class="sidebar-artist" data-name="${a.name}">
            <img src="${a.img}" alt="" onerror="this.style.visibility='hidden'">
            <span>${a.name}</span>
        </div>`).join('');

    document.querySelectorAll('.artist-card, .sidebar-artist').forEach(el => {
        el.onclick = () => {
            artistFilter = (artistFilter === el.dataset.name) ? null : el.dataset.name;
            renderSongs(); renderArtistActive();
            if (artistFilter) document.getElementById('songs').scrollIntoView({behavior:'smooth'});
        };
    });
    renderArtistActive();
}
function renderArtistActive() {
    document.querySelectorAll('.artist-card, .sidebar-artist').forEach(el =>
        el.classList.toggle('active', el.dataset.name === artistFilter));
}

// ============ 📄 صفحة الأغنية الكاملة ============
function openSongPage(i) {
    current = i;
    const s = songs[i];
    document.getElementById('pageCover').src = s.cover;
    document.getElementById('pageTitle').textContent = s.title;
    document.getElementById('pageArtist').textContent = s.artist;

    const dl = document.getElementById('downloadBtn');
    dl.href = url(s.src);
    dl.setAttribute('download', `${s.title} - ${s.artist}`);   // ⬇ تحميل

    // 📜 صندوق الكلمات: صورة وعنوان فوق + كلمات تحت
    const box = document.getElementById('lyricsBox');
    box.classList.add('hidden');
    document.getElementById('lyricsBtn').innerHTML = '<i class="fas fa-align-right"></i> إظهار الكلمات';
    document.getElementById('lyricsCover').src = s.cover;
    document.getElementById('lyricsTitle').textContent = s.title;
    document.getElementById('lyricsArtist').textContent = s.artist;
    document.getElementById('lyricsText').innerHTML = s.lyrics
        ? s.lyrics
        : '<div class="no-lyrics">🎵 لا تتوفرة كلمات هذة الأغنية</div>';

    document.getElementById('songPage').classList.remove('hidden');
    updatePlayerUI();
}
document.getElementById('closePageBtn').onclick = () =>
    document.getElementById('songPage').classList.add('hidden');

document.getElementById('lyricsBtn').onclick = () => {
    const hidden = document.getElementById('lyricsBox').classList.toggle('hidden');
    document.getElementById('lyricsBtn').innerHTML = hidden
        ? '<i class="fas fa-align-right"></i> إظهار الكلمات'
        : '<i class="fas fa-eye-slash"></i> إخفاء الكلمات';
};

// ============ ▶ التشغيل ============
function playSong(i) {
    current = i;
    audio.src = url(songs[i].src);
    audio.play().catch(() => alert('⚠️ ملف الصوت غير موجود أو الاسم لا يطابق الملف تماماً:\n' + songs[i].src));
    document.getElementById('player').classList.remove('hidden');
    updatePlayerUI();
    if (!document.getElementById('songPage').classList.contains('hidden'))
        openSongPage(i);
}
function togglePlay() {
    if (!audio.src) return playSong(current);
    audio.paused ? audio.play() : audio.pause();
    document.getElementById('player').classList.remove('hidden');
}
audio.onplay = audio.onpause = updatePlayerUI;

function updatePlayerUI() {
    const playing = !audio.paused && audio.src;
    const icon = playing ? 'fa-pause' : 'fa-play';
    document.getElementById('playBtn').innerHTML = `<i class="fas ${icon}"></i>`;
    document.getElementById('pagePlayBtn').innerHTML =
        `<i class="fas ${icon}"></i> ${playing ? 'إيقاف مؤقت' : 'تشغيل'}`;
    document.querySelector('.player-track').classList.toggle('playing', playing);
    if (songs[current]) {
        document.getElementById('playerCover').src = songs[current].cover;
        document.getElementById('playerTitle').textContent = songs[current].title;
        document.getElementById('playerArtist').textContent = songs[current].artist;
    }
}
document.getElementById('playBtn').onclick = togglePlay;
document.getElementById('pagePlayBtn').onclick = () => audio.paused ? playSong(current) : audio.pause();

// ============ ⏭ التالي / السابق / عشوائي / تكرار ============
function nextSong() {
    let n;
    if (shuffle) { do { n = Math.floor(Math.random() * songs.length); } while (n === current && songs.length > 1); }
    else n = (current + 1) % songs.length;
    playSong(n);
}
function prevSong() { playSong((current - 1 + songs.length) % songs.length); }
document.getElementById('nextBtn').onclick = nextSong;
document.getElementById('prevBtn').onclick = prevSong;
audio.onended = () => { repeat ? (audio.currentTime = 0, audio.play()) : nextSong(); };

document.getElementById('shuffleBtn').onclick = function () {
    shuffle = !shuffle; this.classList.toggle('on', shuffle);
};
document.getElementById('repeatBtn').onclick = function () {
    repeat = !repeat; this.classList.toggle('on', repeat);
};

// ============ ⏱ شريط المؤقت الحقيقي ============
const wrap = document.getElementById('progressWrap');
const fill = document.getElementById('progressFill');
const thumb = document.getElementById('progressThumb');
const fmt = t => isFinite(t) ? `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}` : '0:00';

audio.ontimeupdate = () => {
    if (!audio.duration) return;
    const p = (audio.currentTime / audio.duration) * 100;
    fill.style.width = p + '%';
    thumb.style.right = p + '%';
    document.getElementById('current').textContent = fmt(audio.currentTime);
};
audio.onloadedmetadata = () =>
    document.getElementById('duration').textContent = fmt(audio.duration);

function seek(e) {
    const r = wrap.getBoundingClientRect();
    let p = Math.min(1, Math.max(0, (r.right - e.clientX) / r.width)); // RTL
    if (audio.duration) {
        audio.currentTime = p * audio.duration;
        fill.style.width = p * 100 + '%';
        thumb.style.right = p * 100 + '%';
    }
}
let drag = false;
wrap.onmousedown = e => (drag = true, seek(e));
onmousemove = e => drag && seek(e);
onmouseup = () => drag = false;
wrap.addEventListener('touchmove', e => seek(e.touches[0]), {passive:true});

// ============ 🔊 الصوت ============
const vol = document.getElementById('volumeSlider');
audio.volume = .8;
vol.oninput = () => audio.volume = vol.value / 100;

// ============ ❤ المفضلة ============
const likeBtn = document.getElementById('likeBtn');
likeBtn.onclick = () => {
    const id = songs[current].id;
    liked.has(id) ? liked.delete(id) : liked.add(id);
    localStorage.setItem('liked', JSON.stringify([...liked]));
    refreshLike();
};
function refreshLike() {
    const on = liked.has(songs[current]?.id);
    likeBtn.innerHTML = `<i class="${on ? 'fas' : 'far'} fa-heart"></i>`;
    likeBtn.classList.toggle('liked', on);
}
audio.ontimeupdate_orig = null;
setInterval(() => { refreshLike(); if (audio.duration) { const p=(audio.currentTime/audio.duration)*100; fill.style.width=p+'%'; thumb.style.right=p+'%'; document.getElementById('current').textContent=fmt(audio.currentTime); } }, 400);

// ============ تهيئة ============
renderSongs();
renderArtists();
