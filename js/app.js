// BFC Modalidades - Main Application

let appData = null;
let promessasData = null;
let cronologiaData = null;

// Tab system
let activeTab = 'modalidades';
const VALID_TABS = ['modalidades', 'promessas', 'cronologia'];

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();
    initTabs();
    initReleaseBanner();
    updateStickyOffsets();
    window.addEventListener('resize', updateStickyOffsets);
    await loadData();
}

// Release notes banner
function initReleaseBanner() {
    const banner = document.getElementById('release-banner');
    if (!banner) return;
    if (localStorage.getItem('bfc-banner-v2-dismissed')) {
        banner.remove();
    }
}

function dismissBanner() {
    const banner = document.getElementById('release-banner');
    if (banner) {
        banner.style.transition = 'opacity 0.2s, max-height 0.3s';
        banner.style.opacity = '0';
        banner.style.maxHeight = '0';
        banner.style.overflow = 'hidden';
        setTimeout(() => banner.remove(), 300);
    }
    localStorage.setItem('bfc-banner-v2-dismissed', '1');
}

// Tab system
function initTabs() {
    // Tab button clicks
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab && VALID_TABS.includes(tab)) {
                switchTab(tab);
                history.pushState(null, '', '#' + tab);
            }
        });
    });

    // Hash routing
    window.addEventListener('hashchange', () => {
        const hash = location.hash.replace('#', '');
        if (VALID_TABS.includes(hash)) {
            switchTab(hash);
        }
    });

    // Read initial hash
    const hash = location.hash.replace('#', '');
    if (VALID_TABS.includes(hash)) {
        activeTab = hash;
    }
    switchTab(activeTab);
}

