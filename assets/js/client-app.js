// assets/js/client-app.js

import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeModals, openModal, closeModal } from './components/modal.js'; 

// --- Local Storage Database Helper ---
const DB_PREFIX = 'fitflow_mvp_';
const db = {
    read: (key) => {
        const data = localStorage.getItem(DB_PREFIX + key);
        if (!data) { return []; }
        try { const parsedData = JSON.parse(data); return Array.isArray(parsedData) ? parsedData : []; }
        catch (error) { console.error(`db.read error for ${key}:`, error); return []; }
    },
    write: (key, data) => {
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
let activeWorkoutDetail = null; // Store data of the workout being viewed in modal

// Timer State
let timerInterval = null;
let timerSeconds = 0;

// --- UI Elements ---
let bodyElement, clientThemeSwitcher, pageTitleElement;
let loginView, dashboardView, clientSelect, clientLoginForm;
let welcomeMessageElement, assignedWorkoutsContainer, logoutBtn;
let workoutDetailModal, workoutDetailModalTitle, workoutDetailModalBody;
let timerDisplay, timerStartBtn, timerPauseBtn, timerResetBtn;

const themesForClientApp = [ 
    { value: 'theme-modern-professional', name: 'Modern & Professional' },
    { value: 'theme-friendly-supportive', name: 'Friendly & Supportive' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist' },
    { value: 'theme-retro-funk', name: 'Retro Funk' }, 
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance' },
    { value: 'theme-urban-grit', name: 'Urban Grit' },
    { value: 'theme-playful-pop', name: 'Playful Pop' },
    { value: 'theme-tech-data', name: 'Tech Data' }
];

// --- FUNCTIONS ---

function loadDataFromStorage() {
    allClients = db.read('clients');
    allExercises = db.read('exercises');
    allTemplates = db.read('workoutTemplates');
    allAssignedWorkouts = db.read('assignedWorkouts');
}

function populateClientSelect() {
    if (!clientSelect) return;
    clientSelect.innerHTML = '<option value="">-- Please Select --</option>';
    allClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id; option.textContent = client.name;
        clientSelect.appendChild(option);
    });
}

function handleClientLogin(e) {
    e.preventDefault(); if (!clientSelect) return;
    const selectedId = clientSelect.value; if (!selectedId) { alert("Please select your profile."); return; }
    const client = allClients.find(c => c.id === selectedId);
    if (client) {
        currentClientId = client.id; currentClientName = client.name;
        localStorage.setItem('fitflow_current_client_id', currentClientId);
        localStorage.setItem('fitflow_current_client_name', currentClientName);
        showDashboardView();
    } else { alert("Selected client profile not found."); }
}

function handleLogout() {
    currentClientId = null; currentClientName = '';
    localStorage.removeItem('fitflow_current_client_id');
    localStorage.removeItem('fitflow_current_client_name');
    stopTimer(); resetTimerDisplay(); // Stop and reset timer on logout
    showLoginView();
}

function showLoginView() {
    if(loginView) loginView.classList.add('is-active');
    if(dashboardView) dashboardView.classList.remove('is-active');
    if(pageTitleElement) pageTitleElement.textContent = "Client Login";
    if(clientSelect) clientSelect.value = "";
}

function showDashboardView() {
    if(loginView) loginView.classList.remove('is-active');
    if(dashboardView) dashboardView.classList.add('is-active');
    if(pageTitleElement) pageTitleElement.textContent = "My Workouts";
    if(welcomeMessageElement) welcomeMessageElement.textContent = `Welcome, ${currentClientName}! Here are your workouts:`;
    renderAssignedWorkoutsForClient();
}

function renderAssignedWorkoutsForClient() {
    if (!assignedWorkoutsContainer || !currentClientId) {
        if (assignedWorkoutsContainer) assignedWorkoutsContainer.innerHTML = '<p class="text-muted">Could not load workouts. Please log in again.</p>';
        return;
    }
    const clientAssignments = allAssignedWorkouts.filter(aw => aw.clientId === currentClientId).sort((a, b) => new Date(a.dateAssigned) - new Date(b.dateAssigned));
    if (clientAssignments.length === 0) {
        assignedWorkoutsContainer.innerHTML = '<p class="text-muted">You have no workouts assigned yet. Contact your trainer!</p>';
        return;
    }
    assignedWorkoutsContainer.innerHTML = '';
    clientAssignments.forEach(aw => {
        const template = allTemplates.find(t => t.id === aw.workoutTemplateId);
        if (!template) { console.warn(`Template ID ${aw.workoutTemplateId} not found for assignment ${aw.id}`); return; }
        const workoutCard = document.createElement('div');
        workoutCard.className = 'pt-card assigned-workout-item';
        workoutCard.innerHTML = `
            <h3 class="pt-card-title">${template.name} - Assigned: ${new Date(aw.dateAssigned).toLocaleDateString()}</h3>
            <p class="text-muted">Status: ${aw.status}</p>
            <div class="pt-card-footer">
                <button class="pt-button pt-button--secondary pt-button--small view-workout-details-btn" data-assignment-id="${aw.id}">View Details</button>
                <button class="pt-button pt-button--${aw.status === 'completed' ? 'secondary' : 'primary'} mark-complete-btn" data-assignment-id="${aw.id}" ${aw.status === 'completed' ? 'disabled' : ''}>
                    ${aw.status === 'completed' ? 'Completed' : 'Mark as Complete'}
                </button>
            </div>
        `;
        assignedWorkoutsContainer.appendChild(workoutCard);
    });
}

function handleMarkComplete(assignmentId) { // Modified to take ID directly
    const assignmentIndex = allAssignedWorkouts.findIndex(aw => aw.id === assignmentId);
    if (assignmentIndex > -1) {
        allAssignedWorkouts[assignmentIndex].status = 'completed';
        db.write('assignedWorkouts', allAssignedWorkouts);
        renderAssignedWorkoutsForClient();
        alert("Workout marked as completed!");
    }
}

function openWorkoutDetailModal(assignmentId) {
    const assignment = allAssignedWorkouts.find(aw => aw.id === assignmentId);
    if (!assignment) { console.error("Assignment not found for details modal."); return; }
    const template = allTemplates.find(t => t.id === assignment.workoutTemplateId);
    if (!template) { console.error("Template not found for assignment."); return; }

    activeWorkoutDetail = { assignment, template }; // Store for reference

    if (!workoutDetailModalTitle || !workoutDetailModalBody || !workoutDetailModal) {
        console.error("Modal elements for workout detail not found."); return;
    }

    workoutDetailModalTitle.textContent = `${template.name} (Assigned: ${new Date(assignment.dateAssigned).toLocaleDateString()})`;
    
    let bodyHtml = '';
    template.exercises.forEach((exDetail, index) => {
        const exerciseInfo = allExercises.find(ex => ex.id === exDetail.exerciseId);
        if (exerciseInfo) {
            bodyHtml += `<div class="exercise-detail-item">
                <h4>${exerciseInfo.name}</h4>
                <p class="target-metrics">Target: ${exDetail.sets || 'N/A'} sets of ${exDetail.reps || 'N/A'} reps. Rest: ${exDetail.rest ? exDetail.rest + 's' : 'N/A'}</p>`;
            
            // Add input fields for each set
            const numSets = parseInt(exDetail.sets) || 1; // Default to 1 set if not specified or invalid
            for (let i = 0; i < numSets; i++) {
                bodyHtml += `
                <div class="exercise-set-tracking">
                    <label for="ex-${index}-set-${i+1}-reps">Set ${i+1}:</label>
                    <input type="number" id="ex-${index}-set-${i+1}-reps" class="pt-input" placeholder="Reps">
                    <input type="number" id="ex-${index}-set-${i+1}-weight" class="pt-input" placeholder="Weight (kg/lb)">
                </div>`;
            }
            bodyHtml += `</div>`;
        }
    });
    workoutDetailModalBody.innerHTML = bodyHtml;
    stopTimer(); resetTimerDisplay(); // Reset timer when opening a new detail view
    openModal(workoutDetailModal);
}

// --- Timer Functions ---
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    if (timerDisplay) timerDisplay.textContent = formatTime(timerSeconds);
}

