// BFC Modalidades - Main Application

let appData = null;
let currentFilters = {
    modalidade: '',
    tipo: ''
};

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupDarkMode();
    setupEventListeners();
    await loadData();
}

// Dark mode setup
function setupDarkMode() {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (e.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });

    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
    });
}

// Event listeners
function setupEventListeners() {
    // Filters
    document.getElementById('filter-modalidade')?.addEventListener('change', (e) => {
        currentFilters.modalidade = e.target.value;
        renderCards();
    });

    document.getElementById('filter-tipo')?.addEventListener('change', (e) => {
        currentFilters.tipo = e.target.value;
        renderCards();
    });

    // Mobile filters toggle
    document.getElementById('filters-toggle')?.addEventListener('click', () => {
        const filtersBar = document.getElementById('filters-bar');
        filtersBar?.classList.toggle('hidden');
    });

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

        setupFilters();
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

// Setup filter dropdowns
function setupFilters() {
    if (!appData) return;

    const modalidadeSelect = document.getElementById('filter-modalidade');
    const chipsContainer = document.getElementById('filter-chips');

    // Clear existing options (except "Todas")
    while (modalidadeSelect.options.length > 1) {
        modalidadeSelect.remove(1);
    }

    // Add modalidade options
    appData.modalidades.forEach(mod => {
        const option = document.createElement('option');
        option.value = mod.id;
        option.textContent = `${mod.icon} ${mod.nome}`;
        modalidadeSelect.appendChild(option);
    });

    // Create filter chips
    if (chipsContainer) {
        chipsContainer.innerHTML = '';
        appData.modalidades.slice(0, 4).forEach(mod => {
            const chip = document.createElement('button');
            chip.className = 'px-3 py-1 rounded-full text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
            chip.textContent = mod.icon + ' ' + mod.nome;
            chip.dataset.modalidade = mod.id;
            chip.addEventListener('click', () => {
                currentFilters.modalidade = currentFilters.modalidade === mod.id ? '' : mod.id;
                document.getElementById('filter-modalidade').value = currentFilters.modalidade;
                updateChipStyles();
                renderCards();
            });
            chipsContainer.appendChild(chip);
        });
    }
}

function updateChipStyles() {
    const chips = document.querySelectorAll('#filter-chips button');
    chips.forEach(chip => {
        if (chip.dataset.modalidade === currentFilters.modalidade) {
            chip.classList.add('bg-bfc-black', 'text-white', 'dark:bg-white', 'dark:text-gray-900');
            chip.classList.remove('border-gray-300', 'dark:border-gray-600');
        } else {
            chip.classList.remove('bg-bfc-black', 'text-white', 'dark:bg-white', 'dark:text-gray-900');
            chip.classList.add('border-gray-300', 'dark:border-gray-600');
        }
    });
}

// Render cards
function renderCards() {
    if (!appData) return;

    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    // Filter modalidades
    let modalidades = appData.modalidades;

    if (currentFilters.modalidade) {
        modalidades = modalidades.filter(m => m.id === currentFilters.modalidade);
    }

    // Render each modalidade
    modalidades.forEach(modalidade => {
        // Filter escaloes by tipo
        let escaloes = modalidade.escaloes;
        if (currentFilters.tipo) {
            escaloes = escaloes.filter(e => e.tipo === currentFilters.tipo);
        }

        if (escaloes.length === 0) return;

        const card = createCard(modalidade, escaloes);
        container.appendChild(card);
    });

    // Show empty state if no results
    if (container.children.length === 0) {
        showEmpty();
    } else {
        hideEmpty();
    }
}

// Create a modalidade card
function createCard(modalidade, escaloes) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300';

    // Card header - FIXED: explicit text color for dark mode
    const header = document.createElement('div');
    header.className = 'px-4 py-3 bg-gray-900 text-white border-b border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors';
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-2xl">${modalidade.icon}</span>
            <h2 class="font-bold text-lg uppercase tracking-wide">${modalidade.nome}</h2>
            <span class="text-xs text-gray-300">(${escaloes.length} escaloes)</span>
        </div>
        <svg class="w-5 h-5 transition-transform duration-300 card-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
    `;

    // Card body (escaloes list)
    const body = document.createElement('div');
    body.className = 'card-body';

    // Column headers row - using flex for better control
    const headerRow = document.createElement('div');
    headerRow.className = 'px-4 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2';
    headerRow.innerHTML = `
        <div class="w-8 text-center" title="Estado vs epoca anterior">Est</div>
        <div class="flex-1 min-w-[120px]">Escalao</div>
        <div class="w-[140px] hidden md:block">Competicao</div>
        <div class="w-10 text-center">Pos</div>
        <div class="w-10 text-center">Pts</div>
        <div class="w-8 text-center">J</div>
        <div class="w-8 text-center">V</div>
        <div class="w-8 text-center">E</div>
        <div class="w-8 text-center">D</div>
        <div class="w-12 text-center hidden sm:block">Golos</div>
    `;
    body.appendChild(headerRow);

    // Table for escaloes
    const table = document.createElement('div');
    table.className = 'divide-y divide-gray-100 dark:divide-gray-700';

    escaloes.forEach(escalao => {
        const row = createEscalaoRow(escalao, modalidade);
        table.appendChild(row);
    });

    body.appendChild(table);

    // Toggle expand/collapse
    header.addEventListener('click', () => {
        body.classList.toggle('collapsed');
        header.querySelector('.card-chevron').classList.toggle('rotate-180');
    });

    card.appendChild(header);
    card.appendChild(body);

    return card;
}

// Create a row for each escalao
function createEscalaoRow(escalao, modalidade) {
    const row = document.createElement('div');
    row.className = 'px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors text-sm';

    const atual = escalao.atual || {};
    const anterior = escalao.anterior || {};

    // Check if team is extinct
    if (escalao.status === 'extinta') {
        row.innerHTML = `
            <div class="w-8 text-center text-lg">&#128683;</div>
            <div class="flex-1 min-w-[120px] font-medium text-gray-400 line-through">${escalao.nome}</div>
            <div class="text-xs text-red-500 dark:text-red-400 italic">Equipa extinta</div>
        `;
        row.classList.add('opacity-60');
        return row;
    }

    const diff = calculateDiff(atual, anterior);
    const zona = getZonaIndicator(atual.zona);

    // Status indicator (better/worse/same vs last season)
    const statusIndicator = getStatusIndicator(atual, anterior);

    // Competition name
    const competicao = atual.divisao || atual.competicao || '-';
    const competicaoShort = competicao.length > 18 ? competicao.substring(0, 16) + '...' : competicao;

    // Goals display
    const golosDisplay = atual.golosMarcados !== undefined && atual.golosSofridos !== undefined
        ? `${atual.golosMarcados}-${atual.golosSofridos}`
        : '-';

    row.innerHTML = `
        <div class="w-8 text-center text-lg" title="${statusIndicator.title}">${statusIndicator.icon}</div>
        <div class="flex-1 min-w-[120px] font-medium truncate flex items-center gap-1" title="${escalao.nome}">
            ${zona}
            <span>${escalao.nome}</span>
        </div>
        <div class="w-[140px] text-xs text-gray-500 dark:text-gray-400 truncate hidden md:block" title="${competicao}">${competicaoShort}</div>
        <div class="w-10 text-center font-bold">${atual.posicao || '-'}º</div>
        <div class="w-10 text-center font-semibold">${atual.pontos !== undefined ? atual.pontos : '-'}</div>
        <div class="w-8 text-center text-gray-600 dark:text-gray-400">${atual.jogos !== undefined ? atual.jogos : '-'}</div>
        <div class="w-8 text-center text-green-600 dark:text-green-400">${atual.vitorias !== undefined ? atual.vitorias : '-'}</div>
        <div class="w-8 text-center text-yellow-600 dark:text-yellow-400">${atual.empates !== undefined ? atual.empates : '-'}</div>
        <div class="w-8 text-center text-red-600 dark:text-red-400">${atual.derrotas !== undefined ? atual.derrotas : '-'}</div>
        <div class="w-12 text-center text-gray-600 dark:text-gray-400 hidden sm:block" title="Golos: ${atual.golosMarcados || 0} marcados, ${atual.golosSofridos || 0} sofridos">${golosDisplay}</div>
    `;

    // Click to show details
    row.addEventListener('click', () => {
        showModal(escalao, modalidade);
    });

    return row;
}

// Get status indicator comparing current vs previous season
function getStatusIndicator(atual, anterior) {
    if (!anterior || !anterior.posicaoFinal) {
        return { icon: '&#127381;', title: 'Nova equipa esta epoca' }; // NEW emoji
    }

    if (!atual || !atual.posicao) {
        return { icon: '&#10067;', title: 'Sem dados' }; // Question mark
    }

    const diff = anterior.posicaoFinal - atual.posicao;

    if (diff > 2) {
        return { icon: '&#128640;', title: `Muito melhor! Subiu ${diff} posicoes` }; // Rocket
    } else if (diff > 0) {
        return { icon: '&#128994;', title: `Melhor: Subiu ${diff} posicao(oes)` }; // Green circle
    } else if (diff < -2) {
        return { icon: '&#128308;', title: `Muito pior! Desceu ${Math.abs(diff)} posicoes` }; // Red circle
    } else if (diff < 0) {
        return { icon: '&#128992;', title: `Pior: Desceu ${Math.abs(diff)} posicao(oes)` }; // Orange circle
    }
    return { icon: '&#128311;', title: 'Igual a epoca anterior' }; // Blue circle (same)
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
            return '<span class="text-lg" title="Zona de titulo">&#127942;</span>';
        case 'subida':
            return '<span class="text-lg" title="Zona de subida">&#9650;</span>';
        case 'playoff':
            return '<span class="text-lg text-yellow-500" title="Zona de playoff">&#9679;</span>';
        case 'descida':
            return '<span class="text-lg text-red-500" title="Zona de descida">&#128680;</span>';
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
                <p class="text-sm text-gray-500 dark:text-gray-400">${modalidade.icon} ${modalidade.nome}</p>
            </div>
            <button onclick="closeModal()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
            <!-- Current Season -->
            <div class="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
                <h4 class="font-semibold text-sm text-gray-500 dark:text-gray-400 mb-3">${appData.meta.currentSeason} (atual)</h4>
                <div class="space-y-2">
                    ${atual.competicao ? `<p class="text-sm">${atual.competicao}</p>` : ''}
                    ${atual.divisao ? `<p class="text-xs text-gray-500 dark:text-gray-400">${atual.divisao}</p>` : ''}
                    <p class="text-3xl font-bold">${atual.posicao || '-'}º lugar</p>
                    <p class="text-lg">${atual.pontos !== undefined ? atual.pontos + ' pontos' : '-'}</p>
                    ${atual.jogos ? `<p class="text-sm text-gray-600 dark:text-gray-400">${atual.jogos} jogos</p>` : ''}
                    ${atual.vitorias !== undefined ? `
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            ${atual.vitorias}V ${atual.empates}E ${atual.derrotas}D
                        </p>
                    ` : ''}
                </div>
            </div>

            <!-- Previous Season -->
            <div class="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
                <h4 class="font-semibold text-sm text-gray-500 dark:text-gray-400 mb-3">${appData.meta.previousSeason} (anterior)</h4>
                <div class="space-y-2">
                    ${anterior.competicao ? `<p class="text-sm">${anterior.competicao}</p>` : ''}
                    ${anterior.divisao ? `<p class="text-xs text-gray-500 dark:text-gray-400">${anterior.divisao}</p>` : ''}
                    <p class="text-3xl font-bold">${anterior.posicaoFinal || '-'}º lugar</p>
                    <p class="text-lg">${anterior.pontosFinal !== undefined ? anterior.pontosFinal + ' pontos' : '-'}</p>
                    ${anterior.jogos ? `<p class="text-sm text-gray-600 dark:text-gray-400">${anterior.jogos} jogos</p>` : ''}
                    ${anterior.vitorias !== undefined ? `
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            ${anterior.vitorias}V ${anterior.empates}E ${anterior.derrotas}D
                        </p>
                    ` : ''}
                    ${!anterior.posicaoFinal ? '<p class="text-sm text-gray-400 italic">Sem dados</p>' : ''}
                </div>
            </div>
        </div>

        <!-- Comparison summary -->
        ${diff.value ? `
            <div class="bg-${diff.icon === '↑' ? 'green' : 'red'}-50 dark:bg-${diff.icon === '↑' ? 'green' : 'red'}-900/20 rounded-lg p-4 text-center">
                <span class="text-2xl ${diff.class}">${diff.icon}</span>
                <p class="${diff.class} font-medium">
                    ${diff.icon === '↑' ? 'Melhorou' : 'Desceu'} ${diff.value} ${diff.value === 1 ? 'posicao' : 'posicoes'} em relacao a epoca anterior
                </p>
            </div>
        ` : ''}

        ${atual.divisao !== anterior.divisao && anterior.divisao ? `
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center mt-4">
                <p class="text-blue-600 dark:text-blue-400 font-medium">
                    &#9733; Mudou de divisao: ${anterior.divisao} → ${atual.divisao}
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
    timestamp.textContent = `Ultima atualizacao: ${date.toLocaleDateString('pt-PT', options)}`;
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
    let novas = 0;
    let extintas = 0;

    appData.modalidades.forEach(modalidade => {
        modalidade.escaloes.forEach(escalao => {
            total++;

            if (escalao.status === 'extinta') {
                extintas++;
                return;
            }

            const atual = escalao.atual || {};
            const anterior = escalao.anterior || {};

            if (!anterior.posicaoFinal) {
                novas++;
                return;
            }

            if (!atual.posicao) {
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
    document.getElementById('stat-novas').textContent = novas;
    document.getElementById('stat-extintas').textContent = extintas;
}
