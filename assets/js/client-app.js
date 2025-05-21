// assets/js/client-app.js

import { initializeThemeSwitcher } from './theme-switcher.js';
// Assuming modal.js is available if we use the modal for details
import { initializeModals, openModal, closeModal } from './components/modal.js'; 

// --- Local Storage Database Helper (Copied from mvp-app.js for consistency) ---
const DB_PREFIX = 'fitflow_mvp_';
const db = {
    read: (key) => {
        const data = localStorage.getItem(DB_PREFIX + key);
        if (!data) { return []; }
        try {
            const parsedData = JSON.parse(data);
            return Array.isArray(parsedData) ? parsedData : [];
        } catch (error) { console.error(`db.read error for ${key}:`, error); return []; }
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

// --- UI Elements ---
let bodyElement, clientThemeSwitcher, pageTitleElement;
let loginView, dashboardView, clientSelect, clientLoginForm;
let welcomeMessageElement, assignedWorkoutsContainer, logoutBtn;
// Modal elements (if used for details)
let workoutDetailModal, workoutDetailModalTitle, workoutDetailModalBody;


// Themes for client app (can be same or different from admin)
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
    console.log("Client App: Data loaded from storage", {allClients, allExercises, allTemplates, allAssignedWorkouts});
}

function populateClientSelect() {
    if (!clientSelect) return;
    clientSelect.innerHTML = '<option value="">-- Please Select --</option>'; // Reset
    allClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        clientSelect.appendChild(option);
    });
}

function handleClientLogin(e) {
    e.preventDefault();
    if (!clientSelect) return;
    const selectedId = clientSelect.value;
    if (!selectedId) {
        alert("Please select your profile.");
        return;
    }
    const client = allClients.find(c => c.id === selectedId);
    if (client) {
        currentClientId = client.id;
        currentClientName = client.name;
        localStorage.setItem('fitflow_current_client_id', currentClientId); // Persist login
        localStorage.setItem('fitflow_current_client_name', currentClientName);
        showDashboardView();
    } else {
        alert("Selected client profile not found. Please try again.");
    }
}

function handleLogout() {
    currentClientId = null;
    currentClientName = '';
    localStorage.removeItem('fitflow_current_client_id');
    localStorage.removeItem('fitflow_current_client_name');
    showLoginView();
}

function showLoginView() {
    if(loginView) loginView.classList.add('is-active');
    if(dashboardView) dashboardView.classList.remove('is-active');
    if(pageTitleElement) pageTitleElement.textContent = "Client Login";
    if(clientSelect) clientSelect.value = ""; // Reset dropdown
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

    const clientAssignments = allAssignedWorkouts
        .filter(aw => aw.clientId === currentClientId)
        .sort((a, b) => new Date(a.dateAssigned) - new Date(b.dateAssigned)); // Sort by date

    if (clientAssignments.length === 0) {
        assignedWorkoutsContainer.innerHTML = '<p class="text-muted">You have no workouts assigned yet. Contact your trainer!</p>';
        return;
    }

    assignedWorkoutsContainer.innerHTML = ''; // Clear previous
    clientAssignments.forEach(aw => {
        const template = allTemplates.find(t => t.id === aw.workoutTemplateId);
        if (!template) {
            console.warn(`Template ID ${aw.workoutTemplateId} not found for assignment ${aw.id}`);
            return;
        }

        const workoutCard = document.createElement('div');
        workoutCard.className = 'pt-card assigned-workout-item';
        
        let exercisesHTML = '<ul class="exercise-list">';
        template.exercises.forEach(exDetail => {
            const exerciseInfo = allExercises.find(ex => ex.id === exDetail.exerciseId);
            if (exerciseInfo) {
                exercisesHTML += `<li>
                    <strong>${exerciseInfo.name}</strong>: 
                    ${exDetail.sets || 'N/A'} sets, 
                    ${exDetail.reps || 'N/A'} reps, 
                    ${exDetail.rest ? exDetail.rest + 's rest' : 'N/A rest'}
                </li>`;
            }
        });
        exercisesHTML += '</ul>';

        workoutCard.innerHTML = `
            <h3 class="pt-card-title">${template.name} - Assigned: ${new Date(aw.dateAssigned).toLocaleDateString()}</h3>
            <div class="pt-card-content">
                ${exercisesHTML}
            </div>
            <div class="pt-card-footer" style="text-align:right;">
                <button class="pt-button pt-button--${aw.status === 'completed' ? 'secondary' : 'primary'} mark-complete-btn" data-assignment-id="${aw.id}" ${aw.status === 'completed' ? 'disabled' : ''}>
                    ${aw.status === 'completed' ? 'Completed' : 'Mark as Complete'}
                </button>
            </div>
        `;
        assignedWorkoutsContainer.appendChild(workoutCard);
    });
}

function handleMarkComplete(e) {
    if (!e.target.classList.contains('mark-complete-btn')) return;

    const assignmentId = e.target.dataset.assignmentId;
    const assignmentIndex = allAssignedWorkouts.findIndex(aw => aw.id === assignmentId);

    if (assignmentIndex > -1) {
        allAssignedWorkouts[assignmentIndex].status = 'completed';
        db.write('assignedWorkouts', allAssignedWorkouts); // Save back to Local Storage
        renderAssignedWorkoutsForClient(); // Re-render to update button state
        alert("Workout marked as completed!");
    }
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

// --- INITIALIZE APP ---
function initializeClientApp() {
    // Assign UI Elements
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

    // Load data
    loadDataFromStorage();
    populateClientSelect();

    // Initialize Theme Switcher
    if (clientThemeSwitcher && bodyElement) {
        initializeThemeSwitcher(
            themesForClientApp,
            clientThemeSwitcher,
            bodyElement, // Body is the main themed area
            (newThemeValue, currentThemeObject) => {
                // Callback to theme any other specific elements, like modals
                if (workoutDetailModal) {
                     themesForClientApp.forEach(t => {
                        if (workoutDetailModal.classList.contains(t.value)) {
                            workoutDetailModal.classList.remove(t.value);
                        }
                    });
                    workoutDetailModal.classList.add(newThemeValue);
                }
            }
        );
    } else if (themesForClientApp.length > 0 && bodyElement) { // Fallback if switcher element is missing
        bodyElement.className = ''; bodyElement.classList.add(themesForClientApp[0].value);
        bodyElement.style.backgroundColor = 'var(--background-color)'; bodyElement.style.color = 'var(--text-color)';
         if (workoutDetailModal) workoutDetailModal.classList.add(themesForClientApp[0].value);
    }
    
    // Initialize Modals (if any are used beyond the example)
    initializeModals();

    // Event Listeners
    if (clientLoginForm) clientLoginForm.addEventListener('submit', handleClientLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (assignedWorkoutsContainer) assignedWorkoutsContainer.addEventListener('click', handleMarkComplete);

    // Check for persisted login state
    checkPersistedLogin();

    console.log("FitFlow Client App Initialized.");
}

document.addEventListener('DOMContentLoaded', initializeClientApp);