function startTimer() {
    if (timerInterval) return; // Already running
    if (timerStartBtn) timerStartBtn.style.display = 'none';
    if (timerPauseBtn) timerPauseBtn.style.display = 'inline-block';
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    if (timerStartBtn) timerStartBtn.style.display = 'inline-block';
    if (timerPauseBtn) timerPauseBtn.style.display = 'none';
}

function stopTimer() { // Also used by reset
    clearInterval(timerInterval);
    timerInterval = null;
    if (timerStartBtn) timerStartBtn.style.display = 'inline-block';
    if (timerPauseBtn) timerPauseBtn.style.display = 'none';
}

function resetTimerDisplay() {
    timerSeconds = 0;
    updateTimerDisplay();
}


function checkPersistedLogin() {
    const persistedId = localStorage.getItem('fitflow_current_client_id');
    const persistedName = localStorage.getItem('fitflow_current_client_name');
    if (persistedId && persistedName) {
        currentClientId = persistedId;
        currentClientName = persistedName;
        showDashboardView();
    } else {
        showLoginView();
    }
}

// --- Event Handlers for Click Delegation ---
function handleDashboardClicks(e) {
    const markCompleteButton = e.target.closest('.mark-complete-btn');
    const viewDetailsButton = e.target.closest('.view-workout-details-btn');

    if (markCompleteButton) {
        const assignmentId = markCompleteButton.dataset.assignmentId;
        handleMarkComplete(assignmentId);
    } else if (viewDetailsButton) {
        const assignmentId = viewDetailsButton.dataset.assignmentId;
        openWorkoutDetailModal(assignmentId);
    }
}

