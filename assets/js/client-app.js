// assets/js/client-app.js

import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeModals, openModal, closeModal } from './components/modal.js'; 

// --- Local Storage Database Helper ---
const DB_PREFIX = 'fitflow_mvp_';
const db = {
    read: (key) => { /* ... (same as previous version) ... */ 
        const data = localStorage.getItem(DB_PREFIX + key);
        if (!data) { return []; }
        try { const parsedData = JSON.parse(data); return Array.isArray(parsedData) ? parsedData : []; }
        catch (error) { console.error(`db.read error for ${key}:`, error); return []; }
    },
    write: (key, data) => { /* ... (same as previous version) ... */
        try { localStorage.setItem(DB_PREFIX + key, JSON.stringify(data)); }
        catch (error) { console.error(`db.write error for ${key}:`, error); }
    }
};

// --- State ---
let allClients = [];
let allExercises = [];
let allTemplates = [];
let allAssignedWorkouts = [];
let currentClientId = null;
let currentClientName = '';

// Workout Session State
let currentWorkoutSession = { // Holds data for the active workout session
    assignmentId: null,
    template: null,
    currentExerciseIndex: 0,
    exerciseData: [] // To store [{ exerciseId, sets: [{reps, weight, done}, ...] }, ...]
};

// Timer State
let timerInterval = null;
let timerSeconds = 0;

// --- UI Elements ---
let bodyElement, clientThemeSwitcher, pageTitleElement;
let loginView, dashboardView, clientSelect, clientLoginForm;
let welcomeMessageElement, assignedWorkoutsContainer, logoutBtn;
let workoutSessionModal, workoutSessionModalTitle, workoutSessionModalBody;
let prevExerciseBtn, nextExerciseBtn, exerciseProgressIndicator, finishWorkoutBtn;
let timerDisplay, timerStartBtn, timerPauseBtn, timerResetBtn;

const themesForClientApp = [ 
    { value: 'theme-modern-professional', name: 'Modern & Professional' }, { value: 'theme-friendly-supportive', name: 'Friendly & Supportive' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating' }, { value: 'theme-natural-grounded', name: 'Natural & Grounded' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist' }, { value: 'theme-retro-funk', name: 'Retro Funk' }, 
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance' }, { value: 'theme-urban-grit', name: 'Urban Grit' },
    { value: 'theme-playful-pop', name: 'Playful Pop' }, { value: 'theme-tech-data', name: 'Tech Data' }
];

// --- FUNCTIONS ---
function loadDataFromStorage() { /* ... (same as previous) ... */ 
    allClients = db.read('clients'); allExercises = db.read('exercises');
    allTemplates = db.read('workoutTemplates'); allAssignedWorkouts = db.read('assignedWorkouts');
}
function populateClientSelect() { /* ... (same as previous) ... */
    if (!clientSelect) return; clientSelect.innerHTML = '<option value="">-- Please Select --</option>';
    allClients.forEach(client => { const option = document.createElement('option'); option.value = client.id; option.textContent = client.name; clientSelect.appendChild(option);});
}
function handleClientLogin(e) { /* ... (same as previous) ... */
    e.preventDefault(); if (!clientSelect) return; const selectedId = clientSelect.value; if (!selectedId) { alert("Please select your profile."); return; }
    const client = allClients.find(c => c.id === selectedId);
    if (client) { currentClientId = client.id; currentClientName = client.name; localStorage.setItem('fitflow_current_client_id', currentClientId); localStorage.setItem('fitflow_current_client_name', currentClientName); showDashboardView(); } 
    else { alert("Selected client profile not found."); }
}
function handleLogout() { /* ... (same as previous, ensures timer reset) ... */
    currentClientId = null; currentClientName = ''; localStorage.removeItem('fitflow_current_client_id'); localStorage.removeItem('fitflow_current_client_name');
    stopTimer(); resetTimerDisplay(); showLoginView();
}
function showLoginView() { /* ... (same as previous) ... */
    if(loginView) loginView.classList.add('is-active'); if(dashboardView) dashboardView.classList.remove('is-active');
    if(pageTitleElement) pageTitleElement.textContent = "Client Login"; if(clientSelect) clientSelect.value = "";
}
function showDashboardView() { /* ... (same as previous) ... */
    if(loginView) loginView.classList.remove('is-active'); if(dashboardView) dashboardView.classList.add('is-active');
    if(pageTitleElement) pageTitleElement.textContent = "My Workouts"; if(welcomeMessageElement) welcomeMessageElement.textContent = `Welcome, ${currentClientName}! Here are your workouts:`;
    renderAssignedWorkoutsForClient();
}

