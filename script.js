let removedMods = [];
let addedMods = [];

function addRemovedMod() {
    const input = document.getElementById('removed-input');
    const name = input.value.trim();
    
    if (name) {
        removedMods.push(name);
        input.value = '';
        renderRemovedMods();
        saveState();
    }
}

function removeRemovedMod(index) {
    removedMods.splice(index, 1);
    renderRemovedMods();
    saveState();
}

function renderRemovedMods() {
    const list = document.getElementById('removed-list');
    list.innerHTML = '';
    
    removedMods.forEach((mod, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="mod-info">
                <span class="mod-name">${mod}</span>
            </div>
            <button class="remove-item-btn" onclick="removeRemovedMod(${index})"><i class="fa-solid fa-xmark"></i></button>
        `;
        list.appendChild(li);
    });
}

function addAddedMod() {
    const nameInput = document.getElementById('added-name-input');
    const linkInput = document.getElementById('added-link-input');
    
    const name = nameInput.value.trim();
    let link = linkInput.value.trim();
    
    if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
    }
    
    if (name) {
        addedMods.push({ name, link });
        nameInput.value = '';
        linkInput.value = '';
        renderAddedMods();
        saveState();
    }
}

function removeAddedMod(index) {
    addedMods.splice(index, 1);
    renderAddedMods();
    saveState();
}

function renderAddedMods() {
    const list = document.getElementById('added-list');
    list.innerHTML = '';
    
    addedMods.forEach((mod, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="mod-info">
                <span class="mod-name">${mod.name}</span>
                ${mod.link ? `<span class="mod-link">${mod.link}</span>` : ''}
            </div>
            <button class="remove-item-btn" onclick="removeAddedMod(${index})"><i class="fa-solid fa-xmark"></i></button>
        `;
        list.appendChild(li);
    });
}

// Allow Enter key to add items
document.getElementById('removed-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addRemovedMod();
    }
});

document.getElementById('added-link-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addAddedMod();
    }
});
document.getElementById('added-name-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('added-link-input').focus();
    }
});

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    if (isError) {
        toast.classList.add('error');
    } else {
        toast.classList.remove('error');
    }
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

async function sendToDiscord() {
    const version = document.getElementById('version').value.trim();
    let mention = document.getElementById('mention').value.trim();
    const description = document.getElementById('description').value.trim();
    let packLink = document.getElementById('pack-link').value.trim();
    const webhookUrl = document.getElementById('webhook-url').value.trim();
    
    // Se a pessoa digitou só números pro Cargo, formata como Discord exige <@&ID>
    if (/^\d+$/.test(mention)) {
        mention = `<@&${mention}>`;
    }
    
    if (packLink && !packLink.startsWith('http://') && !packLink.startsWith('https://')) {
        packLink = 'https://' + packLink;
    }
    
    if (!version || !packLink || !webhookUrl) {
        showToast("Preencha os campos obrigatórios (Versão, Link do Pack e Webhook)", true);
        return;
    }

    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        showToast("URL Inválida! O link deve começar com https://discord.com/api/webhooks/...", true);
        return;
    }

    const btn = document.getElementById('send-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

    // Construct the Embed
    const embed = {
        title: `✨ Nova Atualização do Modpack: ${version}`,
        description: `${description ? `*${description}*` : "*Uma nova versão do nosso modpack acaba de ser lançada!*"}\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`,
        color: 3066993, // Verde vibrante (#2ecc71)
        fields: [],
        footer: {
            text: "Modpack Updater Automático",
            icon_url: "https://cdn-icons-png.flaticon.com/512/873/873133.png" // Ícone de engrenagem
        },
        timestamp: new Date().toISOString()
    };

    if (addedMods.length > 0) {
        let addedText = addedMods.map(mod => {
            if (mod.link) return `> 🟩 [**${mod.name}**](${mod.link})`;
            return `> 🟩 **${mod.name}**`;
        }).join('\n');
        
        embed.fields.push({
            name: "➕ **MODS ADICIONADOS**",
            value: addedText + "\n\u200B", // Espaço extra
            inline: false
        });
    }

    if (removedMods.length > 0) {
        let removedText = removedMods.map(mod => `> 🟥 ~~*${mod}*~~`).join('\n');
        
        embed.fields.push({
            name: "➖ **MODS REMOVIDOS**",
            value: removedText + "\n\u200B", // Espaço extra
            inline: false
        });
    }

    embed.fields.push({
        name: "📦 **DOWNLOAD DO MODPACK**",
        value: `> 🔗 **[Clique aqui para Baixar a Versão Atualizada](${packLink})**`,
        inline: false
    });

    const payload = {
        content: mention || null,
        embeds: [embed]
    };

    // Logging logic
    const debugContainer = document.getElementById('debug-container');
    const debugLog = document.getElementById('debug-log');
    debugContainer.style.display = 'block';
    
    function logMsg(msg) {
        debugLog.innerText += new Date().toLocaleTimeString() + " - " + msg + "\n";
    }

    logMsg("Iniciando envio para: " + webhookUrl.substring(0, 40) + "...");
    logMsg("Payload gerado: " + JSON.stringify(payload).substring(0, 100) + "...");

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        logMsg("Resposta do Discord: Status " + response.status + " " + response.statusText);

        if (response.ok) {
            showToast("Anúncio enviado com sucesso para o Discord!");
            logMsg("Sucesso! O Discord aceitou a mensagem (código 204 significa sucesso sem retorno de corpo).");
        } else {
            const err = await response.text();
            console.error("Webhook Error:", err);
            showToast("Erro ao enviar! Verifique a URL do Webhook.", true);
            logMsg("Erro retornado pelo Discord: " + err);
        }
    } catch (error) {
        console.error("Network Error:", error);
        showToast("Erro de conexão ao enviar a mensagem.", true);
        logMsg("Erro de Conexão (CORS ou Internet): " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Anúncio para o Discord';
    }
}

