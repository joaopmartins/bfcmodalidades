// BFC Modalidades - Main Application

let appData = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();
    await loadData();
}

// Event listeners
function setupEventListeners() {
    // Modal close on backdrop click
    document.getElementById('modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Load data from JSON
async function loadData() {
    showLoading();

    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Failed to fetch data');

        appData = await response.json();

        renderCards();
        updateTimestamp();
        updateSummaryStats();

        hideLoading();
        showIntro();
        showCards();
    } catch (error) {
        console.error('Error loading data:', error);
        hideLoading();
        showError();
    }
}

// Render cards
function renderCards() {
    if (!appData) return;

    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    appData.modalidades.forEach(modalidade => {
        const escaloes = modalidade.escaloes;
        if (escaloes.length === 0) return;

        const card = createCard(modalidade, escaloes);
        container.appendChild(card);
    });

    if (container.children.length === 0) {
        showEmpty();
    } else {
        hideEmpty();
    }
}

// Create a modalidade card
function createCard(modalidade, escaloes) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300';

    const resumo = resumoDesfechos(escaloes);
    const header = document.createElement('div');
    header.className = 'px-4 py-3 bg-gray-900 text-white border-b border-gray-700 flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-800 transition-colors';
    header.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
            <span class="text-2xl flex-shrink-0">${modalidade.icon}</span>
            <div class="min-w-0">
                <h2 class="font-bold text-lg uppercase tracking-wide truncate">${modalidade.nome} <span class="text-xs font-normal text-gray-400">(${escaloes.length} ${escaloes.length === 1 ? 'escalão' : 'escalões'})</span></h2>
                ${resumo ? `<div class="flex flex-wrap gap-1 mt-1 normal-case">${resumo}</div>` : ''}
            </div>
        </div>
        <svg class="w-5 h-5 flex-shrink-0 transition-transform duration-300 card-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
    `;

    // Scroll wrapper with fade hint
    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'relative scroll-hint';

    const body = document.createElement('div');
    body.className = 'card-body overflow-x-auto';

    // Hide fade when scrolled to the end
    body.addEventListener('scroll', () => {
        const atEnd = body.scrollLeft + body.clientWidth >= body.scrollWidth - 5;
        scrollWrapper.classList.toggle('scroll-hint', !atEnd);
    });

    const inner = document.createElement('div');
    inner.className = 'min-w-[600px]';

    const headerRow = document.createElement('div');
    headerRow.className = 'px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-2';
    headerRow.innerHTML = `
        <div class="w-8 text-center" title="Desfecho da época"></div>
        <div class="w-[140px] min-w-[120px]">Escalão</div>
        <div class="flex-1 min-w-[150px]">Competição</div>
        <div class="w-14 text-center">Pos</div>
        <div class="w-10 text-center">Pts</div>
        <div class="w-8 text-center">J</div>
        <div class="w-8 text-center">V</div>
        <div class="w-8 text-center">E</div>
        <div class="w-8 text-center">D</div>
        <div class="w-12 text-center ">Golos</div>
    `;
    inner.appendChild(headerRow);

    const table = document.createElement('div');
    table.className = 'divide-y divide-gray-100';

    escaloes.forEach(escalao => {
        const row = createEscalaoRow(escalao, modalidade);
        table.appendChild(row);
    });

    inner.appendChild(table);
    body.appendChild(inner);

    header.addEventListener('click', () => {
        body.classList.toggle('collapsed');
        header.querySelector('.card-chevron').classList.toggle('rotate-180');
    });

    scrollWrapper.appendChild(body);
    card.appendChild(header);
    card.appendChild(scrollWrapper);

    return card;
}

// Create a row for each escalao
function createEscalaoRow(escalao, modalidade) {
    const row = document.createElement('div');
    row.className = 'px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 cursor-pointer transition-colors text-sm';

    const atual = escalao.atual || {};
    const anterior = escalao.anterior || {};

    // Check if team is extinct
    if (escalao.status === 'extinta') {
        row.innerHTML = `
            <div class="w-8 text-center text-lg" title="Equipa extinta">&#128683;</div>
            <div class="w-[140px] min-w-[120px] font-medium text-gray-400 line-through">${escalao.nome}</div>
            <div class="flex-1 min-w-[150px] text-xs text-red-500 italic">Equipa extinta</div>
            <div class="w-10"></div>
            <div class="w-10"></div>
            <div class="w-8"></div>
            <div class="w-8"></div>
            <div class="w-8"></div>
            <div class="w-8"></div>
            <div class="w-12"></div>
        `;
        row.classList.add('opacity-60');
        return row;
    }

    const desfecho = getDesfechoIndicator(atual.desfecho);
    // Escalões que já são a última divisão (não há divisão abaixo para descer)
    const desfechoTitle = (atual.semDescida && atual.desfecho === 'manteve')
        ? 'Última divisão: já não há divisão abaixo para descer'
        : desfecho.title;
    const ultimaTag = atual.semDescida
        ? '<div class="text-[10px] text-gray-400 italic mt-0.5" title="Já não há divisão abaixo para descer">última divisão · sem descida</div>'
        : '';

    // Competition name (with optional link)
    const competicaoNome = atual.competicao || '-';
    const competicaoLink = atual.competicaoLink;
    const competicaoHtml = competicaoLink
        ? `<a href="${competicaoLink}" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-bfc-gold" onclick="event.stopPropagation()">${competicaoNome}</a>`
        : competicaoNome;

    // Goals display
    const golosDisplay = atual.golosMarcados !== undefined && atual.golosSofridos !== undefined
        ? `${atual.golosMarcados}-${atual.golosSofridos}`
        : '-';

    row.innerHTML = `
        <div class="w-8 flex justify-center" title="${desfechoTitle}">${desfechoChip(desfecho)}</div>
        <div class="w-[140px] min-w-[120px] font-medium truncate" title="${escalao.nome}">
            <span>${escalao.nome}</span>
        </div>
        <div class="flex-1 min-w-[150px] text-xs text-gray-500">${competicaoHtml}${ultimaTag}</div>
        <div class="w-14 text-center font-bold">${atual.posicao ? (atual.totalEquipas ? `${atual.posicao}<span class="text-gray-400 font-normal text-xs">/${atual.totalEquipas}</span>` : `${atual.posicao}º`) : '-'}</div>
        <div class="w-10 text-center font-semibold">${atual.pontos !== undefined ? atual.pontos : '-'}</div>
        <div class="w-8 text-center text-gray-600">${atual.jogos !== undefined ? atual.jogos : '-'}</div>
        <div class="w-8 text-center text-green-600">${atual.vitorias !== undefined ? atual.vitorias : '-'}</div>
        <div class="w-8 text-center text-yellow-600">${atual.empates !== undefined ? atual.empates : '-'}</div>
        <div class="w-8 text-center text-red-600">${atual.derrotas !== undefined ? atual.derrotas : '-'}</div>
        <div class="w-12 text-center text-gray-600" title="Golos: ${atual.golosMarcados || 0} marcados, ${atual.golosSofridos || 0} sofridos">${golosDisplay}</div>
    `;

    row.addEventListener('click', () => {
        showModal(escalao, modalidade);
    });

    return row;
}

