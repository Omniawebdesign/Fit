// --- CONFIG DE BASE ---

const MUSCLES = [
"biceps",
"triceps",
"pecs",
"delto_ant",
"delto_lat",
"delto_post",
"dos",
"quads",
"ischios",
"fessiers",
"mollets"
];

// Objectif : 6 séries équivalentes par semaine
const WEEKLY_TARGET = 6;

// Liste d'exercices avec coefficients par muscle
// Tu pourras modifier / compléter cette liste comme tu veux
const EXERCISES = [
{
id: "curl_incline",
name: "Curl incliné",
muscles: { biceps: 1 }
},
{
id: "curl_marteau",
name: "Curl marteau",
muscles: { biceps: 1 }
},

{
    id: "seated curl",
    name: "seated curl",
    muscles: { biceps: 1 }
    },

{
id: "extension_triceps_poulie",
name: "Extension triceps poulie",
muscles: { triceps: 1 }
},
{
id: "dips",
name: "Dips 1.5 (Lourd)",
muscles: { pecs: 0.5, triceps: 0.5, delto_ant: 0.4 }
},
{
id: "dips",
name: "Dips 1.5 (Leger)",
muscles: { pecs: 1, triceps: 0.5, delto_ant: 0.5 }
},
{
    id: "dips",
    name: "Dips 2.0 (Lourd)",
    muscles: { pecs: 0.5, triceps: 0.5, delto_ant: 0.4 }
    },
    {
    id: "dips",
    name: "Dips 2.0 (Leger)",
    muscles: { pecs: 1, triceps: 0.5, delto_ant: 0.5 }
    },
    {
        id: "Iso chest",
        name: "Iso chest",
        muscles: { pecs: 1 }
        },
        {id: "Band chest fly",
        name: "Band chest fly",
        muscles: { pecs: 0.5 }
        },
{
id: "elevations_laterales",
name: "Élévations latérales",
muscles: { delto_lat: 1 }
},
{
id: "Band rear fly",
name: "Band rear fly (delto post)",
muscles: { delto_post: 0.5 }
},
{
id: "Pull Ups BW",
name: "Pull Ups BW",
muscles: { dos: 1 }
},
{id: "Pull Ups Heavy",
name: "Pull Ups Heavy",
muscles: { dos: 0.5, biceps: 0.5 }
},
{
id: "squat",
name: "Squat",
muscles: { quads: 1, fessiers: 0.8, ischios: 0.3 }
},
{
id: "sdlt",
name: "Soulevé de terre jambes tendues",
muscles: { ischios: 1, fessiers: 0.7 }
},
{
id: "mollets_debout",
name: "Mollets debout",
muscles: { mollets: 1 }
}
];

const STORAGE_KEY = "trainingLogV1";

// log = array de { date: "YYYY-MM-DD", exerciseId: "..." }
let log = [];

// --- OUTILS DATE ---

function getTodayISO() {
const d = new Date();
const offset = d.getTimezoneOffset();
const local = new Date(d.getTime() - offset * 60 * 1000);
return local.toISOString().slice(0, 10); // YYYY-MM-DD
}

function addDays(dateISO, delta) {
const d = new Date(dateISO);
d.setDate(d.getDate() + delta);
const offset = d.getTimezoneOffset();
const local = new Date(d.getTime() - offset * 60 * 1000);
return local.toISOString().slice(0, 10);
}

// --- LOCALSTORAGE ---

function loadLog() {
const raw = localStorage.getItem(STORAGE_KEY);
if (!raw) {
log = [];
return;
}
try {
log = JSON.parse(raw) || [];
} catch (e) {
console.error("Erreur parsing log:", e);
log = [];
}
}

function saveLog() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

// --- CALCULS ---

function getExerciseById(id) {
return EXERCISES.find(e => e.id === id);
}

