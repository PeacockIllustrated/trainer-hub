// assets/js/client-app.js
import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeModals, openModal, closeModal } from './components/modal.js';
import { FITFLOW_THEMES_CONFIG } from './themes-config.js';
import { dataService } from './data-service.js';

// --- State ---
let currentClient = null; // Will hold the full client object {id, name, email, trainerId, ...}
let exercises = [];
let templates = [];
let assignedWorkouts = [];
let currentWorkoutSession = {
    assignmentId: null,
    template: null,
    currentExerciseIndex: 0,
    exerciseData: [] // This is the live progress
};
let timerInterval = null;
let timerSeconds = 0;

// --- UI Elements ---
let bodyElement, clientThemeSwitcher, pageTitleElement;
let loginView, dashboardView, clientEmailInput, clientLoginForm;
let welcomeMessageElement, assignedWorkoutsContainer, logoutBtn;
let workoutSessionModal, workoutSessionModalTitle, workoutSessionModalBody;
let prevExerciseBtn, nextExerciseBtn, exerciseProgressIndicator, finishWorkoutBtn;
let timerDisplay, timerStartBtn, timerPauseBtn, timerResetBtn;
let workoutSessionModalCloseFooterBtn;

// --- AUTH & DATA LOGIC ---

async function handleClientLogin(e) {
    e.preventDefault();
    const email = clientEmailInput.value.trim();
    if (!email) {
        alert("Please enter your email address.");
        return;
    }

    try {
        const client = await dataService.getClientByEmail(email);
        if (client) {
            currentClient = client;
            // Use sessionStorage to keep user logged in during the session
            sessionStorage.setItem('fitflow_current_client', JSON.stringify(client));
            await loadDataAndShowDashboard();
        } else {
            alert("No client profile found for this email address. Please contact your trainer.");
        }
    } catch (error) {
        console.error("Login failed:", error);
        alert("An error occurred during login. Please try again.");
    }
}

function handleLogout() {
    currentClient = null;
    sessionStorage.removeItem('fitflow_current_client');
    stopTimer();
    resetTimerDisplay();
    showLoginView();
}

async function checkPersistedLogin() {
    const persistedClientJSON = sessionStorage.getItem('fitflow_current_client');
    if (persistedClientJSON) {
        currentClient = JSON.parse(persistedClientJSON);
        if (currentClient && currentClient.id) {
            await loadDataAndShowDashboard();
        } else {
            showLoginView();
        }
    } else {
        showLoginView();
    }
}

async function loadDataAndShowDashboard() {
    if (!currentClient || !currentClient.trainerId) {
        console.error("Cannot load data, no valid client or trainerId.");
        handleLogout();
        return;
    }

    try {
        // Fetch all data required for the client dashboard
        const [loadedExercises, loadedTemplates, loadedAssignments] = await Promise.all([
            dataService.getExercises(currentClient.trainerId),
            dataService.getWorkoutTemplates(currentClient.trainerId),
            dataService.getAssignedWorkoutsForClient(currentClient.id)
        ]);

        exercises = loadedExercises;
        templates = loadedTemplates;
        assignedWorkouts = loadedAssignments;

        showDashboardView();
    } catch (error) {
        console.error("Failed to load dashboard data:", error);
        alert("Could not load your workout data. Please try refreshing.");
    }
}


// --- VIEW MANAGEMENT ---

function showLoginView() {
    if (loginView) loginView.classList.add('is-active');
    if (dashboardView) dashboardView.classList.remove('is-active');
    if (pageTitleElement) pageTitleElement.textContent = "Client Login";
    if (clientEmailInput) clientEmailInput.value = "";
}

function showDashboardView() {
    if (loginView) loginView.classList.remove('is-active');
    if (dashboardView) dashboardView.classList.add('is-active');
    if (pageTitleElement) pageTitleElement.textContent = "My Workouts";
    if (welcomeMessageElement) welcomeMessageElement.textContent = `Welcome, ${currentClient.name}!`;
    renderAssignedWorkoutsForClient();
}

// --- RENDERING FUNCTIONS ---