// Season outcome indicator (desceu / manteve / subiu / campeão)
function getDesfechoIndicator(desfecho) {
    switch (desfecho) {
        case 'desceu':
            return { icon: '↓', cls: 'text-red-700', bg: 'bg-red-100', title: 'Desceu de divisão' };
        case 'subiu':
            return { icon: '↑', cls: 'text-green-700', bg: 'bg-green-100', title: 'Subiu de divisão' };
        case 'campeao':
            return { icon: '&#127942;', cls: '', bg: 'bg-yellow-50', title: 'Campeão' };
        case 'manteve':
            return { icon: '=', cls: 'text-gray-500', bg: 'bg-gray-100', title: 'Manteve a divisão' };
        default:
            return { icon: '', cls: '', bg: '', title: '' };
    }
}

// Chip HTML for a desfecho indicator (visible/robust on mobile)
function desfechoChip(df, size) {
    if (!df.icon) return '';
    const dim = size === 'lg' ? 'w-10 h-10 text-xl' : 'w-6 h-6 text-base';
    return `<span class="inline-flex items-center justify-center rounded-full font-bold leading-none ${dim} ${df.bg} ${df.cls}">${df.icon}</span>`;
}

// Aggregate the season outcomes of a modalidade's escalões (for the card header)
function resumoDesfechos(escaloes) {
    let desceu = 0, subiu = 0, manteve = 0, extintas = 0;
    escaloes.forEach(e => {
        if (e.status === 'extinta') { extintas++; return; }
        const df = (e.atual || {}).desfecho;
        if (df === 'desceu') desceu++;
        else if (df === 'subiu') subiu++;
        else if (df === 'manteve') manteve++;
    });
    const pill = (txt, cls) => `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}">${txt}</span>`;
    const pills = [];
    if (subiu) pills.push(pill(`${subiu} ${subiu === 1 ? 'subida' : 'subidas'}`, 'bg-green-100 text-green-700'));
    if (desceu) pills.push(pill(`${desceu} ${desceu === 1 ? 'despromoção' : 'despromoções'}`, 'bg-red-100 text-red-700'));
    if (manteve) pills.push(pill(`${manteve} ${manteve === 1 ? 'manteve' : 'mantiveram'}`, 'bg-gray-100 text-gray-600'));
    if (extintas) pills.push(pill(`${extintas} ${extintas === 1 ? 'extinta' : 'extintas'}`, 'bg-gray-200 text-gray-700'));
    return pills.join('');
}