// ==========================================
// AUTO-SAVE EM LOCALSTORAGE
// ==========================================

const inputsToSave = ['version', 'mention', 'description', 'pack-link', 'webhook-url'];

function saveState() {
    const state = {
        version: document.getElementById('version').value,
        mention: document.getElementById('mention').value,
        description: document.getElementById('description').value,
        packLink: document.getElementById('pack-link').value,
        webhookUrl: document.getElementById('webhook-url').value,
        removedMods: removedMods,
        addedMods: addedMods
    };
    localStorage.setItem('modpackState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('modpackState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            document.getElementById('version').value = state.version || '';
            document.getElementById('mention').value = state.mention || '';
            document.getElementById('description').value = state.description || '';
            document.getElementById('pack-link').value = state.packLink || '';
            document.getElementById('webhook-url').value = state.webhookUrl || '';
            
            if (state.removedMods) removedMods = state.removedMods;
            if (state.addedMods) addedMods = state.addedMods;
            
            renderRemovedMods();
            renderAddedMods();
        } catch (e) {
            console.error("Erro ao carregar o estado:", e);
        }
    }
}

// ==========================================
// SECRET ADMIN SYSTEM
// ==========================================
let secretClicks = 0;
document.getElementById('secret-logo').addEventListener('click', () => {
    secretClicks++;
    if (secretClicks >= 5) {
        secretClicks = 0;
        if (localStorage.getItem('isAdmin') !== 'true') {
            const pwd = prompt("Senha do Admin:");
            if (pwd === "blaze") { // Senha secreta
                localStorage.setItem('isAdmin', 'true');
                unlockAdmin();
                showToast("Modo Admin Desbloqueado!");
            } else {
                showToast("Senha incorreta!", true);
            }
        } else {
            // Se já for admin e clicar 5x, ele desloga
            if(confirm("Deseja sair do Modo Admin?")) {
                localStorage.removeItem('isAdmin');
                unlockAdmin();
                showToast("Modo Admin Bloqueado.");
            }
        }
    }
});

function unlockAdmin() {
    const isAd = localStorage.getItem('isAdmin') === 'true';
    document.getElementById('tab-announcer').style.display = isAd ? 'flex' : 'none';
    document.querySelector('.admin-panel').style.display = isAd ? 'block' : 'none';
    
    // Se bloqueou o admin enquanto estava na aba anunciador, joga pro comparador
    if (!isAd && document.getElementById('tab-announcer').classList.contains('active')) {
        switchTab('comparator');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    unlockAdmin();
    inputsToSave.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', saveState);
    });
});

// ==========================================
// TABS & COMPARATOR LOGIC
// ==========================================

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-content').forEach(view => view.style.display = 'none');
    
    document.getElementById('tab-' + tabId).classList.add('active');
    document.getElementById(tabId + '-view').style.display = 'block';
}

function updateFolderName(type) {
    const input = document.getElementById(type + '-folder');
    const label = document.getElementById(type + '-folder-name');
    
    if (input.files && input.files.length > 0) {
        const fileCount = Array.from(input.files).filter(f => f.name.endsWith('.jar')).length;
        // get parent folder name from first file
        const folderName = input.files[0].webkitRelativePath.split('/')[0];
        label.innerText = `Pasta "${folderName}" (${fileCount} mods .jar)`;
    } else {
        label.innerText = 'Nenhuma pasta selecionada';
    }
}

