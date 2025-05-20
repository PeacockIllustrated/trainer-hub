// assets/js/mvp-app.js

import { initializeThemeSwitcher } from './theme-switcher.js';
// We are not importing component-specific JS like modal.js here, 
// as the MVP page has its modal logic self-contained for now for simplicity.
// If modal.js, stepper.js etc. were generic enough, we could import them.

// --- Local Storage Database Helper ---
const DB_PREFIX = 'fitflow_mvp_';
const db = {
    read: (key) => { const data = localStorage.getItem(DB_PREFIX + key); return data ? JSON.parse(data) : []; },
    write: (key, data) => { localStorage.setItem(DB_PREFIX + key, JSON.stringify(data)); },
    generateId: () => '_' + Math.random().toString(36).substr(2, 9)
};

// --- State & Initial Data ---
let clients = db.read('clients');
let exercises = db.read('exercises');
let workoutTemplates = db.read('workoutTemplates');
let assignedWorkouts = db.read('assignedWorkouts');

// --- UI Elements ---
const bodyElement = document.body; // For global theme application
const viewSections = document.querySelectorAll('.view-section');
const navLinks = document.querySelectorAll('.pt-sidebar__nav-link');

// Theme Switcher elements for this page
const mvpThemeSwitcherElement = document.getElementById('mvpThemeSwitcher');
// const mvpThemedArea = document.body; // We'll theme the whole body for the MVP app page

const themesForMvp = [
    { value: 'theme-modern-professional', name: 'Modern & Professional', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-friendly-supportive', name: 'Friendly & Supportive', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-urban-grit', name: 'Urban Grit & Steel', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-playful-pop', name: 'Playful & Vibrant Pop', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-tech-data', name: 'Tech & Data Driven', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-retro-funk', name: 'Retro Funk', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' }
];

// Modals
const addEditClientModal = document.getElementById('addEditClientModal');
const confirmModal = document.getElementById('confirmModal');
const createEditTemplateModal = document.getElementById('createEditTemplateModal');

// Client Management
const clientListContainer = document.getElementById('clientListContainer');
const noClientsMessage = document.getElementById('noClientsMessage');
const clientModalTitle = document.getElementById('clientModalTitle');
const clientForm = document.getElementById('clientForm');
const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');

// Exercise Management (ensure these IDs are correct in your HTML)
const exerciseForm = document.getElementById('exerciseForm');
const exerciseIdInput = document.getElementById('exerciseId');
const exerciseNameInput = document.getElementById('exerciseName');
const exerciseDescriptionInput = document.getElementById('exerciseDescription');
const exerciseMuscleGroupInput = document.getElementById('exerciseMuscleGroup');
const exerciseListContainer = document.getElementById('exerciseListContainer');
const noExercisesMessage = document.getElementById('noExercisesMessage');
const cancelEditExerciseBtn = document.getElementById('cancelEditExerciseBtn');

// Workout Template Management
const openCreateTemplateModalBtn = document.getElementById('openCreateTemplateModalBtn');
const templateModalTitle = document.getElementById('templateModalTitle');
const workoutTemplateForm = document.getElementById('workoutTemplateForm');
const workoutTemplateIdInput = document.getElementById('workoutTemplateId');
const templateNameInput = document.getElementById('templateName');
const templateExerciseListDiv = document.getElementById('templateExerciseList');
const selectedExercisesForTemplateContainer = document.getElementById('selectedExercisesForTemplateContainer');
const workoutTemplateListContainer = document.getElementById('workoutTemplateListContainer');
const noWorkoutTemplatesMessage = document.getElementById('noWorkoutTemplatesMessage');

// Assign Workout Management
const assignWorkoutForm = document.getElementById('assignWorkoutForm');
const assignClientSelect = document.getElementById('assignClientSelect');
const assignTemplateSelect = document.getElementById('assignTemplateSelect');
const assignDateInput = document.getElementById('assignDate');
const assignedWorkoutsLogContainer = document.getElementById('assignedWorkoutsLogContainer');

// Dashboard Stats
const totalClientsStat = document.getElementById('totalClientsStat');
const totalWorkoutTemplatesStat = document.getElementById('totalWorkoutTemplatesStat');


// --- MODAL HANDLING (Simplified for MVP) ---
function openModal(modalElement) {
    if (modalElement) modalElement.classList.add('is-active');
}
function closeModal(modalElement) {
    if (modalElement) modalElement.classList.remove('is-active');
}
// Generic setup for all modals on this page to close
[addEditClientModal, confirmModal, createEditTemplateModal].forEach(modal => {
    if (modal) {
        modal.querySelectorAll('.pt-modal__close').forEach(btn => {
            btn.addEventListener('click', () => closeModal(modal));
        });
        modal.addEventListener('click', (e) => { // Close on backdrop click
            if (e.target === modal) closeModal(modal);
        });
    }
});

