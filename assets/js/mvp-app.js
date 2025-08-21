// assets/js/mvp-app.js

import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeAccordions } from './components/accordion.js';
import { FITFLOW_THEMES_CONFIG } from './themes-config.js';
import { auth, db } from './firebase-config.js'; // db is needed for onSnapshot
import { dataService } from './data-service.js'; // Import the new data service
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Initial Default Data ---
const DEFAULT_EXERCISES = [
    { name: "Squat", description: "Compound lower body exercise.", muscleGroup: "Legs, Glutes" },
    { name: "Bench Press", description: "Compound upper body pushing exercise.", muscleGroup: "Chest, Triceps, Shoulders" },
    { name: "Deadlift", description: "Full body compound exercise.", muscleGroup: "Back, Legs, Glutes, Core" },
    { name: "Overhead Press", description: "Compound shoulder exercise.", muscleGroup: "Shoulders, Triceps" },
    { name: "Barbell Row", description: "Compound upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { name: "Pull-up", description: "Bodyweight upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { name: "Push-up", description: "Bodyweight upper body pushing exercise.", muscleGroup: "Chest, Triceps, Shoulders" },
    { name: "Lunge", description: "Unilateral lower body exercise.", muscleGroup: "Legs, Glutes" },
    { name: "Plank", description: "Core stability exercise.", muscleGroup: "Core" },
    { name: "Bicep Curl", description: "Isolation exercise for biceps.", muscleGroup: "Biceps" },
    { name: "Tricep Extension", description: "Isolation exercise for triceps.", muscleGroup: "Triceps" },
    { name: "Leg Press", description: "Machine-based lower body exercise.", muscleGroup: "Legs, Glutes" },
    { name: "Lat Pulldown", description: "Machine-based upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { name: "Calf Raise", description: "Isolation exercise for calves.", muscleGroup: "Calves" },
    { name: "Russian Twist", description: "Core rotational exercise.", muscleGroup: "Core, Obliques" },
    { name: "Burpee", description: "Full body conditioning exercise.", muscleGroup: "Full Body" },
    { name: "Kettlebell Swing", description: "Full body explosive exercise.", muscleGroup: "Glutes, Hamstrings, Back, Core" },
    { name: "Dumbbell Shoulder Press", description: "Shoulder exercise with dumbbells.", muscleGroup: "Shoulders, Triceps" },
    { name: "Leg Curl", description: "Isolation exercise for hamstrings.", muscleGroup: "Hamstrings" },
    { name: "Leg Extension", description: "Isolation exercise for quadriceps.", muscleGroup: "Quadriceps" }
];

// --- State ---
let clients = [];
let exercises = [];
let workoutTemplates = [];
let assignedWorkouts = [];
let currentTemplateExercises = [];

// --- Firebase User & Trainer Data ---
let currentFirebaseUser = null;
let currentTrainerData = null;

// --- UI Elements (Declarations) ---
let bodyElement, viewSections, navLinks, mvpThemeSwitcherElement;
let addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal;
let clientListContainer, noClientsMessage, clientModalTitle, clientForm, openAddClientModalBtn;
let clientIdInput, clientNameInput, clientEmailInput, clientPhoneInput, clientDobInput, clientGoalInput, clientMedicalNotesInput;
let exerciseForm, exerciseIdInput, exerciseNameInput, exerciseDescriptionInput, exerciseMuscleGroupInput;
let exerciseListContainer, noExercisesMessage, cancelEditExerciseBtn;
let openCreateTemplateModalBtn, templateModalTitle, workoutTemplateForm, workoutTemplateIdInput, templateNameInput;
let templateExerciseSelect, addExerciseToTemplateBtn, selectedExercisesForTemplateContainer;
let workoutTemplateListContainer, noWorkoutTemplatesMessage;
let assignWorkoutForm, assignClientSelect, assignTemplateSelect, assignDateInput, assignedWorkoutsLogContainer;
let totalClientsStat, totalWorkoutTemplatesStat;
let confirmModalTitleElem, confirmModalMessageElem, confirmModalConfirmBtnElem, confirmModalCancelBtnElem;
let clientPlanModalTitleElem, clientPlanModalContentElem;
let sidebarLogoElem, sidebarUserElem, sidebarAvatarElem, logoutBtn;


// --- MODAL HANDLING ---
function openModal(modalElement) { if (modalElement) modalElement.classList.add('is-active'); }
function closeModal(modalElement) { if (modalElement) modalElement.classList.remove('is-active'); }

// --- VIEW SWITCHING ---
function switchView(viewId) {
    if (!viewSections) return;
    viewSections.forEach(section => section.classList.toggle('is-active', section.id === viewId));
    if (navLinks) navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.view === viewId));
    window.location.hash = viewId.replace('View', '').toLowerCase();
}

