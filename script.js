// ==========================================
// 1. ライブスケジュール・データ（データベース）
// ==========================================
// スプレッドシートから書き出したデータをここに集約しています。
// 今後予定が増えたら、この [ ] の中に同じ形式でコンマ(,)で区切って追加・修正します。
const liveData = [
  { "date": "2026-06-06", "band": "DROP DOWN MAMA", "venue": "戸塚ベイブルース", "location": "神奈川県横浜市", "time": "昼・午後", "note": "", "url": "", "flyer": "" },
  { "date": "2026-06-27", "band": "DROP DOWN MAMA", "venue": "イセヤセラヴィ", "location": "神奈川県横浜市", "time": "昼・午後", "note": "", "url": "", "flyer": "" },
  { "date": "2026-06-28", "band": "DROP DOWN MAMA", "venue": "本牧ゴールデンカップ", "location": "神奈川県横浜市", "time": "午後・夕方", "note": "", "url": "", "flyer": "" },
  { "date": "2026-07-05", "band": "スズナPA", "venue": "kt.Bears", "location": "神奈川県横浜市", "time": "午後", "note": "ミュージックバー", "url": "", "flyer": "" },
  { "date": "2026-07-11", "band": "DROP DOWN MAMA", "venue": "ミッシェル", "location": "神奈川県秦野市", "time": "夜", "note": "ライブレストラン", "url": "", "flyer": "" },
  { "date": "2026-07-12", "band": "DROP DOWN MAMA", "venue": "綱島フライドポテト", "location": "神奈川県横浜市", "time": "夕方・夜", "note": "1ドリンク付1100円", "url": "", "flyer": "" },
  { "date": "2026-07-18", "band": "2120 BLUES BAND", "venue": "武蔵小山cool smile66", "location": "東京都品川区", "time": "夕方・夜", "note": "ライブバー", "url": "", "flyer": "" },
  { "date": "2026-08-15", "band": "DROP DOWN MAMA", "venue": "イセヤセラヴィ", "location": "神奈川県横浜市", "time": "夜", "note": "", "url": "", "flyer": "" },
  { "date": "2026-09-05", "band": "2120 BLUES BAND", "venue": "y's SOUND BASE", "location": "神奈川県厚木市", "time": "昼・午後・夕方・夜", "note": "", "url": "", "flyer": "" },
  { "date": "2026-09-19", "band": "DROP DOWN MAMA", "venue": "大船ハニービー", "location": "神奈川県鎌倉市", "time": "昼・午後", "note": "", "url": "", "flyer": "" },
  { "date": "2026-10-04", "band": "2120 BLUES BAND", "venue": "kt.Bears", "location": "神奈川県横浜市", "time": "昼・午後", "note": "ミュージックバー", "url": "", "flyer": "" },
  { "date": "2026-10-10", "band": "2120 BLUES BAND", "venue": "Ｈｅｙ−ＪＯＥ", "location": "神奈川県横浜市", "time": "昼・午後", "note": "Live House", "url": "", "flyer": "" },
  { "date": "2026-10-11", "band": "2120 BLUES BAND", "venue": "kt.Bears", "location": "神奈川県横浜市", "time": "昼・午後", "note": "横濱ジャズプロムナード", "url": "", "flyer": "" },
  { "date": "2026-10-24", "band": "DROP DOWN MAMA", "venue": "渋谷nob", "location": "東京都渋谷区", "time": "昼・午後", "note": "", "url": "", "flyer": "" },
  { "date": "2026-11-03", "band": "2120 BLUES BAND", "venue": "赤坂エルカミーノ", "location": "東京都港区", "time": "昼・午後", "note": "", "url": "", "flyer": "" }
];

// ==========================================
// 2. 状態管理（現在の設定）
// ==========================================
let currentBand = 'ALL';
let currentView = 'list'; // 'list' または 'calendar'
let calendar = null;

// 曜日変換用の配列
const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

// ==========================================
// 3. メイン処理・画面への表示
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    renderView();
});