function renderAssignedWorkoutsForClient() {
    if (!assignedWorkoutsContainer || !currentClient) {
        if (assignedWorkoutsContainer) assignedWorkoutsContainer.innerHTML = '<p class="text-muted">No workouts found.</p>';
        return;
    }

    const sortedAssignments = [...assignedWorkouts].sort((a, b) => new Date(b.dateAssigned) - new Date(a.dateAssigned));

    if (sortedAssignments.length === 0) {
        assignedWorkoutsContainer.innerHTML = '<p class="text-muted">You have no workouts assigned. Contact your trainer!</p>';
        return;
    }

    assignedWorkoutsContainer.innerHTML = '';
    sortedAssignments.forEach(aw => {
        const template = templates.find(t => t.id === aw.workoutTemplateId);
        if (!template) return; // Skip if template not found

        const card = document.createElement('div');
        card.className = 'pt-card assigned-workout-item';
        let btnHTML = '';
        if (aw.status === 'completed') {
            btnHTML = `<button class="pt-button pt-button--secondary pt-button--small view-completed-workout-btn" data-assignment-id="${aw.id}">View Summary</button>`;
        } else if (aw.status === 'in progress') {
            btnHTML = `<button class="pt-button pt-button--primary resume-workout-btn" data-assignment-id="${aw.id}">Resume Workout</button>`;
        } else {
            btnHTML = `<button class="pt-button pt-button--primary start-workout-btn" data-assignment-id="${aw.id}">Start Workout</button>`;
        }
        card.innerHTML = `<h3 class="pt-card-title">${template.name} - ${new Date(aw.dateAssigned).toLocaleDateString()}</h3><p class="text-muted">Status: <span style="text-transform:capitalize;">${aw.status}</span></p><div class="pt-card-footer">${btnHTML}</div>`;
        assignedWorkoutsContainer.appendChild(card);
    });
}

// --- WORKOUT SESSION LOGIC ---

async function startOrResumeWorkoutSession(id) {
    const assignment = assignedWorkouts.find(aw => aw.id === id);
    if (!assignment) return;
    const template = templates.find(t => t.id === assignment.workoutTemplateId);
    if (!template) return;

    currentWorkoutSession.assignmentId = id;
    currentWorkoutSession.template = template;
    currentWorkoutSession.currentExerciseIndex = 0;

    // Check for saved progress in Firestore
    const savedProgress = await dataService.getWorkoutProgress(id);

    if (savedProgress && assignment.status === 'in progress') {
        currentWorkoutSession.exerciseData = savedProgress;
    } else {
        // Create a fresh session structure
        currentWorkoutSession.exerciseData = template.exercises.map(exD => ({
            exerciseId: exD.exerciseId,
            targetSets: exD.sets,
            targetReps: exD.reps,
            targetRest: exD.rest,
            setsData: Array(parseInt(exD.sets, 10) || 1).fill(null).map(() => ({ reps: '', weight: '', done: false }))
        }));
        // If starting fresh, update status to 'in progress'
        if (assignment.status === 'pending') {
            assignment.status = 'in progress';
            await dataService.updateAssignment(id, { status: 'in progress' });
            renderAssignedWorkoutsForClient(); // Re-render to show new status
        }
    }

    if (!workoutSessionModalTitle || !workoutSessionModalBody || !workoutSessionModal) return;
    workoutSessionModalTitle.textContent = `${template.name} - In Progress`;
    const nav = workoutSessionModal.querySelector('.workout-session-nav'), timer = workoutSessionModal.querySelector('.workout-timer');
    if (nav) nav.style.display = 'flex';
    if (timer) timer.style.display = 'block';
    if (finishWorkoutBtn) finishWorkoutBtn.style.display = 'inline-block';
    if (workoutSessionModalCloseFooterBtn) workoutSessionModalCloseFooterBtn.textContent = 'Save & Close Later';

    renderCurrentExerciseInModal();
    stopTimer();
    resetTimerDisplay();
    openModal('workoutSessionModal');
}

function renderCurrentExerciseInModal() {
    if (!currentWorkoutSession.template || !workoutSessionModalBody) return;
    const exDetail = currentWorkoutSession.template.exercises[currentWorkoutSession.currentExerciseIndex];
    const exInfo = exercises.find(ex => ex.id === exDetail.exerciseId);
    const sessionExData = currentWorkoutSession.exerciseData[currentWorkoutSession.currentExerciseIndex];

    if (!exInfo || !sessionExData) {
        workoutSessionModalBody.innerHTML = "<p class=\"text-muted\">Error loading exercise details.</p>";
        return;
    }

    let html = `<div class="exercise-session-item is-active" data-exercise-id="${exInfo.id}"><h4>${exInfo.name}</h4><p class="target-metrics">Target: ${exDetail.sets || 'N/A'} sets x ${exDetail.reps || 'N/A'} reps. Rest: ${exDetail.rest ? `${exDetail.rest}s` : 'N/A'}</p>`;
    sessionExData.setsData.forEach((setD, setIdx) => {
        html += `<div class="set-tracking-row"><label for="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIdx}-reps">Set ${setIdx + 1}:</label><input type="number" id="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIdx}-reps" class="pt-input actual-reps-input" data-set-index="${setIdx}" value="${setD.reps || ''}" placeholder="Reps"><input type="number" id="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIdx}-weight" class="pt-input actual-weight-input" data-set-index="${setIdx}" value="${setD.weight || ''}" placeholder="Weight"><input type="checkbox" id="ex-${currentWorkoutSession.currentExerciseIndex}-set-${setIdx}-done" class="set-done-checkbox" data-set-index="${setIdx}" ${setD.done ? 'checked' : ''}></div>`;
    });
    html += `</div>`;
    workoutSessionModalBody.innerHTML = html;
    updateWorkoutSessionNav();
}