// --- DATA LOADING & RENDERING ---
async function loadAllData() {
    if (!currentFirebaseUser) return;
    const trainerId = currentFirebaseUser.uid;
    try {
        const [loadedExercises, loadedTemplates, loadedAssignments] = await Promise.all([
            dataService.getExercises(trainerId),
            dataService.getWorkoutTemplates(trainerId),
            dataService.getAssignedWorkouts(trainerId)
        ]);

        // Seed default exercises if the trainer has none
        if (loadedExercises.length === 0) {
            console.log("No exercises found in Firestore for this trainer. Seeding default exercises...");
            await Promise.all(DEFAULT_EXERCISES.map(ex => dataService.addExercise(ex, trainerId)));
            // Reload exercises after seeding
            exercises = await dataService.getExercises(trainerId);
        } else {
            exercises = loadedExercises;
        }

        workoutTemplates = loadedTemplates;
        assignedWorkouts = loadedAssignments;

        renderAll();
    } catch (error) {
        console.error("Error loading data:", error);
        alert("There was an error loading your data. Please try refreshing the page.");
    }
}

function renderAll() {
    renderExercises();
    renderWorkoutTemplates();
    renderAssignedWorkouts();
    // renderClients is handled by its own subscription
}


// --- CLIENT MANAGEMENT FUNCTIONS (Using Data Service) ---
function renderClients() {
    if (!clientListContainer || !noClientsMessage) return;
    clientListContainer.innerHTML = '';
    noClientsMessage.style.display = clients.length === 0 ? 'block' : 'none';
    clients.forEach(client => {
        const clientItem = document.createElement('div'); clientItem.className = 'pt-client-list-item';
        const initials = client.name ? client.name.match(/\b(\w)/g)?.join('').substr(0, 2).toUpperCase() || 'N/A' : 'N/A';
        clientItem.innerHTML = `<div class="pt-client-list-item__avatar">${initials}</div><div class="pt-client-list-item__info"><h4 class="pt-client-list-item__name">${client.name || 'Unnamed'}</h4><p class="pt-client-list-item__meta text-small">${client.goal || 'No goal'}</p></div><div class="pt-client-list-item__actions"><button class="pt-button pt-button--accent pt-button--small view-client-plan-btn" data-id="${client.id}">View Plan</button><button class="pt-button pt-button--secondary pt-button--small edit-client-btn" data-id="${client.id}">Edit</button><button class="pt-button pt-button--destructive pt-button--small delete-client-btn" data-id="${client.id}">Delete</button></div>`;
        clientListContainer.appendChild(clientItem);
    });
    updateDashboardStats();
    populateAssignWorkoutSelects();
}

async function handleClientFormSubmit(e) {
    e.preventDefault();
    if (!currentFirebaseUser) { console.error("No trainer logged in."); return; }

    const id = clientIdInput.value;
    const clientData = {
        name: clientNameInput.value, email: clientEmailInput.value, phone: clientPhoneInput.value,
        dob: clientDobInput.value, goal: clientGoalInput.value, medicalNotes: clientMedicalNotesInput.value,
    };

    try {
        if (id) {
            await dataService.updateClient(id, clientData);
        } else {
            await dataService.addClient(clientData, currentFirebaseUser.uid);
        }
        closeModal(addEditClientModal);
        clientForm.reset();
        clientIdInput.value = '';
        // UI will update automatically via onSnapshot listener.
    } catch (error) {
        console.error("Error saving client:", error);
        alert("Failed to save client. Please try again.");
    }
}

function openClientModalForEdit(id) {
    const c = clients.find(cl => cl.id === id);
    if (!c) { console.error(`Client with ID ${id} not found.`); return; }
    clientModalTitle.textContent = 'Edit Client';
    clientIdInput.value = c.id;
    clientNameInput.value = c.name || '';
    clientEmailInput.value = c.email || '';
    clientPhoneInput.value = c.phone || '';
    clientDobInput.value = c.dob || '';
    clientGoalInput.value = c.goal || '';
    clientMedicalNotesInput.value = c.medicalNotes || '';
    openModal(addEditClientModal);
}