function renderAssignedWorkoutsForClient() {
    if (!assignedWorkoutsContainer || !currentClientId) { if (assignedWorkoutsContainer) assignedWorkoutsContainer.innerHTML = '<p class="text-muted">Could not load workouts.</p>'; return; }
    const clientAssignments = allAssignedWorkouts.filter(aw => aw.clientId === currentClientId).sort((a, b) => new Date(b.dateAssigned) - new Date(a.dateAssigned)); // Show newest first
    
    if (clientAssignments.length === 0) { assignedWorkoutsContainer.innerHTML = '<p class="text-muted">You have no workouts assigned yet.</p>'; return; }
    assignedWorkoutsContainer.innerHTML = '';
    clientAssignments.forEach(aw => {
        const template = allTemplates.find(t => t.id === aw.workoutTemplateId);
        if (!template) { return; }
        const workoutCard = document.createElement('div');
        workoutCard.className = 'pt-card assigned-workout-item';
        
        let actionButtonHTML = '';
        if (aw.status === 'completed') {
            actionButtonHTML = `<button class="pt-button pt-button--secondary pt-button--small view-completed-workout-btn" data-assignment-id="${aw.id}">View Completed</button>`;
        } else if (aw.status === 'in progress') {
            actionButtonHTML = `<button class="pt-button pt-button--primary resume-workout-btn" data-assignment-id="${aw.id}">Resume Workout</button>`;
        } else { // pending
            actionButtonHTML = `<button class="pt-button pt-button--primary start-workout-btn" data-assignment-id="${aw.id}">Start Workout</button>`;
        }

        workoutCard.innerHTML = `
            <h3 class="pt-card-title">${template.name} - Assigned: ${new Date(aw.dateAssigned).toLocaleDateString()}</h3>
            <p class="text-muted">Status: <span style="font-weight:bold; text-transform: capitalize;">${aw.status}</span></p>
            <div class="pt-card-footer">
                ${actionButtonHTML}
            </div>
        `;
        assignedWorkoutsContainer.appendChild(workoutCard);
    });
}

function startOrResumeWorkoutSession(assignmentId) {
    const assignment = allAssignedWorkouts.find(aw => aw.id === assignmentId);
    if (!assignment) { console.error("Assignment not found:", assignmentId); return; }
    const template = allTemplates.find(t => t.id === assignment.workoutTemplateId);
    if (!template) { console.error("Template not found for assignment:", assignment.workoutTemplateId); return; }

    currentWorkoutSession.assignmentId = assignmentId;
    currentWorkoutSession.template = template;
    currentWorkoutSession.currentExerciseIndex = 0;
    
    // Try to load progress for this assignment
    const progressKey = `fitflow_client_progress_${assignmentId}`;
    const savedProgress = db.read(progressKey);

    if (savedProgress && savedProgress.length > 0 && assignment.status === 'in progress') {
        currentWorkoutSession.exerciseData = savedProgress;
        console.log("Resuming workout with saved progress:", savedProgress);
    } else {
        // Initialize exerciseData based on template if no saved progress or not "in progress"
        currentWorkoutSession.exerciseData = template.exercises.map(exDetail => {
            const numSets = parseInt(exDetail.sets) || 1;
            return {
                exerciseId: exDetail.exerciseId,
                targetSets: exDetail.sets, targetReps: exDetail.reps, targetRest: exDetail.rest,
                setsData: Array(numSets).fill(null).map(() => ({ reps: '', weight: '', done: false }))
            };
        });
        // If starting fresh, mark assignment as "in progress"
        if (assignment.status === 'pending') {
            const assignmentIndex = allAssignedWorkouts.findIndex(aw => aw.id === assignmentId);
            if (assignmentIndex > -1) {
                allAssignedWorkouts[assignmentIndex].status = 'in progress';
                db.write('assignedWorkouts', allAssignedWorkouts);
                renderAssignedWorkoutsForClient(); // Update dashboard
            }
        }
    }
    
    if (!workoutSessionModalTitle || !workoutSessionModalBody || !workoutSessionModal) { return; }
    workoutSessionModalTitle.textContent = `${template.name} - In Progress`;
    renderCurrentExerciseInModal();
    stopTimer(); resetTimerDisplay();
    openModal('workoutSessionModal');
}

