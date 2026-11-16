//if the sidebar already exists, don't run again
if (!document.getElementById('pubmed-abbrev-sidebar')) {

    //sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'pubmed-abbrev-sidebar';

    const header = document.createElement('div');
    header.className = 'sidebar-header';

    const title = document.createElement('h2');
    title.innerText = 'Abbreviations';
    header.appendChild(title);

    const searchInput = document.createElement('input');
    searchInput.id = 'pubmed-search';
    searchInput.type = 'text';
    searchInput.placeholder = 'Search terms...';
    header.appendChild(searchInput);

    sidebar.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.className = 'list-container';
    sidebar.appendChild(listContainer);

    document.body.appendChild(sidebar);

    //search
    function applySearchFilter() {
        const query = searchInput.value.toLowerCase();
        const items = listContainer.querySelectorAll('.abbrev-item');
        
        items.forEach(item => {
            const text = item.innerText.toLowerCase();
            item.style.display = text.includes(query) ? 'block' : 'none';
        });
    }

    searchInput.addEventListener('input', applySearchFilter);

    //regex finna blow my shi smooth if this doesnt work
    function extractAbbreviations() {
        const text = document.body.innerText;
        const regex = /((?:[\p{L}\p{N}\-]+\s+){1,10})\(\s*([\p{L}\p{N}\-]{2,10}s?)\s*\)/gu;
        const matches = [...text.matchAll(regex)];
        const abbreviationsMap = {};

        matches.forEach(match => {
            const prefixStr = match[1].trim(); 
            const rawAbbrev = match[2]; 
            const cleanAbbrev = rawAbbrev.endsWith('s') ? rawAbbrev.slice(0, -1) : rawAbbrev;
            
            if (!/[\p{L}]/u.test(cleanAbbrev)) return;
            
            const abbrevLength = cleanAbbrev.length;
            const firstLetter = cleanAbbrev[0].toLowerCase();
            const words = prefixStr.split(/\s+/);
            const windowSize = Math.min(words.length, abbrevLength + 3);
            const searchWindow = words.slice(-windowSize);
            
            let startIndex = -1;
            for (let i = 0; i < searchWindow.length; i++) {
                const cleanWord = searchWindow[i].replace(/^[^a-z0-9α-ω\p{L}]/iu, '').toLowerCase();
                if (cleanWord.startsWith(firstLetter)) {
                    startIndex = i;
                    break;
                }
            }

            if (startIndex !== -1) {
                const fullTerm = searchWindow.slice(startIndex).join(' ');
                if (fullTerm.length > 3 && !abbreviationsMap[rawAbbrev]) {
                    abbreviationsMap[rawAbbrev] = fullTerm;
                }
            }
        });

        return Object.keys(abbreviationsMap).sort().map(short => {
            return { short: short, full: abbreviationsMap[short] };
        });
    }

    //sidebar updating
    function updateSidebar() {
        const abbreviations = extractAbbreviations();
        listContainer.innerHTML = ''; //clear old list

        abbreviations.forEach(item => {
            const entry = document.createElement('div');
            entry.className = 'abbrev-item';
            entry.innerHTML = `<span class="abbrev-short">${item.short}</span><br>${item.full}`;
            
            entry.addEventListener('click', () => {
                window.getSelection().removeAllRanges();
                let found = window.find(`${item.full} (${item.short})`, false, false, true);
                if (!found) found = window.find(`(${item.short})`, false, false, true);
                if (!found) window.find(item.short, false, false, true);
            });
            
            listContainer.appendChild(entry);
        });

        applySearchFilter();
    }

    updateSidebar();

    //mutation observer because some websites load in slow asl like sciencedirect
    let typingTimer;
    const waitTime = 1000;

    const observer = new MutationObserver((mutations) => {
        //this is to stop infinite updates because of sidebar mutations
        const isOnlySidebar = mutations.every(m => sidebar.contains(m.target));
        if (isOnlySidebar) return;

        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            updateSidebar();
        }, waitTime);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

}
