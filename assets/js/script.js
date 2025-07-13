// Substitua o conteúdo do seu script.js por este código
document.addEventListener('DOMContentLoaded', () => {
    // --- STATE, CONFIG & DOM ELEMENTS ---
    const getEl = (id) => document.getElementById(id);
    const dom = {
        categoryList: getEl('category-list'), brandFilterEl: getEl('brand-filter'), productGrid: getEl('product-grid'), gridTitle: getEl('grid-title'),
        priceFilter: getEl('price-filter'), priceValue: getEl('price-value'), searchBar: getEl('search-bar'), sortBy: getEl('sort-by'),
        modal: getEl('modal'), modalContentBox: getEl('modal-content-box'), modalTitle: getEl('modal-title'), modalImage: getEl('modal-image'),
        modalBrandLogo: getEl('modal-brand-logo'), modalSpecs: getEl('modal-specs'),
        closeModalBtn: getEl('close-modal'), aiAnalysisOutput: getEl('ai-analysis-output'), modalPriceComparison: getEl('modal-price-comparison'),
        modalHeaderContent: getEl('modal-header-content'), modalMainContent: getEl('modal-main-content'), modalAnalysisContent: getEl('modal-analysis-content'),
        buildListEl: getEl('build-list'), buildTitle: getEl('build-title'), buildFooter: getEl('build-footer'), buildTotalEl: getEl('build-total'), clearBuildBtn: getEl('clear-build-btn'),
        analyzeBuildBtn: getEl('analyze-build-btn'), exportBuildBtn: getEl('export-build-btn'), compatibilityWarningEl: getEl('compatibility-warning'),
        wattageCalculatorEl: getEl('wattage-calculator'), buildWattageEl: getEl('build-wattage'),
        psuWattageEl: getEl('psu-wattage'), wattageStatusEl: getEl('wattage-status'),
        productCardTemplate: getEl('product-card-template'), loadingSpinner: getEl('loading-spinner'),
        clearFiltersBtn: getEl('clear-filters-btn'),
        dynamicFiltersContainer: getEl('dynamic-filters-container'),
    };
    
    // ===================================================================
    // --- CONFIGURAÇÃO DA API REAL ---
    // ===================================================================
    const API_URL = 'https://www.google.com.br/shopping/product/2295348744319245632/offers'; // Ex: 'https://seuservidor.com/api/products'
    const token = "EMVAEHVIXYMBFCCBGGINZQVDBICMSUYRVQBTXFESOJEYIHAKNFUIRCLAQNKVQMUR"; 
    // ===================================================================

    const categoryLimits = { 'CPU': 1, 'Placa-Mãe': 1, 'Placa de Vídeo': 1, 'Fonte de Alimentação': 1, 'Gabinete': 1, 'Cooler': 1, 'Memória RAM': 4, 'Armazenamento SSD': 4, 'Monitor': 2, 'Mouse': 1, 'Teclado': 1, 'Headset/Microfone': 1 };
    let allProducts = [];
    const productMap = new Map();
    let state = { currentCategory: 'Todos', selectedBrands: [], maxPrice: 15000, searchTerm: '', sortBy: 'popularity', build: JSON.parse(localStorage.getItem('pcBuild')) || {}, dynamicFilters: {} };

    /**
     * Busca os produtos da sua API real.
     * @returns {Promise<Array>} Uma promessa que resolve com a lista de produtos.
     */
    async function fetchProductsFromAPI() {
        console.log(`Iniciando busca de produtos na API em: ${API_URL}`);
        dom.loadingSpinner.classList.remove('hidden');

        try {
            // A chamada de rede real usando fetch()
            const response = await fetch(API_URL, {
                headers: {
                    // Adicione cabeçalhos conforme sua API exigir. Exemplo com token:
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Se a resposta não for bem-sucedida (ex: erro 404, 500), lança um erro.
                throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
            }

            // Converte a resposta para JSON.
            const data = await response.json();
            console.log("Produtos recebidos da API com sucesso!");
            
            // IMPORTANTE: Sua API deve retornar um array de objetos, 
            // no mesmo formato que estava no database.js
            return data;

        } catch (error) {
            console.error("Falha ao buscar produtos da API:", error);
            dom.loadingSpinner.classList.add('hidden');
            dom.productGrid.innerHTML = `<div class="col-span-full text-center py-16 px-6 bg-dark-900 rounded-xl border border-dark-800"><i data-feather="server-off" class="w-16 h-16 text-red-500 mx-auto mb-4"></i><h3 class="text-2xl font-bold text-white font-display">Falha ao Conectar com a API</h3><p class="text-gray-400 mt-2">Não foi possível carregar os produtos. Verifique o endereço da API e sua conexão.</p></div>`;
            feather.replace();
            return []; // Retorna um array vazio em caso de erro para não quebrar o site
        }
    }

    // O restante do código permanece igual, pois ele já está preparado
    // para receber os dados de forma assíncrona.
    
    // --- UI HELPER FUNCTIONS ---
    const formatPrice = (price) => price ? `R$${price.toFixed(2).replace('.', ',')}` : 'Indisponível';

    const findProductById = (id) => productMap.get(id) || null;

    function getCardExtraInfo(product) {
        const parentProduct = product.variants ? product : findProductById(product.id);
        const specs = { ...(parentProduct?.specs || {}), ...product.specs };
        switch (product.category) {
            case 'CPU': return `Soquete: ${specs.Soquete} | Núcleos: ${specs.Núcleos}`;
            case 'Placa-Mãe': return `Soquete: ${specs.Soquete} | Formato: ${specs.Formato}`;
            case 'Placa de Vídeo': return `Memória: ${specs.Memória}`;
            case 'Memória RAM': return `${specs.Capacidade} | ${specs.Velocidade} | ${specs.Tipo}`;
            case 'Armazenamento SSD': return `Capacidade: ${specs.Capacidade} | ${specs.Interface}`;
            case 'Fonte de Alimentação': return `Potência: ${specs.Potência}`;
            case 'Gabinete': return `Formato: ${specs.Formato} | Cor: ${specs.Cor || 'Padrão'}`;
            case 'Cooler': return `Tipo: ${specs.Tipo}`;
            case 'Monitor': return `Tamanho: ${specs.Tamanho}" | Resolução: ${specs.Resolução}`;
            case 'Mouse': return `Sensor: ${specs.Sensor} | DPI: ${specs.DPI}`;
            case 'Teclado': return `Formato: ${specs.Formato} | Switch: ${specs.Switch}`;
            case 'Headset/Microfone': return `Tipo: ${specs.Tipo} | Conexão: ${specs.Conexão}`;
            default: return '';
        }
    }

    function showToast(message, icon = 'check-circle', color = 'brand') {
        const toastId = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        const colorClasses = { brand: 'border-brand text-brand', yellow: 'border-yellow-600 text-yellow-300', red: 'border-red-600 text-red-300', blue: 'border-blue-600 text-blue-300' };
        toast.id = toastId;
        toast.className = `flex items-center gap-4 w-full max-w-xs p-4 rounded-xl shadow-lg bg-dark-800 border ${colorClasses[color] || colorClasses.brand} toast-in`;
        toast.innerHTML = `<i data-feather="${icon}" class="w-6 h-6"></i><p class="font-semibold">${message}</p>`;
        getEl('toast-container').appendChild(toast);
        feather.replace();
        setTimeout(() => {
            const el = getEl(toastId);
            if (el) { el.classList.replace('toast-in', 'toast-out'); el.addEventListener('animationend', () => el.remove()); }
        }, 4000);
    }

    // --- RENDER FUNCTIONS ---
    function renderProducts(productsToRender) {
        dom.loadingSpinner.classList.add('hidden');
        dom.gridTitle.textContent = `${state.currentCategory} (${productsToRender.length})`;
        dom.productGrid.innerHTML = '';
        if (productsToRender.length === 0 && allProducts.length > 0) { // Evita mostrar msg de "nenhum produto" enquanto carrega
            dom.productGrid.innerHTML = `<div class="col-span-full text-center py-16 px-6 bg-dark-900 rounded-xl border border-dark-800"><i data-feather="alert-circle" class="w-16 h-16 text-brand mx-auto mb-4"></i><h3 class="text-2xl font-bold text-white font-display">Nenhum produto encontrado</h3><p class="text-gray-400 mt-2">Tente ajustar seus filtros ou <button id="reset-filters-msg" class="text-brand font-semibold hover:underline">redefinir a busca</button>.</p></div>`;
            const resetBtn = getEl('reset-filters-msg');
            if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
            feather.replace();
            return;
        }
        const fragment = document.createDocumentFragment();
        productsToRender.forEach(product => {
            const cardClone = dom.productCardTemplate.content.cloneNode(true);
            const elements = { root: cardClone.querySelector('.product-card'), image: cardClone.querySelector('[data-prop="image"]'), name: cardClone.querySelector('[data-prop="name"]'), brandCategory: cardClone.querySelector('[data-prop="brand-category"]'), extraInfo: cardClone.querySelector('[data-prop="extra-info"]'), price: cardClone.querySelector('[data-prop="price"]'), addBtn: cardClone.querySelector('[data-prop="add-btn"]'), variantsContainer: cardClone.querySelector('[data-prop="variants-container"]') };
            elements.root.dataset.id = product.id;
            elements.name.textContent = product.name;
            elements.brandCategory.textContent = `${product.brand} - ${product.category}`;
            if (product.variants && product.variants.length > 0) {
                const defaultVariant = product.variants[0];
                elements.image.src = product.image || defaultVariant.image;
                elements.price.textContent = formatPrice(defaultVariant.price);
                elements.extraInfo.textContent = getCardExtraInfo(defaultVariant);
                elements.name.textContent = defaultVariant.name;
                const selector = document.createElement('select');
                selector.className = 'variant-selector';
                selector.dataset.productId = product.id;
                product.variants.forEach(variant => {
                    const option = document.createElement('option');
                    option.value = variant.id;
                    const specKey = variant.specs.Capacidade ? 'Capacidade' : (variant.specs.Cor ? 'Cor' : null);
                    option.textContent = specKey ? `${variant.specs[specKey]}` : variant.name;
                    if (variant.specs.Velocidade) option.textContent += ` ${variant.specs.Velocidade}`;
                    selector.appendChild(option);
                });
                selector.addEventListener('change', (e) => {
                    const selectedVariant = findProductById(e.target.value);
                    if (selectedVariant) {
                        elements.price.textContent = formatPrice(selectedVariant.price);
                        elements.extraInfo.textContent = getCardExtraInfo(selectedVariant);
                        elements.image.src = selectedVariant.image || product.image;
                        elements.name.textContent = selectedVariant.name;
                    }
                });
                elements.variantsContainer.appendChild(selector);
                elements.addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const productToAdd = findProductById(selector.value);
                    if (productToAdd) { addToBuild(productToAdd); elements.root.classList.add('flash-border-animation'); elements.root.addEventListener('animationend', () => elements.root.classList.remove('flash-border-animation')); }
                });
            } else {
                elements.image.src = product.image;
                elements.price.textContent = formatPrice(product.price);
                elements.extraInfo.textContent = getCardExtraInfo(product);
                elements.addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToBuild(product);
                    elements.root.classList.add('flash-border-animation');
                    elements.root.addEventListener('animationend', () => elements.root.classList.remove('flash-border-animation'));
                });
            }
            elements.image.alt = product.name;
            cardClone.querySelectorAll('[data-action="open-modal"]').forEach(el => el.addEventListener('click', () => showModal(product.id)));
            fragment.appendChild(cardClone);
        });
        dom.productGrid.appendChild(fragment);
        feather.replace();
    }

    function renderDynamicFilters(category) {
        dom.dynamicFiltersContainer.innerHTML = '';
        let filtersHtml = '';
        const createSelect = (key, label, options) => {
            const sortedOptions = options.sort((a, b) => { const numA = parseInt(a); const numB = parseInt(b); if (!isNaN(numA) && !isNaN(numB)) { return numA - numB; } return a.localeCompare(b); });
            return `<div class="flex-grow min-w-[150px] md:flex-1"><label for="filter-${key}" class="block mb-1 text-sm font-medium text-gray-300">${label}</label><select id="filter-${key}" data-filter-key="${key}" class="dynamic-filter-select bg-dark-800 border border-dark-700 text-white text-sm rounded-lg focus:ring-brand focus:border-brand block w-full p-2.5"><option value="all">Todos</option>${sortedOptions.map(o => `<option value="${o}">${o}</option>`).join('')}</select></div>`;
        }
        const getUniqueSpecValues = (cat, specName) => {
            const values = allProducts.filter(p => p.category === cat).flatMap(p => p.variants ? p.variants.map(v => v.specs[specName]) : [p.specs[specName]]).filter(Boolean);
            return [...new Set(values)];
        }
        if (category === 'Memória RAM') { const capacities = getUniqueSpecValues('Memória RAM', 'Capacidade'); if (capacities.length > 0) filtersHtml += createSelect('Capacidade', 'Capacidade', capacities); }
        else if (category === 'Armazenamento SSD') {
            const capacities = getUniqueSpecValues('Armazenamento SSD', 'Capacidade');
            const interfaces = getUniqueSpecValues('Armazenamento SSD', 'Interface');
            if (capacities.length > 0) filtersHtml += createSelect('Capacidade', 'Capacidade', capacities);
            if (interfaces.length > 0) filtersHtml += createSelect('Interface', 'Interface', interfaces);
        } else if (category === 'Teclado') {
             const formats = getUniqueSpecValues('Teclado', 'Formato');
             const switches = getUniqueSpecValues('Teclado', 'Switch');
             if (formats.length > 0) filtersHtml += createSelect('Formato', 'Formato', formats);
             if (switches.length > 0) filtersHtml += createSelect('Switch', 'Switch', switches);
        } else if (category === 'Monitor') {
             const resolutions = getUniqueSpecValues('Monitor', 'Resolução');
             const sizes = getUniqueSpecValues('Monitor', 'Tamanho');
             if (resolutions.length > 0) filtersHtml += createSelect('Resolução', 'Resolução', resolutions);
             if (sizes.length > 0) filtersHtml += createSelect('Tamanho', 'Tamanho (polegadas)', sizes);
        }
        dom.dynamicFiltersContainer.innerHTML = filtersHtml;
    }

    function applyFiltersAndRender() {
        let data = [...allProducts];
        if (state.currentCategory !== 'Todos') data = data.filter(p => p.category === state.currentCategory);
        if (state.selectedBrands.length > 0) data = data.filter(p => state.selectedBrands.includes(p.brand));
        if (Object.keys(state.dynamicFilters).length > 0) {
            for (const [key, value] of Object.entries(state.dynamicFilters)) {
                if (value !== 'all') {
                    data = data.filter(p => {
                        if (p.variants) {
                            return p.variants.some(v => String(v.specs[key]) === String(value));
                        }
                        return String(p.specs[key]) === String(value);
                    });
                }
            }
        }
        if (state.searchTerm) data = data.filter(p => p.name.toLowerCase().includes(state.searchTerm.toLowerCase()) || (p.variants && p.variants.some(v => v.name.toLowerCase().includes(state.searchTerm.toLowerCase()))));
        data = data.filter(p => { const price = p.price || (p.variants && p.variants[0].price); return price <= state.maxPrice; });
        const getSortPrice = (p) => p.price || (p.variants && p.variants.length > 0 ? p.variants[0].price : Infinity);
        if (state.sortBy === 'price-asc') data.sort((a, b) => getSortPrice(a) - getSortPrice(b));
        else if (state.sortBy === 'price-desc') data.sort((a, b) => getSortPrice(b) - getSortPrice(a));
        else if (state.sortBy === 'name-asc') data.sort((a, b) => a.name.localeCompare(b.name));
        else if (state.sortBy === 'name-desc') data.sort((a, b) => b.name.localeCompare(a.name));
        else if (state.sortBy === 'popularity') data.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        dom.priceValue.textContent = formatPrice(state.maxPrice);
        updateClearFiltersButton();
        renderProducts(data);
    }

    function resetAllFilters() {
        state.selectedBrands = []; state.searchTerm = ''; state.dynamicFilters = {}; dom.searchBar.value = '';
        dom.brandFilterEl.querySelectorAll('input:checked').forEach(cb => cb.checked = false);
        renderDynamicFilters(state.currentCategory);
        dom.priceFilter.value = dom.priceFilter.max; state.maxPrice = dom.priceFilter.max;
        applyFiltersAndRender();
        showToast('Filtros redefinidos', 'rotate-ccw', 'blue');
    }

    function renderBuild() {
        const categoriesOrder = ['CPU', 'Cooler', 'Placa-Mãe', 'Placa de Vídeo', 'Memória RAM', 'Armazenamento SSD', 'Fonte de Alimentação', 'Gabinete', 'Monitor', 'Teclado', 'Mouse', 'Headset/Microfone'];
        dom.buildListEl.innerHTML = ''; let totalItems = 0;
        if (Object.keys(state.build).length === 0) {
            dom.buildListEl.innerHTML = `<div class="text-center text-gray-400 p-4"><i data-feather="mouse-pointer" class="w-10 h-10 mx-auto mb-2"></i><p class="font-semibold">Sua build está vazia!</p><p class="text-sm">Comece a adicionar componentes.</p></div>`;
            dom.buildFooter.classList.add('hidden');
        } else { dom.buildFooter.classList.remove('hidden'); }
        categoriesOrder.forEach(category => {
            const items = state.build[category] || []; totalItems += items.length;
            if (items.length > 0) {
                items.forEach((product, index) => {
                    const itemHtml = `<div class="flex items-center gap-3 text-sm animate-fade-in"><img src="${product.image}" class="w-10 h-10 rounded object-contain flex-shrink-0 bg-dark-800" onerror="this.onerror=null;this.src='https://placehold.co/40x40/0c0a09/facc15?text=X';"><div class="flex-grow min-w-0"><p class="font-semibold text-white truncate" title="${product.name}">${product.name}</p><p class="text-gray-400">${formatPrice(product.price)}</p></div><button class="remove-from-build-btn text-red-500 hover:text-red-400 flex-shrink-0" data-category="${category}" data-index="${index}"><i data-feather="x-circle" class="w-5 h-5"></i></button></div>`;
                    dom.buildListEl.innerHTML += itemHtml;
                });
            } else if (Object.keys(state.build).length > 0 && categoryLimits[category]) { dom.buildListEl.innerHTML += `<div class="flex items-center gap-3 text-sm opacity-60"><div class="w-10 h-10 rounded bg-dark-800 flex items-center justify-center flex-shrink-0"><i data-feather="plus" class="text-gray-400"></i></div><div class="flex-grow"><p class="text-gray-400">Adicionar ${category}</p></div></div>`; }
        });
        dom.buildTitle.innerHTML = `<i data-feather="shopping-cart" class="text-brand"></i> Minha Build <span class="text-sm text-gray-400">(${totalItems} Itens)</span>`;
        const total = Object.values(state.build).flat().reduce((sum, item) => sum + item.price, 0);
        dom.buildTotalEl.textContent = formatPrice(total);
        dom.buildListEl.querySelectorAll('.remove-from-build-btn').forEach(btn => btn.addEventListener('click', e => { const { category, index } = e.currentTarget.dataset; removeFromBuild(category, parseInt(index)); }));
        checkCompatibility(); checkWattage(); feather.replace();
    }

    // --- BUILD MANAGEMENT & INTELLIGENCE ---
    function addToBuild(product) {
        const category = findProductById(product.id)?.category;
        if (!category) return;
        if (!state.build[category]) state.build[category] = [];
        const limit = categoryLimits[category] || 1;
        if (state.build[category].length >= limit) { showToast(`Limite de ${limit} item(ns) para ${category} atingido.`, 'alert-triangle', 'yellow'); return; }
        const productToAdd = findProductById(product.id);
        if (!productToAdd) return;
        state.build[category].push(productToAdd);
        showToast(`${productToAdd.name} adicionado`, 'check-circle', 'brand');
        saveAndRenderAll();
    }

    function removeFromBuild(category, index) {
        if (!state.build[category] || !state.build[category][index]) return;
        const productName = state.build[category][index].name;
        state.build[category].splice(index, 1);
        if (state.build[category].length === 0) delete state.build[category];
        showToast(`${productName} removido`, 'trash-2', 'red');
        saveAndRenderAll();
    }

    function saveAndRenderAll() { localStorage.setItem('pcBuild', JSON.stringify(state.build)); renderBuild(); }

    function checkCompatibility() {
        const cpu = state.build['CPU']?.[0];
        const mobo = state.build['Placa-Mãe']?.[0];
        const ram = state.build['Memória RAM'] || [];
        const gabinete = state.build['Gabinete']?.[0];

        let issues = [];
        if (cpu && mobo && cpu.specs.Soquete !== mobo.specs.Soquete) issues.push(`Soquete da CPU (${cpu.specs.Soquete}) é incompatível com a Placa-Mãe (${mobo.specs.Soquete}).`);
        if (mobo && ram.length > 0) {
            const moboRamType = mobo.specs.Memória;
            ram.forEach(r => { if (r.specs.Tipo !== moboRamType) issues.push(`A RAM ${r.name} (${r.specs.Tipo}) é incompatível com a Placa-Mãe (${moboRamType}).`); });
        }
        if (mobo && gabinete && mobo.specs.Formato.includes('ATX') && !gabinete.specs.Formatos.includes('ATX')) {
             issues.push(`A Placa-mãe (${mobo.specs.Formato}) pode não caber no gabinete (${gabinete.name}).`);
        }
        if (issues.length > 0) { dom.compatibilityWarningEl.innerHTML = `<i data-feather="alert-triangle" class="w-4 h-4 mr-1 inline-block"></i> ${issues.join('<br>')}`; dom.compatibilityWarningEl.classList.remove('hidden'); }
        else { dom.compatibilityWarningEl.classList.add('hidden'); }
        feather.replace();
        return issues;
    }

    function checkWattage() {
        const psu = state.build['Fonte de Alimentação']?.[0];
        const cpu = state.build['CPU']?.[0];
        const gpu = state.build['Placa de Vídeo']?.[0];
        if (!cpu || !gpu) { dom.wattageCalculatorEl.classList.add('hidden'); return { totalWattage: 0, psuWattage: 0, status: 'ok' }; }
        const totalWattage = (cpu.wattage || 0) + (gpu.wattage || 0) + 100; // 100W for other components
        dom.buildWattageEl.textContent = `${totalWattage}W`;
        if (psu) {
            const psuWattage = parseInt(psu.specs.Potência);
            dom.psuWattageEl.textContent = `${psuWattage}W`;
            const headroom = psuWattage - totalWattage;
            let status = 'ok'; let statusText = 'Ideal'; let statusClass = 'bg-green-800/80 text-green-300';
            if (headroom < 0) { status = 'critical'; statusText = 'INSUFICIENTE'; statusClass = 'bg-red-800/80 text-red-300'; }
            else if (headroom < 100) { status = 'warning'; statusText = 'Apertado'; statusClass = 'bg-yellow-800/80 text-yellow-300'; }
            dom.wattageStatusEl.textContent = statusText;
            dom.wattageStatusEl.className = `text-center p-1 rounded-md font-semibold text-xs ${statusClass}`;
            dom.wattageCalculatorEl.classList.remove('hidden');
            return { totalWattage, psuWattage, status };
        } else { dom.psuWattageEl.textContent = 'N/A'; dom.wattageCalculatorEl.classList.add('hidden'); }
        return { totalWattage, psuWattage: 0, status: 'no_psu' };
    }

    // --- MODAL & ANALYSIS ---
    function getBuildAnalysis() {
        let html = '';
        const build = state.build;
        const required = ['CPU', 'Placa-Mãe', 'Memória RAM', 'Armazenamento SSD', 'Fonte de Alimentação', 'Gabinete'];
        const missing = required.filter(cat => !build[cat] || build[cat].length === 0);

        if (Object.keys(build).length === 0) return '<p>Sua build está vazia. Adicione componentes para receber uma análise.</p>';

        html += '<h4 class="font-bold text-white text-base mb-2">Verificação de Compatibilidade</h4>';
        const issues = checkCompatibility();
        if (issues.length > 0) html += `<ul class="list-disc list-inside space-y-1 text-red-400">${issues.map(i => `<li>${i}</li>`).join('')}</ul>`;
        else html += '<p class="text-green-400 flex items-center gap-2"><i data-feather="check-circle" class="w-4 h-4"></i>Nenhum problema de compatibilidade encontrado.</p>';

        if (missing.length > 0) {
            html += '<h4 class="font-bold text-white text-base mt-4 mb-2">Componentes Essenciais Faltando</h4>';
            html += `<ul class="list-disc list-inside space-y-1 text-yellow-400">${missing.map(m => `<li>${m}</li>`).join('')}</ul>`;
        }

        html += '<h4 class="font-bold text-white text-base mt-4 mb-2">Análise de Energia</h4>';
        const wattageInfo = checkWattage();
        if (wattageInfo.status === 'no_psu') html += '<p class="text-yellow-400">Adicione uma Fonte de Alimentação para calcular o consumo.</p>';
        else if (wattageInfo.status === 'ok') html += `<p class="text-green-400">A fonte de ${wattageInfo.psuWattage}W é excelente para o consumo de ${wattageInfo.totalWattage}W, com boa margem de segurança.</p>`;
        else if (wattageInfo.status === 'warning') html += `<p class="text-yellow-400">A fonte de ${wattageInfo.psuWattage}W é suficiente, mas a margem para o consumo de ${wattageInfo.totalWattage}W é pequena. Considere uma fonte um pouco mais potente para upgrades futuros.</p>`;
        else if (wattageInfo.status === 'critical') html += `<p class="text-red-400"><strong>PERIGO:</strong> A fonte de ${wattageInfo.psuWattage}W é <strong>insuficiente</strong> para o consumo estimado de ${wattageInfo.totalWattage}W. Escolha uma fonte com maior potência.</p>`;

        html += '<h4 class="font-bold text-white text-base mt-4 mb-2">Análise Geral e Sugestões</h4>';
        html += '<ul class="list-disc list-inside space-y-1">';
        const cpu = build['CPU']?.[0];
        const gpu = build['Placa de Vídeo']?.[0];
        if (cpu && gpu) {
            if (cpu.price > gpu.price * 1.8 && gpu.price < 3000) html += '<li>Seu processador é significativamente mais caro que a placa de vídeo. Para jogos, considere investir mais na GPU para melhor performance.</li>';
            if (gpu.price > cpu.price * 2.5 && cpu.price < 2000) html += '<li>Sua placa de vídeo é muito potente para o processador. Você pode ter um "gargalo" de CPU. Considere um upgrade de processador para extrair todo o potencial da GPU.</li>';
        }
        const ssds = build['Armazenamento SSD'] || [];
        if (ssds.length > 0 && !ssds.some(s => s.specs.Interface.includes('NVMe'))) html += '<li>Sua build não possui um SSD NVMe. Considere adicionar um para o sistema operacional, a velocidade de carregamento será muito maior.</li>';
        if (Object.keys(build).length > 3 && !missing.includes('Cooler') && !build['Cooler']) html += '<li>Você não adicionou um cooler customizado. Lembre-se que processadores potentes (especialmente os sem cooler box) precisam de uma boa refrigeração.</li>';
        if (issues.length === 0 && missing.length === 0) html += '<li class="text-gray-300">No geral, uma build bem balanceada e pronta para o uso!</li>';
        html += '</ul>';

        return html;
    }

    function exportBuild() {
        if (Object.keys(state.build).length === 0) { showToast('Sua build está vazia!', 'alert-circle', 'yellow'); return; }

        let buildText = '--- Minha Build (Criada com BuildBay) ---\n\n';
        const categoriesOrder = ['CPU', 'Cooler', 'Placa-Mãe', 'Placa de Vídeo', 'Memória RAM', 'Armazenamento SSD', 'Fonte de Alimentação', 'Gabinete', 'Monitor', 'Teclado', 'Mouse', 'Headset/Microfone'];

        categoriesOrder.forEach(category => {
            const items = state.build[category] || [];
            if (items.length > 0) {
                buildText += `◼ ${category}:\n`;
                items.forEach(item => {
                    buildText += `  - ${item.name} (${formatPrice(item.price)})\n`;
                });
                buildText += '\n';
            }
        });

        const total = Object.values(state.build).flat().reduce((sum, item) => sum + item.price, 0);
        buildText += `====================\n`;
        buildText += `TOTAL: ${formatPrice(total)}\n`;

        navigator.clipboard.writeText(buildText).then(() => {
            showToast('Build copiada para a área de transferência!', 'copy', 'blue');
        }).catch(err => {
            console.error('Erro ao copiar build: ', err);
            showToast('Erro ao copiar a build.', 'x-circle', 'red');
        });
    }

    function showModal(productId, analysisMode = false) {
        dom.modalHeaderContent.style.display = 'block';
        dom.modalMainContent.style.display = 'flex';
        dom.modalAnalysisContent.classList.remove('hidden');

        if(analysisMode) {
            dom.modalTitle.textContent = 'Análise da Sua Build';
            dom.modalHeaderContent.style.display = 'block';
            dom.modalMainContent.style.display = 'none';
            dom.modalAnalysisContent.classList.remove('hidden');
            dom.aiAnalysisOutput.innerHTML = getBuildAnalysis();
        } else {
            dom.modalAnalysisContent.classList.remove('hidden');
            const product = findProductById(productId);
            if (!product) return;

            const parentProduct = product.originalName ? findProductById(product.id.split('_')[0]) : product;

            dom.modalTitle.textContent = product.name;
            dom.modalImage.src = product.image;
            dom.modalBrandLogo.src = brandLogos[product.brand] || '';

            const specs = { ...(parentProduct?.specs || {}), ...product.specs };
            dom.modalSpecs.innerHTML = Object.entries(specs).map(([key, value]) => `<div class="spec-item"><span class="spec-key">${key}</span><span class="spec-value">${value}</span></div>`).join('');

            const prices = product.prices || parentProduct?.prices;
            renderPriceComparison(prices);

            dom.aiAnalysisOutput.innerHTML = product.aiAnalysis ? `<p>${product.aiAnalysis}</p>` : '<p>Nenhuma análise da IA disponível para este produto.</p>';
        }

        openModal();
        feather.replace();
    }

    function openModal() { dom.modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
    function closeModal() { dom.modal.classList.add('hidden'); document.body.style.overflow = ''; }

    function renderPriceComparison(prices) {
        dom.modalPriceComparison.innerHTML = '';
        if (!prices || Object.keys(prices).length === 0) {
            dom.modalPriceComparison.innerHTML = '<p class="text-sm text-gray-400">Não há comparativo de preços para este item.</p>';
            return;
        }

        const priceEntries = Object.entries(prices).filter(([, price]) => price !== null && price > 0);

        if (priceEntries.length === 0) {
            dom.modalPriceComparison.innerHTML = '<p class="text-sm text-gray-400">Preços indisponíveis no momento.</p>';
            return;
        }

        const bestPrice = Math.min(...priceEntries.map(([, price]) => price));
        const lightBgLogos = ['Kabum!', 'Pichau', 'Amazon'];

        let html = '<div class="space-y-2">';
        priceEntries.sort((a, b) => a[1] - b[1]).forEach(([store, price]) => {
            const isBestPrice = price === bestPrice;
            const logoSrc = storeLogos[store] || `https://placehold.co/80x20/27272a/9ca3af?text=${store}`;
            const invertClass = lightBgLogos.includes(store) ? '' : 'brightness-0 invert';

            html += `
                <div class="flex items-center justify-between p-3 rounded-lg transition-colors ${isBestPrice ? 'bg-green-900/50 border border-green-700' : 'bg-dark-800 border border-dark-700'}">
                    <img src="${logoSrc}" alt="${store}" class="h-5 max-w-[80px] object-contain ${invertClass}">
                    <div class="text-right">
                        <p class="font-bold text-lg ${isBestPrice ? 'text-green-300' : 'text-white'}">${formatPrice(price)}</p>
                        ${isBestPrice ? '<span class="text-xs font-semibold text-green-400">Melhor Preço</span>' : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        dom.modalPriceComparison.innerHTML = html;
    }

    function updateClearFiltersButton() {
        const hasDynamicFilters = Object.values(state.dynamicFilters).some(v => v !== 'all');
        const isFiltered = state.selectedBrands.length > 0 || state.searchTerm !== '' || hasDynamicFilters || parseFloat(dom.priceFilter.value) < parseFloat(dom.priceFilter.max);
        dom.clearFiltersBtn.classList.toggle('hidden', !isFiltered);
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        dom.categoryList.addEventListener('click', (e) => {
            e.preventDefault(); const link = e.target.closest('a.category-item'); if (!link) return;
            const newCategory = link.getAttribute('data-category'); if (state.currentCategory === newCategory) return;
            state.currentCategory = newCategory; state.dynamicFilters = {};
            dom.categoryList.querySelectorAll('a.category-item').forEach(a => a.classList.remove('bg-brand/10', 'text-brand', 'font-bold'));
            link.classList.add('bg-brand/10', 'text-brand', 'font-bold');
            renderDynamicFilters(state.currentCategory); applyFiltersAndRender();
        });
        dom.brandFilterEl.addEventListener('change', (e) => { if (e.target.type === 'checkbox') { state.selectedBrands = Array.from(dom.brandFilterEl.querySelectorAll(':checked')).map(cb => cb.value); applyFiltersAndRender(); } });
        dom.dynamicFiltersContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('dynamic-filter-select')) {
                const key = e.target.dataset.filterKey; const value = e.target.value;
                if (value === 'all') delete state.dynamicFilters[key]; else state.dynamicFilters[key] = value;
                applyFiltersAndRender();
            }
        });
        dom.priceFilter.addEventListener('input', (e) => { dom.priceValue.textContent = formatPrice(parseFloat(e.target.value)); });
        dom.priceFilter.addEventListener('change', (e) => { state.maxPrice = parseFloat(e.target.value); applyFiltersAndRender(); });
        dom.searchBar.addEventListener('input', (e) => { state.searchTerm = e.target.value; applyFiltersAndRender(); });
        dom.sortBy.addEventListener('change', (e) => { state.sortBy = e.target.value; applyFiltersAndRender(); });
        dom.closeModalBtn.addEventListener('click', closeModal);
        dom.modal.addEventListener('click', (e) => { if (e.target === dom.modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dom.modal.classList.contains('hidden')) closeModal(); });
        dom.clearBuildBtn.addEventListener('click', () => { if (Object.keys(state.build).length > 0 && confirm('Tem certeza que deseja limpar sua build?')) { state.build = {}; saveAndRenderAll(); showToast('Build limpa com sucesso', 'trash-2', 'red'); } });
        dom.analyzeBuildBtn.addEventListener('click', () => showModal(null, true));
        dom.exportBuildBtn.addEventListener('click', exportBuild);
        dom.clearFiltersBtn.addEventListener('click', resetAllFilters);
    }

    // --- INITIALIZATION ---
    async function initialize() {
        allProducts = await fetchProductsFromAPI();

        if (allProducts.length === 0) {
            console.log("Inicialização interrompida pois nenhum produto foi carregado.");
            return;
        }

        allProducts.forEach(product => {
            if (product.variants) {
                product.variants.forEach(variant => {
                    const fullVariant = { ...product, ...variant, name: variant.name, price: variant.price, id: variant.id, image: variant.image || product.image, prices: variant.prices || product.prices, originalName: product.name };
                    productMap.set(variant.id, fullVariant);
                });
                productMap.set(product.id, product);
            } else {
                productMap.set(product.id, product);
            }
        });
        
        const orderedCategories = ['Todos', 'CPU', 'Cooler', 'Placa-Mãe', 'Placa de Vídeo', 'Memória RAM', 'Armazenamento SSD', 'Fonte de Alimentação', 'Gabinete', 'Monitor', 'Teclado', 'Mouse', 'Headset/Microfone'];
        dom.categoryList.innerHTML = orderedCategories.map(cat => { const initialClass = cat === 'Todos' ? 'bg-brand/10 text-brand font-bold' : 'text-gray-300'; return `<li><a href="#" class="category-item block font-semibold hover:text-brand transition duration-200 px-3 py-2 rounded-lg hover:bg-dark-800 ${initialClass}" data-category="${cat}">${cat}</a></li>`; }).join('');

        const brands = [...new Set(allProducts.map(p => p.brand))].sort();
        dom.brandFilterEl.innerHTML = brands.map(brand => {
            const logoUrl = brandLogos[brand] || 'https://placehold.co/40x40/0c0a09/facc15?text=?'; const brandId = `brand-${brand.replace(/[^a-zA-Z0-9]/g, '')}`;
            return `<div class="flex items-center"><input type="checkbox" id="${brandId}" value="${brand}" class="peer hidden"><label for="${brandId}" class="flex items-center gap-3 cursor-pointer p-2 rounded-md border-2 border-dark-700 w-full transition-colors duration-200 hover:bg-dark-800 peer-checked:bg-brand/10 peer-checked:border-brand"><img src="${logoUrl}" alt="${brand}" class="h-6 w-10 object-contain brightness-0 invert opacity-75 transition-all peer-checked:opacity-100 peer-checked:brightness-100 peer-checked:invert-0"><span class="text-sm font-medium text-gray-300">${brand}</span></label></div>`;
        }).join('');

        const maxPrice = Math.max(...allProducts.flatMap(p => p.variants ? p.variants.map(v => v.price) : [p.price]).filter(Boolean));
        state.maxPrice = Math.ceil(maxPrice / 1000) * 1000;
        dom.priceFilter.max = state.maxPrice; dom.priceFilter.value = state.maxPrice;
        
        setupEventListeners();
        renderBuild();
        renderDynamicFilters(state.currentCategory);
        applyFiltersAndRender();
        feather.replace();
    }
    
    initialize();
});