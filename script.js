const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQluhuOEDERWVDgxgvKrY7cPLfIF2Qw38VP9BnjGxl318Sy5Fu2RBUm3lwIFot78JLO7-5TO3b5oy1_/pub?gid=544725873&single=true&output=csv";

let liveData = []; 
let currentBand = 'ALL';
let currentView = 'list'; 
let previousView = 'list'; 
let calendar = null;
const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

document.addEventListener('DOMContentLoaded', function() {
    setupHeaderClickEvents(); 
    fetchSpreadsheetData(); 
});

function fetchSpreadsheetData() {
    const listView = document.getElementById('list-view');
    listView.innerHTML = '<p class="text-center text-muted py-5">最新のスケジュールを読み込み中...</p>';

    fetch(SPREADSHEET_CSV_URL)
        .then(response => {
            if (!response.ok) throw new Error('データの読み込みに失敗しました。');
            return response.text();
        })
        .then(csvText => {
            liveData = parseCSV(csvText); 
            renderView(); 
        })
        .catch(error => {
            console.error(error);
            listView.innerHTML = '<p class="text-center text-danger py-5">データの読み込みに失敗しました。</p>';
        });
}

// 【重要修正】備考欄などのカンマによる列ズレを防ぐ強固なCSVパース処理
function parseCSV(text) {
    const lines = text.split(/\r\n|\n/);
    if (lines.length === 0 || lines[0] === "") return [];

    // クォーテーションで囲まれたカンマを正しく保持して分割する関数
    const parseLine = (line) => {
        const result = [];
        let start = 0;
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                inQuotes = !inQuotes;
            } else if (line[i] === ',' && !inQuotes) {
                result.push(line.substring(start, i));
                start = i + 1;
            }
        }
        result.push(line.substring(start));
        return result.map(v => v.replace(/^["']|["']$/g, '').trim());
    };

    const headers = parseLine(lines[0]);
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue; 
        
        const currentline = parseLine(lines[i]);
        const obj = {};
        
        headers.forEach((header, index) => {
            let value = currentline[index] ? currentline[index] : "";
            if (header === "日付" && value.includes("/")) {
                value = value.replace(/\//g, "-");
            }
            obj[header] = value;
        });
        
        // 【超重要】見出し名に関わらず、左から9番目（I列＝インデックス8）を強制的に「フライヤー」URLとして絶対確保
        if (currentline[8] && currentline[8].startsWith('http')) {
            obj["フライヤー"] = currentline[8];
        } else {
            obj["フライヤー"] = "";
        }
        
        obj["id"] = i; 
        result.push(obj);
    }
    return result;
}

function setupHeaderClickEvents() {
    const maskLeft = document.getElementById('maskLeft');
    const maskRight = document.getElementById('maskRight');

    if (maskLeft && maskRight) {
        maskLeft.style.pointerEvents = 'auto';
        maskRight.style.pointerEvents = 'auto';
        maskLeft.style.cursor = 'pointer';
        maskRight.style.cursor = 'pointer';

        maskLeft.addEventListener('click', function() {
            if (currentBand === 'DROP DOWN MAMA') {
                switchTab('ALL');
            } else {
                switchTab('DROP DOWN MAMA');
            }
        });

        maskRight.addEventListener('click', function() {
            if (currentBand === '2120 BLUES BAND') {
                switchTab('ALL');
            } else {
                switchTab('2120 BLUES BAND');
            }
        });
    }
}

function getBandColorClass(bandName) {
    if (bandName === 'DROP DOWN MAMA') return 'bg-dropdown-mama';
    if (bandName === '2120 BLUES BAND') return 'bg-2120-blues';
    if (bandName === 'スズナPA') return 'bg-suzuna-pa';
    return 'bg-default-band';
}

function getBandHexColor(bandName) {
    if (bandName === 'DROP DOWN MAMA') return '#1a365d'; 
    if (bandName === '2120 BLUES BAND') return '#800020'; 
    if (bandName === 'スズナPA') return '#00ced1'; 
    return '#4a5568';
}

function getMonthLabel(dateStr) {
    const targetDate = new Date(dateStr);
    const today = new Date();
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const monthDiff = (targetYear - currentYear) * 12 + (targetMonth - currentMonth);

    if (monthDiff === 0) return "今月";
    if (monthDiff === 1) return "来月";
    return `${targetMonth + 1}月`;
}

function renderView() {
    if (currentView === 'detail') return;

    const todayStr = new Date().toISOString().split('T')[0];
    let bandFilteredData = (currentBand === 'ALL') ? liveData : liveData.filter(item => item["バンド名"] === currentBand);

    let upcomingData = bandFilteredData.filter(item => item["日付"] && item["日付"] >= todayStr);
    upcomingData.sort((a, b) => new Date(a["日付"]) - new Date(b["日付"]));

    const maskLeft = document.getElementById('maskLeft');
    const maskRight = document.getElementById('maskRight');
    if (currentBand === 'DROP DOWN MAMA') {
        maskLeft.style.opacity = '0';   
        maskRight.style.opacity = '0.6'; 
    } else if (currentBand === '2120 BLUES BAND') {
        maskLeft.style.opacity = '0.6';  
        maskRight.style.opacity = '0';  
    } else {
        maskLeft.style.opacity = '0';   
        maskRight.style.opacity = '0';
    }

    const countText = `これから開催予定のライブ：${upcomingData.length} 件`;
    document.getElementById('live-count-list').innerText = countText;
    document.getElementById('live-count-calendar').innerText = countText;

    const listView = document.getElementById('list-view');
    listView.innerHTML = '';

    if (upcomingData.length === 0) {
        listView.innerHTML = '<p class="text-center text-muted py-5">これから開催予定のライブはありません。</p>';
    } else {
        let lastMonthLabel = '';

        upcomingData.forEach(item => {
            const dateObj = new Date(item["日付"]);
            const dayOfWeek = weekDays[dateObj.getDay()];
            
            const currentMonthLabel = getMonthLabel(item["日付"]);
            if (currentMonthLabel !== lastMonthLabel) {
                listView.innerHTML += `
                    <div class="col-12 mt-4 mb-2 animate-fade-in">
                        <h5 class="border-start border-4 border-primary ps-2 py-1 fw-bold text-secondary bg-white shadow-sm rounded-end">${currentMonthLabel}</h5>
                    </div>
                `;
                lastMonthLabel = currentMonthLabel;
            }

            // リスト表示側：画像は絶対に出さず、小さなバッジ表示のみを維持
            const hasFlyer = item["フライヤー"] && item["フライヤー"].trim().length > 0;
            const flyerBadge = hasFlyer ? `<span class="badge bg-info text-dark ms-2">フライヤーあり 🔗</span>` : '';

            const venueDisplay = `<span class="fw-bold text-dark">${item["会場名"]}</span>`;
            const noteDisplay = item["備考"] ? `<div class="text-muted small mt-2">ℹ️ ${item["備考"]}</div>` : '';
            const badgeClass = getBandColorClass(item["バンド名"]);

            listView.innerHTML += `
                <div class="col-12 mb-2 animate-fade-in" onclick="showDetailView(${item.id})" style="cursor: pointer;">
                    <div class="card shadow-sm live-card border-0">
                        <div class="card-body py-3">
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <h6 class="text-primary fw-bold m-0">${item["日付"]} (${dayOfWeek})</h6>
                                <span class="badge ${badgeClass}">${item["バンド名"]}</span>
                                ${flyerBadge}
                            </div>
                            <p class="card-text mb-1">
                                ${venueDisplay} <span class="text-muted small">(${item["エリア"]})</span>
                            </p>
                            <p class="card-text text-secondary small mb-0">⏰ ${item["時間帯"]}</p>
                            ${noteDisplay}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    initCalendar(bandFilteredData);
}

function updateCalendarTitleWithCount() {
    if (!calendar) return;

    const currentPeriod = calendar.getDate(); 
    const currentYear = currentPeriod.getFullYear();
    const currentMonth = currentPeriod.getMonth(); 

    const events = calendar.getEvents();
    const monthCount = events.filter(event => {
        const eventDate = event.start;
        return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
    }).length;

    const titleEl = document.querySelector('.fc .fc-toolbar-title');
    if (titleEl) {
        titleEl.innerText = `${currentYear}年${currentMonth + 1}月 (${monthCount}件)`;
    }
}

function initCalendar(allBandData) {
    const calendarEl = document.getElementById('calendar');
    
    const calendarEvents = allBandData.map(item => ({
        id: item.id, 
        title: `${item["バンド名"]} @${item["会場名"]}`,
        start: item["日付"],
        backgroundColor: getBandHexColor(item["バンド名"]), 
        borderColor: 'transparent'
    }));

    if (calendar) { calendar.destroy(); }
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        initialDate: new Date(),
        locale: 'ja',
        dayCellContent: function(e) {
            return e.dayNumberText.replace('日', '');
        },
        events: calendarEvents,
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        height: 'auto',
        eventClick: function(info) {
            info.jsEvent.preventDefault(); 
            showDetailView(info.event.id);
        },
        datesSet: function() {
            setTimeout(updateCalendarTitleWithCount, 10); 
        }
    });
    
    if (currentView === 'calendar') { 
        calendar.render(); 
        setTimeout(updateCalendarTitleWithCount, 10);
    }
}

// 3. 詳細画面（画像アドレスバグ完全修正 ＆ 開閉ギミック）
function showDetailView(id) {
    const item = liveData.find(live => live.id == id);
    if (!item) return;

    if (currentView !== 'detail') {
        previousView = currentView;
    }
    currentView = 'detail';

    document.getElementById('list-view-container').classList.add('d-none');
    document.getElementById('calendar-view').classList.add('d-none');
    document.getElementById('detail-view').classList.remove('d-none');

    const dateObj = new Date(item["日付"]);
    const dayOfWeek = weekDays[dateObj.getDay()];
    const badgeClass = getBandColorClass(item["バンド名"]);
    
    const venueDisplay = item["会場URL"] ? `<a href="${item["会場URL"]}" target="_blank" class="btn btn-outline-primary btn-sm mt-2 shadow-sm">会場公式サイトを開く 🔗</a>` : '';
    const noteDisplay = item["備考"] ? `<div class="alert alert-secondary mt-3 small"><strong>ℹ️ 備考・詳細</strong><br>${item["備考"]}</div>` : '';
    
    // I列から確実に引っ張ってきた画像データを使って極小ボタンを構築
    let flyerDisplay = '';
    if (item["フライヤー"] && item["フライヤー"].trim().length > 0) {
        flyerDisplay = `
            <div class="mt-4 border-top pt-3">
                <div class="d-inline-flex align-items-center gap-2" 
                     onclick="toggleFlyerImage()" style="cursor: pointer; user-select: none;">
                    <img src="${item["フライヤー"].trim()}" alt="極小フライヤー" style="height: 38px; width: auto; object-fit: contain; border-radius: 4px; border: 1px solid #ddd;">
                    <span class="fw-bold text-primary small">⬅️ タップ</span>
                </div>
                <div id="full-size-flyer" class="mt-3 text-center d-none animate-fade-in">
                    <img src="${item["フライヤー"].trim()}" alt="フライヤー拡大" class="img-fluid rounded shadow" style="max-height: 550px; object-fit: contain;">
                </div>
            </div>
        `;
    }

    document.getElementById('detail-content').innerHTML = `
        <div class="card shadow border-0 mt-2">
            <div class="card-body p-4">
                <span class="badge ${badgeClass} mb-2">${item["バンド名"]}</span>
                <h3 class="text-primary fw-bold mb-3">${item["日付"]} (${dayOfWeek})</h3>
                <h5 class="fw-bold text-dark mb-1">📍 会場: ${item["会場名"]}</h5>
                <p class="text-muted small mb-3">（エリア：${item["エリア"]}）</p>
                <h6 class="text-dark mb-3">⏰ 時間帯: <strong>${item["時間帯"]}</strong></h6>
                ${venueDisplay}
                ${noteDisplay}
                ${flyerDisplay}
            </div>
        </div>
    `;
    
    window.scrollTo(0, 0);
}

function toggleFlyerImage() {
    const flyerContainer = document.getElementById('full-size-flyer');
    if (flyerContainer) {
        flyerContainer.classList.toggle('d-none');
    }
}

function closeDetailView() {
    currentView = previousView;
    document.getElementById('detail-view').classList.add('d-none');
    setView(currentView);
}

function switchTab(bandName) {
    currentBand = bandName;
    const buttons = document.querySelectorAll('#bandTabs button');
    
    buttons.forEach(btn => {
        if ((bandName === 'ALL' && btn.innerText.includes('総合')) || 
            (bandName !== 'ALL' && btn.innerText.includes(bandName))) {
            btn.classList.add('active'); 
        } else {
            btn.classList.remove('active'); 
        }
    });
    
    if (currentView === 'detail') {
        document.getElementById('detail-view').classList.add('d-none');
        currentView = previousView;
    }
    renderView(); 
}

function setView(viewType) {
    currentView = viewType;
    const listViewContainer = document.getElementById('list-view-container');
    const calendarViewEl = document.getElementById('calendar-view');
    const detailViewEl = document.getElementById('detail-view');
    const btnList = document.getElementById('btn-list');
    const btnCal = document.getElementById('btn-cal');

    if (viewType === 'list') {
        listViewContainer.classList.remove('d-none');
        calendarViewEl.classList.add('d-none');
        detailViewEl.classList.add('d-none');
        btnList.classList.add('active');
        btnCal.classList.remove('active');
        renderView();
    } else if (viewType === 'calendar') {
        listViewContainer.classList.add('d-none');
        calendarViewEl.classList.remove('d-none');
        detailViewEl.classList.add('d-none');
        btnList.classList.remove('active');
        btnCal.classList.add('active');
        if (calendar) { 
            calendar.render(); 
            setTimeout(updateCalendarTitleWithCount, 10);
        }
    }
}