function updateWorkoutSessionNav() {
    if (!prevExerciseBtn || !nextExerciseBtn || !exerciseProgressIndicator || !currentWorkoutSession.template) return;
    const total = currentWorkoutSession.template.exercises.length;
    prevExerciseBtn.disabled = currentWorkoutSession.currentExerciseIndex === 0;
    nextExerciseBtn.disabled = currentWorkoutSession.currentExerciseIndex >= total - 1;
    exerciseProgressIndicator.textContent = `Exercise ${currentWorkoutSession.currentExerciseIndex + 1} of ${total}`;
}

async function handleWorkoutSessionDataChange(e) {
    if (!e.target.matches('.actual-reps-input,.actual-weight-input,.set-done-checkbox')) return;

    const setIdx = parseInt(e.target.dataset.setIndex, 10);
    const exData = currentWorkoutSession.exerciseData[currentWorkoutSession.currentExerciseIndex];
    if (!exData || !exData.setsData[setIdx]) return;

    if (e.target.classList.contains('actual-reps-input')) exData.setsData[setIdx].reps = e.target.value;
    else if (e.target.classList.contains('actual-weight-input')) exData.setsData[setIdx].weight = e.target.value;
    else if (e.target.classList.contains('set-done-checkbox')) exData.setsData[setIdx].done = e.target.checked;

    // Save progress to Firestore
    await dataService.saveWorkoutProgress(currentWorkoutSession.assignmentId, currentWorkoutSession.exerciseData, currentClient.id, currentClient.trainerId);
}

function navigateExercise(dir) {
    const total = currentWorkoutSession.template.exercises.length;
    if (dir === 'next' && currentWorkoutSession.currentExerciseIndex < total - 1) currentWorkoutSession.currentExerciseIndex++;
    else if (dir === 'prev' && currentWorkoutSession.currentExerciseIndex > 0) currentWorkoutSession.currentExerciseIndex--;
    renderCurrentExerciseInModal();
}

async function finishWorkout() {
    if (!currentWorkoutSession.assignmentId) return;
    const assignment = assignedWorkouts.find(aw => aw.id === currentWorkoutSession.assignmentId);
    if (assignment) {
        try {
            // Update assignment status to 'completed'
            await dataService.updateAssignment(assignment.id, { status: 'completed' });
            // Delete the temporary progress data
            await dataService.deleteWorkoutProgress(assignment.id);

            // Update local state and UI
            assignment.status = 'completed';
            renderAssignedWorkoutsForClient();
            closeModal('workoutSessionModal');
            alert("Workout Finished! Great job!");
        } catch (error) {
            console.error("Error finishing workout:", error);
            alert("There was an error saving your workout. Please try again.");
        }
    }
    // Reset session state
    currentWorkoutSession = { assignmentId: null, template: null, currentExerciseIndex: 0, exerciseData: [] };
}

function viewCompletedWorkoutDetails(id) {
    const assignment = assignedWorkouts.find(aw => aw.id === id);
    if (!assignment) return;
    const template = templates.find(t => t.id === assignment.workoutTemplateId);
    if (!template) return;

    if (!workoutSessionModalTitle || !workoutSessionModalBody || !workoutSessionModal) return;
    workoutSessionModalTitle.textContent = `${template.name} - Completed Summary`;
    let html = '<p>This is a summary of the planned workout. Future versions will show your actual performance data.</p>';
    template.exercises.forEach(exD => {
        const exInfo = exercises.find(ex => ex.id === exD.exerciseId);
        if (exInfo) html += `<div class="exercise-detail-item" style="padding-bottom: var(--spacing-sm); margin-bottom: var(--spacing-sm); border-bottom: 1px dashed var(--border-color-light);"><h4>${exInfo.name}</h4><p class="target-metrics">Target: ${exD.sets || 'N/A'} sets x ${exD.reps || 'N/A'} reps. Rest: ${exD.rest ? exD.rest + 's' : 'N/A'}</p></div>`;
    });
    workoutSessionModalBody.innerHTML = html;

    const nav = workoutSessionModal.querySelector('.workout-session-nav'), timer = workoutSessionModal.querySelector('.workout-timer');
    if (nav) nav.style.display = 'none';
    if (timer) timer.style.display = 'none';
    if (finishWorkoutBtn) finishWorkoutBtn.style.display = 'none';
    if (workoutSessionModalCloseFooterBtn) workoutSessionModalCloseFooterBtn.textContent = 'Close';
    openModal('workoutSessionModal');
}

