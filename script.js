// 【固定設定】ご指定のスプレッドシート公開CSVのURLを組み込みました
const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQluhuOEDERWVDgxgvKrY7cPLfIF2Qw38VP9BnjGxl318Sy5Fu2RBUm3lwIFot78JLO7-5TO3b5oy1_/pub?gid=544725873&single=true&output=csv";

let liveData = []; 
let currentBand = 'ALL';
let currentView = 'list';
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
            listView.innerHTML = '<p class="text-center text-danger py-5">スケジュールデータの読み込みに失敗しました。<br>スプレッドシートの「Webに公開」設定を確認してください。</p>';
        });
}

function parseCSV(text) {
    const lines = text.split(/\r\n|\n/);
    if (lines.length === 0 || lines[0] === "") return [];

    const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue; 
        
        const currentline = lines[i].split(',');
        const obj = {};
        
        headers.forEach((header, index) => {
            let value = currentline[index] ? currentline[index].replace(/^["']|["']$/g, '').trim() : "";
            
            if (header === "日付" && value.includes("/")) {
                value = value.replace(/\//g, "-");
            }
            obj[header] = value;
        });
        
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
                switchTabByName('ALL');
            } else {
                switchTabByName('DROP DOWN MAMA');
            }
        });

        maskRight.addEventListener('click', function() {
            if (currentBand === '2120 BLUES BAND') {
                switchTabByName('ALL');
            } else {
                switchTabByName('2120 BLUES BAND');
            }
        });
    }
}

function switchTabByName(bandName) {
    const buttons = document.querySelectorAll('#bandTabs button');
    buttons.forEach(btn => {
        if (bandName === 'ALL' && btn.innerText.includes('総合')) {
            btn.click();
        } else if (btn.innerText.includes(bandName)) {
            btn.click();
        }
    });
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

function renderView() {
    const todayStr = new Date().toISOString().split('T')[0];
    
    let upcomingData = liveData.filter(item => item["日付"] && item["日付"] >= todayStr);

    const filteredData = (currentBand === 'ALL') ? upcomingData : upcomingData.filter(item => item["バンド名"] === currentBand);
    filteredData.sort((a, b) => new Date(a["日付"]) - new Date(b["日付"]));

    const maskLeft = document.getElementById('maskLeft');
    const maskRight = document.getElementById('maskRight');
    
    if (currentBand === 'DROP DOWN MAMA') {
        maskLeft.style.opacity = '0';   
        maskRight.style.opacity = '0.7'; 
    } else if (currentBand === '2120 BLUES BAND') {
        maskLeft.style.opacity = '0.7';  
        maskRight.style.opacity = '0';  
    } else {
        maskLeft.style.opacity = '0';   
        maskRight.style.opacity = '0';
    }

    const countText = `これから開催予定のライブ：${filteredData.length} 件`;
    document.getElementById('live-count-list').innerText = countText;
    document.getElementById('live-count-calendar').innerText = countText;

    const listView = document.getElementById('list-view');
    listView.innerHTML = '';

    if (filteredData.length === 0) {
        listView.innerHTML = '<p class="text-center text-muted py-5">これから開催予定のライブはありません。</p>';
    } else {
        filteredData.forEach(item => {
            const dateObj = new Date(item["日付"]);
            const dayOfWeek = weekDays[dateObj.getDay()];
            
            const venueDisplay = item["会場URL"] ? `<a href="${item["会場URL"]}" target="_blank" class="text-decoration-none fw-bold text-dark">${item["会場名"]} 🔗</a>` : `<span class="fw-bold">${item["会場名"]}</span>`;
            const noteDisplay = item["備考"] ? `<div class="text-muted small mt-2">ℹ️ ${item["備考"]}</div>` : '';
            
            // 【新機能】フライヤーのURLが入っているときだけ画像を差し込む設定
            let flyerDisplay = '';
            if (item["フライヤー"] && item["フライヤー"].trim().startsWith('http')) {
                flyerDisplay = `
                    <div class="mt-3 text-center">
                        <img src="${item["フライヤー"].trim()}" alt="フライヤー" class="img-fluid rounded shadow-sm" style="max-height: 350px; object-fit: contain;">
                    </div>
                `;
            }
            
            const badgeClass = getBandColorClass(item["バンド名"]);

            listView.innerHTML += `
                <div class="col-12 col-md-12 mb-2">
                    <div class="card shadow-sm live-card">
                        <div class="card-body">
                            <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-1 gap-md-2 mb-1">
                                <h6 class="card-title text-primary fw-bold m-0">${item["日付"]} (${dayOfWeek})</h6>
                                <div>
                                    <span class="badge ${badgeClass}">${item["バンド名"]}</span>
                                </div>
                            </div>
                            <p class="card-text text-dark mb-1">
                                ${venueDisplay}
                                <span class="loc-break text-muted style-small">(${item["エリア"]})</span>
                            </p>
                            <p class="card-text text-dark mb-0">⏰ ${item["時間帯"]}</p>
                            ${noteDisplay}
                            ${flyerDisplay}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    initCalendar(filteredData);
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
        const baseTitle = titleEl.innerText.split('(')[0].trim();
        titleEl.innerText = `${baseTitle} (${monthCount}件)`;
    }
}

function initCalendar(data) {
    const calendarEl = document.getElementById('calendar');
    
    const calendarEvents = data.map(item => {
        const hasUrl = item["会場URL"] && item["会場URL"].trim().startsWith('http');
        
        return {
            title: `${item["バンド名"]} @${item["会場名"]}`,
            start: item["日付"],
            url: hasUrl ? item["会場URL"].trim() : null, 
            backgroundColor: getBandHexColor(item["バンド名"]), 
            borderColor: 'transparent'
        };
    });

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
            if (!info.event.url) {
                info.jsEvent.preventDefault(); 
            }
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

function switchTab(bandName) {
    currentBand = bandName;
    const buttons = document.querySelectorAll('#bandTabs button');
    buttons.forEach(btn => btn.classList.remove('active'));
    renderView();
}

function setView(viewType) {
    currentView = viewType;
    const listViewContainer = document.getElementById('list-view-container');
    const calendarViewEl = document.getElementById('calendar-view');
    const btnList = document.getElementById('btn-list');
    const btnCal = document.getElementById('btn-cal');

    if (viewType === 'list') {
        listViewContainer.classList.remove('d-none');
        calendarViewEl.classList.add('d-none');
        btnList.classList.add('active');
        btnCal.classList.remove('active');
    } else {
        listViewContainer.classList.add('d-none');
        calendarViewEl.classList.remove('d-none');
        btnList.classList.remove('active');
        btnCal.classList.add('active');
        if (calendar) { 
            calendar.render(); 
            setTimeout(updateCalendarTitleWithCount, 10);
        }
    }
}
