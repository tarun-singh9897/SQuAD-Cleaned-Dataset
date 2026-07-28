document.addEventListener('DOMContentLoaded', () => {
    let squadData = [];
    let filteredData = [];
    
    const ITEMS_PER_PAGE = 20;
    let currentPage = 1;

    // DOM Elements
    const cardsContainer = document.getElementById('cardsContainer');
    const searchInput = document.getElementById('searchInput');
    const resultsCount = document.getElementById('resultsCount');
    
    // Pagination Elements
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageSpan = document.getElementById('currentPage');
    const totalSpan = document.getElementById('totalPages');
    
    const prevBtnBottom = document.getElementById('prevBtnBottom');
    const nextBtnBottom = document.getElementById('nextBtnBottom');
    const pageSpanBottom = document.getElementById('currentPageBottom');
    const totalSpanBottom = document.getElementById('totalPagesBottom');

    async function init() {
        try {
            const response = await fetch('squad_dev_qa.json');
            if (!response.ok) throw new Error('Network response was not ok');
            squadData = await response.json();
            filteredData = squadData;
            renderPage();
            setupEventListeners();
        } catch (error) {
            cardsContainer.innerHTML = `
                <div style="text-align: center; padding: 4rem; color: #ef4444;">
                    <h3>Error loading dataset</h3>
                    <p>Could not fetch squad_dev_qa.json. Please try again later.</p>
                </div>
            `;
            console.error("Failed to load dataset:", error);
        }
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                filteredData = squadData;
            } else {
                filteredData = squadData.filter(item => 
                    item.Question.toLowerCase().includes(query) || 
                    item.Answer.toLowerCase().includes(query) || 
                    item.Context.toLowerCase().includes(query)
                );
            }
            currentPage = 1;
            renderPage();
        }, 300));

        [prevBtn, prevBtnBottom].forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderPage();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });

        [nextBtn, nextBtnBottom].forEach(btn => {
            btn.addEventListener('click', () => {
                const maxPage = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
                if (currentPage < maxPage) {
                    currentPage++;
                    renderPage();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    function renderPage() {
        const totalItems = filteredData.length;
        const maxPage = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
        
        // Update Stats
        resultsCount.textContent = `Showing ${totalItems.toLocaleString()} Q&A pairs`;
        
        // Update Pagination UI
        const isPrevDisabled = currentPage === 1;
        const isNextDisabled = currentPage === maxPage;

        [prevBtn, prevBtnBottom].forEach(btn => btn.disabled = isPrevDisabled);
        [nextBtn, nextBtnBottom].forEach(btn => btn.disabled = isNextDisabled);
        
        [pageSpan, pageSpanBottom].forEach(span => span.textContent = currentPage);
        [totalSpan, totalSpanBottom].forEach(span => span.textContent = maxPage);

        // Render Cards
        cardsContainer.innerHTML = '';
        
        if (totalItems === 0) {
            cardsContainer.innerHTML = `
                <div style="text-align: center; padding: 4rem; color: var(--text-secondary);">
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms</p>
                </div>
            `;
            return;
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageData = filteredData.slice(startIndex, endIndex);

        const fragment = document.createDocumentFragment();
        
        pageData.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'qa-card';
            card.style.animationDelay = `${index * 0.05}s`;
            
            // Highlight the exact answer within the context
            let highlightedContext = item.Context;
            if (item.Answer) {
                // Escape regex special characters in the answer just in case
                const safeAnswer = item.Answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${safeAnswer})`, 'gi');
                highlightedContext = item.Context.replace(regex, '<span class="highlight">$1</span>');
            }

            card.innerHTML = `
                <div class="qa-header">
                    <div class="q-icon">Q</div>
                    <div class="question-text">${escapeHTML(item.Question)}</div>
                </div>
                
                <div class="answer-section">
                    <div class="answer-label">Answer</div>
                    <div class="answer-text">${escapeHTML(item.Answer)}</div>
                </div>

                <div class="context-section">
                    <div class="context-label">Context Passage</div>
                    <div class="context-text">${highlightedContext}</div>
                </div>
            `;
            
            fragment.appendChild(card);
        });

        cardsContainer.appendChild(fragment);
    }

    // Utility: Debounce for search
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Utility: HTML Escaper to prevent XSS (if dataset had any weird tags)
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Start App
    init();
});