function renderCurrentExerciseInModal() {
    if (!currentWorkoutSession.template || !workoutSessionModalBody) return;
    const exerciseDetail = currentWorkoutSession.template.exercises[currentWorkoutSession.currentExerciseIndex];
    const exerciseInfo = allExercises.find(ex => ex.id === exerciseDetail.exerciseId);
    const sessionExerciseData = currentWorkoutSession.exerciseData[currentWorkoutSession.currentExerciseIndex];

    if (!exerciseInfo || !sessionExerciseData) {
        workoutSessionModalBody.innerHTML = "<p class="text-muted">Error loading exercise details.</p>";
        return;
    }

    let bodyHtml = `<div class="exercise-session-item is-active" data-exercise-id="${exerciseInfo.id}">
        <h4>${exerciseInfo.name}</h4>
        <p class="target-metrics">Target: ${exerciseDetail.sets || 'N/A'} sets of ${exerciseDetail.reps || 'N/A'} reps. Rest: ${exerciseDetail.rest ? exerciseDetail.rest + 's' : 'N/A'}</p>`;

    sessionExerciseData.setsData.forEach((setData, setIndex) => {
        bodyHtml += `<div class="set-tracking-row">
            <label for="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIndex}-reps">Set ${setIndex + 1}:</label>
            <input type="number" id="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIndex}-reps" class="pt-input actual-reps-input" data-set-index="${setIndex}" value="${setData.reps || ''}" placeholder="Reps">
            <input type="number" id="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIndex}-weight" class="pt-input actual-weight-input" data-set-index="${setIndex}" value="${setData.weight || ''}" placeholder="Weight">
            <input type="checkbox" id="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIndex}-done" class="set-done-checkbox" data-set-index="${setIndex}" ${setData.done ? 'checked' : ''}>
        </div>`;
    });
    bodyHtml += `</div>`;
    workoutSessionModalBody.innerHTML = bodyHtml;
    updateWorkoutSessionNav();
}

function updateWorkoutSessionNav() {
    if (!prevExerciseBtn || !nextExerciseBtn || !exerciseProgressIndicator || !currentWorkoutSession.template) return;
    const totalExercises = currentWorkoutSession.template.exercises.length;
    prevExerciseBtn.disabled = currentWorkoutSession.currentExerciseIndex === 0;
    nextExerciseBtn.disabled = currentWorkoutSession.currentExerciseIndex >= totalExercises - 1;
    exerciseProgressIndicator.textContent = `Exercise ${currentWorkoutSession.currentExerciseIndex + 1} of ${totalExercises}`;
}

function handleWorkoutSessionDataChange(e) {
    if (!e.target.matches('.actual-reps-input, .actual-weight-input, .set-done-checkbox')) return;

    const setIndex = parseInt(e.target.dataset.setIndex);
    const currentExData = currentWorkoutSession.exerciseData[currentWorkoutSession.currentExerciseIndex];

    if (e.target.classList.contains('actual-reps-input')) {
        currentExData.setsData[setIndex].reps = e.target.value;
    } else if (e.target.classList.contains('actual-weight-input')) {
        currentExData.setsData[setIndex].weight = e.target.value;
    } else if (e.target.classList.contains('set-done-checkbox')) {
        currentExData.setsData[setIndex].done = e.target.checked;
    }
    // Save progress for the current assignment
    const progressKey = `fitflow_client_progress_${currentWorkoutSession.assignmentId}`;
    db.write(progressKey, currentWorkoutSession.exerciseData);
}

function navigateExercise(direction) {
    const totalExercises = currentWorkoutSession.template.exercises.length;
    if (direction === 'next' && currentWorkoutSession.currentExerciseIndex < totalExercises - 1) {
        currentWorkoutSession.currentExerciseIndex++;
    } else if (direction === 'prev' && currentWorkoutSession.currentExerciseIndex > 0) {
        currentWorkoutSession.currentExerciseIndex--;
    }
    renderCurrentExerciseInModal();
}