function handleDeleteClient(id) {
    const c = clients.find(cl => cl.id === id);
    if (!c) { console.error(`Client with ID ${id} not found.`); return; }

    confirmModalTitleElem.textContent = 'Delete Client';
    confirmModalMessageElem.textContent = `Are you sure you want to delete ${c.name}? This action cannot be undone. It will also delete any workouts assigned to them.`;

    const newConfirmBtn = confirmModalConfirmBtnElem.cloneNode(true);
    confirmModalConfirmBtnElem.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtnElem);
    confirmModalConfirmBtnElem = newConfirmBtn;

    confirmModalConfirmBtnElem.onclick = async () => {
        try {
            await dataService.deleteClient(id);
            // This will also delete related assignments via the data service.
            // We need to manually re-fetch and re-render assignments.
            assignedWorkouts = await dataService.getAssignedWorkouts(currentFirebaseUser.uid);
            renderAssignedWorkouts();
            closeModal(confirmModal);
            // Client list will update via its onSnapshot listener.
        } catch (error) {
            console.error("Error deleting client:", error);
            alert("Failed to delete client. Please try again.");
        }
    };
    openModal(confirmModal);
}

// --- Firestore Subscription for Clients ---
let unsubscribeClients = () => {};

function subscribeToClients() {
    if (!currentFirebaseUser) return;
    const q = query(collection(db, "clients"), where("trainerId", "==", currentFirebaseUser.uid));
    unsubscribeClients = onSnapshot(q, (snapshot) => {
        clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Clients updated from Firestore:", clients.length);
        renderClients();
    }, (error) => {
        console.error("Error subscribing to clients:", error);
    });
}

// --- EXERCISE MANAGEMENT FUNCTIONS (Using Data Service) ---
function renderExercises() {
    if (!exerciseListContainer || !noExercisesMessage || !templateExerciseSelect) return;
    exerciseListContainer.innerHTML = '';
    templateExerciseSelect.innerHTML = '<option value="">-- Select Exercise --</option>';
    noExercisesMessage.style.display = exercises.length === 0 ? 'block' : 'none';
    exercises.forEach(ex => {
        const item = document.createElement('div'); item.className = 'pt-accordion__item';
        item.innerHTML = `<button class="pt-accordion__button" aria-expanded="false" aria-controls="ex-acc-${ex.id}">${ex.name}</button><div class="pt-accordion__content" id="ex-acc-${ex.id}" hidden>${ex.muscleGroup ? `<p><strong>Group:</strong> ${ex.muscleGroup}</p>` : ''}${ex.description ? `<p><strong>Desc:</strong> ${ex.description}</p>` : ''}<div class="pt-client-list-item__actions" style="margin-top:var(--spacing-sm);"><button class="pt-button pt-button--secondary pt-button--small edit-exercise-btn" data-id="${ex.id}">Edit</button><button class="pt-button pt-button--destructive pt-button--small delete-exercise-btn" data-id="${ex.id}">Del</button></div></div>`;
        exerciseListContainer.appendChild(item);
        const opt = document.createElement('option'); opt.value = ex.id; opt.textContent = ex.name; templateExerciseSelect.appendChild(opt);
    });
    initializeAccordions();
    updateDashboardStats();
}

async function handleExerciseFormSubmit(e) {
    e.preventDefault();
    const id = exerciseIdInput.value;
    const exData = { name: exerciseNameInput.value, description: exerciseDescriptionInput.value, muscleGroup: exerciseMuscleGroupInput.value };
    try {
        if (id) {
            await dataService.updateExercise(id, exData);
        } else {
            await dataService.addExercise(exData, currentFirebaseUser.uid);
        }
        exercises = await dataService.getExercises(currentFirebaseUser.uid);
        renderExercises();
        exerciseForm.reset();
        exerciseIdInput.value = '';
        cancelEditExerciseBtn.style.display = 'none';
    } catch (error) {
        console.error("Error saving exercise:", error);
        alert("Failed to save exercise.");
    }
}

