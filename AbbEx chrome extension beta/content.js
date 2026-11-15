//sidebar containers
const sidebar = document.createElement('div');
sidebar.id = 'pubmed-abbrev-sidebar';

const header = document.createElement('div');
header.className = 'sidebar-header';

const title = document.createElement('h2');
title.innerText = 'Abbreviated Terms';
header.appendChild(title);

const searchInput = document.createElement('input');
searchInput.id = 'pubmed-search';
searchInput.type = 'text';
searchInput.placeholder = 'Search terms...';
header.appendChild(searchInput);

sidebar.appendChild(header);

//terms list
const listContainer = document.createElement('div');
listContainer.className = 'list-container';
sidebar.appendChild(listContainer);

//yup get in there buddy
document.body.appendChild(sidebar);

//search filter
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const items = listContainer.querySelectorAll('.abbrev-item');
    
    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        if (text.includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
});


//i hate regex im finna dirk my shi smooth if this doesnt work
function extractAbbreviations() {
    const text = document.body.innerText;
    const regex = /((?:[\p{L}\p{N}\-]+\s+){1,10})\(\s*([\p{L}\p{N}\-]{2,10}s?)\s*\)/gu;
    const matches = [...text.matchAll(regex)];
    const abbreviationsMap = {};

    matches.forEach(match => {
        const prefixStr = match[1].trim(); 
        const rawAbbrev = match[2]; 
        
        const cleanAbbrev = rawAbbrev.endsWith('s') ? rawAbbrev.slice(0, -1) : rawAbbrev;
        
        //citations kept ending up in the list because the year is put in parenthesis so omit entries unless they contain at least 1 letter
        if (!/[\p{L}]/u.test(cleanAbbrev)) {
            return;
        }
        
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

//build it
function updateSidebar() {
    const abbreviations = extractAbbreviations();
    
    //clear the old list first
    listContainer.innerHTML = '';

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
}

//run it boom
updateSidebar();

//with sites like sciencedirect the sidebar builds before the text fully loads so you need to keep updating the list when new text appears
let typingTimer; 
const waitTime = 1000; //wait 1 second after the page stops changing

const observer = new MutationObserver((mutations) => {
    //clear the timer every time a page mutation is detected
    clearTimeout(typingTimer);
    
    //update the sidebar if 1 second passes and the page doesnt mutate (assume that this is when everything is loaded)
    typingTimer = setTimeout(() => {
        updateSidebar();
    }, waitTime);
});

//tell observer to watch the entire body of the webpage for newly added elements
observer.observe(document.body, {
    childList: true,
    subtree: true
});