function finishWorkout() {
    if (!currentWorkoutSession.assignmentId) return;
    const assignmentIndex = allAssignedWorkouts.findIndex(aw => aw.id === currentWorkoutSession.assignmentId);
    if (assignmentIndex > -1) {
        allAssignedWorkouts[assignmentIndex].status = 'completed';
        db.write('assignedWorkouts', allAssignedWorkouts);
        // Optionally clear the temporary progress data
        const progressKey = `fitflow_client_progress_${currentWorkoutSession.assignmentId}`;
        localStorage.removeItem(DB_PREFIX + progressKey); // Or db.write(progressKey, []);
        
        renderAssignedWorkoutsForClient();
        closeModal('workoutSessionModal');
        alert("Workout Finished and Marked as Completed!");
    }
    currentWorkoutSession = { assignmentId: null, template: null, currentExerciseIndex: 0, exerciseData: [] }; // Reset session
}

function viewCompletedWorkoutDetails(assignmentId) {
    // This function is similar to startOrResume, but for read-only view and doesn't allow editing.
    // For MVP, it can reuse much of startOrResume's display logic but disable inputs.
    // Or, more simply, show just the target metrics.
    const assignment = allAssignedWorkouts.find(aw => aw.id === assignmentId);
    if (!assignment) return;
    const template = allTemplates.find(t => t.id === assignment.workoutTemplateId);
    if (!template) return;

    if (!workoutSessionModalTitle || !workoutSessionModalBody || !workoutSessionModal) return;
    workoutSessionModalTitle.textContent = `${template.name} - Completed Details`;
    let bodyHtml = '';
    template.exercises.forEach((exDetail) => {
        const exerciseInfo = allExercises.find(ex => ex.id === exDetail.exerciseId);
        if (exerciseInfo) {
            bodyHtml += `<div class="exercise-detail-item">
                <h4>${exerciseInfo.name}</h4>
                <p class="target-metrics">Target: ${exDetail.sets || 'N/A'} sets of ${exDetail.reps || 'N/A'} reps. Rest: ${exDetail.rest ? exDetail.rest + 's' : 'N/A'}</p>
            </div>`;
        }
    });
    workoutSessionModalBody.innerHTML = bodyHtml;
    // Hide exercise navigation and finish button for completed view
    if(prevExerciseBtn) prevExerciseBtn.style.display = 'none';
    if(nextExerciseBtn) nextExerciseBtn.style.display = 'none';
    if(exerciseProgressIndicator) exerciseProgressIndicator.textContent = '';
    if(finishWorkoutBtn) finishWorkoutBtn.style.display = 'none';
    if(timerDisplay && timerStartBtn && timerPauseBtn && timerResetBtn) { // Hide timer controls
        timerDisplay.parentElement.style.display = 'none';
    }

    openModal('workoutSessionModal');
}


// --- Timer Functions ---
function formatTime(totalSeconds) { /* ... (same as previous) ... */ 
    const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
function updateTimerDisplay() { /* ... (same as previous) ... */ if (timerDisplay) timerDisplay.textContent = formatTime(timerSeconds); }
function startTimer() { /* ... (same as previous) ... */
    if (timerInterval) return; if (timerStartBtn) timerStartBtn.style.display = 'none'; if (timerPauseBtn) timerPauseBtn.style.display = 'inline-block';
    timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000);
}
function pauseTimer() { /* ... (same as previous) ... */
    clearInterval(timerInterval); timerInterval = null; if (timerStartBtn) timerStartBtn.style.display = 'inline-block'; if (timerPauseBtn) timerPauseBtn.style.display = 'none';
}
function stopTimer() { /* ... (same as previous) ... */
    clearInterval(timerInterval); timerInterval = null; if (timerStartBtn) timerStartBtn.style.display = 'inline-block'; if (timerPauseBtn) timerPauseBtn.style.display = 'none';
}
function resetTimerDisplay() { /* ... (same as previous) ... */ timerSeconds = 0; updateTimerDisplay(); }
function checkPersistedLogin() { /* ... (same as previous) ... */
    const persistedId = localStorage.getItem('fitflow_current_client_id'); const persistedName = localStorage.getItem('fitflow_current_client_name');
    if (persistedId && persistedName) { currentClientId = persistedId; currentClientName = persistedName; showDashboardView(); } else { showLoginView(); }
}