// 表示の更新（タブやリスト・カレンダー切り替え時に実行）
function renderView() {
    // 1. データをバンド名で絞り込み
    const filteredData = (currentBand === 'ALL') ? liveData : liveData.filter(item => item.band === currentBand);

    // 日付順に並び替え
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 2. リスト表示の生成
    const listView = document.getElementById('list-view');
    listView.innerHTML = '';

    if (filteredData.length === 0) {
        listView.innerHTML = '<p class="text-center text-muted">該当する予定はありません。</p>';
    } else {
        filteredData.forEach(item => {
            const dateObj = new Date(item.date);
            const dayOfWeek = weekDays[dateObj.getDay()];
            
            // 店名にリンクがあるか、フライヤー画像があるかで表示を分ける処理
            const venueDisplay = item.url ? `<a href="${item.url}" target="_blank" class="text-decoration-none fw-bold text-dark">${item.venue} 🔗</a>` : `<span class="fw-bold">${item.venue}</span>`;
            const flyerDisplay = item.flyer ? `<div class="mt-2"><img src="${item.flyer}" class="flyer-thumb" alt="flyer"></div>` : '';
            const noteDisplay = item.note ? `<div class="text-muted small">ℹ️ ${item.note}</div>` : '';

            listView.innerHTML += `
                <div class="col-md-8 mb-3">
                    <div class="card shadow-sm live-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 class="card-title mb-1 text-primary fw-bold">${item.date} (${dayOfWeek})</h5>
                                    <span class="badge bg-secondary mb-2">${item.band}</span>
                                    <p class="card-text mb-1">${venueDisplay} <span class="text-muted small">(${item.location})</span></p>
                                    <p class="card-text mb-1 text-dark">⏰ ${item.time}</p>
                                    ${noteDisplay}
                                </div>
                                ${flyerDisplay}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // 3. カレンダー表示の生成（初期化・再描画）
    initCalendar(filteredData);
}

// カレンダーの初期化・更新
function initCalendar(data) {
    const calendarEl = document.getElementById('calendar');
    
    // カレンダー用のデータ形式（FullCalendar用）に変換
    const calendarEvents = data.map(item => ({
        title: `${item.band} @${item.venue}`,
        start: item.date,
        url: item.url || null, // リンクがあればカレンダーから直接飛べる
        backgroundColor: item.band === 'DROP DOWN MAMA' ? '#1a365d' : (item.band === '2120 BLUES BAND' ? '#2b6cb0' : '#4a5568'),
        borderColor: 'transparent'
    }));

    if (calendar) {
        calendar.destroy(); // 古いカレンダーを破棄して作り直す
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ja',
        events: calendarEvents,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        height: 'auto'
    });

    // カレンダー表示状態のときだけレンダリング
    if (currentView === 'calendar') {
        calendar.render();
    }
}

// ==========================================
// 4. ボタン操作（タブ切り替え、表示形式切り替え）
// ==========================================

// バンド切り替え
function switchTab(bandName) {
    currentBand = bandName;
    
    // ボタンの見た目（アクティブ状態）を切り替え
    const buttons = document.querySelectorAll('#bandTabs button');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // クリックされたボタンをアクティブに
    event.target.classList.add('active');
    
    renderView();
}

// 表示形式の切り替え（リスト ⇔ カレンダー）
function setView(viewType) {
    currentView = viewType;
    
    const listViewEl = document.getElementById('list-view');
    const calendarViewEl = document.getElementById('calendar-view');
    const btnList = document.getElementById('btn-list');
    const btnCal = document.getElementById('btn-cal');

    if (viewType === 'list') {
        listViewEl.classList.remove('d-none');
        calendarViewEl.classList.add('d-none');
        btnList.classList.add('active');
        btnCal.classList.remove('active');
    } else {
        listViewEl.classList.add('d-none');
        calendarViewEl.classList.remove('d-none');
        btnList.classList.remove('active');
        btnCal.classList.add('active');
        // カレンダーを表示した瞬間にサイズを正しく計算して描画
        if (calendar) {
            calendar.render();
        }
    }
}