async function generateCode() {
    const input = document.getElementById('admin-folder');
    if (!input.files || input.files.length === 0) {
        showToast("Selecione a sua pasta de mods primeiro!", true);
        return;
    }

    const files = Array.from(input.files)
        .filter(f => f.name.endsWith('.jar'))
        .map(f => f.name);

    if (files.length === 0) {
        showToast("Nenhum arquivo .jar encontrado na pasta!", true);
        return;
    }

    try {
        const jsonStr = JSON.stringify(files);
        
        showToast("Enviando para a nuvem... Aguarde.");
        
        // Envia para o ByteBin (Servidor gratuito focado na comunidade de Minecraft)
        const response = await fetch('https://bytebin.lucko.me/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Modpack-Updater-Web'
            },
            body: jsonStr
        });
        
        if (!response.ok) throw new Error("Erro na API do ByteBin");
        
        const data = await response.json();
        const code = data.key; // O código minúsculo, ex: "Yx9Z"
        
        const output = document.getElementById('generated-code');
        output.value = code;
        document.getElementById('generated-code-group').style.display = 'block';
        
        showToast("Código gerado com sucesso! Muito menor agora.");
    } catch (e) {
        console.error("Erro ao gerar o código na nuvem:", e);
        showToast("Erro de conexão. A nuvem pode estar fora do ar.", true);
    }
}

function copyCode() {
    const output = document.getElementById('generated-code');
    output.select();
    document.execCommand("copy");
    showToast("Código copiado para a área de transferência!");
}

async function compareMods() {
    const codeInput = document.getElementById('modpack-code').value.trim();
    const folderInput = document.getElementById('player-folder');
    
    if (!codeInput) {
        showToast("Cole o código do Modpack primeiro!", true);
        return;
    }
    
    if (!folderInput.files || folderInput.files.length === 0) {
        showToast("Selecione a sua pasta de mods!", true);
        return;
    }

    let officialMods = [];
    try {
        showToast("Baixando lista de mods da nuvem... Aguarde.");
        
        // Puxa do ByteBin
        const response = await fetch(`https://bytebin.lucko.me/${codeInput}`);
        if (!response.ok) throw new Error("Código não encontrado");
        
        officialMods = await response.json();
    } catch (e) {
        console.error("Erro ao baixar da nuvem:", e);
        showToast("Código inválido, expirado ou nuvem fora do ar!", true);
        return;
    }

    const playerMods = Array.from(folderInput.files)
        .filter(f => f.name.endsWith('.jar'))
        .map(f => f.name);

    // O que o jogador TEM que o oficial NÃO TEM (Tem que apagar)
    const extraMods = playerMods.filter(mod => !officialMods.includes(mod));
    
    // O que o oficial TEM e o jogador NÃO TEM (Tem que baixar)
    const missingMods = officialMods.filter(mod => !playerMods.includes(mod));

    const resultsDiv = document.getElementById('compare-results');
    const perfectDiv = document.getElementById('perfect-match');
    const deleteList = document.getElementById('delete-list');
    const downloadList = document.getElementById('download-list');
    
    resultsDiv.style.display = 'block';
    
    if (extraMods.length === 0 && missingMods.length === 0) {
        document.querySelector('#compare-results .mods-section').style.display = 'none';
        perfectDiv.style.display = 'block';
    } else {
        document.querySelector('#compare-results .mods-section').style.display = 'grid';
        perfectDiv.style.display = 'none';
        
        // Render Delete List
        deleteList.innerHTML = '';
        if (extraMods.length > 0) {
            extraMods.forEach(mod => {
                deleteList.innerHTML += `<li><div class="mod-info"><span class="mod-name">${mod}</span></div></li>`;
            });
        } else {
            deleteList.innerHTML = '<li style="justify-content:center; color:var(--text-muted);">Nenhum mod extra.</li>';
        }

        // Render Download List
        downloadList.innerHTML = '';
        if (missingMods.length > 0) {
            missingMods.forEach(mod => {
                downloadList.innerHTML += `<li><div class="mod-info"><span class="mod-name">${mod}</span></div></li>`;
            });
        } else {
            downloadList.innerHTML = '<li style="justify-content:center; color:var(--text-muted);">Nenhum mod faltando.</li>';
        }
    }
}