// --- TIMER & MISC UI ---
function formatTime(s) { const m = Math.floor(s / 60); const sec = s % 60; return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; }
function updateTimerDisplay() { if (timerDisplay) timerDisplay.textContent = formatTime(timerSeconds); }
function startTimer() { if (timerInterval) return; if (timerStartBtn) timerStartBtn.style.display = 'none'; if (timerPauseBtn) timerPauseBtn.style.display = 'inline-block'; timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000); }
function pauseTimer() { clearInterval(timerInterval); timerInterval = null; if (timerStartBtn) timerStartBtn.style.display = 'inline-block'; if (timerPauseBtn) timerPauseBtn.style.display = 'none'; }
function stopTimer() { clearInterval(timerInterval); timerInterval = null; if (timerStartBtn) timerStartBtn.style.display = 'inline-block'; if (timerPauseBtn) timerPauseBtn.style.display = 'none'; }
function resetTimerDisplay() { timerSeconds = 0; updateTimerDisplay(); }

function handleDashboardClicks(e) {
    const startBtn = e.target.closest('.start-workout-btn');
    const resumeBtn = e.target.closest('.resume-workout-btn');
    const viewBtn = e.target.closest('.view-completed-workout-btn');
    if (startBtn) startOrResumeWorkoutSession(startBtn.dataset.assignmentId);
    else if (resumeBtn) startOrResumeWorkoutSession(resumeBtn.dataset.assignmentId);
    else if (viewBtn) viewCompletedWorkoutDetails(viewBtn.dataset.assignmentId);
}

// --- INITIALIZATION ---
function initializeClientApp() {
    bodyElement = document.body;
    clientThemeSwitcher = document.getElementById('clientThemeSwitcher');
    pageTitleElement = document.getElementById('pageTitle');
    loginView = document.getElementById('loginView');
    dashboardView = document.getElementById('dashboardView');
    clientEmailInput = document.getElementById('clientEmail');
    clientLoginForm = document.getElementById('clientLoginForm');
    welcomeMessageElement = document.getElementById('welcomeMessage');
    assignedWorkoutsContainer = document.getElementById('assignedWorkoutsContainer');
    logoutBtn = document.getElementById('logoutBtn');
    workoutSessionModal = document.getElementById('workoutSessionModal');
    workoutSessionModalTitle = document.getElementById('workoutSessionModalTitle');
    workoutSessionModalBody = document.getElementById('workoutSessionModalBody');
    prevExerciseBtn = document.getElementById('prevExerciseBtn');
    nextExerciseBtn = document.getElementById('nextExerciseBtn');
    exerciseProgressIndicator = document.getElementById('exerciseProgressIndicator');
    finishWorkoutBtn = document.getElementById('finishWorkoutBtn');
    timerDisplay = document.getElementById('timerDisplay');
    timerStartBtn = document.getElementById('timerStartBtn');
    timerPauseBtn = document.getElementById('timerPauseBtn');
    timerResetBtn = document.getElementById('timerResetBtn');
    workoutSessionModalCloseFooterBtn = workoutSessionModal ? workoutSessionModal.querySelector('.pt-modal__close-footer') : null;

    if (clientThemeSwitcher && bodyElement) {
        initializeThemeSwitcher(
            FITFLOW_THEMES_CONFIG,
            clientThemeSwitcher,
            document.body,
            (newThemeValue) => {
                if (workoutSessionModal) {
                    FITFLOW_THEMES_CONFIG.forEach(t => { if (workoutSessionModal.classList.contains(t.value)) { workoutSessionModal.classList.remove(t.value); } });
                    workoutSessionModal.classList.add(newThemeValue);
                }
            },
            'fitflowGlobalTheme'
        );
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