function openExerciseFormForEdit(id) {
    const ex = exercises.find(e => e.id === id); if (!ex) return;
    exerciseIdInput.value = ex.id;
    exerciseNameInput.value = ex.name;
    exerciseDescriptionInput.value = ex.description || '';
    exerciseMuscleGroupInput.value = ex.muscleGroup || '';
    cancelEditExerciseBtn.style.display = 'inline-block';
    exerciseNameInput.focus();
    if (exerciseForm) exerciseForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleDeleteExercise(id) {
    const ex = exercises.find(e => e.id === id); if (!ex) return;
    const isUsed = workoutTemplates.some(t => t.exercises.some(tei => tei.exerciseId === id));
    let msg = `Are you sure you want to delete the exercise "${ex.name}"?`;
    if (isUsed) {
        msg += `\n\nWARNING: This exercise is currently used in one or more workout templates. Deleting it will NOT remove it from those templates, which may cause issues.`;
    }
    confirmModalTitleElem.textContent = 'Delete Exercise';
    confirmModalMessageElem.innerHTML = msg.replace(/\n/g, '<br>');
    const newBtn = confirmModalConfirmBtnElem.cloneNode(true);
    confirmModalConfirmBtnElem.parentNode.replaceChild(newBtn, confirmModalConfirmBtnElem);
    confirmModalConfirmBtnElem = newBtn;
    confirmModalConfirmBtnElem.onclick = async () => {
        try {
            await dataService.deleteExercise(id);
            exercises = exercises.filter(e => e.id !== id);
            renderExercises();
            // Note: This doesn't auto-update templates that use this exercise.
            // A more robust solution would be a cloud function to handle cleanup.
            closeModal(confirmModal);
        } catch (error) {
            console.error("Error deleting exercise:", error);
            alert("Failed to delete exercise.");
        }
    };
    openModal(confirmModal);
}

// --- WORKOUT TEMPLATE MANAGEMENT FUNCTIONS (Using Data Service) ---
function renderWorkoutTemplates() {
    if (!workoutTemplateListContainer || !noWorkoutTemplatesMessage || !assignTemplateSelect) return;
    workoutTemplateListContainer.innerHTML = '';
    assignTemplateSelect.innerHTML = '<option value="">-- Select Template --</option>';
    noWorkoutTemplatesMessage.style.display = workoutTemplates.length === 0 ? 'block' : 'none';
    workoutTemplates.forEach(t => {
        const item = document.createElement('div'); item.className = 'pt-client-list-item';
        item.innerHTML = `<div class="pt-client-list-item__info"><h5 class="pt-client-list-item__name">${t.name}</h5><p class="pt-client-list-item__meta text-small">${t.exercises.length} ex.</p></div><div class="pt-client-list-item__actions"><button class="pt-button pt-button--secondary pt-button--small edit-template-btn" data-id="${t.id}">Edit</button><button class="pt-button pt-button--destructive pt-button--small delete-template-btn" data-id="${t.id}">Del</button></div>`;
        workoutTemplateListContainer.appendChild(item);
        const opt = document.createElement('option'); opt.value = t.id; opt.textContent = t.name; assignTemplateSelect.appendChild(opt);
    });
    updateDashboardStats();
}

function renderSelectedExercisesForTemplate() {
    if (!selectedExercisesForTemplateContainer) return;
    selectedExercisesForTemplateContainer.innerHTML = '';
    if (currentTemplateExercises.length === 0) {
        selectedExercisesForTemplateContainer.innerHTML = '<p class="text-muted">No exercises added.</p>';
        return;
    }
    const list = document.createElement('ul'); list.style.cssText = 'list-style:none;padding-left:0;';
    currentTemplateExercises.forEach((exD, idx) => {
        const ex = exercises.find(e => e.id === exD.exerciseId); if (!ex) return;
        const li = document.createElement('li'); li.style.cssText = 'padding:var(--spacing-sm) 0;border-bottom:1px solid var(--border-color-light);';
        li.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-xs);"><strong>${ex.name}</strong><button type="button" class="pt-button pt-button--destructive pt-button--small remove-exercise-from-template-btn" data-index="${idx}">X</button></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:var(--spacing-sm);"><div class="pt-input-group"><label for="sets-${idx}" class="text-small">Sets:</label><input type="text" id="sets-${idx}" class="pt-input pt-input--small template-exercise-detail" data-index="${idx}" data-prop="sets" value="${exD.sets || ''}"></div><div class="pt-input-group"><label for="reps-${idx}" class="text-small">Reps:</label><input type="text" id="reps-${idx}" class="pt-input pt-input--small template-exercise-detail" data-index="${idx}" data-prop="reps" value="${exD.reps || ''}"></div><div class="pt-input-group"><label for="rest-${idx}" class="text-small">Rest(s):</label><input type="text" id="rest-${idx}" class="pt-input pt-input--small template-exercise-detail" data-index="${idx}" data-prop="rest" value="${exD.rest || ''}"></div></div>`;
        list.appendChild(li);
    });
    selectedExercisesForTemplateContainer.appendChild(list);
}

async function handleWorkoutTemplateFormSubmit(e) {
    e.preventDefault();
    const id = workoutTemplateIdInput.value;
    const tData = { name: templateNameInput.value, exercises: [...currentTemplateExercises] };
    if (tData.exercises.length === 0) { alert("A template must have at least one exercise."); return; }
    try {
        if (id) {
            await dataService.updateWorkoutTemplate(id, tData);
        } else {
            await dataService.addWorkoutTemplate(tData, currentFirebaseUser.uid);
        }
        workoutTemplates = await dataService.getWorkoutTemplates(currentFirebaseUser.uid);
        renderWorkoutTemplates();
        closeModal(createEditTemplateModal);
        workoutTemplateForm.reset();
        workoutTemplateIdInput.value = '';
        currentTemplateExercises = [];
    } catch (error) {
        console.error("Error saving workout template:", error);
        alert("Failed to save workout template.");
    }
}

function openTemplateModalForEdit(id) {
    const t = workoutTemplates.find(wt => wt.id === id); if (!t) return;
    templateModalTitle.textContent = 'Edit Template';
    workoutTemplateIdInput.value = t.id;
    templateNameInput.value = t.name;
    currentTemplateExercises = JSON.parse(JSON.stringify(t.exercises)); // Deep copy
    renderSelectedExercisesForTemplate();
    openModal(createEditTemplateModal);
}

function handleDeleteTemplate(id) {
    const t = workoutTemplates.find(wt => wt.id === id); if (!t) return;
    confirmModalTitleElem.textContent = 'Delete Template';
    confirmModalMessageElem.textContent = `Are you sure you want to delete the template "${t.name}"? This will NOT delete any workouts already assigned to clients using this template.`;
    const newBtn = confirmModalConfirmBtnElem.cloneNode(true);
    confirmModalConfirmBtnElem.parentNode.replaceChild(newBtn, confirmModalConfirmBtnElem);
    confirmModalConfirmBtnElem = newBtn;
    confirmModalConfirmBtnElem.onclick = async () => {
        try {
            await dataService.deleteWorkoutTemplate(id);
            workoutTemplates = workoutTemplates.filter(wt => wt.id !== id);
            renderWorkoutTemplates();
            closeModal(confirmModal);
        } catch (error) {
            console.error("Error deleting template:", error);
            alert("Failed to delete template.");
        }
    };
    openModal(confirmModal);
}

// --- ASSIGN WORKOUT MANAGEMENT FUNCTIONS (Using Data Service) ---
function populateAssignWorkoutSelects() {
    if (!assignClientSelect || !assignTemplateSelect) return;
    assignClientSelect.innerHTML = '<option value="">-- Client --</option>';
    clients.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; assignClientSelect.appendChild(o); });
}

function renderAssignedWorkouts() {
    if (!assignedWorkoutsLogContainer) return;
    assignedWorkoutsLogContainer.innerHTML = '';
    if (assignedWorkouts.length === 0) {
        assignedWorkoutsLogContainer.innerHTML = '<p class="text-muted">No workouts have been assigned yet.</p>';
        return;
    }
    const list = document.createElement('ul'); list.style.cssText = 'list-style:none;padding-left:0;';
    // Sort by date, most recent first
    const sortedAssignments = [...assignedWorkouts].sort((a, b) => new Date(b.dateAssigned) - new Date(a.dateAssigned));
    sortedAssignments.forEach(aw => {
        const c = clients.find(cl => cl.id === aw.clientId);
        const t = workoutTemplates.find(wt => wt.id === aw.workoutTemplateId);
        if (!c || !t) return; // Don't render if client or template is missing
        const li = document.createElement('li'); li.className = 'pt-client-list-item';
        li.innerHTML = `<div class="pt-client-list-item__info"><h5 class="pt-client-list-item__name">${c.name} - ${t.name}</h5><p class="pt-client-list-item__meta text-small">For: ${new Date(aw.dateAssigned).toLocaleDateString()} (Status: ${aw.status})</p></div><div class="pt-client-list-item__actions"><button class="pt-button pt-button--destructive pt-button--small delete-assignment-btn" data-id="${aw.id}">Remove</button></div>`;
        list.appendChild(li);
    });
    assignedWorkoutsLogContainer.appendChild(list);
}

async function handleAssignWorkoutFormSubmit(e) {
    e.preventDefault();
    if (!assignClientSelect.value || !assignTemplateSelect.value || !assignDateInput.value) {
        alert("A client, template, and date are required to assign a workout.");
        return;
    }
    const ass = {
        clientId: assignClientSelect.value,
        workoutTemplateId: assignTemplateSelect.value,
        dateAssigned: assignDateInput.value,
        status: 'pending' // Default status
    };
    try {
        await dataService.assignWorkout(ass, currentFirebaseUser.uid);
        assignedWorkouts = await dataService.getAssignedWorkouts(currentFirebaseUser.uid);
        renderAssignedWorkouts();
        assignWorkoutForm.reset();
    } catch (error) {
        console.error("Error assigning workout:", error);
        alert("Failed to assign workout.");
    }
}

async function handleDeleteAssignment(id) {
    if (!confirm("Are you sure you want to remove this assignment?")) return;
    try {
        await dataService.deleteAssignment(id);
        assignedWorkouts = assignedWorkouts.filter(aw => aw.id !== id);
        renderAssignedWorkouts();
    } catch (error) {
        console.error("Error deleting assignment:", error);
        alert("Failed to delete assignment.");
    }
}

// --- VIEW CLIENT'S PLAN (Now uses Firestore-backed data) ---
function openViewClientPlanModal(clientId) {
    const client = clients.find(c => c.id === clientId); if (!client) return;
    if (!viewClientPlanModal || !clientPlanModalTitleElem || !clientPlanModalContentElem) return;
    clientPlanModalTitleElem.textContent = `${client.name}'s Plan`;
    clientPlanModalContentElem.innerHTML = '<p class="text-muted">Loading...</p>';
    const clientAssigns = assignedWorkouts
        .filter(aw => aw.clientId === clientId)
        .sort((a, b) => new Date(a.dateAssigned) - new Date(b.dateAssigned));

    if (clientAssigns.length === 0) {
        clientPlanModalContentElem.innerHTML = '<p class="text-muted">No workouts assigned.</p>';
        openModal(viewClientPlanModal);
        return;
    }
    let html = '';
    clientAssigns.forEach(aw => {
        const template = workoutTemplates.find(wt => wt.id === aw.workoutTemplateId);
        if (template) {
            html += `<div class="pt-card" style="margin-bottom:var(--spacing-md);"><h4 class="pt-card-title">${template.name} - Assigned: ${new Date(aw.dateAssigned).toLocaleDateString()}</h4><ul style="list-style:none;padding-left:0;">`;
            template.exercises.forEach(exD => {
                const exInfo = exercises.find(ex => ex.id === exD.exerciseId);
                if (exInfo) html += `<li style="padding:var(--spacing-xs) 0;border-bottom:1px dashed var(--border-color-light);"><strong>${exInfo.name}</strong>: ${exD.sets || 'N/A'} sets, ${exD.reps || 'N/A'} reps, ${exD.rest || 'N/A'}s rest</li>`;
            });
            html += `</ul></div>`;
        }
    });
    clientPlanModalContentElem.innerHTML = html || '<p class="text-muted">No details could be loaded.</p>';
    openModal(viewClientPlanModal);
}

// --- DASHBOARD STATS ---
function updateDashboardStats() {
    if (totalClientsStat) totalClientsStat.textContent = clients.length;
    if (totalWorkoutTemplatesStat) totalWorkoutTemplatesStat.textContent = workoutTemplates.length;
}

// --- INITIALIZE APP FUNCTION ---
async function initializeApp() {
    if (!currentFirebaseUser || !currentTrainerData) {
        console.error("initializeApp: Firebase user or trainer data not available. Aborting UI setup.");
        return;
    }

    // --- UI Element Initialization ---
    bodyElement = document.body;
    viewSections = document.querySelectorAll('.view-section'); navLinks = document.querySelectorAll('.pt-sidebar__nav-link');
    mvpThemeSwitcherElement = document.getElementById('mvpThemeSwitcher');
    addEditClientModal = document.getElementById('addEditClientModal'); confirmModal = document.getElementById('confirmModal');
    createEditTemplateModal = document.getElementById('createEditTemplateModal'); viewClientPlanModal = document.getElementById('viewClientPlanModal');
    clientListContainer = document.getElementById('clientListContainer'); noClientsMessage = document.getElementById('noClientsMessage');
    clientModalTitle = document.getElementById('clientModalTitle'); clientForm = document.getElementById('clientForm');
    openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
    clientIdInput = document.getElementById('clientId'); clientNameInput = document.getElementById('clientName'); clientEmailInput = document.getElementById('clientEmail'); clientPhoneInput = document.getElementById('clientPhone'); clientDobInput = document.getElementById('clientDob'); clientGoalInput = document.getElementById('clientGoal'); clientMedicalNotesInput = document.getElementById('clientMedicalNotes');
    exerciseForm = document.getElementById('exerciseForm'); exerciseIdInput = document.getElementById('exerciseId'); exerciseNameInput = document.getElementById('exerciseName'); exerciseDescriptionInput = document.getElementById('exerciseDescription'); exerciseMuscleGroupInput = document.getElementById('exerciseMuscleGroup');
    exerciseListContainer = document.getElementById('exerciseListContainer'); noExercisesMessage = document.getElementById('noExercisesMessage'); cancelEditExerciseBtn = document.getElementById('cancelEditExerciseBtn');
    openCreateTemplateModalBtn = document.getElementById('openCreateTemplateModalBtn'); templateModalTitle = document.getElementById('templateModalTitle'); workoutTemplateForm = document.getElementById('workoutTemplateForm'); workoutTemplateIdInput = document.getElementById('workoutTemplateId'); templateNameInput = document.getElementById('templateName');
    templateExerciseSelect = document.getElementById('templateExerciseSelect'); addExerciseToTemplateBtn = document.getElementById('addExerciseToTemplateBtn'); selectedExercisesForTemplateContainer = document.getElementById('selectedExercisesForTemplateContainer');
    workoutTemplateListContainer = document.getElementById('workoutTemplateListContainer'); noWorkoutTemplatesMessage = document.getElementById('noWorkoutTemplatesMessage');
    assignWorkoutForm = document.getElementById('assignWorkoutForm'); assignClientSelect = document.getElementById('assignClientSelect'); assignTemplateSelect = document.getElementById('assignTemplateSelect'); assignDateInput = document.getElementById('assignDate');
    assignedWorkoutsLogContainer = document.getElementById('assignedWorkoutsLogContainer');
    totalClientsStat = document.getElementById('totalClientsStat'); totalWorkoutTemplatesStat = document.getElementById('totalWorkoutTemplatesStat');
    confirmModalTitleElem = document.getElementById('confirmModalTitle'); confirmModalMessageElem = document.getElementById('confirmModalMessage'); confirmModalConfirmBtnElem = document.getElementById('confirmModalConfirmBtn'); confirmModalCancelBtnElem = document.getElementById('confirmModalCancelBtn');
    clientPlanModalTitleElem = document.getElementById('clientPlanModalTitle'); clientPlanModalContentElem = document.getElementById('clientPlanModalContent');
    sidebarLogoElem = document.querySelector('.pt-sidebar__logo'); sidebarUserElem = document.querySelector('.pt-sidebar__user-name'); sidebarAvatarElem = document.querySelector('.pt-sidebar__user-avatar');
    logoutBtn = document.querySelector('.pt-sidebar__logout-link');

    // --- Update sidebar with logged-in trainer's info ---
    if (sidebarUserElem) sidebarUserElem.textContent = currentTrainerData.displayName || currentFirebaseUser.displayName || "Trainer";
    if (sidebarAvatarElem) {
        const name = currentTrainerData.displayName || currentFirebaseUser.displayName || "T";
        const initials = name.match(/\b(\w)/g)?.join('').substr(0, 2).toUpperCase() || name.charAt(0).toUpperCase();
        sidebarAvatarElem.textContent = initials;
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try { await signOut(auth); } catch (error) { console.error("Error signing out:", error); }
        });
    }

    // --- Theme Switcher Initialization ---
    const GLOBAL_THEME_KEY = 'fitflowGlobalTheme';
    if (mvpThemeSwitcherElement && bodyElement) {
        initializeThemeSwitcher(FITFLOW_THEMES_CONFIG, mvpThemeSwitcherElement, document.body,
            (newThemeValue, currentThemeObject) => {
                const modalsToTheme = [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal];
                modalsToTheme.forEach(modal => {
                    if (modal) {
                        FITFLOW_THEMES_CONFIG.forEach(t => modal.classList.remove(t.value));
                        modal.classList.add(newThemeValue);
                    }
                });
                if (currentThemeObject && sidebarLogoElem && currentThemeObject.sidebarLogo) {
                    sidebarLogoElem.textContent = currentThemeObject.sidebarLogo;
                }
            },
            GLOBAL_THEME_KEY
        );
    }

    // --- Modal Event Listeners ---
    [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal].forEach(modal => {
        if (modal) {
            modal.querySelectorAll('.pt-modal__close').forEach(btn => btn.addEventListener('click', () => closeModal(modal)));
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
        }
    });
    if (confirmModalCancelBtnElem) confirmModalCancelBtnElem.addEventListener('click', () => closeModal(confirmModal));

    // --- Navigation ---
    if (navLinks) navLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); switchView(link.dataset.view); }));

    // --- Client Management Listeners ---
    if (openAddClientModalBtn) openAddClientModalBtn.addEventListener('click', () => { clientModalTitle.textContent = 'Add Client'; clientForm.reset(); clientIdInput.value = ''; openModal(addEditClientModal); });
    if (clientForm) clientForm.addEventListener('submit', handleClientFormSubmit);
    if (clientListContainer) clientListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-client-btn')) openClientModalForEdit(e.target.dataset.id);
        else if (e.target.classList.contains('delete-client-btn')) handleDeleteClient(e.target.dataset.id);
        else if (e.target.classList.contains('view-client-plan-btn')) openViewClientPlanModal(e.target.dataset.id);
    });

    // --- Exercise Management Listeners ---
    if (exerciseForm) exerciseForm.addEventListener('submit', handleExerciseFormSubmit);
    if (cancelEditExerciseBtn) cancelEditExerciseBtn.addEventListener('click', () => { exerciseForm.reset(); exerciseIdInput.value = ''; cancelEditExerciseBtn.style.display = 'none'; });
    if (exerciseListContainer) exerciseListContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-exercise-btn');
        const deleteBtn = e.target.closest('.delete-exercise-btn');
        if (editBtn) { e.stopPropagation(); openExerciseFormForEdit(editBtn.dataset.id); }
        else if (deleteBtn) { e.stopPropagation(); handleDeleteExercise(deleteBtn.dataset.id); }
    });

    // --- Workout Template Management Listeners ---
    if (openCreateTemplateModalBtn) openCreateTemplateModalBtn.addEventListener('click', () => { templateModalTitle.textContent = 'Create Template'; workoutTemplateForm.reset(); workoutTemplateIdInput.value = ''; currentTemplateExercises = []; renderSelectedExercisesForTemplate(); openModal(createEditTemplateModal); });
    if (workoutTemplateForm) workoutTemplateForm.addEventListener('submit', handleWorkoutTemplateFormSubmit);
    if (addExerciseToTemplateBtn) addExerciseToTemplateBtn.addEventListener('click', () => { const exId = templateExerciseSelect.value; if (exId) { if (!currentTemplateExercises.find(ex => ex.exerciseId === exId)) { currentTemplateExercises.push({ exerciseId: exId, sets: '', reps: '', rest: '' }); renderSelectedExercisesForTemplate(); } else { alert("Exercise is already in this template."); } } templateExerciseSelect.value = ""; });
    if (selectedExercisesForTemplateContainer) {
        selectedExercisesForTemplateContainer.addEventListener('click', (e) => { if (e.target.classList.contains('remove-exercise-from-template-btn')) { const idx = parseInt(e.target.dataset.index, 10); if (!isNaN(idx)) { currentTemplateExercises.splice(idx, 1); renderSelectedExercisesForTemplate(); } } });
        selectedExercisesForTemplateContainer.addEventListener('input', (e) => { if (e.target.classList.contains('template-exercise-detail')) { const idx = parseInt(e.target.dataset.index, 10); const prop = e.target.dataset.prop; if (currentTemplateExercises[idx] && prop) { currentTemplateExercises[idx][prop] = e.target.value; } } });
    }
    if (workoutTemplateListContainer) workoutTemplateListContainer.addEventListener('click', (e) => { if (e.target.classList.contains('edit-template-btn')) openTemplateModalForEdit(e.target.dataset.id); else if (e.target.classList.contains('delete-template-btn')) handleDeleteTemplate(e.target.dataset.id); });

    // --- Assign Workout Management Listeners ---
    if (assignWorkoutForm) assignWorkoutForm.addEventListener('submit', handleAssignWorkoutFormSubmit);
    if (assignedWorkoutsLogContainer) assignedWorkoutsLogContainer.addEventListener('click', (e) => { if (e.target.classList.contains('delete-assignment-btn')) handleDeleteAssignment(e.target.dataset.id); });

    // --- Initial View ---
    const initialViewId = window.location.hash ? window.location.hash.substring(1).toLowerCase() + 'View' : 'dashboardView';
    switchView(document.getElementById(initialViewId) ? initialViewId : 'dashboardView');
    console.log("MVP Admin App UI Initialized.");
}

// --- AUTH STATE CHECK & APP BOOTSTRAP ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentFirebaseUser = user;
        const userDocRef = doc(db, "users", user.uid);
        try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().role === "trainer") {
                currentTrainerData = userDocSnap.data();
                console.log("Admin App: Trainer authenticated:", currentTrainerData.displayName || user.displayName);

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initializeApp);
                } else {
                    initializeApp();
                }

                subscribeToClients(); // Start real-time sync for clients
                await loadAllData(); // Load all other data from Firestore

            } else {
                console.warn("Admin App: User not authorized as trainer. Redirecting.", user.uid);
                await signOut(auth);
                window.location.href = 'index.html?error=not_trainer';
            }
        } catch (error) {
            console.error("Admin App: Error fetching user role. Redirecting.", error);
            await signOut(auth);
            window.location.href = 'index.html?error=auth_check_failed';
        }
    } else {
        console.log("Admin App: No user signed in. Redirecting.");
        // Unsubscribe from any active listeners to prevent errors
        if (typeof unsubscribeClients === 'function') {
            unsubscribeClients();
        }
        window.location.href = 'index.html';
    }
});