// Show modal with detailed view
function showModal(escalao, modalidade) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');

    const atual = escalao.atual || {};
    const anterior = escalao.anterior || {};
    const df = getDesfechoIndicator(atual.desfecho);

    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <h3 class="text-xl font-bold">${escalao.nome}</h3>
                <p class="text-sm text-gray-500">${modalidade.icon} ${modalidade.nome}</p>
            </div>
            <button onclick="closeModal()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-sm text-gray-500 mb-3">${appData.meta.currentSeason} (atual)</h4>
                <div class="space-y-2">
                    ${atual.competicao ? (atual.competicaoLink ? `<p class="text-sm"><a href="${atual.competicaoLink}" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-bfc-gold">${atual.competicao}</a></p>` : `<p class="text-sm">${atual.competicao}</p>`) : ''}
                    <p class="text-3xl font-bold">${atual.posicao || '-'}º lugar</p>
                    ${atual.totalEquipas ? `<p class="text-xs text-gray-500 -mt-1">em ${atual.totalEquipas} equipas</p>` : ''}
                    <p class="text-lg">${atual.pontos !== undefined ? atual.pontos + ' pontos' : '-'}</p>
                    ${atual.jogos ? `<p class="text-sm text-gray-600">${atual.jogos} jogos</p>` : ''}
                    ${atual.vitorias !== undefined ? `
                        <p class="text-sm text-gray-600">
                            ${atual.vitorias}V ${atual.empates}E ${atual.derrotas}D
                        </p>
                    ` : ''}
                </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-sm text-gray-500 mb-3">${appData.meta.previousSeason} (anterior)</h4>
                <div class="space-y-2">
                    ${anterior.competicao ? `<p class="text-sm">${anterior.competicao}</p>` : ''}
                    <p class="text-3xl font-bold">${anterior.posicaoFinal || '-'}º lugar</p>
                    <p class="text-lg">${anterior.pontosFinal !== undefined ? anterior.pontosFinal + ' pontos' : '-'}</p>
                    ${anterior.jogos ? `<p class="text-sm text-gray-600">${anterior.jogos} jogos</p>` : ''}
                    ${anterior.vitorias !== undefined ? `
                        <p class="text-sm text-gray-600">
                            ${anterior.vitorias}V ${anterior.empates}E ${anterior.derrotas}D
                        </p>
                    ` : ''}
                    ${!anterior.posicaoFinal ? '<p class="text-sm text-gray-400 italic">Sem dados</p>' : ''}
                </div>
            </div>
        </div>

        ${df.icon ? `
            <div class="rounded-lg p-4 text-center bg-gray-50">
                ${desfechoChip(df, 'lg')}
                <p class="mt-2 ${df.cls} font-medium">${df.title}</p>
            </div>
        ` : ''}

    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
}

// Update timestamp in footer
function updateTimestamp() {
    if (!appData?.meta?.lastUpdated) return;

    const timestamp = document.getElementById('last-updated');
    const date = new Date(appData.meta.lastUpdated);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    timestamp.textContent = `Última atualização: ${date.toLocaleDateString('pt-PT', options)}`;
}

// UI State helpers
function showLoading() {
    document.getElementById('loading')?.classList.remove('hidden');
    document.getElementById('cards-container')?.classList.add('hidden');
    document.getElementById('error')?.classList.add('hidden');
    document.getElementById('empty')?.classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading')?.classList.add('hidden');
}

function showCards() {
    document.getElementById('cards-container')?.classList.remove('hidden');
}

function showError() {
    document.getElementById('error')?.classList.remove('hidden');
}

function showEmpty() {
    document.getElementById('empty')?.classList.remove('hidden');
}

function hideEmpty() {
    document.getElementById('empty')?.classList.add('hidden');
}

function showIntro() {
    document.getElementById('intro-section')?.classList.remove('hidden');
}

// Calculate and display summary statistics
function updateSummaryStats() {
    if (!appData) return;

    let total = 0;
    let mantiveram = 0;
    let desceram = 0;
    let subiram = 0;
    let extintas = 0;

    appData.modalidades.forEach(modalidade => {
        modalidade.escaloes.forEach(escalao => {
            total++;

            if (escalao.status === 'extinta') {
                extintas++;
                return;
            }

            const df = (escalao.atual || {}).desfecho;
            if (df === 'desceu') desceram++;
            else if (df === 'subiu') subiram++;
            else if (df === 'manteve') mantiveram++;
        });
    });

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-total', total);
    set('stat-mantiveram', mantiveram);
    set('stat-desceram', desceram);
    set('stat-subiram', subiram);
    set('stat-extintas', extintas);
}