// --- VIEW SWITCHING ---
function switchView(viewId) {
    viewSections.forEach(section => {
        section.classList.toggle('is-active', section.id === viewId);
    });
    navLinks.forEach(link => {
        link.classList.toggle('is-active', link.dataset.view === viewId);
    });
    window.location.hash = viewId.replace('View', '').toLowerCase();
}
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.dataset.view;
        if (viewId && document.getElementById(viewId)) { // Check if viewId element exists
            switchView(viewId);
        } else {
            console.warn(`View with ID "${viewId}" not found.`);
            switchView('dashboardView'); // Default to dashboard
        }
    });
});


// --- CLIENT MANAGEMENT FUNCTIONS ---
// (renderClients, handleClientFormSubmit, openClientModalForEdit, handleDeleteClient)
// ... These functions remain largely the same as the previous full version ...
// Ensure they use the correct modal elements and form input IDs.
// Example:
function renderClients() {
    if (!clientListContainer) return;
    clientListContainer.innerHTML = '';
    if (clients.length === 0) {
        if(noClientsMessage) noClientsMessage.style.display = 'block';
    } else {
        if(noClientsMessage) noClientsMessage.style.display = 'none';
        clients.forEach(client => {
            const clientItem = document.createElement('div');
            clientItem.className = 'pt-client-list-item';
            clientItem.innerHTML = `
                <div class="pt-client-list-item__avatar">${client.name ? client.name.match(/\b(\w)/g).join('').substr(0,2).toUpperCase() : 'N/A'}</div>
                <div class="pt-client-list-item__info">
                    <h4 class="pt-client-list-item__name">${client.name || 'Unnamed Client'}</h4>
                    <p class="pt-client-list-item__meta text-small">${client.goal || 'No goal set'}</p>
                </div>
                <div class="pt-client-list-item__actions">
                    <button class="pt-button pt-button--secondary pt-button--small edit-client-btn" data-id="${client.id}">Edit</button>
                    <button class="pt-button pt-button--destructive pt-button--small delete-client-btn" data-id="${client.id}">Delete</button>
                </div>
            `;
            clientListContainer.appendChild(clientItem);
        });
    }
    updateDashboardStats();
}
function handleClientFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('clientId').value; // Get value from form input
    const clientData = {
        name: document.getElementById('clientName').value,
        email: document.getElementById('clientEmail').value,
        phone: document.getElementById('clientPhone').value,
        dob: document.getElementById('clientDob').value,
        goal: document.getElementById('clientGoal').value,
        medicalNotes: document.getElementById('clientMedicalNotes').value,
    };
    if (id) { clients = clients.map(c => c.id === id ? { ...c, ...clientData } : c); }
    else { clientData.id = db.generateId(); clients.push(clientData); }
    db.write('clients', clients);
    renderClients();
    closeModal(addEditClientModal);
    if (clientForm) clientForm.reset();
}
function openClientModalForEdit(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (client && clientModalTitle && clientForm) {
        clientModalTitle.textContent = 'Edit Client';
        document.getElementById('clientId').value = client.id;
        document.getElementById('clientName').value = client.name || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientDob').value = client.dob || '';
        document.getElementById('clientGoal').value = client.goal || '';
        document.getElementById('clientMedicalNotes').value = client.medicalNotes || '';
        openModal(addEditClientModal);
    }
}
function handleDeleteClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client || !confirmModalTitle || !confirmModalMessage || !confirmModalConfirmBtn) return;
    confirmModalTitle.textContent = 'Delete Client';
    confirmModalMessage.textContent = `Are you sure you want to delete ${client.name}? This action cannot be undone.`;
    openModal(confirmModal);
    const newConfirmBtn = confirmModalConfirmBtn.cloneNode(true); // Re-clone to remove old listeners
    confirmModalConfirmBtn.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtn);
    document.getElementById('confirmModalConfirmBtn').onclick = () => { // Simpler listener for one-off
        clients = clients.filter(c => c.id !== clientId);
        db.write('clients', clients);
        renderClients();
        closeModal(confirmModal);
    };
}


// --- EXERCISE MANAGEMENT FUNCTIONS ---
// (renderExercises, form submit, edit/delete handlers)
// ... These functions remain largely the same as the previous full version ...
// Ensure they use the correct element IDs.
// Example:
function renderExercises() { /* ... (same as before, ensures correct IDs are used) ... */ }
if (exerciseForm) { exerciseForm.addEventListener('submit', (e) => { /* ... (same logic) ... */ }); }
if (cancelEditExerciseBtn) { cancelEditExerciseBtn.addEventListener('click', () => { /* ... */ }); }
if (exerciseListContainer) { exerciseListContainer.addEventListener('click', (e) => { /* ... (edit/delete delegation) ... */ }); }


