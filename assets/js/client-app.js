// assets/js/client-app.js
import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeModals, openModal, closeModal } from './components/modal.js';
import { FITFLOW_THEMES_CONFIG } from './themes-config.js'; // Import shared themes

// --- Local Storage Database Helper ---
const DB_PREFIX = 'fitflow_mvp_';
const db = {
    read: (key) => {
        const data = localStorage.getItem(DB_PREFIX + key); if (!data) return [];
        try { const parsed = JSON.parse(data); return Array.isArray(parsed) ? parsed : []; }
        catch (e) { console.error(`db.read ${key}:`, e); return []; }
    },
    write: (key, data) => {
        try { localStorage.setItem(DB_PREFIX + key, JSON.stringify(data)); }
        catch (e) { console.error(`db.write ${key}:`, e); }
    }
};

// --- State ---
let allClients = [], allExercises = [], allTemplates = [], allAssignedWorkouts = [];
let currentClientId = null, currentClientName = '';
let currentWorkoutSession = { assignmentId: null, template: null, currentExerciseIndex: 0, exerciseData: [] };
let timerInterval = null, timerSeconds = 0;

// --- UI Elements ---
let bodyElement, clientThemeSwitcher, pageTitleElement;
let loginView, dashboardView, clientSelect, clientLoginForm;
let welcomeMessageElement, assignedWorkoutsContainer, logoutBtn;
let workoutSessionModal, workoutSessionModalTitle, workoutSessionModalBody;
let prevExerciseBtn, nextExerciseBtn, exerciseProgressIndicator, finishWorkoutBtn;
let timerDisplay, timerStartBtn, timerPauseBtn, timerResetBtn;
let workoutSessionModalCloseFooterBtn;