// --- INITIALIZE APP ---
function initializeClientApp() {
    bodyElement = document.body;
    clientThemeSwitcher = document.getElementById('clientThemeSwitcher');
    pageTitleElement = document.getElementById('pageTitle');
    loginView = document.getElementById('loginView');
    dashboardView = document.getElementById('dashboardView');
    clientSelect = document.getElementById('clientSelect');
    clientLoginForm = document.getElementById('clientLoginForm');
    welcomeMessageElement = document.getElementById('welcomeMessage');
    assignedWorkoutsContainer = document.getElementById('assignedWorkoutsContainer');
    logoutBtn = document.getElementById('logoutBtn');
    workoutDetailModal = document.getElementById('workoutDetailModal');
    workoutDetailModalTitle = document.getElementById('workoutDetailModalTitle');
    workoutDetailModalBody = document.getElementById('workoutDetailModalBody');
    timerDisplay = document.getElementById('timerDisplay');
    timerStartBtn = document.getElementById('timerStartBtn');
    timerPauseBtn = document.getElementById('timerPauseBtn');
    timerResetBtn = document.getElementById('timerResetBtn');

    loadDataFromStorage();
    populateClientSelect();

    if (clientThemeSwitcher && bodyElement) {
        initializeThemeSwitcher( themesForClientApp, clientThemeSwitcher, bodyElement,
            (newThemeValue, currentThemeObject) => {
                if (workoutDetailModal) {
                     themesForClientApp.forEach(t => { if (workoutDetailModal.classList.contains(t.value)) { workoutDetailModal.classList.remove(t.value); }});
                    workoutDetailModal.classList.add(newThemeValue);
                }
            }
        );
    } else if (themesForClientApp.length > 0 && bodyElement) { 
        bodyElement.className = ''; bodyElement.classList.add(themesForClientApp[0].value);
        bodyElement.style.backgroundColor = 'var(--background-color)'; bodyElement.style.color = 'var(--text-color)';
         if (workoutDetailModal) workoutDetailModal.classList.add(themesForClientApp[0].value);
    }
    
    initializeModals();

    if (clientLoginForm) clientLoginForm.addEventListener('submit', handleClientLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (assignedWorkoutsContainer) assignedWorkoutsContainer.addEventListener('click', handleDashboardClicks);
    
    // Timer Buttons
    if(timerStartBtn) timerStartBtn.addEventListener('click', startTimer);
    if(timerPauseBtn) timerPauseBtn.addEventListener('click', pauseTimer);
    if(timerResetBtn) timerResetBtn.addEventListener('click', () => { stopTimer(); resetTimerDisplay(); });


    checkPersistedLogin();
    // console.log("FitFlow Client App Initialized.");
}

document.addEventListener('DOMContentLoaded', initializeClientApp);