// Retourne un objet { [muscle]: volume } pour une journée précise
function getDailyMuscleVolume(dateISO) {
const result = {};
MUSCLES.forEach(m => (result[m] = 0));

const entries = log.filter(entry => entry.date === dateISO);
for (const entry of entries) {
const ex = getExerciseById(entry.exerciseId);
if (!ex) continue;
for (const [muscle, coef] of Object.entries(ex.muscles)) {
if (result[muscle] === undefined) result[muscle] = 0;
result[muscle] += coef;
}
}
return result;
}

// Combien de séries (entrées) hier pour ce muscle ?
function getSetsYesterdayForMuscle(muscle, todayISO) {
const yesterdayISO = addDays(todayISO, -1);
let count = 0;
for (const entry of log) {
if (entry.date !== yesterdayISO) continue;
const ex = getExerciseById(entry.exerciseId);
if (!ex) continue;
if (ex.muscles[muscle] && ex.muscles[muscle] > 0) {
count += 1;
}
}
return count;
}

// Volume de la semaine glissante (7 jours) pour chaque muscle
function getWeeklyVolume(todayISO) {
const volumes = {};
MUSCLES.forEach(m => (volumes[m] = 0));

const startISO = addDays(todayISO, -6); // J-6 jusqu'à J

for (const entry of log) {
if (entry.date < startISO || entry.date > todayISO) continue;
const ex = getExerciseById(entry.exerciseId);
if (!ex) continue;
for (const [muscle, coef] of Object.entries(ex.muscles)) {
if (volumes[muscle] === undefined) volumes[muscle] = 0;
volumes[muscle] += coef;
}
}

return volumes;
}

// --- RENDU UI ---

function renderMuscleSelect() {
    const select = document.getElementById("muscleSelect");
    select.innerHTML = "";
    
    MUSCLES.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = humanMuscleName(m);
    select.appendChild(opt);
    });
    }

    function renderExercisesSelect() {
        const muscleSelect = document.getElementById("muscleSelect");
        const exerciseSelect = document.getElementById("exerciseSelect");
        
        const selectedMuscle = muscleSelect.value;
        
        exerciseSelect.innerHTML = "";
        
        // On filtre les exos qui touchent ce muscle
        const filtered = EXERCISES.filter(ex => ex.muscles[selectedMuscle] !== undefined);
        
        // Si aucun exo pour ce muscle (au cas où), on affiche un placeholder
        if (filtered.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Aucun exercice défini pour ce muscle";
        exerciseSelect.appendChild(opt);
        exerciseSelect.disabled = true;
        return;
        }
        
        exerciseSelect.disabled = false;
        
        filtered.forEach(ex => {
        const opt = document.createElement("option");
        opt.value = ex.id;
        opt.textContent = ex.name;
        exerciseSelect.appendChild(opt);
        });
        }
        

function humanMuscleName(m) {
const map = {
biceps: "Biceps",
triceps: "Triceps",
pecs: "Pecs",
delto_ant: "Delto antérieur",
delto_lat: "Delto latéral",
delto_post: "Delto postérieur",
dos: "Dos",
quads: "Quadriceps",
ischios: "Ischios",
fessiers: "Fessiers",
mollets: "Mollets"
};
return map[m] || m;
}

function renderMuscleTable() {
    const tbody = document.getElementById("muscleTableBody");
    tbody.innerHTML = "";
    
    const todayISO = getTodayISO();
    const weeklyVolume = getWeeklyVolume(todayISO);
    
    // 🔥 Nouveau : volume d'hier pour tous les muscles
    const yesterdayISO = addDays(todayISO, -1);
    const yesterdayVolume = getDailyMuscleVolume(yesterdayISO);
    
    MUSCLES.forEach(muscle => {
    const volWeek = weeklyVolume[muscle] || 0;
    const volWeekRounded = Math.round(volWeek * 10) / 10;
    
    const volYesterday = yesterdayVolume[muscle] || 0;
    
    let statusText = "OK pour aujourd'hui";
    let statusClass = "status-ok";
    
    // 💡 Règle Option A :
    // Repos si volume d'hier (somme des coeffs) >= 1.0
    if (volYesterday >= 1) {
    statusText = "Repos (volume suffisant hier)";
    statusClass = "status-rest";
    }
    
    // Si objectif atteint (peu importe le repos)
    if (volWeek >= WEEKLY_TARGET) {
    statusText = "Objectif hebdo atteint";
    statusClass = "status-full";
    }
    
    const tr = document.createElement("tr");
    
    const tdName = document.createElement("td");
    tdName.textContent = humanMuscleName(muscle);
    
    const tdVol = document.createElement("td");
    tdVol.innerHTML = `<span class="progress-text">${volWeekRounded.toFixed(
    1
    )}</span>`;
    
    const tdTarget = document.createElement("td");
    tdTarget.textContent = WEEKLY_TARGET;
    
    const tdStatus = document.createElement("td");
    const span = document.createElement("span");
    span.className = `status ${statusClass}`;
    span.textContent = statusText;
    tdStatus.appendChild(span);
    
    tr.appendChild(tdName);
    tr.appendChild(tdVol);
    tr.appendChild(tdTarget);
    tr.appendChild(tdStatus);
    tbody.appendChild(tr);
    });
    }

