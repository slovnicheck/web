document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 0. GLOBÁLNÍ PROMĚNNÉ
    // ==========================================
    let animationFrameId; 

    // ==========================================
    // 1. ZÁKLADNÍ UI (Menu, Dark Mode)
    // ==========================================

    const menuToggle = document.querySelector('.menu-toggle');
    const navOverlay = document.querySelector('.nav-overlay');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navOverlay.classList.toggle('active');
            menuToggle.classList.toggle('is-active');
        });
    }

    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    const updateIcon = (isDark) => { 
        if(themeToggleBtn) themeToggleBtn.innerHTML = isDark ? '☀️' : '🌙'; 
    };

    if (savedTheme === 'dark') { 
        body.classList.add('dark-mode'); updateIcon(true); 
    } else if (savedTheme === 'light') { 
        body.classList.add('light-mode'); updateIcon(false); 
    } else if (systemPrefersDark) { 
        updateIcon(true); 
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-mode') || 
                           (!body.classList.contains('light-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
            
            if (isDark) {
                body.classList.remove('dark-mode'); body.classList.add('light-mode');
                localStorage.setItem('theme', 'light'); updateIcon(false);
            } else {
                body.classList.remove('light-mode'); body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark'); updateIcon(true);
            }
        });
    }


    // ==========================================
    // 2. SLOVNÍČEK - INIT
    // ==========================================
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
        initDictionaryApp();
    }

    // ==========================================
    // 2.5 SLOVO DNE - NÁHODNÝ VÝBĚR
    // ==========================================
    const wordOfDayTitle = document.getElementById('word-of-day-title');
    const wordOfDayDesc = document.getElementById('word-of-day-desc');
    
    if (wordOfDayTitle && wordOfDayDesc && typeof dictionaryData !== 'undefined') {
        const allTerms = dictionaryData.terms || [];
        if (allTerms.length > 0) {
            const randomTerm = allTerms[Math.floor(Math.random() * allTerms.length)];
            wordOfDayTitle.textContent = randomTerm.title;
            wordOfDayDesc.textContent = randomTerm.desc;
        }
    }

    // ==========================================
    // 2.6 NEJNOVĚJŠÍ ČLÁNEK - HLAVNÍ STRÁNKA
    // ==========================================
    const latestBlogCard = document.getElementById('latest-blog-card');
    const latestBlogDate = document.getElementById('latest-blog-date');
    const latestBlogTitle = document.getElementById('latest-blog-title');
    
    if (latestBlogCard && latestBlogDate && latestBlogTitle && typeof blogData !== 'undefined' && blogData.length > 0) {
        // Najdi článek s nejvyšším ID (nejnovější)
        const latestArticle = blogData.reduce((prev, current) => 
            (prev.id > current.id) ? prev : current
        );
        
        // Naplň elementy daty
        latestBlogDate.textContent = latestArticle.date;
        latestBlogTitle.textContent = latestArticle.title;
        
        // Nastav pozadí - pokud má článek obrázek, použij ho, jinak použij výchozí
        if (latestArticle.image && latestArticle.image.trim() !== "") {
            latestBlogCard.style.setProperty('--bg-image', `url('${latestArticle.image}')`);
        }
    }

    // ==========================================
    // 3. BLOG - LOGIKA (Hledání + Řazení + Render)
    // ==========================================
    const blogGrid = document.getElementById('blog-grid');
    const infoModal = document.getElementById('info-modal');
    const blogSearchInput = document.getElementById('searchInput');
    const blogSortBtn = document.getElementById('blogSortBtn');
    
    // Stav aplikace pro blog
    let blogState = {
        sort: 'desc', // 'desc' = nejnovější (podle ID), 'asc' = nejstarší
        search: ''
    };

    if (blogGrid && typeof blogData !== 'undefined') {
        
        // 1. Inicializace (první vykreslení)
        filterAndRenderBlog();

        // 2. Event listener pro hledání
        if (blogSearchInput) {
            blogSearchInput.addEventListener('input', (e) => {
                blogState.search = e.target.value.toLowerCase();
                filterAndRenderBlog();
            });
        }

        // 3. Event listener pro řazení
        if (blogSortBtn) {
            blogSortBtn.addEventListener('click', () => {
                // Přepnutí stavu
                blogState.sort = blogState.sort === 'desc' ? 'asc' : 'desc';
                // Změna textu tlačítka
                blogSortBtn.innerHTML = blogState.sort === 'desc' ? '⬇️ Nejnovější' : '⬆️ Nejstarší';
                filterAndRenderBlog();
            });
        }
    }

    // Hlavní funkce pro filtrování a vykreslování
    function filterAndRenderBlog() {
        if (!blogGrid) return;
        
        // A) Filtrování (HLEDÁ V TITULKU, PEREXU, OBSAHU I AUTOROVI)
        let filteredData = blogData.filter(article => {
            const term = blogState.search;
            
            // Očištění obsahu od HTML značek
            const contentText = article.content ? article.content.replace(/<[^>]*>?/gm, '') : '';
            
            // Bezpečné získání autora (pokud chybí, použije prázdný řetězec)
            const author = article.author ? article.author.toLowerCase() : '';

            return article.title.toLowerCase().includes(term) || 
                   article.perex.toLowerCase().includes(term) ||
                   contentText.toLowerCase().includes(term) ||
                   author.includes(term); // <--- TEĎ UŽ JE TO BEZPEČNÉ
        });

        // B) Řazení
        filteredData.sort((a, b) => {
            return blogState.sort === 'desc' ? b.id - a.id : a.id - b.id;
        });

        // C) Vymazání obsahu
        blogGrid.innerHTML = '';

        // D) Vykreslení
        if (filteredData.length === 0) {
            blogGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Nic jsme nenašli 😔</div>';
            return;
        }

        filteredData.forEach(article => {
            const card = document.createElement('div');
            
            // Pokud chcete vzhled jako Slovníček (jen text), použijte třídu 'text-only-card'
            // Pokud chcete obrázky, nechte to takto:
            card.className = 'card blog-item scroll-card span-2'; 
            
            // Řešení obrázku
            let imageHtml;
            if (article.image && article.image.trim() !== "") {
                imageHtml = `<img src="${article.image}" alt="${article.title}" class="blog-image">`;
            } else {
                imageHtml = `
                    <div class="blog-image" style="background: var(--primary-light); display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 2rem;">
                        📄
                    </div>`;
            }

            card.innerHTML = `
                ${imageHtml}
                <span class="date">${article.date}</span>
                <h3>${article.title}</h3>
                <p>${article.perex}</p>
            `;
            
            card.addEventListener('click', () => openBlogModal(infoModal, article));
            blogGrid.appendChild(card);
        });

        // Restart animací
        startFluidAnimation();
    }

    // ==========================================
    // 4. MATERIÁLY & HRY - INIT & RENDER
    // ==========================================
    
    // Funkce pro vykreslení her nebo materiálů (mají stejnou logiku)
    function renderGenericGrid(gridId, modalId, dataArray) {
        const grid = document.getElementById(gridId);
        const modal = document.getElementById(modalId);

        if (grid && typeof dataArray !== 'undefined') {
            dataArray.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card blog-item scroll-card span-2'; 
                
                // Karta v mřížce: Obrázek, Titulek, Popis (perex)
                card.innerHTML = `
                    <img src="${item.image}" alt="${item.title}" class="blog-image">
                    <h3>${item.title}</h3>
                    <p>${item.perex}</p>
                `;
                
                // Voláme specifickou funkci pro MATERIÁLY/HRY
                card.addEventListener('click', () => openMaterialModal(modal, item));
                grid.appendChild(card);
            });
        }
    }

    // Spuštění pro Materiály
    renderGenericGrid('materials-grid', 'material-modal', typeof materialsData !== 'undefined' ? materialsData : undefined);
    
    // Spuštění pro Hry
    renderGenericGrid('games-grid', 'game-modal', typeof gamesData !== 'undefined' ? gamesData : undefined);


    // ==========================================
    // 5. MODÁLNÍ OKNA - SPECIFICKÉ FUNKCE
    // ==========================================
    
    // A) LOGIKA PRO BLOG (datum | autor, titulek, perex, text – bez obrázku v okně)
    function openBlogModal(modalEl, data) {
        if (!modalEl) return;
        
        const metaEl = modalEl.querySelector('#modal-meta');
        const titleEl = modalEl.querySelector('#modal-title');
        const perexEl = modalEl.querySelector('#modal-perex');
        const imgWrapper = modalEl.querySelector('.modal-image-wrapper');
        const bodyEl = modalEl.querySelector('#modal-body');

        const authorName = data.author ? data.author : 'Redakce';
        if (metaEl) metaEl.textContent = `${data.date} | ${authorName}`;
        if (titleEl) titleEl.textContent = data.title;
        if (perexEl) {
            perexEl.textContent = data.perex || '';
            perexEl.style.display = data.perex ? 'block' : 'none';
        }
        if (imgWrapper) imgWrapper.style.display = 'none'; // v blogu v okně obrázek nezobrazujeme
        if (bodyEl) bodyEl.innerHTML = data.content || '';
        
        showModal(modalEl);
    }

    // B) LOGIKA PRO MATERIÁLY/HRY (Název, Volitelný obrázek, Text)
    function openMaterialModal(modalEl, data) {
        if (!modalEl) return;
        
        const titleEl = modalEl.querySelector('#modal-title');
        const imgEl = modalEl.querySelector('#modal-image');
        const bodyEl = modalEl.querySelector('#modal-body');

        if (titleEl) titleEl.innerText = data.title;

        // Obrázek je volitelný - pokud chybí nebo je prázdný, skryjeme ho
        if (imgEl) {
            if (data.image && data.image.trim() !== "") {
                imgEl.src = data.image;
                imgEl.style.display = 'block';
                imgEl.parentElement.style.display = 'block'; // Zobrazit wrapper
            } else {
                imgEl.style.display = 'none';
                imgEl.parentElement.style.display = 'none'; // Skrýt wrapper, aby nezabíral místo
            }
        }

        // Obsah
        if (bodyEl) {
            bodyEl.innerHTML = (data.content || '');
        }
        
        showModal(modalEl);
    }

    // Společná funkce pro zobrazení a zavření
    function showModal(modalEl) {
        modalEl.classList.add('active');
        document.body.classList.add('no-scroll');
        
        // Reset scrollu
        const content = modalEl.querySelector('.modal-content');
        if(content) content.scrollTop = 0;

        setupModalClose(modalEl);
    }

    function setupModalClose(modalEl) {
        const closeBtn = modalEl.querySelector('.close-modal');
        
        const close = () => {
            modalEl.classList.remove('active');
            document.body.classList.remove('no-scroll');
        };

        if (closeBtn) closeBtn.onclick = close;
        modalEl.onclick = (e) => { if (e.target === modalEl) close(); };
        document.onkeydown = (e) => { if (e.key === 'Escape' && modalEl.classList.contains('active')) close(); };
    }


    // ==========================================
    // 6. TEAM CAROUSEL - O NÁS STRÁNKA
    // ==========================================
    initTeamCarousel();

    // ==========================================
    // 7. SPUŠTĚNÍ ANIMACÍ
    // ==========================================
    startFluidAnimation();
    window.addEventListener('resize', startFluidAnimation);


    // ==========================================
    // DEFINICE FUNKCÍ (Slovníček, Animace, Carousel)
    // ==========================================

    function initTeamCarousel() {
        const carousel = document.getElementById('teamCarousel');
        if (!carousel) return; // Carousel není na stránce

        const track = document.getElementById('carouselTrack');
        const viewport = carousel.querySelector('.carousel-viewport');
        const slides = document.querySelectorAll('.carousel-slide');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        const dotsContainer = document.getElementById('carouselDots');

        if (!track || slides.length === 0 || !viewport) return;

        let currentIndex = 0;
        const slideWidth = 34.2; // Šířka jednoho slidu v procentech (nastaveno v CSS)
        
        // Autoplay nastavení
        let autoplayTimeout;
        const autoplayDelay = 5000; // 5 sekund bez aktivity

        // Určit počet viditelných slidů na základě šířky viewportu
        function getVisibleSlides() {
            const viewportWidth = viewport.offsetWidth;
            const slideElement = slides[0];
            if (!slideElement) return 1;
            
            const slideWidth = slideElement.offsetWidth;
            const visible = Math.max(1, Math.round(viewportWidth / slideWidth));
            return Math.min(visible, slides.length);
        }

        let visibleSlides = getVisibleSlides();

        // Vytvoření teček - počet = počet slidů - viditelné slidy + 1
        function createDots() {
            if (!dotsContainer) return;
            
            dotsContainer.innerHTML = '';
            visibleSlides = getVisibleSlides();
            const numDots = Math.max(1, slides.length - visibleSlides + 1);
            
            for (let i = 0; i < numDots; i++) {
                const dot = document.createElement('button');
                dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
                dot.setAttribute('aria-label', `Slide ${i + 1}`);
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            }
        }

        function updateCarousel() {
            // Posun tracku po celých blocích
            const offset = -currentIndex * slideWidth;
            track.style.transform = `translateX(${offset}%)`;

            // Aktualizace teček
            const numDots = Math.max(1, slides.length - visibleSlides + 1);
            document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        }

        function resetAutoplay() {
            clearTimeout(autoplayTimeout);
            if (carousel.offsetParent !== null) { // Jen pokud je viditelný
                autoplayTimeout = setTimeout(() => {
                    nextSlide();
                }, autoplayDelay);
            }
        }

        function goToSlide(index) {
            visibleSlides = getVisibleSlides();
            const numDots = Math.max(1, slides.length - visibleSlides + 1);
            currentIndex = Math.max(0, Math.min(index, numDots - 1));
            updateCarousel();
            resetAutoplay();
        }

        function nextSlide() {
            visibleSlides = getVisibleSlides();
            const numDots = Math.max(1, slides.length - visibleSlides + 1);
            currentIndex = (currentIndex + 1) % numDots;
            updateCarousel();
            resetAutoplay();
        }

        function prevSlide() {
            visibleSlides = getVisibleSlides();
            const numDots = Math.max(1, slides.length - visibleSlides + 1);
            currentIndex = (currentIndex - 1 + numDots) % numDots;
            updateCarousel();
            resetAutoplay();
        }

        // Event listenery na tlačítka
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);

        // Klávesnice - šipky doleva/doprava
        document.addEventListener('keydown', (e) => {
            if (carousel.offsetParent === null) return;
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        });

        // Swipe pro mobilní zařízení
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            resetAutoplay();
        });

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) nextSlide();
            if (touchEndX - touchStartX > 50) prevSlide();
        });

        // Reaction na změnu okna
        window.addEventListener('resize', () => {
            createDots();
            updateCarousel();
        });

        // Iniciální vykreslení a spuštění autoplay
        createDots();
        updateCarousel();
        resetAutoplay();
    }

    // ==========================================
    // DEFINICE FUNKCÍ (Slovníček, Animace)
    // ==========================================

    function initDictionaryApp() {
        const alphabetContainer = document.getElementById('alphabetContainer');
        const searchInput = document.getElementById('searchInput');
        const modeBtns = document.querySelectorAll('.mode-btn');
        const resetBtn = document.getElementById('resetFilters');
        const modeHighlight = document.querySelector('.mode-highlight');

        let currentMode = 'terms';
        let currentSearch = '';
        let activeLetter = null;

        renderAlphabet();
        renderContent();

        function getGroupLetter(title) {
            if (!title) return '#';
            const lower = title.toLowerCase();
            if (lower.startsWith('ch')) return 'CH';
            return title.charAt(0).toUpperCase();
        }

        modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentMode = e.target.dataset.mode;
                modeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                if (modeHighlight) {
                    modeHighlight.style.transform = currentMode === 'terms' ? 'translateX(0%)' : 'translateX(100%)';
                }
                activeLetter = null;
                currentSearch = '';
                if (searchInput) searchInput.value = '';
                renderAlphabet();
                renderContent();
            });
        });

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearch = e.target.value.toLowerCase();
                activeLetter = null; 
                renderAlphabet();
                renderContent();
            });
        }

        function handleLetterClick(letter) {
            if (activeLetter === letter) {
                activeLetter = null; 
            } else {
                activeLetter = letter;
                if (searchInput) searchInput.value = ''; 
                currentSearch = '';
            }
            renderAlphabet();
            renderContent();
            if (activeLetter) {
                const firstElement = document.querySelector('.letter-system');
                if (firstElement) {
                    firstElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }

        function renderAlphabet() {
            if (!alphabetContainer) return;
            alphabetContainer.innerHTML = '';
            
            const alphabet = [
                'A', 'B', 'C', 'Č', 'D', 'E', 'F', 'G', 'H', 'CH', 'I', 'J', 'K', 'L', 'M', 
                'N', 'O', 'P', 'Q', 'R', 'Ř', 'S', 'Š', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ž'
            ];
            
            const data = dictionaryData[currentMode];
            const availableLetters = new Set();
            
            data.forEach(item => {
                availableLetters.add(getGroupLetter(item.title));
            });

            alphabet.forEach(char => {
                const btn = document.createElement('button');
                btn.className = 'letter-btn';
                btn.innerText = char;
                if (!availableLetters.has(char)) btn.disabled = true;
                if (activeLetter === char) btn.classList.add('active');
                btn.addEventListener('click', () => handleLetterClick(char));
                alphabetContainer.appendChild(btn);
            });

            if (resetBtn) {
                resetBtn.style.display = (activeLetter || currentSearch) ? 'block' : 'none';
                resetBtn.onclick = () => {
                    activeLetter = null;
                    currentSearch = '';
                    searchInput.value = '';
                    renderAlphabet();
                    renderContent();
                };
            }
        }

        function renderContent() {
            contentArea.innerHTML = '';
            const data = dictionaryData[currentMode];
            
            const filteredData = data.filter(item => {
                const matchesSearch = item.title.toLowerCase().includes(currentSearch) || 
                                      item.desc.toLowerCase().includes(currentSearch);
                let matchesLetter = true;
                if (activeLetter) {
                    matchesLetter = (getGroupLetter(item.title) === activeLetter);
                }
                return matchesSearch && matchesLetter;
            });

            if (filteredData.length === 0) {
                contentArea.innerHTML = '<div style="text-align:center; padding: 100px 20px; color: var(--text-muted); font-size: 1.2rem;">Pro tento výraz jsme nic nenašli 😔</div>';
                return;
            }

            const grouped = {};
            filteredData.forEach(item => {
                const group = getGroupLetter(item.title);
                if (!grouped[group]) grouped[group] = [];
                grouped[group].push(item);
            });

            Object.keys(grouped)
                .sort((a, b) => a.localeCompare(b, 'cs')) 
                .forEach(groupKey => {
                
                const system = document.createElement('div');
                system.className = 'letter-system';
                if (activeLetter) system.classList.add('focused'); 

                const sun = document.createElement('div');
                sun.className = 'letter-sun';
                sun.innerText = groupKey;
                system.appendChild(sun);

                const orbit = document.createElement('div');
                orbit.className = 'terms-orbit';

                const sortedTerms = grouped[groupKey].sort((a, b) => a.title.localeCompare(b.title, 'cs'));

                sortedTerms.forEach(term => {
                    const blob = document.createElement('div');
                    blob.className = `term-blob scroll-card ${currentMode === 'fallacies' ? 'fallacy' : ''}`;
                    blob.innerHTML = `
                        <h3>${term.title}</h3>
                        <p>${term.desc}</p>
                    `;
                    orbit.appendChild(blob);
                });

                system.appendChild(orbit);
                contentArea.appendChild(system);
            });
            
            startFluidAnimation();
        }
    }

    function startFluidAnimation() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        const cards = document.querySelectorAll('.scroll-card');
        const isMobile = window.innerWidth < 768;
        const windowHeight = window.innerHeight;
        const centerLine = windowHeight / 2;
        const lerp = (start, end, factor) => start + (end - start) * factor;

        cards.forEach(card => {
            if (!card.renderState) {
                card.renderState = { scale: 0.9, opacity: 0, y: 50 };
            }
        });
        
        function animate() {
            cards.forEach(card => {
                if (!card.isConnected) return;
                if (!card.renderState) card.renderState = { scale: 0.9, opacity: 0, y: 0 };

                const rect = card.getBoundingClientRect();
                
                if (rect.bottom < -50 || rect.top > windowHeight + 50) return;

                const elementCenter = rect.top + (rect.height / 2);
                const distance = Math.abs(centerLine - elementCenter);
                const maxDistance = windowHeight / 1.5; 
                
                let targetScale = 1;
                let targetOpacity = 1;
                let targetY = 0;
                let targetZIndex = 1;

                if (distance < maxDistance) {
                    const factor = distance / maxDistance;
                    const smoothFactor = Math.cos(factor * (Math.PI / 2)); 
                    
                    const minScale = isMobile ? 0.95 : 0.85; 
                    const minOpacity = isMobile ? 0.8 : 0.4;
                    
                    targetScale = minScale + (smoothFactor * (1 - minScale));
                    targetOpacity = minOpacity + (smoothFactor * (1 - minOpacity));
                    targetY = 0; 
                } else {
                    targetScale = isMobile ? 0.95 : 0.85;
                    targetOpacity = isMobile ? 0.8 : 0.4;
                }

                if (!isMobile && card.matches(':hover')) {
                    targetScale = 1.02; 
                    targetOpacity = 1;  
                    targetY = -12; 
                    targetZIndex = 100; 
                }

                card.renderState.scale = lerp(card.renderState.scale, targetScale, 0.1);
                card.renderState.opacity = lerp(card.renderState.opacity, targetOpacity, 0.1);
                card.renderState.y = lerp(card.renderState.y, targetY, 0.2); 

                card.style.zIndex = targetZIndex;
                card.style.transform = `translate3d(0, ${card.renderState.y}px, 0) scale(${card.renderState.scale})`;
                card.style.opacity = card.renderState.opacity;
            });

            animationFrameId = requestAnimationFrame(animate);
        }

        animate();
    }
});