// --- FUNCTIONS ---
function loadDataFromStorage() { allClients = db.read('clients'); allExercises = db.read('exercises'); allTemplates = db.read('workoutTemplates'); allAssignedWorkouts = db.read('assignedWorkouts'); }
function populateClientSelect() { if (!clientSelect) return; clientSelect.innerHTML = '<option value="">-- Select --</option>'; allClients.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; clientSelect.appendChild(o); }); }
function handleClientLogin(e) { e.preventDefault(); if (!clientSelect) return; const id = clientSelect.value; if (!id) { alert("Select profile."); return; } const c = allClients.find(cl => cl.id === id); if (c) { currentClientId = c.id; currentClientName = c.name; localStorage.setItem('fitflow_current_client_id', currentClientId); localStorage.setItem('fitflow_current_client_name', currentClientName); showDashboardView(); } else { alert("Profile not found."); } }
function handleLogout() { currentClientId = null; currentClientName = ''; localStorage.removeItem('fitflow_current_client_id'); localStorage.removeItem('fitflow_current_client_name'); stopTimer(); resetTimerDisplay(); showLoginView(); }
function showLoginView() { if (loginView) loginView.classList.add('is-active'); if (dashboardView) dashboardView.classList.remove('is-active'); if (pageTitleElement) pageTitleElement.textContent = "Client Login"; if (clientSelect) clientSelect.value = ""; }
function showDashboardView() { if (loginView) loginView.classList.remove('is-active'); if (dashboardView) dashboardView.classList.add('is-active'); if (pageTitleElement) pageTitleElement.textContent = "My Workouts"; if (welcomeMessageElement) welcomeMessageElement.textContent = `Welcome, ${currentClientName}!`; renderAssignedWorkoutsForClient(); }
function renderAssignedWorkoutsForClient() {
    if (!assignedWorkoutsContainer || !currentClientId) { if (assignedWorkoutsContainer) assignedWorkoutsContainer.innerHTML = '<p class="text-muted">No workouts.</p>'; return; }
    const assignments = allAssignedWorkouts.filter(aw => aw.clientId === currentClientId).sort((a, b) => new Date(b.dateAssigned) - new Date(a.dateAssigned));
    if (assignments.length === 0) { assignedWorkoutsContainer.innerHTML = '<p class="text-muted">No workouts assigned.</p>'; return; }
    assignedWorkoutsContainer.innerHTML = '';
    assignments.forEach(aw => {
        const template = allTemplates.find(t => t.id === aw.workoutTemplateId); if (!template) return;
        const card = document.createElement('div'); card.className = 'pt-card assigned-workout-item';
        let btnHTML = '';
        if (aw.status === 'completed') btnHTML = `<button class="pt-button pt-button--secondary pt-button--small view-completed-workout-btn" data-assignment-id="${aw.id}">View</button>`;
        else if (aw.status === 'in progress') btnHTML = `<button class="pt-button pt-button--primary resume-workout-btn" data-assignment-id="${aw.id}">Resume</button>`;
        else btnHTML = `<button class="pt-button pt-button--primary start-workout-btn" data-assignment-id="${aw.id}">Start</button>`;
        card.innerHTML = `<h3 class="pt-card-title">${template.name} - ${new Date(aw.dateAssigned).toLocaleDateString()}</h3><p class="text-muted">Status: <span style="text-transform:capitalize;">${aw.status}</span></p><div class="pt-card-footer">${btnHTML}</div>`;
        assignedWorkoutsContainer.appendChild(card);
    });
}
function startOrResumeWorkoutSession(id) {
    const assignment = allAssignedWorkouts.find(aw => aw.id === id); if (!assignment) return;
    const template = allTemplates.find(t => t.id === assignment.workoutTemplateId); if (!template) return;
    currentWorkoutSession.assignmentId = id; currentWorkoutSession.template = template; currentWorkoutSession.currentExerciseIndex = 0;
    const progress = db.read(`fitflow_client_progress_${id}`);
    if (progress.length > 0 && assignment.status === 'in progress') { currentWorkoutSession.exerciseData = progress; }
    else {
        currentWorkoutSession.exerciseData = template.exercises.map(exD => ({ exerciseId: exD.exerciseId, targetSets: exD.sets, targetReps: exD.reps, targetRest: exD.rest, setsData: Array(parseInt(exD.sets) || 1).fill(null).map(() => ({ reps: '', weight: '', done: false })) }));
        if (assignment.status === 'pending') { const idx = allAssignedWorkouts.findIndex(aw => aw.id === id); if (idx > -1) { allAssignedWorkouts[idx].status = 'in progress'; db.write('assignedWorkouts', allAssignedWorkouts); renderAssignedWorkoutsForClient(); } }
    }
    if (!workoutSessionModalTitle || !workoutSessionModalBody || !workoutSessionModal) return;
    workoutSessionModalTitle.textContent = `${template.name} - In Progress`;
    const nav = workoutSessionModal.querySelector('.workout-session-nav'), timer = workoutSessionModal.querySelector('.workout-timer');
    if (nav) nav.style.display = 'flex'; if (timer) timer.style.display = 'block'; if (finishWorkoutBtn) finishWorkoutBtn.style.display = 'inline-block'; if (workoutSessionModalCloseFooterBtn) workoutSessionModalCloseFooterBtn.textContent = 'Save & Close';
    renderCurrentExerciseInModal(); stopTimer(); resetTimerDisplay(); openModal('workoutSessionModal');
}
function renderCurrentExerciseInModal() {
    if (!currentWorkoutSession.template || !workoutSessionModalBody) return;
    const exDetail = currentWorkoutSession.template.exercises[currentWorkoutSession.currentExerciseIndex];
    const exInfo = allExercises.find(ex => ex.id === exDetail.exerciseId);
    const sessionExData = currentWorkoutSession.exerciseData[currentWorkoutSession.currentExerciseIndex];
    if (!exInfo || !sessionExData) { workoutSessionModalBody.innerHTML = "<p class=\"text-muted\">Error.</p>"; return; }
    let html = `<div class="exercise-session-item is-active" data-exercise-id="${exInfo.id}"><h4>${exInfo.name}</h4><p class="target-metrics">Target: ${exDetail.sets||'N/A'} sets x ${exDetail.reps||'N/A'} reps. Rest: ${exDetail.rest?`${exDetail.rest}s`:'N/A'}</p>`;
    sessionExData.setsData.forEach((setD, setIdx) => { html += `<div class="set-tracking-row"><label for="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIdx}-reps">Set ${setIdx+1}:</label><input type="number" id="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIdx}-reps" class="pt-input actual-reps-input" data-set-index="${setIdx}" value="${setD.reps||''}" placeholder="Reps"><input type="number" id="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIdx}-weight" class="pt-input actual-weight-input" data-set-index="${setIdx}" value="${setD.weight||''}" placeholder="Weight"><input type="checkbox" id="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIdx}-done" class="set-done-checkbox" data-set-index="${setIdx}" ${setD.done?'checked':''}></div>`; });
    html += `</div>`; workoutSessionModalBody.innerHTML = html; updateWorkoutSessionNav();
}
function updateWorkoutSessionNav() { if (!prevExerciseBtn || !nextExerciseBtn || !exerciseProgressIndicator || !currentWorkoutSession.template) return; const total = currentWorkoutSession.template.exercises.length; prevExerciseBtn.disabled = currentWorkoutSession.currentExerciseIndex === 0; nextExerciseBtn.disabled = currentWorkoutSession.currentExerciseIndex >= total - 1; exerciseProgressIndicator.textContent = `Ex ${currentWorkoutSession.currentExerciseIndex+1} of ${total}`; }
function handleWorkoutSessionDataChange(e) {
    if (!e.target.matches('.actual-reps-input,.actual-weight-input,.set-done-checkbox')) return;
    const setIdx = parseInt(e.target.dataset.setIndex); const exData = currentWorkoutSession.exerciseData[currentWorkoutSession.currentExerciseIndex]; if (!exData || !exData.setsData[setIdx]) return;
    if (e.target.classList.contains('actual-reps-input')) exData.setsData[setIdx].reps = e.target.value;
    else if (e.target.classList.contains('actual-weight-input')) exData.setsData[setIdx].weight = e.target.value;
    else if (e.target.classList.contains('set-done-checkbox')) exData.setsData[setIdx].done = e.target.checked;
    db.write(`fitflow_client_progress_${currentWorkoutSession.assignmentId}`, currentWorkoutSession.exerciseData);
}
function navigateExercise(dir) { const total = currentWorkoutSession.template.exercises.length; if (dir === 'next' && currentWorkoutSession.currentExerciseIndex < total - 1) currentWorkoutSession.currentExerciseIndex++; else if (dir === 'prev' && currentWorkoutSession.currentExerciseIndex > 0) currentWorkoutSession.currentExerciseIndex--; renderCurrentExerciseInModal(); }
function finishWorkout() { if (!currentWorkoutSession.assignmentId) return; const idx = allAssignedWorkouts.findIndex(aw => aw.id === currentWorkoutSession.assignmentId); if (idx > -1) { allAssignedWorkouts[idx].status = 'completed'; db.write('assignedWorkouts', allAssignedWorkouts); localStorage.removeItem(DB_PREFIX + `fitflow_client_progress_${currentWorkoutSession.assignmentId}`); renderAssignedWorkoutsForClient(); closeModal('workoutSessionModal'); alert("Workout Finished!"); } currentWorkoutSession = { assignmentId: null, template: null, currentExerciseIndex: 0, exerciseData: [] }; }
function viewCompletedWorkoutDetails(id) {
    const assignment = allAssignedWorkouts.find(aw => aw.id === id); if (!assignment) return;
    const template = allTemplates.find(t => t.id === assignment.workoutTemplateId); if (!template) return;
    if (!workoutSessionModalTitle || !workoutSessionModalBody || !workoutSessionModal) return;
    workoutSessionModalTitle.textContent = `${template.name} - Completed`; let html = '';
    template.exercises.forEach(exD => { const exInfo = allExercises.find(ex => ex.id === exD.exerciseId); if (exInfo) html += `<div class="exercise-detail-item"><h4>${exInfo.name}</h4><p class="target-metrics">Target: ${exD.sets||'N/A'} sets x ${exD.reps||'N/A'} reps. Rest: ${exD.rest?exD.rest+'s':'N/A'}</p></div>`; });
    workoutSessionModalBody.innerHTML = html;
    const nav = workoutSessionModal.querySelector('.workout-session-nav'), timer = workoutSessionModal.querySelector('.workout-timer');
    if (nav) nav.style.display = 'none'; if (timer) timer.style.display = 'none'; if (finishWorkoutBtn) finishWorkoutBtn.style.display = 'none'; if (workoutSessionModalCloseFooterBtn) workoutSessionModalCloseFooterBtn.textContent = 'Close';
    openModal('workoutSessionModal');
}
function formatTime(s) { const m = Math.floor(s / 60); const sec = s % 60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
function updateTimerDisplay() { if (timerDisplay) timerDisplay.textContent = formatTime(timerSeconds); }
function startTimer() { if (timerInterval) return; if (timerStartBtn) timerStartBtn.style.display = 'none'; if (timerPauseBtn) timerPauseBtn.style.display = 'inline-block'; timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000); }
function pauseTimer() { clearInterval(timerInterval); timerInterval = null; if (timerStartBtn) timerStartBtn.style.display = 'inline-block'; if (timerPauseBtn) timerPauseBtn.style.display = 'none'; }
function stopTimer() { clearInterval(timerInterval); timerInterval = null; if (timerStartBtn) timerStartBtn.style.display = 'inline-block'; if (timerPauseBtn) timerPauseBtn.style.display = 'none'; }
function resetTimerDisplay() { timerSeconds = 0; updateTimerDisplay(); }
function checkPersistedLogin() { const id = localStorage.getItem('fitflow_current_client_id'), name = localStorage.getItem('fitflow_current_client_name'); if (id && name) { currentClientId = id; currentClientName = name; showDashboardView(); } else { showLoginView(); } }
function handleDashboardClicks(e) { const startBtn = e.target.closest('.start-workout-btn'), resumeBtn = e.target.closest('.resume-workout-btn'), viewBtn = e.target.closest('.view-completed-workout-btn'); if (startBtn) startOrResumeWorkoutSession(startBtn.dataset.assignmentId); else if (resumeBtn) startOrResumeWorkoutSession(resumeBtn.dataset.assignmentId); else if (viewBtn) viewCompletedWorkoutDetails(viewBtn.dataset.assignmentId); }