function switchTab(tabName) {
    if (!VALID_TABS.includes(tabName)) return;
    activeTab = tabName;

    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabName;
        btn.setAttribute('aria-selected', isActive);
        if (isActive) {
            btn.classList.add('bg-gray-900', 'text-white', 'shadow-sm');
            btn.classList.remove('bg-white', 'text-gray-500', 'border', 'border-gray-300');
        } else {
            btn.classList.remove('bg-gray-900', 'text-white', 'shadow-sm');
            btn.classList.add('bg-white', 'text-gray-500', 'border', 'border-gray-300');
        }
    });

    // Update panels
    VALID_TABS.forEach(tab => {
        const panel = document.getElementById('tab-' + tab);
        if (!panel) return;
        if (tab === tabName) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    });

    // Scroll to top of content if tab bar is below viewport
    const tabBar = document.getElementById('tab-bar');
    if (tabBar) {
        const rect = tabBar.getBoundingClientRect();
        if (rect.top < 0) {
            tabBar.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function updateStickyOffsets() {
    const header = document.querySelector('header');
    if (header) {
        document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
    }
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

        // Load cronologia
        try {
            const cronologiaResponse = await fetch('cronologia.json');
            if (cronologiaResponse.ok) {
                cronologiaData = await cronologiaResponse.json();
                renderCronologia();
            }
        } catch (e) {
            console.error('Error loading cronologia:', e);
        }

        // Load promessas
        try {
            const promessasResponse = await fetch('promessas.json');
            if (promessasResponse.ok) {
                promessasData = await promessasResponse.json();
                renderPromessas();
            }
        } catch (e) {
            console.error('Error loading promessas:', e);
        }

        hideLoading();
        showIntro();
        showCards();
        switchTab(activeTab);
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

    const header = document.createElement('div');
    header.className = 'px-4 py-3 bg-gray-900 text-white border-b border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors';
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-2xl">${modalidade.icon}</span>
            <h2 class="font-bold text-lg uppercase tracking-wide">${modalidade.nome}</h2>
            <span class="text-xs text-gray-300">(${escaloes.length} escalões)</span>
        </div>
        <svg class="w-5 h-5 transition-transform duration-300 card-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div class="w-8 text-center" title="Estado vs época anterior"></div>
        <div class="w-[140px] min-w-[120px]">Escalão</div>
        <div class="flex-1 min-w-[150px]">Competição</div>
        <div class="w-10 text-center">Pos</div>
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
            <div class="w-8 text-center text-lg" title="Extinta, obrigado Garrido">&#128683;</div>
            <div class="w-[140px] min-w-[120px] font-medium text-gray-400 line-through">${escalao.nome}</div>
            <div class="flex-1 min-w-[150px] text-xs text-red-500 italic">Extinta no mandato de Garrido Pereira</div>
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

    const diff = calculateDiff(atual, anterior);
    const zona = getZonaIndicator(atual.zona);
    const statusIndicator = getStatusIndicator(atual, anterior);

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
        <div class="w-8 text-center text-lg" title="${statusIndicator.title}">${statusIndicator.icon}</div>
        <div class="w-[140px] min-w-[120px] font-medium truncate flex items-center gap-1" title="${escalao.nome}">
            ${zona}
            <span>${escalao.nome}</span>
        </div>
        <div class="flex-1 min-w-[150px] text-xs text-gray-500">${competicaoHtml}</div>
        <div class="w-10 text-center font-bold">${atual.posicao || '-'}º</div>
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

// Get status indicator comparing current vs previous season
function getStatusIndicator(atual, anterior) {
    if (!anterior || !anterior.posicaoFinal || !atual || !atual.posicao) {
        return { icon: '', title: '' };
    }

    // If competition changed, the team moved division — that's worse
    if (anterior.competicao && atual.competicao && anterior.competicao !== atual.competicao) {
        return { icon: '&#128308;', title: `Pior que na época passada — mudou de competição (${anterior.competicao} → ${atual.competicao})` };
    }

    const diff = anterior.posicaoFinal - atual.posicao;

    if (diff > 2) {
        return { icon: '&#128640;', title: `Muito melhor! Subiu ${diff} posições` };
    } else if (diff > 0) {
        return { icon: '&#128994;', title: `Melhor: Subiu ${diff} posições` };
    } else if (diff < -2) {
        return { icon: '&#128308;', title: `Muito pior! Desceu ${Math.abs(diff)} posições` };
    } else if (diff < 0) {
        return { icon: '&#128992;', title: `Pior: Desceu ${Math.abs(diff)} posições` };
    }
    return { icon: '&#128311;', title: 'Igual à época anterior' };
}

// Calculate difference between current and previous season
function calculateDiff(atual, anterior) {
    if (!anterior || !anterior.posicaoFinal) {
        return { icon: '', class: 'text-gray-400', value: null };
    }

    if (!atual || !atual.posicao) {
        return { icon: '', class: 'text-gray-400', value: null };
    }

    const diff = anterior.posicaoFinal - atual.posicao;

    if (diff > 0) {
        return { icon: '↑', class: 'text-green-500', value: diff };
    } else if (diff < 0) {
        return { icon: '↓', class: 'text-red-500', value: Math.abs(diff) };
    }
    return { icon: '→', class: 'text-gray-400', value: null };
}

// Get zona indicator
function getZonaIndicator(zona) {
    switch (zona) {
        case 'titulo':
            return '<span class="text-lg" title="Zona de título">&#127942;</span>';
        case 'subida':
            return '<span class="text-lg" title="Em zona de subida (época em curso)">&#9650;</span>';
        case 'playoff':
            return '<span class="text-lg text-yellow-500" title="Zona de playoff">&#9679;</span>';
        case 'descida':
            return '<span class="text-lg text-red-500" title="Em zona de descida (época em curso)">&#128680;</span>';
        default:
            return '';
    }
}

// Show modal with detailed view
function showModal(escalao, modalidade) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');

    const diff = calculateDiff(escalao.atual, escalao.anterior);
    const atual = escalao.atual || {};
    const anterior = escalao.anterior || {};

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

        ${diff.value ? `
            <div class="bg-${diff.icon === '↑' ? 'green' : 'red'}-50 rounded-lg p-4 text-center">
                <span class="text-2xl ${diff.class}">${diff.icon}</span>
                <p class="${diff.class} font-medium">
                    ${diff.icon === '↑' ? 'Melhorou' : 'Desceu'} ${diff.value} ${diff.value === 1 ? 'posição' : 'posições'} em relação à época anterior
                </p>
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
    let melhor = 0;
    let igual = 0;
    let pior = 0;
    let extintas = 0;
    let emRisco = 0;

    appData.modalidades.forEach(modalidade => {
        modalidade.escaloes.forEach(escalao => {
            total++;

            if (escalao.status === 'extinta') {
                extintas++;
                return;
            }

            const atual = escalao.atual || {};
            const anterior = escalao.anterior || {};

            // Count teams in descida zone
            if (atual.zona === 'descida') {
                emRisco++;
            }

            if (!anterior.posicaoFinal || !atual.posicao) {
                return;
            }

            // If competition changed, it's worse
            if (anterior.competicao && atual.competicao && anterior.competicao !== atual.competicao) {
                pior++;
                return;
            }

            const diff = anterior.posicaoFinal - atual.posicao;

            if (diff > 0) {
                melhor++;
            } else if (diff < 0) {
                pior++;
            } else {
                igual++;
            }
        });
    });

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-melhor').textContent = melhor;
    document.getElementById('stat-igual').textContent = igual;
    document.getElementById('stat-pior').textContent = pior;
    document.getElementById('stat-extintas').textContent = extintas;

    // Update Boavistómetro counters
    const elExtintas = document.getElementById('equipas-extintas');
    if (elExtintas) elExtintas.textContent = extintas;
    const elRisco = document.getElementById('equipas-risco');
    if (elRisco) elRisco.textContent = emRisco;
}

// Cronologia rendering
const cronologiaTypeConfig = {
    governanca: { color: 'bg-gray-400', label: 'Governança' },
    financas: { color: 'bg-red-500', label: 'Finanças' },
    modalidades: { color: 'bg-orange-500', label: 'Modalidades' },
    estadio: { color: 'bg-yellow-500', label: 'Estádio' },
    sad: { color: 'bg-purple-500', label: 'SAD' },
    positivo: { color: 'bg-green-500', label: 'Positivo' }
};

function renderCronologia() {
    if (!cronologiaData || !cronologiaData.eventos) return;

    const content = document.getElementById('cronologia-content');
    if (!content) return;

    const eventos = cronologiaData.eventos.sort((a, b) => a.data.localeCompare(b.data));

    // Render timeline with all events
    renderCronologiaTimeline(content, eventos);

    // Setup filter pills
    setupCronologiaFilters(eventos);
}

function renderCronologiaTimeline(container, eventos) {
    container.innerHTML = '';

    const timeline = document.createElement('div');
    timeline.className = 'relative pl-6 border-l-2 border-gray-200 space-y-4';

    eventos.forEach(evento => {
        const cfg = cronologiaTypeConfig[evento.tipo] || cronologiaTypeConfig.governanca;
        const date = new Date(evento.data);
        const dateStr = date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });

        const item = document.createElement('div');
        item.className = 'relative';
        item.innerHTML = `
            <div class="absolute -left-[25px] top-1 w-3 h-3 rounded-full ${cfg.color} border-2 border-white"></div>
            <div class="text-xs text-gray-400">${dateStr}</div>
            <div class="text-sm font-semibold text-gray-800">${evento.titulo}</div>
            <div class="text-xs text-gray-500 mt-0.5">${evento.descricao}</div>
        `;
        timeline.appendChild(item);
    });

    container.appendChild(timeline);
}

function setupCronologiaFilters(eventos) {
    const filtersContainer = document.getElementById('cronologia-filters');
    if (!filtersContainer) return;

    // Get unique types from events
    const types = [...new Set(eventos.map(e => e.tipo))];

    filtersContainer.innerHTML = '';

    // "Todos" pill
    const allBtn = document.createElement('button');
    allBtn.className = 'cronologia-filter active px-3 py-1 text-xs font-medium rounded-full border border-gray-300 transition-colors';
    allBtn.textContent = 'Todos';
    allBtn.addEventListener('click', () => {
        setActiveFilter(filtersContainer, allBtn);
        renderCronologiaTimeline(document.getElementById('cronologia-content'), eventos);
    });
    filtersContainer.appendChild(allBtn);

    // Per-type pills
    types.forEach(type => {
        const cfg = cronologiaTypeConfig[type] || cronologiaTypeConfig.governanca;
        const btn = document.createElement('button');
        btn.className = 'cronologia-filter px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-600 hover:border-gray-400 transition-colors';
        btn.textContent = cfg.label;
        btn.addEventListener('click', () => {
            setActiveFilter(filtersContainer, btn);
            const filtered = eventos.filter(e => e.tipo === type);
            renderCronologiaTimeline(document.getElementById('cronologia-content'), filtered);
        });
        filtersContainer.appendChild(btn);
    });
}

function setActiveFilter(container, activeBtn) {
    container.querySelectorAll('.cronologia-filter').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('text-gray-600');
    });
    activeBtn.classList.add('active');
    activeBtn.classList.remove('text-gray-600');
}

// Promessas rendering
function renderPromessas() {
    if (!promessasData) return;

    const statusConfig = {
        cumprida: { icon: '✅', label: 'Cumprida', color: 'text-green-600', bg: 'bg-green-500' },
        parcial: { icon: '🟡', label: 'Parcial', color: 'text-yellow-600', bg: 'bg-yellow-500' },
        nao_cumprida: { icon: '❌', label: 'Não cumprida', color: 'text-red-600', bg: 'bg-red-500' },
        oposto: { icon: '💀', label: 'Fez o oposto', color: 'text-gray-900', bg: 'bg-gray-900' }
    };

    // Count totals
    let counts = { cumprida: 0, parcial: 0, nao_cumprida: 0, oposto: 0 };
    let total = 0;
    promessasData.categorias.forEach(cat => {
        cat.promessas.forEach(p => {
            counts[p.status]++;
            total++;
        });
    });

    // Score text
    const scoreEl = document.getElementById('promessas-score');
    if (scoreEl) {
        scoreEl.textContent = `${counts.cumprida} de ${total} cumpridas`;
    }

    // Progress bar
    const bar = document.getElementById('promessas-bar');
    if (bar) {
        bar.innerHTML = '';
        const segments = [
            { key: 'cumprida', count: counts.cumprida },
            { key: 'parcial', count: counts.parcial },
            { key: 'nao_cumprida', count: counts.nao_cumprida },
            { key: 'oposto', count: counts.oposto }
        ];
        segments.forEach(seg => {
            if (seg.count === 0) return;
            const div = document.createElement('div');
            const pct = (seg.count / total) * 100;
            div.style.width = pct + '%';
            div.className = statusConfig[seg.key].bg;
            div.title = `${statusConfig[seg.key].label}: ${seg.count}`;
            bar.appendChild(div);
        });
    }

    // Bar legend
    const legend = document.getElementById('promessas-bar-legend');
    if (legend) {
        legend.innerHTML = `
            <span>${statusConfig.cumprida.icon} ${counts.cumprida} cumpridas</span>
            <span>${statusConfig.parcial.icon} ${counts.parcial} parciais</span>
            <span>${statusConfig.nao_cumprida.icon} ${counts.nao_cumprida} não cumpridas</span>
            <span>${statusConfig.oposto.icon} ${counts.oposto} fez o oposto</span>
        `;
    }

    // Render categories (always open, no toggle)
    const content = document.getElementById('promessas-content');
    if (!content) return;
    content.innerHTML = '';

    promessasData.categorias.forEach(cat => {
        const catDiv = document.createElement('details');
        catDiv.className = 'bg-white rounded-lg border border-gray-200 overflow-hidden';

        const catCounts = { cumprida: 0, parcial: 0, nao_cumprida: 0, oposto: 0 };
        cat.promessas.forEach(p => catCounts[p.status]++);

        const summary = document.createElement('summary');
        summary.className = 'px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between';
        summary.innerHTML = `
            <span class="font-medium text-sm">
                <span class="mr-1">${cat.icon}</span> ${cat.nome}
                <span class="text-gray-400 text-xs ml-1">(${cat.promessas.length})</span>
            </span>
            <span class="flex gap-1 text-xs">
                ${catCounts.cumprida ? `<span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">${catCounts.cumprida} ✅</span>` : ''}
                ${catCounts.parcial ? `<span class="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">${catCounts.parcial} 🟡</span>` : ''}
                ${catCounts.nao_cumprida ? `<span class="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">${catCounts.nao_cumprida} ❌</span>` : ''}
                ${catCounts.oposto ? `<span class="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">${catCounts.oposto} 💀</span>` : ''}
            </span>
        `;
        catDiv.appendChild(summary);

        const list = document.createElement('div');
        list.className = 'px-4 pb-3 space-y-2';

        cat.promessas.forEach(p => {
            const cfg = statusConfig[p.status];
            const item = document.createElement('div');
            item.className = 'flex items-start gap-2 text-sm';
            item.innerHTML = `
                <span class="text-base flex-shrink-0 mt-0.5" title="${cfg.label}">${cfg.icon}</span>
                <div>
                    <span class="${cfg.color}">${p.texto}</span>
                    ${p.nota ? `<p class="text-xs text-gray-400 mt-0.5">${p.nota}</p>` : ''}
                </div>
            `;
            list.appendChild(item);
        });

        catDiv.appendChild(list);
        content.appendChild(catDiv);
    });
}