// --- Event Handlers for Click Delegation ---
function handleDashboardClicks(e) {
    const startButton = e.target.closest('.start-workout-btn');
    const resumeButton = e.target.closest('.resume-workout-btn');
    const viewCompletedButton = e.target.closest('.view-completed-workout-btn');

    if (startButton) { startOrResumeWorkoutSession(startButton.dataset.assignmentId); }
    else if (resumeButton) { startOrResumeWorkoutSession(resumeButton.dataset.assignmentId); }
    else if (viewCompletedButton) { viewCompletedWorkoutDetails(viewCompletedButton.dataset.assignmentId); }
}

// --- INITIALIZE APP ---
function initializeClientApp() {
    bodyElement = document.body; clientThemeSwitcher = document.getElementById('clientThemeSwitcher'); pageTitleElement = document.getElementById('pageTitle');
    loginView = document.getElementById('loginView'); dashboardView = document.getElementById('dashboardView'); clientSelect = document.getElementById('clientSelect'); clientLoginForm = document.getElementById('clientLoginForm');
    welcomeMessageElement = document.getElementById('welcomeMessage'); assignedWorkoutsContainer = document.getElementById('assignedWorkoutsContainer'); logoutBtn = document.getElementById('logoutBtn');
    workoutSessionModal = document.getElementById('workoutSessionModal'); workoutSessionModalTitle = document.getElementById('workoutSessionModalTitle'); workoutSessionModalBody = document.getElementById('workoutSessionModalBody');
    prevExerciseBtn = document.getElementById('prevExerciseBtn'); nextExerciseBtn = document.getElementById('nextExerciseBtn'); exerciseProgressIndicator = document.getElementById('exerciseProgressIndicator'); finishWorkoutBtn = document.getElementById('finishWorkoutBtn');
    timerDisplay = document.getElementById('timerDisplay'); timerStartBtn = document.getElementById('timerStartBtn'); timerPauseBtn = document.getElementById('timerPauseBtn'); timerResetBtn = document.getElementById('timerResetBtn');

    loadDataFromStorage(); populateClientSelect();

    if (clientThemeSwitcher && bodyElement) {
        initializeThemeSwitcher( themesForClientApp, clientThemeSwitcher, bodyElement,
            (newThemeValue) => { if (workoutSessionModal) { themesForClientApp.forEach(t => { if (workoutSessionModal.classList.contains(t.value)) { workoutSessionModal.classList.remove(t.value); }}); workoutSessionModal.classList.add(newThemeValue);}}
        );
    } else if (themesForClientApp.length > 0 && bodyElement) {  /* ... (fallback theming) ... */
        bodyElement.className = ''; bodyElement.classList.add(themesForClientApp[0].value); bodyElement.style.backgroundColor = 'var(--background-color)'; bodyElement.style.color = 'var(--text-color)';
        if (workoutSessionModal) workoutSessionModal.classList.add(themesForClientApp[0].value);
    }
    
    initializeModals();

    if (clientLoginForm) clientLoginForm.addEventListener('submit', handleClientLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (assignedWorkoutsContainer) assignedWorkoutsContainer.addEventListener('click', handleDashboardClicks);
    
    if(workoutSessionModalBody) workoutSessionModalBody.addEventListener('input', handleWorkoutSessionDataChange);
    if(prevExerciseBtn) prevExerciseBtn.addEventListener('click', () => navigateExercise('prev'));
    if(nextExerciseBtn) nextExerciseBtn.addEventListener('click', () => navigateExercise('next'));
    if(finishWorkoutBtn) finishWorkoutBtn.addEventListener('click', finishWorkout);

    if(timerStartBtn) timerStartBtn.addEventListener('click', startTimer);
    if(timerPauseBtn) timerPauseBtn.addEventListener('click', pauseTimer);
    if(timerResetBtn) timerResetBtn.addEventListener('click', () => { stopTimer(); resetTimerDisplay(); });

    checkPersistedLogin();
    console.log("FitFlow Client App Initialized (MVP Expanded).");
}

document.addEventListener('DOMContentLoaded', initializeClientApp);