function renderLog() {
const container = document.getElementById("logContainer");
container.innerHTML = "";

if (log.length === 0) {
container.textContent = "Aucune série enregistrée pour le moment.";
return;
}






function renderYesterdayExercises() {
    const container = document.getElementById("yesterdayExercises");
    container.innerHTML = "";
    
    const todayISO = getTodayISO();
    const yesterdayISO = addDays(todayISO, -1);
    
    const entries = log.filter(e => e.date === yesterdayISO);
    
    if (entries.length === 0) {
    container.textContent = "Aucun exercice enregistré hier.";
    return;
    }
    
    const ul = document.createElement("ul");
    
    entries.forEach(entry => {
    const ex = getExerciseById(entry.exerciseId);
    const li = document.createElement("li");
    li.textContent = `• ${ex ? ex.name : entry.exerciseId}`;
    ul.appendChild(li);
    });
    
    container.appendChild(ul);
    }
// On affiche les 10 derniers jours max
const todayISO = getTodayISO();
const days = [];
for (let i = 0; i < 10; i++) {
days.push(addDays(todayISO, -i));
}

days.forEach(dateISO => {
const entries = log.filter(e => e.date === dateISO);
if (entries.length === 0) return;

const dayDiv = document.createElement("div");
dayDiv.className = "log-day";

const dateP = document.createElement("div");
dateP.className = "log-date";
dateP.textContent = dateISO;
dayDiv.appendChild(dateP);

entries.forEach(entry => {
const ex = getExerciseById(entry.exerciseId);
const p = document.createElement("div");
p.className = "log-entry";
p.textContent = `• ${ex ? ex.name : entry.exerciseId}`;
dayDiv.appendChild(p);
});

container.appendChild(dayDiv);
});
}

function renderAll() {
renderMuscleTable();
renderLog();
}

// --- ACTIONS ---

function addSeries() {
    const exerciseSelect = document.getElementById("exerciseSelect");
    const exerciseId = exerciseSelect.value;
    
    if (!exerciseId) {
    alert("Choisis d'abord un exercice.");
    return;
    }
    
    const todayISO = getTodayISO();
    
    log.push({
    date: todayISO,
    exerciseId
    });
    
    saveLog();
    renderAll();
    }
    

function resetAll() {
if (!confirm("Tu es sûr de vouloir supprimer tout l'historique ?")) return;
log = [];
saveLog();
renderAll();
}

// --- INIT ---

document.addEventListener("DOMContentLoaded", () => {
    loadLog();
    
    // 1) on remplit les muscles
    renderMuscleSelect();
    // 2) on remplit les exos en fonction du muscle sélectionné
    renderExercisesSelect();
    
    // Quand on change de muscle, on met à jour la liste d'exos
    document.getElementById("muscleSelect").addEventListener("change", () => {
    renderExercisesSelect();
    });
    
    document
    .getElementById("addSeriesBtn")
    .addEventListener("click", addSeries);
    
    document.getElementById("resetBtn").addEventListener("click", resetAll);
    
    renderAll();
    });