function initializeClientApp() {
    bodyElement = document.body; clientThemeSwitcher = document.getElementById('clientThemeSwitcher'); pageTitleElement = document.getElementById('pageTitle');
    loginView = document.getElementById('loginView'); dashboardView = document.getElementById('dashboardView'); clientSelect = document.getElementById('clientSelect'); clientLoginForm = document.getElementById('clientLoginForm');
    welcomeMessageElement = document.getElementById('welcomeMessage'); assignedWorkoutsContainer = document.getElementById('assignedWorkoutsContainer'); logoutBtn = document.getElementById('logoutBtn');
    workoutSessionModal = document.getElementById('workoutSessionModal'); workoutSessionModalTitle = document.getElementById('workoutSessionModalTitle'); workoutSessionModalBody = document.getElementById('workoutSessionModalBody');
    prevExerciseBtn = document.getElementById('prevExerciseBtn'); nextExerciseBtn = document.getElementById('nextExerciseBtn'); exerciseProgressIndicator = document.getElementById('exerciseProgressIndicator'); finishWorkoutBtn = document.getElementById('finishWorkoutBtn');
    timerDisplay = document.getElementById('timerDisplay'); timerStartBtn = document.getElementById('timerStartBtn'); timerPauseBtn = document.getElementById('timerPauseBtn'); timerResetBtn = document.getElementById('timerResetBtn');
    workoutSessionModalCloseFooterBtn = workoutSessionModal ? workoutSessionModal.querySelector('.pt-modal__close-footer') : null;

    loadDataFromStorage(); populateClientSelect();

    if (clientThemeSwitcher && bodyElement) {
        initializeThemeSwitcher(
            FITFLOW_THEMES_CONFIG, // Use imported shared config
            clientThemeSwitcher,
            document.body, // Apply to body for global effect
            (newThemeValue) => {
                if (workoutSessionModal) {
                    FITFLOW_THEMES_CONFIG.forEach(t => { if (workoutSessionModal.classList.contains(t.value)) { workoutSessionModal.classList.remove(t.value); } });
                    workoutSessionModal.classList.add(newThemeValue);
                }
            },
            'fitflowGlobalTheme' // Use global key
        );
    } else if (FITFLOW_THEMES_CONFIG.length > 0 && bodyElement) { // Fallback if switcher not found
        const defaultTheme = FITFLOW_THEMES_CONFIG[0];
        bodyElement.className = ''; bodyElement.classList.add(defaultTheme.value);
        bodyElement.style.backgroundColor = 'var(--background-color)'; bodyElement.style.color = 'var(--text-color)';
        if (workoutSessionModal) workoutSessionModal.classList.add(defaultTheme.value);
    }
    
    initializeModals();
    if (workoutSessionModalCloseFooterBtn) workoutSessionModalCloseFooterBtn.addEventListener('click', () => { if (workoutSessionModal) closeModal(workoutSessionModal.id); });
    if (clientLoginForm) clientLoginForm.addEventListener('submit', handleClientLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (assignedWorkoutsContainer) assignedWorkoutsContainer.addEventListener('click', handleDashboardClicks);
    if (workoutSessionModalBody) workoutSessionModalBody.addEventListener('input', handleWorkoutSessionDataChange);
    if (prevExerciseBtn) prevExerciseBtn.addEventListener('click', () => navigateExercise('prev'));
    if (nextExerciseBtn) nextExerciseBtn.addEventListener('click', () => navigateExercise('next'));
    if (finishWorkoutBtn) finishWorkoutBtn.addEventListener('click', finishWorkout);
    if (timerStartBtn) timerStartBtn.addEventListener('click', startTimer);
    if (timerPauseBtn) timerPauseBtn.addEventListener('click', pauseTimer);
    if (timerResetBtn) timerResetBtn.addEventListener('click', () => { stopTimer(); resetTimerDisplay(); });

    checkPersistedLogin();
    console.log("FitFlow Client App Initialized.");
}

document.addEventListener('DOMContentLoaded', initializeClientApp);