// --- WORKOUT TEMPLATE MANAGEMENT FUNCTIONS ---
// (renderWorkoutTemplates, renderSelectedExercisesForTemplate, form submit, edit/delete)
// ... These functions remain largely the same as the previous full version ...
// Ensure they use the correct element IDs.
let currentTemplateExercises = [];
function renderWorkoutTemplates() { /* ... (same logic) ... */ }
function renderSelectedExercisesForTemplate() { /* ... (same logic) ... */ }
if (templateExerciseListDiv) { templateExerciseListDiv.addEventListener('change', (e) => { /* ... */ }); }
if (selectedExercisesForTemplateContainer) { selectedExercisesForTemplateContainer.addEventListener('click', (e) => { /* ... */ }); selectedExercisesForTemplateContainer.addEventListener('input', (e) => { /* ... */ });}
if (openCreateTemplateModalBtn) { openCreateTemplateModalBtn.addEventListener('click', () => { /* ... */ }); }
if (workoutTemplateForm) { workoutTemplateForm.addEventListener('submit', (e) => { /* ... */ }); }
if (workoutTemplateListContainer) { workoutTemplateListContainer.addEventListener('click', (e) => { /* ... */ }); }


// --- ASSIGN WORKOUT MANAGEMENT FUNCTIONS ---
// (populateAssignWorkoutSelects, renderAssignedWorkouts, form submit, delete assignment)
// ... These functions remain largely the same as the previous full version ...
// Ensure they use the correct element IDs.
function populateAssignWorkoutSelects() { /* ... (same logic) ... */ }
function renderAssignedWorkouts() { /* ... (same logic) ... */ }
if (assignWorkoutForm) { assignWorkoutForm.addEventListener('submit', (e) => { /* ... */ }); }
if (assignedWorkoutsLogContainer) { assignedWorkoutsLogContainer.addEventListener('click', (e) => { /* ... */ }); }


// --- DASHBOARD STATS ---
function updateDashboardStats() {
    if(totalClientsStat) totalClientsStat.textContent = clients.length;
    if(totalWorkoutTemplatesStat) totalWorkoutTemplatesStat.textContent = workoutTemplates.length;
}

// --- INITIALIZE APP ---
function initializeApp() {
    const initialViewId = window.location.hash ? window.location.hash.substring(1) + 'View' : 'dashboardView';
    const validView = document.getElementById(initialViewId) ? initialViewId : 'dashboardView';
    if (document.getElementById(validView)) { // Extra check
        switchView(validView);
    } else {
        switchView('dashboardView'); // Fallback
    }
    
    renderClients();
    renderExercises(); 
    renderWorkoutTemplates(); 
    renderAssignedWorkouts();
    // populateAssignWorkoutSelects(); // This is called by renderWorkoutTemplates and renderClients already
}


// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("MVP App DOMContentLoaded: Initializing...");

    // Initialize Theme Switcher for this page (pt-admin-mvp.html)
    if (mvpThemeSwitcherElement) { // Ensure element exists
        initializeThemeSwitcher(themesForMvp, mvpThemeSwitcherElement, bodyElement, (newThemeValue, currentThemeObject) => {
            // This is the onThemeChangeCallback
            // Re-theme any modals or specific elements not direct children of body that need it
            const modalsToTheme = [addEditClientModal, confirmModal, createEditTemplateModal];
            modalsToTheme.forEach(modal => {
                if (modal) {
                    themesForMvp.forEach(t => modal.classList.remove(t.value));
                    modal.classList.add(newThemeValue);
                }
            });
            // If sidebar content needed changing based on theme (it doesn't in this MVP's static sidebar)
            // if (currentThemeObject && typeof window.getSidebarHTML === 'function') {
            //     const sidebarContainer = document.querySelector('.pt-sidebar'); // Or get by ID
            //     if (sidebarContainer) { /* ... update sidebar ... */ }
            // }
        });
    } else if (themesForMvp.length > 0) { // Fallback if no switcher, apply default theme to body
        bodyElement.className = '';
        bodyElement.classList.add(themesForMvp[0].value);
        bodyElement.style.backgroundColor = 'var(--background-color)';
        bodyElement.style.color = 'var(--text-color)';
    }

    // Attach event listeners for client management
    if (openAddClientModalBtn) {
        openAddClientModalBtn.addEventListener('click', () => {
            const clientModalTitle = document.getElementById('clientModalTitle');
            const clientForm = document.getElementById('clientForm');
            const clientIdInput = document.getElementById('clientId');

            if (clientModalTitle) clientModalTitle.textContent = 'Add New Client';
            if (clientForm) clientForm.reset();
            if (clientIdInput) clientIdInput.value = '';
            openModal(addEditClientModal);
        });
    }
    if (clientForm) {
        clientForm.addEventListener('submit', handleClientFormSubmit);
    }
    if (clientListContainer) {
        clientListContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-client-btn')) {
                openClientModalForEdit(e.target.dataset.id);
            }
            if (e.target.classList.contains('delete-client-btn')) {
                handleDeleteClient(e.target.dataset.id);
            }
        });
    }
    
    // Call the main app initializer
    initializeApp();
    console.log("MVP App Initialized.");
});
